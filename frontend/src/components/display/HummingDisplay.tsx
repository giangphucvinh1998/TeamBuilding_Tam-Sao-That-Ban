import { useEffect, useRef } from 'react';
import Timer from '@/components/display/Timer';
import Scoreboard from '@/components/display/Scoreboard';
import { api } from '@/lib/api';

export default function HummingDisplay({ gameState, effectData }: { gameState: any, effectData: any }) {
  const { state, current_song, teams, is_media_playing, is_final_live, timer } = gameState;
  const mediaRef = useRef<HTMLVideoElement>(null);
  const lastStateRef = useRef(state);

  const handleMediaEnded = () => {
    if (state === 'READY') {
      api.post('/humming/start-playing').catch(console.error);
    } else {
      api.post('/humming/play-pause', { play: false }).catch(console.error);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    if (gameState.game_version === 2 && state !== 'FINISHED') {
      const qType = current_song?.question_type;
      if (qType === 'beat' && video.currentTime >= 10) {
        video.pause();
        api.post('/humming/play-pause', { play: false }).catch(console.error);
      } else if (qType === 'humming' && video.currentTime >= 15) {
        video.pause();
        api.post('/humming/play-pause', { play: false }).catch(console.error);
      }
    }
  };

  useEffect(() => {
    if (mediaRef.current) {
      if (is_media_playing) {
        if (lastStateRef.current !== state && (state === 'PLAYING' || state === 'HOPE_STAR')) {
          mediaRef.current.currentTime = 0;
        }
        mediaRef.current.play().catch(e => console.warn("Autoplay blocked:", e));
      } else {
        mediaRef.current.pause();
      }
    }
    lastStateRef.current = state;
  }, [is_media_playing, current_song?.media_url, state]);

  const isVideo = current_song?.media_url?.match(/\.(mp4|mov|webm)$/i);

  if (state === 'WAITING') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
        <h2 className="text-6xl font-black py-2 mb-16 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] tracking-widest">
          GIAI ĐIỆU VƯỢT NGÀN
        </h2>
        {teams && teams.length > 0 && <Scoreboard teams={teams} />}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
      
      {/* Media Player (Only for audio) */}
      {!is_final_live && current_song && !isVideo && (
        <div className="absolute opacity-0 pointer-events-none">
           <video ref={mediaRef} src={current_song.media_url} playsInline loop={true} onEnded={handleMediaEnded} onTimeUpdate={handleTimeUpdate} className="w-px h-px" />
        </div>
      )}

      {/* Main Visuals */}
      <div className="flex gap-12 items-center justify-center w-full max-w-[95vw] px-8">
        
        {/* Left Side: Disc / Video Visualizer */}
        <div className={`flex justify-center ${isVideo ? 'flex-[1.5]' : 'flex-1'}`}>
          {is_final_live ? (
            <div className="text-center">
              <div className="w-80 h-80 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-[0_0_50px_rgba(219,39,119,0.5)] border-8 border-purple-300 animate-pulse">
                 <span className="text-8xl">🎤</span>
              </div>
              <h3 className="text-3xl font-black mt-8 text-pink-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(219,39,119,0.8)]">
                {gameState.game_version === 2 ? 'Lượt Ngân Nga Trực Tiếp' : 'Lượt Live Cuối'}
              </h3>
            </div>
          ) : isVideo ? (
             <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border-[12px] border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.6)]">
               <video src={current_song.media_url} className="w-full h-full object-cover" autoPlay={is_media_playing} muted={false} ref={mediaRef} playsInline loop={true} onEnded={handleMediaEnded} onTimeUpdate={handleTimeUpdate} />
             </div>
          ) : (
            <div className="relative w-[32rem] h-[32rem]">
               <div className={`absolute inset-0 rounded-full border-[16px] border-gray-900 bg-gray-800 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden transition-transform duration-1000 ${is_media_playing ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                 <div className="absolute inset-0 bg-[repeating-radial-gradient(circle_at_center,#333_0,#333_2px,#222_3px,#222_5px)]"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 border-4 border-gray-900 flex items-center justify-center">
                       <span className="text-4xl">🎵</span>
                    </div>
                 </div>
               </div>
               {/* Tonearm */}
               <div className={`absolute top-0 right-0 w-8 h-48 bg-gray-300 rounded-full origin-top-right transition-transform duration-500 ${is_media_playing ? 'rotate-12' : '-rotate-12'} shadow-lg border-2 border-gray-400 z-10`}>
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-16 bg-gray-400 rounded-lg -ml-2 -mb-2 border-b-4 border-gray-500"></div>
               </div>
            </div>
          )}
        </div>

        {/* Right Side: Game States */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          
          {current_song?.hint && (
            <div className="mb-6 bg-blue-950/40 border border-blue-500/30 px-6 py-3 rounded-2xl text-lg text-blue-300 font-bold uppercase tracking-wider backdrop-blur shadow-sm">
              Gợi ý từ đầu (Dòng nhạc + Năm): {current_song.hint}
            </div>
          )}

          {state === 'READY' && (
            <div>
               <h2 className="text-5xl font-black mb-6 text-blue-400">HÃY LẮNG NGHE!</h2>
               {is_media_playing ? (
                 <div className="text-3xl text-green-400 animate-pulse font-bold">
                   {gameState.game_version === 2 ? (
                     current_song?.question_type === 'beat' ? 'Đang phát Beat (10s)...' :
                     current_song?.question_type === 'humming' ? 'Đang phát nhạc ngân nga (15s)...' :
                     'Đang đếm giờ ngân nga trực tiếp...'
                   ) : (
                     'Đang phát nhạc...'
                   )}
                 </div>
               ) : (
                 <div className="text-3xl text-gray-400 font-bold">Chờ BTC phát nhạc</div>
               )}
            </div>
          )}

          {state === 'PLAYING' && (
            <div className="w-full">
              <h2 className="text-4xl font-black mb-8 text-yellow-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] animate-pulse">
                {gameState.game_version === 2 ? (
                  current_song?.question_type === 'beat' ? 'ĐOÁN TÊN BÀI HÁT (BEAT 10S)' :
                  current_song?.question_type === 'humming' ? 'ĐOÁN TÊN BÀI HÁT (NGÂN NGA 15S)' :
                  'ĐOÁN TÊN BÀI HÁT (LIVE)'
                ) : (
                  'ĐOÁN TÊN BÀI HÁT'
                )}
              </h2>
              <Timer timerInfo={timer} />
            </div>
          )}

          {state === 'THINKING' && (
            <div className="w-full">
              <h2 className="text-4xl font-black mb-8 text-yellow-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] animate-pulse">
                ĐỘI THI SUY NGHĨ
              </h2>
              <Timer timerInfo={timer} />
            </div>
          )}

          {state === 'ANSWER_CONFIRM' && (
            <div>
              <div className="text-6xl font-black mb-8 text-orange-400 drop-shadow-[0_0_20px_rgba(249,115,22,0.5)] animate-bounce">
                HẾT GIỜ!
              </div>
              <div className="text-3xl text-gray-300">Đang chờ BTC xác nhận...</div>
            </div>
          )}

          {state === 'HOPE_STAR' && (
            <div className="w-full bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/50 p-10 rounded-3xl backdrop-blur shadow-[0_0_45px_rgba(168,85,247,0.3)] animate-pulse">
              <div className="text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 font-black uppercase tracking-widest py-2 mb-6 drop-shadow-[0_0_20px_rgba(168,85,247,0.7)] animate-bounce">
                🌟 NGÔI SAO HY VỌNG 🌟
              </div>
              <div className="text-xl text-purple-300 font-bold uppercase tracking-widest mb-3">Gợi ý từ Lãnh đạo (Tên Ca sĩ):</div>
              <div className="text-4xl font-black text-yellow-300 leading-tight mb-8 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                {current_song?.singer || '(Chưa cập nhật)'}
              </div>
              <Timer timerInfo={timer} />
            </div>
          )}


          {state === 'STEAL' && (
            <div className="w-full bg-red-900/30 border border-red-500/50 p-10 rounded-3xl backdrop-blur shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <div className="text-6xl text-red-500 font-black uppercase tracking-widest mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse">
                CƯỚP ĐIỂM!
              </div>
              <div className="text-[22px] text-white">Các đội khác có quyền trả lời</div>
            </div>
          )}

          {state === 'FINISHED' && (
            <div className="w-full flex flex-col items-center">
              <div className="text-5xl font-black mb-8 text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]">
                KẾT QUẢ
              </div>
              <div className="text-3xl text-gray-300 mb-4">Đáp án:</div>
              <div className="text-5xl font-black text-white mb-8 bg-blue-900/50 px-8 py-4 rounded-2xl border-2 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                {current_song?.title}
              </div>
              
              {gameState.game_version === 2 && gameState.reveal_full_player && (
                <div className="text-2xl text-amber-300 font-bold bg-amber-950/40 border border-amber-500/30 px-6 py-3 rounded-2xl animate-pulse backdrop-blur mb-8 flex items-center gap-3">
                  <span>{is_media_playing ? '🔊 ĐANG PHÁT FULL BEAT...' : '⏸ ĐÃ TẠM DỪNG BEAT'}</span>
                </div>
              )}
              
              {effectData?.effect === 'correct' && (
                <div className="text-3xl text-white font-bold bg-green-600/30 px-6 py-3 rounded-2xl border border-green-500/50 mb-8 animate-bounce">
                  +{effectData?.points} Điểm cho đội {teams.find((t: any) => t.id === effectData?.team_id)?.name}
                </div>
              )}
              {effectData?.effect === 'wrong' && (
                <div className="text-3xl text-white font-bold bg-red-600/30 px-6 py-3 rounded-2xl border border-red-500/50 mb-8">
                  Trả lời sai!
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
