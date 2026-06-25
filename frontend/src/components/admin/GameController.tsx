import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function GameController({ sessionId, gameState }: { sessionId: string, gameState: any }) {
  const isCurrentGameActive = gameState?.game_mode === 'TAM_SAO';
  const state = isCurrentGameActive ? gameState?.state : 'WAITING';

  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedKeywordId, setSelectedKeywordId] = useState('');
  const [keywords, setKeywords] = useState<any[]>([]);

  const selectedTeam = gameState?.teams?.find((t: any) => t.id === selectedTeamId);
  const selectedTeamName = selectedTeam ? selectedTeam.name : '';

  const filteredKeywords = keywords.filter((k: any) => {
    if (!selectedTeamName) return true;
    const hasTag = k.answer.startsWith('[') && k.answer.includes(']');
    if (!hasTag) return true;
    return k.answer.toUpperCase().includes(`[${selectedTeamName.toUpperCase()}]`);
  });

  const fetchKeywords = async () => {
    if (!sessionId) return;
    try {
      const data = await api.get(`/sessions/${sessionId}/keywords`);
      setKeywords(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, [sessionId, state]); // Refetch when state changes (e.g. round ends)

  // Auto select first team if waiting and not selected
  useEffect(() => {
    if (state === 'WAITING' && !selectedTeamId && gameState?.teams?.length > 0) {
      const firstTeamId = gameState.teams[0].id;
      setSelectedTeamId(firstTeamId);
      api.post(`/game/select-team/${firstTeamId}`).catch(console.error);
    }
  }, [state, selectedTeamId, gameState?.teams]);

  // Auto select first available keyword from the filtered list
  useEffect(() => {
    if (filteredKeywords.length > 0) {
      const selected = filteredKeywords.find(k => k.id === selectedKeywordId);
      if (!selected || selected.is_used) {
        const nextAvailable = filteredKeywords.find(k => !k.is_used);
        if (nextAvailable) {
          setSelectedKeywordId(nextAvailable.id);
        } else {
          setSelectedKeywordId(''); // None available
        }
      }
    } else {
      setSelectedKeywordId('');
    }
  }, [filteredKeywords, selectedKeywordId]);

  if (!sessionId) return null;

  const startRound = async () => {
    if (!selectedTeamId) return alert('Vui lòng chọn đội');
    if (!selectedKeywordId) return alert('Vui lòng chọn từ khóa');
    try {
      await api.post('/game/start-round', { 
        session_id: sessionId, 
        team_id: selectedTeamId,
        keyword_id: selectedKeywordId 
      });
      setSelectedKeywordId(''); // Reset for next time
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
  };

  const triggerAction = async (endpoint: string, body?: any) => {
    try {
      await api.post(`/game/${endpoint}`, body);
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
  };

  if (!gameState) {
    return <div className="p-8 text-center text-gray-500">Connecting to game server...</div>;
  }

  const current_team = isCurrentGameActive ? gameState.current_team : null;
  const current_keyword = isCurrentGameActive ? gameState.current_keyword : null;
  const current_answer = isCurrentGameActive ? gameState.current_answer : null;
  const current_hint = isCurrentGameActive ? gameState.current_hint : null;
  const round_number = isCurrentGameActive ? gameState.round_number : 0;
  const { teams } = gameState;

  return (
    <div className="p-6 border-2 border-purple-500 rounded-xl bg-card shadow-lg">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-black text-purple-700 uppercase">Điều Khiển Trò Chơi</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={async () => {
              try {
                await api.post('/game/toggle-rules');
              } catch (e) {
                console.error(e);
              }
            }}
            className={`px-4 py-2 font-bold rounded-lg border transition-all shadow-sm ${
              gameState?.show_rules
                ? 'bg-purple-600 border-purple-500 text-white animate-pulse'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300'
            }`}
          >
            📜 {gameState?.show_rules ? 'ẨN LUẬT CHƠI' : 'HIỆN LUẬT CHƠI'}
          </button>
          <div className="text-lg font-bold bg-gray-100 px-4 py-2 rounded-lg">Trạng thái: <span className="text-blue-600">{state}</span></div>
        </div>
      </div>

      {state === 'WAITING' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Controls Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-2">1. Chọn đội thi đấu</h3>
              <select 
                className="w-full p-4 border rounded-lg text-lg font-medium shadow-sm focus:border-purple-500 outline-none"
                value={selectedTeamId}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedTeamId(value);
                  api.post(`/game/select-team/${value || 'none'}`).catch(console.error);
                }}
              >
                <option value="">-- Chọn Đội --</option>
                {teams.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name} (Điểm: {t.score})</option>
                ))}
              </select>
            </div>
            
            <button 
              className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-lg text-xl shadow-lg disabled:opacity-50 transition-all transform hover:scale-[1.02]"
              onClick={startRound}
              disabled={!selectedTeamId || !selectedKeywordId}
            >
              BẮT ĐẦU LƯỢT MỚI
            </button>
            {(!selectedTeamId || !selectedKeywordId) && (
              <p className="text-center text-red-500 font-medium">Vui lòng chọn cả Đội và Từ khóa để bắt đầu.</p>
            )}
          </div>

          {/* Keywords Column */}
          <div className="border rounded-lg p-4 bg-gray-50 flex flex-col max-h-[500px]">
            <h3 className="text-lg font-bold mb-2 text-purple-800">2. Chọn Từ Khóa</h3>
            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 gap-2">
              {filteredKeywords.map((k, index) => (
                <button
                  key={k.id}
                  onClick={() => setSelectedKeywordId(k.id)}
                  className={`text-left p-3 rounded border flex items-center justify-between transition-colors
                    ${selectedKeywordId === k.id ? 'bg-purple-100 border-purple-500 shadow-sm' 
                      : k.is_used ? 'bg-gray-200 text-gray-500 opacity-60' 
                      : 'bg-white hover:bg-purple-50 border-gray-200'}`}
                >
                  <div className="font-bold flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs">{index + 1}</span>
                    {k.keyword}
                  </div>
                  <div className="flex items-center gap-2">
                    {k.hint_image_url && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold" title="Có đính kèm ảnh">🖼️ Có Ảnh</span>}
                    {k.is_used && <span className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded font-bold">Đã Dùng</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {state !== 'WAITING' && current_team && (
        <div className="space-y-6">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex justify-between mb-2">
              <div className="text-xl">Đội đang thi: <strong className="text-purple-700">{current_team.name}</strong></div>
              <div className="text-xl">Lượt: <strong>{round_number} / 6</strong></div>
            </div>
            
            <div className="mt-4 p-4 bg-white rounded border-2 border-dashed border-gray-300">
              <div className="text-sm text-gray-500 uppercase font-bold mb-1">Từ Khóa (Bảo mật)</div>
              <div className="text-4xl font-black text-center text-red-600 my-4">{current_keyword}</div>
              <div className="text-lg"><strong>Đáp án:</strong> {current_answer}</div>
              {current_hint && <div className="text-lg text-blue-600 mt-2"><strong>Gợi ý:</strong> {current_hint}</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {state === 'READY' && (
              <>
                <button className="py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xl" onClick={() => triggerAction('start-preparing')}>
                  Bắt đầu 30s Thảo Luận Nhỏ
                </button>
                <button className="py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg text-lg" onClick={() => triggerAction('start-playing')}>
                  Bỏ qua chuẩn bị - Vô thi luôn!
                </button>
              </>
            )}

            {state === 'PREPARING' && (
              <div className="text-center py-4 bg-blue-100 text-blue-800 rounded-lg text-xl font-bold animate-pulse">
                Đang chạy 30s thảo luận nhỏ...
              </div>
            )}

            {state === 'PLAYING' && (
              <>
                <div className="text-center py-4 bg-green-100 text-green-800 rounded-lg text-xl font-bold animate-pulse mb-4">
                  Đang thi đấu!
                </div>
                <button className="py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xl" onClick={() => triggerAction('time-up')}>
                  HẾT GIỜ (Chốt Đáp Án)
                </button>
              </>
            )}

            {state === 'ANSWER_CONFIRM' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-center">Xác nhận đáp án chính:</h3>
                <div className="flex gap-4">
                  <button className="flex-1 py-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-2xl" onClick={() => triggerAction('confirm-answer', { correct: true })}>
                    ĐÚNG (+10 điểm)
                  </button>
                  <button className="flex-1 py-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-2xl" onClick={() => triggerAction('confirm-answer', { correct: false })}>
                    SAI (Cho đội khác cướp)
                  </button>
                </div>
                <button
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-lg transition-transform active:scale-95 shadow-md mt-2"
                  onClick={() => triggerAction('reveal-answer')}
                >
                  🚫 KHÔNG AI ĐOÁN ĐÚNG (HIỆN ĐÁP ÁN)
                </button>
              </div>
            )}

            {state === 'HINT' && (
              <div className="space-y-4">
                <div className="text-center py-2 bg-yellow-100 text-yellow-800 rounded font-bold">Đã hiện gợi ý. Đồng đội trả lời:</div>
                <div className="flex gap-4">
                  <button className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-xl" onClick={() => triggerAction('teammate-answer', { correct: true })}>
                    ĐÚNG (+5 điểm)
                  </button>
                  <button className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xl" onClick={() => triggerAction('teammate-answer', { correct: false })}>
                    SAI (Cho đội khác cướp)
                  </button>
                </div>
                <button
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-lg transition-transform active:scale-95 shadow-md mt-2"
                  onClick={() => triggerAction('reveal-answer')}
                >
                  🚫 KHÔNG AI ĐOÁN ĐÚNG (HIỆN ĐÁP ÁN)
                </button>
              </div>
            )}

            {state === 'STEAL' && (
              <div className="space-y-4">
                <div className="text-center py-2 bg-red-100 text-red-800 rounded font-bold uppercase text-xl animate-pulse">Vòng Cướp Điểm</div>
                
                <h3 className="font-bold">Đội cướp:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {teams.filter((t: any) => t.id !== current_team.id).map((t: any) => (
                    <div key={t.id} className="border rounded p-2 flex flex-col gap-2 bg-gray-50">
                      <div className="font-bold">{t.name}</div>
                      <div className="flex gap-2">
                        <button className="flex-1 bg-green-500 text-white text-sm py-1 rounded" onClick={() => triggerAction('steal', { steal_team_id: t.id, correct: true })}>ĐÚNG (+10)</button>
                        <button className="flex-1 bg-red-500 text-white text-sm py-1 rounded" onClick={() => triggerAction('steal', { steal_team_id: t.id, correct: false })}>SAI (-5)</button>
                      </div>
                    </div>
                  ))}
                </div>
                {teams.length <= 1 && <div className="text-center text-gray-500">Không có đội nào khác để cướp điểm.</div>}
                
                <button
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-lg transition-transform active:scale-95 shadow-md mt-4"
                  onClick={() => triggerAction('reveal-answer')}
                >
                  🚫 KHÔNG AI ĐOÁN ĐÚNG (HIỆN ĐÁP ÁN)
                </button>
              </div>
            )}

            {state === 'FINISHED' && (
              <div className="text-center space-y-4">
                <div className="py-6 bg-green-100 text-green-800 rounded-lg text-2xl font-bold uppercase border-2 border-green-400">
                  KẾT THÚC LƯỢT
                </div>
                <button className="w-full py-4 bg-gray-800 hover:bg-black text-white font-bold rounded-lg text-xl" onClick={() => triggerAction('end-round')}>
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
