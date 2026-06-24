import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function KeywordManager({ sessionId }: { sessionId: string }) {
  const [keywords, setKeywords] = useState<any[]>([]);
  const [keyword, setKeyword] = useState('');
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<any>(null);

  const fetchKeywords = async () => {
    try {
      const data = await api.get(`/sessions/${sessionId}/keywords`);
      setKeywords(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (sessionId) fetchKeywords();
  }, [sessionId]);

  const addKeyword = async () => {
    if (!keyword.trim() || !answer.trim()) return;
    try {
      await api.post(`/sessions/${sessionId}/keywords`, { keyword, answer, hint });
      setKeyword('');
      setAnswer('');
      setHint('');
      fetchKeywords();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteKeyword = async (id: string) => {
    if (!confirm('Chắc chắn xóa?')) return;
    try {
      await api.delete(`/keywords/${id}`);
      fetchKeywords();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // We can't easily use the configured fetcher for FormData so we use native fetch
      const response = await fetch(`/api/sessions/${sessionId}/keywords/import`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Import failed');
      }
      
      const result = await response.json();
      alert(`Import thành công ${result.count} từ khóa!`);
      fetchKeywords();
    } catch (e) {
      console.error(e);
      alert('Lỗi import file. Vui lòng kiểm tra lại định dạng file CSV.');
    } finally {
      setIsImporting(false);
      e.target.value = ''; // reset input
    }
  };

  const handleImageUpload = async (keywordId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`/api/keywords/${keywordId}/image`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      fetchKeywords();
    } catch (e) {
      console.error(e);
      alert('Lỗi upload ảnh. Vui lòng thử lại.');
    } finally {
      e.target.value = ''; // reset input
    }
  };

  const handleImageUploadInModal = async (keywordId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`/api/keywords/${keywordId}/image`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      const result = await response.json();
      setEditingKeyword({...editingKeyword, hint_image_url: result.url});
      fetchKeywords();
    } catch (e) {
      console.error(e);
      alert('Lỗi upload ảnh. Vui lòng thử lại.');
    } finally {
      e.target.value = ''; 
    }
  };

  const saveKeyword = async () => {
    if (!editingKeyword) return;
    try {
      await api.put(`/keywords/${editingKeyword.id}`, {
        keyword: editingKeyword.keyword,
        answer: editingKeyword.answer,
        hint: editingKeyword.hint
      });
      fetchKeywords();
      setEditingKeyword(null);
    } catch (e) {
      console.error(e);
      alert('Lỗi khi lưu.');
    }
  };

  if (!sessionId) return null;

  return (
    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Quản Lý Bộ Câu Hỏi ({keywords.length} câu)</h2>
        <div>
          <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium shadow inline-block">
            {isImporting ? 'Đang tải...' : 'Import CSV'}
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isImporting}
            />
          </label>
        </div>
      </div>
      
      <div className="flex flex-col gap-2 mb-4 bg-gray-50 p-3 rounded border">
        <div className="flex gap-2">
          <input 
            className="flex-1 p-2 border rounded" 
            placeholder="Từ khóa (Keyword)..." 
            value={keyword} 
            onChange={(e) => setKeyword(e.target.value)} 
          />
          <input 
            className="flex-1 p-2 border rounded" 
            placeholder="Đáp án (Mô tả)..." 
            value={answer} 
            onChange={(e) => setAnswer(e.target.value)} 
          />
        </div>
        <div className="flex gap-2">
          <input 
            className="flex-1 p-2 border rounded" 
            placeholder="Gợi ý (Hint)..." 
            value={hint} 
            onChange={(e) => setHint(e.target.value)} 
          />
          <button className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow" onClick={addKeyword}>
            Thêm
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2">
        {keywords.map((k, i) => (
          <div key={k.id} className={`p-3 border rounded bg-white relative flex gap-4 ${k.is_used ? 'opacity-60 grayscale' : ''}`}>
            
            {/* Thumbnail Box */}
            <label className="cursor-pointer flex-shrink-0 w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center hover:bg-gray-100 hover:border-gray-400 transition-colors overflow-hidden group relative text-gray-500 hover:text-gray-700">
              {k.hint_image_url ? (
                <>
                  <img src={k.hint_image_url} alt="Hint" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                    <span className="text-white text-2xl leading-none mb-1">+</span>
                    <span className="text-white text-[10px] text-center px-1 font-medium">Đổi ảnh</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-3xl font-light mb-1">+</span>
                  <span className="text-[10px] text-center px-1 font-medium">Thêm ảnh</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(k.id, e)} />
            </label>

            {/* Keyword Content */}
            <div className="flex-1 pr-24">
              <div className="absolute top-2 right-2 flex gap-1">
                 <button 
                  className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-medium"
                  onClick={() => setEditingKeyword(k)}
                >
                  Sửa
                </button>
                 <button 
                  className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs shadow-sm font-medium"
                  onClick={() => deleteKeyword(k.id)}
                >
                  Xóa
                </button>
              </div>
              <div className="font-bold text-lg text-purple-700">{i+1}. {k.keyword} {k.is_used && <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded ml-2 align-middle">Đã dùng</span>}</div>
              <div className="text-sm mt-1"><strong>Đáp án:</strong> {k.answer}</div>
              {k.hint && <div className="text-sm text-gray-600 mt-1 bg-blue-50 p-2 rounded border border-blue-100 inline-block mt-2"><strong>Hint:</strong> {k.hint}</div>}
            </div>

          </div>
        ))}
        {keywords.length === 0 && <div className="text-center text-gray-500 py-4">Chưa có câu hỏi nào</div>}
      </div>

      {/* Edit Modal */}
      {editingKeyword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Chỉnh sửa Câu Hỏi / Từ Khóa</h3>
              <button onClick={() => setEditingKeyword(null)} className="text-gray-500 hover:text-red-500 text-3xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Từ khóa</label>
                  <input 
                    className="w-full p-2 border rounded border-gray-300 focus:border-blue-500 outline-none" 
                    value={editingKeyword.keyword} 
                    onChange={(e) => setEditingKeyword({...editingKeyword, keyword: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Đáp án</label>
                  <input 
                    className="w-full p-2 border rounded border-gray-300 focus:border-blue-500 outline-none" 
                    value={editingKeyword.answer} 
                    onChange={(e) => setEditingKeyword({...editingKeyword, answer: e.target.value})} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Gợi ý bằng chữ (Hint)</label>
                <textarea 
                  className="w-full p-2 border rounded border-gray-300 focus:border-blue-500 outline-none resize-none" 
                  rows={2}
                  value={editingKeyword.hint || ''} 
                  onChange={(e) => setEditingKeyword({...editingKeyword, hint: e.target.value})} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Ảnh gợi ý đính kèm</label>
                {editingKeyword.hint_image_url ? (
                  <div className="border rounded-lg bg-gray-50 p-4 flex flex-col items-center gap-3">
                    <img src={editingKeyword.hint_image_url} alt="Preview" className="max-h-[300px] object-contain rounded border bg-white shadow-sm" />
                    <label className="cursor-pointer bg-blue-100 text-blue-700 px-4 py-2 rounded font-bold hover:bg-blue-200 transition-colors shadow-sm">
                      Đổi ảnh khác
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUploadInModal(editingKeyword.id, e)} />
                    </label>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-10 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition-colors">
                    <span className="text-5xl font-light leading-none mb-2">+</span>
                    <span className="mb-3">Chưa có hình ảnh gợi ý</span>
                    <label className="cursor-pointer bg-blue-600 text-white px-5 py-2 rounded font-bold hover:bg-blue-700 transition-colors shadow-sm">
                      Tải ảnh lên
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUploadInModal(editingKeyword.id, e)} />
                    </label>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
              <button onClick={() => setEditingKeyword(null)} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-bold transition-colors">Hủy</button>
              <button onClick={saveKeyword} className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-md transition-colors">Lưu Thay Đổi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
