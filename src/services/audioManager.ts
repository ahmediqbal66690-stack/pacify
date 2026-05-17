
import * as THREE from 'three';

class ProceduralAudio {
  private ctx: AudioContext | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private heartbeatOsc: OscillatorNode | null = null;
  private heartbeatGain: GainNode | null = null;
  private currentVolume: number = 0.5;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.setupDrone();
  }

  private setupDrone() {
    if (!this.ctx) return;
    
    // Low ominous drone
    this.droneOsc = this.ctx.createOscillator();
    this.droneGain = this.ctx.createGain();
    
    this.droneOsc.type = 'sawtooth';
    this.droneOsc.frequency.setValueAtTime(40, this.ctx.currentTime);
    
    // Filter for "dark" sound
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.ctx.currentTime);
    filter.Q.setValueAtTime(10, this.ctx.currentTime);

    this.droneGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    
    this.droneOsc.connect(filter);
    filter.connect(this.droneGain);
    this.droneGain.connect(this.ctx.destination);
    
    this.droneOsc.start();

    // Subtle pitch modulation
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.1, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(2, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(this.droneOsc.frequency);
    lfo.start();
  }

  playHeartbeat(intensity: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // intensity 0 to 1
    const frequency = 0.5 + intensity * 2; // rate
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(intensity * 0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(now + 0.4);
  }

  playBurn() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 1; // 1s
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.8);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    
    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    whiteNoise.start();
  }

  playScream() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(20, now + 1.5);
    
    osc2.frequency.setValueAtTime(800, now);
    osc2.frequency.exponentialRampToValueAtTime(10, now + 1.5);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(now + 2);
    osc2.stop(now + 2);
  }

  playFootstep() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.1);
    
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(now + 0.2);
  }

  playRoar() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Low frequency rumble
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    
    osc1.frequency.setValueAtTime(60, now);
    osc1.frequency.exponentialRampToValueAtTime(120, now + 1);
    osc1.frequency.exponentialRampToValueAtTime(40, now + 3);
    
    osc2.frequency.setValueAtTime(80, now);
    osc2.frequency.exponentialRampToValueAtTime(160, now + 1);
    osc2.frequency.exponentialRampToValueAtTime(60, now + 3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(now + 3);
    osc2.stop(now + 3);
  }

  stop() {
    this.droneOsc?.stop();
    this.heartbeatOsc?.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}

export const audioManager = new ProceduralAudio();
