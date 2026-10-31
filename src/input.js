const KEY_ACTIONS = {
  ArrowUp: "up", KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
  KeyZ: "confirm", Enter: "confirm", Space: "confirm",
  KeyX: "cancel", Escape: "cancel", Backspace: "cancel",
  KeyM: "mute",
};

const STICK_DEADZONE = 0.16;
const TILT_DEADZONE = 3.2;
const TILT_MAX = 22;

function deadzone(value, dead, max) {
  const sign = Math.sign(value) || 1;
  const magnitude = Math.abs(value);
  if (magnitude <= dead) return 0;
  return sign * Math.min(1, (magnitude - dead) / (max - dead));
}

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.tap = null;
    this.stick = { x: 0, y: 0, active: false };
    this.stickPointer = null;
    this.tilt = {
      enabled: false,
      supported: typeof DeviceOrientationEvent !== "undefined",
      x: 0,
      y: 0,
      baseBeta: null,
      baseGamma: null,
      handler: null,
    };
    this.onAnyInput = null;
    this.onMute = null;
    this._stickRect = null;
    this._stickRadius = 30;
    this._bindKeyboard();
    this._bindCanvasTap();
    this._bindTouchButtons();
    this._bindStick();
    this._bindVisibility();
  }

  _fireAny() {
    if (this.onAnyInput) this.onAnyInput();
  }

  _bindKeyboard() {
    window.addEventListener("keydown", (event) => {
      const action = KEY_ACTIONS[event.code];
      if (!action) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) {
        this.pressed.add(action);
        if (action === "mute" && this.onMute) this.onMute();
      }
      this.keys.add(action);
      this._fireAny();
    }, { passive: false });

    window.addEventListener("keyup", (event) => {
      const action = KEY_ACTIONS[event.code];
      if (!action) return;
      this.keys.delete(action);
    });

    window.addEventListener("blur", () => this.keys.clear());
  }

  _canvasPoint(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / 480, rect.height / 270);
    const cw = 480 * scale;
    const ch = 270 * scale;
    const ox = rect.left + (rect.width - cw) / 2;
    const oy = rect.top + (rect.height - ch) / 2;
    const x = (clientX - ox) / scale;
    const y = (clientY - oy) / scale;
    if (x < 0 || y < 0 || x > 480 || y > 270) return null;
    return { x, y };
  }

  _bindCanvasTap() {
    this.canvas.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const point = this._canvasPoint(event.clientX, event.clientY);
      if (!point) return;
      this.tap = { ...point, time: performance.now() };
      this._fireAny();
    }, { passive: true });
  }

  _bindTouchButtons() {
    const press = (action) => {
      this.pressed.add(action);
      this._fireAny();
    };
    const bind = (id, action) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        el.classList.add("is-down");
        press(action);
      }, { passive: false });
      const release = () => el.classList.remove("is-down");
      el.addEventListener("pointerup", release);
      el.addEventListener("pointercancel", release);
      el.addEventListener("pointerleave", release);
    };
    bind("btn-a", "confirm");
    bind("btn-b", "cancel");

    const pause = document.getElementById("pause-btn");
    if (pause) {
      pause.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this._fireAny();
      });
    }
  }

  _bindStick() {
    const zone = document.getElementById("stick-zone");
    const knob = document.getElementById("stick-knob");
    if (!zone || !knob) return;

    const update = (event) => {
      const rect = zone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const max = rect.width * 0.34;
      let dx = event.clientX - cx;
      let dy = event.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > max) {
        dx = (dx / dist) * max;
        dy = (dy / dist) * max;
      }
      const nx = dx / max;
      const ny = dy / max;
      this.stick.x = Math.abs(nx) < STICK_DEADZONE ? 0 : nx;
      this.stick.y = Math.abs(ny) < STICK_DEADZONE ? 0 : ny;
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    };

    zone.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this._fireAny();
      this.stickPointer = event.pointerId;
      this.stick.active = true;
      zone.setPointerCapture(event.pointerId);
      update(event);
    }, { passive: false });

    zone.addEventListener("pointermove", (event) => {
      if (!this.stick.active || event.pointerId !== this.stickPointer) return;
      event.preventDefault();
      update(event);
    }, { passive: false });

    const release = (event) => {
      if (this.stickPointer !== null && event.pointerId !== this.stickPointer) return;
      this.stickPointer = null;
      this.stick.active = false;
      this.stick.x = 0;
      this.stick.y = 0;
      knob.style.transform = "translate(-50%, -50%)";
    };
    zone.addEventListener("pointerup", release);
    zone.addEventListener("pointercancel", release);
    zone.addEventListener("lostpointercapture", release);
  }

  _bindVisibility() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.keys.clear();
        this.stick.x = 0;
        this.stick.y = 0;
        this.stick.active = false;
      }
    });
  }

  getMove() {
    let x = 0;
    let y = 0;
    if (this.keys.has("left")) x -= 1;
    if (this.keys.has("right")) x += 1;
    if (this.keys.has("up")) y -= 1;
    if (this.keys.has("down")) y += 1;

    if (Math.abs(this.stick.x) > 0 || Math.abs(this.stick.y) > 0) {
      x = this.stick.x;
      y = this.stick.y;
    }

    if (this.tilt.enabled && !this.stick.active) {
      if (Math.abs(this.stick.x) < 0.1 && Math.abs(this.stick.y) < 0.1) {
        x += this.tilt.x;
        y += this.tilt.y;
      }
    }

    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y, len: Math.min(1, len) };
  }

  justPressed(action) {
    return this.pressed.has(action);
  }

  endFrame() {
    this.pressed.clear();
    this.tap = null;
  }

  consumeTap() {
    const tap = this.tap;
    this.tap = null;
    return tap;
  }

  async requestTilt() {
    if (typeof DeviceOrientationEvent === "undefined") {
      return { ok: false, reason: "This device does not report motion." };
    }
    try {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result !== "granted") {
          return { ok: false, reason: "Motion permission was not granted." };
        }
      }
    } catch (error) {
      return { ok: false, reason: "Motion permission could not be requested." };
    }

    this.tilt.enabled = true;
    this.tilt.baseBeta = null;
    this.tilt.baseGamma = null;
    if (!this.tilt.handler) {
      this.tilt.handler = (event) => this._onOrientation(event);
      window.addEventListener("deviceorientation", this.tilt.handler, true);
    }
    return { ok: true };
  }

  disableTilt() {
    this.tilt.enabled = false;
    this.tilt.x = 0;
    this.tilt.y = 0;
    if (this.tilt.handler) {
      window.removeEventListener("deviceorientation", this.tilt.handler, true);
      this.tilt.handler = null;
    }
  }

  calibrateTilt() {
    this.tilt.baseBeta = null;
    this.tilt.baseGamma = null;
    this.tilt.x = 0;
    this.tilt.y = 0;
  }

  _onOrientation(event) {
    if (!this.tilt.enabled) return;
    if (event.beta === null || event.gamma === null) return;
    if (this.tilt.baseBeta === null) {
      this.tilt.baseBeta = event.beta;
      this.tilt.baseGamma = event.gamma;
      return;
    }

    let dx = event.gamma - this.tilt.baseGamma;
    let dy = event.beta - this.tilt.baseBeta;

    const angle = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const sx = dx * cos - dy * sin;
    const sy = dx * sin + dy * cos;

    this.tilt.x = deadzone(sx, TILT_DEADZONE, TILT_MAX);
    this.tilt.y = deadzone(sy, TILT_DEADZONE, TILT_MAX);
  }
}
