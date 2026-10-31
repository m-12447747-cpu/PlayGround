// art.js — helpers, palette, monster sprites, weather.
export const PAL = {
  ink: '#070a16',
  ink2: '#0b1022',
  deep: '#111731',
  snowHi: '#e6eeff',
  snow: '#c6d4ee',
  snowMid: '#a8b9da',
  snowShade: '#8496ba',
  snowDark: '#64769c',
  road: '#4a5878',
  roadDark: '#394665',
  sidewalk: '#7788ab',
  warm: '#ffd48a',
  warmDeep: '#f0a45a',
  amber: '#ffd166',
  red: '#ff3b5c',
  redDim: '#c93b52',
  green: '#3d7a61',
  greenDark: '#27503f',
  cyan: '#8fe3ff',
  white: '#f4f7ff',
  muted: '#9aa9c9',
  violet: '#b9a6ff',
};

export const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const R = Math.round;

export function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(R(x), R(y), R(w), R(h));
}

export function rr(ctx, x, y, w, h, r, color) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
  ctx.fill();
}

export function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function text(ctx, str, x, y, opt = {}) {
  const {
    size = 8, color = PAL.white, align = 'left', baseline = 'alphabetic',
    weight = 400, alpha = 1, shadow = null, glow = null, family = '"Pixelify Sans"',
    tracking = 0,
  } = opt;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${size}px ${family}, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = Math.max(2, size * 0.55);
  }
  if (shadow) {
    ctx.fillStyle = shadow;
    ctx.fillText(str, x + 1, y + 1);
    ctx.fillText(str, x + 1.5, y + 2);
  }
  ctx.fillStyle = color;
  if (tracking) {
    let cx = x;
    const chars = [...str];
    const width = chars.reduce((w, c) => w + ctx.measureText(c).width + tracking, -tracking);
    if (align === 'center') cx = x - width / 2;
    else if (align === 'right') cx = x - width;
    for (const c of chars) {
      ctx.textAlign = 'left';
      ctx.fillText(c, cx, y);
      cx += ctx.measureText(c).width + tracking;
    }
  } else {
    ctx.fillText(str, x, y);
  }
  ctx.restore();
}

export function heart(ctx, x, y, s = 1, color = PAL.red, glow = true) {
  const p = [
    [0, 1], [1, 0], [2, 0], [3, 1], [4, 2], [3, 3], [2, 4], [1, 3], [0, 2],
  ];
  ctx.save();
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 7 * s;
  }
  ctx.fillStyle = color;
  for (const [px, py] of p) ctx.fillRect(R(x + px * s), R(y + py * s), Math.ceil(s), Math.ceil(s));
  ctx.restore();
}

export function shadow(ctx, x, y, rx = 8, ry = 3, alpha = 0.3) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#0a1024';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function glow(ctx, x, y, r, inner, outer = 'rgba(255,200,110,0)', alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function snowflake(ctx, x, y, r, color = '#dcecff', alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = (Math.PI / 3) * i + 0.24;
    ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.stroke();
  ctx.restore();
}

export function crack(ctx, x, y, len, angle, color, width = 1, seed = 1) {
  let px = x, py = y;
  let a = angle;
  for (let i = 0; i < 6; i++) {
    const l = len * (0.35 + hash(seed + i) * 0.5);
    const nx = px + Math.cos(a) * l;
    const ny = py + Math.sin(a) * l;
    line(ctx, px, py, nx, ny, color, width);
    px = nx; py = ny;
    a += (hash(seed + i * 7) - 0.5) * 0.75;
  }
}

/* ------------------------------------------------------------------ */
/* Actors — origins are at the feet, +x right, -y up.                  */
/* ------------------------------------------------------------------ */

