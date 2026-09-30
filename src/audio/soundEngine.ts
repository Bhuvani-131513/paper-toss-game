// Procedural Web Audio API sound synthesizer for Paper Toss Classic

class SoundEngine {
  private ctx: AudioContext | null = null;
  private fanGainNode: GainNode | null = null;
  private fanOscillator: AudioNode | null = null;
  private isFanRunning = false;
  
  public sfxEnabled = true;
  public fanEnabled = true;
  public masterVolume = 0.8;

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public enableAudioOnFirstGesture() {
    this.initContext();
    if (this.fanEnabled && !this.isFanRunning) {
      this.startFanSound();
    }
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public setFanEnabled(enabled: boolean) {
    this.fanEnabled = enabled;
    if (enabled) {
      this.startFanSound();
    } else {
      this.stopFanSound();
    }
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.fanGainNode && this.ctx) {
      this.fanGainNode.gain.setValueAtTime(0.04 * this.masterVolume, this.ctx.currentTime);
    }
  }

  // Whoosh throw sound
  public playWhoosh(speedRatio = 1.0) {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    const baseFreq = 120 + Math.min(300, speedRatio * 150);
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.8, now + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(1400, now + 0.08);

    const vol = 0.35 * this.masterVolume;
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Crisp swish basket sound (filtered white noise + soft chime)
  public playSwish() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Filtered white noise for paper drop into basket
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(450, now + 0.22);
    filter.Q.setValueAtTime(3, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);

    // Subtle gentle chime harmonic
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5

    oscGain.gain.setValueAtTime(0.2 * this.masterVolume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Metallic rim bounce sound
  public playRim(isMetallic = true) {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Primary rim ding
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = isMetallic ? 'triangle' : 'sine';
    osc1.frequency.setValueAtTime(isMetallic ? 840 : 220, now);
    osc1.frequency.exponentialRampToValueAtTime(isMetallic ? 720 : 180, now + 0.12);

    gain1.gain.setValueAtTime(0.45 * this.masterVolume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // High harmonic metallic ping
    if (isMetallic) {
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2150, now);
      osc2.frequency.exponentialRampToValueAtTime(1900, now + 0.08);

      gain2.gain.setValueAtTime(0.25 * this.masterVolume, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.1);
    }
  }

  // Dull floor thud / miss
  public playMiss() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(45, now + 0.22);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);

    gain.gain.setValueAtTime(0.35 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  // Milestone celebratory chime / applause
  public playMilestoneChime() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startAt = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startAt);

      gain.gain.setValueAtTime(0.001, startAt);
      gain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.36);
    });
  }

  // Ambient fan drone
  public startFanSound() {
    if (!this.fanEnabled || this.isFanRunning) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      // Pink/Brownish noise generator for soft air flow
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.96 * b1 + white * 0.11;
        b2 = 0.86 * b2 + white * 0.25;
        output[i] = (b0 + b1 + b2) * 0.15;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.04 * this.masterVolume, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
      this.fanOscillator = whiteNoise;
      this.fanGainNode = gain;
      this.isFanRunning = true;
    } catch {
      // Ignore audio error if user hasn't interacted yet
    }
  }

  public stopFanSound() {
    if (this.fanOscillator) {
      try {
        (this.fanOscillator as AudioScheduledSourceNode).stop();
      } catch {
        // Safe catch
      }
      this.fanOscillator.disconnect();
      this.fanOscillator = null;
    }
    this.isFanRunning = false;
  }
}

export const soundEngine = new SoundEngine();
