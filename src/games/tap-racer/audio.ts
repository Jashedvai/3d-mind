/**
 * Zero-asset Web Audio API synthesizer for Futuristic Tap Racer:
 * velocity-scaled continuous engine hum + lane tap, boost surge, near-miss chime, and crash thud.
 */
export class SoundFX {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineActive = false;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private ensureEngineNodes() {
    const ctx = this.ensureContext();
    if (!ctx || this.engineOsc) return;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 58;

    filter.type = 'lowpass';
    filter.frequency.value = 210;

    gain.gain.value = 0;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    this.engineOsc = osc;
    this.engineFilter = filter;
    this.engineGain = gain;
  }

  public setEngineActive(active: boolean) {
    this.engineActive = active;
    if (active && !this.muted) {
      this.ensureEngineNodes();
    }
    if (!this.ctx || !this.engineGain) return;
    const targetGain = active && !this.muted ? 0.032 : 0;
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.06);
  }

  public updateEngine(speed: number, maxSpeed: number, boosting = false) {
    if (!this.engineActive || this.muted || !this.ctx || !this.engineOsc || !this.engineFilter) {
      return;
    }
    const ratio = Math.min(1, Math.max(0, speed / Math.max(1, maxSpeed)));
    const targetFreq = 56 + ratio * 105 + (boosting ? 28 : 0);
    const targetCutoff = 190 + ratio * 420 + (boosting ? 260 : 0);
    const now = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
    this.engineFilter.frequency.setTargetAtTime(targetCutoff, now, 0.05);
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx && this.engineGain) {
      const targetGain = !muted && this.engineActive ? 0.032 : 0;
      this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.04);
    }
  }

  private playTone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainVal = 0.1
  ) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  public tap() {
    this.playTone(340, 560, 0.075, 'sine', 0.09);
  }

  public boost() {
    this.playTone(220, 680, 0.19, 'triangle', 0.1);
  }

  public nearMiss() {
    this.playTone(620, 960, 0.14, 'triangle', 0.11);
  }

  public crash() {
    this.setEngineActive(false);
    this.playTone(150, 34, 0.36, 'sawtooth', 0.2);
  }

  public dispose() {
    this.engineActive = false;
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
      } catch {
        // ignore if already stopped
      }
      this.engineOsc.disconnect();
      this.engineOsc = null;
    }
    this.engineFilter?.disconnect();
    this.engineFilter = null;
    this.engineGain?.disconnect();
    this.engineGain = null;

    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close();
    }
    this.ctx = null;
  }
}