function srif(ctx, a, t, opts) {
  const bob = a.moving ? Math.sin(a.anim * 11) * 0.7 : Math.sin(t * 1.7) * 0.25;
  const step = a.moving ? Math.sin(a.anim * 11) : 0;
  const coat = opts?.coat || '#326a56';
  const coatDark = '#234d3f';
  const cream = '#efe6d6';
  const creamShade = '#d8cbb8';
  shadow(ctx, 0, 0, 8, 2.6, 0.32);
  ctx.save();
  ctx.translate(0, bob);

  // legs + boots
  rect(ctx, -5, -8 + Math.max(0, step) * 1.4, 3.5, 7, '#202a44');
  rect(ctx, 1.5, -8 + Math.max(0, -step) * 1.4, 3.5, 7, '#202a44');
  rect(ctx, -5.6, -2.4 + Math.max(0, step) * 1.4, 4.6, 2.6, '#111629');
  rect(ctx, 1.2, -2.4 + Math.max(0, -step) * 1.4, 4.6, 2.6, '#111629');

  // scarf tail
  rect(ctx, 4.5, -22, 3, 8, '#b8374d');
  rect(ctx, 6, -16, 2.4, 3.4, '#a02e44');

  // coat
  rr(ctx, -7.5, -23, 15, 17, 3.4, coat);
  rect(ctx, -7.5, -12, 15, 5.5, coatDark);
  rect(ctx, 0.2, -22, 1.1, 15.4, '#c9d6ea');
  rect(ctx, -6, -10, 3.2, 2.4, '#2a5b49');
  rect(ctx, 3, -10, 3.2, 2.4, '#2a5b49');

  // arms (swing)
  const arm = a.moving ? step * 2 : 0;
  rr(ctx, -9.6, -21 + arm, 3.6, 10, 1.5, coat);
  rr(ctx, 6, -21 - arm, 3.6, 10, 1.5, coat);
  rect(ctx, -9.6, -12.4 + arm, 3.6, 2.6, cream);
  rect(ctx, 6, -12.4 - arm, 3.6, 2.6, cream);

  // scarf wrap
  rr(ctx, -7.5, -25.4, 15, 4.2, 1.4, '#c53d4f');
  rect(ctx, -5, -24.6, 10, 1, '#e0606f');

  // head
  const side = a.dir === 'left' ? -1 : a.dir === 'right' ? 1 : 0;
  const face = a.dir !== 'up';
  // floppy ears
  rr(ctx, -10.6, -32, 4.2, 8, 1.8, creamShade);
  rr(ctx, 6.4, -32, 4.2, 8, 1.8, creamShade);
  rect(ctx, -9.7, -30.5, 2, 4, '#d5a3a1');
  rect(ctx, 7.7, -30.5, 2, 4, '#d5a3a1');
  // horns
  rect(ctx, -5.8, -38.4, 2.2, 4.4, '#c8b28f');
  rect(ctx, 3.6, -38.4, 2.2, 4.4, '#c8b28f');
  rect(ctx, -6.4, -39.6, 2.4, 1.8, '#a98f68');
  rect(ctx, 4.0, -39.6, 2.4, 1.8, '#a98f68');
  // face mass
  rr(ctx, -7.4, -36.6, 14.8, 12.6, 4.6, cream);
  rect(ctx, 2.2, -31, 5.2, 6.2, creamShade);
  // hair tuft
  rect(ctx, -3.5, -38.2, 5, 2.4, '#f6efe1');
  rect(ctx, 1.6, -37.4, 3.4, 1.8, '#f6efe1');
  // snow in fur
  rect(ctx, -2.5, -37, 1, 1, '#ffffff');
  rect(ctx, 3.4, -35.8, 0.8, 0.8, '#ffffff');

  if (face) {
    if (a.expr === 'demon') {
      rr(ctx, -6.6, -34.6, 13.2, 9.4, 2.8, '#111018');
      rect(ctx, -4.2, -31.4, 2.2, 1.6, '#ff3b5c');
      rect(ctx, 2, -31.4, 2.2, 1.6, '#ff3b5c');
      rect(ctx, -3.4, -28.4, 6.8, 1.2, '#e9e3d6');
      rect(ctx, -3.4, -29.2, 1, 0.8, '#e9e3d6');
      rect(ctx, 2.4, -29.2, 1, 0.8, '#e9e3d6');
    } else if (a.dir === 'left' || a.dir === 'right') {
      const ex = side * 2.6;
      // muzzle
      rect(ctx, ex - 1.6, -31.4, 5.4, 4.2, '#f6ecdc');
      rect(ctx, ex + 1.8, -30.4, 1.7, 1.5, '#3a2c34');
      rect(ctx, ex - 1.4, -28.2, 2.6, 0.8, '#8a6a64');
      // eye
      rect(ctx, ex - 0.6, -32.9, 1.8, 2.3, '#bf3d53');
      rect(ctx, ex, -32.9, 0.6, 0.8, '#f2b7bd');
      rect(ctx, ex - 1.4, -33.9, 3, 0.8, creamShade);
    } else {
      // muzzle
      rect(ctx, -3.2, -31.2, 6.4, 4.4, '#f7eddd');
      rect(ctx, -1.1, -30.4, 2.2, 1.4, '#372a31');
      // eyes
      const blink = (t + a.anim * 0.2) % 7 < 0.12 ? 0.7 : 2.3;
      rect(ctx, -4.7, -33, 2.2, blink, '#bf3d53');
      rect(ctx, 2.5, -33, 2.2, blink, '#bf3d53');
      rect(ctx, -4.2, -33, 0.7, 0.8, '#ffb3bb');
      rect(ctx, 3.4, -33, 0.7, 0.8, '#ffb3bb');
      // brows / expression
      if (a.expr === 'soft') {
        rect(ctx, -4.9, -34.4, 2.6, 0.7, creamShade);
        rect(ctx, 2.3, -34.4, 2.6, 0.7, creamShade);
        rect(ctx, -2.2, -27.6, 4.4, 0.8, '#8a6a64');
      } else if (a.expr === 'sad') {
        rect(ctx, -5.2, -34.7, 2.8, 0.8, creamShade);
        rect(ctx, 2.4, -34.7, 2.8, 0.8, creamShade);
        rect(ctx, -1.6, -27.2, 3.2, 0.7, '#8a6a64');
      } else if (a.expr === 'angry') {
        rect(ctx, -5.4, -34.6, 2.8, 0.8, '#a98f7d');
        rect(ctx, 2.6, -34.6, 2.8, 0.8, '#a98f7d');
        rect(ctx, -2.4, -27.5, 4.8, 0.7, '#8a6a64');
      } else {
        rect(ctx, -2.4, -27.6, 4.8, 0.8, '#8a6a64');
      }
      // freckles
      rect(ctx, -5.8, -29.2, 0.8, 0.8, '#d3a09c');
      rect(ctx, 5, -29.2, 0.8, 0.8, '#d3a09c');
    }
  } else {
    // back of head — hair tuft and scarf knot
    rect(ctx, -4.6, -37.6, 9.2, 2.6, '#f6efe1');
    rect(ctx, -2.2, -35, 4.4, 1.6, '#e6dbc9');
    rect(ctx, -2.4, -24.6, 4.8, 2, '#a02e44');
  }
  ctx.restore();
}

