import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

interface Song {
  id: string;
  session_id: string;
  title: string;
  media_url: string;
  original_filename: string;
  hint: string;
  singer: string;
  is_used: boolean;
  is_final_live: boolean;
  team_id?: string;
  game_version: number;
  question_number: number;
  question_type: string;
}

export default function SongManager({ sessionId }: { sessionId: string }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newHint, setNewHint] = useState('');
  const [newSinger, setNewSinger] = useState('');
  const [isFinalLive, setIsFinalLive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputCsvRef = useRef<HTMLInputElement>(null);

  const [gameVersion, setGameVersion] = useState<number>(1);
  const [questionNumber, setQuestionNumber] = useState<number>(0);
  const [questionType, setQuestionType] = useState<string>('humming');

  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [currentOriginalFilename, setCurrentOriginalFilename] = useState<string>('');

  useEffect(() => {
    fetchSongs();
    fetchTeams();
  }, [sessionId]);

  const fetchSongs = async () => {
    try {
      const res = await api.get(`/songs?session_id=${sessionId}`);
      setSongs(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await api.get(`/sessions/${sessionId}/teams`);
      setTeams(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (song: Song) => {
    setEditingSongId(song.id);
    setNewTitle(song.title);
    setNewHint(song.hint || '');
    setNewSinger(song.singer || '');
    setIsFinalLive(song.is_final_live);
    setSelectedTeamId(song.team_id || '');
    setCurrentOriginalFilename(song.original_filename || (song.media_url ? song.media_url.split('/').pop() || '' : ''));
    setFile(null); // Clear file input since we don't require re-uploading
    setGameVersion(song.game_version || 1);
    setQuestionNumber(song.question_number || 0);
    setQuestionType(song.question_type || 'humming');
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Scroll to top where the form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingSongId(null);
    setNewTitle('');
    setNewHint('');
    setNewSinger('');
    setIsFinalLive(false);
    setSelectedTeamId('');
    setCurrentOriginalFilename('');
    setFile(null);
    setGameVersion(1);
    setQuestionNumber(0);
    setQuestionType('humming');
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
          singer: newSinger,
          is_final_live: isFinalLive,
          team_id: selectedTeamId || null,
          game_version: gameVersion,
          question_number: questionNumber,
          question_type: questionType
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
          singer: newSinger,
          is_final_live: isFinalLive,
          team_id: selectedTeamId || null,
          game_version: gameVersion,
          question_number: questionNumber,
          question_type: questionType
        });
        setNewTitle('');
        setNewHint('');
        setNewSinger('');
        setFile(null);
        setCurrentOriginalFilename('');
        setIsFinalLive(false);
        setSelectedTeamId('');
        setGameVersion(1);
        setQuestionNumber(0);
        setQuestionType('humming');
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/songs/sessions/${sessionId}/import`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch {
          errorJson = null;
        }
        throw new Error(errorJson?.detail || 'Import thất bại');
      }
      
      const result = await response.json();
      alert(result.message || `Import thành công ${result.count} bài hát!`);
      fetchSongs();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Lỗi import file. Vui lòng kiểm tra lại định dạng file CSV.');
    } finally {
      setIsImporting(false);
      if (fileInputCsvRef.current) fileInputCsvRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-4 border-b pb-4">
        <h2 className="text-xl font-bold">Quản Lý Bài Hát (Giai Điệu Vượt Ngàn)</h2>
        <div className="flex flex-col items-end gap-1">
          <label className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm cursor-pointer shadow-sm transition-colors">
            {isImporting ? 'Đang import...' : 'Import CSV'}
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isImporting}
              ref={fileInputCsvRef}
            />
          </label>
          <span className="text-[10px] text-gray-500 text-right font-medium">
            Cấu trúc: STT | Tên Đội | Tên bài hát | Dòng nhạc + Năm phát hành | Ca sĩ | Type | Tên file
          </span>
        </div>
      </div>
      
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
          <div>
            <label className="block text-sm font-medium mb-1">Đội thi đấu</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={selectedTeamId}
              onChange={e => setSelectedTeamId(e.target.value)}
              required
            >
              <option value="">-- Chọn Đội --</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gợi ý (Dòng nhạc + Năm phát hành)</label>
            <input 
              type="text" 
              className="w-full border rounded px-3 py-2"
              value={newHint}
              onChange={e => setNewHint(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ca sĩ (Reveal khi dùng Ngôi sao hy vọng)</label>
            <input 
              type="text" 
              className="w-full border rounded px-3 py-2"
              value={newSinger}
              onChange={e => setNewSinger(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phiên bản trò chơi</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={gameVersion}
              onChange={e => {
                const val = Number(e.target.value);
                setGameVersion(val);
                if (val === 1) {
                  setQuestionNumber(0);
                  setQuestionType('humming');
                } else {
                  setQuestionNumber(1);
                  setQuestionType('beat');
                }
              }}
            >
              <option value="1">Version 1 (Luật cũ - 1 câu/lượt)</option>
              <option value="2">Version 2 (Luật mới - 5 câu/lượt)</option>
            </select>
          </div>
          
          {gameVersion === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Câu số (1 -{'>'} 5)</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={questionNumber}
                  onChange={e => setQuestionNumber(Number(e.target.value))}
                >
                  <option value="1">Câu 1</option>
                  <option value="2">Câu 2</option>
                  <option value="3">Câu 3</option>
                  <option value="4">Câu 4</option>
                  <option value="5">Câu 5 (Live)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Loại câu hỏi</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={questionType}
                  onChange={e => {
                    const val = e.target.value;
                    setQuestionType(val);
                    if (val === 'live') {
                      setIsFinalLive(true);
                    } else {
                      setIsFinalLive(false);
                    }
                  }}
                >
                  <option value="beat">Phát Beat 10s (Q1-Q3)</option>
                  <option value="humming">Phát Ngân Nga 15s (Q4)</option>
                  <option value="live">Ngân Nga Trực Tiếp (Q5)</option>
                </select>
              </div>
            </>
          )}

          <div className="md:col-span-2 flex items-center gap-2">
            <input 
              type="checkbox" 
              id="is_final"
              checked={isFinalLive}
              onChange={e => setIsFinalLive(e.target.checked)}
              className="w-4 h-4"
              disabled={questionType === 'live' && gameVersion === 2}
            />
            <label htmlFor="is_final" className="text-sm font-bold text-purple-700">Đây là Bài hát Live Cuối cùng (Không cần Media, +20 điểm)</label>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <button 
            type="submit" 
            disabled={loading || !newTitle || (!editingSongId && !file && !isFinalLive) || !selectedTeamId}
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
              <th className="p-3 font-semibold">Đội</th>
              <th className="p-3 font-semibold">File Media</th>
              <th className="p-3 font-semibold">Gợi ý</th>
              <th className="p-3 font-semibold">Ca sĩ</th>
              <th className="p-3 font-semibold">Loại</th>
              <th className="p-3 font-semibold">Trạng thái</th>
              <th className="p-3 font-semibold w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {songs.map(song => (
              <tr key={song.id} className={`border-b ${song.is_used ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}`}>
                <td className="p-3 font-medium">{song.title}</td>
                <td className="p-3 text-sm font-semibold text-blue-700">
                  {teams.find(t => t.id === song.team_id)?.name || '(Chưa gán)'}
                </td>
                <td className="p-3 text-sm text-gray-600 truncate max-w-[200px]" title={song.original_filename || song.media_url}>
                  {song.original_filename || (song.media_url ? song.media_url.split('/').pop() : '')}
                </td>
                <td className="p-3 text-gray-600">{song.hint}</td>
                <td className="p-3 text-gray-600">{song.singer}</td>
                <td className="p-3">
                  <div className="flex flex-col gap-1">
                    {song.game_version === 2 ? (
                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-bold self-start">
                        V2 - Câu {song.question_number} ({song.question_type ? song.question_type.toUpperCase() : 'HUMMING'})
                      </span>
                    ) : (
                      <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded font-semibold self-start">
                        V1
                      </span>
                    )}
                    {song.is_final_live ? (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded font-bold self-start">LIVE</span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded self-start">MEDIA</span>
                    )}
                  </div>
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
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  Chưa có bài hát nào. Vui lòng thêm bài hát hoặc import CSV!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
