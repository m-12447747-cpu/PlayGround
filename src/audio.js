/* Tiny procedural score and sound effects. No audio files required. */

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const random = (a, b) => a + Math.random() * (b - a);

const THEMES = {
  title: {
    dur: 4.4,
    chords: [
      [50, 57, 62, 65, 69],
      [46, 53, 58, 62, 65],
      [41, 48, 53, 57, 60],
      [48, 55, 60, 64, 67],
    ],
    bass: [38, 34, 29, 36],
    melody: [74, 77, 81, 84, 81, 77, 76, 74, 72, 74, 77, 81],
    wind: 0.034,
    pad: 0.022,
  },
  street: {
    dur: 4.4,
    chords: [
      [50, 57, 60, 64, 65],
      [46, 53, 57, 60, 62],
      [41, 48, 52, 55, 57],
      [48, 55, 59, 62, 64],
    ],
    bass: [38, 34, 29, 36],
    melody: [74, 77, 81, 79, 77, 74, 72, 74, 76, 72, 69, 72],
    wind: 0.04,
    pad: 0.02,
  },
  bathroom: {
    dur: 5.2,
    chords: [
      [38, 45, 50, 53],
      [36, 43, 48, 51],
      [34, 41, 46, 49],
      [38, 45, 50, 53],
    ],
    bass: [26, 24, 22, 26],
    melody: [65, 69, 63, 58],
    wind: 0.012,
    pad: 0.018,
  },
  battle: {
    dur: 2.15,
    chords: [
      [50, 53, 57, 62],
      [51, 54, 58, 63],
      [46, 50, 53, 58],
      [45, 49, 52, 57],
    ],
    bass: [26, 27, 22, 21],
    melody: [86, 81, 77, 74, 73, 77, 81, 84],
    wind: 0.006,
    pad: 0.017,
  },
  ending: {
    dur: 4.6,
    chords: [
      [41, 48, 53, 57, 60],
      [48, 55, 60, 64, 67],
      [50, 57, 62, 65, 69],
      [46, 53, 58, 62, 65],
    ],
    bass: [29, 36, 38, 34],
    melody: [77, 81, 84, 86, 84, 81, 79, 77, 76, 77, 81, 84],
    wind: 0.028,
    pad: 0.022,
  },
};