function chris(ctx, a, t) {
  const bob = a.moving ? Math.abs(Math.sin(a.anim * 10)) * 1.4 : Math.sin(t * 2.6) * 0.6;
  const step = a.moving ? Math.sin(a.anim * 10) : 0;
  shadow(ctx, 0, 0, 9, 2.8, 0.3);
  ctx.save();
  ctx.translate(0, -bob);

  // legs
  rect(ctx, -5, -10 + Math.max(0, step) * 1.3, 4, 8, '#4d4038');
  rect(ctx, 1.4, -10 + Math.max(0, -step) * 1.3, 4, 8, '#4d4038');
  rect(ctx, -5.8, -2.4 + Math.max(0, step) * 1.3, 5, 2.6, '#241f22');
  rect(ctx, 1, -2.4 + Math.max(0, -step) * 1.3, 5, 2.6, '#241f22');

  // sweater
  rr(ctx, -8.5, -27, 17, 19, 3.6, '#3f7d5d');
  rect(ctx, -8.5, -15, 17, 5, '#2c6247');
  // snowflake pattern
  rect(ctx, -1.2, -24.5, 2.4, 2.4, '#e8f3e5');
  rect(ctx, -2.4, -23.7, 4.8, 1, '#e8f3e5');
  rect(ctx, -1.6, -24.9, 1, 3.2, '#e8f3e5');
  rect(ctx, -6, -20, 1.2, 1.2, '#e8f3e5');
  rect(ctx, 4.8, -20, 1.2, 1.2, '#e8f3e5');
  // scarf
  rr(ctx, -8.5, -29, 17, 4.6, 1.6, '#b63d4b');
  rect(ctx, 4.6, -26, 3, 7, '#b63d4b');

  // arms / mittens
  const arm = a.moving ? step * 2 : 0;
  rr(ctx, -10.8, -25 + arm, 4, 11, 1.8, '#3f7d5d');
  rr(ctx, 6.8, -25 - arm, 4, 11, 1.8, '#3f7d5d');
  rr(ctx, -11.2, -16 + arm, 4.4, 4, 2, '#e9e2d4');
  rr(ctx, 6.8, -16 - arm, 4.4, 4, 2, '#e9e2d4');

  // antlers
  const tine = (x1, y1, x2, y2) => line(ctx, x1, y1, x2, y2, '#b68f5f', 2);
  tine(-5, -38, -9, -48); tine(-8, -44, -13, -46); tine(-6, -41, -2, -47);
  tine(5, -38, 9, -48); tine(8, -44, 13, -46); tine(6, -41, 2, -47);
  // ears
  rr(ctx, -12, -35, 5, 8, 2, '#c99563');
  rr(ctx, 7, -35, 5, 8, 2, '#c99563');
  rect(ctx, -11, -33.6, 2.4, 4, '#a8704f');
  rect(ctx, 8.6, -33.6, 2.4, 4, '#a8704f');

  // head
  rr(ctx, -8, -40, 16, 13, 4.6, '#c99563');
  rect(ctx, 2.5, -34, 5.5, 6, '#b98355');
  // muzzle
  rr(ctx, -4.2, -34.2, 8.4, 6, 2.2, '#e5c194');
  rect(ctx, -1.2, -33.2, 2.4, 1.6, '#4a2d24');
  // eyes
  const side = a.dir === 'left' ? -1 : a.dir === 'right' ? 1 : 0;
  if (a.dir === 'up') {
    rect(ctx, -4.8, -38.4, 9.6, 2.2, '#b98355');
  } else if (side) {
    rect(ctx, side * 2.4 - 1, -36.2, 2, 2.4, '#241a1e');
    rect(ctx, side * 2.4 - 1, -36.2, 0.8, 0.8, '#fff6e8');
    rect(ctx, -1, -30.4, 3.4, 0.8, '#8a5b44');
  } else {
    rect(ctx, -5.2, -36.6, 2.4, 3, '#241a1e');
    rect(ctx, 2.8, -36.6, 2.4, 3, '#241a1e');
    rect(ctx, -4.6, -36.2, 0.8, 0.9, '#fff6e8');
    rect(ctx, 3.4, -36.2, 0.8, 0.9, '#fff6e8');
    // freckles
    rect(ctx, -6, -32.6, 0.8, 0.8, '#9a6644');
    rect(ctx, 5.2, -32.6, 0.8, 0.8, '#9a6644');
    // smile
    rect(ctx, -2.6, -30.4, 5.2, 0.9, '#8a5b44');
    rect(ctx, -3.4, -31, 0.8, 0.7, '#8a5b44');
    rect(ctx, 2.6, -31, 0.8, 0.7, '#8a5b44');
  }
  ctx.restore();
}

