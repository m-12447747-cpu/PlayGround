// artmap.js — static map paintings, assembled once and reused.
import { PAL, rect, rr, line, ellipse, text, hash, glow, snowflake } from './art.js';
import { MAPS } from './maps.js';

function speckles(ctx, x, y, w, h, n, light, dark, seed = 1) {
  for (let i = 0; i < n; i++) {
    const px = x + hash(seed + i * 1.13) * w;
    const py = y + hash(seed + i * 2.71) * h;
    const r = 0.6 + hash(seed + i * 3.3) * 1.6;
    rect(ctx, px, py, r, r * 0.7, hash(seed + i * 5.1) > 0.55 ? light : dark);
  }
}

function snowPile(ctx, x, y, w, h, seed = 1) {
  ctx.fillStyle = '#dbe6fa';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y, w / 2, h / 2, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  rect(ctx, x, y - h * 0.28, w, h * 0.3, '#dbe6fa');
  for (let i = 0; i < w / 7; i++) {
    rect(ctx, x + i * 7 + hash(seed + i) * 3, y - h * 0.3 + hash(seed + i * 2) * 2, 3, 1, '#edf4ff');
  }
}

/* ------------------------------------------------------------------ */
/* Town                                                                */
/* ------------------------------------------------------------------ */

function tree(ctx, tx, ty, s = 1, lights = false, t = 0) {
  const H = 96 * s;
  const W = 46 * s;
  ctx.save();
  ctx.translate(tx, ty);
  ellipse(ctx, 0, 0, 16 * s, 4 * s, 'rgba(15,22,42,.24)');
  // trunk
  rect(ctx, -3.6 * s, -18 * s, 7.2 * s, 19 * s, '#4a3a34');
  rect(ctx, -2 * s, -16 * s, 2 * s, 15 * s, '#6a5246');
  // canopy layers
  const layers = [
    { y: -22, w: 44, h: 30 },
    { y: -38, w: 38, h: 30 },
    { y: -54, w: 31, h: 28 },
    { y: -70, w: 23, h: 26 },
    { y: -84, w: 14, h: 20 },
  ];
  for (let i = 0; i < layers.length; i++) {
    const L = layers[i];
    const lw = L.w * s, lh = L.h * s;
    ctx.fillStyle = i % 2 ? '#2c4b48' : '#335650';
    ctx.beginPath();
    ctx.moveTo(0, (L.y - L.h) * s);
    ctx.lineTo(-lw / 2, L.y * s);
    ctx.quadraticCurveTo(0, L.y * s + 3 * s, lw / 2, L.y * s);
    ctx.closePath();
    ctx.fill();
    // snow cap
    ctx.fillStyle = i % 2 ? '#c8d8ed' : '#d7e5f8';
    ctx.beginPath();
    ctx.moveTo(0, (L.y - L.h) * s);
    ctx.lineTo(-lw * 0.34, (L.y - L.h * 0.34) * s);
    ctx.quadraticCurveTo(-lw * 0.1, (L.y - L.h * 0.22) * s, 0, (L.y - L.h * 0.36) * s);
    ctx.quadraticCurveTo(lw * 0.14, (L.y - L.h * 0.2) * s, lw * 0.34, (L.y - L.h * 0.34) * s);
    ctx.closePath();
    ctx.fill();
    if (i % 2 === 0) {
      rect(ctx, -lw * 0.18, (L.y - L.h * 0.58) * s, lw * 0.28, 1.4 * s, '#e7f1ff');
    }
  }
  // snow on branches
  rect(ctx, -W / 2 + 3 * s, -44 * s, 8 * s, 1.6 * s, '#e9f3ff');
  rect(ctx, W / 2 - 10 * s, -58 * s, 6 * s, 1.4 * s, '#e9f3ff');
  if (lights) {
    const cols = ['#ffd166', '#ff5d74', '#8fe3ff', '#7bd6a4', '#b9a6ff'];
    for (let i = 0; i < 17; i++) {
      const a = hash(i * 4.1) * Math.PI * 2;
      const rr2 = (12 + hash(i * 2.3) * 22) * s;
      const lx = Math.cos(a) * rr2;
      const ly = -26 * s - (i / 17) * 54 * s;
      const c = cols[i % cols.length];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.18 + Math.sin(t * 2 + i) * 0.06;
      ellipse(ctx, lx, ly, 4 * s, 4 * s, c);
      ctx.restore();
      rect(ctx, lx - 1, ly - 1, 2, 2, c);
    }
  }
  ctx.restore();
}

function lampPost(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ellipse(ctx, 0, 0, 7, 2.4, 'rgba(15,22,42,.26)');
  rect(ctx, -1.4, -58, 2.8, 58, '#2a3249');
  rect(ctx, -5, -2, 10, 3, '#1b2234');
  rect(ctx, -3, -58, 6, 4, '#1b2234');
  // lantern
  rect(ctx, -6, -68, 12, 11, '#232c44');
  rect(ctx, -4.5, -66, 9, 7, '#ffd88e');
  rect(ctx, -4.5, -63.4, 9, 1, '#c78f52');
  rect(ctx, -7.5, -69, 15, 2.2, '#38435f');
  ctx.fillStyle = '#38435f';
  ctx.beginPath();
  ctx.moveTo(-7, -69);
  ctx.lineTo(0, -74);
  ctx.lineTo(7, -69);
  ctx.closePath();
  ctx.fill();
  rect(ctx, -5, -71, 10, 1, '#e8f1ff');
  ctx.restore();
}

function bench(ctx, b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ellipse(ctx, 0, 2, 18, 3, 'rgba(15,22,42,.22)');
  rect(ctx, -16, -9, 32, 3, '#5a4038');
  rect(ctx, -16, -6, 32, 3, '#6b4d41');
  rect(ctx, -15, -15, 30, 3, '#4e382f');
  rect(ctx, -15, -12, 30, 3, '#5a4038');
  rect(ctx, -14, -9, 2.4, 10, '#33251f');
  rect(ctx, 11.6, -9, 2.4, 10, '#33251f');
  rect(ctx, -16, -16, 32, 1.4, '#dbe6fa');
  rect(ctx, -15, -10, 30, 1, '#dbe6fa');
  ctx.restore();
}

function townSign(ctx, x, y, title, lines) {
  ctx.save();
  ctx.translate(x, y);
  ellipse(ctx, 0, 1, 22, 3, 'rgba(15,22,42,.24)');
  rect(ctx, -2, -30, 3, 30, '#4b3a30');
  rect(ctx, 18, -30, 3, 30, '#4b3a30');
  rect(ctx, -25, -58, 50, 30, '#533d31');
  rect(ctx, -23, -56, 46, 26, '#3b2c25');
  rect(ctx, -23, -56, 46, 2, '#dbe6fa');
  text(ctx, title, 0, -44, { size: 8, color: '#f2e6d2', align: 'center', weight: 600, tracking: 1 });
  text(ctx, lines[0], 0, -35.5, { size: 4.6, color: '#b9c8e0', align: 'center' });
  text(ctx, lines[1] || '', 0, -30.5, { size: 3.8, color: '#8fa3c2', align: 'center' });
  // little snow cap
  rect(ctx, -23, -58, 46, 2.4, '#e7f0ff');
  ctx.restore();
}

