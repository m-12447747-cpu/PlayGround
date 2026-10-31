// sound.js — tiny WebAudio synth: score, weather and foley. No audio files.
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.delay = null;
    this.wind = null;
    this.windGain = null;
    this.musicVol = 0.55;
    this.sfxVol = 0.7;
    this.track = null;
    this.pendingTrack = null;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
    this.lastBlip = 0;
    this.noiseBuf = null;
    this.ready = false;
  }

  init() {
    if (this.ready) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 18;
    comp.ratio.value = 5;
    comp.attack.value = 0.005;
    comp.release.value = 0.25;
    this.master.connect(comp);
    comp.connect(ctx.destination);

    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = this.musicVol * 0.52;
    this.musicGain.connect(this.master);

    this.delay = ctx.createDelay(0.6);
    this.delay.delayTime.value = 0.26;
    const fb = ctx.createGain();
    fb.gain.value = 0.2;
    const wet = ctx.createGain();
    wet.gain.value = 0.16;
    const dlp = ctx.createBiquadFilter();
    dlp.type = 'lowpass';
    dlp.frequency.value = 2400;
    this.musicGain.connect(this.delay);
    this.delay.connect(dlp);
    dlp.connect(fb);
    fb.connect(this.delay);
    dlp.connect(wet);
    wet.connect(this.master);

    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.value = this.sfxVol;
    this.sfxGain.connect(this.master);

    const len = Math.floor(ctx.sampleRate * 2);
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    // wind bed
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 90;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    src.connect(lp); lp.connect(hp); hp.connect(this.windGain); this.windGain.connect(this.master);
    src.start();
    this.wind = src;

    this.ready = true;
    this.timer = setInterval(() => this.schedule(), 28);
    if (this.pendingTrack) {
      const t = this.pendingTrack;
      this.pendingTrack = null;
      this.playTrack(t);
    }
  }

  setMusicVolume(v) {
    this.musicVol = Math.max(0, Math.min(1, v));
    if (this.musicGain) this.musicGain.gain.setTargetAtTime(this.musicVol * 0.52, this.ctx.currentTime, 0.08);
  }

  setSfxVolume(v) {
    this.sfxVol = Math.max(0, Math.min(1, v));
    if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(this.sfxVol, this.ctx.currentTime, 0.06);
  }

  ambience(level) {
    if (!this.windGain) return;
    this.windGain.gain.setTargetAtTime(level * 0.11, this.ctx.currentTime, 0.7);
  }

  note(f, when, dur, opt = {}) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const {
      type = 'triangle', gain = 0.08, attack = 0.01, release = 0.16,
      detune = 0, filter = 0, pan = 0, bus = 'music',
    } = opt;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, when);
    if (detune) o.detune.setValueAtTime(detune, when);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(gain, when + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(attack + 0.02, dur));
    let node = o;
    if (filter) {
      const fl = ctx.createBiquadFilter();
      fl.type = 'lowpass';
      fl.frequency.value = filter;
      node.connect(fl);
      node = fl;
    }
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      node.connect(p);
      node = p;
    }
    node.connect(g);
    g.connect(bus === 'sfx' ? this.sfxGain : this.musicGain);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  noise(when, dur, opt = {}) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const { gain = 0.1, type = 'highpass', freq = 900, q = 0.7, bus = 'sfx', attack = 0.005 } = opt;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(gain, when + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(f); f.connect(g); g.connect(bus === 'sfx' ? this.sfxGain : this.musicGain);
    src.start(when);
    src.stop(when + dur + 0.02);
  }

  playTrack(name) {
    if (this.track === name) return;
    this.track = name;
    this.step = 0;
    if (!this.ready) { this.pendingTrack = name; return; }
    this.nextTime = this.ctx.currentTime + 0.08;
  }

  stopMusic() {
    this.track = null;
    this.pendingTrack = null;
  }

  schedule() {
    if (!this.ready || !this.track) return;
    const track = TRACKS[this.track];
    if (!track) return;
    const stepDur = 60 / track.bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.16) {
      this.step_(track, this.step, this.nextTime, stepDur);
      this.step++;
      this.nextTime += stepDur;
    }
  }

  step_(track, step, when, dur) {
    const s = step % track.len;
    if (track.kind === 'ambient') {
      const bar = Math.floor(s / 16);
      if (s % 16 === 0) {
        const root = [33, 36, 31, 29][bar % 4];
        this.note(midi(root), when, dur * 16, { type: 'sine', gain: 0.055, attack: 0.8, release: 1.2 });
        this.note(midi(root + 12), when + 0.05, dur * 15, { type: 'triangle', gain: 0.02, attack: 1.4, release: 1.4 });
        this.noise(when, dur * 14, { gain: 0.018, type: 'lowpass', freq: 500, bus: 'music', attack: 1.2 });
      }
      if (track.notes[s]) {
        const n = track.notes[s];
        this.note(midi(n), when, dur * 3.4, { type: 'triangle', gain: 0.045, attack: 0.04, release: 0.9, filter: 2200 });
        this.note(midi(n + 12), when + 0.03, dur * 2.4, { type: 'sine', gain: 0.018, attack: 0.02, release: 0.8 });
      }
      return;
    }

    const bar = Math.floor(s / 16);
    const chord = track.chords ? track.chords[bar % track.chords.length] : null;
    if (chord && s % 16 === 0) {
      for (const n of chord) {
        this.note(midi(n), when, dur * 14, {
          type: track.padType || 'sine', gain: (track.padGain ?? 0.025), attack: track.padAttack ?? 0.5, release: 0.8,
          detune: (Math.random() - 0.5) * 5, filter: 1800,
        });
      }
    }
    if (track.arp && s % 2 === 0) {
      const idx = (s / 2) % track.arp.length;
      const n = track.arp[idx] + (chord ? chord[0] : 0);
      this.note(midi(n), when, dur * (track.arpLen || 2.2), {
        type: track.arpType || 'triangle', gain: track.arpGain ?? 0.045, attack: 0.008, release: 0.24, filter: 3200, pan: (idx % 2 ? 0.15 : -0.15),
      });
    }
    if (track.melody && track.melody[s] != null) {
      const n = track.melody[s];
      this.note(midi(n), when, dur * (track.melLen || 3.2), {
        type: track.melType || 'triangle', gain: track.melGain ?? 0.05, attack: 0.015, release: 0.45, filter: 2600, pan: 0.05,
      });
    }
    if (track.bass && s % (track.bassEvery || 2) === 0) {
      const idx = (s / (track.bassEvery || 2)) % track.bass.length;
      this.note(midi(track.bass[idx]), when, dur * 1.6, {
        type: 'triangle', gain: track.bassGain ?? 0.07, attack: 0.005, release: 0.12, filter: 700,
      });
    }
    if (track.drums) {
      if (s % 4 === 0) this.kick(when);
      if (s % 8 === 4) this.snare(when);
      if (s % 2 === 0) this.hat(when, s % 4 === 2);
    }
    if (track.bell && track.bell[s]) {
      this.note(midi(track.bell[s]), when, dur * 4, { type: 'sine', gain: 0.022, attack: 0.01, release: 1.2 });
    }
  }

  kick(when) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(130, when);
    o.frequency.exponentialRampToValueAtTime(42, when + 0.12);
    g.gain.setValueAtTime(0.11, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.17);
    o.connect(g); g.connect(this.musicGain);
    o.start(when); o.stop(when + 0.2);
  }

  snare(when) {
    this.noise(when, 0.1, { gain: 0.055, type: 'bandpass', freq: 1800, q: 0.6, bus: 'music' });
    this.note(190, when, 0.09, { type: 'triangle', gain: 0.03, attack: 0.001, release: 0.06 });
  }

  hat(when, open = false) {
    this.noise(when, open ? 0.08 : 0.03, { gain: open ? 0.026 : 0.018, type: 'highpass', freq: 7200, bus: 'music' });
  }

  sfx(name, opt = {}) {
    if (!this.ready) return;
    const t = this.ctx.currentTime + 0.005;
    switch (name) {
      case 'blip': {
        if (t - this.lastBlip < 0.028) return;
        this.lastBlip = t;
        const p = opt.pitch ?? 1;
        this.note(560 * p, t, 0.035, { type: 'square', gain: 0.018, attack: 0.001, release: 0.03, bus: 'sfx', filter: 2600 });
        break;
      }
      case 'confirm':
        this.note(midi(76), t, 0.08, { type: 'triangle', gain: 0.06, bus: 'sfx' });
        this.note(midi(83), t + 0.07, 0.14, { type: 'triangle', gain: 0.05, bus: 'sfx' });
        break;
      case 'cancel':
        this.note(midi(72), t, 0.08, { type: 'triangle', gain: 0.05, bus: 'sfx' });
        this.note(midi(65), t + 0.07, 0.13, { type: 'triangle', gain: 0.045, bus: 'sfx' });
        break;
      case 'hover':
        this.note(midi(84), t, 0.03, { type: 'square', gain: 0.012, bus: 'sfx', filter: 3000 });
        break;
      case 'door':
        this.noise(t, 0.2, { gain: 0.06, type: 'lowpass', freq: 500 });
        this.note(midi(45), t, 0.3, { type: 'triangle', gain: 0.06, bus: 'sfx' });
        break;
      case 'step':
        this.noise(t, 0.055, { gain: 0.022, type: 'bandpass', freq: 700 + Math.random() * 500, q: 0.8 });
        break;
      case 'splash':
        this.noise(t, 0.34, { gain: 0.11, type: 'highpass', freq: 1600, q: 0.4 });
        this.noise(t + 0.04, 0.22, { gain: 0.07, type: 'bandpass', freq: 900 });
        break;
      case 'impact':
        this.noise(t, 0.16, { gain: 0.12, type: 'lowpass', freq: 380 });
        this.note(midi(34), t, 0.22, { type: 'sine', gain: 0.11, bus: 'sfx' });
        break;
      case 'hit':
        this.noise(t, 0.12, { gain: 0.09, type: 'bandpass', freq: 1200 });
        this.note(midi(48), t, 0.16, { type: 'square', gain: 0.05, bus: 'sfx', filter: 900 });
        break;
      case 'heal':
        [72, 76, 79, 84].forEach((n, i) => this.note(midi(n), t + i * 0.06, 0.28, { type: 'sine', gain: 0.04, bus: 'sfx' }));
        break;
      case 'save':
        [79, 84].forEach((n, i) => this.note(midi(n), t + i * 0.08, 0.4, { type: 'triangle', gain: 0.035, bus: 'sfx' }));
        break;
      case 'spare':
        [60, 64, 67, 72, 76, 79].forEach((n, i) => this.note(midi(n), t + i * 0.07, 0.9, { type: 'sine', gain: 0.035, bus: 'sfx', attack: 0.02, release: 1.1 }));
        break;
      case 'heart':
        this.note(midi(36), t, 0.12, { type: 'sine', gain: 0.1, bus: 'sfx' });
        this.note(midi(33), t + 0.16, 0.16, { type: 'sine', gain: 0.08, bus: 'sfx' });
        break;
      case 'glitch':
        this.note(midi(55), t, 0.3, { type: 'sawtooth', gain: 0.05, bus: 'sfx', detune: -35, filter: 900 });
        this.note(midi(54), t + 0.05, 0.25, { type: 'square', gain: 0.03, bus: 'sfx', detune: 40, filter: 1500 });
        this.noise(t, 0.2, { gain: 0.03, type: 'highpass', freq: 3000 });
        break;
      case 'shatter':
        this.noise(t, 0.4, { gain: 0.12, type: 'highpass', freq: 2400 });
        [84, 88, 91, 96].forEach((n, i) => this.note(midi(n), t + i * 0.02, 0.2, { type: 'sine', gain: 0.025, bus: 'sfx' }));
        break;
      case 'bell':
        this.note(midi(79), t, 1.1, { type: 'sine', gain: 0.05, bus: 'sfx', attack: 0.005, release: 1.2 });
        this.note(midi(86), t, 0.7, { type: 'sine', gain: 0.02, bus: 'sfx' });
        break;
      case 'snow':
        this.noise(t, 0.5, { gain: 0.02, type: 'lowpass', freq: 1200, bus: 'sfx', attack: 0.1 });
        break;
      default: break;
    }
  }
}