function mich(ctx, a, t) {
  const bob = a.moving ? Math.abs(Math.sin(a.anim * 9)) * 1.1 : Math.sin(t * 1.2) * 0.25;
  const step = a.moving ? Math.sin(a.anim * 9) : 0;
  shadow(ctx, 0, 0, 9, 2.8, 0.34);
  ctx.save();
  ctx.translate(0, -bob);

  // legs
  rect(ctx, -5.4, -9 + Math.max(0, step) * 1.2, 4.4, 7, '#2b2c35');
  rect(ctx, 1, -9 + Math.max(0, -step) * 1.2, 4.4, 7, '#2b2c35');
  rect(ctx, -6, -2.2 + Math.max(0, step) * 1.2, 5.2, 2.4, '#14151d');
  rect(ctx, 0.8, -2.2 + Math.max(0, -step) * 1.2, 5.2, 2.4, '#14151d');

  // jacket
  rr(ctx, -9, -27, 18, 19, 3, '#1b1c24');
  rect(ctx, -9, -13, 18, 4.4, '#13141b');
  rect(ctx, -3, -25, 6, 12, '#2b2d38');
  rect(ctx, -3.4, -23.6, 6.8, 1, '#4a4d5c');
  // hands in pockets
  rect(ctx, -8.4, -15.4, 4.4, 2.4, '#c97a3a');
  rect(ctx, 4, -15.4, 4.4, 2.4, '#c97a3a');
  // collar
  rr(ctx, -6.6, -28.4, 13.2, 4, 1.5, '#111219');

  // head (tiger)
  const side = a.dir === 'left' ? -1 : a.dir === 'right' ? 1 : 0;
  rr(ctx, -8.6, -39, 17.2, 12.6, 4.5, '#c97a3a');
  rect(ctx, 2, -33.4, 6, 6, '#a65f2c');
  // ears
  rr(ctx, -12.6, -43, 5.2, 6, 2, '#c97a3a');
  rr(ctx, 7.4, -43, 5.2, 6, 2, '#c97a3a');
  rect(ctx, -11.2, -41.6, 2.4, 3, '#7d4526');
  rect(ctx, 8.8, -41.6, 2.4, 3, '#7d4526');
  // stripes
  rect(ctx, -6, -39, 1.6, 4, '#2a1b19');
  rect(ctx, -1.2, -39.4, 1.4, 3, '#2a1b19');
  rect(ctx, 3.6, -39, 1.6, 4, '#2a1b19');
  rect(ctx, -10, -35, 3, 1.2, '#2a1b19');
  rect(ctx, 7, -35, 3, 1.2, '#2a1b19');
  if (a.dir === 'up') {
    rect(ctx, -6, -34, 3, 1.2, '#2a1b19');
    rect(ctx, 3, -34, 3, 1.2, '#2a1b19');
  } else {
    // muzzle
    rr(ctx, -4.4, -34.6, 8.8, 6.4, 2.2, '#efd6b4');
    rect(ctx, -1.3, -33.6, 2.6, 1.6, '#3a2026');
    if (side) {
      rect(ctx, side * 2.6 - 1, -37, 2.2, 1.6, a.expr === 'soft' ? '#e8b45e' : '#ffc857');
      rect(ctx, side * 2.6 - 0.2, -37, 0.7, 1.6, '#221614');
      rect(ctx, -1, -30.4, 3.4, 0.8, '#8a5b44');
    } else {
      rect(ctx, -5, -37.2, 2.6, 1.8, '#ffc857');
      rect(ctx, 2.4, -37.2, 2.6, 1.8, '#ffc857');
      rect(ctx, -4.2, -37.2, 0.8, 1.8, '#221614');
      rect(ctx, 3.2, -37.2, 0.8, 1.8, '#221614');
      // brows
      if (a.expr === 'soft') {
        rect(ctx, -5.4, -39.2, 3.4, 0.8, '#8a542c');
        rect(ctx, 2, -39.2, 3.4, 0.8, '#8a542c');
        rect(ctx, -2.4, -30.2, 4.8, 0.8, '#8a5b44');
        rect(ctx, -3.2, -30.8, 0.8, 0.6, '#8a5b44');
      } else if (a.expr === 'angry') {
        rect(ctx, -6, -39.4, 3.8, 1, '#6b3d20');
        rect(ctx, 2.2, -38.8, 3.4, 1, '#6b3d20');
        rect(ctx, -2.2, -30, 4.4, 0.8, '#8a5b44');
      } else {
        rect(ctx, -5.6, -39.8, 3.6, 0.8, '#8a542c');
        rect(ctx, 2, -39.8, 3.6, 0.8, '#8a542c');
        rect(ctx, -2.6, -30.2, 5.2, 0.8, '#8a5b44');
      }
      // scar
      rect(ctx, -6.4, -41.4, 2.2, 0.7, '#e6b18f');
    }
  }

  // ushanka
  ctx.save();
  rr(ctx, -9.4, -47.2, 18.8, 8, 4, '#171820');
  rect(ctx, -9.4, -42.4, 18.8, 2.4, '#35363f');
  rr(ctx, -12.2, -44, 4, 11, 1.8, '#171820');
  rr(ctx, 8.2, -44, 4, 11, 1.8, '#171820');
  rect(ctx, -11.2, -42.8, 2, 7, '#2e2f38');
  rect(ctx, 9.2, -42.8, 2, 7, '#2e2f38');
  // little pale star
  const sx = -1.2, sy = -45.4;
  rect(ctx, sx + 1.4, sy, 0.9, 3.4, '#d9c9a0');
  rect(ctx, sx, sy + 1.2, 4.6, 0.9, '#d9c9a0');
  ctx.restore();
  ctx.restore();
}

