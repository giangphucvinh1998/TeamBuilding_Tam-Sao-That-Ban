import { useWebSocket } from '@/lib/websocket';
import Timer from '@/components/display/Timer';
import Scoreboard from '@/components/display/Scoreboard';
import GameEffects from '@/components/display/GameEffects';

export default function DisplayPage() {
  const { gameState, isConnected, lastEffect } = useWebSocket('display');

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-8">
        <div className="text-3xl animate-pulse text-purple-400">Đang kết nối hệ thống...</div>
      </div>
    );
  }

  if (!gameState || gameState.state === 'WAITING' || !gameState.session_id) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a103c] via-[#0a0a0f] to-[#000000] text-white flex flex-col items-center justify-center p-8">
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 drop-shadow-[0_0_25px_rgba(219,39,119,0.5)] mb-16 tracking-tighter">
          ĐOÁN TỪ KHÓA ĐỒNG ĐỘI
        </h1>
        {gameState && gameState.teams && gameState.teams.length > 0 && (
          <Scoreboard teams={gameState.teams} />
        )}
      </div>
    );
  }

  const { state, current_team, timer, teams, hint_visible, current_hint, current_hint_image_url, round_number } = gameState;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center p-8 overflow-hidden relative">
      <GameEffects effectData={lastEffect} />
      
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <header className="w-full flex justify-between items-center mb-12 z-10">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 tracking-widest uppercase">
          Tam Sao Thất Bản
        </h1>
        {current_team && (
          <div className="text-2xl font-bold bg-gray-900/80 px-8 py-3 rounded-full border border-gray-700 shadow-lg text-purple-300">
            Đội: <span className="text-white">{current_team.name}</span> <span className="mx-4 text-gray-500">|</span> Câu: <span className="text-white">{round_number} / 6</span>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center w-full z-10 max-w-6xl">
        
        {/* Main Display Area based on State */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          
          {(state === 'READY' || state === 'PREPARING') && (
            <div className="text-center">
              <h2 className="text-6xl font-black mb-8 text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]">
                CHUẨN BỊ
              </h2>
              <Timer timerInfo={timer} />
            </div>
          )}

          {state === 'PLAYING' && (
            <div className="text-center w-full">
              <Timer timerInfo={timer} />
            </div>
          )}

          {state === 'ANSWER_CONFIRM' && (
            <div className="text-center">
              <div className="text-6xl font-black mb-8 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] animate-pulse">
                HẾT GIỜ!
              </div>
              <div className="text-3xl text-gray-300">Đang chờ BTC xác nhận kết quả...</div>
            </div>
          )}

          {state === 'HINT' && (
            <div className="text-center w-full max-w-4xl bg-blue-900/30 border border-blue-500/50 p-12 rounded-3xl backdrop-blur shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <div className="text-2xl text-blue-400 font-bold uppercase tracking-widest mb-6">Đồng đội hỗ trợ</div>
              {hint_visible && current_hint_image_url && (
                <div className="flex justify-center mb-8">
                   <img src={current_hint_image_url} alt="Hint" className="max-w-full h-[400px] object-contain rounded-xl border-4 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.4)]" />
                </div>
              )}
              <div className="text-5xl font-black text-white leading-tight">
                {hint_visible ? current_hint : 'Gợi ý đang được mở...'}
              </div>
            </div>
          )}

          {state === 'STEAL' && (
            <div className="text-center w-full max-w-4xl bg-red-900/30 border border-red-500/50 p-12 rounded-3xl backdrop-blur shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <div className="text-6xl text-red-500 font-black uppercase tracking-widest mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse">
                CƯỚP ĐIỂM!
              </div>
              <div className="text-2xl text-red-400 font-bold uppercase tracking-widest mb-4">Gợi ý từ khóa:</div>
              {hint_visible && current_hint_image_url && (
                <div className="flex justify-center mb-8">
                   <img src={current_hint_image_url} alt="Hint" className="max-w-full h-[300px] object-contain rounded-xl border-4 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)]" />
                </div>
              )}
              <div className="text-5xl font-black text-white leading-tight mb-8">
                {hint_visible ? current_hint : 'Gợi ý đang ẩn'}
              </div>
              <div className="text-3xl text-white">Các đội khác có quyền trả lời</div>
            </div>
          )}

          {state === 'FINISHED' && (
            <div className="text-center w-full flex flex-col items-center">
              <div className="text-6xl font-black mb-8 text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]">
                KẾT THÚC LƯỢT CHƠI
              </div>
              {lastEffect?.effect === 'correct' && (
                <div className="text-4xl text-white font-bold bg-green-600/30 px-8 py-4 rounded-2xl border border-green-500/50 mb-8">
                  +{lastEffect?.points} Điểm cho đội {teams.find((t: any) => t.id === lastEffect?.team_id)?.name}
                </div>
              )}
              <Scoreboard teams={teams} currentTeamId={current_team?.id} />
            </div>
          )}

        </div>



      </main>
    </div>
  );
}
