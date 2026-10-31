// portraits.js — 64×64 dialogue busts, drawn pixel by pixel.
import { rect, rr, ellipse, line, text } from './art.js';

const CREAM = '#efe6d6';
const CREAM_D = '#d8cbb8';
const CREAM_L = '#f8f1e3';
const SHADE = '#b7a68f';

function glowBg(ctx, color) {
  const g = ctx.createRadialGradient(32, 31, 2, 32, 31, 34);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(5,7,15,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
}

function eyesSrif(ctx, expr, t) {
  const blink = Math.sin(t * 1.9) > 0.997;
  const socket = '#2a2330';
  if (expr === 'demon') return;
  if (blink) {
    rect(ctx, 23, 30, 5, 1.4, socket);
    rect(ctx, 36, 30, 5, 1.4, socket);
    return;
  }
  if (expr === 'afraid') {
    rect(ctx, 23, 27, 6, 6, '#f5efe2');
    rect(ctx, 35, 27, 6, 6, '#f5efe2');
    rect(ctx, 24.4, 28, 3.2, 4, socket);
    rect(ctx, 36.4, 28, 3.2, 4, socket);
    rect(ctx, 25.2, 28.6, 1.4, 1.4, '#e14b60');
    rect(ctx, 37.2, 28.6, 1.4, 1.4, '#e14b60');
  } else if (expr === 'sad' || expr === 'tired') {
    rect(ctx, 23, 29, 5, 3, '#f5efe2');
    rect(ctx, 36, 29, 5, 3, '#f5efe2');
    rect(ctx, 24.4, 29.4, 2.4, 2.2, '#b93c50');
    rect(ctx, 37.4, 29.4, 2.4, 2.2, '#b93c50');
    if (expr === 'tired') {
      rect(ctx, 22, 33, 7, 1, '#c4b3a4');
      rect(ctx, 35, 33, 7, 1, '#c4b3a4');
    }
  } else if (expr === 'smile') {
    rect(ctx, 23, 29, 5, 3.4, '#221b26');
    rect(ctx, 36, 29, 5, 3.4, '#221b26');
    rect(ctx, 24, 30, 2.6, 2, '#d8465b');
    rect(ctx, 37, 30, 2.6, 2, '#d8465b');
    rect(ctx, 23.6, 30.2, 0.8, 0.8, '#ffc2c8');
  } else {
    rect(ctx, 23, 29, 5, 3.6, '#221b26');
    rect(ctx, 36, 29, 5, 3.6, '#221b26');
    rect(ctx, 24.2, 30, 2.2, 2, '#c94055');
    rect(ctx, 37.2, 30, 2.2, 2, '#c94055');
    rect(ctx, 23.8, 30.2, 0.7, 0.7, '#ffc2c8');
  }
}

function mouthSrif(ctx, expr) {
  const lip = '#8a6a64';
  switch (expr) {
    case 'smile':
      rect(ctx, 27, 42.4, 10, 1.2, '#fbf4e8');
      rect(ctx, 26, 41.8, 2, 1.2, lip);
      rect(ctx, 36, 41.8, 2, 1.2, lip);
      rect(ctx, 28, 43.4, 8, 0.8, '#b3807e');
      break;
    case 'soft':
      rect(ctx, 29, 42.4, 6, 0.9, lip);
      rect(ctx, 28, 41.8, 1.4, 0.8, lip);
      rect(ctx, 34.6, 41.8, 1.4, 0.8, lip);
      break;
    case 'sad':
      rect(ctx, 29, 43, 6, 0.8, lip);
      rect(ctx, 28, 43.6, 1.2, 0.8, lip);
      rect(ctx, 34.8, 43.6, 1.2, 0.8, lip);
      break;
    case 'afraid':
      rect(ctx, 30, 42, 4, 3, '#5d4148');
      rect(ctx, 30, 42, 4, 0.8, '#a87678');
      break;
    case 'tired':
      rect(ctx, 29, 42.8, 6, 0.8, lip);
      break;
    default:
      rect(ctx, 29, 42.6, 6, 0.9, lip);
  }
}

function srifPortrait(ctx, expr, t) {
  glowBg(ctx, 'rgba(143,227,255,.14)');
  // shoulders
  rect(ctx, 5, 55, 54, 9, '#2c5f4d');
  rect(ctx, 8, 53, 48, 8, '#326a56');
  rect(ctx, 10, 60, 44, 4, '#234d3f');
  // scarf
  rect(ctx, 13, 48, 38, 7, '#c53d4f');
  rect(ctx, 15, 49, 34, 2, '#dd5869');
  rect(ctx, 37, 52, 7, 12, '#b8374d');
  rect(ctx, 39, 58, 5, 6, '#a02e44');
  rect(ctx, 16, 52, 3, 3, '#a02e44');
  // neck
  rect(ctx, 27, 44, 10, 6, CREAM_D);
  // ears
  rect(ctx, 9, 31, 5, 4, CREAM);
  rect(ctx, 7, 35, 7, 8, CREAM);
  rect(ctx, 9, 42, 5, 3, CREAM);
  rect(ctx, 10, 35, 2.6, 6, '#d5a3a1');
  rect(ctx, 50, 31, 5, 4, CREAM_D);
  rect(ctx, 50, 35, 7, 8, CREAM_D);
  rect(ctx, 50, 42, 5, 3, CREAM_D);
  rect(ctx, 51.4, 35, 2.6, 6, '#c08f90');
  // horns
  rect(ctx, 18, 9, 3, 4, '#c8b28f');
  rect(ctx, 19, 12, 3, 7, '#d8c3a0');
  rect(ctx, 17, 5, 3, 5, '#a98f68');
  rect(ctx, 43, 9, 3, 4, '#c8b28f');
  rect(ctx, 42, 12, 3, 7, '#d8c3a0');
  rect(ctx, 44, 5, 3, 5, '#a98f68');
  // head base — stepped pixel oval
  rect(ctx, 23, 14, 18, 3, CREAM);
  rect(ctx, 20, 17, 24, 4, CREAM);
  rect(ctx, 18, 21, 28, 19, CREAM);
  rect(ctx, 20, 40, 24, 5, CREAM);
  rect(ctx, 23, 45, 18, 4, CREAM);
  rect(ctx, 27, 48, 10, 2, CREAM);
  // shading right side
  rect(ctx, 43, 21, 3, 19, CREAM_D);
  rect(ctx, 42, 40, 2, 5, CREAM_D);
  rect(ctx, 40, 46, 2, 3, CREAM_D);
  rect(ctx, 38, 48, 2, 2, CREAM_D);
  // fur tuft
  rect(ctx, 27, 12, 9, 3, CREAM_L);
  rect(ctx, 25, 14, 3, 2, CREAM_L);
  rect(ctx, 35, 13, 4, 2, CREAM_L);
  // forehead highlight
  rect(ctx, 22, 19, 6, 1.4, '#f7f0e4');
  // brows
  const brow = '#b19e88';
  if (expr === 'sad' || expr === 'afraid') {
    rect(ctx, 22, 25, 6, 1.2, brow);
    rect(ctx, 36, 25, 6, 1.2, brow);
    rect(ctx, 22.5, 24, 3, 1, brow);
    rect(ctx, 38.5, 24, 3, 1, brow);
  } else if (expr === 'smile') {
    rect(ctx, 23, 26, 5, 0.9, brow);
    rect(ctx, 36, 26, 5, 0.9, brow);
  } else if (expr === 'tired') {
    rect(ctx, 22, 26, 6, 1, brow);
    rect(ctx, 36, 26, 6, 1, brow);
  } else {
    rect(ctx, 22, 25.6, 6, 1, brow);
    rect(ctx, 36, 25.6, 6, 1, brow);
  }
  eyesSrif(ctx, expr, t);
  // muzzle
  rect(ctx, 25, 36, 14, 4, '#f7eddd');
  rect(ctx, 26, 40, 12, 5, '#f7eddd');
  rect(ctx, 27, 45, 10, 2, '#f2e6d4');
  rect(ctx, 30, 36, 4, 3, '#3a2c34');
  rect(ctx, 30, 36, 2, 1, '#6b5560');
  rect(ctx, 33, 36.8, 1, 1, '#f0e6d8');
  mouthSrif(ctx, expr);
  // freckles / blush
  rect(ctx, 22, 37, 1.2, 1.2, '#d3a09c');
  rect(ctx, 24, 39, 0.9, 0.9, '#d3a09c');
  rect(ctx, 40, 37, 1.2, 1.2, '#c99a96');
  rect(ctx, 39, 39, 0.9, 0.9, '#c99a96');
  rect(ctx, 21, 38, 2, 1, 'rgba(211,140,145,.45)');
  rect(ctx, 41, 38, 2, 1, 'rgba(211,140,145,.4)');
  // snowflakes caught in fur
  rect(ctx, 20, 22, 1, 1, '#e9f4ff');
  rect(ctx, 28, 17, 0.9, 0.9, '#dcecff');
  rect(ctx, 45, 27, 0.8, 0.8, '#dcecff');
  rect(ctx, 17, 34, 0.8, 0.8, '#dcecff');
  // demon face
  if (expr === 'demon') {
    rect(ctx, 18, 24, 28, 3, '#100e18');
    rect(ctx, 17, 27, 30, 17, '#100e18');
    rect(ctx, 20, 44, 24, 4, '#100e18');
    rect(ctx, 24, 48, 16, 2, '#0a0910');
    // red eyes
    rect(ctx, 23, 30, 6, 3, '#ff3b5c');
    rect(ctx, 36, 30, 6, 3, '#ff3b5c');
    rect(ctx, 24, 30.8, 3, 1.2, '#ff8a9d');
    rect(ctx, 37, 30.8, 3, 1.2, '#ff8a9d');
    // grin
    rect(ctx, 23, 38, 20, 3, '#e9e3d6');
    for (let i = 0; i < 7; i++) {
      rect(ctx, 24 + i * 2.6, 38, 1, 3, '#100e18');
    }
    rect(ctx, 22, 37, 2, 2, '#e9e3d6');
    rect(ctx, 42, 37, 2, 2, '#e9e3d6');
    // cracks
    line(ctx, 28, 24, 26, 20, '#ff3b5c', 0.8);
    line(ctx, 38, 47, 41, 51, '#ff3b5c', 0.8);
  }
}

function chrisPortrait(ctx, expr, t) {
  glowBg(ctx, 'rgba(123,214,164,.13)');
  // shoulders
  rect(ctx, 5, 55, 54, 9, '#2d6247');
  rect(ctx, 8, 53, 48, 8, '#3f7d5d');
  rect(ctx, 10, 60, 44, 4, '#2c6247');
  // snowflake on sweater
  rect(ctx, 19, 56, 1.4, 5, '#e8f3e5');
  rect(ctx, 17, 57.6, 5.4, 1.4, '#e8f3e5');
  rect(ctx, 41, 55, 1.2, 4, '#e8f3e5');
  rect(ctx, 39.5, 56.4, 4.4, 1.2, '#e8f3e5');
  // scarf
  rect(ctx, 13, 48, 38, 7, '#b63d4b');
  rect(ctx, 15, 49, 34, 2, '#d45563');
  rect(ctx, 39, 52, 8, 12, '#a53240');
  // antlers
  const tine = (x1, y1, x2, y2) => line(ctx, x1, y1, x2, y2, '#b68f5f', 2);
  tine(24, 12, 18, 1); tine(20, 5, 14, 0); tine(20.5, 7, 27, 1);
  tine(40, 12, 46, 1); tine(44, 5, 50, 0); tine(43.5, 7, 37, 1);
  tine(24, 12, 22, 17); tine(40, 12, 42, 17);
  rect(ctx, 13, 0, 3, 2, '#d8b987');
  rect(ctx, 48, 0, 3, 2, '#d8b987');
  // ears
  rect(ctx, 10, 30, 6, 5, '#c99563');
  rect(ctx, 8, 34, 8, 8, '#c99563');
  rect(ctx, 10, 41, 5, 3, '#c99563');
  rect(ctx, 10, 35, 3, 6, '#a8704f');
  rect(ctx, 48, 30, 6, 5, '#c99563');
  rect(ctx, 48, 34, 8, 8, '#c99563');
  rect(ctx, 49, 41, 5, 3, '#c99563');
  rect(ctx, 51, 35, 3, 6, '#a8704f');
  // head
  rect(ctx, 21, 16, 22, 3, '#c99563');
  rect(ctx, 18, 19, 28, 5, '#c99563');
  rect(ctx, 17, 24, 30, 20, '#c99563');
  rect(ctx, 19, 44, 26, 5, '#c99563');
  rect(ctx, 23, 49, 18, 3, '#c99563');
  // shading
  rect(ctx, 43, 24, 4, 20, '#b98355');
  rect(ctx, 41, 44, 4, 5, '#b98355');
  // fur tuft
  rect(ctx, 26, 14, 12, 3, '#d9a974');
  rect(ctx, 30, 12, 7, 2, '#d9a974');
  // brows
  if (expr === 'worried') {
    rect(ctx, 22, 25, 6, 1.3, '#8a5a3d');
    rect(ctx, 36, 25, 6, 1.3, '#8a5a3d');
    rect(ctx, 22.5, 24, 3, 1, '#8a5a3d');
    rect(ctx, 38.5, 24, 3, 1, '#8a5a3d');
  } else if (expr === 'soft') {
    rect(ctx, 22, 27, 6, 1.1, '#8a5a3d');
    rect(ctx, 36, 27, 6, 1.1, '#8a5a3d');
  } else {
    rect(ctx, 22, 26, 6, 1.2, '#8a5a3d');
    rect(ctx, 36, 26, 6, 1.2, '#8a5a3d');
  }
  // eyes
  if (expr === 'grin') {
    rect(ctx, 23, 29, 5, 2.2, '#241a1e');
    rect(ctx, 36, 29, 5, 2.2, '#241a1e');
    rect(ctx, 24, 29.4, 1.6, 1.2, '#fff6e8');
    rect(ctx, 37, 29.4, 1.6, 1.2, '#fff6e8');
  } else if (expr === 'worried') {
    rect(ctx, 23, 27.4, 6, 5, '#fff6e8');
    rect(ctx, 36, 27.4, 6, 5, '#fff6e8');
    rect(ctx, 24.4, 28.4, 3.2, 3.4, '#241a1e');
    rect(ctx, 37.4, 28.4, 3.2, 3.4, '#241a1e');
    rect(ctx, 25.2, 28.8, 1.2, 1.2, '#ffffff');
    rect(ctx, 38.2, 28.8, 1.2, 1.2, '#ffffff');
  } else {
    rect(ctx, 23, 27.6, 6, 5, '#fff6e8');
    rect(ctx, 36, 27.6, 6, 5, '#fff6e8');
    rect(ctx, 24.6, 28.4, 3.4, 3.6, '#241a1e');
    rect(ctx, 37.6, 28.4, 3.4, 3.6, '#241a1e');
    rect(ctx, 25.6, 28.8, 1.2, 1.4, '#ffffff');
    rect(ctx, 38.6, 28.8, 1.2, 1.4, '#ffffff');
  }
  // muzzle
  rect(ctx, 24, 35, 16, 5, '#e5c194');
  rect(ctx, 25, 40, 14, 6, '#e5c194');
  rect(ctx, 27, 45, 10, 2, '#ddb68a');
  rect(ctx, 30, 35, 4, 3, '#4a2d24');
  rect(ctx, 30, 35, 2, 1, '#7a5140');
  // smile
  if (expr === 'worried') {
    rect(ctx, 29, 42.6, 6, 1.2, '#8a5b44');
    rect(ctx, 28, 43.2, 1.2, 0.8, '#8a5b44');
    rect(ctx, 35, 43.2, 1.2, 0.8, '#8a5b44');
  } else {
    rect(ctx, 27, 41.6, 10, 1.2, '#8a5b44');
    rect(ctx, 26, 41, 1.6, 1.2, '#8a5b44');
    rect(ctx, 36.4, 41, 1.6, 1.2, '#8a5b44');
    rect(ctx, 28, 43, 8, 1, '#f0d7b6');
  }
  // freckles
  rect(ctx, 21, 36, 1.2, 1.2, '#9a6644');
  rect(ctx, 23, 38, 1, 1, '#9a6644');
  rect(ctx, 41, 36, 1.2, 1.2, '#9a6644');
  rect(ctx, 40, 38, 1, 1, '#9a6644');
  // snowflake on antler
  rect(ctx, 19, 6, 0.9, 0.9, '#eaf6ff');
}

function michPortrait(ctx, expr, t) {
  glowBg(ctx, 'rgba(255,190,90,.12)');
  // shoulders / jacket
  rect(ctx, 4, 54, 56, 10, '#171820');
  rect(ctx, 9, 52, 46, 6, '#1b1c24');
  rect(ctx, 12, 60, 40, 4, '#111219');
  // gray tee
  rect(ctx, 26, 54, 12, 10, '#3a3d4b');
  rect(ctx, 27, 54, 10, 2, '#4a4e5f');
  // collar
  rect(ctx, 22, 49, 20, 4, '#111219');
  // ushanka back flaps
  rect(ctx, 9, 22, 5, 19, '#171820');
  rect(ctx, 50, 22, 5, 19, '#171820');
  // ears
  rect(ctx, 12, 18, 6, 6, '#c97a3a');
  rect(ctx, 46, 18, 6, 6, '#c97a3a');
  rect(ctx, 13.4, 19.4, 3, 3, '#7d4526');
  rect(ctx, 47.6, 19.4, 3, 3, '#7d4526');
  // head
  rect(ctx, 20, 16, 24, 3, '#c97a3a');
  rect(ctx, 18, 19, 28, 5, '#c97a3a');
  rect(ctx, 17, 24, 30, 20, '#c97a3a');
  rect(ctx, 19, 44, 26, 5, '#c97a3a');
  rect(ctx, 23, 49, 18, 2, '#c97a3a');
  rect(ctx, 43, 24, 4, 20, '#a65f2c');
  rect(ctx, 41, 44, 4, 5, '#a65f2c');
  // stripes
  rect(ctx, 22, 16, 2, 7, '#2a1b19');
  rect(ctx, 30, 14, 2, 6, '#2a1b19');
  rect(ctx, 38, 16, 2, 7, '#2a1b19');
  rect(ctx, 17, 26, 4, 2, '#2a1b19');
  rect(ctx, 43, 26, 4, 2, '#2a1b19');
  rect(ctx, 18, 31, 3, 1.4, '#2a1b19');
  rect(ctx, 43, 31, 3, 1.4, '#2a1b19');
  // brows
  if (expr === 'soft') {
    rect(ctx, 21, 25.6, 7, 1.2, '#7f4c28');
    rect(ctx, 36, 25.6, 7, 1.2, '#7f4c28');
  } else if (expr === 'surprised') {
    rect(ctx, 21, 23.4, 6, 1, '#7f4c28');
    rect(ctx, 37, 23.4, 6, 1, '#7f4c28');
  } else {
    rect(ctx, 21, 24.4, 7, 1.4, '#6b3d20');
    rect(ctx, 36, 25.2, 7, 1.4, '#6b3d20');
  }
  // eyes
  if (expr === 'surprised') {
    rect(ctx, 22.4, 26.4, 6, 5.4, '#fff1d6');
    rect(ctx, 35.6, 26.4, 6, 5.4, '#fff1d6');
    rect(ctx, 23.8, 27.8, 3, 3.2, '#ffc857');
    rect(ctx, 37, 27.8, 3, 3.2, '#ffc857');
    rect(ctx, 24.6, 27.8, 1.1, 3.2, '#221614');
    rect(ctx, 37.8, 27.8, 1.1, 3.2, '#221614');
  } else if (expr === 'soft') {
    rect(ctx, 22, 28, 6, 2.6, '#ffe1a1');
    rect(ctx, 36, 28, 6, 2.6, '#ffe1a1');
    rect(ctx, 23.4, 28, 1.4, 2.6, '#221614');
    rect(ctx, 37.4, 28, 1.4, 2.6, '#221614');
    rect(ctx, 22, 30.6, 6, 0.8, '#221614');
    rect(ctx, 36, 30.6, 6, 0.8, '#221614');
  } else {
    rect(ctx, 22.4, 27, 5.6, 3.6, '#ffc857');
    rect(ctx, 36, 27, 5.6, 3.6, '#ffc857');
    rect(ctx, 23.6, 27, 1.4, 3.6, '#221614');
    rect(ctx, 37.2, 27, 1.4, 3.6, '#221614');
    rect(ctx, 23.7, 27.6, 0.8, 0.8, '#fff3c8');
  }
  // scar over left brow
  rect(ctx, 19.4, 21.4, 1, 3.6, '#e6b18f');
  rect(ctx, 18.4, 21.4, 3, 0.8, '#e6b18f');
  // muzzle
  rect(ctx, 24, 35, 16, 5, '#efd6b4');
  rect(ctx, 25, 40, 14, 6, '#efd6b4');
  rect(ctx, 27, 45, 10, 2, '#e2c6a2');
  rect(ctx, 30, 35, 4, 3, '#3a2026');
  rect(ctx, 31, 35.6, 1, 0.8, '#6b4a52');
  if (expr === 'soft') {
    rect(ctx, 28, 42, 8, 1, '#8a5b44');
    rect(ctx, 27, 41.4, 1.4, 0.8, '#8a5b44');
    rect(ctx, 35.6, 41.4, 1.4, 0.8, '#8a5b44');
  } else if (expr === 'surprised') {
    rect(ctx, 30, 42, 4, 2.4, '#5d3a3c');
  } else {
    rect(ctx, 28, 42.6, 8, 1, '#8a5b44');
    rect(ctx, 27, 43.2, 1.2, 0.7, '#8a5b44');
    rect(ctx, 36, 43.2, 1.2, 0.7, '#8a5b44');
  }
  // ushanka front
  rect(ctx, 15, 13, 34, 7, '#171820');
  rect(ctx, 17, 10, 30, 5, '#1b1c24');
  rect(ctx, 15, 19, 34, 2.6, '#35363f');
  rect(ctx, 10, 16, 5, 17, '#171820');
  rect(ctx, 49, 16, 5, 17, '#171820');
  rect(ctx, 11, 18, 3, 13, '#2e2f38');
  rect(ctx, 50, 18, 3, 13, '#2e2f38');
  // star pin
  rect(ctx, 31, 14, 1.2, 4, '#d9c9a0');
  rect(ctx, 29.4, 15.4, 5.2, 1.2, '#d9c9a0');
  rect(ctx, 30.2, 16.2, 3.6, 1.6, '#d9c9a0');
  // snow on hat
  rect(ctx, 20, 10, 1, 0.9, '#eaf6ff');
  rect(ctx, 42, 11, 1, 0.9, '#eaf6ff');
}

function torielPortrait(ctx, expr, t) {
  glowBg(ctx, 'rgba(185,166,255,.13)');
  rect(ctx, 5, 55, 54, 9, '#4a3861');
  rect(ctx, 8, 53, 48, 8, '#5b4674');
  rect(ctx, 14, 49, 36, 7, '#cdb27a');
  rect(ctx, 30, 53, 4, 11, '#e0c891');
  rect(ctx, 27, 44, 10, 6, '#ddd2c4');
  // ears
  rect(ctx, 11, 31, 5, 4, '#f1ebe1');
  rect(ctx, 9, 35, 7, 8, '#f1ebe1');
  rect(ctx, 11, 42, 5, 3, '#f1ebe1');
  rect(ctx, 12, 35, 2.6, 6, '#d5bcbc');
  rect(ctx, 48, 31, 5, 4, '#e3ddd3');
  rect(ctx, 48, 35, 7, 8, '#e3ddd3');
  rect(ctx, 48, 42, 5, 3, '#e3ddd3');
  rect(ctx, 49.4, 35, 2.6, 6, '#c9b3b3');
  // horns
  rect(ctx, 20, 9, 3, 5, '#cbb28d');
  rect(ctx, 21, 13, 3, 6, '#d8c3a0');
  rect(ctx, 41, 9, 3, 5, '#cbb28d');
  rect(ctx, 40, 13, 3, 6, '#d8c3a0');
  // head
  rect(ctx, 23, 14, 18, 3, '#f1ebe1');
  rect(ctx, 20, 17, 24, 4, '#f1ebe1');
  rect(ctx, 18, 21, 28, 20, '#f1ebe1');
  rect(ctx, 20, 41, 24, 5, '#f1ebe1');
  rect(ctx, 23, 46, 18, 4, '#f1ebe1');
  rect(ctx, 27, 49, 10, 2, '#f1ebe1');
  rect(ctx, 42, 21, 4, 20, '#e3ddd3');
  // brows
  rect(ctx, 22, 25.6, 6, 1.1, '#c2b5a6');
  rect(ctx, 36, 25.6, 6, 1.1, '#c2b5a6');
  // eyes
  rect(ctx, 23, 28.4, 5, 3.4, '#a53b4d');
  rect(ctx, 36, 28.4, 5, 3.4, '#a53b4d');
  rect(ctx, 23.6, 29, 1.8, 1.6, '#ffc6cc');
  rect(ctx, 36.6, 29, 1.8, 1.6, '#ffc6cc');
  rect(ctx, 22, 32, 6, 0.8, '#d8cbb8');
  rect(ctx, 36, 32, 6, 0.8, '#d8cbb8');
  // muzzle
  rect(ctx, 25, 35, 14, 5, '#f8f1e7');
  rect(ctx, 26, 40, 12, 6, '#f8f1e7');
  rect(ctx, 30, 35, 4, 3, '#5a3f48');
  rect(ctx, 30, 35.6, 1, 0.8, '#8a6a72');
  // smile
  if (expr === 'worried') {
    rect(ctx, 29, 43, 6, 1, '#9a7b76');
    rect(ctx, 28, 43.6, 1.2, 0.8, '#9a7b76');
    rect(ctx, 35, 43.6, 1.2, 0.8, '#9a7b76');
  } else {
    rect(ctx, 28, 42.4, 8, 1, '#9a7b76');
    rect(ctx, 27, 41.8, 1.4, 0.9, '#9a7b76');
    rect(ctx, 35.6, 41.8, 1.4, 0.9, '#9a7b76');
  }
  rect(ctx, 22, 37, 1.4, 1.2, '#d9a6a6');
  rect(ctx, 40, 37, 1.4, 1.2, '#d9a6a6');
}

function asgorePortrait(ctx, expr, t) {
  glowBg(ctx, 'rgba(255,209,102,.12)');
  rect(ctx, 3, 54, 58, 10, '#223252');
  rect(ctx, 7, 51, 50, 8, '#2b3d63');
  rect(ctx, 9, 60, 46, 4, '#1b2945');
  rect(ctx, 28, 48, 8, 6, '#d9c9aa');
  rect(ctx, 22, 45, 20, 5, '#efe2c8');
  // mane
  rect(ctx, 14, 35, 5, 15, '#d9b56a');
  rect(ctx, 45, 35, 5, 15, '#c69f55');
  // horns
  rect(ctx, 15, 10, 4, 7, '#cbb28d');
  rect(ctx, 17, 16, 4, 6, '#d8c3a0');
  rect(ctx, 45, 10, 4, 7, '#cbb28d');
  rect(ctx, 43, 16, 4, 6, '#d8c3a0');
  // head
  rect(ctx, 19, 15, 26, 3, '#efe2c8');
  rect(ctx, 16, 18, 32, 5, '#efe2c8');
  rect(ctx, 14, 23, 36, 19, '#efe2c8');
  rect(ctx, 16, 42, 32, 6, '#efe2c8');
  rect(ctx, 20, 48, 24, 2, '#efe2c8');
  rect(ctx, 44, 23, 6, 19, '#d9c9aa');
  // fur tuft
  rect(ctx, 25, 12, 14, 4, '#f7ecd6');
  rect(ctx, 29, 10, 7, 2, '#f7ecd6');
  // beard
  rect(ctx, 16, 40, 32, 5, '#d9b56a');
  rect(ctx, 18, 45, 28, 5, '#d9b56a');
  rect(ctx, 22, 50, 20, 4, '#c69f55');
  rect(ctx, 26, 54, 12, 3, '#b88f4b');
  rect(ctx, 28, 44, 8, 3, '#efe2c8');
  // brows (sad)
  rect(ctx, 21, 25.4, 7, 1.4, '#b98f5f');
  rect(ctx, 36, 25.4, 7, 1.4, '#b98f5f');
  rect(ctx, 21.6, 24, 3.4, 1, '#b98f5f');
  rect(ctx, 39, 24, 3.4, 1, '#b98f5f');
  // eyes
  rect(ctx, 22, 28.4, 5.4, 3.2, '#7d4a3f');
  rect(ctx, 36.6, 28.4, 5.4, 3.2, '#7d4a3f');
  rect(ctx, 22.8, 29, 1.6, 1.4, '#ffe3d0');
  rect(ctx, 37.4, 29, 1.6, 1.4, '#ffe3d0');
  rect(ctx, 20.6, 32.6, 7, 0.8, '#cdbb9c');
  rect(ctx, 36.4, 32.6, 7, 0.8, '#cdbb9c');
  // big nose
  rect(ctx, 29, 34, 6, 4, '#3a2c34');
  rect(ctx, 29, 34, 3, 1.4, '#6b5560');
  // mouth
  rect(ctx, 28, 40.6, 8, 1.2, '#5a3f48');
  // police cap
  rect(ctx, 14, 10, 36, 4, '#14203a');
  rect(ctx, 15, 6, 34, 6, '#1b2945');
  rect(ctx, 17, 4, 30, 4, '#263c68');
  rect(ctx, 13, 14, 38, 2.4, '#0f1930');
  rect(ctx, 28, 5, 8, 6, '#e7c46b');
  rect(ctx, 30, 6.4, 4, 3.2, '#a8842d');
  rect(ctx, 17, 5, 1, 1, '#eaf6ff');
  rect(ctx, 46, 7, 1, 1, '#eaf6ff');
}

const BUILDERS = {
  srif: srifPortrait,
  chris: chrisPortrait,
  mich: michPortrait,
  toriel: torielPortrait,
  asgore: asgorePortrait,
};

export function drawPortrait(canvas, id, expr = 'neutral', t = 0) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);
  ctx.imageSmoothingEnabled = false;
  const fn = BUILDERS[id];
  if (!fn) return;
  ctx.save();
  fn(ctx, expr, t);
  ctx.restore();
}

export function defaultExpr(id) {
  return id === 'mich' ? 'scowl' : id === 'chris' ? 'grin' : 'neutral';
}
