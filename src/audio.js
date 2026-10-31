const NOTE_NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function midi(name) {
  if (typeof name === "number") return name;
  const match = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!match) return 60;
  let value = NOTE_NAMES[match[1]] + (match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0);
  value += (parseInt(match[3], 10) + 1) * 12;
  return value;
}

function freq(note) {
  return 440 * Math.pow(2, (midi(note) - 69) / 12);
}

const TRACKS = {
  title: {
    bpm: 68,
    bars: 8,
    progression: [
      [45, [57, 60, 64]],
      [41, [53, 57, 60]],
      [48, [55, 60, 64]],
      [43, [55, 59, 62]],
      [45, [57, 60, 64]],
      [41, [53, 57, 60]],
      [43, [55, 59, 62]],
      [40, [52, 55, 59]],
    ],
    melody: [76, null, null, 72, null, 69, null, 72, 74, null, null, 69, null, 65, null, 69, 72, null, null, 67, null, 64, null, 67, 71, null, null, 67, null, 62, null, 67],
    padGain: 0.026,
    bassGain: 0.022,
    arpGain: 0.014,
    melodyGain: 0.028,
    drums: false,
    arpEvery: 4,
  },
  town: {
    bpm: 94,
    bars: 8,
    progression: [
      [50, [62, 65, 69]],
      [46, [58, 62, 65]],
      [53, [60, 65, 69]],
      [48, [60, 64, 67]],
      [50, [62, 65, 69]],
      [46, [58, 62, 65]],
      [43, [58, 62, 65]],
      [45, [61, 64, 69]],
    ],
    melody: [74, null, 72, null, 69, null, 65, null, 67, null, 69, null, 72, null, 74, null, 72, null, 69, null, 67, null, 64, null, 65, null, 67, null, 69, null, 72, null],
    padGain: 0.018,
    bassGain: 0.026,
    arpGain: 0.016,
    melodyGain: 0.026,
    drums: true,
    arpEvery: 2,
  },
  diner: {
    bpm: 88,
    bars: 8,
    progression: [
      [53, [60, 65, 69]],
      [48, [60, 64, 67]],
      [50, [62, 65, 69]],
      [46, [58, 62, 65]],
      [53, [60, 65, 69]],
      [48, [60, 64, 67]],
      [43, [58, 62, 65]],
      [45, [61, 64, 69]],
    ],
    melody: [72, null, 69, null, 65, null, 69, null, 72, null, 76, null, 72, null, 69, null, 74, null, 72, null, 69, null, 65, null, 67, null, 69, null, 72, null, 69, null],
    padGain: 0.016,
    bassGain: 0.023,
    arpGain: 0.014,
    melodyGain: 0.022,
    drums: true,
    arpEvery: 2,
  },
  battle: {
    bpm: 152,
    bars: 8,
    progression: [
      [50, [62, 65, 69]],
      [46, [58, 62, 65]],
      [43, [58, 62, 65]],
      [45, [61, 64, 69]],
      [50, [62, 65, 69]],
      [46, [58, 62, 65]],
      [41, [57, 60, 64]],
      [45, [61, 64, 69]],
    ],
    melody: [74, 77, 81, 77, 74, 72, 69, 72, 74, 77, 81, 84, 81, 77, 74, 72, 70, 74, 77, 74, 70, 67, 65, 67, 69, 72, 76, 72, 69, 65, 62, 65],
    padGain: 0.014,
    bassGain: 0.032,
    arpGain: 0.018,
    melodyGain: 0.023,
    drums: true,
    arpEvery: 1,
    drive: true,
  },
  warm: {
    bpm: 78,
    bars: 8,
    progression: [
      [53, [60, 65, 69]],
      [48, [60, 64, 67]],
      [50, [62, 65, 69]],
      [46, [58, 62, 65]],
      [53, [60, 65, 69]],
      [48, [60, 64, 67]],
      [43, [58, 62, 65]],
      [45, [61, 64, 69]],
    ],
    melody: [69, null, 72, null, 77, null, 76, null, 72, null, 69, null, 67, null, 69, null, 74, null, 72, null, 69, null, 65, null, 67, null, 69, null, 72, null, 77, null],
    padGain: 0.022,
    bassGain: 0.02,
    arpGain: 0.012,
    melodyGain: 0.027,
    drums: false,
    arpEvery: 4,
  },
};

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.noiseBuffer = null;
    this.trackName = null;
    this.track = null;
    this.timer = null;
    this.step = 0;
    this.nextStepTime = 0;
    this.muted = false;
    this.lastBlip = 0;
    this.pendingTrack = null;
  }

  ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.42;
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 18;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.22;
      this.master.connect(compressor);
      compressor.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.74;
      this.musicGain.connect(this.master);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.9;
      this.sfxGain.connect(this.master);

      const length = Math.floor(this.ctx.sampleRate * 1.2);
      this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;

      const pending = this.pendingTrack;
      this.pendingTrack = null;
      if (pending) this.playTrack(pending);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return true;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(muted ? 0 : 0.42, this.ctx.currentTime, 0.03);
    }
  }

  playTrack(name) {
    if (!this.ctx) {
      this.pendingTrack = name;
      return;
    }
    if (!this.ensure()) return;
    if (this.trackName === name) return;
    this.trackName = name;
    this.track = TRACKS[name] || null;
    this.step = 0;
    this.nextStepTime = this.ctx.currentTime + 0.08;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (!this.track) return;
    this.timer = setInterval(() => this._schedule(), 30);
    this._schedule();
  }

  stopMusic() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.trackName = null;
    this.track = null;
  }

  _schedule() {
    if (!this.ctx || !this.track) return;
    const stepDur = 60 / this.track.bpm / 4;
    while (this.nextStepTime < this.ctx.currentTime + 0.16) {
      this._playStep(this.step, this.nextStepTime, stepDur);
      this.step = (this.step + 1) % (this.track.bars * 16);
      this.nextStepTime += stepDur;
    }
  }

  _playStep(step, time, stepDur) {
    const track = this.track;
    const bar = Math.floor(step / 16) % track.bars;
    const inBar = step % 16;
    const [root, chord] = track.progression[bar];

    if (inBar === 0) {
      chord.forEach((note, index) => {
        this._note("triangle", note, time, stepDur * 15, track.padGain * (index === 0 ? 1 : 0.72), this.musicGain, true);
      });
      this._note("sine", root - 12, time, stepDur * 15, track.padGain * 1.5, this.musicGain, true);
    }

    if ([0, 3, 6, 8, 11, 14].includes(inBar)) {
      this._note(track.drive ? "sawtooth" : "square", root - 12, time, stepDur * 1.5, track.bassGain, this.musicGain);
    }

    if (inBar % track.arpEvery === 0) {
      const arp = chord[(inBar / track.arpEvery) % chord.length] + 12;
      this._note("triangle", arp, time, stepDur * 1.3, track.arpGain, this.musicGain);
    }

    const melodyNote = track.melody[(bar * 16 + inBar) % track.melody.length];
    if (melodyNote !== null && melodyNote !== undefined) {
      this._note(track.drive ? "square" : "triangle", melodyNote, time, stepDur * (track.drive ? 1.1 : 2.2), track.melodyGain, this.musicGain);
    }

    if (track.drums) {
      if (inBar === 0 || inBar === 8) this._drum("kick", time, track.drive ? 0.09 : 0.055);
      if (inBar === 4 || inBar === 12) this._drum("snare", time, track.drive ? 0.045 : 0.026);
      if (inBar % 2 === 1) this._drum("hat", time, track.drive ? 0.016 : 0.009);
    }
  }

  _note(type, note, time, duration, gain, destination, soft = false) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq(note), time);
    if (soft) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, time);
      osc.connect(filter);
      filter.connect(env);
    } else {
      osc.connect(env);
    }
    env.connect(destination || this.sfxGain);
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), time + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.start(time);
    osc.stop(time + duration + 0.04);
  }

  _drum(kind, time, gain) {
    if (!this.ctx) return;
    if (kind === "kick") {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(130, time);
      osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);
      env.gain.setValueAtTime(gain, time);
      env.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
      osc.connect(env);
      env.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.18);
      return;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = kind === "hat" ? "highpass" : "bandpass";
    filter.frequency.setValueAtTime(kind === "hat" ? 7200 : 1800, time);
    filter.Q.value = kind === "hat" ? 0.7 : 1.4;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(gain, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + (kind === "hat" ? 0.035 : 0.11));
    source.connect(filter);
    filter.connect(env);
    env.connect(this.musicGain);
    source.start(time);
    source.stop(time + 0.13);
  }

  blip(pitch = 620, gain = 0.015) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    if (now - this.lastBlip < 0.035) return;
    this.lastBlip = now;
    this._note("square", Math.round(69 + Math.log2(pitch / 440) * 12), now, 0.035, gain, this.sfxGain);
  }

  sfx(name) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const note = (n, when, dur, gain, type = "square") => {
      this._note(type, n, t + when, dur, gain, this.sfxGain);
    };
    switch (name) {
      case "confirm":
        note(76, 0, 0.06, 0.035);
        note(83, 0.055, 0.09, 0.032);
        break;
      case "cancel":
        note(64, 0, 0.06, 0.03);
        note(57, 0.05, 0.08, 0.026);
        break;
      case "select":
        note(72, 0, 0.045, 0.022, "triangle");
        break;
      case "door":
        this._note("sine", 40, t, 0.18, 0.06, this.sfxGain);
        this._noise(t, 0.09, 0.03, 500);
        break;
      case "splash":
        this._noise(t, 0.32, 0.075, 1500);
        this._noise(t + 0.04, 0.2, 0.035, 2600);
        break;
      case "hit":
        this._noise(t, 0.16, 0.07, 900);
        this._note("sawtooth", 38, t, 0.16, 0.05, this.sfxGain);
        break;
      case "graze":
        note(88, 0, 0.03, 0.01, "triangle");
        break;
      case "heal":
        note(72, 0, 0.09, 0.03, "triangle");
        note(76, 0.08, 0.09, 0.03, "triangle");
        note(79, 0.16, 0.15, 0.03, "triangle");
        break;
      case "spare":
        note(72, 0, 0.2, 0.03, "sine");
        note(79, 0.12, 0.25, 0.028, "sine");
        note(84, 0.25, 0.4, 0.026, "sine");
        break;
      case "battle":
        this._note("sawtooth", 33, t, 0.6, 0.06, this.sfxGain);
        this._noise(t, 0.35, 0.04, 600);
        break;
      case "mercy":
        note(76, 0, 0.1, 0.025, "triangle");
        note(81, 0.08, 0.14, 0.022, "triangle");
        break;
      case "step":
        this._noise(t, 0.045, 0.008, 1800);
        break;
      default:
        break;
    }
  }

  _noise(time, duration, gain, frequency) {
    if (!this.ctx) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(frequency, time);
    filter.Q.value = 0.9;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(gain, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter);
    filter.connect(env);
    env.connect(this.sfxGain);
    source.start(time);
    source.stop(time + duration + 0.02);
  }
}
