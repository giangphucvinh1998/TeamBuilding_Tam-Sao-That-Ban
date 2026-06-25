import { useEffect, useRef } from 'react';
import Timer from '@/components/display/Timer';
import Scoreboard from '@/components/display/Scoreboard';
import { api } from '@/lib/api';

export default function HummingDisplay({ gameState, effectData }: { gameState: any, effectData: any }) {
  const { state, current_song, teams, is_media_playing, is_final_live, timer } = gameState;
  const mediaRef = useRef<HTMLVideoElement>(null);

  const handleMediaEnded = () => {
    api.post('/humming/play-pause', { play: false }).catch(console.error);
  };

  useEffect(() => {
    if (mediaRef.current) {
      if (is_media_playing) {
        mediaRef.current.play().catch(e => console.warn("Autoplay blocked:", e));
      } else {
        mediaRef.current.pause();
      }
    }
  }, [is_media_playing, current_song?.media_url]);

  const isVideo = current_song?.media_url?.match(/\.(mp4|mov|webm)$/i);

  if (state === 'WAITING') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
        <h2 className="text-6xl font-black mb-16 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] tracking-widest">
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
           <video ref={mediaRef} src={current_song.media_url} playsInline onEnded={handleMediaEnded} className="w-px h-px" />
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
              <h3 className="text-3xl font-black mt-8 text-pink-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(219,39,119,0.8)]">Lượt Live Cuối</h3>
            </div>
          ) : isVideo ? (
             <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border-[12px] border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.6)]">
               <video src={current_song.media_url} className="w-full h-full object-cover" autoPlay={is_media_playing} muted={false} ref={mediaRef} playsInline onEnded={handleMediaEnded} />
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
          
          {state === 'READY' && (
            <div>
               <h2 className="text-5xl font-black mb-6 text-blue-400">HÃY LẮNG NGHE!</h2>
               {is_media_playing ? (
                 <div className="text-3xl text-green-400 animate-pulse font-bold">Đang phát nhạc...</div>
               ) : (
                 <div className="text-3xl text-gray-400 font-bold">Chờ BTC phát nhạc</div>
               )}
            </div>
          )}

          {state === 'PLAYING' && (
            <div className="w-full">
              <h2 className="text-4xl font-black mb-8 text-yellow-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] animate-pulse">
                ĐOÁN TÊN BÀI HÁT
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

          {state === 'HINT' && (
            <div className="w-full bg-blue-900/30 border border-blue-500/50 p-10 rounded-3xl backdrop-blur shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <div className="text-2xl text-blue-400 font-bold uppercase tracking-widest mb-6">Gợi ý bài hát</div>
              <div className="text-4xl font-black text-white leading-tight">
                {current_song?.hint || '(Không có gợi ý)'}
              </div>
            </div>
          )}

          {state === 'STEAL' && (
            <div className="w-full bg-red-900/30 border border-red-500/50 p-10 rounded-3xl backdrop-blur shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <div className="text-6xl text-red-500 font-black uppercase tracking-widest mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse">
                CƯỚP ĐIỂM!
              </div>
              <div className="text-2xl text-red-400 font-bold uppercase tracking-widest mb-4">Gợi ý bài hát:</div>
              <div className="text-3xl font-black text-white leading-tight mb-8">
                {current_song?.hint}
              </div>
              <div className="text-2xl text-white">Các đội khác có quyền trả lời</div>
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
