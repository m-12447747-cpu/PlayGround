// artscene.js — title, ending, battle set-pieces and snow.
import { PAL, rect, rr, line, ellipse, text, hash, glow, snowflake, heart } from './art.js';

export function createSnow(n = 90, w = 480, h = 270) {
  const flakes = [];
  for (let i = 0; i < n; i++) {
    flakes.push({
      x: hash(i * 1.3) * w,
      y: hash(i * 2.7) * h,
      z: 0.3 + hash(i * 3.9) * 0.7,
      s: 0.6 + hash(i * 5.1) * 1.9,
      drift: (hash(i * 7.3) - 0.5) * 10,
      phase: hash(i * 9.1) * Math.PI * 2,
    });
  }
  return flakes;
}

export function updateSnow(flakes, dt, w, h, wind = 6, ground = h + 6) {
  for (const f of flakes) {
    f.phase += dt * (0.5 + f.z);
    f.x += (wind * f.z + Math.sin(f.phase) * 4 * f.z + f.drift) * dt;
    f.y += (7 + f.z * 14) * dt;
    if (f.y > ground) { f.y = -4; f.x = Math.random() * w; }
    if (f.x > w + 6) f.x = -6;
    if (f.x < -6) f.x = w + 6;
  }
}

export function drawSnow(ctx, flakes, opt = {}) {
  const { alpha = 0.7, color = '#eaf3ff' } = opt;
  ctx.save();
  for (const f of flakes) {
    ctx.globalAlpha = alpha * (0.3 + f.z * 0.7);
    ctx.fillStyle = color;
    if (f.s > 1.9) {
      snowflake(ctx, f.x, f.y, f.s * 1.4, color, 0.5 * f.z);
    } else {
      ctx.fillRect(Math.round(f.x), Math.round(f.y), Math.max(1, f.s * 0.9), Math.max(1, f.s * 0.9));
    }
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Title                                                               */
/* ------------------------------------------------------------------ */

export function drawTitleScene(ctx, t, flakes) {
  const w = 480, h = 270;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0a1226');
  sky.addColorStop(0.38, '#172544');
  sky.addColorStop(0.68, '#2a3a60');
  sky.addColorStop(1, '#4a5d84');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // stars
  for (let i = 0; i < 44; i++) {
    const x = hash(i * 3.3) * w;
    const y = hash(i * 5.7) * 130;
    ctx.globalAlpha = 0.2 + hash(i) * 0.5 + Math.sin(t * 1.4 + i) * 0.1;
    ctx.fillStyle = i % 7 === 0 ? '#ffd48a' : '#dbe7ff';
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
  // moon
  const mx = 382, my = 58;
  glow(ctx, mx, my, 58, 'rgba(190,220,255,.18)', 'rgba(160,200,255,0)', 0.9);
  ellipse(ctx, mx, my, 19, 19, '#e8f0ff');
  ellipse(ctx, mx - 5, my - 3, 3, 3, 'rgba(150,175,215,.35)');
  ellipse(ctx, mx + 6, my + 5, 4, 3, 'rgba(150,175,215,.28)');
  ellipse(ctx, mx - 2, my + 9, 2, 2, 'rgba(150,175,215,.25)');
  // aurora ribbons
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.05 + i * 0.012;
    ctx.fillStyle = i === 1 ? '#7bd6a4' : '#8fb6ff';
    ctx.beginPath();
    ctx.moveTo(0, 60 + i * 14);
    for (let x = 0; x <= w; x += 20) {
      ctx.lineTo(x, 60 + i * 14 + Math.sin(x * 0.014 + t * 0.25 + i) * 10);
    }
    ctx.lineTo(w, 120 + i * 12);
    ctx.lineTo(0, 120 + i * 12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // distant ridge
  ctx.fillStyle = '#1c2a46';
  ctx.beginPath();
  ctx.moveTo(0, 172);
  for (let x = 0; x <= w; x += 12) {
    ctx.lineTo(x, 166 + Math.sin(x * 0.021) * 8 + Math.sin(x * 0.007) * 5);
  }
  ctx.lineTo(w, 210);
  ctx.lineTo(0, 210);
  ctx.closePath();
  ctx.fill();
  // pines silhouettes
  for (let i = 0; i < 18; i++) {
    const px = 10 + i * 28 + hash(i * 2.7) * 12;
    const py = 196 + hash(i * 4.1) * 20;
    const s = 0.38 + hash(i * 5.3) * 0.28;
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.translate(px, py);
    ctx.fillStyle = '#152238';
    for (let j = 0; j < 4; j++) {
      ctx.beginPath();
      ctx.moveTo(0, -50 * s + j * 12 * s);
      ctx.lineTo(-24 * s + j * 5 * s, 2 + j * 10 * s);
      ctx.lineTo(24 * s - j * 5 * s, 2 + j * 10 * s);
      ctx.closePath();
      ctx.fill();
    }
    rect(ctx, -2 * s, 0, 4 * s, 8 * s, '#101a2b');
    ctx.restore();
  }

  // town silhouette
  const town = [
    { x: 0, y: 188, w: 96, h: 56, roof: 10, light: 22 },
    { x: 108, y: 198, w: 68, h: 46, roof: 8, light: 40 },
    { x: 330, y: 194, w: 84, h: 50, roof: 12, light: 18 },
    { x: 424, y: 184, w: 56, h: 60, roof: 8, light: 30 },
  ];
  for (const b of town) {
    ctx.fillStyle = '#101c30';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = '#0b1525';
    ctx.beginPath();
    ctx.moveTo(b.x - 6, b.y);
    ctx.lineTo(b.x + b.w + 6, b.y);
    ctx.lineTo(b.x + b.w - 4, b.y - b.roof);
    ctx.lineTo(b.x + 4, b.y - b.roof);
    ctx.closePath();
    ctx.fill();
    // windows
    for (let i = 0; i < Math.floor(b.w / 24); i++) {
      const wx = b.x + 10 + i * 24;
      const wy = b.y + b.light;
      const warm = hash(wx + wy) > 0.3;
      ctx.fillStyle = warm ? 'rgba(255,196,110,.8)' : 'rgba(120,150,200,.18)';
      ctx.fillRect(wx, wy, 8, 10);
      if (warm) glow(ctx, wx + 4, wy + 5, 20, 'rgba(255,190,100,.12)', 'rgba(255,180,90,0)', 0.8);
    }
    rect(ctx, b.x, b.y, b.w, 2, '#c9d8ee');
    rect(ctx, b.x - 4, b.y - b.roof - 2, b.w + 8, 2, '#9fb3d0');
  }

  // foreground snow
  const snow = ctx.createLinearGradient(0, 196, 0, 270);
  snow.addColorStop(0, '#a9bcdc');
  snow.addColorStop(1, '#d7e3f5');
  ctx.fillStyle = snow;
  ctx.beginPath();
  ctx.moveTo(0, 224);
  for (let x = 0; x <= w; x += 16) {
    ctx.lineTo(x, 222 + Math.sin(x * 0.025) * 4 + Math.sin(x * 0.06) * 2);
  }
  ctx.lineTo(w, 270);
  ctx.lineTo(0, 270);
  ctx.closePath();
  ctx.fill();
  // snow drifts
  ctx.fillStyle = '#eaf2ff';
  ellipse(ctx, 120, 236, 70, 8, '#c9d8ee');
  ellipse(ctx, 390, 246, 90, 10, '#c9d8ee');
  ellipse(ctx, 60, 258, 90, 8, '#dbe7f8');

  // lamp right
  ctx.save();
  ctx.translate(326, 240);
  rect(ctx, -1.4, -48, 2.8, 48, '#1c2538');
  rect(ctx, -5, -60, 10, 12, '#111a2c');
  rect(ctx, -3.6, -58, 7.2, 7, '#ffd88e');
  glow(ctx, 0, -54, 40, 'rgba(255,200,110,.28)', 'rgba(255,190,90,0)', 0.9);
  ctx.restore();

  // Srif silhouette looking at the town
  ctx.save();
  ctx.translate(122, 236);
  ellipse(ctx, 0, 0, 9, 3, 'rgba(20,28,46,.35)');
  ctx.fillStyle = '#15203a';
  ctx.fillRect(-5, -9, 3, 9);
  ctx.fillRect(2, -9, 3, 9);
  rr(ctx, -7, -24, 14, 17, 3, '#1b2b42');
  ctx.fillStyle = '#d8c08b';
  ctx.fillRect(-4, -38, 2, 5);
  ctx.fillRect(2, -38, 2, 5);
  rr(ctx, -7, -35, 14, 12, 4.5, '#c7b49a');
  ctx.fillStyle = '#182238';
  ctx.fillRect(-6, -31, 4, 2);
  ctx.fillRect(2, -31, 4, 2);
  ctx.fillStyle = '#b63d4b';
  ctx.fillRect(-7, -25, 14, 3);
  ctx.restore();

  drawSnow(ctx, flakes, { alpha: 0.85 });
  // foreground vignette to make title text legible
  const v = ctx.createRadialGradient(240, 118, 30, 240, 135, 210);
  v.addColorStop(0, 'rgba(4,6,13,.42)');
  v.addColorStop(0.55, 'rgba(4,6,13,.18)');
  v.addColorStop(1, 'rgba(4,6,13,.62)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

/* ------------------------------------------------------------------ */
/* Ending                                                              */
/* ------------------------------------------------------------------ */

export function drawEndingScene(ctx, t, flakes) {
  const w = 480, h = 270;
  // warm room
  const wall = ctx.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, '#7b5a4c');
  wall.addColorStop(0.55, '#8f6c58');
  wall.addColorStop(1, '#5b403b');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, h);
  // wallpaper
  for (let y = 8; y < 200; y += 18) {
    for (let x = 10; x < w; x += 22) {
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#ffe9c8';
      ctx.fillRect(x, y, 1.4, 1.4);
    }
  }
  ctx.globalAlpha = 1;
  // floor
  rect(ctx, 0, 198, w, 72, '#4e3532');
  for (let y = 198; y < 270; y += 12) {
    rect(ctx, 0, y, w, 10, y % 24 < 12 ? '#5a3d38' : '#523733');
    rect(ctx, 0, y + 10, w, 1.4, '#3a2727');
  }
  // rug
  ellipse(ctx, 244, 224, 130, 32, '#6a3942');
  ellipse(ctx, 244, 224, 116, 26, '#7c4650');
  ellipse(ctx, 244, 224, 100, 20, '#5e333b');

  // big window with morning snow
  rect(ctx, 312, 14, 132, 122, '#4b3730');
  rect(ctx, 318, 20, 120, 110, '#bcd7ee');
  const sky = ctx.createLinearGradient(0, 20, 0, 130);
  sky.addColorStop(0, '#d8e9fb');
  sky.addColorStop(0.7, '#aac9e9');
  sky.addColorStop(1, '#7fa4cd');
  ctx.fillStyle = sky;
  ctx.fillRect(318, 20, 120, 110);
  // distant pines through glass
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 6; i++) {
    const px = 326 + i * 20;
    const py = 112 + hash(i) * 8;
    ctx.fillStyle = '#5c7b89';
    ctx.beginPath();
    ctx.moveTo(px, py - 30);
    ctx.lineTo(px - 10, py);
    ctx.lineTo(px + 10, py);
    ctx.closePath();
    ctx.fill();
  }
  // snowbank
  ellipse(ctx, 378, 126, 62, 10, '#eaf3ff');
  ctx.restore();
  // window cross
  rect(ctx, 376, 20, 3, 110, '#4b3730');
  rect(ctx, 318, 74, 120, 3, '#4b3730');
  // snow on sill
  rect(ctx, 310, 132, 136, 5, '#eaf3ff');
  // curtains
  ctx.fillStyle = '#8a4f50';
  ctx.beginPath();
  ctx.moveTo(302, 12);
  ctx.lineTo(330, 12);
  ctx.lineTo(326, 140);
  ctx.lineTo(302, 148);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(426, 12);
  ctx.lineTo(454, 12);
  ctx.lineTo(454, 148);
  ctx.lineTo(430, 140);
  ctx.closePath();
  ctx.fill();
  // sunlight beam
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.08 + Math.sin(t * 0.4) * 0.01;
  ctx.fillStyle = '#ffe6b8';
  ctx.beginPath();
  ctx.moveTo(318, 20);
  ctx.lineTo(360, 20);
  ctx.lineTo(210, 270);
  ctx.lineTo(90, 270);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // radiator
  rect(ctx, 326, 142, 104, 14, '#8d7b6a');
  for (let x = 330; x < 426; x += 6) rect(ctx, x, 142, 2.4, 14, '#a89481');

  // couch with Srif asleep
  rect(ctx, 98, 174, 224, 66, '#42566c');
  rect(ctx, 104, 164, 212, 20, '#4d637b');
  rect(ctx, 104, 164, 212, 4, '#697f96');
  rect(ctx, 108, 184, 94, 46, '#4a5f76');
  rect(ctx, 220, 184, 94, 46, '#4a5f76');
  rect(ctx, 202, 180, 10, 54, '#37495c');
  rect(ctx, 88, 214, 244, 26, '#3b4d60');
  rect(ctx, 88, 212, 18, 30, '#334457');
  rect(ctx, 314, 212, 18, 30, '#334457');
  // pillow
  rect(ctx, 116, 172, 44, 18, '#c9a07a');
  rect(ctx, 119, 174, 38, 13, '#d8b189');
  // blanket
  ctx.fillStyle = '#3f7a61';
  ctx.beginPath();
  ctx.moveTo(166, 186);
  ctx.quadraticCurveTo(240, 176, 300, 190);
  ctx.lineTo(306, 220);
  ctx.quadraticCurveTo(240, 232, 164, 218);
  ctx.closePath();
  ctx.fill();
  // blanket pattern
  for (let i = 0; i < 5; i++) {
    rect(ctx, 180 + i * 24, 192, 12, 2, '#e8f3e5');
    rect(ctx, 186 + i * 24, 197, 2, 8, '#e8f3e5');
  }
  rect(ctx, 164, 214, 142, 5, '#b63d4b');
  // Srif's head on pillow
  rr(ctx, 138, 178, 30, 24, 8, '#efe6d6');
  rect(ctx, 130, 184, 10, 15, '#d8cbb8');
  rect(ctx, 166, 184, 8, 13, '#d8cbb8');
  // horns
  rect(ctx, 142, 171, 4, 8, '#c8b28f');
  rect(ctx, 160, 171, 4, 8, '#c8b28f');
  // closed eyes
  rect(ctx, 144, 188, 6, 1, '#8a6a64');
  rect(ctx, 156, 188, 6, 1, '#8a6a64');
  // small smile
  rect(ctx, 150, 195, 6, 1, '#8a6a64');
  // breathing
  const br = Math.sin(t * 1.1) * 0.6;
  rect(ctx, 174, 180 + br, 4, 3, '#f6efe1');
  // mug on floor
  rect(ctx, 348, 232, 13, 11, '#e8dfd0');
  rect(ctx, 361, 234, 5, 6, '#e8dfd0');
  rect(ctx, 350, 233, 9, 2, '#6b4a3f');
  ellipse(ctx, 368, 244, 8, 2, 'rgba(30,20,20,.18)');
  // phone on table, glowing
  rect(ctx, 246, 170, 18, 10, '#1c2029');
  rect(ctx, 248, 172, 14, 6, '#5f7f9e');
  glow(ctx, 255, 175, 20, 'rgba(143,227,255,.15)', 'rgba(143,227,255,0)', 0.9);
  // warm lamp
  rect(ctx, 62, 120, 3, 70, '#4a3a34');
  ctx.fillStyle = '#d9b878';
  ctx.beginPath();
  ctx.moveTo(50, 126);
  ctx.lineTo(76, 126);
  ctx.lineTo(70, 106);
  ctx.lineTo(56, 106);
  ctx.closePath();
  ctx.fill();
  rect(ctx, 54, 124, 18, 2, '#f2d79b');
  glow(ctx, 63, 132, 70, 'rgba(255,200,110,.28)', 'rgba(255,190,100,0)', 1);
  // dust motes
  for (let i = 0; i < 26; i++) {
    const x = (hash(i * 3.1) * 480 + Math.sin(t * 0.2 + i) * 8 + 480) % 480;
    const y = 70 + hash(i * 5.7) * 160 + Math.cos(t * 0.15 + i * 2) * 5;
    ctx.globalAlpha = 0.1 + hash(i) * 0.2;
    ctx.fillStyle = '#ffe6b8';
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
  // snow outside window (gentle)
  ctx.save();
  ctx.beginPath();
  ctx.rect(318, 20, 120, 110);
  ctx.clip();
  for (const f of flakes) {
    ctx.globalAlpha = 0.4 + f.z * 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(318 + ((f.x + t * 6 * f.z) % 120), 20 + ((f.y + t * 10 * f.z) % 110), 1.4, 1.4);
  }
  ctx.restore();
  // warm vignette
  const v = ctx.createRadialGradient(244, 150, 90, 244, 150, 280);
  v.addColorStop(0, 'rgba(255,200,120,.05)');
  v.addColorStop(1, 'rgba(20,10,12,.55)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

/* ------------------------------------------------------------------ */
/* Battle                                                              */
/* ------------------------------------------------------------------ */

const WORDS = ['liar', 'smile', 'alone', 'freak', 'quiet', 'hide', 'sorry', 'cold'];

export function drawBattleBg(ctx, t, trust = 0) {
  const g = ctx.createLinearGradient(0, 0, 0, 270);
  g.addColorStop(0, '#0c0a18');
  g.addColorStop(0.5, '#171229');
  g.addColorStop(1, '#07060f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 480, 270);
  // far snow
  for (let i = 0; i < 40; i++) {
    const x = (hash(i * 2.7) * 480 + t * (2 + hash(i) * 5)) % 480;
    const y = hash(i * 4.1) * 270;
    ctx.globalAlpha = 0.1 + hash(i * 3.3) * 0.3;
    ctx.fillStyle = '#bcd3f5';
    ctx.fillRect(x, y, 1.2, 1.2);
  }
  ctx.globalAlpha = 1;
  // words in the dark
  for (let i = 0; i < 8; i++) {
    const x = 30 + hash(i * 5.1) * 420;
    const y = 30 + hash(i * 7.3) * 200 + Math.sin(t * 0.4 + i) * 5;
    const a = 0.025 + hash(i) * 0.035;
    ctx.save();
    ctx.globalAlpha = a;
    text(ctx, WORDS[i], x, y, { size: 14 + hash(i) * 14, color: '#cfe1ff', align: 'center', weight: 600, tracking: 3 });
    ctx.restore();
  }
  // floor reflection
  ctx.save();
  ctx.globalAlpha = 0.2;
  const rg = ctx.createLinearGradient(0, 190, 0, 270);
  rg.addColorStop(0, 'rgba(150,200,255,.22)');
  rg.addColorStop(1, 'rgba(150,200,255,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 190, 480, 80);
  ctx.restore();
  // floating shards
  for (let i = 0; i < 14; i++) {
    const x = hash(i * 3.9) * 480;
    const y = 24 + hash(i * 6.1) * 190 + Math.sin(t * 0.5 + i) * 6;
    const s = 2 + hash(i * 8.3) * 5;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(hash(i) * Math.PI + t * 0.05);
    ctx.globalAlpha = 0.12 + hash(i * 2.2) * 0.2;
    ctx.fillStyle = trust >= 3 ? '#ffe6c2' : '#b9dcff';
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(0, -s * 0.4);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // vignette
  const v = ctx.createRadialGradient(240, 120, 40, 240, 135, 240);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,.7)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, 480, 270);
}

export function drawColdSelf(ctx, cx, cy, t, state = {}) {
  const trust = state.trust || 0;
  const hurt = state.hurt || 0;
  const calm = trust >= 3;
  const bob = Math.sin(t * 1.2) * 2.2;
  const breathe = 1 + Math.sin(t * 1.5) * 0.008;
  ctx.save();
  ctx.translate(cx, cy + bob);
  ctx.scale(breathe, breathe);

  // under-glow
  glow(ctx, 0, 8, 92, calm ? 'rgba(255,214,170,.14)' : 'rgba(120,190,255,.13)', 'rgba(80,120,255,0)', 1);

  // stand
  ctx.fillStyle = '#1b2235';
  ctx.beginPath();
  ctx.moveTo(-26, 78);
  ctx.lineTo(26, 78);
  ctx.lineTo(14, 64);
  ctx.lineTo(-14, 64);
  ctx.closePath();
  ctx.fill();
  rect(ctx, -22, 74, 44, 6, '#2c3852');
  rect(ctx, -14, 58, 28, 8, '#33415d');

  // ornate frame
  ctx.fillStyle = '#2a3550';
  ctx.beginPath();
  ctx.ellipse(0, 0, 62, 68, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#46597a';
  ctx.beginPath();
  ctx.ellipse(0, -2, 56, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8098bd';
  ctx.beginPath();
  ctx.ellipse(0, -2, 53, 59, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a2438';
  ctx.beginPath();
  ctx.ellipse(0, -2, 47, 53, 0, 0, Math.PI * 2);
  ctx.fill();
  const glass = ctx.createLinearGradient(0, -55, 0, 52);
  glass.addColorStop(0, '#111a2c');
  glass.addColorStop(0.5, '#0a0f1c');
  glass.addColorStop(1, '#151b2c');
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.ellipse(0, -2, 44, 50, 0, 0, Math.PI * 2);
  ctx.fill();

  // frost spikes on frame
  const frost = calm ? '#f3e5ca' : '#b9dcff';
  for (let i = 0; i < 9; i++) {
    const a = -2.5 + i * 0.36;
    const sx = Math.cos(a) * 57;
    const sy = -2 + Math.sin(a) * 63;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = i % 2 ? '#718bb0' : frost;
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.lineTo(0, -8 - (i % 3) * 3);
    ctx.lineTo(3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // reflection silhouette
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -2, 42, 48, 0, 0, Math.PI * 2);
  ctx.clip();
  // shoulders
  ctx.fillStyle = '#0d1220';
  ctx.beginPath();
  ctx.ellipse(0, 44, 38, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  // head
  ctx.fillStyle = calm ? '#d9cbba' : '#bfb6a8';
  ctx.beginPath();
  ctx.ellipse(0, -8, 26, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = calm ? '#c5b39f' : '#a79c8d';
  ctx.beginPath();
  ctx.ellipse(9, -2, 16, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  // ears
  ctx.fillStyle = calm ? '#d9cbba' : '#bfb6a8';
  ctx.beginPath();
  ctx.ellipse(-28, 0, 8, 16, -0.2, 0, Math.PI * 2);
  ctx.ellipse(28, 0, 8, 16, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // horns
  ctx.fillStyle = '#8d7f6a';
  ctx.fillRect(-14, -46, 5, 14);
  ctx.fillRect(9, -46, 5, 14);
  // hair tuft
  ctx.fillStyle = calm ? '#ebe1d1' : '#d8cfc2';
  ctx.fillRect(-12, -40, 24, 5);
  // muzzle
  ctx.fillStyle = calm ? '#e8d9c5' : '#cec4b5';
  ctx.beginPath();
  ctx.ellipse(0, 8, 13, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // nose
  ctx.fillStyle = '#3a2c34';
  ctx.fillRect(-3, 2, 6, 4);
  // eyes
  if (calm) {
    ctx.fillStyle = '#4a3f44';
    ctx.fillRect(-13, -12, 7, 3);
    ctx.fillRect(6, -12, 7, 3);
    ctx.fillStyle = '#d9a6a6';
    ctx.fillRect(-15, -4, 5, 2);
    ctx.fillRect(10, -4, 5, 2);
    // tired mouth
    ctx.fillStyle = '#8a6a64';
    ctx.fillRect(-5, 16, 10, 2);
  } else {
    // too-wide grin
    ctx.fillStyle = trust >= 2 ? '#d8d2c6' : '#f2ece0';
    const gw = 20 + trust * 2;
    ctx.fillRect(-gw / 2, 10, gw, 6);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = '#0d1220';
      ctx.fillRect(-gw / 2 + 1 + i * (gw / 8), 10, 1.2, 6);
    }
    ctx.fillStyle = '#f2ece0';
    ctx.fillRect(-gw / 2 - 2, 8, 2, 3);
    ctx.fillRect(gw / 2, 8, 2, 3);
    // eyes
    ctx.fillStyle = '#ff3b5c';
    ctx.fillRect(-15, -14, 7, 4);
    ctx.fillRect(8, -14, 7, 4);
    ctx.fillStyle = '#ff9cad';
    ctx.fillRect(-14, -13, 2, 1);
    ctx.fillRect(9, -13, 2, 1);
    // brows
    ctx.fillStyle = '#6e6258';
    ctx.fillRect(-16, -20, 8, 2);
    ctx.fillRect(8, -20, 8, 2);
  }

  // cracks in the glass
  ctx.strokeStyle = calm ? 'rgba(255,230,190,.5)' : 'rgba(160,220,255,.55)';
  ctx.lineWidth = 1;
  const cracks = [
    [-30, -30, -14, -20], [-14, -20, -18, -8], [-18, -8, -6, 0],
    [26, -34, 16, -22], [16, -22, 22, -12],
    [6, 26, 18, 38], [18, 38, 12, 48],
  ];
  for (const c of cracks) {
    ctx.beginPath();
    ctx.moveTo(c[0], c[1]);
    ctx.lineTo(c[2], c[3]);
    ctx.stroke();
  }
  if (trust >= 1) {
    ctx.beginPath();
    ctx.moveTo(-38, 4);
    ctx.lineTo(-26, 10);
    ctx.lineTo(-32, 24);
    ctx.lineTo(-20, 32);
    ctx.stroke();
  }
  if (trust >= 2) {
    ctx.beginPath();
    ctx.moveTo(34, -18);
    ctx.lineTo(24, -6);
    ctx.lineTo(34, 2);
    ctx.stroke();
  }
  ctx.restore();

  // hurt flash
  if (hurt > 0) {
    ctx.globalAlpha = hurt * 0.75;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -2, 58, 64, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

export function drawBattleSnow(ctx, t, flakes, intensity = 0.4) {
  for (const f of flakes) {
    const x = (f.x + t * 5 * f.z + 480) % 480;
    const y = (f.y + t * 12 * f.z + 270) % 270;
    ctx.globalAlpha = intensity * (0.2 + f.z * 0.6);
    ctx.fillStyle = '#dbeaff';
    ctx.fillRect(x, y, 1.2, 1.2);
  }
  ctx.globalAlpha = 1;
}

export function drawSoulTrail(ctx, x, y, trail, t) {
  for (let i = 0; i < trail.length; i++) {
    const p = trail[i];
    ctx.globalAlpha = (i / trail.length) * 0.16;
    heart(ctx, p.x - 3, p.y - 4, 1, '#ff3b5c', false);
  }
  ctx.globalAlpha = 1;
  heart(ctx, x - 3.5, y - 5, 1, '#ff3b5c', true);
}
