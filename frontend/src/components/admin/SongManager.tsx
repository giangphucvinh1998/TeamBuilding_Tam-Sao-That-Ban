import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

interface Song {
  id: string;
  session_id: string;
  title: string;
  media_url: string;
  original_filename: string;
  hint: string;
  is_used: boolean;
  is_final_live: boolean;
}

export default function SongManager({ sessionId }: { sessionId: string }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newHint, setNewHint] = useState('');
  const [isFinalLive, setIsFinalLive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [currentOriginalFilename, setCurrentOriginalFilename] = useState<string>('');

  useEffect(() => {
    fetchSongs();
  }, [sessionId]);

  const fetchSongs = async () => {
    try {
      const res = await api.get(`/songs?session_id=${sessionId}`);
      setSongs(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (song: Song) => {
    setEditingSongId(song.id);
    setNewTitle(song.title);
    setNewHint(song.hint || '');
    setIsFinalLive(song.is_final_live);
    setCurrentOriginalFilename(song.original_filename || (song.media_url ? song.media_url.split('/').pop() || '' : ''));
    setFile(null); // Clear file input since we don't require re-uploading
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Scroll to top where the form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingSongId(null);
    setNewTitle('');
    setNewHint('');
    setIsFinalLive(false);
    setCurrentOriginalFilename('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddOrUpdateSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    setLoading(true);
    try {
      let mediaUrl = undefined;
      let originalFilename = undefined;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await api.post('/songs/upload', formData);
        mediaUrl = uploadRes.url || uploadRes.data?.url;
        originalFilename = uploadRes.original_filename || uploadRes.data?.original_filename;
      }

      if (editingSongId) {
        // Update existing song
        const payload: any = {
          title: newTitle,
          hint: newHint,
          is_final_live: isFinalLive
        };
        if (mediaUrl) {
           payload.media_url = mediaUrl;
           payload.original_filename = originalFilename;
        }

        await api.put(`/songs/${editingSongId}`, payload);
        handleCancelEdit();
      } else {
        // Create new song
        await api.post(`/songs?session_id=${sessionId}`, {
          title: newTitle,
          media_url: mediaUrl || '',
          original_filename: originalFilename || '',
          hint: newHint,
          is_final_live: isFinalLive
        });
        setNewTitle('');
        setNewHint('');
        setFile(null);
        setCurrentOriginalFilename('');
        setIsFinalLive(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }

      fetchSongs();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi lưu bài hát');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài hát này?')) return;
    try {
      await api.delete(`/songs/${id}`);
      fetchSongs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetUsage = async (id: string) => {
    try {
      await api.put(`/songs/${id}`, { is_used: false });
      fetchSongs();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-bold mb-4">Quản Lý Bài Hát (Giai Điệu Ngân Nga)</h2>
      
      <form onSubmit={handleAddOrUpdateSong} className={`p-4 rounded-lg mb-6 border flex flex-col gap-4 ${editingSongId ? 'bg-blue-50 border-blue-200 shadow-md' : 'bg-gray-50'}`}>
        <div className="flex justify-between items-center">
          <h3 className={`font-semibold ${editingSongId ? 'text-blue-700 text-lg' : 'text-gray-700'}`}>
            {editingSongId ? 'Chỉnh sửa bài hát' : 'Thêm bài hát mới'}
          </h3>
          {editingSongId && (
            <button type="button" onClick={handleCancelEdit} className="text-red-500 hover:text-red-700 text-sm font-bold bg-white px-3 py-1 rounded border">
              ✕ Hủy Chỉnh Sửa
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên bài hát / Đáp án</label>
            <input 
              type="text" 
              className="w-full border rounded px-3 py-2"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              File Âm thanh / Video
            </label>
            <input 
              type="file" 
              accept="audio/*,video/*"
              className="w-full border rounded px-3 py-1.5 bg-white"
              onChange={e => setFile(e.target.files?.[0] || null)}
              ref={fileInputRef}
            />
            {editingSongId && currentOriginalFilename && (
              <div className="text-sm mt-1 text-blue-600 font-medium">
                File hiện tại: {currentOriginalFilename}
              </div>
            )}
            {editingSongId && !currentOriginalFilename && !isFinalLive && (
              <div className="text-sm mt-1 text-gray-500 italic">
                Chưa có file
              </div>
            )}
            {editingSongId && (
              <div className="text-xs text-gray-400 mt-1">
                (Để trống nếu không đổi file mới)
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Gợi ý</label>
            <input 
              type="text" 
              className="w-full border rounded px-3 py-2"
              value={newHint}
              onChange={e => setNewHint(e.target.value)}
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <input 
              type="checkbox" 
              id="is_final"
              checked={isFinalLive}
              onChange={e => setIsFinalLive(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="is_final" className="text-sm font-bold text-purple-700">Đây là Bài hát Live Cuối cùng (Không cần Media, +20 điểm)</label>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <button 
            type="submit" 
            disabled={loading || !newTitle || (!editingSongId && !file && !isFinalLive)}
            className={`${editingSongId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white font-bold py-2 px-6 rounded transition-colors disabled:opacity-50`}
          >
            {loading ? 'Đang lưu...' : (editingSongId ? '💾 Cập Nhật' : '➕ Thêm Bài Hát')}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 font-semibold">Tên bài hát</th>
              <th className="p-3 font-semibold">File Media</th>
              <th className="p-3 font-semibold">Gợi ý</th>
              <th className="p-3 font-semibold">Loại</th>
              <th className="p-3 font-semibold">Trạng thái</th>
              <th className="p-3 font-semibold w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {songs.map(song => (
              <tr key={song.id} className={`border-b ${song.is_used ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}`}>
                <td className="p-3 font-medium">{song.title}</td>
                <td className="p-3 text-sm text-gray-600 truncate max-w-[200px]" title={song.original_filename || song.media_url}>
                  {song.original_filename || (song.media_url ? song.media_url.split('/').pop() : '')}
                </td>
                <td className="p-3 text-gray-600">{song.hint}</td>
                <td className="p-3">
                  {song.is_final_live ? (
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-bold">LIVE CUỐI</span>
                  ) : (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">MEDIA</span>
                  )}
                </td>
                <td className="p-3">
                  {song.is_used ? (
                    <span className="text-red-500 text-sm font-medium">Đã dùng</span>
                  ) : (
                    <span className="text-green-500 text-sm font-medium">Chưa dùng</span>
                  )}
                </td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => handleEdit(song)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Sửa bài hát">
                    ✏️
                  </button>
                  {song.is_used && (
                    <button onClick={() => handleResetUsage(song.id)} className="p-1 text-purple-600 hover:bg-purple-50 rounded" title="Reset trạng thái">
                      🔄
                    </button>
                  )}
                  <button onClick={() => handleDelete(song.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Xóa">
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {songs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Chưa có bài hát nào. Vui lòng thêm bài hát!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