function truck(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ellipse(ctx, 0, 0, 58, 7, 'rgba(10,16,32,.26)');
  // cargo box
  rect(ctx, -54, -50, 84, 42, '#d8d3c6');
  rect(ctx, -54, -50, 84, 4, '#ece8dd');
  rect(ctx, -54, -10, 84, 6, '#a9a396');
  rect(ctx, -54, -50, 3, 46, '#b9b3a5');
  rect(ctx, -54, -58, 84, 8, '#e9e5da');
  // branding
  text(ctx, 'DREEMURR', -40, -35, { size: 9, color: '#4a5570', weight: 600, tracking: 0.8 });
  text(ctx, 'MOVING CO.', -40, -27, { size: 5, color: '#7b8499', tracking: 1.2 });
  text(ctx, 'OPPIDAN OR BUST', 24, -18, { size: 4, color: '#8a93a6', align: 'right' });
  rect(ctx, -50, -46, 15, 10, '#b9b3a5');
  rect(ctx, -48, -44, 11, 6, '#8d877a');
  // cab
  rect(ctx, 30, -38, 28, 28, '#6d7f9c');
  rect(ctx, 34, -34, 18, 12, '#aebfd8');
  rect(ctx, 34, -21, 18, 4, '#4f5e78');
  rect(ctx, 31, -36, 26, 3, '#c9d5e6');
  rect(ctx, 55, -18, 6, 6, '#e8d38a');
  // wheels
  for (const wx of [-38, 42]) {
    ellipse(ctx, wx, -4, 8, 8, '#191d29');
    ellipse(ctx, wx, -4, 4, 4, '#5a6378');
    rect(ctx, wx - 4, -8, 2, 2, '#8a93a6');
  }
  // snow
  rect(ctx, -52, -59, 80, 3, '#edf4ff');
  rect(ctx, 32, -39, 24, 2, '#e6efff');
  // boxes by the door
  text(ctx, 'FRAGILE', 18, -6, { size: 3.6, color: '#8a93a6' });
  ctx.restore();
}

function crate(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ellipse(ctx, 0, 0, 10, 2.6, 'rgba(15,22,42,.2)');
  rect(ctx, -9, -16, 18, 16, '#8a6a4f');
  rect(ctx, -9, -16, 18, 2, '#a98664');
  rect(ctx, -1, -16, 2, 16, '#6f523d');
  rect(ctx, -9, -9, 18, 2, '#6f523d');
  rect(ctx, -9, -17, 18, 2, '#e2ecfb');
  ctx.restore();
}

function fence(ctx, f) {
  ctx.save();
  rect(ctx, f.x, f.y, f.w, 3, '#5b4638');
  rect(ctx, f.x, f.y + 5, f.w, 2, '#4b382d');
  for (let x = f.x + 4; x < f.x + f.w; x += 12) {
    rect(ctx, x, f.y - 8, 3, 18, '#4b382d');
    rect(ctx, x, f.y - 9, 3, 2, '#dbe6fa');
  }
  rect(ctx, f.x, f.y - 5, f.w, 1.2, '#dbe6fa');
  ctx.restore();
}

function snowmanProp(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ellipse(ctx, 0, 0, 12, 3, 'rgba(15,22,42,.22)');
  ellipse(ctx, 0, -7, 7.6, 6.6, '#e8f0ff');
  ellipse(ctx, 0, -15, 5.8, 5.2, '#dbe7fc');
  ellipse(ctx, 0, -21.5, 4.4, 4, '#cfdff8');
  rect(ctx, -2, -16, 1.2, 1.2, '#2a3148');
  rect(ctx, 0.8, -16, 1.2, 1.2, '#2a3148');
  rect(ctx, -1.4, -22, 1, 1, '#2a3148');
  rect(ctx, 0.4, -22, 1, 1, '#2a3148');
  ctx.fillStyle = '#e2834f';
  ctx.beginPath();
  ctx.moveTo(0, -19.6);
  ctx.lineTo(5, -18.6);
  ctx.lineTo(0, -17.8);
  ctx.closePath();
  ctx.fill();
  line(ctx, -6.4, -12, -12, -17, '#5a4636', 1.3);
  line(ctx, 6.4, -12, 12, -16, '#5a4636', 1.3);
  line(ctx, -9, -16, -11.5, -13.6, '#5a4636', 1);
  rect(ctx, -4.8, -11.6, 9.6, 2.6, '#b63d4b');
  rect(ctx, 2.4, -10.4, 2.4, 5.4, '#b63d4b');
  rect(ctx, -4.8, -27, 9.6, 3.6, '#232839');
  rect(ctx, -6.6, -23.8, 13.2, 1.4, '#151a28');
  rect(ctx, -5.4, -27.6, 10.8, 1.2, '#e7f0ff');
  ctx.restore();
}

function hydrant(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ellipse(ctx, 0, 0, 4, 1.6, 'rgba(15,22,42,.22)');
  rect(ctx, -2.4, -9, 4.8, 9, '#b0474a');
  rect(ctx, -4, -6.4, 8, 2, '#8e3538');
  rect(ctx, -3, -10.4, 6, 2, '#c9585a');
  rect(ctx, -3.6, -11.4, 7.2, 1.4, '#e6efff');
  ctx.restore();
}

function trash(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ellipse(ctx, 0, 0, 6, 2, 'rgba(15,22,42,.22)');
  rect(ctx, -5, -11, 10, 11, '#3d4a5f');
  rect(ctx, -6, -12.6, 12, 2, '#2a3445');
  rect(ctx, -4, -14, 8, 1.6, '#8a97ab');
  rect(ctx, -6, -13.4, 12, 1.4, '#dbe6fa');
  ctx.restore();
}

function windowGlow(ctx, x, y, w, h, color = 'rgba(255,190,100,.28)') {
  glow(ctx, x + w / 2, y + h / 2, Math.max(w, h) * 1.15, color, 'rgba(255,180,90,0)', 0.9);
}

