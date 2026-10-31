// Core constants, input, math helpers and canvas fitting.

export const VIEW_W = 640;
export const VIEW_H = 360;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];
export const approach = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));

// Deterministic hash for scenery so the snow looks the same every frame.
export function hash2(x, y) {
  let n = (x | 0) * 374761393 + (y | 0) * 668265263;
  n = (n ^ (n >> 13)) * 1274126177;
  n = n ^ (n >> 16);
  return (n >>> 0) / 4294967295;
}

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  KeyZ: 'confirm', Enter: 'confirm', Space: 'confirm', KeyE: 'confirm',
  KeyX: 'cancel', ShiftLeft: 'cancel', ShiftRight: 'cancel', Backspace: 'cancel', Escape: 'cancel',
  KeyM: 'mute', KeyH: 'help',
};

export class Input {
  constructor() {
    this.down = Object.create(null);
    this.pressed = Object.create(null);
    this.anyPressed = false;

    addEventListener('keydown', (e) => {
      const a = KEYMAP[e.code];
      if (!a) return;
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      if (e.repeat) return;
      this.press(a);
    });
    addEventListener('keyup', (e) => {
      const a = KEYMAP[e.code];
      if (!a) return;
      this.release(a);
    });
    addEventListener('blur', () => this.clear());
  }

  press(a) {
    if (!this.down[a]) this.pressed[a] = true;
    this.down[a] = true;
    this.anyPressed = true;
  }

  release(a) {
    this.down[a] = false;
  }

  isDown(a) {
    return !!this.down[a];
  }

  wasPressed(a) {
    return !!this.pressed[a];
  }

  axis() {
    const x = (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0);
    const y = (this.isDown('down') ? 1 : 0) - (this.isDown('up') ? 1 : 0);
    return { x, y };
  }

  endFrame() {
    this.pressed = Object.create(null);
    this.anyPressed = false;
  }

  clear() {
    this.down = Object.create(null);
    this.pressed = Object.create(null);
  }
}

export function bindTouch(root = document) {
  const buttons = root.querySelectorAll('[data-act]');
  const held = new Map();
  buttons.forEach((btn) => {
    const act = btn.dataset.act;
    const on = (e) => {
      e.preventDefault();
      btn.classList.add('pressed');
      if (!held.get(btn)) {
        held.set(btn, true);
        input.press(act);
      }
    };
    const off = (e) => {
      e.preventDefault();
      btn.classList.remove('pressed');
      if (held.get(btn)) {
        held.set(btn, false);
        input.release(act);
      }
    };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointercancel', off);
    btn.addEventListener('pointerleave', off);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });
  return buttons;
}

// Shared singleton input, created lazily after DOM exists.
export const input = new Input();

// Fit canvas backing store to the viewport with device pixel ratio,
// then draw in a fixed 640x360 logical space.
export function fitCanvas(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const state = { scale: 1, ox: 0, oy: 0, dpr: 1, w: 0, h: 0 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    const scale = Math.min(vw / VIEW_W, vh / VIEW_H);
    state.scale = scale;
    state.dpr = dpr;
    state.w = vw;
    state.h = vh;
    state.ox = (vw - VIEW_W * scale) / 2;
    state.oy = (vh - VIEW_H * scale) / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }

  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 120));
  resize();
  state.apply = () => {
    const d = state.dpr;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.translate(state.ox, state.oy);
    ctx.scale(state.scale, state.scale);
  };
  state.ctx = ctx;
  return state;
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}