function toriel(ctx, a, t) {
  const bob = a.moving ? Math.abs(Math.sin(a.anim * 8)) * 0.8 : Math.sin(t * 1.3) * 0.2;
  const step = a.moving ? Math.sin(a.anim * 8) : 0;
  shadow(ctx, 0, 0, 10, 3, 0.3);
  ctx.save();
  ctx.translate(0, -bob);
  // robe
  ctx.fillStyle = '#5b4674';
  ctx.beginPath();
  ctx.moveTo(-9, -23);
  ctx.lineTo(-13, -1);
  ctx.lineTo(13, -1);
  ctx.lineTo(9, -23);
  ctx.closePath();
  ctx.fill();
  rect(ctx, -12, -3, 24, 3, '#3f3152');
  rect(ctx, -10, -5, 20, 2, '#7a5f97');
  // rune trim
  rect(ctx, -1, -21, 2, 11, '#cdb27a');
  rect(ctx, -8.4, -12, 17, 1.2, '#cdb27a');
  // sleeves
  rr(ctx, -12.4, -25, 4.6, 13, 2, '#5b4674');
  rr(ctx, 7.8, -25, 4.6, 13, 2, '#5b4674');
  rect(ctx, -12.6, -13.2, 4.6, 3, '#efe6d6');
  rect(ctx, 8, -13.2, 4.6, 3, '#efe6d6');
  // head
  rr(ctx, -8.2, -38, 16.4, 13.4, 4.8, '#f1ebe1');
  rect(ctx, 2.6, -32, 5.2, 5.4, '#ddd2c4');
  // ears
  rr(ctx, -11.8, -34.4, 4.4, 8, 1.8, '#f1ebe1');
  rr(ctx, 7.4, -34.4, 4.4, 8, 1.8, '#f1ebe1');
  // horns
  rect(ctx, -5.4, -41.4, 2.4, 5, '#cbb28d');
  rect(ctx, 3, -41.4, 2.4, 5, '#cbb28d');
  // eyes
  rect(ctx, -5, -35.6, 2.4, 2.6, '#a53b4d');
  rect(ctx, 2.6, -35.6, 2.4, 2.6, '#a53b4d');
  rect(ctx, -4.6, -35.2, 0.8, 0.8, '#ffc6cc');
  rect(ctx, 3, -35.2, 0.8, 0.8, '#ffc6cc');
  rect(ctx, -1.6, -31.6, 3.2, 0.8, '#9a7b76');
  rect(ctx, -6.4, -32.8, 1, 1, '#d9a6a6');
  rect(ctx, 5.4, -32.8, 1, 1, '#d9a6a6');
  ctx.restore();
}