function building(ctx, b) {
  const { x, y, w, h, kind } = b;
  const doorX = b.doorX;
  const wall = kind === 'house' ? '#4b3b50' : kind === 'police' ? '#344362' : kind === 'diner' ? '#563e4a' : '#3c4e48';
  const wallDark = kind === 'house' ? '#3a2c3f' : kind === 'police' ? '#26334d' : kind === 'diner' ? '#45313c' : '#2f3f3a';
  const trim = kind === 'police' ? '#93a8c8' : '#c7b9aa';
  const roof = kind === 'house' ? '#292538' : kind === 'police' ? '#1e2b44' : kind === 'diner' ? '#33232c' : '#24332d';

  ctx.save();
  // ground shadow
  ellipse(ctx, x + w / 2, y + h, w * 0.62, 7, 'rgba(10,16,32,.3)');
  // chimney & smoke
  if (kind !== 'diner') {
    const cx = x + w - 36;
    rect(ctx, cx, y - 44, 18, 34, '#574553');
    rect(ctx, cx, y - 44, 18, 3, '#6d5967');
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.globalAlpha = 0.16 - i * 0.025;
      ellipse(ctx, cx + 8 + Math.sin(i * 2.1) * 5, y - 52 - i * 9, 7 + i * 2, 5 + i, '#dce7f7');
      ctx.restore();
    }
  }
  // wall
  rect(ctx, x, y, w, h, wall);
  // siding
  for (let sy = y + 8; sy < y + h - 10; sy += 9) {
    rect(ctx, x + 2, sy, w - 4, 1, wallDark);
  }
  // corner boards & foundation
  rect(ctx, x, y, 4, h, trim);
  rect(ctx, x + w - 4, y, 4, h, trim);
  rect(ctx, x + 4, y + h - 6, w - 8, 6, '#6f6a76');
  rect(ctx, x + 10, y + h - 5, w - 20, 1, '#85808b');
  // windows
  const winY = y + 34;
  const winW = 27;
  const winH = 25;
  const winXs = kind === 'diner' ? [x + 22, x + w - 49] : [x + 22, x + w - 49];
  for (const wx of winXs) {
    // frame
    rect(ctx, wx - 3, winY - 3, winW + 6, winH + 6, '#d9dfe9');
    rect(ctx, wx - 1, winY - 1, winW + 2, winH + 2, '#3a3a4a');
    // warm panes
    const g = ctx.createLinearGradient(wx, winY, wx, winY + winH);
    g.addColorStop(0, '#ffe6a8');
    g.addColorStop(0.6, '#ffc46e');
    g.addColorStop(1, '#df8e4d');
    ctx.fillStyle = g;
    ctx.fillRect(wx, winY, winW, winH);
    // curtains
    rect(ctx, wx, winY, 4, winH, 'rgba(120,50,60,.42)');
    rect(ctx, wx + winW - 4, winY, 4, winH, 'rgba(120,50,60,.42)');
    rect(ctx, wx + winW / 2 - 1, winY, 2, winH, '#50404c');
    rect(ctx, wx, winY + winH / 2 - 1, winW, 2, '#50404c');
    // sill & snow
    rect(ctx, wx - 5, winY + winH + 3, winW + 10, 3, '#cfc6bb');
    rect(ctx, wx - 4, winY + winH + 2, winW + 8, 1.6, '#eef4ff');
    // icicles
    rect(ctx, wx + 4, winY + winH + 6, 1.2, 3, '#d8ecff');
    rect(ctx, wx + winW - 8, winY + winH + 6, 1.4, 4, '#d8ecff');
    windowGlow(ctx, wx, winY, winW, winH);
  }
  // door
  const dx = doorX - 12;
  const dy = y + h - 38;
  rect(ctx, dx - 3, dy - 3, 30, 41, '#2c2834');
  rect(ctx, dx, dy, 24, 38, kind === 'diner' ? '#6a3c42' : '#5d3c3d');
  rect(ctx, dx + 2, dy + 2, 20, 15, '#4b3033');
  rect(ctx, dx + 2, dy + 19, 20, 15, '#4b3033');
  rect(ctx, dx + 4, dy + 4, 16, 11, '#5b3a3d');
  rect(ctx, dx + 4, dy + 21, 16, 11, '#5b3a3d');
  rect(ctx, dx + 19, dy + 18, 2.4, 2.4, '#e2c47a');
  rect(ctx, dx - 4, dy + 38, 32, 3, '#9c948b');
  // snow on step
  rect(ctx, dx - 5, dy + 37, 34, 2, '#e8f0ff');
  // sign board
  if (kind !== 'diner') {
    const sw = Math.max(54, b.name.length * 5 + 16);
    rect(ctx, doorX - sw / 2, y + 9, sw, 13, '#2b2a34');
    rect(ctx, doorX - sw / 2 + 2, y + 11, sw - 4, 9, '#3c3844');
    text(ctx, b.name, doorX, y + 18.2, { size: 5.2, color: '#e7dcc6', align: 'center', weight: 600, tracking: 0.8 });
  }

  if (kind === 'police') {
    rect(ctx, x + 8, y + 12, 30, 8, '#2e4b82');
    text(ctx, 'POLICE', x + 23, y + 18, { size: 4.4, color: '#cfe0ff', align: 'center', tracking: 0.8 });
    rect(ctx, x + 8, y + 12, 30, 1, '#8fb3e8');
    rect(ctx, doorX + 12, dy - 10, 5, 5, '#8fb3e8');
  }
  if (kind === 'house') {
    // wreath
    ctx.save();
    ctx.strokeStyle = '#3f6d50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(doorX, dy + 12, 5, 0, Math.PI * 2);
    ctx.stroke();
    rect(ctx, doorX - 1, dy + 16, 2, 3, '#b63d4b');
    ctx.restore();
    // mailbox
    rect(ctx, x + w + 8, y + h - 16, 3, 16, '#3d3a42');
    rect(ctx, x + w + 3, y + h - 20, 13, 6, '#5d5a66');
    rect(ctx, x + w + 4, y + h - 21, 11, 2, '#e7f0ff');
  }
  if (kind === 'diner') {
    // awning
    for (let i = 0; i < 9; i++) {
      rect(ctx, x + 4 + i * ((w - 8) / 9), y + 22, (w - 8) / 9, 9, i % 2 ? '#c9c0ae' : '#9e3f45');
    }
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = i % 2 ? '#c9c0ae' : '#9e3f45';
      ctx.beginPath();
      ctx.arc(x + 4 + i * ((w - 8) / 9) + (w - 8) / 18, y + 31, (w - 8) / 18, 0, Math.PI);
      ctx.fill();
    }
    rect(ctx, x + 4, y + 31, w - 8, 1.4, '#e8f0ff');
    // big sign above roof
    const sw = 106;
    rect(ctx, doorX - sw / 2, y - 28, sw, 24, '#2b2027');
    rect(ctx, doorX - sw / 2 + 2, y - 26, sw - 4, 20, '#3d262d');
    rect(ctx, doorX - sw / 2, y - 28, sw, 1.6, '#e9dcc4');
    text(ctx, 'COPPER KETTLE', doorX, y - 13.5, { size: 8.4, color: '#ffd48a', align: 'center', weight: 600, glow: '#ffb45e' });
    text(ctx, 'COCOA · PIE · WARMTH', doorX, y - 6.5, { size: 3.8, color: '#c9a98d', align: 'center', tracking: 0.6 });
    // mug icon
    rect(ctx, doorX - sw / 2 + 5, y - 22, 8, 8, '#e8dac5');
    rect(ctx, doorX - sw / 2 + 13, y - 20, 3, 4, '#e8dac5');
    // open sign in window
    text(ctx, 'OPEN', x + 35, winY + 16, { size: 6.5, color: '#ff8f9e', align: 'center', weight: 600, glow: '#ff3b5c' });
    // string lights
    for (let i = 0; i < 8; i++) {
      const lx = x + 10 + i * ((w - 20) / 7);
      const ly = y + 38 + Math.sin(i * 1.4) * 3;
      rect(ctx, lx - 1, ly - 1, 2, 2, ['#ffd166', '#ff5d74', '#8fe3ff', '#7bd6a4'][i % 4]);
    }
  }
  if (kind === 'holiday') {
    // string lights
    ctx.save();
    ctx.strokeStyle = '#4a5a4a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 30);
    ctx.quadraticCurveTo(x + w / 2, y + 44, x + w - 2, y + 30);
    ctx.stroke();
    for (let i = 0; i < 10; i++) {
      const p = i / 9;
      const lx = x + 2 + p * (w - 4);
      const ly = y + 30 + Math.sin(p * Math.PI) * 12;
      const c = ['#ffd166', '#ff5d74', '#8fe3ff', '#7bd6a4'][i % 4];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.2;
      ellipse(ctx, lx, ly, 3.4, 3.4, c);
      ctx.restore();
      rect(ctx, lx - 1, ly - 1, 2, 2, c);
    }
    ctx.restore();
    // wreath with antlers
    ctx.save();
    ctx.strokeStyle = '#3f6d50';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(doorX, dy + 12, 7, 0, Math.PI * 2);
    ctx.stroke();
    line(ctx, doorX - 5, dy + 5, doorX - 10, dy - 3, '#b68f5f', 1.6);
    line(ctx, doorX + 5, dy + 5, doorX + 10, dy - 3, '#b68f5f', 1.6);
    rect(ctx, doorX - 1, dy + 17, 2, 4, '#b63d4b');
    ctx.restore();
  }

  // roof
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 2);
  ctx.lineTo(x + w + 10, y + 2);
  ctx.lineTo(x + w - 2, y - 26);
  ctx.lineTo(x + 2, y - 26);
  ctx.closePath();
  ctx.fill();
  // roof shingles
  for (let ry = y - 22; ry < y; ry += 5) {
    rect(ctx, x + 4, ry, w - 8, 1, 'rgba(255,255,255,.05)');
  }
  // snow on roof
  ctx.fillStyle = '#d7e4f6';
  ctx.beginPath();
  ctx.moveTo(x - 11, y + 3);
  ctx.lineTo(x + w + 11, y + 3);
  ctx.lineTo(x + w + 6, y - 2.6);
  ctx.lineTo(x - 6, y - 2.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#edf5ff';
  ctx.beginPath();
  ctx.moveTo(x + 1, y - 26);
  ctx.lineTo(x + w - 1, y - 26);
  ctx.lineTo(x + w - 6, y - 30);
  ctx.lineTo(x + 6, y - 30);
  ctx.closePath();
  ctx.fill();
  // icicles
  for (let i = 0; i < Math.floor(w / 16); i++) {
    const ix = x + 8 + i * 16 + hash(i + w) * 4;
    const ih = 2 + hash(i * 3.1) * 6;
    rect(ctx, ix, y + 2, 1.4, ih, '#cfe6ff');
  }
  // snow banks at base
  snowPile(ctx, x - 4, y + h + 2, 34, 6, x);
  snowPile(ctx, x + w - 30, y + h + 2, 34, 6, x + 11);
  ctx.restore();
}

