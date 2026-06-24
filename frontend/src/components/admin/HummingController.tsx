import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function HummingController({ sessionId, gameState }: { sessionId: string, gameState: any }) {
  const [songs, setSongs] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedSong, setSelectedSong] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSongs();
    if (gameState?.game_mode !== 'HUMMING') {
        // Set game mode to humming when mounting
        api.post(`/humming/set-session/${sessionId}`).catch(console.error);
    }
  }, [sessionId]);

  const fetchSongs = async () => {
    try {
      const res = await api.get(`/songs?session_id=${sessionId}`);
      setSongs(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartRound = async () => {
    if (!selectedTeam || !selectedSong) return alert("Chọn đội và bài hát trước!");
    setLoading(true);
    try {
      await api.post('/humming/start-round', {
        session_id: sessionId,
        team_id: selectedTeam,
        song_id: selectedSong
      });
      fetchSongs();
      setSelectedSong('');
    } catch (e: any) {
      alert(e.response?.data?.detail || "Lỗi khi bắt đầu");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = async (play: boolean) => {
    await api.post('/humming/play-pause', { play });
  };

  const handleStartTimer = async () => {
    await api.post('/humming/start-playing');
  };

  const handleConfirm = async (correct: boolean) => {
    await api.post('/humming/confirm-answer', { correct });
  };

  const handleHintConfirm = async (correct: boolean) => {
    await api.post('/humming/hint-answer', { correct });
  };

  const handleSkipHint = async () => {
    await api.post('/humming/skip-hint');
  };

  const handleSteal = async (correct: boolean) => {
    if (!selectedTeam) return alert("Vui lòng chọn đội cướp điểm!");
    await api.post('/humming/steal', { steal_team_id: selectedTeam, correct });
    setSelectedTeam('');
  };

  const handleEndRound = async () => {
    await api.post('/humming/end-round');
  };

  if (!gameState) return <div className="p-8 text-center text-gray-500">Connecting to game server...</div>;
  if (gameState.game_mode !== 'HUMMING' && gameState.state !== 'WAITING') {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center text-red-500 font-bold">
        Một trò chơi khác đang diễn ra. Vui lòng kết thúc trò chơi hiện tại trước khi chuyển sang Giai Điệu Ngân Nga.
      </div>
    );
  }

  const { state, current_team, current_song, teams, is_media_playing, is_final_live } = gameState;

  return (
    <div className="p-6 border-2 border-blue-500 rounded-xl bg-card shadow-lg">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-black text-blue-700 uppercase">Điều Khiển: Giai Điệu Ngân Nga</h2>
        <div className="flex items-center gap-4">
          <div className="text-lg font-bold bg-gray-100 px-4 py-2 rounded-lg">Trạng thái: <span className="text-blue-600">{state}</span></div>
          {state !== 'WAITING' && (
            <button 
              onClick={async () => {
                if (confirm('Bạn có chắc chắn muốn hủy lượt chơi này và quay về màn hình chờ?')) {
                  await api.post('/humming/force-cancel');
                }
              }}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg border border-red-300 transition-colors shadow-sm"
            >
              ❌ HỦY LƯỢT (RESET)
            </button>
          )}
        </div>
      </div>

      {state === 'WAITING' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Controls Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-2">1. Chọn đội thi đấu</h3>
              <select 
                className="w-full p-4 border rounded-lg text-lg font-medium shadow-sm focus:border-blue-500 outline-none"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="">-- Chọn Đội --</option>
                {teams?.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name} (Điểm: {t.score})</option>
                ))}
              </select>
            </div>
            
            <button 
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg text-xl shadow-lg disabled:opacity-50 transition-all transform hover:scale-[1.02]"
              onClick={handleStartRound}
              disabled={loading || !selectedTeam || !selectedSong}
            >
              BẮT ĐẦU LƯỢT MỚI
            </button>
            {(!selectedTeam || !selectedSong) && (
              <p className="text-center text-red-500 font-medium">Vui lòng chọn cả Đội và Bài hát để bắt đầu.</p>
            )}
          </div>

          {/* Songs Column */}
          <div className="border rounded-lg p-4 bg-gray-50 flex flex-col max-h-[500px]">
            <h3 className="text-lg font-bold mb-2 text-blue-800">2. Chọn Bài Hát</h3>
            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 gap-2">
              {songs?.map((s: any, index: number) => (
                <button
                  key={s.id}
                  disabled={s.is_used}
                  onClick={() => setSelectedSong(s.id)}
                  className={`text-left p-3 rounded border flex items-center justify-between transition-colors
                    ${s.is_used ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60' 
                      : selectedSong === s.id ? 'bg-blue-100 border-blue-500 shadow-sm' 
                      : 'bg-white hover:bg-blue-50 border-gray-200'}`}
                >
                  <div className="font-bold flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs">{index + 1}</span>
                    <span className="truncate max-w-[200px]">{s.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.is_final_live && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-bold">LIVE CUỐI</span>}
                    {s.is_used && <span className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded font-bold">Đã Dùng</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {state !== 'WAITING' && current_team && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex justify-between mb-2">
              <div className="text-xl">Đội đang thi: <strong className="text-blue-700">{current_team.name}</strong></div>
            </div>
            
            <div className="mt-4 p-4 bg-white rounded border-2 border-dashed border-gray-300">
              <div className="text-sm text-gray-500 uppercase font-bold mb-1">Bài Hát / Đáp Án (Bảo mật)</div>
              <div className="text-3xl font-black text-center text-blue-600 my-4">{current_song?.title}</div>
              {is_final_live && <div className="text-center text-lg text-purple-600 font-bold mb-2">LƯỢT LIVE CUỐI (+20 Điểm)</div>}
              {current_song?.hint && <div className="text-lg text-blue-600 mt-2"><strong>Gợi ý:</strong> {current_song.hint}</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {state === 'READY' && (
              <div className="flex gap-4">
                {!is_final_live && (
                  <button 
                    onClick={() => handlePlayPause(!is_media_playing)}
                    className={`flex-1 py-4 rounded-lg font-black text-xl text-white shadow-lg transition-transform active:scale-95 ${is_media_playing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}
                  >
                    {is_media_playing ? '⏸ TẠM DỪNG ĐĨA NHẠC' : '▶ PHÁT ĐĨA NHẠC'}
                  </button>
                )}
                <button 
                  onClick={handleStartTimer}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-black text-xl shadow-lg transition-transform active:scale-95"
                >
                  ⏱ BẮT ĐẦU TÍNH GIỜ (60s)
                </button>
              </div>
            )}

            {state === 'PLAYING' && (
              <div className="space-y-4">
                <div className="text-center py-4 bg-green-100 text-green-800 rounded-lg text-xl font-bold animate-pulse">
                  Đang tính giờ đoán bài hát...
                </div>
                {!is_final_live && (
                  <button 
                    onClick={() => handlePlayPause(!is_media_playing)}
                    className={`w-full py-4 rounded-lg font-bold text-xl text-white shadow-lg transition-transform active:scale-95 ${is_media_playing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}
                  >
                    {is_media_playing ? '⏸ TẠM DỪNG ĐĨA NHẠC' : '▶ TIẾP TỤC PHÁT ĐĨA NHẠC'}
                  </button>
                )}
                <button 
                  onClick={async () => await api.post('/humming/time-up')}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xl shadow-lg transition-transform active:scale-95"
                >
                  ⏱ HẾT GIỜ (Chốt Đáp Án Nhanh)
                </button>
              </div>
            )}

            {state === 'ANSWER_CONFIRM' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-center">Xác nhận đáp án chính:</h3>
                <div className="flex gap-4">
                  <button 
                    className="flex-1 py-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-2xl shadow-lg transition-transform active:scale-95"
                    onClick={() => handleConfirm(true)}
                  >
                    ĐÚNG ({is_final_live ? '+20' : '+10'} điểm)
                  </button>
                  <button 
                    className="flex-1 py-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-2xl shadow-lg transition-transform active:scale-95"
                    onClick={() => handleConfirm(false)}
                  >
                    SAI (Mở Gợi Ý)
                  </button>
                </div>
              </div>
            )}

            {state === 'HINT' && (
              <div className="space-y-4">
                <div className="text-center py-2 bg-yellow-100 text-yellow-800 rounded font-bold">Đã hiện gợi ý. Các đội trả lời:</div>
                <div className="flex gap-4 flex-wrap">
                  <button 
                    className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xl"
                    onClick={() => handleHintConfirm(true)}
                  >
                    ĐÚNG SAU GỢI Ý (+5 điểm)
                  </button>
                  <button 
                    className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xl"
                    onClick={() => handleHintConfirm(false)}
                  >
                    SAI (-5 điểm)
                  </button>
                  <button 
                    className="w-full py-4 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg text-xl"
                    onClick={handleSkipHint}
                  >
                    BỎ QUA (Đội khác cướp)
                  </button>
                </div>
              </div>
            )}

            {state === 'STEAL' && (
              <div className="space-y-4 bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-center py-2 bg-red-100 text-red-800 rounded font-bold uppercase text-xl animate-pulse">Vòng Cướp Điểm</div>
                
                <h3 className="font-bold">Đội cướp:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {teams?.filter((t: any) => t.id !== current_team.id).map((t: any) => (
                    <div key={t.id} className="border rounded p-2 flex flex-col gap-2 bg-white shadow-sm">
                      <div className="font-bold">{t.name}</div>
                      <div className="flex gap-2">
                        <button className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded shadow-sm" onClick={() => { setSelectedTeam(t.id); handleSteal(true); }}>ĐÚNG (+10)</button>
                        <button className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded shadow-sm" onClick={() => { setSelectedTeam(t.id); handleSteal(false); }}>SAI (-5)</button>
                      </div>
                    </div>
                  ))}
                </div>
                {teams?.length <= 1 && <div className="text-center text-gray-500">Không có đội nào khác để cướp điểm.</div>}
              </div>
            )}

            {state === 'FINISHED' && (
              <div className="text-center space-y-4">
                <div className="py-6 bg-green-100 text-green-800 rounded-lg text-2xl font-bold uppercase border-2 border-green-400">
                  KẾT THÚC LƯỢT CHƠI
                </div>
                <button className="w-full py-4 bg-gray-800 hover:bg-black text-white font-bold rounded-lg text-xl shadow-lg" onClick={handleEndRound}>
                  TIẾP TỤC
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
