/* Shared drawing helpers and palette. */

export const TAU = Math.PI * 2;
export const INK = "#100c19";
export const SNOW = "#f4f1ff";

export const C = {
  night0: "#050611",
  night1: "#0d1229",
  night2: "#25284a",
  dusk: "#7b586f",
  duskHot: "#d8907c",
  moon: "#f5efd4",
  snow: "#e9efff",
  snowShadow: "#b6c4e6",
  snowDeep: "#8595c0",
  warm: "#ffcf78",
  warmHot: "#ffb24e",
  window: "#ffc16c",
  teal: "#73ddca",
  rose: "#ef6b7c",
  violet: "#9d8af3",
  glass: "#6c88b8",
  cream: "#fff4d3",
  burgundy: "#6c2634",
  dark: "#0b0912",
};

export const WORLD_WIDTH = 2220;

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep(t) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

export function rr(ctx, x, y, w, h, r = 0) {
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
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
}

export function poly(ctx, points, close = true) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (close) ctx.closePath();
}

export function ellipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
}

export function fillStroke(ctx, fill, stroke = INK, line = 2) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke && line > 0) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = line;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

export function capsule(ctx, x1, y1, x2, y2, radius, fill, line = 2.6, stroke = INK) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineCap = "round";
  ctx.lineWidth = radius * 2 + line * 2;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  ctx.lineWidth = radius * 2;
  ctx.strokeStyle = fill;
  ctx.stroke();
}

export function glow(ctx, x, y, radius, color, alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function star(ctx, x, y, r, fill = "#fffbe8", alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.22, y - r * 0.22);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.22, y + r * 0.22);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.22, y + r * 0.22);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.22, y - r * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function heartPath(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.7);
  ctx.bezierCurveTo(x - size * 1.15, y - size * 0.15, x - size * 0.55, y - size, x, y - size * 0.42);
  ctx.bezierCurveTo(x + size * 0.55, y - size, x + size * 1.15, y - size * 0.15, x, y + size * 0.7);
  ctx.closePath();
}

export function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

export function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function layout(W, H) {
  const S = clamp(H / 720, 0.72, 1.28);
  const portrait = H > W * 1.12;
  const groundY = H * (portrait ? 0.735 : 0.805);
  const viewW = W / S;
  return { S, groundY, viewW, portrait };
}

export function battleBoard(W, H) {
  const portrait = H > W * 1.12;
  const w = Math.min(W * (portrait ? 0.78 : 0.62), 700);
  const h = Math.min(H * (portrait ? 0.3 : 0.34), 252);
  const cy = H * (portrait ? 0.49 : 0.52);
  return { x: (W - w) / 2, y: cy - h / 2, w, h, cx: W / 2, cy };
}

export function drawSnow(ctx, W, H, time, amount = 1, gust = 0) {
  const count = Math.round(clamp((W * H) / 9500, 32, 150) * amount);
  ctx.save();
  ctx.fillStyle = "#f4f4ff";
  for (let i = 0; i < count; i++) {
    const depth = 0.25 + hash(i * 3.1) * 0.75;
    const speed = 12 + depth * 46;
    const phase = hash(i * 7.7) * 1000;
    const x = ((hash(i * 2.3) * (W + 120) + time * (7 + depth * 12) + Math.sin(time * 0.4 + phase) * 12 + gust * depth * 60) % (W + 120)) - 60;
    const y = ((hash(i * 5.2) * (H + 80) + time * speed) % (H + 80)) - 40;
    const r = 0.7 + depth * 2.2;
    ctx.globalAlpha = 0.18 + depth * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawVignette(ctx, W, H, strength = 0.5) {
  const g = ctx.createRadialGradient(W / 2, H * 0.48, Math.min(W, H) * 0.25, W / 2, H * 0.5, Math.max(W, H) * 0.72);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.72, `rgba(2,2,8,${0.08 * strength})`);
  g.addColorStop(1, `rgba(2,2,8,${0.72 * strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export function drawPaperNoise(ctx, W, H, alpha = 0.035) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 260; i++) {
    const x = hash(i * 13.1) * W;
    const y = hash(i * 29.7) * H;
    ctx.fillStyle = i % 3 ? "#ffffff" : "#000000";
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}
