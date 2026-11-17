import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Gentle Thai Pentatonic Meditative Music Bed (Web Audio API)
 * Emulates soft Thai Khim / Ranat wooden-bell resonance over a serene drone.
 * Works 100% offline with zero external audio dependencies.
 */

// C4 pentatonic scale frequencies in Hz (โด เร มี ซอล ลา โดสูง เรสูง)
const THAI_PENTATONIC_HZ = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];

// Contemplative motif patterns (indices into THAI_PENTATONIC_HZ)
const MELODY_PHRASES = [
  [4, 3, 2, 1, 2, 3, 4, 2],
  [5, 4, 3, 2, 3, 1, 0, 2],
  [2, 3, 4, 5, 4, 3, 2, 1],
];

class ThaiAmbientEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private droneOscs: OscillatorNode[] = [];
  private timerId: number | null = null;
  private step = 0;
  private phraseIndex = 0;
  private running = false;
  private targetVolume = 0.25;

  public isRunning(): boolean {
    return this.running;
  }

  public setVolume(vol: number) {
    this.targetVolume = Math.max(0.02, Math.min(0.65, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.targetVolume,
        this.ctx.currentTime,
        0.15
      );
    }
  }

  public start(volume: number) {
    if (typeof window === 'undefined') return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    this.targetVolume = Math.max(0.02, Math.min(0.65, volume));

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    if (this.running) return;

    this.running = true;
    const now = this.ctx.currentTime;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(this.targetVolume, now + 1.2);
    this.masterGain.connect(this.ctx.destination);

    // Warm soft harmonic drone (C3 + G3)
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.14, now);
    this.droneGain.connect(this.masterGain);

    const droneFreqs = [130.81, 196.0];
    this.droneOscs = droneFreqs.map((freq) => {
      const osc = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(340, now);
      osc.connect(filter);
      filter.connect(this.droneGain!);
      osc.start(now);
      return osc;
    });

    const playNextNote = () => {
      if (!this.running || !this.ctx || !this.masterGain) return;
      const phrase = MELODY_PHRASES[this.phraseIndex % MELODY_PHRASES.length];
      const noteIdx = phrase[this.step % phrase.length];
      const freq = THAI_PENTATONIC_HZ[noteIdx];

      this.triggerKhimChime(freq);

      this.step += 1;
      if (this.step % phrase.length === 0) {
        this.phraseIndex += 1;
      }

      // Gentle unhurried spacing (1.4s - 2.1s)
      const nextDelay = this.step % 4 === 0 ? 2050 : 1350;
      this.timerId = window.setTimeout(playNextNote, nextDelay);
    };

    playNextNote();
  }

  private triggerKhimChime(freq: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Fundamental + soft octave shimmer
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(480, now + 2.2);

    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(0.22, now + 0.035);
    noteGain.gain.exponentialRampToValueAtTime(0.0008, now + 2.5);

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.25, now);

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.6);
    osc2.stop(now + 2.6);
  }

  public stop() {
    this.running = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.ctx && this.masterGain) {
      try {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(
          Math.max(0.001, this.masterGain.gain.value),
          now
        );
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      } catch {
        // ignore audio scheduling errors on teardown
      }
    }
    const oscs = this.droneOscs;
    this.droneOscs = [];
    window.setTimeout(() => {
      oscs.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
    }, 380);
  }
}

const sharedEngine = new ThaiAmbientEngine();

export function useAmbientMusic() {
  const [isPlaying, setIsPlaying] = useState<boolean>(() =>
    sharedEngine.isRunning()
  );
  const [volume, setVolumeState] = useState<number>(0.24);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const start = useCallback(() => {
    sharedEngine.start(volume);
    if (mountedRef.current) setIsPlaying(true);
  }, [volume]);

  const stop = useCallback(() => {
    sharedEngine.stop();
    if (mountedRef.current) setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (sharedEngine.isRunning()) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  const setVolume = useCallback((next: number) => {
    setVolumeState(next);
    sharedEngine.setVolume(next);
  }, []);

  return {
    isPlaying,
    volume,
    setVolume,
    start,
    stop,
    toggle,
  };
}
