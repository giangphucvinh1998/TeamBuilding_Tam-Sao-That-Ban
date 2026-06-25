import { useState, useEffect, useRef } from 'react';
import { sounds } from '@/lib/sounds';

export default function Timer({ timerInfo }: { timerInfo: any }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const reqRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (!timerInfo) {
      setTimeLeft(0);
      return;
    }

    const { start_time, duration } = timerInfo;
    const endTime = (start_time + duration) * 1000;

    const animate = () => {
      const now = Date.now();
      const remain = Math.max(0, endTime - now);
      setTimeLeft(remain);

      // Play tick sound every second when < 10 seconds remaining
      if (remain > 0 && remain <= 10000) {
        const currentSecond = Math.ceil(remain / 1000);
        if (currentSecond !== lastTickRef.current) {
          sounds.playTick();
          lastTickRef.current = currentSecond;
        }
      }

      if (remain > 0) {
        reqRef.current = requestAnimationFrame(animate);
      }
    };

    reqRef.current = requestAnimationFrame(animate);

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [timerInfo]);

  if (!timerInfo) return null;

  const seconds = Math.ceil(timeLeft / 1000);
  
  // Color styling based on time left
  let colorClass = 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]';
  if (timerInfo.type === 'preparing') {
    colorClass = 'text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]';
  } else if (seconds <= 5 && seconds > 0) {
    colorClass = 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,1)] animate-pulse scale-110';
  } else if (seconds <= 10 && seconds > 0) {
    colorClass = 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]';
  }

  return (
    <div className="flex flex-col items-center justify-center my-8">
      <div className="text-2xl font-bold uppercase tracking-widest text-gray-400 mb-2">
        {timerInfo.type === 'preparing' ? 'Thời Gian Chuẩn Bị' : timerInfo.type === 'guessing' ? 'Thời Gian Trả Lời' : 'Thời Gian Thi Đấu'}
      </div>
      <div className={`text-[20rem] leading-none font-black transition-all duration-300 font-mono ${colorClass}`}>
        {seconds}
      </div>
    </div>
  );
}
