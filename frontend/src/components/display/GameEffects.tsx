import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '@/lib/sounds';

export default function GameEffects({ effectData }: { effectData: any }) {
  useEffect(() => {
    if (!effectData) return;

    const { effect } = effectData;
    
    // Play effects based on type
    if (effect === 'correct') {
      sounds.playCorrect();
      
      // Fire confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
      }, 250);

    } else if (effect === 'wrong' || effect === 'wrong_deduct') {
      sounds.playWrong();
      
      // Trigger a body shake by adding/removing class
      document.body.classList.add('animate-shake');
      setTimeout(() => {
        document.body.classList.remove('animate-shake');
      }, 500);

    } else if (effect === 'time_up') {
      sounds.playBuzzer();
    } else if (effect === 'round_start') {
      // maybe a gentle chime
    }

  }, [effectData]);

  // Make sure we have the shake animation in our styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
      }
      .animate-shake {
        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return null; // Component only handles side-effects
}