function buildTown(ctx, map, t) {
  const g = ctx.createLinearGradient(0, 0, 0, map.h);
  g.addColorStop(0, '#8095bc');
  g.addColorStop(0.45, '#9eb1d4');
  g.addColorStop(1, '#bccbe6');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, map.w, map.h);
  speckles(ctx, 0, 0, map.w, map.h, 800, 'rgba(238,245,255,.35)', 'rgba(110,130,170,.18)', 3);
  // distant pines along the top
  for (let i = 0; i < 16; i++) {
    const px = 20 + i * 70 + hash(i) * 30;
    const py = 196 + hash(i * 2) * 18;
    ctx.save();
    ctx.globalAlpha = 0.32;
    tree(ctx, px, py, 0.55 + hash(i * 3) * 0.25, false, t);
    ctx.restore();
  }
  // plaza
  rect(ctx, 408, 222, 334, 208, '#7e8fb3');
  rect(ctx, 408, 222, 334, 4, '#95a6c8');
  rect(ctx, 408, 426, 334, 4, '#6b7da1');
  for (let yy = 230; yy < 430; yy += 22) {
    for (let xx = 416; xx < 742; xx += 26) {
      rect(ctx, xx, yy, 22, 18, (Math.floor(xx / 26) + Math.floor(yy / 22)) % 2 ? '#8798ba' : '#8090b3');
      rect(ctx, xx, yy, 22, 1, '#93a3c3');
    }
  }
  speckles(ctx, 410, 224, 330, 204, 260, 'rgba(238,245,255,.45)', 'rgba(95,112,150,.2)', 41);
  // snow drifts on plaza corners
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    snowPile(ctx, 412 + i * 54, 424 - (i % 2) * 6, 44, 5, i + 9);
    ctx.restore();
  }
  // sidewalks
  rect(ctx, 0, 430, 1120, 36, '#8496b9');
  rect(ctx, 0, 430, 1120, 3, '#a4b4d2');
  rect(ctx, 0, 464, 1120, 3, '#65769a');
  rect(ctx, 0, 546, 1120, 32, '#889abd');
  rect(ctx, 0, 546, 1120, 3, '#a8b8d6');
  rect(ctx, 0, 576, 1120, 3, '#6b7da1');
  // paving lines
  for (let x = 0; x < 1120; x += 26) {
    rect(ctx, x, 432, 1, 31, 'rgba(90,107,145,.25)');
    rect(ctx, x, 548, 1, 28, 'rgba(90,107,145,.2)');
  }
  // road
  rect(ctx, 0, 467, 1120, 79, '#4c5a78');
  rect(ctx, 0, 467, 1120, 3, '#6a7a9c');
  rect(ctx, 0, 543, 1120, 3, '#394662');
  // tire tracks
  for (const ty of [487, 503, 517, 533]) {
    rect(ctx, 0, ty, 1120, 1.6, 'rgba(30,39,58,.35)');
  }
  for (let x = 0; x < 1120; x += 60) {
    rect(ctx, x, 505, 30, 2.6, 'rgba(219,201,133,.5)');
  }
  // crosswalk
  for (let i = 0; i < 6; i++) {
    rect(ctx, 548 + i * 14, 470, 7, 73, 'rgba(218,229,245,.45)');
  }
  // slush at curbs
  for (let i = 0; i < 26; i++) {
    const x = hash(i * 3.1) * 1120;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ellipse(ctx, x, 468, 12 + hash(i) * 14, 2.5, '#c6d3e8');
    ellipse(ctx, x, 544, 14 + hash(i * 2) * 12, 2.5, '#c6d3e8');
    ctx.restore();
  }
  // shoveled paths from doors
  for (const b of map.buildings) {
    rect(ctx, b.doorX - 12, 430, 24, 38, '#c4d2e9');
    rect(ctx, b.doorX - 9, 430, 18, 38, '#d8e4f6');
    for (let yy = 434; yy < 466; yy += 8) rect(ctx, b.doorX - 7, yy, 14, 1, 'rgba(150,168,200,.25)');
  }
  // path from plaza to road
  rect(ctx, 548, 426, 54, 42, '#c9d7ec');
  // pines at edges
  for (const tr of map.trees) tree(ctx, tr.x, tr.y, tr.s, tr.lights, t);
  // buildings, back to front
  const sorted = [...map.buildings].sort((a, b) => a.y + a.h - (b.y + b.h));
  for (const b of sorted) building(ctx, b);
  // street furniture
  for (const b of map.benches) bench(ctx, b);
  for (const l of map.lamps) lampPost(ctx, l.x, l.y);
  for (const p of map.props) {
    switch (p.type) {
      case 'snowman': snowmanProp(ctx, p.x, p.y); break;
      case 'sign': townSign(ctx, p.x, p.y, p.title, p.lines); break;
      case 'truck': truck(ctx, p.x, p.y); break;
      case 'crate': crate(ctx, p.x, p.y); break;
      case 'fence': fence(ctx, p); break;
      case 'hydrant': hydrant(ctx, p.x, p.y); break;
      case 'trash': trash(ctx, p.x, p.y); break;
      default: break;
    }
  }
  // foreground snow banks
  snowPile(ctx, 0, 700, 180, 18, 7);
  snowPile(ctx, 330, 730, 220, 22, 22);
  snowPile(ctx, 760, 712, 260, 20, 34);
  speckles(ctx, 0, 580, 1120, 180, 260, 'rgba(240,246,255,.5)', 'rgba(110,130,170,.16)', 77);
  // warm windows, additive pass
  for (const b of map.buildings) {
    windowGlow(ctx, b.x + 22, b.y + 34, 27, 25);
    windowGlow(ctx, b.x + b.w - 49, b.y + 34, 27, 25);
  }
}

