// ── audio.js ──────────────────────────────────────────────────────
export class AudioManager {
  constructor() {
    this.ac = null; this.master = null; this.unlocked = false;
  }
  _getAC() {
    if (!this.ac) {
      this.ac = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ac.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(this.ac.destination);
    }
    if (this.ac.state === 'suspended') this.ac.resume();
    return this.ac;
  }
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    const a = this._getAC();
    if (a.state === 'suspended') a.resume();
  }
  bloop(freq, vol, dur, bend, dest) {
    const a = this._getAC(), t = a.currentTime;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (bend) o.frequency.exponentialRampToValueAtTime(freq * bend, t + dur * 0.4);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  thud(freq, vol, dur, dest) {
    const a = this._getAC(), t = a.currentTime;
    const o = a.createOscillator(), g = a.createGain(), filt = a.createBiquadFilter();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.1, t + dur * 0.8);
    filt.type = 'lowpass'; filt.frequency.value = freq * 2.5; filt.Q.value = 4;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(filt); filt.connect(g); g.connect(dest || this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  puff(vol, dur, cutoff, dest) {
    const a = this._getAC(), t = a.currentTime;
    const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource(); src.buffer = buf;
    const filt = a.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(cutoff * 1.5, t);
    filt.frequency.exponentialRampToValueAtTime(cutoff * 0.5, t + dur);
    filt.Q.value = 1.2;
    const g = a.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt); filt.connect(g); g.connect(dest || this.master);
    src.start(t); src.stop(t + dur + 0.05);
  }
  wobble(freq, vol, dur, wobRate, wobDepth, dest) {
    const a = this._getAC(), t = a.currentTime;
    const o = a.createOscillator(), lfo = a.createOscillator(), lfoG = a.createGain(), g = a.createGain();
    o.type = 'triangle'; o.frequency.value = freq;
    lfo.type = 'sine'; lfo.frequency.value = wobRate; lfoG.gain.value = wobDepth * 1.5;
    lfo.connect(lfoG); lfoG.connect(o.frequency);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.master);
    lfo.start(t); o.start(t); lfo.stop(t + dur + 0.05); o.stop(t + dur + 0.05);
  }
  spawn() {
    this.unlock();
    this.bloop(480, 0.25, 0.22, 0.25);
    setTimeout(() => this.puff(0.08, 0.06, 2200), 20);
  }
  merge(level) {
    const freqs = [180, 220, 280, 360, 450, 550, 680];
    const f = freqs[Math.min(level, freqs.length - 1)];
    this.bloop(f * 0.9, 0.35, 0.20, 0.3);
    setTimeout(() => this.bloop(f * 1.3, 0.30, 0.25, 0.35), 45);
    this.thud(f * 0.4, 0.25, 0.25);
    setTimeout(() => this.wobble(f * 1.2, 0.1, 0.18, 15, 25), 25);
  }
  absorb(bigLevel) {
    const a = this._getAC(), t = a.currentTime;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150 + bigLevel * 20, t);
    o.frequency.exponentialRampToValueAtTime(600, t + 0.3);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.4);
    this.wobble(250 + bigLevel * 30, 0.15, 0.25, 22, 35);
    setTimeout(() => this.puff(0.12, 0.08, 800), 150);
  }
  goalDone() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, i) => {
      setTimeout(() => { this.bloop(f, 0.2, 0.6, 0.9); this.wobble(f * 0.5, 0.05, 0.3, 5, 8); }, i * 60);
    });
  }
  levelComplete() {
    const notes = [330, 415, 494, 660, 880];
    notes.forEach((f, i) => {
      setTimeout(() => {
        this.bloop(f, 0.35, 0.6, 0.85); this.thud(f * 0.4, 0.15, 0.4);
        setTimeout(() => this.puff(0.08, 0.1, f * 2), 10);
        setTimeout(() => this.wobble(f, 0.08, 0.25, 12, 20), 30);
      }, i * 90);
    });
  }
  blast() {
    this.thud(100, 0.6, 0.5); this.puff(0.25, 0.2, 400);
    [0, 30, 60, 100, 150, 210].forEach((ms, i) => {
      const f = 400 + Math.random() * 600;
      setTimeout(() => { this.bloop(f, 0.2 - i * 0.02, 0.15, 0.3); this.puff(0.05, 0.04, 1500); }, ms);
    });
  }
  combo(count) {
    const base = 220, f = base * Math.pow(1.15, Math.min(count - 1, 10));
    this.bloop(f, 0.3, 0.25, 0.5);
    setTimeout(() => this.bloop(f * 1.25, 0.2, 0.2, 0.6), 40);
    this.wobble(f * 0.8, 0.1, 0.2, 18 + count * 2, 25);
  }
  gameOver() {
    const a = this._getAC(), t = a.currentTime;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(300, t);
    o.frequency.exponentialRampToValueAtTime(20, t + 1.2);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.4, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 1.5);
    [0.15, 0.35, 0.6, 0.9].forEach(delay => {
      setTimeout(() => { this.thud(60, 0.25, 0.4); this.puff(0.1, 0.1, 300); }, delay * 1000);
    });
  }
  pick() { this.bloop(600, 0.15, 0.1, 0.5); }
  resumeBg() {}
}
