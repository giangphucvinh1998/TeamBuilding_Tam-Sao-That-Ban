import { useEffect, useRef } from 'react';
import { useWebSocket } from '@/lib/websocket';
import Timer from '@/components/display/Timer';
import Scoreboard from '@/components/display/Scoreboard';
import GameEffects from '@/components/display/GameEffects';
import HummingDisplay from '@/components/display/HummingDisplay';
import MatrixDisplay from '@/components/display/MatrixDisplay';
import game1Audio from '@/assets/game1.mp3';
import backgroundGame1Audio from '@/assets/background-game1.mp3';
import backgroundRuleAudio from '@/assets/background-rule-game.mp3';

const TEAM_COLORS: Record<string, string> = {
  'XANH BIỂN': 'text-blue-400',
  'XANH NGỌC': 'text-cyan-400',
  'XANH LÁ': 'text-green-400',
  'TIM TÍM': 'text-purple-400',
  'ĐO ĐỎ': 'text-red-400'
};

const getTeamColorClass = (name: string) => {
  return TEAM_COLORS[name.trim().toUpperCase()] || 'text-white';
};

export default function DisplayPage() {
  const { gameState, isConnected, lastEffect } = useWebSocket('display');
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const backgroundGame1Ref = useRef<HTMLAudioElement>(null);
  const backgroundRuleRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (gameState?.show_intro) {
      if (videoRef1.current) videoRef1.current.play().catch(e => console.warn("Autoplay blocked:", e));
      if (videoRef2.current) videoRef2.current.play().catch(e => console.warn("Autoplay blocked:", e));
    }
  }, [gameState?.show_intro]);

  useEffect(() => {
    const isMatrixActivePhase =
      gameState?.game_mode === 'MATRIX' &&
      ['PHASE_1', 'PHASE_2', 'PHASE_3'].includes(gameState?.state);

    const isMatrixPlaying =
      gameState?.game_mode === 'MATRIX' &&
      gameState?.state === 'PLAYING';

    if (isMatrixActivePhase) {
      audioRef.current?.play().catch(e => {
        console.warn("Autoplay audio blocked, waiting for interaction:", e);
      });
    } else {
      audioRef.current?.pause();
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }

    if (isMatrixPlaying) {
      backgroundGame1Ref.current?.play().catch(e => {
        console.warn("Autoplay playing audio blocked, waiting for interaction:", e);
      });
    } else {
      backgroundGame1Ref.current?.pause();
      if (backgroundGame1Ref.current) {
        backgroundGame1Ref.current.currentTime = 0;
      }
    }
  }, [gameState?.game_mode, gameState?.state]);

  useEffect(() => {
    if (gameState?.show_rules) {
      backgroundRuleRef.current?.play().catch(e => {
        console.warn("Autoplay rules audio blocked, waiting for interaction:", e);
      });
    } else {
      backgroundRuleRef.current?.pause();
      if (backgroundRuleRef.current) {
        backgroundRuleRef.current.currentTime = 0;
      }
    }
  }, [gameState?.show_rules]);

  const handleInteract = () => {
    if (gameState?.show_intro) {
      if (videoRef1.current) videoRef1.current.play();
      if (videoRef2.current) videoRef2.current.play();
    }

    const isMatrixActivePhase =
      gameState?.game_mode === 'MATRIX' &&
      ['PHASE_1', 'PHASE_2', 'PHASE_3'].includes(gameState?.state);

    const isMatrixPlaying =
      gameState?.game_mode === 'MATRIX' &&
      gameState?.state === 'PLAYING';

    if (isMatrixActivePhase) {
      audioRef.current?.play().catch(e => console.warn("Interactive play failed:", e));
    }

    if (isMatrixPlaying) {
      backgroundGame1Ref.current?.play().catch(e => console.warn("Interactive playing play failed:", e));
    }

    if (gameState?.show_rules) {
      backgroundRuleRef.current?.play().catch(e => console.warn("Interactive rules play failed:", e));
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-8">
        <div className="text-3xl animate-pulse text-purple-400">Đang kết nối hệ thống...</div>
      </div>
    );
  }

  if (!gameState || gameState.state === 'WAITING' || !gameState.session_id) {
    const selTeam = gameState?.selected_team_id && gameState?.teams
      ? gameState.teams.find((t: any) => t.id === gameState.selected_team_id)
      : null;
    const nextRound = selTeam
      ? (gameState.game_mode === 'HUMMING' ? (selTeam.completed_songs || 0) + 1 : (selTeam.completed_rounds || 0) + 1)
      : 1;

    return (
      <div onClick={handleInteract} className="min-h-screen bg-[#0a0a0f] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a103c] via-[#0a0a0f] to-[#000000] text-white flex flex-col items-center justify-center p-8 cursor-pointer relative">
        {gameState?.show_intro && (
          <video ref={videoRef1} src="/intro.MOV" autoPlay loop playsInline className="fixed inset-0 w-full h-full object-cover z-50 bg-black pointer-events-none" />
        )}
        <h1 className="text-8xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 drop-shadow-[0_0_25px_rgba(219,39,119,0.5)] mb-16 tracking-normal py-6 leading-relaxed z-10 relative uppercase">
          {gameState?.game_mode === 'HUMMING' ? 'Giai Điệu Vượt Ngàn' : gameState?.game_mode === 'MATRIX' ? 'Mò Kim Bể Chữ' : 'Mật Mã Lặng Thinh'}
        </h1>
        {selTeam && (gameState?.game_mode === 'TAM_SAO' || gameState?.game_mode === 'HUMMING') && (
          <div className="text-4xl font-extrabold text-purple-300 bg-gray-900/60 px-10 py-5 rounded-3xl border border-gray-700/50 shadow-2xl animate-pulse z-10 relative">
            Chuẩn bị: Đội <span className={getTeamColorClass(selTeam.name)}>{selTeam.name}</span>
            <span className="mx-4 text-gray-500">|</span>
            <span>Câu: <span className="text-white">{gameState.game_mode === 'TAM_SAO' ? `${nextRound} / 6` : nextRound}</span></span>
          </div>
        )}
        <audio ref={audioRef} src={game1Audio} loop />
        <audio ref={backgroundGame1Ref} src={backgroundGame1Audio} loop />
        <audio ref={backgroundRuleRef} src={backgroundRuleAudio} loop />
        <RulesOverlay show={gameState?.show_rules} gameMode={gameState?.game_mode} />
        <ScoreboardOverlay show={gameState?.show_scoreboard} teams={gameState?.teams} />
      </div>
    );
  }

  const { state, current_team, timer, teams, hint_visible, current_hint, current_hint_image_url, round_number } = gameState;

  return (
    <div onClick={handleInteract} className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center p-8 overflow-hidden relative cursor-pointer">
      {gameState?.show_intro && (
        <video ref={videoRef2} src="/intro.MOV" autoPlay loop playsInline className="fixed inset-0 w-full h-full object-cover z-50 bg-black pointer-events-none" />
      )}
      <GameEffects effectData={lastEffect} />
      <audio ref={audioRef} src={game1Audio} loop />
      <audio ref={backgroundGame1Ref} src={backgroundGame1Audio} loop />
      <audio ref={backgroundRuleRef} src={backgroundRuleAudio} loop />

      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <header className="w-full flex justify-between items-center mb-12 z-10">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 tracking-widest py-2 leading-relaxed uppercase">
          {gameState?.game_mode === 'HUMMING' ? 'Giai Điệu Vượt Ngàn' : gameState?.game_mode === 'MATRIX' ? 'Mò Kim Bể Chữ' : 'Mật Mã Lặng Thinh'}
        </h1>
        {current_team && (
          <div className="text-2xl font-bold bg-gray-900/80 px-8 py-3 rounded-full border border-gray-700 shadow-lg text-purple-300">
            Đội: <span className={getTeamColorClass(current_team.name)}>{current_team.name}</span>
            {(gameState?.game_mode === 'TAM_SAO' || gameState?.game_mode === 'HUMMING') && (
              <>
                <span className="mx-4 text-gray-500">|</span>
                <span>Câu: <span className="text-white">{round_number}{gameState?.game_mode === 'TAM_SAO' ? ' / 6' : ''}</span></span>
              </>
            )}
          </div>
        )}
      </header>

      {gameState?.game_mode === 'HUMMING' ? (
        <HummingDisplay gameState={gameState} effectData={lastEffect} />
      ) : gameState?.game_mode === 'MATRIX' ? (
        <MatrixDisplay gameState={gameState} />
      ) : (
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
              <div className="text-center w-full">
                <div className="text-6xl font-black mb-4 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] animate-pulse">
                  ĐƯA RA ĐÁP ÁN!
                </div>
                <Timer timerInfo={timer} />
                <div className="text-3xl text-gray-300 mt-4">Thành viên cuối cùng có 10 giây để trả lời!</div>
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
                {lastEffect?.effect === 'wrong_deduct' && (
                  <div className="text-4xl text-white font-bold bg-red-600/30 px-8 py-4 rounded-2xl border border-red-500/50 mb-8 animate-bounce">
                    -{lastEffect?.points} Điểm cho đội {teams.find((t: any) => t.id === lastEffect?.team_id)?.name}
                  </div>
                )}
                <Scoreboard teams={teams} currentTeamId={current_team?.id} />
              </div>
            )}

          </div>
        </main>
      )}
      <RulesOverlay show={gameState?.show_rules} gameMode={gameState?.game_mode} />
      <ScoreboardOverlay show={gameState?.show_scoreboard} teams={gameState?.teams} />
    </div>
  );
}

