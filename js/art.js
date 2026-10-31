// Flat-shaded character and scenery art, drawn entirely with canvas primitives.
import { hash2, clamp } from './engine.js';

export const INK = '#171420';

export function rect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

export function circle(ctx, x, y, r, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function ellipse(ctx, x, y, rx, ry, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function line(ctx, x1, y1, x2, y2, c, w = 1) {
  ctx.strokeStyle = c;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function poly(ctx, pts, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

export function shadow(ctx, x, y, rx = 12) {
  ellipse(ctx, x, y + 1, rx, rx * 0.32, 'rgba(24, 28, 44, 0.25)');
}

// ---------------------------------------------------------------- characters

const SKIN = {
  srif: '#f2ead9',
  srifShade: '#ded2bd',
  chris: '#b9805a',
  chrisShade: '#96603f',
  mich: '#dd9147',
  michShade: '#b96f2f',
  asgore: '#f0e6d2',
  asgoreShade: '#d8c9ae',
  toriel: '#f6efe4',
  torielShade: '#ded2c2',
};

function eyes(ctx, dir, x1, x2, y, color = '#211a2c', r = 1.35) {
  if (dir === 3) return;
  if (dir === 1) {
    circle(ctx, x1 - 1.5, y, r, color);
    return;
  }
  if (dir === 2) {
    circle(ctx, x2 + 1.5, y, r, color);
    return;
  }
  circle(ctx, x1, y, r, color);
  circle(ctx, x2, y, r, color);
}

function legs(ctx, swing, color, boot) {
  rect(ctx, -7, -13 + swing * 0.4, 5, 13 - swing * 0.4, color);
  rect(ctx, 2, -13 - swing * 0.4, 5, 13 + swing * 0.4, color);
  rect(ctx, -8, -2 + swing * 0.4, 7, 3, boot);
  rect(ctx, 1, -2 - swing * 0.4, 7, 3, boot);
}

function arm(ctx, x, y, len, color, hand) {
  rect(ctx, x, y, 4, len, color);
  circle(ctx, x + 2, y + len, 2.1, hand);
}

function demonFace(ctx, x, y, s = 1) {
  // black sockets, red pinpricks, a grin that is too wide
  ellipse(ctx, x - 3.4 * s, y, 2.6 * s, 3.1 * s, '#0b0a12');
  ellipse(ctx, x + 3.4 * s, y, 2.6 * s, 3.1 * s, '#0b0a12');
  circle(ctx, x - 3.4 * s, y + 0.3, 0.8 * s, '#ff4d4d');
  circle(ctx, x + 3.4 * s, y + 0.3, 0.8 * s, '#ff4d4d');
  ctx.strokeStyle = '#2a1020';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y + 4 * s, 6 * s, 0.12 * Math.PI, 0.88 * Math.PI);
  ctx.stroke();
}

function drawSrif(ctx, dir, t, moving, mood) {
  const sw = moving ? Math.sin(t * 11) * 3 : 0;
  const coat = '#2f3b58';
  const coatLight = '#3b4a6d';
  const scarf = '#bf4a44';
  const hair = '#3b2f3f';

  shadow(ctx, 0, 0, 12);
  legs(ctx, sw, '#232a3d', '#171a26');

  // coat
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.moveTo(-10, -31);
  ctx.lineTo(10, -31);
  ctx.lineTo(12, -13);
  ctx.lineTo(-12, -13);
  ctx.closePath();
  ctx.fill();
  rect(ctx, -1, -31, 2, 18, coatLight);
  rect(ctx, -12, -18, 24, 3, '#222a3e');

  arm(ctx, -14, -29, 12, coat, SKIN.srif);
  arm(ctx, 10, -29, 12, coat, SKIN.srif);

  // scarf
  rect(ctx, -11, -35, 22, 5, scarf);
  rect(ctx, 7, -33, 4, 12, scarf);
  rect(ctx, 7, -23, 4, 3, '#8f342f');

  // head
  ellipse(ctx, 0, -38, 9.5, 9, SKIN.srif);
  ellipse(ctx, 0, -35, 8, 5.5, SKIN.srifShade);
  // ears
  ellipse(ctx, -10.5, -37, 3.4, 5, SKIN.srif);
  ellipse(ctx, 10.5, -37, 3.4, 5, SKIN.srif);
  ellipse(ctx, -10.5, -37, 1.6, 2.6, '#d8a9a0');
  ellipse(ctx, 10.5, -37, 1.6, 2.6, '#d8a9a0');
  // horns
  rect(ctx, -7.5, -50, 3, 6, '#cdb894');
  rect(ctx, 4.5, -50, 3, 6, '#cdb894');
  // hair
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(0, -41, 9.4, Math.PI * 1.02, Math.PI * 1.98);
  ctx.fill();
  rect(ctx, -9, -44, 4, 5, hair);
  rect(ctx, 6, -45, 3.4, 6, hair);
  // muzzle
  ellipse(ctx, 0, -33.5, 5, 3.2, '#f8f2e6');
  circle(ctx, 0, -34.6, 1.1, '#5c4a52');

  if (mood === 'demon') {
    demonFace(ctx, 0, -38, 1);
  } else {
    eyes(ctx, dir, -3.6, 3.6, -39, '#241c2e', 1.5);
    ctx.strokeStyle = '#7a6a72';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    if (mood === 'sad') ctx.arc(0, -31.4, 2.4, Math.PI * 1.15, Math.PI * 1.85);
    else if (mood === 'happy') ctx.arc(0, -32.6, 2.6, 0.15 * Math.PI, 0.85 * Math.PI);
    else {
      ctx.moveTo(-1.8, -32);
      ctx.lineTo(1.8, -32);
    }
    ctx.stroke();
  }
}

function drawChris(ctx, dir, t, moving, mood) {
  const sw = moving ? Math.sin(t * 10.5) * 3 : 0;
  const fur = SKIN.chris;
  const shade = SKIN.chrisShade;

  shadow(ctx, 0, 0, 12);
  legs(ctx, sw, '#4a3b33', '#2c241f');

  // sweater
  ctx.fillStyle = '#3d7a52';
  ctx.beginPath();
  ctx.moveTo(-11, -32);
  ctx.lineTo(11, -32);
  ctx.lineTo(12, -12);
  ctx.lineTo(-12, -12);
  ctx.closePath();
  ctx.fill();
  rect(ctx, -11, -25, 22, 3, '#c94f4f');
  rect(ctx, -11, -16, 22, 2.5, '#2f5f40');
  // snowflake-ish pattern
  rect(ctx, -2, -22, 4, 4, '#e9f2e6');
  rect(ctx, 4, -19, 2, 2, '#e9f2e6');
  rect(ctx, -7, -19, 2, 2, '#e9f2e6');

  arm(ctx, -15, -30, 12, '#3d7a52', fur);
  arm(ctx, 11, -30, 12, '#3d7a52', fur);

  // head
  ellipse(ctx, 0, -39, 9.5, 9, fur);
  ellipse(ctx, 0, -35.5, 6, 4, '#e7c9a8');
  // ears
  ellipse(ctx, -10, -40, 3, 4.4, fur);
  ellipse(ctx, 10, -40, 3, 4.4, fur);
  // antlers
  ctx.strokeStyle = '#7c5c3f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, -46); ctx.lineTo(-9, -52); ctx.lineTo(-12, -53);
  ctx.moveTo(-8, -49); ctx.lineTo(-5, -54);
  ctx.moveTo(6, -46); ctx.lineTo(9, -52); ctx.lineTo(12, -53);
  ctx.moveTo(8, -49); ctx.lineTo(5, -54);
  ctx.stroke();
  // tuft
  ctx.fillStyle = '#9a6646';
  ctx.beginPath();
  ctx.arc(0, -43, 8.6, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
  // nose
  circle(ctx, 0, -35, 2, '#c94f4f');
  if (mood === 'demon') demonFace(ctx, 0, -39, 0.9);
  else {
    eyes(ctx, dir, -3.7, 3.7, -40, '#2a1f19', 1.45);
    ctx.strokeStyle = '#7a5540';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    if (mood === 'happy') ctx.arc(0, -31.8, 2.4, 0.15 * Math.PI, 0.85 * Math.PI);
    else { ctx.moveTo(-1.8, -31); ctx.lineTo(1.8, -31); }
    ctx.stroke();
  }
}

function drawMich(ctx, dir, t, moving, mood) {
  const sw = moving ? Math.sin(t * 10) * 2.6 : 0;
  const fur = SKIN.mich;
  const shade = SKIN.michShade;

  shadow(ctx, 0, 0, 14);
  legs(ctx, sw, '#2b2c36', '#191a22');

  // black jacket
  ctx.fillStyle = '#23252f';
  ctx.beginPath();
  ctx.moveTo(-13, -33);
  ctx.lineTo(13, -33);
  ctx.lineTo(14, -11);
  ctx.lineTo(-14, -11);
  ctx.closePath();
  ctx.fill();
  rect(ctx, -1, -33, 2, 22, '#343744');
  rect(ctx, -13, -22, 26, 2, '#3a3d4c');
  // white chest tuft
  ellipse(ctx, 0, -30, 4, 3, '#f3e9d8');

  arm(ctx, -17, -31, 13, '#23252f', fur);
  arm(ctx, 13, -31, 13, '#23252f', fur);

  // head
  ellipse(ctx, 0, -41, 11, 10, fur);
  ellipse(ctx, 0, -37, 7, 4.5, '#f6ecdc');
  // ears
  circle(ctx, -10, -46, 3.4, fur);
  circle(ctx, 10, -46, 3.4, fur);
  circle(ctx, -10, -46, 1.6, '#e3b07a');
  circle(ctx, 10, -46, 1.6, '#e3b07a');
  // stripes
  ctx.strokeStyle = '#3a2a20';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-11, -43); ctx.lineTo(-7, -42);
  ctx.moveTo(-11, -38); ctx.lineTo(-8, -38);
  ctx.moveTo(11, -43); ctx.lineTo(7, -42);
  ctx.moveTo(11, -38); ctx.lineTo(8, -38);
  ctx.stroke();
  // ushanka
  ctx.fillStyle = '#1a1c24';
  ctx.beginPath();
  ctx.ellipse(0, -49, 10, 6.4, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  rect(ctx, -10, -49, 20, 3.4, '#1a1c24');
  rect(ctx, -13, -49, 4, 10, '#1a1c24');
  rect(ctx, 9, -49, 4, 10, '#1a1c24');
  rect(ctx, -12, -40, 3, 2, '#2c2f3a');
  rect(ctx, 9, -40, 3, 2, '#2c2f3a');
  // muzzle details
  circle(ctx, 0, -35.5, 1.6, '#5a3a2c');
  ctx.strokeStyle = '#b9a58e';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-2.5, -34.5); ctx.lineTo(-8, -35.5);
  ctx.moveTo(2.5, -34.5); ctx.lineTo(8, -35.5);
  ctx.stroke();

  if (mood === 'demon') demonFace(ctx, 0, -41, 1.05);
  else {
    eyes(ctx, dir, -4.2, 4.2, -42, '#241a14', 1.5);
    ctx.strokeStyle = '#6b4b36';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    if (mood === 'angry') {
      ctx.moveTo(-2.5, -32.4); ctx.lineTo(2.5, -32.4);
      line(ctx, -7, -46, -2, -44.4, '#3a2a20', 1.1);
      line(ctx, 7, -46, 2, -44.4, '#3a2a20', 1.1);
    } else if (mood === 'happy') ctx.arc(0, -32.2, 2.3, 0.15 * Math.PI, 0.85 * Math.PI);
    else { ctx.moveTo(-2, -32); ctx.lineTo(2, -32); }
    ctx.stroke();
  }
}

function drawAsgore(ctx, dir, t, moving, mood) {
  const sw = moving ? Math.sin(t * 9) * 2.4 : 0;
  shadow(ctx, 0, 0, 16);
  legs(ctx, sw, '#2b3550', '#1b2133');
  // uniform
  ctx.fillStyle = '#2d3d5e';
  ctx.beginPath();
  ctx.moveTo(-15, -38);
  ctx.lineTo(15, -38);
  ctx.lineTo(16, -13);
  ctx.lineTo(-16, -13);
  ctx.closePath();
  ctx.fill();
  rect(ctx, -1, -38, 2, 25, '#24314d');
  circle(ctx, 7, -32, 2.6, '#e8c56a');
  rect(ctx, -16, -24, 32, 3, '#1f2a42');
  arm(ctx, -20, -36, 14, '#2d3d5e', SKIN.asgore);
  arm(ctx, 16, -36, 14, '#2d3d5e', SKIN.asgore);
  // head
  ellipse(ctx, 0, -46, 12, 11, SKIN.asgore);
  ellipse(ctx, 0, -41, 8, 5, SKIN.asgoreShade);
  ellipse(ctx, -13, -45, 3.6, 5.4, SKIN.asgore);
  ellipse(ctx, 13, -45, 3.6, 5.4, SKIN.asgore);
  rect(ctx, -9, -59, 4, 7, '#cdb894');
  rect(ctx, 5, -59, 4, 7, '#cdb894');
  // beard
  ctx.fillStyle = '#e3c274';
  ctx.beginPath();
  ctx.moveTo(-9, -41);
  ctx.quadraticCurveTo(0, -26, 9, -41);
  ctx.quadraticCurveTo(0, -34, -9, -41);
  ctx.fill();
  // police cap
  ctx.fillStyle = '#1c2740';
  ctx.beginPath();
  ctx.ellipse(0, -55, 11, 6.5, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  rect(ctx, -12, -56, 24, 4, '#16203a');
  rect(ctx, -13, -53, 26, 2.5, '#0f172b');
  circle(ctx, 0, -57, 1.8, '#e8c56a');
  eyes(ctx, dir, -4.4, 4.4, -47, '#241c2e', 1.6);
  ctx.strokeStyle = '#8d7148';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, -38, 2.6, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

function drawToriel(ctx, dir, t, moving, mood) {
  const sw = moving ? Math.sin(t * 9.5) * 2.2 : 0;
  shadow(ctx, 0, 0, 15);
  // robe
  ctx.fillStyle = '#6a4a7c';
  ctx.beginPath();
  ctx.moveTo(-12, -40);
  ctx.lineTo(12, -40);
  ctx.lineTo(18, -3);
  ctx.quadraticCurveTo(0, 1, -18, -3);
  ctx.closePath();
  ctx.fill();
  // robe folds + hem
  rect(ctx, -1, -38, 2, 32, '#5b3d6c');
  rect(ctx, -17, -8, 34, 4, '#8b6b9c');
  rect(ctx, -13, -6, 26, 2, '#b394c0');
  rect(ctx, -16, -20, 4, 12, 'rgba(30, 18, 40, 0.18)');
  rect(ctx, 12, -20, 4, 12, 'rgba(30, 18, 40, 0.18)');
  // shawl
  ctx.fillStyle = '#8b6b9c';
  ctx.beginPath();
  ctx.moveTo(-13, -39);
  ctx.quadraticCurveTo(0, -30, 13, -39);
  ctx.lineTo(13, -34);
  ctx.quadraticCurveTo(0, -25, -13, -34);
  ctx.closePath();
  ctx.fill();
  // sleeves
  rect(ctx, -19, -36, 6, 15, '#5f4270');
  rect(ctx, 13, -36, 6, 15, '#5f4270');
  circle(ctx, -16, -20, 2.6, SKIN.toriel);
  circle(ctx, 16, -20, 2.6, SKIN.toriel);
  // little book
  rect(ctx, 11, -19, 9, 7, '#c9b58f');
  rect(ctx, 15, -19, 1, 7, '#8a6a44');
  // head
  ellipse(ctx, 0, -47, 11, 10.5, SKIN.toriel);
  ellipse(ctx, 0, -42, 8, 5, SKIN.torielShade);
  ellipse(ctx, -12, -46, 3.4, 5, SKIN.toriel);
  ellipse(ctx, 12, -46, 3.4, 5, SKIN.toriel);
  rect(ctx, -8, -60, 4, 7, '#cdb894');
  rect(ctx, 4, -60, 4, 7, '#cdb894');
  // hair-ish fur
  ctx.fillStyle = '#efe6d6';
  ctx.beginPath();
  ctx.arc(0, -50, 10.4, Math.PI * 1.03, Math.PI * 1.97);
  ctx.fill();
  eyes(ctx, dir, -4.2, 4.2, -48, '#3a2a3e', 1.5);
  circle(ctx, 0, -43, 1.2, '#8c6a72');
  ctx.strokeStyle = '#a08088';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (mood === 'happy') ctx.arc(0, -40, 2.6, 0.12 * Math.PI, 0.88 * Math.PI);
  else { ctx.moveTo(-2, -40.5); ctx.lineTo(2, -40.5); }
  ctx.stroke();
}

const DRAW = { srif: drawSrif, chris: drawChris, mich: drawMich, asgore: drawAsgore, toriel: drawToriel };

export function drawChar(ctx, id, x, y, dir = 0, t = 0, moving = false, mood = 'normal') {
  const fn = DRAW[id];
  if (!fn) return;
  const bob = moving ? Math.abs(Math.sin(t * 11)) * 1.2 : Math.sin(t * 2) * 0.5;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - bob));
  if (dir === 1) ctx.scale(-1, 1);
  fn(ctx, dir, t, moving, mood);
  ctx.restore();
}

// ------------------------------------------------------------------ portraits

function bustBase(ctx, s, fur, shade) {
  ellipse(ctx, s * 0.5, s * 0.62, s * 0.36, s * 0.34, fur);
  ellipse(ctx, s * 0.5, s * 0.73, s * 0.24, s * 0.16, shade);
}

function bustEyes(ctx, s, y, gap, color, r, mood) {
  const cx = s * 0.5;
  if (mood === 'demon') {
    ellipse(ctx, cx - gap, y, r * 1.7, r * 2.1, '#0b0a12');
    ellipse(ctx, cx + gap, y, r * 1.7, r * 2.1, '#0b0a12');
    circle(ctx, cx - gap, y + r * 0.2, r * 0.6, '#ff4d4d');
    circle(ctx, cx + gap, y + r * 0.2, r * 0.6, '#ff4d4d');
    ctx.strokeStyle = '#3a0f1c';
    ctx.lineWidth = Math.max(1, s * 0.02);
    ctx.beginPath();
    ctx.arc(cx, y + s * 0.16, s * 0.13, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    return;
  }
  const eyeY = mood === 'sad' ? y + r * 0.3 : y;
  circle(ctx, cx - gap, eyeY, r, color);
  circle(ctx, cx + gap, eyeY, r, color);
  circle(ctx, cx - gap + r * 0.35, eyeY - r * 0.4, r * 0.32, 'rgba(255,255,255,0.8)');
  circle(ctx, cx + gap + r * 0.35, eyeY - r * 0.4, r * 0.32, 'rgba(255,255,255,0.8)');
  if (mood === 'angry') {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, s * 0.018);
    ctx.beginPath();
    ctx.moveTo(cx - gap - r * 1.3, y - r * 1.8);
    ctx.lineTo(cx - gap + r * 1.1, y - r * 0.7);
    ctx.moveTo(cx + gap + r * 1.3, y - r * 1.8);
    ctx.lineTo(cx + gap - r * 1.1, y - r * 0.7);
    ctx.stroke();
  }
}

export function drawPortrait(ctx, id, x, y, size, mood = 'normal') {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  // backdrop
  ctx.fillStyle = 'rgba(18, 22, 38, 0.9)';
  ctx.fillRect(0, 0, s, s);
  const tint = {
    srif: '#2a3350', chris: '#2f4a3a', mich: '#3a2f26',
    asgore: '#26314d', toriel: '#3d2c47', sans: '#22293d', reflection: '#1b1626',
  }[id] || '#252a3c';
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let i = 0; i < 6; i++) ctx.fillRect(0, i * s / 6, s, 1);

  const cx = s * 0.5;
  if (id === 'srif') {
    // shoulders
    ctx.fillStyle = '#2f3b58';
    ctx.beginPath();
    ctx.moveTo(s * 0.16, s);
    ctx.quadraticCurveTo(s * 0.2, s * 0.74, cx, s * 0.74);
    ctx.quadraticCurveTo(s * 0.8, s * 0.74, s * 0.84, s);
    ctx.fill();
    ctx.fillStyle = '#bf4a44';
    ctx.fillRect(s * 0.24, s * 0.78, s * 0.52, s * 0.09);
    bustBase(ctx, s, SKIN.srif, SKIN.srifShade);
    ellipse(ctx, s * 0.18, s * 0.6, s * 0.1, s * 0.15, SKIN.srif);
    ellipse(ctx, s * 0.82, s * 0.6, s * 0.1, s * 0.15, SKIN.srif);
    ctx.fillStyle = '#3b2f3f';
    ctx.beginPath();
    ctx.arc(cx, s * 0.34, s * 0.35, Math.PI * 1.02, Math.PI * 1.98);
    ctx.fill();
    rect(ctx, s * 0.16, s * 0.32, s * 0.12, s * 0.14, '#3b2f3f');
    rect(ctx, s * 0.72, s * 0.31, s * 0.12, s * 0.16, '#3b2f3f');
    // horns poke through the hair
    rect(ctx, s * 0.29, s * 0.08, s * 0.09, s * 0.17, '#cdb894');
    rect(ctx, s * 0.62, s * 0.08, s * 0.09, s * 0.17, '#cdb894');
    rect(ctx, s * 0.28, s * 0.08, s * 0.11, s * 0.05, '#e2d0ad');
    rect(ctx, s * 0.61, s * 0.08, s * 0.11, s * 0.05, '#e2d0ad');
    bustEyes(ctx, s, s * 0.52, s * 0.13, '#241c2e', s * 0.045, mood);
    ellipse(ctx, cx, s * 0.68, s * 0.16, s * 0.1, '#f8f2e6');
    circle(ctx, cx, s * 0.65, s * 0.035, '#5c4a52');
    ctx.strokeStyle = '#7a6a72';
    ctx.lineWidth = Math.max(1, s * 0.015);
    ctx.beginPath();
    if (mood === 'happy') ctx.arc(cx, s * 0.7, s * 0.08, 0.15 * Math.PI, 0.85 * Math.PI);
    else if (mood === 'sad') ctx.arc(cx, s * 0.74, s * 0.07, 1.15 * Math.PI, 1.85 * Math.PI);
    else { ctx.moveTo(cx - s * 0.06, s * 0.72); ctx.lineTo(cx + s * 0.06, s * 0.72); }
    ctx.stroke();
  } else if (id === 'chris') {
    ctx.fillStyle = '#3d7a52';
    ctx.beginPath();
    ctx.moveTo(s * 0.16, s);
    ctx.quadraticCurveTo(s * 0.2, s * 0.76, cx, s * 0.76);
    ctx.quadraticCurveTo(s * 0.8, s * 0.76, s * 0.84, s);
    ctx.fill();
    ctx.fillStyle = '#c94f4f';
    ctx.fillRect(s * 0.24, s * 0.8, s * 0.52, s * 0.08);
    bustBase(ctx, s, SKIN.chris, SKIN.chrisShade);
    ellipse(ctx, s * 0.18, s * 0.58, s * 0.09, s * 0.13, SKIN.chris);
    ellipse(ctx, s * 0.82, s * 0.58, s * 0.09, s * 0.13, SKIN.chris);
    ctx.fillStyle = '#9a6646';
    ctx.beginPath();
    ctx.arc(cx, s * 0.34, s * 0.34, Math.PI * 1.03, Math.PI * 1.97);
    ctx.fill();
    ctx.strokeStyle = '#7c5c3f';
    ctx.lineWidth = Math.max(2, s * 0.04);
    ctx.beginPath();
    ctx.moveTo(s * 0.32, s * 0.28); ctx.lineTo(s * 0.22, s * 0.1); ctx.lineTo(s * 0.13, s * 0.07);
    ctx.moveTo(s * 0.27, s * 0.18); ctx.lineTo(s * 0.33, s * 0.04);
    ctx.moveTo(s * 0.68, s * 0.28); ctx.lineTo(s * 0.78, s * 0.1); ctx.lineTo(s * 0.87, s * 0.07);
    ctx.moveTo(s * 0.73, s * 0.18); ctx.lineTo(s * 0.67, s * 0.04);
    ctx.stroke();
    bustEyes(ctx, s, s * 0.52, s * 0.13, '#2a1f19', s * 0.042, mood);
    ellipse(ctx, cx, s * 0.68, s * 0.17, s * 0.11, '#e7c9a8');
    circle(ctx, cx, s * 0.64, s * 0.05, '#c94f4f');
    ctx.strokeStyle = '#7a5540';
    ctx.lineWidth = Math.max(1, s * 0.015);
    ctx.beginPath();
    if (mood === 'happy') ctx.arc(cx, s * 0.72, s * 0.07, 0.15 * Math.PI, 0.85 * Math.PI);
    else { ctx.moveTo(cx - s * 0.05, s * 0.73); ctx.lineTo(cx + s * 0.05, s * 0.73); }
    ctx.stroke();
  } else if (id === 'mich') {
    ctx.fillStyle = '#23252f';
    ctx.beginPath();
    ctx.moveTo(s * 0.12, s);
    ctx.quadraticCurveTo(s * 0.16, s * 0.74, cx, s * 0.74);
    ctx.quadraticCurveTo(s * 0.84, s * 0.74, s * 0.88, s);
    ctx.fill();
    ctx.fillStyle = '#f3e9d8';
    ctx.beginPath();
    ctx.moveTo(s * 0.38, s * 0.76);
    ctx.lineTo(s * 0.5, s * 0.92);
    ctx.lineTo(s * 0.62, s * 0.76);
    ctx.fill();
    bustBase(ctx, s, SKIN.mich, SKIN.michShade);
    circle(ctx, s * 0.2, s * 0.44, s * 0.09, SKIN.mich);
    circle(ctx, s * 0.8, s * 0.44, s * 0.09, SKIN.mich);
    // ushanka
    ctx.fillStyle = '#1a1c24';
    ctx.beginPath();
    ctx.ellipse(cx, s * 0.3, s * 0.34, s * 0.22, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(s * 0.16, s * 0.29, s * 0.68, s * 0.11);
    ctx.fillRect(s * 0.1, s * 0.3, s * 0.12, s * 0.32);
    ctx.fillRect(s * 0.78, s * 0.3, s * 0.12, s * 0.32);
    // stripes
    ctx.strokeStyle = '#3a2a20';
    ctx.lineWidth = Math.max(1.4, s * 0.025);
    ctx.beginPath();
    ctx.moveTo(s * 0.14, s * 0.48); ctx.lineTo(s * 0.24, s * 0.5);
    ctx.moveTo(s * 0.14, s * 0.58); ctx.lineTo(s * 0.23, s * 0.59);
    ctx.moveTo(s * 0.86, s * 0.48); ctx.lineTo(s * 0.76, s * 0.5);
    ctx.moveTo(s * 0.86, s * 0.58); ctx.lineTo(s * 0.77, s * 0.59);
    ctx.stroke();
    bustEyes(ctx, s, s * 0.52, s * 0.14, '#241a14', s * 0.048, mood);
    ellipse(ctx, cx, s * 0.69, s * 0.2, s * 0.12, '#f6ecdc');
    circle(ctx, cx, s * 0.64, s * 0.045, '#5a3a2c');
    ctx.strokeStyle = '#b9a58e';
    ctx.lineWidth = Math.max(1, s * 0.014);
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.06, s * 0.67); ctx.lineTo(cx - s * 0.24, s * 0.66);
    ctx.moveTo(cx + s * 0.06, s * 0.67); ctx.lineTo(cx + s * 0.24, s * 0.66);
    ctx.stroke();
    ctx.strokeStyle = '#6b4b36';
    ctx.lineWidth = Math.max(1, s * 0.015);
    ctx.beginPath();
    if (mood === 'angry') { ctx.moveTo(cx - s * 0.06, s * 0.73); ctx.lineTo(cx + s * 0.06, s * 0.73); }
    else ctx.arc(cx, s * 0.71, s * 0.06, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (id === 'asgore') {
    ctx.fillStyle = '#2d3d5e';
    ctx.beginPath();
    ctx.moveTo(s * 0.12, s);
    ctx.quadraticCurveTo(s * 0.16, s * 0.72, cx, s * 0.72);
    ctx.quadraticCurveTo(s * 0.84, s * 0.72, s * 0.88, s);
    ctx.fill();
    circle(ctx, s * 0.7, s * 0.86, s * 0.05, '#e8c56a');
    bustBase(ctx, s, SKIN.asgore, SKIN.asgoreShade);
    ellipse(ctx, s * 0.16, s * 0.56, s * 0.1, s * 0.14, SKIN.asgore);
    ellipse(ctx, s * 0.84, s * 0.56, s * 0.1, s * 0.14, SKIN.asgore);
    ctx.fillStyle = '#e3c274';
    ctx.beginPath();
    ctx.moveTo(s * 0.26, s * 0.66);
    ctx.quadraticCurveTo(cx, s * 1.0, s * 0.74, s * 0.66);
    ctx.quadraticCurveTo(cx, s * 0.82, s * 0.26, s * 0.66);
    ctx.fill();
    ctx.fillStyle = '#1c2740';
    ctx.beginPath();
    ctx.ellipse(cx, s * 0.26, s * 0.36, s * 0.2, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(s * 0.1, s * 0.25, s * 0.8, s * 0.1);
    ctx.fillStyle = '#0f172b';
    ctx.fillRect(s * 0.08, s * 0.33, s * 0.84, s * 0.06);
    circle(ctx, cx, s * 0.25, s * 0.045, '#e8c56a');
    // horns poking out beside the cap
    ctx.fillStyle = '#cdb894';
    ctx.beginPath();
    ctx.moveTo(s * 0.14, s * 0.2);
    ctx.quadraticCurveTo(s * 0.05, s * 0.12, s * 0.09, s * 0.02);
    ctx.lineTo(s * 0.17, s * 0.06);
    ctx.quadraticCurveTo(s * 0.14, s * 0.13, s * 0.19, s * 0.19);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 0.86, s * 0.2);
    ctx.quadraticCurveTo(s * 0.95, s * 0.12, s * 0.91, s * 0.02);
    ctx.lineTo(s * 0.83, s * 0.06);
    ctx.quadraticCurveTo(s * 0.86, s * 0.13, s * 0.81, s * 0.19);
    ctx.fill();
    bustEyes(ctx, s, s * 0.53, s * 0.14, '#241c2e', s * 0.05, mood);
    ctx.strokeStyle = '#8d7148';
    ctx.lineWidth = Math.max(1, s * 0.016);
    ctx.beginPath();
    ctx.arc(cx, s * 0.7, s * 0.07, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (id === 'toriel') {
    ctx.fillStyle = '#6a4a7c';
    ctx.beginPath();
    ctx.moveTo(s * 0.14, s);
    ctx.quadraticCurveTo(s * 0.18, s * 0.72, cx, s * 0.72);
    ctx.quadraticCurveTo(s * 0.82, s * 0.72, s * 0.86, s);
    ctx.fill();
    ctx.fillStyle = '#8b6b9c';
    ctx.fillRect(s * 0.24, s * 0.8, s * 0.52, s * 0.07);
    bustBase(ctx, s, SKIN.toriel, SKIN.torielShade);
    ellipse(ctx, s * 0.15, s * 0.58, s * 0.1, s * 0.15, SKIN.toriel);
    ellipse(ctx, s * 0.85, s * 0.58, s * 0.1, s * 0.15, SKIN.toriel);
    ctx.fillStyle = '#efe6d6';
    ctx.beginPath();
    ctx.arc(cx, s * 0.34, s * 0.36, Math.PI * 1.03, Math.PI * 1.97);
    ctx.fill();
    rect(ctx, s * 0.27, s * 0.07, s * 0.09, s * 0.17, '#cdb894');
    rect(ctx, s * 0.64, s * 0.07, s * 0.09, s * 0.17, '#cdb894');
    bustEyes(ctx, s, s * 0.52, s * 0.13, '#3a2a3e', s * 0.045, mood);
    circle(ctx, cx, s * 0.66, s * 0.04, '#8c6a72');
    ctx.strokeStyle = '#a08088';
    ctx.lineWidth = Math.max(1, s * 0.015);
    ctx.beginPath();
    if (mood === 'happy') ctx.arc(cx, s * 0.7, s * 0.07, 0.15 * Math.PI, 0.85 * Math.PI);
    else { ctx.moveTo(cx - s * 0.05, s * 0.72); ctx.lineTo(cx + s * 0.05, s * 0.72); }
    ctx.stroke();
  } else if (id === 'sans') {
    ctx.fillStyle = '#22293d';
    ctx.beginPath();
    ctx.moveTo(s * 0.14, s);
    ctx.quadraticCurveTo(s * 0.18, s * 0.74, cx, s * 0.74);
    ctx.quadraticCurveTo(s * 0.82, s * 0.74, s * 0.86, s);
    ctx.fill();
    bustBase(ctx, s, '#ece6dc', '#d6cec0');
    ctx.fillStyle = '#2b3550';
    ctx.beginPath();
    ctx.arc(cx, s * 0.36, s * 0.36, Math.PI * 1.02, Math.PI * 1.98);
    ctx.fill();
    bustEyes(ctx, s, s * 0.52, s * 0.14, '#111018', s * 0.05, mood === 'normal' ? 'normal' : mood);
    ctx.strokeStyle = '#6d6470';
    ctx.lineWidth = Math.max(1, s * 0.016);
    ctx.beginPath();
    ctx.arc(cx, s * 0.66, s * 0.09, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  } else if (id === 'reflection') {
    // a face made of mirror shards
    ctx.fillStyle = '#120f1c';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(180, 210, 255, 0.25)';
    ctx.lineWidth = 1;
    for (let i = -2; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * s * 0.2, 0);
      ctx.lineTo(i * s * 0.2 + s * 0.5, s);
      ctx.stroke();
    }
    ellipse(ctx, cx, s * 0.5, s * 0.3, s * 0.34, 'rgba(240, 240, 255, 0.09)');
    ellipse(ctx, cx - s * 0.12, s * 0.46, s * 0.055, s * 0.09, '#0a0812');
    ellipse(ctx, cx + s * 0.12, s * 0.46, s * 0.055, s * 0.09, '#0a0812');
    circle(ctx, cx - s * 0.12, s * 0.47, s * 0.018, '#ff4d4d');
    circle(ctx, cx + s * 0.12, s * 0.47, s * 0.018, '#ff4d4d');
    ctx.strokeStyle = '#cfc6e0';
    ctx.lineWidth = Math.max(1.5, s * 0.02);
    ctx.beginPath();
    ctx.arc(cx, s * 0.6, s * 0.17, 0.08 * Math.PI, 0.92 * Math.PI);
    ctx.stroke();
    // cracks
    ctx.strokeStyle = 'rgba(230, 240, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx - s * 0.05, s * 0.25); ctx.lineTo(cx + s * 0.04, s * 0.4);
    ctx.lineTo(cx - s * 0.03, s * 0.7); ctx.lineTo(cx + s * 0.05, s);
    ctx.stroke();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ scenery

export function drawPine(ctx, x, y, s = 1, snowy = true) {
  shadow(ctx, x, y + 2, 16 * s);
  rect(ctx, x - 2 * s, y - 6 * s, 4 * s, 8 * s, '#4a3528');
  for (let i = 0; i < 3; i++) {
    const w = (24 - i * 6) * s;
    const h = 16 * s;
    const yy = y - 8 * s - i * 12 * s;
    poly(ctx, [[x - w / 2, yy], [x + w / 2, yy], [x, yy - h]], i === 0 ? '#24483a' : '#2b5544');
    if (snowy) poly(ctx, [[x - w / 2 + 2 * s, yy], [x + w / 2 - 2 * s, yy], [x, yy - 3 * s]], '#e9f0f8');
  }
}

export function drawLamp(ctx, x, y, t = 0) {
  shadow(ctx, x, y, 8);
  rect(ctx, x - 1.5, y - 38, 3, 38, '#2a2f3d');
  rect(ctx, x - 6, y - 2, 12, 3, '#22262f');
  const flicker = 0.82 + Math.sin(t * 7 + x) * 0.06;
  const g = ctx.createRadialGradient(x, y - 42, 2, x, y - 42, 34);
  g.addColorStop(0, `rgba(255, 208, 120, ${0.5 * flicker})`);
  g.addColorStop(0.5, `rgba(255, 190, 100, ${0.16 * flicker})`);
  g.addColorStop(1, 'rgba(255, 190, 100, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y - 42, 34, 0, Math.PI * 2);
  ctx.fill();
  circle(ctx, x, y - 43, 5, '#ffd98a');
  rect(ctx, x - 6, y - 47, 12, 2, '#22262f');
}

export function drawBuilding(ctx, b, t = 0) {
  const { x, y, w, h, wall = '#4b4159', roof = '#2e2739', door = '#2a2333' } = b;
  // body
  rect(ctx, x, y + 18, w, h - 18, wall);
  // roof
  poly(ctx, [[x - 12, y + 22], [x + w + 12, y + 22], [x + w * 0.7, y - 14], [x + w * 0.3, y - 14]], roof);
  poly(ctx, [[x - 10, y + 20], [x + w + 10, y + 20], [x + w * 0.7, y - 8], [x + w * 0.3, y - 8]], '#3a3149');
  // snow on roof
  poly(ctx, [[x - 8, y + 21], [x + w + 8, y + 21], [x + w * 0.72, y - 6], [x + w * 0.3, y - 6]], '#eef4fb');
  poly(ctx, [[x - 2, y + 18], [x + w + 2, y + 18], [x + w * 0.74, y - 1], [x + w * 0.3, y - 1]], '#d7e3f1');
  // door
  rect(ctx, x + w / 2 - 13, y + h - 40, 26, 40, door);
  rect(ctx, x + w / 2 - 13, y + h - 40, 26, 4, '#1b1724');
  circle(ctx, x + w / 2 + 7, y + h - 20, 1.6, '#d8b56a');
  // windows
  const wy = y + 36;
  for (let i = 0; i < Math.max(1, Math.floor(w / 78)); i++) {
    const wx = x + 24 + i * 78;
    const lit = hash2(Math.floor(wx), Math.floor(wy)) > 0.4;
    rect(ctx, wx, wy, 26, 24, lit ? '#ffd27a' : '#2a3448');
    rect(ctx, wx + 3, wy + 3, 8, 8, lit ? '#ffe7a8' : '#3a465e');
    rect(ctx, wx + 15, wy + 13, 8, 8, lit ? '#ffe7a8' : '#3a465e');
    rect(ctx, wx - 2, wy - 3, 30, 3, '#241f2e');
  }
  if (b.sign) {
    ctx.fillStyle = 'rgba(14, 16, 28, 0.85)';
    ctx.fillRect(x + w / 2 - 38, y + 14, 76, 15);
    ctx.fillStyle = '#f4e6c8';
    ctx.font = 'bold 8px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.sign, x + w / 2, y + 22);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
  // snow drift at base
  ellipse(ctx, x + 14, y + h - 2, 18, 5, '#e3ecf7');
  ellipse(ctx, x + w - 16, y + h - 2, 22, 6, '#e3ecf7');
}

export function drawSnowman(ctx, x, y) {
  shadow(ctx, x, y, 10);
  circle(ctx, x, y - 9, 9, '#eef4fb');
  circle(ctx, x, y - 22, 7, '#f6faff');
  circle(ctx, x, y - 31, 5, '#f6faff');
  circle(ctx, x - 2, y - 32, 0.9, '#2a2f3d');
  circle(ctx, x + 2, y - 32, 0.9, '#2a2f3d');
  poly(ctx, [[x, y - 30], [x + 5, y - 28], [x, y - 27]], '#d98a3d');
  rect(ctx, x - 5, y - 27, 10, 2, '#b8474a');
  rect(ctx, x - 3, y - 27, 2, 6, '#b8474a');
}

export function drawBench(ctx, x, y) {
  shadow(ctx, x, y + 2, 18);
  rect(ctx, x - 18, y - 12, 36, 4, '#6b4a35');
  rect(ctx, x - 18, y - 18, 36, 4, '#7a563d');
  rect(ctx, x - 16, y - 12, 3, 12, '#3a3a46');
  rect(ctx, x + 13, y - 12, 3, 12, '#3a3a46');
}

export function drawMirror(ctx, x, y, w, h, opts = {}) {
  const { cracked = false, demon = false, t = 0 } = opts;
  rect(ctx, x - 5, y - 5, w + 10, h + 10, '#4a3a2c');
  rect(ctx, x - 3, y - 3, w + 6, h + 6, '#6b543c');
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#cfe0ee');
  g.addColorStop(0.45, '#9fb6cf');
  g.addColorStop(1, '#dbe8f4');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.1, y + h * 0.9);
  ctx.lineTo(x + w * 0.5, y + h * 0.05);
  ctx.lineTo(x + w * 0.65, y + h * 0.05);
  ctx.lineTo(x + w * 0.2, y + h * 0.9);
  ctx.fill();
  if (demon) {
    const cx = x + w / 2;
    const cy = y + h * 0.45;
    ellipse(ctx, cx, cy, w * 0.3, h * 0.32, 'rgba(20, 14, 28, 0.9)');
    ellipse(ctx, cx - w * 0.12, cy - h * 0.05, w * 0.055, h * 0.09, '#05040a');
    ellipse(ctx, cx + w * 0.12, cy - h * 0.05, w * 0.055, h * 0.09, '#05040a');
    circle(ctx, cx - w * 0.12, cy - h * 0.04, w * 0.018, '#ff4d4d');
    circle(ctx, cx + w * 0.12, cy - h * 0.04, w * 0.018, '#ff4d4d');
    ctx.strokeStyle = '#d8d0e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy + h * 0.13, w * 0.18, 0.06 * Math.PI, 0.94 * Math.PI);
    ctx.stroke();
  } else {
    // a quiet, ordinary reflection
    ellipse(ctx, x + w / 2, y + h * 0.55, w * 0.2, h * 0.28, 'rgba(60, 72, 94, 0.22)');
  }
  if (cracked) {
    ctx.strokeStyle = 'rgba(240, 248, 255, 0.9)';
    ctx.lineWidth = 1.4;
    const cx = x + w * 0.55;
    const cy = y + h * 0.5;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * w * 0.42, cy + Math.sin(a) * h * 0.42);
      ctx.lineTo(cx + Math.cos(a + 0.2) * w * 0.5, cy + Math.sin(a + 0.2) * h * 0.5);
      ctx.stroke();
    }
  }
}

export function drawSoul(ctx, x, y, size = 8, color = '#ff4d6d') {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  const s = size;
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(-s * 0.7, -s * 0.15, -s * 0.55, -s * 0.62, -s * 0.22, -s * 0.62);
  ctx.bezierCurveTo(-s * 0.05, -s * 0.62, 0, -s * 0.45, 0, -s * 0.35);
  ctx.bezierCurveTo(0, -s * 0.45, s * 0.05, -s * 0.62, s * 0.22, -s * 0.62);
  ctx.bezierCurveTo(s * 0.55, -s * 0.62, s * 0.7, -s * 0.15, 0, s * 0.35);
  ctx.fill();
  ctx.restore();
}

export function drawShadowling(ctx, kind, x, y, t = 0) {
  const bob = Math.sin(t * 2.4) * 3;
  const yy = y + bob;
  if (kind === 'grinling') {
    shadow(ctx, x, y + 2, 12);
    ellipse(ctx, x, yy - 14, 15, 13, '#171326');
    circle(ctx, x - 5, yy - 18, 2, '#f4f0ff');
    circle(ctx, x + 5, yy - 18, 2, '#f4f0ff');
    ctx.strokeStyle = '#f4f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, yy - 12, 7, 0.08 * Math.PI, 0.92 * Math.PI);
    ctx.stroke();
    // little horns
    poly(ctx, [[x - 12, yy - 23], [x - 15, yy - 30], [x - 8, yy - 26]], '#171326');
    poly(ctx, [[x + 12, yy - 23], [x + 15, yy - 30], [x + 8, yy - 26]], '#171326');
  } else if (kind === 'hush') {
    shadow(ctx, x, y + 2, 13);
    ctx.fillStyle = '#1a1526';
    ctx.beginPath();
    ctx.moveTo(x - 13, y);
    ctx.quadraticCurveTo(x - 16, yy - 34, x, yy - 42);
    ctx.quadraticCurveTo(x + 16, yy - 34, x + 13, y);
    ctx.closePath();
    ctx.fill();
    ellipse(ctx, x, yy - 28, 7, 5, '#f2eefc');
    circle(ctx, x, yy - 28, 2.2, '#141020');
    ctx.strokeStyle = 'rgba(240,235,255,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, yy - 18, 5, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  } else if (kind === 'reflection') {
    shadow(ctx, x, y + 2, 20);
    rect(ctx, x - 22, yy - 56, 44, 56, 'rgba(230, 238, 255, 0.16)');
    rect(ctx, x - 22, yy - 56, 44, 56, 'rgba(10, 8, 18, 0.55)');
    rect(ctx, x - 24, yy - 58, 48, 3, '#8f7f6a');
    rect(ctx, x - 24, yy - 2, 48, 3, '#8f7f6a');
    ellipse(ctx, x, yy - 34, 14, 17, 'rgba(240, 238, 255, 0.12)');
    ellipse(ctx, x - 5, yy - 38, 2.6, 4, '#05040a');
    ellipse(ctx, x + 5, yy - 38, 2.6, 4, '#05040a');
    circle(ctx, x - 5, yy - 37, 0.9, '#ff4d4d');
    circle(ctx, x + 5, yy - 37, 0.9, '#ff4d4d');
    ctx.strokeStyle = '#d8d0e8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, yy - 26, 8, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  }
}

export function drawSnowfall(ctx, flakes, dt, w = 640, h = 360) {
  for (const f of flakes) {
    f.y += f.vy * dt;
    f.x += Math.sin(f.t + f.y * 0.01) * 4 * dt;
    f.t += dt;
    if (f.y > h + 4) {
      f.y = -4;
      f.x = Math.random() * w;
    }
    if (f.x < -6) f.x = w + 4;
    if (f.x > w + 6) f.x = -4;
    ctx.fillStyle = `rgba(235, 244, 255, ${f.a})`;
    ctx.fillRect(f.x, f.y, f.s, f.s);
  }
}

export function makeFlakes(count = 60, w = 640, h = 360) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vy: 8 + Math.random() * 22,
      s: Math.random() > 0.75 ? 2 : 1,
      a: 0.25 + Math.random() * 0.55,
      t: Math.random() * 10,
    });
  }
  return out;
}

export function drawGlow(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export { clamp };
