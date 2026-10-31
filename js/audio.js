// Tiny WebAudio chiptune engine: blips, hits, and looping area music.
// Everything is synthesized, so the game ships with zero audio assets.

const NOTE_OFFSETS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function freq(name) {
  if (!name) return 0;
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) return 0;
  let semi = NOTE_OFFSETS[m[1]];
  if (m[2] === '#') semi += 1;
  if (m[2] === 'b') semi -= 1;
  const octave = parseInt(m[3], 10);
  const midi = (octave + 1) * 12 + semi;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const TRACKS = {
  title: {
    step: 0.28,
    lead: ['A4', null, 'E5', null, 'D5', null, 'C5', null, 'B4', null, 'C5', null, 'A4', null, null, null],
    bass: ['A2', null, null, null, 'F2', null, null, null, 'C3', null, null, null, 'G2', null, null, null],
    wave: 'triangle',
    vol: 0.05,
  },
  town: {
    step: 0.3,
    lead: ['E4', null, 'G4', 'B4', null, 'A4', 'G4', null, 'D4', null, 'E4', 'G4', null, 'F#4', 'E4', null],
    bass: ['E2', null, null, null, 'C2', null, null, null, 'G2', null, null, null, 'D2', null, null, null],
    wave: 'triangle',
    vol: 0.045,
  },
  diner: {
    step: 0.32,
    lead: ['C5', 'E5', 'G5', null, 'E5', null, 'A4', 'C5', 'B4', 'D5', 'F5', null, 'D5', null, 'G4', 'B4'],
    bass: ['C3', null, null, null, 'A2', null, null, null, 'F2', null, null, null, 'G2', null, null, null],
    wave: 'sine',
    vol: 0.04,
  },
  novella: {
    step: 0.24,
    lead: ['C5', 'E5', 'G5', 'B5', 'A5', 'G5', 'E5', 'G5', 'F5', 'A5', 'C6', 'A5', 'G5', 'E5', 'D5', 'E5'],
    bass: ['C3', null, 'G2', null, 'A2', null, 'E2', null, 'F2', null, 'C3', null, 'G2', null, 'D2', null],
    wave: 'square',
    vol: 0.032,
  },
  battle: {
    step: 0.16,
    lead: ['E5', 'E5', 'G5', 'E5', 'A5', 'G5', 'E5', 'D5', 'E5', 'E5', 'B4', 'D5', 'C5', 'B4', 'A4', 'B4'],
    bass: ['E2', 'E2', 'E2', 'E2', 'C2', 'C2', 'C2', 'C2', 'A2', 'A2', 'A2', 'A2', 'B2', 'B2', 'B2', 'B2'],
    wave: 'square',
    vol: 0.032,
  },
  boss: {
    step: 0.14,
    lead: ['D5', 'F5', 'A5', 'F5', 'G#5', 'A5', 'F5', 'D5', 'D5', 'F5', 'A5', 'C6', 'A5', 'G#5', 'F5', 'E5'],
    bass: ['D2', 'D2', 'D2', 'D2', 'Bb1', 'Bb1', 'Bb1', 'Bb1', 'G1', 'G1', 'G1', 'G1', 'A1', 'A1', 'A1', 'A1'],
    wave: 'sawtooth',
    vol: 0.03,
  },
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.track = null;
    this.timer = null;
    this.step = 0;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return true;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.85;
    if (m) {
      this.pendingTrack = this.track;
      this.stopMusic();
    } else if (this.pendingTrack) {
      const t = this.pendingTrack;
      this.pendingTrack = null;
      this.track = null;
      this.playMusic(t);
    }
  }

  tone(f, dur = 0.08, type = 'square', vol = 0.05, when = 0, slideTo = null) {
    if (!this.ensure() || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(dur = 0.12, vol = 0.08, when = 0) {
    if (!this.ensure() || this.muted) return;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(this.ctx.currentTime + when);
  }

  blip() {
    this.tone(620 + Math.random() * 120, 0.035, 'square', 0.018);
  }

  move() {
    this.tone(440, 0.05, 'square', 0.03);
  }

  select() {
    this.tone(660, 0.06, 'square', 0.04);
    this.tone(990, 0.07, 'square', 0.03, 0.05);
  }

  cancel() {
    this.tone(320, 0.07, 'square', 0.03, 0, 220);
  }

  hit() {
    this.noise(0.16, 0.12);
    this.tone(120, 0.14, 'sawtooth', 0.05, 0, 60);
  }

  hurt() {
    this.tone(180, 0.22, 'square', 0.06, 0, 70);
    this.noise(0.2, 0.07);
  }

  heal() {
    this.tone(523, 0.12, 'sine', 0.05);
    this.tone(659, 0.12, 'sine', 0.05, 0.09);
    this.tone(784, 0.2, 'sine', 0.05, 0.18);
  }

  smash() {
    this.noise(0.5, 0.22);
    this.tone(90, 0.4, 'sawtooth', 0.07, 0, 30);
  }

  encounter() {
    this.tone(330, 0.08, 'square', 0.05);
    this.tone(415, 0.08, 'square', 0.05, 0.09);
    this.tone(330, 0.14, 'square', 0.05, 0.18);
    this.tone(247, 0.3, 'sawtooth', 0.05, 0.32);
  }

  playMusic(name) {
    if (this.muted) {
      this.track = name;
      return;
    }
    if (!this.ensure()) return;
    if (this.track === name) return;
    this.stopMusic();
    this.track = name;
    this.step = 0;
    const def = TRACKS[name];
    if (!def) return;
    const tick = () => {
      if (this.track !== name || this.muted) return;
      const i = this.step % def.lead.length;
      const lead = def.lead[i];
      const bass = def.bass[i];
      if (lead) this.tone(freq(lead), def.step * 0.9, def.wave, def.vol, 0, freq(lead) * 0.995);
      if (bass) this.tone(freq(bass), def.step * 1.7, 'triangle', def.vol * 1.15);
      this.step++;
      this.timer = setTimeout(tick, def.step * 1000);
    };
    tick();
  }

  stopMusic() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.track = null;
  }
}

export const audio = new AudioEngine();