interface RulesOverlayProps {
  show: boolean;
  gameMode: string;
}

function RulesOverlay({ show, gameMode }: RulesOverlayProps) {
  if (!show) return null;

  const getRulesContent = () => {
    switch (gameMode) {
      case 'MATRIX':
        return (
          <>
            <h3 className="text-3xl font-black text-green-400 mb-6 flex items-center justify-center gap-3">
              <span>🎮 GAME 1: MÒ KIM BỂ CHỮ</span>
            </h3>
            <ul className="space-y-5 text-left text-lg md:text-xl text-gray-100 max-w-2xl mx-auto list-none pl-0">
              <li className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 select-none">📵</span>
                <div>
                  <strong className="text-green-300">CẤT ĐIỆN THOẠI:</strong> Toàn bộ các đội úp điện thoại xuống bàn. Tuyệt đối không chụp ảnh đề thi!
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 select-none">⏱️</span>
                <div>
                  <strong className="text-green-300">SIÊU TỐC GHI NHỚ:</strong> Đề thi (ma trận từ khóa) chỉ hiển thị trên màn hình lớn trong <strong className="text-yellow-400">1 phút 30 giây</strong>. Hãy tập trung cao độ!
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 select-none">🏃‍♂️</span>
                <div>
                  <strong className="text-green-300">TIẾP SỨC ĐỒNG ĐỘI:</strong> Điền các từ khóa tìm được vào ma trận 10x10 trống trên <strong className="text-yellow-400">giấy A0</strong> tại sân khấu. Mỗi đội cử <strong className="text-yellow-400">3 đại diện</strong> thi đấu và có thể thay thế người linh hoạt với các thành viên còn lại, miễn là luôn duy trì <strong className="text-yellow-400">đúng 3 thành viên</strong> trên sân khấu.
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 select-none">🏆</span>
                <div className="w-full">
                  <strong className="text-green-300">CÁCH TÍNH ĐIỂM:</strong> Điểm số xếp hạng dựa trên số lượng từ khóa tìm được chính xác trên ma trận trống:
                  <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs md:text-sm font-bold">
                    <div className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 py-2 px-1 rounded-xl shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                      🥇 Nhất: 50đ
                    </div>
                    <div className="bg-slate-300/20 border border-slate-300/40 text-slate-200 py-2 px-1 rounded-xl shadow-[0_0_10px_rgba(203,213,225,0.1)]">
                      🥈 Nhì: 40đ
                    </div>
                    <div className="bg-amber-600/20 border border-amber-600/40 text-amber-300 py-2 px-1 rounded-xl shadow-[0_0_10px_rgba(217,119,6,0.1)]">
                      🥉 Ba: 30đ
                    </div>
                    <div className="bg-blue-500/20 border border-blue-500/40 text-blue-300 py-2 px-1 rounded-xl">
                      🏅 Tư: 20đ
                    </div>
                    <div className="bg-gray-600/20 border border-gray-500/40 text-gray-400 py-2 px-1 rounded-xl">
                      🎗️ Năm: 10đ
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </>
        );
      case 'HUMMING':
        return (
          <>
            <h3 className="text-3xl font-black text-blue-400 mb-6 flex items-center justify-center gap-3">
              <span>🎵 GAME 2: GIAI ĐIỆU VƯỢT NGÀN</span>
            </h3>
            <ul className="space-y-4 text-left text-lg md:text-xl text-gray-100 max-w-2xl mx-auto list-none pl-0">
              <li className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 select-none">🎥</span>
                <div>
                  <strong className="text-blue-300">GỢI Ý TỪ ĐẦU:</strong> Đội thi được biết gợi ý **Dòng nhạc + Năm phát hành** ngay từ đầu vòng nghe nhạc.
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 select-none">⏱️</span>
                <div>
                  <strong className="text-blue-300">THỜI GIAN THI:</strong> Có **30 giây** nghe nhạc ngân nga và **20 giây** suy nghĩ để đưa ra tên bài hát.
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 select-none">🎯</span>
                <div>
                  <strong className="text-blue-300">CÁCH TÍNH ĐIỂM LƯỢT GỐC:</strong> Trả lời đúng nhận <strong className="text-green-400">+10 điểm</strong> (Nhạc Live nhận <strong className="text-green-400">+20 điểm</strong>).
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 select-none">🌟</span>
                <div>
                  <strong className="text-blue-300">NGÔI SAO HY VỌNG (KHI SAI):</strong> Lãnh đạo có quyền cứu đội bằng cách kích hoạt Ngôi sao hy vọng (20s suy nghĩ):
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-base text-gray-300">
                    <li>Được nghe lại nhạc ngân + tiết lộ gợi ý **Tên ca sĩ**.</li>
                    <li>Đoán đúng: <strong className="text-green-400">Nhân đôi điểm (+20đ / Live: +40đ)</strong>, không bị trừ điểm gốc.</li>
                    <li>Đoán sai: <strong className="text-gray-400">0 điểm</strong> (không bị trừ điểm gốc lẫn điểm Ngôi sao), không cho đội khác cướp.</li>
                  </ul>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 select-none">⚔️</span>
                <div>
                  <strong className="text-blue-300">KHÔNG DÙNG NGÔI SAO HY VỌNG:</strong> 
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-base text-gray-300">
                    <li>Đội thi bị phạt <strong className="text-red-400">-5 điểm</strong>.</li>
                    <li>Quyền cướp điểm mở ra cho các đội khác (Đúng <strong className="text-green-400">+10 điểm</strong>, sai bị trừ <strong className="text-red-400">-5 điểm</strong>).</li>
                  </ul>
                </div>
              </li>
            </ul>
          </>
        );
      case 'TAM_SAO':
      default:
        return (
          <>
            <h3 className="text-3xl font-black text-purple-400 mb-6 flex items-center justify-center gap-3">
              <span>🤫 GAME 3: MẬT MÃ LẶNG THINH</span>
            </h3>
            <ul className="space-y-5 text-left text-lg md:text-xl text-gray-100 max-w-2xl mx-auto list-none pl-0">
              <li className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 select-none">👥</span>
                <div>
                  <strong className="text-purple-300">ĐỘI HÌNH THI ĐẤU:</strong> Cử 4 thành viên lên sân khấu. MC đưa ra gợi ý trước (số lượng từ, chủ đề) trước khi bắt đầu.
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 select-none">⏱️</span>
                <div>
                  <strong className="text-purple-300">THẢO LUẬN NHỎ (30S):</strong> 3 thành viên nhận mật mã và có 30 giây để thảo luận nhỏ.
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 select-none">🚫</span>
                <div>
                  <strong className="text-purple-300">DIỄN TẢ ĐỒNG ĐỘI (1 PHÚT):</strong> Có 1 phút để 3 thành viên diễn tả bằng cử chỉ/body language cho thành viên cuối cùng (không nói, không khẩu hình, không viết chữ).
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 select-none">🗣️</span>
                <div>
                  <strong className="text-purple-300">ĐƯA RA ĐÁP ÁN (10S):</strong> Thành viên đoán có đúng 10 giây để trả lời. Người đoán sẽ xoay vòng qua 4 câu hỏi - tương ứng 4 thành viên.
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 select-none">🏆</span>
                <div>
                  <strong className="text-purple-300">CÁCH TÍNH ĐIỂM & CƯỚP ĐIỂM:</strong> Trả lời đúng nhận <strong className="text-green-400">10 điểm</strong>. Nếu sai, các đội khác có quyền cướp điểm: đúng được <strong className="text-green-400">+10 điểm</strong>, sai bị trừ <strong className="text-red-400">-5 điểm</strong>.
                </div>
              </li>
            </ul>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#06060a]/95 backdrop-blur-xl flex items-center justify-center p-6 transition-all duration-300">
      <div className="bg-gradient-to-br from-gray-950 via-[#120826] to-gray-950 border-2 border-purple-500/40 p-8 md:p-12 rounded-3xl max-w-4xl w-full shadow-[0_0_80px_rgba(168,85,247,0.35)] relative overflow-hidden text-center">
        {/* Ambient neon decorative circles */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-pink-600/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-2">TEAM BUILDING 2026</div>
        <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 mb-8 uppercase tracking-tight">
          LUẬT CHƠI CHI TIẾT
        </h2>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-inner mb-6 max-h-[60vh] overflow-y-auto">
          {getRulesContent()}
        </div>

        <div className="text-xs text-gray-500 italic">
          * Vui lòng chú ý lắng nghe phổ biến của MC trước khi bắt đầu *
        </div>
      </div>
    </div>
  );
}

interface ScoreboardOverlayProps {
  show: boolean;
  teams: any[];
}

function ScoreboardOverlay({ show, teams }: ScoreboardOverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#06060a]/95 backdrop-blur-xl flex items-center justify-center p-6 transition-all duration-300">
      <div className="bg-gradient-to-br from-gray-950 via-[#120826] to-gray-950 border-2 border-purple-500/40 p-8 md:p-12 rounded-3xl max-w-4xl w-full shadow-[0_0_80px_rgba(168,85,247,0.35)] relative overflow-hidden flex flex-col items-center">
        {/* Ambient neon decorative circles */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-pink-600/20 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-2">GALA TEAM BUILDING 2026</div>
        <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 mb-8 uppercase tracking-tight">
          BẢNG ĐIỂM TỔNG SẮP
        </h2>
        
        <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-inner overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {[...(teams || [])].sort((a, b) => b.score - a.score).map((team, index) => {
              const colors: Record<number, string> = {
                0: 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]',
                1: 'text-gray-300',
                2: 'text-amber-700'
              };
              const rankColor = colors[index] || 'text-gray-600';
              return (
                <div 
                  key={team.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 shadow-sm transition-all hover:bg-white/10"
                >
                  <div className="flex items-center gap-6">
                    <div className={`text-3xl font-black ${rankColor}`}>
                      #{index + 1}
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {team.name}
                    </div>
                  </div>
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
                    {team.score} <span className="text-xs text-gray-500 font-normal">điểm</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="text-xs text-gray-500 italic mt-6">
          * Điểm số được cập nhật tự động sau mỗi lượt chơi *
        </div>
      </div>
    </div>
  );
}