/* ------------------------------------------------------------------ */
/* Interiors                                                           */
/* ------------------------------------------------------------------ */

function buildDiner(ctx, map, t) {
  // floor
  rect(ctx, 0, 0, 480, 270, '#4a3331');
  for (let y = 84; y < 270; y += 13) {
    rect(ctx, 0, y, 480, 12, y % 26 < 13 ? '#5a403b' : '#543a36');
    rect(ctx, 0, y + 11, 480, 1.4, '#3b2828');
    for (let x = 0; x < 480; x += 70) {
      rect(ctx, x + ((y / 13) % 2) * 34, y + 3, 1, 8, 'rgba(30,20,22,.18)');
    }
  }
  // back wall
  rect(ctx, 0, 0, 480, 84, '#3b2b38');
  rect(ctx, 0, 0, 480, 6, '#2a1f2a');
  rect(ctx, 0, 68, 480, 16, '#4d3744');
  rect(ctx, 0, 68, 480, 2, '#6d5060');
  rect(ctx, 0, 82, 480, 3, '#2a1f2a');
  for (let x = 0; x < 480; x += 24) {
    rect(ctx, x, 0, 1, 68, 'rgba(20,12,20,.22)');
    rect(ctx, x + 11, 8, 1, 52, 'rgba(255,255,255,.025)');
  }
  // windows to the snow
  for (const wx of [52, 392]) {
    rect(ctx, wx, 12, 40, 44, '#1b263d');
    rect(ctx, wx + 2, 14, 36, 40, '#2b3f61');
    rect(ctx, wx + 2, 38, 36, 16, '#415a80');
    // snow silhouettes
    ctx.save();
    ctx.globalAlpha = 0.5;
    ellipse(ctx, wx + 20, 55, 18, 5, '#c7d7ef');
    ctx.restore();
    rect(ctx, wx, 12, 40, 2, '#d9c7b1');
    rect(ctx, wx + 19, 12, 2, 44, '#d9c7b1');
    rect(ctx, wx, 33, 40, 2, '#d9c7b1');
    snowflake(ctx, wx + 9, 26, 3, '#a9c4ea', 0.6);
    snowflake(ctx, wx + 30, 20, 2.4, '#a9c4ea', 0.4);
  }
  // chalk menu board
  rect(ctx, 118, 8, 150, 50, '#2b242b');
  rect(ctx, 121, 11, 144, 44, '#252128');
  rect(ctx, 121, 11, 144, 1, 'rgba(255,255,255,.12)');
  text(ctx, 'TODAY', 193, 22, { size: 6, color: '#ffd48a', align: 'center', weight: 600, tracking: 1.2 });
  text(ctx, 'cocoa ......... 2', 130, 33, { size: 4.6, color: '#cfd9e8' });
  text(ctx, 'pie .......... 3', 130, 42, { size: 4.6, color: '#cfd9e8' });
  text(ctx, 'soup ......... 4', 130, 51, { size: 4.6, color: '#cfd9e8' });
  // kitchen pass
  rect(ctx, 288, 10, 132, 58, '#1f1a23');
  rect(ctx, 292, 14, 124, 40, '#40302f');
  rect(ctx, 292, 14, 124, 3, '#6e4d3e');
  for (let i = 0; i < 5; i++) {
    rect(ctx, 300 + i * 22, 20, 12, 2, '#b9a58b');
    rect(ctx, 300 + i * 22, 24, 12, 1.4, '#8d7a63');
  }
  rect(ctx, 292, 48, 124, 9, '#2a2026');
  rect(ctx, 285, 55, 138, 5, '#7a5a45');
  // hanging lamps
  for (const lx of [170, 330]) {
    rect(ctx, lx, 0, 1.4, 18, '#1d1a22');
    ctx.fillStyle = '#2d2931';
    ctx.beginPath();
    ctx.moveTo(lx - 8, 26);
    ctx.lineTo(lx + 8, 26);
    ctx.lineTo(lx + 5, 18);
    ctx.lineTo(lx - 5, 18);
    ctx.closePath();
    ctx.fill();
    rect(ctx, lx - 4, 25, 8, 2.4, '#ffe1a1');
    glow(ctx, lx, 30, 40, 'rgba(255,190,100,.2)', 'rgba(255,180,90,0)', 0.8);
  }
  // counter
  rect(ctx, 132, 96, 296, 40, '#5b3b34');
  rect(ctx, 132, 96, 296, 5, '#9b7355');
  rect(ctx, 132, 100, 296, 6, '#6e4a3c');
  rect(ctx, 132, 106, 296, 30, '#4d312f');
  for (let x = 138; x < 424; x += 36) {
    rect(ctx, x, 108, 28, 22, '#573936');
    rect(ctx, x, 108, 28, 1.4, '#704842');
    rect(ctx, x + 11, 108, 1.4, 22, 'rgba(30,18,20,.25)');
  }
  rect(ctx, 132, 132, 296, 3, '#2b1d20');
  // stools
  for (const sx of [176, 218, 260, 302]) {
    ellipse(ctx, sx, 152, 8, 2, 'rgba(15,12,20,.25)');
    rect(ctx, sx - 1.2, 138, 2.4, 14, '#3a2c2c');
    ellipse(ctx, sx, 137, 8, 3, '#8d3f4a');
    rect(ctx, sx - 7, 135, 14, 1.6, '#b65a63');
    ellipse(ctx, sx, 152, 5, 1.6, '#2a2026');
  }
  // register + mugs
  rect(ctx, 372, 82, 22, 14, '#3f4a55');
  rect(ctx, 374, 84, 18, 9, '#2a333e');
  rect(ctx, 376, 86, 14, 4, '#7d9b8e');
  rect(ctx, 160, 88, 8, 6, '#e8dfd0');
  rect(ctx, 169, 89, 3, 3, '#e8dfd0');
  rect(ctx, 162, 87, 4, 1.4, '#f3ede2');
  rect(ctx, 196, 90, 7, 5, '#e8dfd0');
  rect(ctx, 205, 90, 2.4, 2.4, '#e8dfd0');
  // pie stand
  rect(ctx, 330, 84, 18, 9, '#d9cbb9');
  rect(ctx, 332, 80, 14, 5, '#b06152');
  rect(ctx, 334, 79, 10, 2, '#e8d5b8');
  // booths right
  rect(ctx, 360, 160, 112, 84, '#3b2932');
  rect(ctx, 366, 166, 100, 10, '#7b3540');
  rect(ctx, 366, 166, 100, 3, '#a34a56');
  rect(ctx, 366, 220, 100, 10, '#7b3540');
  rect(ctx, 366, 220, 100, 3, '#a34a56');
  rect(ctx, 410, 180, 12, 40, '#6a4c3d');
  rect(ctx, 407, 177, 18, 4, '#9b7355');
  rect(ctx, 410, 180, 12, 3, '#c8b9a4');
  // bathroom door on the left wall
  rect(ctx, 24, 140, 36, 56, '#2a1e24');
  rect(ctx, 28, 144, 28, 48, '#5f4a44');
  rect(ctx, 30, 146, 24, 18, '#4c3a37');
  rect(ctx, 30, 168, 24, 20, '#4c3a37');
  rect(ctx, 50, 164, 2, 3, '#d9c07d');
  rect(ctx, 22, 138, 40, 3, '#7a5a4a');
  text(ctx, 'WASHROOM', 44, 134, { size: 4.4, color: '#d7c3ae', align: 'center', tracking: 0.8 });
  // front door / mat
  rect(ctx, 218, 246, 44, 22, '#2b1e23');
  rect(ctx, 222, 248, 36, 20, '#6b4b48');
  rect(ctx, 240, 248, 1.4, 20, '#4b3233');
  rect(ctx, 208, 252, 64, 10, '#4a2b2e');
  rect(ctx, 212, 254, 56, 6, '#6b3b40');
  text(ctx, 'WELCOME', 240, 259, { size: 3.6, color: '#b78888', align: 'center', tracking: 1.4 });
  // plant + coat rack
  rect(ctx, 438, 196, 4, 38, '#3c2b23');
  rect(ctx, 430, 206, 20, 4, '#3c2b23');
  for (let i = 0; i < 4; i++) {
    ellipse(ctx, 440 + Math.sin(i * 2) * 6, 198 - i * 3, 8, 3, '#3f6d50');
  }
  // warm ambient
  glow(ctx, 240, 120, 170, 'rgba(255,190,110,.11)', 'rgba(255,180,90,0)', 0.8);
}

