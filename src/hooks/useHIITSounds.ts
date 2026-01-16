import { useCallback, useRef } from 'react';

// Create audio context for synthesized sounds
const createAudioContext = () => {
  if (typeof window === 'undefined') return null;
  return new (window.AudioContext || (window as any).webkitAudioContext)();
};

export function useHIITSounds(enabled: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }
    return audioContextRef.current;
  }, []);

  // Arcade-style "fight" beep - aggressive rising tone
  const playWorkStart = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Triple beep ascending - arcade fight start
    [0, 0.1, 0.2].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(440 + i * 220, now + delay); // A4, C#5, E5
      
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.15, now + delay + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + delay + 0.08);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.1);
    });
  }, [enabled, getAudioContext]);

  // Arcade-style "rest" beep - descending cool-down tone
  const playRestStart = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Double beep descending - rest signal
    [0, 0.15].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660 - i * 220, now + delay); // E5, C#5
      
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.03);
      gain.gain.linearRampToValueAtTime(0, now + delay + 0.15);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.2);
    });
  }, [enabled, getAudioContext]);

  // Victory fanfare - triumphant chord
  const playComplete = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Triumphant chord: C major with rising arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.02);
      gain.gain.linearRampToValueAtTime(0.08, now + i * 0.1 + 0.3);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.5);
      
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.6);
    });
  }, [enabled, getAudioContext]);

  // Countdown tick
  const playCountdownTick = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
    gain.gain.linearRampToValueAtTime(0, now + 0.05);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }, [enabled, getAudioContext]);

  return {
    playWorkStart,
    playRestStart,
    playComplete,
    playCountdownTick,
  };
}