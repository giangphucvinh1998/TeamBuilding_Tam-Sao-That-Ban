import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface MatrixControllerProps {
  sessionId: string;
  gameState: any;
}

export default function MatrixController({ sessionId: _, gameState }: MatrixControllerProps) {
  const [teamScores, setTeamScores] = useState<Record<string, number>>({});
  const [controllerTimeLeft, setControllerTimeLeft] = useState(0);

  useEffect(() => {
    // Initialize team scores to 0 if not set, but don't overwrite if already set
    if (gameState?.teams && Object.keys(teamScores).length === 0) {
      const initial: Record<string, number> = {};
      gameState.teams.forEach((t: any) => {
        initial[t.id] = 0;
      });
      setTeamScores(initial);
    }
  }, [gameState?.teams, teamScores]);

  useEffect(() => {
    // Reset scores when returning to WAITING
    if (gameState?.state === 'WAITING') {
      setTeamScores({});
    }
  }, [gameState?.state]);

  useEffect(() => {
    if (!gameState?.timer) {
      setControllerTimeLeft(0);
      return;
    }

    const updateTime = () => {
      const elapsed = Date.now() / 1000 - gameState.timer.start_time;
      setControllerTimeLeft(Math.max(0, Math.ceil(gameState.timer.duration - elapsed)));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [gameState?.timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!gameState) return <div className="p-8 text-center text-gray-500">Connecting to game server...</div>;

  const { state, timer, teams } = gameState;

  const handleStartPhase1 = async () => {
    await api.post('/matrix/phase1', {});
  };

  const handleStartPhase2 = async () => {
    await api.post('/matrix/phase2', {});
  };

  const handleStartPhase3 = async () => {
    await api.post('/matrix/phase3', {});
  };

  const handleScoreChange = (teamId: string, points: number) => {
    setTeamScores(prev => ({
      ...prev,
      [teamId]: points
    }));
  };

  const handleSubmitScores = async () => {
    if (!confirm('Bạn có chắc chắn muốn cộng điểm cho các đội theo xếp hạng này?')) return;
    await api.post('/matrix/score', { team_scores: teamScores });
    alert('Đã cộng điểm thành công!');
  };

  return (
    <div className="p-6 border-2 border-green-500 rounded-xl bg-card shadow-lg">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-black text-green-700 uppercase">Điều Khiển: Mò Kim Bể Chữ</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={async () => {
              try {
                await api.post('/game/toggle-rules');
              } catch (e) {
                console.error(e);
              }
            }}
            className={`px-4 py-2 font-bold rounded-lg border transition-all shadow-sm ${gameState?.show_rules
                ? 'bg-purple-600 border-purple-500 text-white animate-pulse'
                : 'bg-purple-500 hover:bg-purple-600 text-white border-purple-400'
              }`}
          >
            📜 {gameState?.show_rules ? 'ẨN LUẬT CHƠI' : 'HIỆN LUẬT CHƠI'}
          </button>
          <div className="text-lg font-bold bg-gray-100 px-4 py-2 rounded-lg">Trạng thái: <span className="text-green-600">{state}</span></div>
          {state !== 'WAITING' && (
            <button
              onClick={async () => {
                if (confirm('Bạn có chắc chắn muốn hủy lượt chơi này và quay về màn hình chờ?')) {
                  await api.post('/matrix/end-game');
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
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-2">1. Chuẩn bị đội thi đấu</h3>
              <div className="w-full p-4 border rounded-lg text-lg font-medium shadow-sm bg-green-50 border-green-200 text-green-800 text-center">
                Tất cả các đội sẽ thi đấu cùng lúc.
              </div>
            </div>

            <button
              className="w-full py-5 bg-green-600 hover:bg-green-700 text-white font-black rounded-lg text-xl shadow-lg transition-all transform hover:scale-[1.02]"
              onClick={handleStartPhase1}
            >
              BẮT ĐẦU TRÒ CHƠI
            </button>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50 flex flex-col max-h-[300px]">
            <h3 className="text-lg font-bold mb-2 text-green-800">Danh sách các đội tham gia</h3>
            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 gap-2">
              {teams?.map((t: any, index: number) => (
                <div key={t.id} className="text-left p-3 rounded border bg-white flex items-center justify-between shadow-sm">
                  <div className="font-bold flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs">{index + 1}</span>
                    <span className="truncate">{t.name}</span>
                  </div>
                  <div className="font-bold text-blue-600">
                    {t.score} điểm
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {state !== 'WAITING' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Điều khiển hiển thị */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">1. Trình chiếu Đề thi</h3>

            <button
              onClick={handleStartPhase1}
              className={`w-full py-3 text-white font-bold rounded-lg shadow-sm transition-all ${state === 'PHASE_1' ? 'bg-indigo-700 ring-2 ring-offset-2 ring-indigo-500' : 'bg-indigo-500 hover:bg-indigo-600'}`}
            >
              ▶️ Giai đoạn 1: Bắt đầu điền Matrix
            </button>

            <button
              onClick={handleStartPhase2}
              className={`w-full py-3 text-white font-bold rounded-lg shadow-sm transition-all ${state === 'PHASE_2' ? 'bg-purple-700 ring-2 ring-offset-2 ring-purple-500' : 'bg-purple-500 hover:bg-purple-600'}`}
            >
              🔄 Giai đoạn 2: Ẩn/Hiện ngẫu nhiên (30s)
            </button>

            <button
              onClick={handleStartPhase3}
              className={`w-full py-3 text-white font-bold rounded-lg shadow-sm transition-all ${state === 'PHASE_3' ? 'bg-pink-700 ring-2 ring-offset-2 ring-pink-500' : 'bg-pink-500 hover:bg-pink-600'}`}
            >
              🔍 Giai đoạn 3: Phóng to/Thu nhỏ (30s)
            </button>

            {timer && (
              <div className="p-3 bg-blue-50 text-blue-800 rounded border border-blue-200 text-center font-bold text-lg animate-pulse">
                Đang chạy thời gian ({timer.type}): {formatTime(controllerTimeLeft)}
              </div>
            )}
          </div>

          {/* Chấm điểm / Tiến trình làm bài */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">2. Trạng thái & Chấm điểm</h3>

            {state === 'READY_PLAY' && (
              <div className="mt-2 border rounded-lg p-6 bg-purple-50 border-purple-200 text-center shadow-md">
                <h4 className="font-black text-purple-800 text-lg mb-2 uppercase">Thời gian làm bài</h4>
                <p className="text-sm text-gray-600 mb-4">Các đội đang chuẩn bị viết đáp án. Bấm nút bên dưới để bắt đầu tính giờ đếm ngược 7 phút.</p>
                <button
                  onClick={async () => {
                    await api.post('/matrix/answer-time', { minutes: 7 });
                  }}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-lg text-lg shadow-md transition-all active:scale-95"
                >
                  ⏱️ BẮT ĐẦU TÍNH GIỜ 7 PHÚT
                </button>
              </div>
            )}

            {state === 'PLAYING' && (
              <div className="mt-2 border rounded-lg p-6 bg-red-50 border-red-200 text-center shadow-md">
                <h4 className="font-black text-red-800 text-lg mb-2 uppercase animate-pulse">ĐANG THI ĐẤU LÀM BÀI</h4>
                <div className="text-5xl font-black text-yellow-600 font-mono mb-4 animate-pulse">
                  {formatTime(controllerTimeLeft)}
                </div>
                <button
                  onClick={async () => {
                    if (confirm('Bạn có chắc chắn muốn kết thúc thời gian làm bài sớm và chuyển sang phần Chấm điểm?')) {
                      await api.post('/matrix/end-timer');
                    }
                  }}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg text-lg shadow-md transition-all active:scale-95"
                >
                  🛑 DỪNG & CHUYỂN CHẤM ĐIỂM
                </button>
              </div>
            )}

            {state === 'SCORING' ? (
              <div className="mt-2 border rounded-lg p-4 bg-gray-50 shadow-inner">
                <h4 className="font-bold text-gray-700 mb-3">Xếp hạng & Cộng điểm</h4>
                <div className="space-y-3">
                  {teams?.map((team: any) => (
                    <div key={team.id} className="flex justify-between items-center bg-white p-2 border rounded shadow-sm">
                      <span className="font-bold text-sm w-1/3 truncate" title={team.name}>{team.name}</span>
                      <select
                        className="border rounded p-2 text-sm flex-1 font-medium bg-gray-50 focus:border-green-500 outline-none"
                        value={teamScores[team.id] || 0}
                        onChange={(e) => handleScoreChange(team.id, parseInt(e.target.value))}
                      >
                        <option value={0}>-- Chọn xếp hạng --</option>
                        <option value={50}>Hạng 1 (+50đ)</option>
                        <option value={40}>Hạng 2 (+40đ)</option>
                        <option value={30}>Hạng 3 (+30đ)</option>
                        <option value={20}>Hạng 4 (+20đ)</option>
                        <option value={10}>Hạng 5 (+10đ)</option>
                      </select>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleSubmitScores}
                  className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow-sm transition-transform active:scale-95"
                >
                  ✅ Chốt Điểm & Hoàn Thành
                </button>
              </div>
            ) : null}

            {state === 'FINISHED' ? (
              <div className="mt-2 border rounded-lg p-4 bg-gray-50 text-center shadow-inner">
                <h4 className="font-bold text-green-700 mb-3 text-xl">Đã cộng điểm hoàn tất!</h4>
                <button
                  onClick={async () => {
                    if (confirm('Bạn muốn kết thúc trò chơi này và trở về màn hình chờ?')) {
                      await api.post('/matrix/end-game');
                    }
                  }}
                  className="w-full py-4 bg-gray-800 hover:bg-black text-white font-bold rounded-lg shadow-sm transition-transform active:scale-95 text-xl"
                >
                  🔄 KẾT THÚC LƯỢT CHƠI
                </button>
              </div>
            ) : null}

          </div>
        </div>
      )}
    </div>
  );
}