function buildBathroom(ctx, map, t) {
  // wall tiles
  rect(ctx, 0, 0, 480, 270, '#839f9e');
  for (let x = 0; x < 480; x += 16) {
    rect(ctx, x, 0, 1, 270, 'rgba(70,94,94,.25)');
  }
  for (let y = 0; y < 270; y += 16) {
    rect(ctx, 0, y, 480, 1, 'rgba(70,94,94,.25)');
  }
  // upper wall tile
  for (let y = 0; y < 74; y += 12) {
    for (let x = 0; x < 480; x += 12) {
      rect(ctx, x, y, 11, 11, (Math.floor(x / 12) + Math.floor(y / 12)) % 2 ? '#8aa6a4' : '#91adab');
    }
  }
  rect(ctx, 0, 72, 480, 3, '#5c7777');
  // lower wall
  rect(ctx, 0, 75, 480, 12, '#6e8b89');
  rect(ctx, 0, 86, 480, 4, '#506b6b');
  // wall baseboard
  rect(ctx, 0, 174, 480, 6, '#4c6463');
  rect(ctx, 0, 178, 480, 2, '#a8bfbc');
  // floor
  rect(ctx, 0, 180, 480, 90, '#5e7778');
  for (let y = 180; y < 270; y += 14) {
    for (let x = 0; x < 480; x += 14) {
      const c = (Math.floor(x / 14) + Math.floor(y / 14)) % 2 ? '#627b7b' : '#597171';
      rect(ctx, x, y, 13, 13, c);
      rect(ctx, x, y, 13, 1, '#6f8989');
    }
  }
  // grout
  for (let x = 0; x < 480; x += 14) rect(ctx, x, 180, 1, 90, 'rgba(50,68,68,.35)');
  // puddle
  ctx.save();
  ctx.globalAlpha = 0.35;
  ellipse(ctx, 150, 200, 36, 10, '#bcd7d8');
  ellipse(ctx, 180, 210, 18, 6, '#cfe4e5');
  ctx.restore();
  // ceiling light
  rect(ctx, 186, 0, 108, 6, '#434c4e');
  rect(ctx, 192, 4, 96, 4, '#f2f7e8');
  glow(ctx, 240, 12, 130, 'rgba(220,255,235,.12)', 'rgba(200,255,230,0)', 0.9);
  // sinks & mirrors
  for (let i = 0; i < 3; i++) {
    const sx = 114 + i * 70;
    // mirror
    rect(ctx, sx - 18, 26, 36, 34, '#465b5b');
    rect(ctx, sx - 16, 28, 32, 30, '#718b92');
    rect(ctx, sx - 16, 28, 32, 8, '#89a4aa');
    rect(ctx, sx - 16, 28, 32, 1, '#b6cdd0');
    rect(ctx, sx + 4, 31, 3, 22, 'rgba(255,255,255,.12)');
    // sink
    rect(ctx, sx - 11, 72, 22, 9, '#dce6e4');
    rect(ctx, sx - 9, 74, 18, 5, '#b9c8c7');
    rect(ctx, sx - 1.4, 66, 2.8, 7, '#a9b9b8');
    rect(ctx, sx - 4, 64, 8, 2, '#dce6e4');
    rect(ctx, sx - 6, 81, 12, 18, '#c9d6d4');
    rect(ctx, sx - 8, 98, 16, 3, '#96a9a8');
    // soap
    rect(ctx, sx + 14, 72, 3, 4, '#e8dfb8');
    // tile highlight
    rect(ctx, sx - 14, 58, 28, 1, 'rgba(230,245,245,.18)');
  }
  // cracked mirror smile over middle mirror
  const mx = 184, my = 44;
  line(ctx, mx - 4, my - 8, mx + 1, my, '#3e4e50', 0.9);
  line(ctx, mx + 1, my, mx - 2, my + 4, '#3e4e50', 0.9);
  line(ctx, mx - 2, my + 4, mx + 4, my + 6, '#3e4e50', 0.9);
  line(ctx, mx + 4, my + 6, mx + 8, my + 12, '#3e4e50', 0.9);
  // stalls
  rect(ctx, 330, 76, 130, 184, '#405655');
  for (const dx of [336, 396]) {
    rect(ctx, dx, 84, 48, 154, '#6f8885');
    rect(ctx, dx + 2, 86, 44, 8, '#7d9692');
    rect(ctx, dx + 2, 94, 44, 140, '#647d7b');
    rect(ctx, dx + 40, 120, 3, 8, '#3c4b4a');
    rect(ctx, dx + 2, 156, 44, 2, '#4e6462');
    rect(ctx, dx, 84, 48, 2, '#a6bcb8');
  }
  rect(ctx, 322, 76, 8, 184, '#4e6462');
  rect(ctx, 322, 76, 8, 2, '#a6bcb8');
  // wet floor sign
  ctx.save();
  ctx.translate(270, 172);
  ctx.fillStyle = '#d7b845';
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(10, 0);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.fill();
  rect(ctx, -8, -3, 16, 3, '#b5942c');
  text(ctx, '!', 0, -6, { size: 7, color: '#2d2a1c', align: 'center', weight: 600 });
  ctx.restore();
  // towel dispenser, bin
  rect(ctx, 50, 90, 14, 20, '#c4d1cf');
  rect(ctx, 52, 92, 10, 36, '#e2ecea');
  rect(ctx, 56, 128, 16, 20, '#53605f');
  rect(ctx, 55, 127, 18, 2, '#83908f');
  // door bottom-left (behind player spawn)
  rect(ctx, 48, 238, 52, 32, '#3a4a49');
  rect(ctx, 52, 242, 44, 28, '#637976');
  rect(ctx, 52, 242, 44, 2, '#a4b9b6');
  rect(ctx, 94, 256, 2, 3, '#c9b578');
  text(ctx, 'OUT', 74, 232, { size: 4.4, color: '#b9cfcc', align: 'center', tracking: 1.4 });
  // ambient cold light
  glow(ctx, 240, 20, 200, 'rgba(190,235,255,.07)', 'rgba(180,230,255,0)', 0.8);
}

