// input.js — keyboard, touch joystick, optional tilt, iOS motion permission.
const KEY_ACTIONS = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'confirm', Enter: 'confirm', Space: 'confirm', KeyJ: 'confirm',
  KeyX: 'cancel', Backspace: 'cancel', KeyK: 'cancel',
  ShiftLeft: 'run', ShiftRight: 'run',
  Escape: 'pause', KeyP: 'pause',
  Digit1: 'one', Digit2: 'two', Digit3: 'three', Digit4: 'four',
};

const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab']);

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = new Set();
    this.pressed = new Set();
    this.taps = [];
    this.stick = { x: 0, y: 0, active: false, id: null };
    this.touchVector = { x: 0, y: 0 };
    this.tilt = {
      enabled: false,
      status: 'off',
      raw: null,
      base: null,
      samples: [],
      calibrating: false,
      invert: false,
      hasSensor: false,
      handler: null,
      lastEvent: 0,
    };
    this.touchMode = 'auto';
    this.hasTouch = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
      || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    this.repeat = {};
    this.lastStickDir = null;
    this.stickRepeat = 0;
    this._bindKeyboard();
    this._bindTouch();
    this._bindCanvas();
    window.addEventListener('keydown', () => this._ensureAudioHint?.(), { once: true });
    window.addEventListener('pointerdown', () => this._ensureAudioHint?.(), { once: true });
  }

  onFirstGesture(fn) { this._ensureAudioHint = fn; }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      const action = KEY_ACTIONS[e.code];
      if (!action) return;
      if (PREVENT.has(e.code) && e.target === document.body) e.preventDefault();
      if (!e.repeat) {
        this.pressed.add(action);
        this.repeat[action] = 0.34;
      }
      this.down.add(action);
    });
    window.addEventListener('keyup', (e) => {
      const action = KEY_ACTIONS[e.code];
      if (action) this.down.delete(action);
    });
    window.addEventListener('blur', () => {
      this.down.clear();
      this.pressed.clear();
      this.touchVector.x = 0;
      this.touchVector.y = 0;
    });
  }

  _bindCanvas() {
    const map = (e) => {
      const r = this.canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * 480, y: ((e.clientY - r.top) / r.height) * 270 };
    };
    this.canvas.addEventListener('pointerdown', (e) => {
      const p = map(e);
      this.taps.push({ ...p, id: e.pointerId });
      if (this.taps.length > 4) this.taps.shift();
    });
  }

  _bindTouch() {
    const stick = document.getElementById('stick');
    const knob = document.getElementById('stick-knob');
    const btnA = document.getElementById('btn-a');
    const btnB = document.getElementById('btn-b');
    if (!stick || !knob || !btnA || !btnB) return;
    this.stickEl = stick;
    this.knobEl = knob;

    const setFromEvent = (e) => {
      const r = stick.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = (e.clientX - cx) / (r.width * 0.36);
      let dy = (e.clientY - cy) / (r.height * 0.36);
      const mag = Math.hypot(dx, dy);
      if (mag > 1) { dx /= mag; dy /= mag; }
      this.stick.x = dx;
      this.stick.y = dy;
      this.touchVector.x = Math.abs(dx) > 0.14 ? dx : 0;
      this.touchVector.y = Math.abs(dy) > 0.14 ? dy : 0;
      knob.style.transform = `translate(calc(-50% + ${dx * 38}%), calc(-50% + ${dy * 38}%))`;
    };
    stick.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.stick.active = true;
      this.stick.id = e.pointerId;
      stick.setPointerCapture(e.pointerId);
      setFromEvent(e);
    });
    stick.addEventListener('pointermove', (e) => {
      if (!this.stick.active || e.pointerId !== this.stick.id) return;
      e.preventDefault();
      setFromEvent(e);
    });
    const end = (e) => {
      if (e.pointerId !== this.stick.id) return;
      this.stick.active = false;
      this.stick.id = null;
      this.stick.x = 0;
      this.stick.y = 0;
      this.touchVector.x = 0;
      this.touchVector.y = 0;
      knob.style.transform = 'translate(-50%, -50%)';
    };
    stick.addEventListener('pointerup', end);
    stick.addEventListener('pointercancel', end);
    stick.addEventListener('lostpointercapture', end);

    const press = (action, el) => {
      el.classList.add('active');
      this.pressed.add(action);
      this.down.add(action);
      setTimeout(() => {
        el.classList.remove('active');
        this.down.delete(action);
      }, 90);
    };
    btnA.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); press('confirm', btnA); });
    btnB.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); press('cancel', btnB); });
    btnA.addEventListener('contextmenu', (e) => e.preventDefault());
    btnB.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setTouchMode(mode) {
    this.touchMode = mode;
    this.refreshTouchVisibility();
  }

  touchAllowed() {
    return this.touchMode === 'on' || (this.touchMode === 'auto' && this.hasTouch);
  }

  refreshTouchVisibility(force = null) {
    const el = document.getElementById('touch-controls');
    if (!el) return;
    const show = force === null ? this.touchAllowed() : force;
    el.classList.toggle('hidden', !show);
  }

  setTouchVisibleForScene(show) {
    const el = document.getElementById('touch-controls');
    if (!el) return;
    if (!this.touchAllowed()) { el.classList.add('hidden'); return; }
    el.classList.toggle('hidden', !show);
  }

  isDown(action) {
    if (this.down.has(action)) return true;
    const s = 0.5;
    if (action === 'left') return this.touchVector.x < -s;
    if (action === 'right') return this.touchVector.x > s;
    if (action === 'up') return this.touchVector.y < -s;
    if (action === 'down') return this.touchVector.y > s;
    return false;
  }

  pressedAction(action) {
    return this.pressed.has(action);
  }

  consume(action) {
    if (!this.pressed.has(action)) return false;
    this.pressed.delete(action);
    return true;
  }

  get axis() {
    let x = 0, y = 0;
    if (this.down.has('left')) x -= 1;
    if (this.down.has('right')) x += 1;
    if (this.down.has('up')) y -= 1;
    if (this.down.has('down')) y += 1;
    if (x || y) {
      const m = Math.hypot(x, y) || 1;
      return { x: x / m, y: y / m };
    }
    if (Math.hypot(this.touchVector.x, this.touchVector.y) > 0.08) {
      const m = Math.hypot(this.touchVector.x, this.touchVector.y) || 1;
      const mag = Math.min(1, m);
      return { x: (this.touchVector.x / m) * mag, y: (this.touchVector.y / m) * mag };
    }
    if (this.tilt.enabled && this.tilt.raw && this.tilt.base) {
      const t = this._tiltVector();
      if (Math.hypot(t.x, t.y) > 0.1) return t;
    }
    return { x: 0, y: 0 };
  }

  update(dt) {
    // held direction repeat for menus
    for (const dir of ['up', 'down', 'left', 'right']) {
      if (this.down.has(dir)) {
        this.repeat[dir] = (this.repeat[dir] ?? 0) - dt;
        if (this.repeat[dir] <= 0 && !this.pressed.has(dir)) {
          this.pressed.add(dir);
          this.repeat[dir] = 0.13;
        }
      } else {
        this.repeat[dir] = 0.34;
      }
    }
    // joystick tap-repeat
    const sx = this.touchVector.x, sy = this.touchVector.y;
    if (Math.hypot(sx, sy) > 0.62) {
      const dir = Math.abs(sx) > Math.abs(sy) ? (sx > 0 ? 'right' : 'left') : (sy > 0 ? 'down' : 'up');
      if (dir !== this.lastStickDir) {
        this.pressed.add(dir);
        this.lastStickDir = dir;
        this.stickRepeat = 0.24;
      } else {
        this.stickRepeat -= dt;
        if (this.stickRepeat <= 0) {
          this.pressed.add(dir);
          this.stickRepeat = 0.13;
        }
      }
    } else {
      this.lastStickDir = null;
    }
    if (this.tilt.enabled) {
      this._tiltVector();
    }
  }

  endFrame() {
    this.pressed.clear();
    this.taps.length = 0;
  }

  _orientationAngle() {
    if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
    if (typeof window.orientation === 'number') return window.orientation;
    return 0;
  }

  _tiltVector() {
    const t = this.tilt;
    if (!t.raw || !t.base) return { x: 0, y: 0 };
    const angle = ((this._orientationAngle() % 360) + 360) % 360;
    let rx, ry;
    if (angle === 90) { rx = t.raw.beta; ry = -t.raw.gamma; }
    else if (angle === 180) { rx = -t.raw.gamma; ry = -t.raw.beta; }
    else if (angle === 270) { rx = -t.raw.beta; ry = t.raw.gamma; }
    else { rx = t.raw.gamma; ry = t.raw.beta; }
    let dx = (rx - t.base.x) / 20;
    let dy = (ry - t.base.y) / 20;
    if (t.invert) { dx = -dx; dy = -dy; }
    const dead = 0.14;
    const mag = Math.hypot(dx, dy);
    if (mag < dead) return { x: 0, y: 0 };
    const scale = Math.min(1, (mag - dead) / (1 - dead));
    return { x: (dx / mag) * scale, y: (dy / mag) * scale };
  }

  _motionHandler(e) {
    if (e.beta == null || e.gamma == null) return;
    const t = this.tilt;
    t.raw = { beta: e.beta, gamma: e.gamma };
    t.hasSensor = true;
    t.lastEvent = performance.now();
    if (t.calibrating) {
      t.samples.push({ beta: e.beta, gamma: e.gamma });
      if (t.samples.length >= 12) {
        t.base = {
          x: t.samples.reduce((s, v) => s + v.gamma, 0) / t.samples.length,
          y: t.samples.reduce((s, v) => s + v.beta, 0) / t.samples.length,
        };
        t.calibrating = false;
        t.status = 'on';
      }
    }
  }

  async enableTilt() {
    const t = this.tilt;
    if (t.enabled) { t.status = 'on'; return 'on'; }
    const DOE = window.DeviceOrientationEvent;
    if (!DOE) { t.status = 'unsupported'; return 'unsupported'; }
    if (typeof DOE.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission();
        if (result !== 'granted') { t.status = 'denied'; return 'denied'; }
      } catch {
        t.status = 'denied';
        return 'denied';
      }
    }
    t.handler = (e) => this._motionHandler(e);
    window.addEventListener('deviceorientation', t.handler, true);
    t.enabled = true;
    t.calibrating = true;
    t.samples = [];
    t.status = 'calibrating';
    t.hasSensor = false;
    setTimeout(() => {
      if (t.calibrating && t.samples.length === 0) {
        t.status = 'nosensor';
      }
    }, 2500);
    return 'on';
  }

  disableTilt() {
    const t = this.tilt;
    if (t.handler) window.removeEventListener('deviceorientation', t.handler, true);
    t.enabled = false;
    t.raw = null;
    t.base = null;
    t.calibrating = false;
    t.status = 'off';
  }

  calibrateTilt() {
    const t = this.tilt;
    if (!t.enabled) return;
    t.base = t.raw ? { x: t.raw.gamma, y: t.raw.beta } : null;
    t.calibrating = false;
    t.status = 'on';
    if (!t.base) {
      t.calibrating = true;
      t.samples = [];
      t.status = 'calibrating';
    }
  }

  setInvert(v) { this.tilt.invert = !!v; }
}