function asgore(ctx, a, t) {
  const bob = a.moving ? Math.abs(Math.sin(a.anim * 7)) * 0.8 : Math.sin(t * 1.1) * 0.2;
  const step = a.moving ? Math.sin(a.anim * 7) : 0;
  shadow(ctx, 0, 0, 12, 3.4, 0.32);
  ctx.save();
  ctx.translate(0, -bob);
  // legs
  rect(ctx, -7, -10 + Math.max(0, step) * 1.2, 5, 8, '#24324f');
  rect(ctx, 2, -10 + Math.max(0, -step) * 1.2, 5, 8, '#24324f');
  rect(ctx, -7.6, -2.2 + Math.max(0, step) * 1.2, 6, 2.4, '#151d2e');
  rect(ctx, 1.6, -2.2 + Math.max(0, -step) * 1.2, 6, 2.4, '#151d2e');
  // coat
  rr(ctx, -12, -30, 24, 22, 4, '#2b3d63');
  rect(ctx, -12, -14, 24, 5, '#223252');
  rect(ctx, -1.2, -29, 2.4, 20, '#1b2945');
  // badge
  rect(ctx, -8.5, -27, 3, 3, '#e7c46b');
  rect(ctx, -7.8, -26.3, 1.6, 1.6, '#a8842d');
  // belt
  rect(ctx, -12, -12.4, 24, 2, '#161e31');
  rect(ctx, -1.4, -12.8, 2.8, 2.8, '#d9b45a');
  // sleeves
  rr(ctx, -15.4, -29, 5, 15, 2, '#2b3d63');
  rr(ctx, 10.4, -29, 5, 15, 2, '#2b3d63');
  rect(ctx, -15.4, -14.6, 5, 3.4, '#efe2c8');
  rect(ctx, 10.4, -14.6, 5, 3.4, '#efe2c8');
  // mane
  rr(ctx, -9.4, -41, 18.8, 6, 2.4, '#d9b56a');
  // head
  rr(ctx, -9.4, -44, 18.8, 14, 5, '#efe2c8');
  rect(ctx, 3, -38, 6, 6.4, '#d9c9aa');
  // horns
  rect(ctx, -7.4, -47, 3, 5.6, '#cbb28d');
  rect(ctx, 4.4, -47, 3, 5.6, '#cbb28d');
  // beard
  ctx.fillStyle = '#d9b56a';
  ctx.beginPath();
  ctx.moveTo(-8.4, -34);
  ctx.lineTo(-7, -26);
  ctx.lineTo(-3, -28);
  ctx.lineTo(0, -25.6);
  ctx.lineTo(3, -28);
  ctx.lineTo(7, -26);
  ctx.lineTo(8.4, -34);
  ctx.lineTo(5.6, -32.4);
  ctx.lineTo(0, -33.4);
  ctx.lineTo(-5.6, -32.4);
  ctx.closePath();
  ctx.fill();
  rect(ctx, -3.4, -34, 6.8, 1, '#c69f55');
  // eyes (sad)
  rect(ctx, -5.6, -41.4, 2.8, 2.2, '#7d4a3f');
  rect(ctx, 2.8, -41.4, 2.8, 2.2, '#7d4a3f');
  rect(ctx, -5.2, -41, 0.8, 0.7, '#ffe3d0');
  rect(ctx, 3.2, -41, 0.8, 0.7, '#ffe3d0');
  rect(ctx, -6.4, -43.2, 3.4, 0.8, '#b98f5f');
  rect(ctx, 3, -43.2, 3.4, 0.8, '#b98f5f');
  rect(ctx, -1.6, -38.4, 3.2, 1.8, '#3a2c34');
  // police cap
  rr(ctx, -9.8, -50.4, 19.6, 6, 2, '#1b2945');
  rect(ctx, -10.8, -46.4, 21.6, 2.2, '#14203a');
  rect(ctx, -9.8, -50, 19.6, 1.2, '#334a79');
  rect(ctx, -1.4, -50.2, 2.8, 3.4, '#e7c46b');
  rect(ctx, -0.6, -49.4, 1.2, 1.8, '#a8842d');
  ctx.restore();
}

