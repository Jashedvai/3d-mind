/**
 * Procedural Web Audio API sound & music engine.
 * Zero external audio assets — 100% synthesized in browser memory.
 */

export interface AmbientTrack {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  chords: number[][];
  bassNotes: number[];
}

export const AMBIENT_TRACKS: AmbientTrack[] = [
  {
    id: 'midnight-pad',
    title: 'Midnight Studio Pad',
    artist: 'Jashed Synth Engine',
    bpm: 76,
    chords: [
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 392.0], // G6
      [164.81, 196.0, 246.94, 329.63], // Em7
    ],
    bassNotes: [110.0, 87.31, 98.0, 82.41],
  },
  {
    id: 'cyber-lofi',
    title: 'Obsidian Terminal Flow',
    artist: 'Jashed Synth Engine',
    bpm: 84,
    chords: [
      [196.0, 233.08, 293.66, 349.23], // Gm7
      [155.56, 196.0, 233.08, 293.66], // Ebmaj7
      [174.61, 207.65, 261.63, 349.23], // Fm7
      [146.83, 174.61, 220.0, 261.63], // Dm7
    ],
    bassNotes: [98.0, 77.78, 87.31, 73.42],
  },
  {
    id: 'aurora-pulse',
    title: 'Liquid Morph Ambient',
    artist: 'Jashed Synth Engine',
    bpm: 92,
    chords: [
      [246.94, 293.66, 369.99, 440.0], // Bm7
      [196.0, 246.94, 293.66, 369.99], // Gmaj7
      [220.0, 277.18, 329.63, 440.0], // A6
      [185.0, 220.0, 277.18, 329.63], // F#m7
    ],
    bassNotes: [123.47, 98.0, 110.0, 92.5],
  },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;

  private muted = false;
  private volume = 0.65;
  private sfxEnabled = true;
  private musicPlaying = false;
  private trackIndex = 0;
  private bassBoost = 0.72;

  private stepTimer: number | null = null;
  private stepCount = 0;
  private listeners = new Set<() => void>();

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.75;

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.45;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  getState() {
    return {
      muted: this.muted,
      volume: this.volume,
      sfxEnabled: this.sfxEnabled,
      musicPlaying: this.musicPlaying,
      trackIndex: this.trackIndex,
      bassBoost: this.bassBoost,
    };
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.03);
    }
    this.emit();
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.muted && this.volume > 0) this.muted = false;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.volume,
        this.ctx.currentTime,
        0.03
      );
    }
    this.emit();
  }

  setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    this.emit();
  }

  setBassBoost(val: number) {
    this.bassBoost = Math.max(0, Math.min(1, val));
    this.emit();
  }

  /**
   * Tactile mechanical keyboard switch click + bottom-out thock
   */
  playKeyClick(isSpecial = false) {
    if (!this.sfxEnabled || this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;

    // 1. Crisp switch stem click (short filtered noise burst)
    const bufferSize = Math.floor(ctx.sampleRate * 0.018);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = isSpecial ? 1900 : 2600 + Math.random() * 450;
    filter.Q.value = 1.6;

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.28, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    noise.connect(filter);
    filter.connect(clickGain);
    clickGain.connect(this.sfxGain);
    noise.start(now);

    // 2. Mechanical housing thock
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    const baseFreq = isSpecial ? 145 : 185 + Math.random() * 35;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.035);

    const thockGain = ctx.createGain();
    thockGain.gain.setValueAtTime(0.22, now);
    thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(thockGain);
    thockGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  playMouseClick() {
    if (!this.sfxEnabled || this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.025);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  playWindowOpen() {
    if (!this.sfxEnabled || this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now + idx * 0.04);
      g.gain.linearRampToValueAtTime(0.12, now + idx * 0.04 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.16);

      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.18);
    });
  }

  playWindowClose() {
    if (!this.sfxEnabled || this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.11);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playTransitionSwoosh() {
    if (!this.sfxEnabled || this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.35);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.16);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.34);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.16, now + 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    noise.start(now);
  }

  playStartupChime() {
    if (!this.sfxEnabled || this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    // Ascending warm synth boot chord (C4 -> E4 -> G4 -> B4 -> D5)
    const freqs = [261.63, 329.63, 392.0, 493.88, 587.33];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const start = now + idx * 0.085;
      osc.frequency.setValueAtTime(f, start);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, start);
      g.gain.linearRampToValueAtTime(0.14, start + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.85);

      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(start);
      osc.stop(start + 0.9);
    });
  }

  startMusic(trackIdx?: number) {
    if (typeof trackIdx === 'number') {
      this.trackIndex = ((trackIdx % AMBIENT_TRACKS.length) + AMBIENT_TRACKS.length) % AMBIENT_TRACKS.length;
    }
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain) return;

    if (this.stepTimer !== null) {
      window.clearInterval(this.stepTimer);
      this.stepTimer = null;
    }

    this.musicPlaying = true;
    this.stepCount = 0;

    const triggerStep = () => {
      if (!this.musicPlaying || !this.ctx || !this.musicGain) return;
      const track = AMBIENT_TRACKS[this.trackIndex];
      const barStep = this.stepCount % 8;
      const chordIdx = Math.floor(this.stepCount / 8) % track.chords.length;
      const chord = track.chords[chordIdx];
      const bassFreq = track.bassNotes[chordIdx];
      const now = this.ctx.currentTime;

      // Chord pad every bar start
      if (barStep === 0) {
        chord.forEach((freq) => {
          if (!this.ctx || !this.musicGain) return;
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 1100;

          const g = this.ctx.createGain();
          g.gain.setValueAtTime(0.001, now);
          g.gain.linearRampToValueAtTime(0.085, now + 0.45);
          g.gain.exponentialRampToValueAtTime(0.001, now + 2.6);

          osc.connect(filter);
          filter.connect(g);
          g.connect(this.musicGain);
          osc.start(now);
          osc.stop(now + 2.65);
        });
      }

      // Warm bass pulse on beats 0 and 4
      if (barStep === 0 || barStep === 4) {
        const sub = this.ctx.createOscillator();
        sub.type = 'triangle';
        sub.frequency.setValueAtTime(bassFreq, now);

        const g = this.ctx.createGain();
        const bassLevel = 0.08 + this.bassBoost * 0.14;
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(bassLevel, now + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        sub.connect(g);
        g.connect(this.musicGain);
        sub.start(now);
        sub.stop(now + 0.8);
      }

      // Delicate crystalline arpeggio note
      const arpFreq = chord[this.stepCount % chord.length] * 2;
      const arp = this.ctx.createOscillator();
      arp.type = 'sine';
      arp.frequency.setValueAtTime(arpFreq, now);

      const arpGain = this.ctx.createGain();
      arpGain.gain.setValueAtTime(0.001, now);
      arpGain.gain.linearRampToValueAtTime(0.032, now + 0.02);
      arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      arp.connect(arpGain);
      arpGain.connect(this.musicGain);
      arp.start(now);
      arp.stop(now + 0.38);

      this.stepCount++;
    };

    const track = AMBIENT_TRACKS[this.trackIndex];
    const stepMs = Math.round((60 / track.bpm / 2) * 1000);
    triggerStep();
    this.stepTimer = window.setInterval(triggerStep, stepMs);
    this.emit();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.stepTimer !== null) {
      window.clearInterval(this.stepTimer);
      this.stepTimer = null;
    }
    this.emit();
  }

  toggleMusic() {
    if (this.musicPlaying) {
      this.stopMusic();
    } else {
      this.startMusic(this.trackIndex);
    }
  }

  nextTrack() {
    const next = (this.trackIndex + 1) % AMBIENT_TRACKS.length;
    if (this.musicPlaying) {
      this.startMusic(next);
    } else {
      this.trackIndex = next;
      this.emit();
    }
  }

  prevTrack() {
    const prev = (this.trackIndex - 1 + AMBIENT_TRACKS.length) % AMBIENT_TRACKS.length;
    if (this.musicPlaying) {
      this.startMusic(prev);
    } else {
      this.trackIndex = prev;
      this.emit();
    }
  }

  /**
   * Returns normalized bass/overall audio energy (0..1) for reactive visuals
   */
  getAudioLevels(): { bass: number; mid: number; bars: number[] } {
    if (!this.analyser || !this.freqData || !this.musicPlaying || this.muted) {
      return { bass: 0, mid: 0, bars: new Array(16).fill(0) };
    }
    this.analyser.getByteFrequencyData(this.freqData);
    const bars: number[] = [];
    let bassSum = 0;
    let midSum = 0;
    for (let i = 0; i < 16; i++) {
      const val = (this.freqData[i] || 0) / 255;
      bars.push(val);
      if (i < 4) bassSum += val;
      else if (i < 10) midSum += val;
    }
    return {
      bass: bassSum / 4,
      mid: midSum / 6,
      bars,
    };
  }
}

export const soundEngine = new SoundEngine();
