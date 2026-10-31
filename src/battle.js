/* The mirror encounter. */
import { TAU, INK, C, layout, battleBoard, clamp, rr, poly, ellipse, glow, star, heartPath, drawVignette, hash, smoothstep } from "./draw-utils.js";
import { drawMirrorHead } from "./heads.js";

function voidSky(ctx, W, H, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#05050b");
  g.addColorStop(0.4, "#160b1d");
  g.addColorStop(0.7, "#1d0b18");
  g.addColorStop(1, "#08060d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Sickly fluorescent strips, floating.
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 3; i++) {
    const x = W * (0.16 + i * 0.34);
    const y = H * (0.07 + (i % 2) * 0.06);
    const w = W * 0.17;
    ctx.globalAlpha = 0.12 + 0.04 * Math.sin(t * 3 + i);
    ctx.fillStyle = "#b6fff2";
    rr(ctx, x - w / 2, y, w, 4, 2);
    ctx.fill();
    glow(ctx, x, y + 2, w * 0.8, "rgba(142,255,228,.08)");
  }
  ctx.restore();

  // Distant tile fragments.
  for (let i = 0; i < 16; i++) {
    const x = hash(i * 4.2) * W;
    const y = hash(i * 8.7) * H;
    const size = 4 + hash(i * 2.4) * 16;
    const drift = Math.sin(t * 0.3 + i) * 7;
    ctx.save();
    ctx.translate(x + drift, y + Math.cos(t * 0.2 + i) * 6);
    ctx.rotate(hash(i * 9.1) * TAU + t * 0.03);
    ctx.globalAlpha = 0.06 + hash(i) * 0.16;
    ctx.fillStyle = i % 3 ? "#709e9c" : "#ef6b7c";
    ctx.strokeStyle = "#0b0912";
    ctx.lineWidth = 0.8;
    rr(ctx, -size / 2, -size / 2, size, size * 0.7, 1);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Rising motes.
  for (let i = 0; i < 42; i++) {
    const x = hash(i * 6.5) * W;
    const y = ((hash(i * 3.7) * H - t * (4 + hash(i) * 18)) % H + H) % H;
    const r = 0.6 + hash(i * 8.8) * 2;
    ctx.globalAlpha = 0.08 + hash(i * 5.2) * 0.3;
    ctx.fillStyle = i % 5 ? "#b6a4d8" : "#ef8b9c";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function mirrorFrame(ctx, W, H, t, battle) {
  const trust = battle.trust || 0;
  const victory = battle.victory || 0;
  const cx = W / 2;
  const cy = H * 0.43;
  const mw = Math.min(W * 0.72, 730);
  const mh = Math.min(H * 0.54, 470);
  const top = cy - mh / 2;
  const left = cx - mw / 2;

  // Ground shadow.
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#020205";
  ellipse(ctx, cx, cy + mh * 0.6, mw * 0.46, 26);
  ctx.fill();
  ctx.restore();

  // Massive ornate frame.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(t * 0.17) * 0.004);
  ctx.translate(-cx, -cy);

  // Outer glow.
  glow(ctx, cx, cy, mw * 0.64, trust >= 3 ? "rgba(255,208,118,.18)" : "rgba(182,120,216,.13)");
  ctx.fillStyle = "#0b0710";
  ctx.strokeStyle = "#2a1428";
  ctx.lineWidth = 12;
  rr(ctx, left - 32, top - 32, mw + 64, mh + 64, Math.min(120, mw * 0.12));
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = trust >= 3 ? "#b99856" : "#6f4b84";
  ctx.lineWidth = 4;
  rr(ctx, left - 19, top - 19, mw + 38, mh + 38, Math.min(100, mw * 0.1));
  ctx.stroke();

  // Frame ornamentation.
  ctx.strokeStyle = "rgba(230,199,131,.45)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + t * 0.02;
    const ox = cx + Math.cos(a) * (mw * 0.53);
    const oy = cy + Math.sin(a) * (mh * 0.56);
    star(ctx, ox, oy, 3.5, "#d6b36b");
  }
  // Top crest.
  poly(ctx, [
    [cx - 28, top - 31],
    [cx, top - 58],
    [cx + 28, top - 31],
    [cx + 10, top - 36],
    [cx, top - 44],
    [cx - 10, top - 36],
  ]);
  ctx.fillStyle = trust >= 3 ? "#c8a45e" : "#6f4b84";
  ctx.fill();
  ctx.strokeStyle = "#150c1c";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Glass.
  const glass = ctx.createLinearGradient(left, top, left + mw, top + mh);
  glass.addColorStop(0, "#241a30");
  glass.addColorStop(0.3, "#182331");
  glass.addColorStop(0.56, "#34203a");
  glass.addColorStop(1, "#0b0b12");
  ctx.fillStyle = glass;
  rr(ctx, left, top, mw, mh, Math.min(90, mw * 0.08));
  ctx.fill();

  // Glass reflection sheets.
  ctx.save();
  ctx.beginPath();
  rr(ctx, left, top, mw, mh, Math.min(90, mw * 0.08));
  ctx.clip();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#c6e6f4";
  poly(ctx, [[left - 30, top + mh * 0.2], [left + mw * 0.4, top - 20], [left + mw * 0.55, top - 20], [left - 10, top + mh * 0.65]]);
  ctx.fill();
  poly(ctx, [[left + mw * 0.6, top + mh], [left + mw * 0.8, top + mh], [left + mw * 0.45, top], [left + mw * 0.28, top]]);
  ctx.fill();
  ctx.restore();

  // Reflection.
  const faceScale = Math.min(mw / 280, mh / 320);
  ctx.save();
  ctx.translate(cx, cy + mh * 0.03);
  ctx.scale(faceScale, faceScale);
  if (victory > 0) {
    const calmTrust = Math.min(3, trust + victory * 3);
    drawMirrorHead(ctx, 0, 0, 96, calmTrust, t);
  } else {
    drawMirrorHead(ctx, 0, 0, 96, trust, t);
  }
  ctx.restore();

  // Growing cracks, shifted with trust.
  const cracks = 1 + trust * 2;
  ctx.strokeStyle = trust >= 3 ? "rgba(255,244,211,.75)" : "rgba(207,193,236,.34)";
  ctx.lineWidth = trust >= 3 ? 1.4 : 0.9;
  for (let i = 0; i < cracks; i++) {
    const sx = left + mw * (0.18 + hash(i * 3.8) * 0.64);
    const sy = top + mh * (0.06 + hash(i * 6.2) * 0.24);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - 18 + hash(i) * 37, sy + 31);
    ctx.lineTo(sx + 8 - hash(i * 2.2) * 22, sy + 65);
    ctx.lineTo(sx - 12 + hash(i * 7) * 34, sy + 104);
    ctx.stroke();
  }

  // Inner shadow.
  const inner = ctx.createRadialGradient(cx, cy, mw * 0.1, cx, cy, mw * 0.58);
  inner.addColorStop(0, "rgba(0,0,0,0)");
  inner.addColorStop(0.78, "rgba(3,3,7,.2)");
  inner.addColorStop(1, "rgba(3,3,7,.82)");
  ctx.fillStyle = inner;
  rr(ctx, left, top, mw, mh, Math.min(90, mw * 0.08));
  ctx.fill();

  // Cracked star glint when listening.
  if (trust >= 3) {
    ctx.globalAlpha = 0.5 + Math.sin(t * 4) * 0.2;
    star(ctx, left + mw * 0.72, top + mh * 0.24, 15, "#ffe9a8");
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // Pale floor light.
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const floorGlow = ctx.createRadialGradient(cx, cy + mh * 0.56, 10, cx, cy + mh * 0.56, mw * 0.55);
  floorGlow.addColorStop(0, trust >= 3 ? "rgba(255,205,118,.12)" : "rgba(156,100,198,.1)");
  floorGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = floorGlow;
  ctx.fillRect(0, cy, W, H - cy);
  ctx.restore();

  return { cx, cy, mw, mh, top, left };
}

function shatter(ctx, W, H, t, victory) {
  const p = clamp(victory, 0, 1);
  const cx = W / 2;
  const cy = H * 0.43;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = clamp(1.2 - p, 0, 1) * 0.9;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.6);
  g.addColorStop(0, "rgba(255,255,255,.9)");
  g.addColorStop(0.25, "rgba(225,198,255,.45)");
  g.addColorStop(1, "rgba(255,188,211,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  ctx.save();
  for (let i = 0; i < 56; i++) {
    const a = hash(i * 3.1) * TAU;
    const speed = 40 + hash(i * 8.4) * 300;
    const dist = p * speed;
    const x = cx + Math.cos(a) * dist;
    const y = cy + Math.sin(a) * dist * 0.72 + p * p * 80;
    const size = 3 + hash(i * 5.7) * 18;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + p * 4);
    ctx.globalAlpha = clamp(1.3 - p, 0, 1) * (0.25 + hash(i) * 0.7);
    ctx.fillStyle = i % 5 ? "rgba(185,215,236,.9)" : "rgba(255,238,194,.95)";
    ctx.beginPath();
    ctx.moveTo(-size * 0.5, -size * 0.4);
    ctx.lineTo(size * 0.8, -size * 0.1);
    ctx.lineTo(size * 0.2, size * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function board(ctx, W, H, t, battle) {
  const b = battleBoard(W, H);
  const time = battle.dodgeDuration || 6;
  const left = battle.dodgeTime || 0;
  const p = clamp(1 - left / time, 0, 1);

  // Dark box.
  ctx.save();
  ctx.fillStyle = "rgba(4,3,8,.92)";
  ctx.strokeStyle = "rgba(255,244,211,.85)";
  ctx.lineWidth = 2;
  rr(ctx, b.x, b.y, b.w, b.h, 3);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(162,145,255,.25)";
  ctx.lineWidth = 1;
  rr(ctx, b.x + 6, b.y + 6, b.w - 12, b.h - 12, 2);
  ctx.stroke();

  // Grid.
  ctx.strokeStyle = "rgba(142,128,196,.06)";
  for (let x = b.x + 24; x < b.x + b.w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, b.y + 6);
    ctx.lineTo(x, b.y + b.h - 6);
    ctx.stroke();
  }
  for (let y = b.y + 24; y < b.y + b.h; y += 32) {
    ctx.beginPath();
    ctx.moveTo(b.x + 6, y);
    ctx.lineTo(b.x + b.w - 6, y);
    ctx.stroke();
  }

  // Projectiles.
  (battle.projectiles || []).forEach((pr) => {
    ctx.save();
    ctx.translate(pr.x, pr.y);
    ctx.rotate(pr.rot || 0);
    ctx.globalAlpha = pr.alpha ?? 1;
    if (pr.type === "tear") {
      ctx.fillStyle = pr.color || "#ef6b7c";
      ctx.strokeStyle = "#2b0b14";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -pr.size);
      ctx.bezierCurveTo(pr.size * 0.9, -pr.size * 0.2, pr.size * 0.65, pr.size * 0.7, 0, pr.size);
      ctx.bezierCurveTo(-pr.size * 0.65, pr.size * 0.7, -pr.size * 0.9, -pr.size * 0.2, 0, -pr.size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.beginPath();
      ctx.arc(-pr.size * 0.22, -pr.size * 0.3, pr.size * 0.14, 0, TAU);
      ctx.fill();
    } else if (pr.type === "ring") {
      ctx.strokeStyle = pr.color || "#c59bff";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, pr.size, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = (pr.alpha ?? 1) * 0.4;
      ctx.beginPath();
      ctx.arc(0, 0, pr.size * 0.66, 0, TAU);
      ctx.stroke();
    } else {
      ctx.fillStyle = pr.color || "#b7d9f2";
      ctx.strokeStyle = "#11101c";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-pr.size * 0.55, -pr.size * 0.8);
      ctx.lineTo(pr.size * 0.7, -pr.size * 0.16);
      ctx.lineTo(pr.size * 0.15, pr.size * 0.85);
      ctx.lineTo(-pr.size * 0.34, pr.size * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = (pr.alpha ?? 1) * 0.28;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(-pr.size * 0.12, -pr.size * 0.42);
      ctx.lineTo(pr.size * 0.32, -pr.size * 0.09);
      ctx.lineTo(-pr.size * 0.03, pr.size * 0.14);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  });

  // Soul.
  const hx = battle.heart?.x ?? b.cx;
  const hy = battle.heart?.y ?? b.cy;
  ctx.save();
  glow(ctx, hx, hy, 22, "rgba(255,83,110,.3)");
  heartPath(ctx, hx, hy, 6.2);
  ctx.fillStyle = battle.hurt ? "#fff1c6" : "#ff5876";
  ctx.fill();
  ctx.strokeStyle = "#5b1020";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.beginPath();
  ctx.arc(hx - 2, hy - 2, 1.1, 0, TAU);
  ctx.fill();
  ctx.restore();

  // Timer bar along the top edge.
  ctx.fillStyle = "rgba(255,244,211,.12)";
  ctx.fillRect(b.x + 8, b.y + 8, b.w - 16, 3);
  ctx.fillStyle = p > 0.82 ? "#ef6b7c" : "#ffd36a";
  ctx.fillRect(b.x + 8, b.y + 8, (b.w - 16) * (1 - p), 3);

  // Corner brackets.
  ctx.strokeStyle = "#ffd36a";
  ctx.lineWidth = 2;
  const corner = 13;
  [[b.x, b.y, 1, 1], [b.x + b.w, b.y, -1, 1], [b.x, b.y + b.h, 1, -1], [b.x + b.w, b.y + b.h, -1, -1]].forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x + dx * 3, y + dy * corner);
    ctx.lineTo(x + dx * 3, y + dy * 3);
    ctx.lineTo(x + dx * corner, y + dy * 3);
    ctx.stroke();
  });
  ctx.restore();

  return b;
}

export function drawBattle(ctx, W, H, t, state) {
  const battle = state.battle || {};
  const phase = battle.phase || "menu";
  ctx.clearRect(0, 0, W, H);
  voidSky(ctx, W, H, t);

  // Ambient rings around the mirror.
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = "rgba(188,160,232,.09)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.42, Math.min(W, H) * (0.3 + i * 0.1) + Math.sin(t * 0.8 + i) * 6, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();

  mirrorFrame(ctx, W, H, t, battle);

  if (battle.victory > 0) shatter(ctx, W, H, t, battle.victory);

  if (phase === "dodge" || battle.showBoard) {
    board(ctx, W, H, t, battle);
  }

  // Damage flash.
  if (battle.damageFlash > 0) {
    ctx.save();
    ctx.globalAlpha = battle.damageFlash * 0.35;
    ctx.fillStyle = "#ff2f56";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Trust burst.
  if (battle.trustBurst > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = battle.trustBurst * 0.4;
    const g = ctx.createRadialGradient(W / 2, H * 0.43, 10, W / 2, H * 0.43, W * 0.5);
    g.addColorStop(0, "rgba(255,230,169,.7)");
    g.addColorStop(1, "rgba(255,230,169,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Small Srif silhouette, lower-left, like a player token.
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.translate(W * 0.11, H * 0.8);
  const sc = clamp(H / 720, 0.7, 1.1);
  ctx.scale(sc, sc);
  ctx.fillStyle = "#0b0810";
  ctx.beginPath();
  ctx.arc(0, -84, 16, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-18, -69);
  ctx.quadraticCurveTo(-24, -38, -15, 0);
  ctx.lineTo(15, 0);
  ctx.quadraticCurveTo(24, -38, 18, -69);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(239,107,124,.35)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-12, -62);
  ctx.lineTo(2, -48);
  ctx.lineTo(-4, -26);
  ctx.stroke();
  ctx.restore();

  // Cold vignette + scanlines.
  drawVignette(ctx, W, H, 0.78);
  ctx.save();
  ctx.globalAlpha = 0.035;
  ctx.fillStyle = "#ffffff";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  ctx.restore();

  if (battle.introFade > 0) {
    ctx.save();
    ctx.globalAlpha = battle.introFade;
    ctx.fillStyle = "#06050b";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