function bird(ctx, a, t) {
  const bob = Math.sin(t * 3 + a.anim) * 0.6;
  shadow(ctx, 0, 0, 5, 2, 0.25);
  ctx.save();
  ctx.translate(0, -bob);
  // shawl
  ctx.fillStyle = '#7c4f68';
  ctx.beginPath();
  ctx.moveTo(-5, -12);
  ctx.lineTo(-7, -1);
  ctx.lineTo(7, -1);
  ctx.lineTo(5, -12);
  ctx.closePath();
  ctx.fill();
  rect(ctx, -6, -2, 12, 2, '#d9a55e');
  // head
  rr(ctx, -4.4, -18.4, 8.8, 8, 4, '#8a93b4');
  // beak
  ctx.fillStyle = '#e3a95c';
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(4.2, -12);
  ctx.lineTo(0, -10.8);
  ctx.closePath();
  ctx.fill();
  // eyes
  rect(ctx, -2.6, -16, 1.4, 1.4, '#151a28');
  rect(ctx, 1.4, -16, 1.4, 1.4, '#151a28');
  // little hat
  rect(ctx, -4, -20, 8, 2.4, '#4a5a8a');
  rect(ctx, -5, -18.2, 10, 1, '#374568');
  ctx.restore();
}

function snowman(ctx, a, t) {
  shadow(ctx, 0, 0, 8, 2.6, 0.26);
  ellipse(ctx, 0, -5, 7, 6, '#e8f0ff');
  ellipse(ctx, 0, -13.4, 5.4, 4.8, '#dbe7fc');
  ellipse(ctx, 0, -20, 4.2, 3.8, '#cfdff8');
  rect(ctx, -1.8, -14, 1.2, 1.2, '#2a3148');
  rect(ctx, 0.8, -14, 1.2, 1.2, '#2a3148');
  rect(ctx, -1.2, -20.4, 1, 1, '#2a3148');
  rect(ctx, 0.4, -20.4, 1, 1, '#2a3148');
  // nose
  ctx.fillStyle = '#e2834f';
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(4.6, -17);
  ctx.lineTo(0, -16.2);
  ctx.closePath();
  ctx.fill();
  // twig arms
  line(ctx, -6, -12, -11, -16, '#5a4636', 1.2);
  line(ctx, 6, -12, 11, -15, '#5a4636', 1.2);
  line(ctx, -8.4, -15, -10.4, -13, '#5a4636', 1);
  line(ctx, 8.4, -14, 10.4, -12, '#5a4636', 1);
  // scarf
  rect(ctx, -4.4, -11.2, 8.8, 2.4, '#b63d4b');
  rect(ctx, 2.2, -10, 2.2, 5, '#b63d4b');
  // hat
  rect(ctx, -4.6, -25.6, 9.2, 3.6, '#232839');
  rect(ctx, -6.2, -22.4, 12.4, 1.4, '#151a28');
}

