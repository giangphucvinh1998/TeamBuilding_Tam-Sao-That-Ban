import correctSound from '@/assets/correct.mp3';
import incorrectSound from '@/assets/incorrect.mp3';

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private correctAudio: HTMLAudioElement | null = null;
  private incorrectAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.correctAudio = new Audio(correctSound);
      this.incorrectAudio = new Audio(incorrectSound);
    }
  }
  
  private init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // A simple tick sound for timer
  playTick() {
    try {
      this.init();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, this.audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
      
      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
      
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.1);
    } catch (e) {}
  }

  // Buzzer for time up
  playBuzzer() {
    try {
      this.init();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.0);
      
      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
      
      osc.start();
      osc.stop(this.audioCtx.currentTime + 1.0);
    } catch (e) {}
  }

  // Happy sound for correct answer
  playCorrect() {
    if (this.correctAudio) {
      this.correctAudio.currentTime = 0;
      this.correctAudio.play().catch(e => {
        console.warn("Autoplay blocked/failed for correct audio, falling back:", e);
        this.playCorrectSynth();
      });
    } else {
      this.playCorrectSynth();
    }
  }

  private playCorrectSynth() {
    try {
      this.init();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, this.audioCtx.currentTime);
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime + 0.1);
      osc.frequency.setValueAtTime(1200, this.audioCtx.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.5);
      
      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
      
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.5);
    } catch (e) {}
  }

  // Sad sound for wrong answer
  playWrong() {
    if (this.incorrectAudio) {
      this.incorrectAudio.currentTime = 0;
      this.incorrectAudio.play().catch(e => {
        console.warn("Autoplay blocked/failed for incorrect audio, falling back:", e);
        this.playWrongSynth();
      });
    } else {
      this.playWrongSynth();
    }
  }

  private playWrongSynth() {
    try {
      this.init();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, this.audioCtx.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.5);
      
      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
      
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.5);
    } catch (e) {}
  }
}

export const sounds = new SoundManager();

