import { useEffect, useState, useRef } from 'react';
import Scoreboard from './Scoreboard';

interface MatrixDisplayProps {
  gameState: any;
}

export default function MatrixDisplay({ gameState }: MatrixDisplayProps) {
  const { state, matrix, timer, teams } = gameState;
  const [visibleCells, setVisibleCells] = useState<boolean[][]>([]);
  const [cellStyles, setCellStyles] = useState<{ opacity?: number, scale?: number, bgColor?: string }[][]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const reqRef = useRef<number>(0);

  useEffect(() => {
    if (!timer || !['PHASE_1', 'PHASE_2', 'PHASE_3', 'PLAYING'].includes(state)) {
      setTimeLeft(0);
      return;
    }

    const animate = () => {
      const now = Date.now();
      const elapsed = now / 1000 - timer.start_time;
      const rem = Math.max(0, timer.duration - elapsed);

      let totalRem = 0;
      if (state === 'PHASE_1') {
        totalRem = rem + 80;
      } else if (state === 'PHASE_2') {
        totalRem = rem + 40;
      } else if (state === 'PHASE_3') {
        totalRem = rem;
      } else if (state === 'PLAYING') {
        totalRem = rem;
      }

      setTimeLeft(Math.ceil(totalRem));

      if (rem > 0) {
        reqRef.current = requestAnimationFrame(animate);
      }
    };

    reqRef.current = requestAnimationFrame(animate);

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [timer, state]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Initialize arrays
  useEffect(() => {
    if (matrix && matrix.length > 0) {
      const rows = matrix.length;
      const cols = matrix[0].length;

      if (visibleCells.length !== rows) {
        setVisibleCells(Array(rows).fill(null).map(() => Array(cols).fill(false)));
      }
      if (cellStyles.length !== rows) {
        setCellStyles(Array(rows).fill(null).map(() => Array(cols).fill({})));
      }
    }
  }, [matrix, state]);

  // Phase 1: Filling animation
  useEffect(() => {
    if (state === 'PHASE_1' && matrix && matrix.length === 10) {
      // Reset visibility
      const newVis = Array(10).fill(null).map(() => Array(10).fill(false));
      setVisibleCells(newVis);

      let step = 0;
      const maxSteps = 49; // 50 steps to fill 100 cells (2 at a time)

      const interval = setInterval(() => {
        setVisibleCells(prev => {
          const next = [...prev].map(row => [...row]);
          for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
              if (!next[r][c]) {
                const idx1 = r * 10 + c;
                const idx2 = 99 - idx1; // (9 - r) * 10 + (9 - c)
                if (idx1 <= step || idx2 <= step) {
                  next[r][c] = true;
                }
              }
            }
          }
          return next;
        });

        step++;
        if (step > maxSteps) clearInterval(interval);
      }, 200); // 50 steps * 200ms = 10000ms (10s)

      return () => clearInterval(interval);
    } else if (state !== 'PHASE_1' && state !== 'WAITING') {
      // Make all visible for other phases
      if (matrix && matrix.length > 0) {
        setVisibleCells(Array(matrix.length).fill(null).map(() => Array(matrix[0].length).fill(true)));
      }
    }
  }, [state, matrix?.length]);

  // Phase 2: Hide/Show animation
  useEffect(() => {
    let interval: any;
    if (state === 'PHASE_2' && matrix && matrix.length === 10) {
      interval = setInterval(() => {
        setCellStyles(() => {
          const next = Array(10).fill(null).map(() => Array(10).fill({}));
          for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
              next[r][c] = { opacity: Math.random() > 0.4 ? 1 : 0.1 };
            }
          }
          return next;
        });
      }, 500); // Change every 500ms
    } else {
      // Clear styles if not phase 2
      if (state !== 'PHASE_3') {
        if (matrix) {
          setCellStyles(Array(matrix.length).fill(null).map(() => Array(matrix[0].length).fill({})));
        }
      }
    }
    return () => clearInterval(interval);
  }, [state, matrix?.length]);

  // Phase 3: Zoom animation
  useEffect(() => {
    let interval: any;
    if (state === 'PHASE_3' && matrix && matrix.length === 10) {
      interval = setInterval(() => {
        setCellStyles(() => {
          const next = Array(10).fill(null).map(() => Array(10).fill({}));
          for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
              // Scale range: 0.3 to 1.6 (randomly shrinking and enlarging)
              next[r][c] = {
                scale: 0.8 + Math.random() * 0.4,
                bgColor: `hsl(${Math.floor(Math.random() * 360)}, 80%, 40%)`
              };
            }
          }
          return next;
        });
      }, 600);
    } else {
      if (state !== 'PHASE_2') {
        if (matrix) {
          setCellStyles(Array(matrix.length).fill(null).map(() => Array(matrix[0].length).fill({})));
        }
      }
    }
    return () => clearInterval(interval);
  }, [state, matrix?.length]);


  if (!matrix || matrix.length === 0) {
    return <div className="text-white text-2xl">Đang tải ma trận...</div>;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[92vw] z-10 relative pt-16">

      {timeLeft > 0 && ['PHASE_1', 'PHASE_2', 'PHASE_3'].includes(state) && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
          <div className="text-sm font-bold uppercase tracking-widest text-purple-400 mb-1">Thời gian còn lại</div>
          <div className="bg-black/80 px-8 py-2.5 rounded-full border border-purple-500/50 font-mono text-4xl font-black text-yellow-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] backdrop-blur-sm min-w-[150px] text-center">
            {formatTime(timeLeft)}
          </div>
        </div>
      )}

      {(state === 'PHASE_1' || state === 'PHASE_2' || state === 'PHASE_3' || state === 'FINISHED') && (
        <div className="bg-white/10 p-3 rounded-xl backdrop-blur shadow-[0_0_50px_rgba(147,51,234,0.3)] w-full overflow-x-auto">
          <div className="grid grid-cols-11 gap-1.5 min-w-[750px]">
            {/* Top-left corner coordinates indicator */}
            <div className="w-full h-[6.5vh] border border-transparent"></div>

            
            {/* Column header labels (1 to 10) */}
            {Array.from({ length: 10 }).map((_, cIdx) => (
              <div
                key={`col-hdr-${cIdx}`}
                className="w-full h-[6.5vh] flex items-center justify-center font-black text-purple-300 text-xl bg-purple-950/40 border-2 border-purple-500/25 rounded-lg shadow-sm"
              >
                {cIdx + 1}
              </div>
            ))}

            {/* Matrix rows with Row headers */}
            {matrix.map((row: string[], rIdx: number) => (
              <div key={`row-group-${rIdx}`} className="contents">
                {/* Row header label (1 to 10) */}
                <div
                  className="w-full h-[6.5vh] flex items-center justify-center font-black text-purple-300 text-xl bg-purple-950/40 border-2 border-purple-500/25 rounded-lg shadow-sm"
                >
                  {rIdx + 1}
                </div>

                {/* Actual grid cells */}
                {row.map((cell: string, cIdx: number) => {
                  const isVisible = visibleCells[rIdx]?.[cIdx] ?? true;
                  const style = cellStyles[rIdx]?.[cIdx] ?? {};

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className={`
                        w-full h-[6.5vh] flex items-center justify-center text-center p-1
                        bg-gradient-to-br from-indigo-900 to-purple-900 border-2 border-purple-400/50
                        rounded-lg shadow-inner font-bold text-white text-lg
                        transition-all duration-300
                        ${!isVisible ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}
                      `}
                      style={{
                        opacity: style.opacity !== undefined ? style.opacity : (isVisible ? 1 : 0),
                        transform: style.scale !== undefined ? `scale(${style.scale})` : (isVisible ? 'scale(1)' : 'scale(0.5)'),
                        backgroundColor: style.bgColor,
                        backgroundImage: style.bgColor ? 'none' : undefined
                      }}
                    >
                      <span className="drop-shadow-md break-words w-full line-clamp-3">{cell}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {state === 'READY_PLAY' && (
        <div className="text-center w-full max-w-4xl bg-purple-900/30 border border-purple-500/50 p-12 rounded-3xl backdrop-blur shadow-[0_0_30px_rgba(168,85,247,0.2)]">
          <h2 className="text-5xl font-black mb-6 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            MÒ KIM BỂ CHỮ - PHẦN THI TIẾP SỨC
          </h2>
          <div className="text-3xl text-gray-300 animate-pulse">Các đội chuẩn bị viết đáp án lên giấy A0</div>
          <div className="text-xl text-purple-300/80 mt-4">Chờ Ban Tổ Chức bắt đầu tính giờ làm bài (7 phút)</div>
        </div>
      )}

      {state === 'PLAYING' && (
        <div className="text-center w-full max-w-4xl bg-red-900/30 border border-red-500/50 p-12 rounded-3xl backdrop-blur shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <h2 className="text-6xl text-red-500 font-black uppercase tracking-widest mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse">
            ĐANG LÀM BÀI!
          </h2>
          <div className="text-3xl text-white mb-8">Thời gian viết đáp án còn lại</div>
          {timeLeft > 0 && (
            <div className="flex justify-center mb-6">
              <div className="bg-black/80 px-12 py-6 rounded-3xl border-2 border-red-500 font-mono text-7xl font-black text-yellow-400 shadow-[0_0_30px_rgba(239,68,68,0.5)] backdrop-blur-sm min-w-[250px] text-center">
                {formatTime(timeLeft)}
              </div>
            </div>
          )}
          <div className="text-xl text-gray-400">Hết thời gian này, các đội phải nộp lại giấy thi ngay lập tức</div>
        </div>
      )}

      {state === 'SCORING' && (
        <div className="text-center w-full">
          <h2 className="text-6xl font-black mb-12 text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            ĐANG CHẤM ĐIỂM
          </h2>
          <div className="text-3xl text-gray-300 animate-pulse">Các đội nộp giấy thi cho Ban Tổ Chức</div>
        </div>
      )}

      {state === 'FINISHED' && (
        <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
          <h2 className="text-6xl font-black mb-12 text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]">
            KẾT QUẢ VÒNG MÒ KIM BỂ CHỮ
          </h2>
          <Scoreboard teams={teams} />
        </div>
      )}

    </div>
  );
}
