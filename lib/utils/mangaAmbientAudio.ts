"use client";

export type AmbianceTheme = "dark-fantasy" | "cozy-lofi" | "cyberpunk" | "zen-acoustic";

export interface AmbiancePreset {
  id: AmbianceTheme;
  name: string;
  subtitle: string;
  iconName: string;
  color: string;
}

export const AMBIANCE_PRESETS: AmbiancePreset[] = [
  {
    id: "dark-fantasy",
    name: "Dark Fantasy",
    subtitle: "Drone & brooding atmospheric swells (Berserk, Solo Leveling)",
    iconName: "Flame",
    color: "#ff2a85",
  },
  {
    id: "cozy-lofi",
    name: "Cozy Acoustics",
    subtitle: "Warm relaxing chord cycles (Frieren, Slice of Life)",
    iconName: "Coffee",
    color: "#10b981",
  },
  {
    id: "cyberpunk",
    name: "Sci-Fi Pulse",
    subtitle: "Subtle analog synth textures (Cyberpunk, Action)",
    iconName: "Zap",
    color: "#06b6d4",
  },
  {
    id: "zen-acoustic",
    name: "Zen Wind",
    subtitle: "Ethereal atmospheric resonance & calm chimes",
    iconName: "Wind",
    color: "#a855f7",
  },
];

export function getRecommendedTheme(genres?: string[], countryOfOrigin?: string | null): AmbianceTheme {
  if (!genres || genres.length === 0) {
    return countryOfOrigin === "KR" ? "cyberpunk" : "cozy-lofi";
  }

  const g = genres.map((x) => x.toLowerCase());

  if (g.includes("horror") || g.includes("psychological") || g.includes("dark fantasy") || g.includes("thriller")) {
    return "dark-fantasy";
  }
  if (g.includes("sci-fi") || g.includes("mecha") || g.includes("action") || g.includes("supernatural")) {
    return "cyberpunk";
  }
  if (g.includes("romance") || g.includes("historical") || g.includes("drama")) {
    return "zen-acoustic";
  }
  return "cozy-lofi";
}

// ── Synthesized Ambient Engine using Web Audio API (Zero-dependency & offline) ──

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private currentTheme: AmbianceTheme | null = null;
  private volume = 0.25;

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public play(theme: AmbianceTheme) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.stop();
    this.currentTheme = theme;

    switch (theme) {
      case "dark-fantasy":
        this.playDarkFantasy();
        break;
      case "cozy-lofi":
        this.playCozyLofi();
        break;
      case "cyberpunk":
        this.playCyberpunk();
        break;
      case "zen-acoustic":
        this.playZen();
        break;
    }
  }

  private playDarkFantasy() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Deep sub-drone in D (D1=36.71Hz, D2=73.42Hz, A2=110Hz, F3=174.61Hz)
    const freqs = [73.42, 110.0, 146.83, 174.61];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(250 + idx * 40, ctx.currentTime);

      // Slow breathing filter LFO
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.08 + idx * 0.03, ctx.currentTime);
      lfoGain.gain.setValueAtTime(80, ctx.currentTime);
      lfo.connect(filter.frequency);
      lfo.start();

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08 / (idx + 1), ctx.currentTime + 3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start();
      this.activeOscillators.push(osc, lfo);
    });
  }

  private playCozyLofi() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Lush 4-chord gentle progression loop (Fmaj9 -> Em7 -> Dm9 -> Cmaj7)
    const chords = [
      [174.61, 220.0, 261.63, 329.63, 392.0], // Fmaj9
      [164.81, 196.0, 246.94, 293.66],        // Em7
      [146.83, 174.61, 220.0, 261.63, 329.63],// Dm9
      [130.81, 164.81, 196.0, 246.94],        // Cmaj7
    ];

    let chordIdx = 0;

    const playChordStep = () => {
      if (!this.ctx || !this.masterGain) return;
      const notes = chords[chordIdx % chords.length];
      chordIdx++;

      notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(450, ctx.currentTime);

        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now);
        osc.stop(now + 5.0);
      });
    };

    playChordStep();
    this.intervalId = setInterval(playChordStep, 4500);
  }

  private playCyberpunk() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Atmospheric Blade Runner-esque analog brass pad
    const freqs = [55.0, 110.0, 164.81, 220.0];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq + (idx * 0.3), ctx.currentTime); // gentle detune

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.05 / (idx + 1), ctx.currentTime + 2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start();
      this.activeOscillators.push(osc);
    });
  }

  private playZen() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;

    // Ethereal pentatonic chimes & ambient wind
    const freqs = [196.0, 293.66, 392.0, 440.0, 587.33];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.1 + idx * 0.05, ctx.currentTime);
      lfoGain.gain.setValueAtTime(0.015, ctx.currentTime);
      lfo.connect(gain.gain);
      lfo.start();

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start();
      this.activeOscillators.push(osc, lfo);
    });
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    });
    this.activeOscillators = [];
    this.currentTheme = null;
  }

  public isPlaying(): boolean {
    return this.currentTheme !== null;
  }

  public getCurrentTheme(): AmbianceTheme | null {
    return this.currentTheme;
  }
}

// Global Singleton for reader audio
export const mangaAudioEngine = typeof window !== "undefined" ? new AmbientAudioEngine() : ({} as AmbientAudioEngine);
