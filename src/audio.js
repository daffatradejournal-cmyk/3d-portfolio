// Tactile mechanical switch & click sound synthesizer via Web Audio API
// Inspired by Teenage Engineering / Braun physical tactile feedback

class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  // Mechanical keyboard switch click (Cherry MX Blue / tactile switch style)
  playKeyClick(isDown = true) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // High frequency transient pop
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isDown ? 1800 : 2400, t);
    osc.frequency.exponentialRampToValueAtTime(isDown ? 240 : 480, t + 0.035);

    // Filtered noise snap
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  // Soft toggle switch click (Industrial toggle switch)
  playToggle() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.03);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  toggleSound() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

export const sound = new SoundFX();