const ACTOR_DRAW = { srif, chris, mich, toriel, asgore, bird, snowman };

export function drawActor(ctx, actor, t, opt = {}) {
  if (!actor) return;
  const fn = ACTOR_DRAW[actor.skin || actor.id] || srif;
  ctx.save();
  ctx.translate(Math.round(actor.x), Math.round(actor.y));
  fn(ctx, actor, t, opt);
  ctx.restore();
  if (actor.skin === 'srif' && opt.breath) {
    const cycle = (t * 0.7 + actor.anim) % 3.4;
    if (cycle < 0.8) {
      ctx.save();
      ctx.globalAlpha = 0.3 * (1 - cycle / 0.8);
      ellipse(ctx, actor.x + 6, actor.y - 31 - cycle * 5, 2 + cycle * 3, 1.5 + cycle * 2, '#e8f0ff');
      ctx.restore();
    }
  }
}

export function drawDemonSmile(ctx, x, y, t, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  const wob = Math.sin(t * 20) * 0.5;
  ctx.fillStyle = '#07060c';
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4efe2';
  for (let i = -4; i <= 4; i++) {
    const h = 1.2 + Math.abs(Math.sin(i * 1.7 + t)) * 1.3;
    ctx.fillRect(i * 1.7 + wob, -2.4, 1.3, h);
  }
  ctx.fillRect(-6.6 + wob, -2.4, 13.2, 0.9);
  ctx.fillStyle = '#ff3b5c';
  ctx.fillRect(-4.6 + wob, -5.4, 1.6, 1.4);
  ctx.fillRect(3 + wob, -5.4, 1.6, 1.4);
  ctx.restore();
}
