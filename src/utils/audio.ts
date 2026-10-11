/**
 * Procedural Web Audio Sound Generator for Aerospace Telemetry & Realistic Rocket Launches
 * Uses pure Web Audio API nodes (oscillators, noise buffers, resonant filters, LFO turbulence)
 * Requires zero external audio downloads and works reliably across all browsers.
 */
class AerospaceAudio {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  public initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && !this.noiseBuffer) {
      this.createNoiseBuffer();
    }
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    try {
      // Create 5 seconds of procedural noise for rocket combustion engine sound
      const bufferSize = this.ctx.sampleRate * 5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;

      // Generate brownian/pink-ish heavy noise for realistic deep engine blast
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.05 * white) / 1.05;
        lastOut = data[i];
        data[i] *= 2.8; // boost gain for roaring flame
      }
      this.noiseBuffer = buffer;
    } catch {
      // fallback
    }
  }

  public playBeep(freq = 880, duration = 0.08, type: OscillatorType = 'sine') {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fail-safe
    }
  }

  /**
   * Plays a realistic, powerful rocket engine ignition & liftoff combustion sound effect!
   * Combines sub-bass engine rumble, filtered jet noise roar, flame crackle & filter sweeps.
   */
  public playIgnition() {
    this.playRealRocketLaunchSound();
  }

  public playRealRocketLaunchSound() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const duration = 5.2;

      // 1. Initial Ignition Sub-Bass Boom & Thruster Shockwave (30Hz -> 85Hz -> 25Hz)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(35, now);
      subOsc.frequency.exponentialRampToValueAtTime(110, now + 0.35);
      subOsc.frequency.exponentialRampToValueAtTime(28, now + duration);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.28, now + 0.2); // ignition pop/boom
      subGain.gain.setValueAtTime(0.22, now + 0.8);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + duration);

      // 2. Heavy Flame Combustion Roar (Filtered Procedural Noise Buffer)
      if (this.noiseBuffer) {
        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = this.noiseBuffer;

        // Resonant lowpass filter simulating expanding atmospheric engine plume
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.setValueAtTime(3.5, now);
        filter.frequency.setValueAtTime(90, now);
        filter.frequency.exponentialRampToValueAtTime(480, now + 0.8); // ignition flame swell
        filter.frequency.setValueAtTime(360, now + 2.5);
        filter.frequency.exponentialRampToValueAtTime(120, now + duration);

        // Flame turbulence crackle LFO (modulating gain at 14Hz)
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(14, now);
        lfoGain.gain.setValueAtTime(0.06, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.001, now);
        noiseGain.gain.linearRampToValueAtTime(0.35, now + 0.25); // Ignition fire roar!
        noiseGain.gain.setValueAtTime(0.30, now + 3.0);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        lfo.connect(lfoGain);
        lfoGain.connect(noiseGain.gain);

        noiseNode.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        lfo.start(now);
        noiseNode.start(now);
        lfo.stop(now + duration);
        noiseNode.stop(now + duration);
      }

      // 3. Supersonic Exhaust Gas Jet Hiss Layer
      const hissOsc = this.ctx.createOscillator();
      const hissFilter = this.ctx.createBiquadFilter();
      const hissGain = this.ctx.createGain();

      hissOsc.type = 'triangle';
      hissOsc.frequency.setValueAtTime(180, now);
      hissOsc.frequency.linearRampToValueAtTime(240, now + 1.2);

      hissFilter.type = 'bandpass';
      hissFilter.frequency.setValueAtTime(1400, now);
      hissFilter.Q.setValueAtTime(1.8, now);

      hissGain.gain.setValueAtTime(0.001, now);
      hissGain.gain.linearRampToValueAtTime(0.08, now + 0.4);
      hissGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);

      hissOsc.connect(hissFilter);
      hissFilter.connect(hissGain);
      hissGain.connect(this.ctx.destination);

      hissOsc.start(now);
      hissOsc.stop(now + duration * 0.8);
    } catch {
      // safe fallback
    }
  }

  public playSonarPing() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {}
  }

  public playWaypointDiscovered() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = this.ctx.currentTime + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.05, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch {}
  }
}

export const aerospaceAudio = new AerospaceAudio();