export class GameAudio {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem("oppidan-muted") === "1";
    this.theme = "title";
    this.started = false;
    this.bar = 0;
    this.nextBar = 0;
    this.timer = null;
    this.lastBlip = 0;
  }

  async init() {
    if (this.started) {
      if (this.ctx?.state === "suspended") await this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      await this.ctx.resume();
      this.started = true;
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.72;
      this.master.connect(this.ctx.destination);

      this.dry = this.ctx.createGain();
      this.dry.gain.value = 1;
      this.dry.connect(this.master);

      this.reverb = this.ctx.createConvolver();
      this.reverb.buffer = this.makeImpulse(2.3, 2.8);
      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.value = 0.26;
      this.reverb.connect(this.reverbGain);
      this.reverbGain.connect(this.master);

      this.noiseBuffer = this.makeNoise(2.4);
      this.startWind();
      this.startHum();
      this.nextBar = this.ctx.currentTime + 0.12;
      this.timer = setInterval(() => this.tick(), 120);
    } catch (_) {
      this.started = false;
    }
  }

  makeImpulse(seconds, decay) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const buffer = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return buffer;
  }

  makeNoise(seconds) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const buffer = this.ctx.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  startWind() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.7;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.034;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.dry);
    src.start();
    this.wind = gain;
    this.windFilter = filter;

    const hissSrc = this.ctx.createBufferSource();
    hissSrc.buffer = this.noiseBuffer;
    hissSrc.loop = true;
    const hiss = this.ctx.createBiquadFilter();
    hiss.type = "bandpass";
    hiss.frequency.value = 1800;
    hiss.Q.value = 0.5;
    const hissGain = this.ctx.createGain();
    hissGain.gain.value = 0.006;
    hissSrc.connect(hiss);
    hiss.connect(hissGain);
    hissGain.connect(this.dry);
    hissSrc.start();
    this.hiss = hissGain;
  }

  startHum() {
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 120;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 260;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.dry);
    osc.start();
    this.hum = gain;

    const wob = this.ctx.createOscillator();
    wob.frequency.value = 7.3;
    const wobGain = this.ctx.createGain();
    wobGain.gain.value = 0.004;
    wob.connect(wobGain);
    wobGain.connect(gain.gain);
    wob.start();
    this.humWob = wob;
  }

  setTheme(theme) {
    if (!THEMES[theme]) theme = "street";
    this.theme = theme;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const t = THEMES[theme];
    if (this.wind) this.wind.gain.setTargetAtTime(t.wind, now, 1.5);
    if (this.hiss) this.hiss.gain.setTargetAtTime(theme === "battle" ? 0.002 : 0.006, now, 1);
    if (this.hum) this.hum.gain.setTargetAtTime(theme === "bathroom" ? 0.015 : theme === "battle" ? 0.006 : 0, now, 0.8);
    this.nextBar = Math.min(this.nextBar, now + 0.4);
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem("oppidan-muted", this.muted ? "1" : "0");
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.72, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  connectVoice(node, send = 0.4, pan = 0) {
    let out = node;
    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = pan;
      out.connect(panner);
      out = panner;
    }
    out.connect(this.dry);
    if (send > 0) {
      const s = this.ctx.createGain();
      s.gain.value = send;
      out.connect(s);
      s.connect(this.reverb);
    }
  }

  tick() {
    if (!this.ctx || this.ctx.state !== "running") return;
    const horizon = this.ctx.currentTime + 0.35;
    let guard = 0;
    while (this.nextBar < horizon && guard++ < 6) {
      const theme = THEMES[this.theme];
      this.scheduleBar(this.theme, theme, this.nextBar, this.bar);
      this.nextBar += theme.dur;
      this.bar++;
    }
  }

  scheduleBar(themeName, theme, when, index) {
    const chord = theme.chords[index % theme.chords.length];
    const bass = theme.bass[index % theme.bass.length];
    const barDur = theme.dur;

    if (themeName === "battle") {
      this.scheduleBattle(theme, chord, bass, when, barDur, index);
      return;
    }

    // Warm pad.
    chord.forEach((note, i) => {
      this.pad(note, when + i * 0.02, barDur * 0.94, theme.pad * (i === 0 ? 1.2 : 1), 0.1);
    });

    // Low root.
    this.bassNote(bass, when, barDur * 0.84, 0.03);

    if (themeName === "bathroom") {
      if (index % 2 === 0) {
        this.bell(theme.melody[index % theme.melody.length], when + 1.7, 0.035, 0.6, 0.72);
      }
      if (Math.random() < 0.42) this.drip(when + random(0.4, barDur - 0.4));
      return;
    }

    // Sparse music-box melody.
    const melody = theme.melody;
    const notes = themeName === "ending" ? 4 : 3;
    for (let i = 0; i < notes; i++) {
      if (Math.random() < 0.32 && themeName !== "ending") continue;
      const note = melody[(index * 3 + i * 2) % melody.length];
      const at = when + (i + 0.45) * (barDur / (notes + 1)) + random(-0.05, 0.05);
      this.bell(note, at, themeName === "title" ? 0.022 : 0.026, 0.2, 0.64);
    }
  }

  scheduleBattle(theme, chord, bass, when, barDur, index) {
    // Pulse.
    const pulses = 8;
    for (let i = 0; i < pulses; i++) {
      const at = when + (barDur / pulses) * i;
      const gain = i % 4 === 0 ? 0.055 : 0.03;
      const o = this.ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(midi(bass + (i % 2 ? 12 : 0)), at);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(gain, at + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
      o.connect(g);
      this.connectVoice(g, 0.1, i % 2 ? 0.12 : -0.12);
      o.start(at);
      o.stop(at + 0.2);
    }

    // Dissonant pad, every bar.
    chord.forEach((note, i) => {
      this.pad(note + 12, when + i * 0.015, barDur * 0.92, theme.pad * 0.7, 0.04);
    });

    // Metallic motif.
    if (index % 2 === 0) {
      this.bell(theme.melody[index % theme.melody.length], when + barDur * 0.55, 0.02, 0.08, 0.5);
      this.bell(theme.melody[(index + 2) % theme.melody.length], when + barDur * 0.78, 0.016, -0.15, 0.5);
    }
  }

  pad(note, when, dur, gain, attack) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = midi(note);
    o.detune.value = random(-4, 4);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(gain, when + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    this.connectVoice(g, 0.45, random(-0.25, 0.25));
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  bassNote(note, when, dur, gain) {
    const o = this.ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = midi(note);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    this.connectVoice(g, 0.15);
    o.start(when);
    o.stop(when + dur);
  }

  bell(note, when, gain, pan = 0, decay = 0.7) {
    const o = this.ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = midi(note);
    const o2 = this.ctx.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = midi(note + 12);
    const g = this.ctx.createGain();
    const d = 1.1 + decay * 1.6;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + d);
    o.connect(g);
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.23;
    o2.connect(g2);
    g2.connect(g);
    this.connectVoice(g, 0.7, pan);
    o.start(when);
    o2.start(when);
    o.stop(when + d + 0.05);
    o2.stop(when + d + 0.05);
  }

  drip(when) {
    const o = this.ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(880, when);
    o.frequency.exponentialRampToValueAtTime(340, when + 0.09);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.015, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.14);
    o.connect(g);
    this.connectVoice(g, 0.5, random(-0.4, 0.4));
    o.start(when);
    o.stop(when + 0.16);
  }

  /* SFX */
  blip(who = "srif") {
    if (!this.ctx || this.ctx.state !== "running" || this.muted) return;
    const now = this.ctx.currentTime;
    if (now - this.lastBlip < 0.035) return;
    this.lastBlip = now;
    const base = {
      srif: 380,
      chris: 460,
      mich: 300,
      asgore: 190,
      toriel: 340,
      mirror: 150,
      narrator: 250,
    }[who] || 340;
    const o = this.ctx.createOscillator();
    o.type = who === "mirror" ? "sawtooth" : "square";
    o.frequency.value = base + random(-16, 16);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.012, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    o.connect(g);
    this.connectVoice(g, 0.1);
    o.start(now);
    o.stop(now + 0.04);
  }

  noise(duration = 0.08, gain = 0.05, type = "lowpass", freq = 900) {
    if (!this.ctx || this.ctx.state !== "running" || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter);
    filter.connect(g);
    this.connectVoice(g, 0.1);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  tone(freq, duration = 0.18, type = "sine", gain = 0.04, slide = 0, when = 0) {
    if (!this.ctx || this.ctx.state !== "running" || this.muted) return;
    const now = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + duration);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.connect(g);
    this.connectVoice(g, 0.35);
    o.start(now);
    o.stop(now + duration + 0.02);
  }

  select() {
    this.tone(620, 0.07, "square", 0.018, 80);
  }

  confirm() {
    this.tone(523.25, 0.13, "triangle", 0.032);
    this.tone(783.99, 0.22, "triangle", 0.026, 0, 0.07);
  }

  back() {
    this.tone(360, 0.11, "triangle", 0.02, -80);
  }

  step() {
    this.noise(0.055, 0.025, "lowpass", 520);
  }

  splash() {
    this.noise(0.24, 0.09, "highpass", 1200);
    this.tone(500, 0.15, "sine", 0.025, 420);
  }

  thud() {
    this.noise(0.1, 0.09, "lowpass", 180);
    this.tone(86, 0.28, "sine", 0.09, -28);
  }

  glass() {
    this.noise(0.16, 0.04, "highpass", 2200);
    this.tone(1260, 0.42, "triangle", 0.022, 300);
    this.tone(1860, 0.26, "sine", 0.014, -120, 0.02);
  }

  heart() {
    this.tone(740, 0.18, "sine", 0.026);
    this.tone(988, 0.3, "sine", 0.022, 0, 0.09);
  }

  heal() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.25, "sine", 0.02, 0, i * 0.06));
  }

  shatter() {
    this.noise(0.55, 0.11, "highpass", 1800);
    for (let i = 0; i < 5; i++) this.tone(random(900, 2100), 0.38, "triangle", 0.015, random(-300, 300), i * 0.035);
  }

  deny() {
    this.tone(180, 0.14, "square", 0.025);
    this.tone(150, 0.18, "square", 0.022, 0, 0.09);
  }

  open() {
    this.noise(0.18, 0.03, "bandpass", 700);
    this.tone(392, 0.22, "sine", 0.02, 120);
  }

  shut() {
    this.noise(0.22, 0.035, "lowpass", 260);
  }
}