function buildHome(ctx, map, t) {
  // walls
  rect(ctx, 0, 0, 480, 270, '#5a3f44');
  rect(ctx, 0, 0, 480, 56, '#6b4b50');
  // wallpaper pattern
  for (let y = 8; y < 56; y += 10) {
    for (let x = 8; x < 480; x += 18) {
      rect(ctx, x, y, 1.4, 1.4, 'rgba(230,200,190,.08)');
      rect(ctx, x + 8, y + 5, 1, 1, 'rgba(230,200,190,.05)');
    }
  }
  // chair rail / wainscot
  rect(ctx, 0, 54, 480, 4, '#3f2b32');
  rect(ctx, 0, 56, 480, 6, '#4e353d');
  for (let x = 0; x < 480; x += 24) {
    rect(ctx, x, 62, 1, 130, 'rgba(30,18,24,.25)');
  }
  // floor
  rect(ctx, 0, 192, 480, 78, '#4a3335');
  for (let y = 192; y < 270; y += 12) {
    rect(ctx, 0, y, 480, 11, y % 24 < 12 ? '#563d3e' : '#503739');
    rect(ctx, 0, y + 10, 480, 1.4, '#372628');
  }
  for (let x = 0; x < 480; x += 64) {
    rect(ctx, x, 192, 1, 78, 'rgba(30,20,22,.18)');
  }
  // rug
  ctx.save();
  ellipse(ctx, 250, 214, 92, 28, '#6a3942');
  ellipse(ctx, 250, 214, 82, 23, '#7c4650');
  ellipse(ctx, 250, 214, 72, 18, '#5e333b');
  for (let i = 0; i < 10; i++) {
    rect(ctx, 180 + i * 14, 208, 6, 1, '#b98b63');
  }
  ctx.restore();
  // window with snow (right back)
  rect(ctx, 320, 10, 74, 62, '#2b323f');
  rect(ctx, 324, 14, 66, 54, '#4b6688');
  rect(ctx, 324, 44, 66, 24, '#6b87a8');
  ctx.save();
  ctx.globalAlpha = 0.55;
  ellipse(ctx, 357, 66, 30, 7, '#d4e3f5');
  ctx.restore();
  rect(ctx, 356, 14, 2, 54, '#3a3d47');
  rect(ctx, 324, 40, 66, 2, '#3a3d47');
  rect(ctx, 316, 8, 82, 4, '#8f7a6a');
  rect(ctx, 316, 8, 82, 1.4, '#e8f0ff');
  // curtains
  ctx.fillStyle = '#7d4c54';
  ctx.beginPath();
  ctx.moveTo(310, 8);
  ctx.lineTo(338, 8);
  ctx.lineTo(334, 70);
  ctx.lineTo(310, 78);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(398, 8);
  ctx.lineTo(426, 8);
  ctx.lineTo(426, 78);
  ctx.lineTo(402, 70);
  ctx.closePath();
  ctx.fill();
  // radiator
  rect(ctx, 328, 78, 60, 14, '#8d7b6a');
  for (let x = 330; x < 386; x += 5) rect(ctx, x, 78, 2, 14, '#a89481');
  // TV on stand
  rect(ctx, 160, 74, 80, 38, '#2b2a33');
  rect(ctx, 166, 78, 68, 28, '#11161f');
  rect(ctx, 168, 80, 64, 24, '#2e3c4a');
  rect(ctx, 180, 86, 40, 12, '#536c7d');
  rect(ctx, 172, 82, 4, 20, 'rgba(255,255,255,.05)');
  rect(ctx, 196, 92, 10, 3, '#8a93a0');
  rect(ctx, 154, 112, 92, 6, '#4a3638');
  rect(ctx, 158, 118, 4, 14, '#3a2a2c');
  rect(ctx, 238, 118, 4, 14, '#3a2a2c');
  rect(ctx, 160, 118, 80, 8, '#3f2d2f');
  // couch
  rect(ctx, 196, 164, 96, 56, '#3f4f63');
  rect(ctx, 200, 156, 88, 18, '#4b5c72');
  rect(ctx, 200, 156, 88, 4, '#65788f');
  rect(ctx, 204, 172, 38, 40, '#475a70');
  rect(ctx, 246, 172, 38, 40, '#475a70');
  rect(ctx, 240, 168, 8, 48, '#354456');
  rect(ctx, 190, 198, 108, 26, '#38485b');
  rect(ctx, 192, 196, 12, 28, '#2f3d4e');
  rect(ctx, 284, 196, 12, 28, '#2f3d4e');
  rect(ctx, 198, 158, 20, 3, '#d7e0ec');
  // pillow
  rect(ctx, 206, 164, 24, 13, '#b98d6a');
  rect(ctx, 208, 166, 20, 9, '#c9a07a');
  // coffee table
  rect(ctx, 306, 130, 58, 8, '#7a5545');
  rect(ctx, 306, 130, 58, 2, '#9b7258');
  rect(ctx, 310, 138, 4, 30, '#5c3f35');
  rect(ctx, 356, 138, 4, 30, '#5c3f35');
  rect(ctx, 322, 122, 9, 8, '#e8dfd0');
  rect(ctx, 324, 120, 5, 2, '#f3ede2');
  rect(ctx, 342, 126, 12, 4, '#b65a63');
  // family photos on wall
  for (let i = 0; i < 3; i++) {
    const px = 92 + i * 22;
    rect(ctx, px, 68, 18, 22, '#3a2a2c');
    rect(ctx, px + 2, 70, 14, 18, '#8d7b6a');
    rect(ctx, px + 3, 71, 12, 16, '#b9c8d8');
    rect(ctx, px + 6, 74, 6, 6, '#8f7a6a');
    rect(ctx, px + 5, 82, 8, 4, '#6b7d93');
  }
  // mirror left wall
  rect(ctx, 38, 92, 38, 82, '#3c2b2c');
  rect(ctx, 42, 96, 30, 74, '#6d7b88');
  rect(ctx, 44, 98, 26, 70, '#53636f');
  rect(ctx, 46, 100, 8, 66, 'rgba(255,255,255,.08)');
  rect(ctx, 36, 88, 42, 4, '#8f7a6a');
  rect(ctx, 36, 174, 42, 4, '#8f7a6a');
  // mirror crack
  line(ctx, 58, 110, 55, 128, '#2e3942', 0.8);
  line(ctx, 55, 128, 62, 140, '#2e3942', 0.8);
  // kitchen doorway right
  rect(ctx, 384, 56, 78, 110, '#2b2026');
  rect(ctx, 388, 60, 70, 106, '#6b4b40');
  rect(ctx, 388, 60, 70, 4, '#8d6a55');
  // fridge
  rect(ctx, 414, 74, 38, 78, '#b6b9b2');
  rect(ctx, 416, 76, 34, 34, '#c8cbc4');
  rect(ctx, 416, 112, 34, 38, '#c8cbc4');
  rect(ctx, 434, 92, 2.4, 8, '#7d817c');
  rect(ctx, 434, 116, 2.4, 8, '#7d817c');
  rect(ctx, 420, 82, 20, 16, '#e8e3d2');
  rect(ctx, 420, 84, 20, 1, '#b9a88f');
  // note on fridge
  rect(ctx, 424, 104, 12, 10, '#f2e8c8');
  rect(ctx, 425, 106, 10, 1, '#8a7a5a');
  rect(ctx, 425, 108, 8, 1, '#8a7a5a');
  rect(ctx, 425, 110, 9, 1, '#8a7a5a');
  // stairs
  rect(ctx, 300, 56, 62, 34, '#3a2a2c');
  for (let i = 0; i < 4; i++) {
    rect(ctx, 302 + i * 14, 60 + i * 6, 58 - i * 14, 5, '#5c4240');
    rect(ctx, 302 + i * 14, 60 + i * 6, 58 - i * 14, 1, '#7d5c55');
  }
  rect(ctx, 298, 86, 64, 4, '#2b1e21');
  // standing lamp
  rect(ctx, 298, 108, 3, 46, '#4a3a34');
  ctx.fillStyle = '#d9b878';
  ctx.beginPath();
  ctx.moveTo(290, 120);
  ctx.lineTo(310, 120);
  ctx.lineTo(305, 108);
  ctx.lineTo(295, 108);
  ctx.closePath();
  ctx.fill();
  rect(ctx, 292, 118, 16, 2, '#f2d79b');
  glow(ctx, 300, 122, 54, 'rgba(255,200,110,.22)', 'rgba(255,190,100,0)', 0.9);
  // front door bottom
  rect(ctx, 218, 240, 44, 30, '#332426');
  rect(ctx, 222, 244, 36, 26, '#6b4b48');
  rect(ctx, 240, 244, 1.4, 26, '#4b3233');
  rect(ctx, 208, 250, 64, 8, '#4a2b2e');
  text(ctx, 'HOME', 240, 258, { size: 3.8, color: '#b78888', align: 'center', tracking: 1.4 });
  // coat hook
  rect(ctx, 350, 96, 3, 20, '#4a3a34');
  rect(ctx, 346, 96, 12, 3, '#6b5548');
  // dust / warm ambient
  glow(ctx, 250, 120, 210, 'rgba(255,190,110,.1)', 'rgba(255,180,90,0)', 0.8);
  speckles(ctx, 0, 0, 480, 270, 90, 'rgba(255,240,210,.12)', 'rgba(40,25,30,.1)', 19);
}

const BUILDERS = {
  town: buildTown,
  diner: buildDiner,
  bathroom: buildBathroom,
  home: buildHome,
};

export function buildMap(id, t = 0) {
  const map = MAPS[id];
  const canvas = document.createElement('canvas');
  canvas.width = map.w;
  canvas.height = map.h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  BUILDERS[id](ctx, map, t);
  return canvas;
}

export { tree, lampPost, bench, snowmanProp };