const A_MIN = [57, 60, 64, 67, 69, 72, 76, 79];
const D_MIN = [50, 53, 57, 60, 62, 65, 69, 72];

const TRACKS = {
  snow: {
    bpm: 76, len: 64, kind: 'music',
    chords: [
      [57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67],
    ],
    arp: [0, 7, 12, 4, 7, 12, 4, 7],
    bass: [45, 41, 36, 43], bassEvery: 8, bassGain: 0.045,
    melody: { 0: 76, 6: 72, 10: 69, 16: 72, 22: 69, 26: 67, 32: 67, 38: 64, 42: 60, 48: 62, 54: 64, 58: 67 },
    melGain: 0.038, melLen: 5, melType: 'sine',
    padGain: 0.022, padAttack: 0.7, arpGain: 0.038,
    bell: { 16: 84, 48: 79 },
  },
  diner: {
    bpm: 88, len: 64, kind: 'music',
    chords: [
      [53, 57, 60, 64], [57, 60, 64, 67], [50, 53, 57, 60], [55, 59, 62, 65],
    ],
    arp: [0, 4, 7, 11, 7, 4, 7, 12],
    bass: [41, 45, 38, 43], bassEvery: 8, bassGain: 0.04,
    melody: { 4: 72, 12: 76, 20: 79, 28: 76, 36: 74, 44: 72, 52: 69, 60: 72 },
    melGain: 0.03, melLen: 4, melType: 'triangle',
    padGain: 0.02, padAttack: 0.5, arpGain: 0.034, arpType: 'sine', arpLen: 3,
    drums: false,
  },
  storm: {
    bpm: 58, len: 64, kind: 'ambient',
    notes: { 2: 69, 10: 72, 18: 67, 26: 64, 34: 62, 42: 60, 50: 64, 58: 55 },
  },
  battle: {
    bpm: 150, len: 32, kind: 'music',
    chords: [
      [50, 53, 57, 62], [46, 50, 53, 58], [41, 45, 48, 53], [45, 49, 52, 57],
    ],
    arp: [0, 0, 12, 0, 7, 0, 10, 12],
    bass: [38, 38, 41, 38, 43, 38, 34, 33, 38, 38, 41, 43, 46, 43, 41, 38],
    bassEvery: 2, bassGain: 0.06,
    melody: {
      0: 74, 4: 77, 8: 81, 12: 79, 16: 77, 20: 74, 24: 72, 28: 74,
    },
    melGain: 0.045, melLen: 2.2, melType: 'square',
    padGain: 0.014, padAttack: 0.05, arpGain: 0.018, arpType: 'square', arpLen: 1.4,
    drums: true,
  },
  ending: {
    bpm: 66, len: 64, kind: 'music',
    chords: [
      [48, 52, 55, 59], [43, 47, 50, 55], [45, 48, 52, 57], [41, 45, 48, 53],
    ],
    arp: [0, 7, 12, 16, 12, 7, 12, 7],
    bass: [36, 31, 33, 29], bassEvery: 8, bassGain: 0.038,
    melody: { 0: 72, 8: 76, 16: 79, 24: 76, 32: 77, 40: 76, 48: 72, 56: 69 },
    melGain: 0.04, melLen: 6, melType: 'sine',
    padGain: 0.024, padAttack: 0.6, arpGain: 0.03, arpType: 'sine', arpLen: 5,
    bell: { 24: 84, 56: 79 },
  },
};
