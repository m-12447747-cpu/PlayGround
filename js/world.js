// Overworld scenes: Oppidan, the diner, the restroom, Srif's room, and the Novella.
import { VIEW_W, VIEW_H, clamp, dist, hash2, roundRect } from './engine.js';
import { input } from './engine.js';
import {
  drawChar, drawBuilding, drawPine, drawLamp, drawSnowman, drawBench,
  drawMirror, drawShadowling, drawSnowfall, makeFlakes, ellipse, rect, circle,
  poly, line, drawSoul, drawGlow,
} from './art.js';
import { audio } from './audio.js';
import {
  INTRO, ASGORE, TORIEL, CHRIS_MEET, DINER_CHRIS, MICH_SCENE, ROOM_ENTER,
  FOLDER, MIRROR, NOVELLA_INTRO, AFTER_FIRST, AFTER_SECOND, BOSS_INTRO,
  CHRIS_AFTER, DINER_AGAIN,
} from './story.js';

const PLAYER_SPEED = 96;
const FOOT = { w: 12, h: 9 };

// --------------------------------------------------------------------- maps

function town(game) {
  const f = game.flags;
  const npcs = [];

  npcs.push({
    id: 'asgore', x: 780, y: 602, dir: 0, mood: 'happy',
    lines: ASGORE,
  });
  npcs.push({
    id: 'toriel', x: 300, y: 464, dir: 0, mood: 'normal',
    lines: TORIEL,
  });

  if (!f.chrisMet) {
    npcs.push({
      id: 'chris', x: 810, y: 302, dir: 0, mood: 'happy',
      lines: CHRIS_MEET,
      onEnd: (g) => {
        g.flags.chrisMet = true;
        g.setObjective('Meet Chris at the diner.');
        g.world.refresh();
      },
    });
  } else if (f.michMet) {
    npcs.push({
      id: 'chris', x: 498, y: 322, dir: 2, mood: 'happy',
      lines: CHRIS_AFTER,
    });
    npcs.push({
      id: 'mich', x: 552, y: 324, dir: 1, mood: 'normal',
      lines: [
        { who: 'mich', text: 'Your mom said you were home. She was crying a little. Happy crying. I think.' },
        { who: 'srif', text: '(Happy crying. Right.)' },
      ],
    });
  }

  const buildings = [
    { x: 60, y: 400, w: 200, h: 150, wall: '#5b4a5e', roof: '#332a40', door: '#2a2333' },
    { x: 340, y: 110, w: 220, h: 150, wall: '#7a4a44', roof: '#3a2426', sign: 'OPPIDAN DINER' },
    { x: 720, y: 90, w: 200, h: 140, wall: '#4c5b4a', roof: '#26332a', sign: 'HOLIDAY' },
    { x: 720, y: 430, w: 180, h: 130, wall: '#3f4a63', roof: '#222a3d', sign: 'OPPIDAN PD' },
  ];

  const trees = [
    [38, 80, 1.1], [112, 62, 0.9], [248, 82, 1], [650, 58, 0.9],
    [952, 74, 1.05], [38, 300, 0.9], [952, 300, 0.95], [36, 620, 1],
    [610, 620, 0.9], [952, 620, 1.05], [286, 300, 0.85], [690, 300, 0.8],
  ];

  const colliders = [
    ...buildings.map((b) => ({ x: b.x, y: b.y + 18, w: b.w, h: b.h - 18 })),
    ...trees.map(([x, y]) => ({ x: x - 9, y: y - 8, w: 18, h: 12 })),
    { x: 278, y: 352, w: 5, h: 8 },
    { x: 558, y: 352, w: 5, h: 8 },
    { x: 854, y: 352, w: 5, h: 8 },
    { x: 492, y: 430, w: 40, h: 12 },
    { x: 470, y: 488, w: 124, h: 54 },
    { x: 58, y: 574, w: 72, h: 8 },
    { x: 190, y: 574, w: 74, h: 8 },
  ];

  return {
    id: 'town', w: 960, h: 640, music: 'town',
    spawn: { x: 372, y: 500 },
    colliders, npcs,
    doors: [
      { x: 144, y: 548, w: 34, h: 22, to: 'room', spawn: { x: 320, y: 326 } },
      { x: 432, y: 258, w: 36, h: 22, to: 'diner', spawn: { x: 320, y: 320 } },
    ],
    hotspots: [],
    draw(ctx, cam, t) {
      // snow
      ctx.fillStyle = '#dde7f4';
      ctx.fillRect(0, 0, 960, 640);

      // soft blue drifts
      for (let x = 0; x < 960; x += 96) {
        ellipse(ctx, x + 48, 120 + hash2(x, 1) * 40, 80, 22, 'rgba(198, 214, 234, 0.35)');
      }

      // roads
      rect(ctx, 0, 342, 960, 62, '#aeb9ca');
      rect(ctx, 0, 342, 960, 3, '#94a2b8');
      rect(ctx, 0, 401, 960, 3, '#94a2b8');
      rect(ctx, 622, 0, 58, 640, '#aeb9ca');
      rect(ctx, 622, 0, 3, 640, '#94a2b8');
      rect(ctx, 677, 0, 3, 640, '#94a2b8');
      // tire tracks
      ctx.fillStyle = 'rgba(120, 132, 152, 0.35)';
      for (let x = 20; x < 960; x += 46) {
        ctx.fillRect(x, 360, 20, 3);
        ctx.fillRect(x, 384, 20, 3);
      }
      // crosswalk
      for (let i = 0; i < 6; i++) {
        rect(ctx, 632, 348 + i * 9, 38, 5, 'rgba(238, 244, 252, 0.7)');
      }

      // snow speckles
      const sx = Math.floor(cam.x / 24) * 24;
      const sy = Math.floor(cam.y / 24) * 24;
      for (let x = sx; x < cam.x + VIEW_W + 24; x += 24) {
        for (let y = sy; y < cam.y + VIEW_H + 24; y += 24) {
          const h = hash2(x / 24, y / 24);
          if (h > 0.74) ellipse(ctx, x + h * 20, y + h * 17, 4 + h * 5, 2 + h * 2, '#eef4fb');
          else if (h < 0.09) ellipse(ctx, x + 10, y + 12, 6, 2.5, 'rgba(180, 198, 220, 0.5)');
        }
      }

      // sidewalk edges
      rect(ctx, 0, 336, 960, 7, '#c6d2e2');
      rect(ctx, 0, 404, 960, 7, '#c6d2e2');
      rect(ctx, 615, 0, 7, 640, '#c6d2e2');
      rect(ctx, 680, 0, 7, 640, '#c6d2e2');

      for (const b of buildings) drawBuilding(ctx, b, t);

      for (const [x, y, s] of trees) drawPine(ctx, x, y, s);
      drawLamp(ctx, 280, 360, t);
      drawLamp(ctx, 560, 360, t);
      drawLamp(ctx, 856, 360, t);
      drawSnowman(ctx, 600, 316);
      drawBench(ctx, 512, 442);
      drawBench(ctx, 880, 620);

      // moving truck
      ellipse(ctx, 532, 544, 64, 8, 'rgba(24, 28, 44, 0.22)');
      rect(ctx, 470, 486, 94, 50, '#c7d1dc');
      rect(ctx, 470, 486, 94, 6, '#e8eff7');
      rect(ctx, 470, 526, 94, 10, '#9dabbb');
      rect(ctx, 562, 500, 34, 36, '#b3becb');
      rect(ctx, 566, 506, 20, 14, '#7d9ab2');
      rect(ctx, 562, 500, 34, 4, '#d7e1ea');
      rect(ctx, 470, 486, 6, 50, '#8fa0b2');
      circle(ctx, 492, 536, 9, '#2a2f3d');
      circle(ctx, 492, 536, 4, '#7c8797');
      circle(ctx, 578, 536, 9, '#2a2f3d');
      circle(ctx, 578, 536, 4, '#7c8797');
      ctx.fillStyle = '#4a3f52';
      ctx.font = 'bold 8px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MOVING', 517, 512);
      ctx.font = '5px ui-monospace, monospace';
      ctx.fillStyle = '#6b5d70';
      ctx.fillText('DREEMURR', 517, 520);
      ctx.textAlign = 'left';

      // boxes by the truck
      rect(ctx, 430, 518, 26, 22, '#a8845c');
      rect(ctx, 434, 522, 18, 14, '#bd986b');
      rect(ctx, 436, 514, 18, 16, '#b08a60');
      rect(ctx, 438, 518, 14, 2, '#8a6a44');

      // fence around the yard
      for (const [fx, fw] of [[58, 74], [190, 76]]) {
        rect(ctx, fx, 576, fw, 3, '#6b4a35');
        rect(ctx, fx, 583, fw, 3, '#6b4a35');
        for (let px = fx; px <= fx + fw; px += 18) {
          rect(ctx, px - 2, 570, 4, 20, '#7a563d');
          ellipse(ctx, px, 570, 4, 1.6, '#eef4fb');
        }
      }
      // mailbox
      rect(ctx, 278, 534, 3, 24, '#4a3528');
      rect(ctx, 268, 520, 22, 14, '#4a5a6a');
      rect(ctx, 268, 520, 22, 4, '#65788a');
      rect(ctx, 284, 524, 3, 8, '#c94f4f');

      // bus stop
      rect(ctx, 246, 398, 3, 34, '#3a3a46');
      rect(ctx, 224, 382, 46, 18, '#2a3448');
      ctx.fillStyle = '#cfe0ee';
      ctx.font = 'bold 7px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BUS', 247, 394);
      ctx.textAlign = 'left';

      // snowy bushes
      for (const [bx, by, bs] of [[420, 480, 1], [666, 470, 0.8], [902, 470, 1.1], [712, 600, 0.9]]) {
        ellipse(ctx, bx, by, 16 * bs, 10 * bs, '#c9d8e8');
        ellipse(ctx, bx, by - 4 * bs, 13 * bs, 8 * bs, '#eef4fb');
        ellipse(ctx, bx + 2 * bs, by - 7 * bs, 6 * bs, 3 * bs, '#f7fbff');
      }

      // welcome sign
      rect(ctx, 246, 566, 3, 26, '#5a4634');
      rect(ctx, 208, 552, 78, 18, '#6f563d');
      rect(ctx, 210, 554, 74, 14, '#d8c9a8');
      ctx.fillStyle = '#43352a';
      ctx.font = 'bold 7px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('OPPIDAN', 247, 564);
      ctx.textAlign = 'left';

      // footprints near spawn
      ctx.fillStyle = 'rgba(160, 178, 200, 0.5)';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(292 + i * 8, 606 - i * 5, 4, 2);
      }
    },
  };
}

function diner(game) {
  const f = game.flags;
  const npcs = [];
  if (f.chrisMet && !f.michMet) {
    npcs.push({
      id: 'chris', x: 466, y: 232, dir: 0, mood: 'happy',
      lines: f.dinerTalked ? DINER_AGAIN : DINER_CHRIS,
      onEnd: (g) => {
        g.flags.dinerTalked = true;
        g.setObjective('Wash up in the back.');
      },
    });
  }

  return {
    id: 'diner', w: 640, h: 360, music: 'diner',
    spawn: { x: 320, y: 318 },
    colliders: [
      { x: 0, y: 0, w: 640, h: 74 },
      { x: 0, y: 0, w: 12, h: 360 },
      { x: 628, y: 0, w: 12, h: 360 },
      { x: 60, y: 118, w: 300, h: 44 },
      { x: 388, y: 118, w: 20, h: 150 },
    ],
    npcs,
    hotspots: [
      { id: 'diner-exit', x: 320, y: 344, r: 22, prompt: 'leave' },
      { id: 'restroom', x: 606, y: 146, r: 40, prompt: 'restroom' },
    ],
    doors: [
      { x: 296, y: 338, w: 48, h: 20, to: 'town', spawn: { x: 450, y: 300 } },
      { x: 596, y: 112, w: 32, h: 66, to: 'bathroom', spawn: { x: 320, y: 318 } },
    ],
    draw(ctx, cam, t) {
      // floor
      ctx.fillStyle = '#8a6a50';
      ctx.fillRect(0, 0, 640, 360);
      for (let y = 74; y < 360; y += 28) {
        for (let x = 0; x < 640; x += 56) {
          const off = (Math.floor(y / 28) % 2) * 28;
          rect(ctx, x + off, y, 54, 26, hash2(x, y) > 0.5 ? '#97745a' : '#8f6d54');
        }
      }
      // checker accent
      for (let i = 0; i < 8; i++) {
        rect(ctx, 20 + i * 76, 260, 38, 38, i % 2 ? '#c8a98c' : '#b8977a');
      }
      // walls
      rect(ctx, 0, 0, 640, 74, '#3b2f3d');
      rect(ctx, 0, 62, 640, 12, '#57445a');
      rect(ctx, 0, 0, 12, 360, '#3b2f3d');
      rect(ctx, 628, 0, 12, 360, '#3b2f3d');
      // wallpaper stripes
      for (let x = 20; x < 640; x += 48) {
        rect(ctx, x, 12, 8, 48, 'rgba(255,255,255,0.035)');
      }
      // counter
      rect(ctx, 60, 118, 300, 44, '#6b4a35');
      rect(ctx, 60, 118, 300, 7, '#c9a271');
      rect(ctx, 60, 152, 300, 10, '#523728');
      // stools
      for (let i = 0; i < 4; i++) {
        const x = 100 + i * 76;
        rect(ctx, x - 2, 176, 4, 18, '#3a3a46');
        ellipse(ctx, x, 174, 12, 4, '#b8474a');
      }
      // counter items
      circle(ctx, 150, 132, 6, '#e8e0d0');
      rect(ctx, 210, 124, 18, 12, '#d8b56a');
      rect(ctx, 300, 128, 24, 8, '#8a4a44');

      // menu board
      rect(ctx, 92, 20, 200, 34, '#1d1a22');
      ctx.fillStyle = '#f0e3c8';
      ctx.font = 'bold 9px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PIE  ·  COCOA  ·  SOUP', 192, 35);
      ctx.font = '6px ui-monospace, monospace';
      ctx.fillStyle = '#b9a98e';
      ctx.fillText('warm things for cold people', 192, 46);
      ctx.textAlign = 'left';

      // restroom door
      rect(ctx, 588, 108, 40, 74, '#2c2433');
      rect(ctx, 592, 112, 32, 66, '#4a3a52');
      rect(ctx, 592, 112, 32, 4, '#6d5776');
      circle(ctx, 616, 146, 2, '#d8b56a');
      ctx.fillStyle = '#e7dcc4';
      ctx.font = 'bold 7px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('RESTROOM', 608, 100);
      ctx.textAlign = 'left';

      // exit door
      rect(ctx, 288, 316, 64, 44, '#2c2433');
      rect(ctx, 292, 320, 56, 40, '#5a4330');
      rect(ctx, 292, 320, 56, 4, '#7a5c42');
      circle(ctx, 340, 340, 2, '#d8b56a');
      // doormat
      rect(ctx, 300, 330, 40, 12, '#7a3f3f');

      // hanging lights
      for (let i = 0; i < 3; i++) {
        const x = 140 + i * 180;
        line(ctx, x, 0, x, 26, '#2a2430', 1);
        circle(ctx, x, 30, 5, '#ffd98a');
        drawGlow(ctx, x, 30, 26, 'rgba(255, 210, 130, 0.18)');
      }
    },
  };
}

function bathroom(game) {
  const f = game.flags;
  const npcs = [];
  if (!f.michMet) {
    npcs.push({
      id: 'mich', x: 196, y: 224, dir: 3, mood: 'normal',
      lines: MICH_SCENE,
      onEnd: (g) => {
        g.flags.michMet = true;
        g.setObjective('Go home. Mom is expecting you.');
        g.world.refresh();
      },
    });
  }

  return {
    id: 'bathroom', w: 640, h: 360, music: 'diner',
    spawn: { x: 320, y: 318 },
    colliders: [
      { x: 0, y: 0, w: 640, h: 82 },
      { x: 0, y: 0, w: 12, h: 360 },
      { x: 628, y: 0, w: 12, h: 360 },
      { x: 56, y: 82, w: 224, h: 38 },
      { x: 430, y: 82, w: 198, h: 226 },
    ],
    npcs,
    hotspots: [
      { id: 'bath-exit', x: 320, y: 344, r: 22, prompt: 'leave' },
    ],
    doors: [
      { x: 296, y: 338, w: 48, h: 20, to: 'diner', spawn: { x: 300, y: 300 } },
    ],
    draw(ctx, cam, t) {
      // tiled floor
      ctx.fillStyle = '#c9d6dd';
      ctx.fillRect(0, 0, 640, 360);
      for (let y = 82; y < 360; y += 24) {
        for (let x = 0; x < 640; x += 24) {
          const h = hash2(x, y);
          rect(ctx, x, y, 23, 23, h > 0.5 ? '#d5e0e6' : '#ccd9e0');
        }
      }
      // wall
      rect(ctx, 0, 0, 640, 82, '#5c7480');
      rect(ctx, 0, 70, 640, 12, '#7f97a1');
      rect(ctx, 0, 0, 12, 360, '#4d626c');
      rect(ctx, 628, 0, 12, 360, '#4d626c');

      // sinks
      rect(ctx, 56, 82, 224, 38, '#b8c6cc');
      rect(ctx, 56, 82, 224, 6, '#e4edf1');
      for (let i = 0; i < 2; i++) {
        const x = 108 + i * 110;
        ellipse(ctx, x, 100, 26, 10, '#eef4f7');
        ellipse(ctx, x, 100, 19, 6, '#a9bcc4');
        rect(ctx, x - 2, 82, 4, 12, '#8d9ba1');
        circle(ctx, x, 96, 2, '#5c6c72');
        // mirror
        rect(ctx, x - 26, 22, 52, 42, '#7f8f98');
        rect(ctx, x - 23, 25, 46, 36, '#aebfc9');
        rect(ctx, x - 18, 28, 12, 26, 'rgba(255,255,255,0.3)');
      }
      // soap
      rect(ctx, 250, 92, 12, 8, '#e8c56a');

      // stalls
      rect(ctx, 430, 82, 198, 226, '#4f6670');
      rect(ctx, 438, 90, 182, 210, '#6d8791');
      for (let i = 0; i < 3; i++) {
        rect(ctx, 442 + i * 60, 94, 54, 200, '#5b747e');
        rect(ctx, 444 + i * 60, 96, 50, 196, '#78929c');
        rect(ctx, 470 + i * 60, 180, 6, 20, '#3e5058');
      }

      // sign
      rect(ctx, 258, 30, 124, 20, '#22303a');
      ctx.fillStyle = '#cfe0e8';
      ctx.font = 'bold 7px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PLEASE DO NOT SCREAM', 320, 43);
      ctx.textAlign = 'left';

      // puddle from the upcoming incident
      ellipse(ctx, 196, 258, 34, 10, 'rgba(150, 190, 210, 0.35)');

      // exit
      rect(ctx, 288, 316, 64, 44, '#2c2433');
      rect(ctx, 292, 320, 56, 40, '#5a4330');
      circle(ctx, 340, 340, 2, '#d8b56a');
      rect(ctx, 300, 330, 40, 12, '#7a3f3f');
    },
  };
}

function room(game) {
  return {
    id: 'room', w: 640, h: 360, music: 'town',
    spawn: { x: 320, y: 322 },
    colliders: [
      { x: 0, y: 0, w: 640, h: 64 },
      { x: 0, y: 0, w: 12, h: 360 },
      { x: 628, y: 0, w: 12, h: 360 },
      { x: 54, y: 176, w: 148, h: 96 },
      { x: 428, y: 150, w: 158, h: 74 },
    ],
    npcs: [],
    hotspots: [
      { id: 'mirror', x: 320, y: 128, r: 46, prompt: 'mirror' },
      { id: 'folder', x: 500, y: 228, r: 36, prompt: 'folder' },
      { id: 'room-exit', x: 320, y: 344, r: 22, prompt: 'leave' },
    ],
    doors: [
      { x: 296, y: 338, w: 48, h: 20, to: 'town', spawn: { x: 160, y: 592 } },
    ],
    draw(ctx, cam, t) {
      // floor
      ctx.fillStyle = '#7d6652';
      ctx.fillRect(0, 0, 640, 360);
      for (let y = 64; y < 360; y += 26) {
        for (let x = 0; x < 640; x += 64) {
          rect(ctx, x + (Math.floor(y / 26) % 2) * 32, y, 62, 24, hash2(x, y) > 0.5 ? '#876e58' : '#816953');
        }
      }
      // rug
      rect(ctx, 220, 200, 200, 92, '#5e4a63');
      rect(ctx, 228, 208, 184, 76, '#6d5776');
      rect(ctx, 244, 222, 152, 48, '#7d6587');
      // walls
      rect(ctx, 0, 0, 640, 64, '#4a3f52');
      rect(ctx, 0, 54, 640, 12, '#645670');
      rect(ctx, 0, 0, 12, 360, '#4a3f52');
      rect(ctx, 628, 0, 12, 360, '#4a3f52');
      // wallpaper
      for (let x = 24; x < 640; x += 40) {
        rect(ctx, x, 10, 6, 44, 'rgba(255,255,255,0.03)');
      }
      // window
      rect(ctx, 80, 20, 78, 34, '#2a2f42');
      rect(ctx, 84, 24, 70, 26, '#8fa8c2');
      rect(ctx, 118, 24, 3, 26, '#2a2f42');
      // bed
      rect(ctx, 54, 176, 148, 96, '#3f3446');
      rect(ctx, 60, 182, 136, 84, '#5b4a63');
      rect(ctx, 60, 182, 136, 26, '#e8e0d0');
      rect(ctx, 68, 188, 44, 14, '#f4eee2');
      rect(ctx, 60, 214, 136, 52, '#7d3f45');
      rect(ctx, 60, 214, 136, 6, '#a3575c');
      // desk
      rect(ctx, 428, 150, 158, 74, '#6b4a35');
      rect(ctx, 428, 150, 158, 8, '#8a6244');
      rect(ctx, 436, 158, 142, 58, '#5a3e2c');
      rect(ctx, 470, 170, 54, 38, '#d8c9a8');
      rect(ctx, 474, 174, 46, 30, '#c9b58f');
      ctx.fillStyle = '#7a5a3a';
      ctx.font = 'bold 5px ui-monospace, monospace';
      ctx.fillText('D.F.S.', 480, 186);
      // chair
      rect(ctx, 400, 196, 26, 8, '#4a3528');
      rect(ctx, 402, 204, 4, 22, '#4a3528');
      rect(ctx, 420, 204, 4, 22, '#4a3528');

      // mirror
      drawMirror(ctx, 274, 78, 92, 86, { cracked: false, t });
      rect(ctx, 262, 164, 116, 5, '#3a2f3d');

      // boxes
      rect(ctx, 570, 200, 40, 34, '#a8845c');
      rect(ctx, 574, 204, 32, 26, '#bd986b');
      rect(ctx, 576, 210, 28, 2, '#8a6a44');
      rect(ctx, 590, 176, 30, 26, '#a8845c');

      // poster
      rect(ctx, 560, 20, 48, 34, '#22303a');
      ctx.fillStyle = '#cfe0e8';
      ctx.font = 'bold 5px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BE', 584, 34);
      ctx.fillText('NICE', 584, 43);
      ctx.textAlign = 'left';

      // door
      rect(ctx, 288, 316, 64, 44, '#2c2433');
      rect(ctx, 292, 320, 56, 40, '#5a4330');
      circle(ctx, 340, 340, 2, '#d8b56a');
    },
  };
}

function novella(game) {
  const f = game.flags;
  const encounters = [];
  if (!f.won1) {
    encounters.push({ id: 'grinling', x: 430, y: 352, key: 'grinling' });
  } else if (!f.won2) {
    encounters.push({ id: 'hush', x: 760, y: 352, key: 'hush' });
  }

  return {
    id: 'novella', w: 1400, h: 420, music: 'novella',
    spawn: { x: 100, y: 352 },
    colliders: [
      { x: 0, y: 0, w: 1400, h: 6 },
      { x: 0, y: 0, w: 6, h: 420 },
      { x: 1394, y: 0, w: 6, h: 420 },
    ],
    npcs: [],
    hotspots: f.won2 ? [
      { id: 'glass-door', x: 1272, y: 340, r: 52, prompt: 'door' },
    ] : [],
    doors: [],
    encounters,
    draw(ctx, cam, t) {
      const px = Math.round(cam.x);
      const horizon = 286;

      // layered pastel sky
      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, '#a9d4ff');
      sky.addColorStop(0.32, '#cfe2ff');
      sky.addColorStop(0.62, '#ffdcef');
      sky.addColorStop(0.86, '#ffe7d2');
      sky.addColorStop(1, '#fff0dc');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 1400, horizon);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(0, 42 + i * 44 + Math.sin(t * 0.35 + i) * 3, 1400, 16);
      }

      // smiling sun, drifting slowly (parallax)
      const sunX = px + 470 - px * 0.12;
      const sunY = 84;
      drawGlow(ctx, sunX, sunY, 150, 'rgba(255, 224, 150, 0.45)');
      drawGlow(ctx, sunX, sunY, 78, 'rgba(255, 246, 205, 0.65)');
      ctx.strokeStyle = 'rgba(255, 225, 145, 0.6)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + t * 0.06;
        const r1 = 50 + Math.sin(t * 1.3 + i) * 2;
        line(ctx, sunX + Math.cos(a) * r1, sunY + Math.sin(a) * r1,
          sunX + Math.cos(a) * (r1 + 9), sunY + Math.sin(a) * (r1 + 9), 'rgba(255, 225, 145, 0.6)', 3);
      }
      circle(ctx, sunX, sunY, 40, '#ffefb0');
      circle(ctx, sunX, sunY, 33, '#ffe88f');
      // face
      ctx.fillStyle = '#c9864f';
      ctx.beginPath();
      ctx.arc(sunX - 12, sunY - 5, 3.2, 0, Math.PI * 2);
      ctx.arc(sunX + 12, sunY - 5, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9864f';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(sunX, sunY + 4, 13, 0.16 * Math.PI, 0.84 * Math.PI);
      ctx.stroke();
      circle(ctx, sunX - 23, sunY + 8, 4.5, 'rgba(255, 160, 150, 0.45)');
      circle(ctx, sunX + 23, sunY + 8, 4.5, 'rgba(255, 160, 150, 0.45)');

      // clouds (parallax + wrap)
      for (const [bx, y, s] of [[80, 62, 1], [330, 104, 1.3], [610, 50, 0.85], [760, 132, 1.05]]) {
        const x = px + ((bx - px * 0.3) % 900 + 900) % 900 - 90;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ellipse(ctx, x, y, 42 * s, 15 * s, 'rgba(255,255,255,0.92)');
        ellipse(ctx, x - 27 * s, y + 5 * s, 25 * s, 11 * s, 'rgba(255,255,255,0.92)');
        ellipse(ctx, x + 29 * s, y + 5 * s, 23 * s, 10 * s, 'rgba(255,255,255,0.92)');
        ellipse(ctx, x, y - 10 * s, 22 * s, 12 * s, 'rgba(255,255,255,0.96)');
        ctx.fillStyle = 'rgba(205, 190, 245, 0.22)';
        ellipse(ctx, x, y + 13 * s, 38 * s, 5 * s, 'rgba(205,190,245,0.22)');
      }

      // rolling hills, three parallax layers
      const hill = (baseY, amp, f, phase, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(px, horizon);
        for (let sx = 0; sx <= VIEW_W + 30; sx += 30) {
          const y = baseY + Math.sin((sx + px * f) * 0.011 + phase) * amp
            + Math.sin((sx + px * f) * 0.027 + phase * 1.7) * amp * 0.32;
          ctx.lineTo(px + sx, y);
        }
        ctx.lineTo(px + VIEW_W, horizon);
        ctx.lineTo(px, horizon);
        ctx.closePath();
        ctx.fill();
      };
      hill(246, 16, 0.14, 0.6, '#e7d6fb');
      hill(263, 13, 0.26, 2.1, '#c9d8ff');
      hill(277, 9, 0.38, 4.2, '#bce8d4');

      // floating islands
      const islands = [[150, 190, 1], [520, 164, 0.85], [820, 212, 1.08]];
      for (const [bx, by, s] of islands) {
        const x = px + ((bx - px * 0.35) % 900 + 900) % 900 - 60;
        const y = by + Math.sin(t * 0.9 + bx) * 7;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s, s);
        // rocky underside
        ctx.fillStyle = 'rgba(196, 166, 236, 0.55)';
        ctx.beginPath();
        ctx.moveTo(-52, 4);
        ctx.quadraticCurveTo(-16, 30, 0, 48);
        ctx.quadraticCurveTo(18, 28, 52, 4);
        ctx.closePath();
        ctx.fill();
        // grass cap
        ctx.fillStyle = '#b9e8d2';
        roundRect(ctx, -56, -14, 112, 24, 12);
        ctx.fill();
        ctx.fillStyle = '#d9f6e8';
        roundRect(ctx, -56, -14, 112, 12, 6);
        ctx.fill();
        // flowers on the island
        for (let i = -2; i <= 2; i++) {
          const fx = i * 20 + 4;
          line(ctx, fx, -6, fx, -16, '#7fbf9d', 2);
          circle(ctx, fx, -18, 4, ['#ff9fbb', '#ffd166', '#a7d8ff', '#c6a7ff', '#ff9fbb'][i + 2]);
          circle(ctx, fx, -18, 1.6, '#fff6d8');
        }
        ctx.restore();
      }

      // ground: mint lip + pastel checkerboard
      ctx.fillStyle = '#c9efdc';
      ctx.fillRect(0, horizon - 4, 1400, 12);
      for (let x = 0; x < 1400; x += 26) {
        circle(ctx, x + 13, horizon - 4, 13, '#c9efdc');
      }
      const tile = 26;
      for (let y = horizon, row = 0; y < 420; y += tile, row++) {
        for (let x = 0, col = 0; x < 1400; x += tile, col++) {
          const even = (row + col) % 2 === 0;
          ctx.fillStyle = even ? '#ffd6e7' : '#ffedf5';
          ctx.fillRect(x, y, tile, Math.min(tile, 420 - y));
          if (even && (row * 7 + col) % 11 === 0) {
            circle(ctx, x + tile / 2, y + tile / 2, 2, 'rgba(255,255,255,0.75)');
          }
        }
      }

      // winding candy path
      ctx.fillStyle = '#fff8e6';
      ctx.fillRect(0, 330, 1400, 56);
      ctx.fillStyle = 'rgba(255, 209, 166, 0.7)';
      ctx.fillRect(0, 330, 1400, 4);
      ctx.fillRect(0, 382, 1400, 4);
      for (let x = 26; x < 1400; x += 74) {
        const y = 356 + Math.sin(x * 0.05) * 3;
        circle(ctx, x, y, 2.2, 'rgba(255, 176, 198, 0.75)');
        circle(ctx, x + 10, y + 8, 1.6, 'rgba(255, 214, 140, 0.8)');
      }

      // candy flowers along the path
      for (const [x, y, c, s] of [
        [220, 330, '#ff9fbb', 1], [500, 326, '#ffd166', 0.85],
        [760, 330, '#a7d8ff', 1.1], [1030, 327, '#c6a7ff', 0.9],
        [1330, 330, '#ffb0c8', 1],
      ]) {
        const sway = Math.sin(t * 1.6 + x * 0.02) * 2;
        line(ctx, x, y, x + sway, y - 26 * s, '#8fbf7a', 2);
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + t * 0.1;
          circle(ctx, x + sway + Math.cos(a) * 6 * s, y - 28 * s + Math.sin(a) * 6 * s, 5 * s, c);
        }
        circle(ctx, x + sway, y - 28 * s, 4 * s, '#fff6d8');
      }

      // drifting confetti
      const confetti = ['#ff9fbb', '#ffd166', '#a7d8ff', '#c6a7ff', '#9fe8c2'];
      for (let i = 0; i < 34; i++) {
        const cx = px + ((i * 137 - t * (12 + (i % 3) * 7)) % 1500 + 1500) % 1500 - 50;
        const cy = (i * 97 + t * (16 + (i % 4) * 5)) % 430 - 20;
        const rot = t * 1.4 + i;
        const c = confetti[i % confetti.length];
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.fillStyle = c;
        ctx.globalAlpha = 0.55 + Math.sin(t * 2 + i) * 0.2;
        ctx.fillRect(-3, -1.5, 6, 3);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // pastel arch around the glass door
      if (f.won2) {
        const dx = 1244;
        const ax = dx + 28;
        const ay = 252;
        drawGlow(ctx, ax, ay + 26, 120, 'rgba(255, 240, 190, 0.4)');
        const archColors = ['#ff9fbb', '#ffc78a', '#ffe28a', '#a7e8bf', '#a7d8ff', '#c6a7ff'];
        for (let i = 0; i < archColors.length; i++) {
          ctx.strokeStyle = archColors[i];
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(ax, ay + 20, 56 - i * 6, Math.PI, Math.PI * 2);
          ctx.stroke();
        }
        // sparkles around the arch
        for (let i = 0; i < 6; i++) {
          const a = Math.PI + (i / 5) * Math.PI;
          const r = 66 + Math.sin(t * 2 + i) * 3;
          const sx = ax + Math.cos(a) * r;
          const sy = ay + 20 + Math.sin(a) * r;
          const tw = 1.5 + Math.sin(t * 4 + i) * 1;
          ctx.strokeStyle = 'rgba(255, 250, 220, 0.9)';
          ctx.lineWidth = 1.5;
          line(ctx, sx - tw, sy, sx + tw, sy, 'rgba(255, 250, 220, 0.9)', 1.5);
          line(ctx, sx, sy - tw, sx, sy + tw, 'rgba(255, 250, 220, 0.9)', 1.5);
        }
        rect(ctx, dx - 6, 244, 68, 120, '#c9a271');
        rect(ctx, dx, 250, 56, 108, '#cfe4f2');
        rect(ctx, dx + 4, 254, 20, 100, 'rgba(255,255,255,0.45)');
        rect(ctx, dx + 28, 254, 4, 100, '#b6cfdd');
        circle(ctx, dx + 44, 310, 2.4, '#8a6a44');
      }

      // shadowlings idle behind the player path
      for (const e of encounters) {
        drawShadowling(ctx, e.id, e.x, e.y, t + e.x);
      }
    },
  };
}

const MAPS = { town, diner, bathroom, room, novella };

// -------------------------------------------------------------------- scene

export class WorldScene {
  constructor(game) {
    this.game = game;
    this.player = { x: 0, y: 0, dir: 0, t: 0, moving: false };
    this.cam = { x: 0, y: 0 };
    this.map = null;
    this.flakes = makeFlakes(70);
    this.doorLock = 0;
    this.auto = null;
    this.prompt = null;
    this.bump = 0;
  }

  enter(mapId = 'town', spawn = null) {
    this.load(mapId, spawn);
    this.doorLock = 0.4;
  }

  load(mapId, spawn = null, keepPos = false) {
    const old = this.player;
    this.map = MAPS[mapId](this.game);
    if (keepPos) {
      this.player.x = old.x;
      this.player.y = old.y;
    } else {
      const sp = spawn || this.map.spawn;
      this.player.x = sp.x;
      this.player.y = sp.y;
    }
    this.player.dir = 0;
    this.doorLock = 0.35;
    this.updateCamera(true);
    audio.playMusic(this.map.music);

    if (mapId === 'room' && !this.game.flags.mirror) {
      this.auto = {
        t: 0.55,
        fn: () => {
          this.game.dialogue.start(ROOM_ENTER, () => {
            this.game.setObjective('Look in the mirror.');
          });
        },
      };
    }
  }

  refresh() {
    this.load(this.map.id, null, true);
  }

  updateCamera(snap = false) {
    const m = this.map;
    let tx = m.w <= VIEW_W ? -(VIEW_W - m.w) / 2 : clamp(this.player.x - VIEW_W / 2, 0, m.w - VIEW_W);
    let ty = m.h <= VIEW_H ? -(VIEW_H - m.h) / 2 : clamp(this.player.y - VIEW_H / 2, 0, m.h - VIEW_H);
    if (snap) {
      this.cam.x = tx;
      this.cam.y = ty;
    } else {
      this.cam.x += (tx - this.cam.x) * 0.18;
      this.cam.y += (ty - this.cam.y) * 0.18;
    }
  }

  update(dt) {
    if (this.game.dialogue.active) {
      this.updateCamera(false);
      return;
    }

    if (this.auto) {
      this.auto.t -= dt;
      if (this.auto.t <= 0) {
        const fn = this.auto.fn;
        this.auto = null;
        fn();
      }
    }

    this.doorLock = Math.max(0, this.doorLock - dt);
    this.player.t += dt;
    this.bump = Math.max(0, this.bump - dt * 3);

    let ax = 0;
    let ay = 0;
    if (input.isDown('left')) ax -= 1;
    if (input.isDown('right')) ax += 1;
    if (input.isDown('up')) ay -= 1;
    if (input.isDown('down')) ay += 1;
    if (ax && ay) {
      ax *= 0.7071;
      ay *= 0.7071;
    }
    this.player.moving = !!(ax || ay);
    if (ax) this.player.dir = ax > 0 ? 2 : 1;
    if (ay) this.player.dir = ay > 0 ? 0 : 3;

    if (this.player.moving) {
      this.move(ax * PLAYER_SPEED * dt, ay * PLAYER_SPEED * dt);
    }

    this.updateCamera(false);

    // doors
    if (this.doorLock <= 0) {
      for (const door of this.map.doors) {
        if (this.inRect(door)) {
          audio.select();
          this.game.enterMap(door.to, door.spawn);
          return;
        }
      }
    }

    // prompts + interaction
    this.prompt = this.nearest();
    if (this.prompt && input.wasPressed('confirm')) {
      this.interact(this.prompt);
      return;
    }

    // novella encounters
    for (const e of this.map.encounters || []) {
      if (Math.abs(this.player.x - e.x) < 26 && Math.abs(this.player.y - e.y) < 60) {
        audio.encounter();
        this.game.shake(6);
        this.game.startBattle(e.key, (result) => this.afterEncounter(e, result));
        return;
      }
    }

    // boss door auto-approach
    if (this.map.id === 'novella' && this.game.flags.won2 && !this.game.flags.bossStarted) {
      if (this.player.x > 1210) {
        this.game.flags.bossStarted = true;
        this.game.dialogue.start(BOSS_INTRO, () => {
          this.game.startBattle('reflection', (result) => this.afterBoss(result));
        });
      }
    }
  }

  collides() {
    const p = this.player;
    const b = { x: p.x - FOOT.w / 2, y: p.y - FOOT.h, w: FOOT.w, h: FOOT.h };
    return this.map.colliders.some((c) =>
      b.x < c.x + c.w && b.x + b.w > c.x && b.y < c.y + c.h && b.y + b.h > c.y);
  }

  move(dx, dy) {
    const p = this.player;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 2));
    const sx = dx / steps;
    const sy = dy / steps;
    for (let i = 0; i < steps; i++) {
      const ox = p.x;
      p.x = clamp(p.x + sx, 14, this.map.w - 14);
      if (this.collides()) p.x = ox;

      const oy = p.y;
      p.y = clamp(p.y + sy, 22, this.map.h - 10);
      if (this.collides()) p.y = oy;
    }
  }

  inRect(r) {
    const p = this.player;
    return p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h;
  }

  nearest() {
    const p = this.player;
    let best = null;
    let bd = Infinity;
    for (const npc of this.map.npcs) {
      const d = dist(p.x, p.y, npc.x, npc.y);
      if (d < 54 && d < bd) {
        bd = d;
        best = { type: 'npc', data: npc, x: npc.x, y: npc.y };
      }
    }
    for (const h of this.map.hotspots) {
      const d = dist(p.x, p.y, h.x, h.y);
      if (d < h.r && d < bd) {
        bd = d;
        best = { type: 'hotspot', data: h, x: h.x, y: h.y };
      }
    }
    return best;
  }

  interact(target) {
    const g = this.game;
    if (target.type === 'npc') {
      const npc = target.data;
      audio.select();
      g.dialogue.start(npc.lines, () => {
        if (npc.onEnd) npc.onEnd(g);
      });
      return;
    }
    const h = target.data;
    audio.select();
    switch (h.id) {
      case 'restroom':
        g.enterMap('bathroom', { x: 320, y: 318 });
        break;
      case 'diner-exit':
        g.enterMap('town', { x: 450, y: 300 });
        break;
      case 'bath-exit':
        g.enterMap('diner', { x: 300, y: 300 });
        break;
      case 'room-exit':
        g.enterMap('town', { x: 160, y: 592 });
        break;
      case 'mirror':
        g.dialogue.start(MIRROR, () => this.smashMirror());
        break;
      case 'folder':
        g.dialogue.start(FOLDER);
        break;
      case 'glass-door':
        if (g.flags.bossStarted) break;
        g.flags.bossStarted = true;
        g.dialogue.start(BOSS_INTRO, () => {
          g.startBattle('reflection', (result) => this.afterBoss(result));
        });
        break;
      default:
        break;
    }
  }

  smashMirror() {
    const g = this.game;
    g.flags.mirror = true;
    audio.smash();
    g.shake(18);
    g.flash('#ffffff', 0.9);
    g.dialogue.start([
      { who: null, text: 'The glass does not fall.' },
      { who: null, text: 'You do.' },
    ], () => {
      g.fadeTo(() => {
        g.enterMap('novella', { x: 100, y: 352 });
        g.setObjective('Find a way out of the Novella.');
        setTimeout(() => {
          g.dialogue.start(NOVELLA_INTRO);
        }, 300);
      });
    });
  }

  afterEncounter(e, result) {
    const g = this.game;
    if (e.id === 'grinling') {
      g.flags.won1 = true;
      g.setObjective('Keep walking. The light is getting louder.');
      g.dialogue.start(AFTER_FIRST);
    } else if (e.id === 'hush') {
      g.flags.won2 = true;
      g.setObjective('Face the door.');
      g.dialogue.start(AFTER_SECOND);
    }
    g.world.refresh();
  }

  afterBoss(result) {
    const g = this.game;
    g.flags.bossDone = true;
    const lines = result === 'spare'
      ? [
          { who: 'reflection', text: "...you're not going to fight me?" },
          { who: 'srif', text: 'No.' },
          { who: 'reflection', text: 'then what are you going to do?' },
          { who: 'srif', text: 'Walk through you.' },
          { who: null, text: 'The reflection cracks. Not like glass. Like ice in spring.' },
        ]
      : [
          { who: null, text: 'The reflection comes apart in your hands.' },
          { who: null, text: 'For a moment the face is yours again. Small. Seventeen. Tired.' },
          { who: 'srif', text: "(I'm sorry.)" },
          { who: 'srif', text: '(I keep saying that.)' },
        ];
    g.dialogue.start(lines, () => g.showEnding(result));
  }

  onTap() {
    if (this.game.dialogue.active) this.game.dialogue.advance();
  }

  draw(ctx) {
    const m = this.map;
    const t = performance.now() / 1000;
    ctx.save();
    ctx.translate(-Math.round(this.cam.x), -Math.round(this.cam.y));
    m.draw(ctx, this.cam, t);

    // depth-sorted actors
    const actors = [];
    for (const npc of m.npcs) {
      actors.push({
        y: npc.y,
        draw: () => {
          drawChar(ctx, npc.id, npc.x, npc.y, npc.dir, t + npc.x, false, npc.mood);
        },
      });
    }
    for (const e of m.encounters || []) {
      actors.push({
        y: e.y,
        draw: () => drawShadowling(ctx, e.id, e.x, e.y, t + e.x),
      });
    }
    actors.push({
      y: this.player.y,
      draw: () => drawChar(ctx, 'srif', this.player.x, this.player.y, this.player.dir, this.player.t, this.player.moving),
    });
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) a.draw();

    // interaction prompt
    if (this.prompt) {
      const bob = Math.sin(t * 5) * 2;
      const px = this.prompt.x;
      const py = this.prompt.y - 64 + bob;
      ctx.fillStyle = 'rgba(10, 13, 24, 0.88)';
      roundRect(ctx, px - 12, py - 10, 24, 20, 5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.7)';
      ctx.lineWidth = 1;
      roundRect(ctx, px - 11.5, py - 9.5, 23, 19, 5);
      ctx.stroke();
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 11px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.prompt.type === 'npc' ? '!' : '·', px, py + 0.5);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();

    // snow / petals
    if (m.id === 'town') {
      ctx.save();
      drawSnowfall(ctx, this.flakes, 1 / 60, VIEW_W, VIEW_H);
      ctx.restore();
    } else if (m.id === 'novella') {
      ctx.save();
      for (const f of this.flakes) {
        f.y += f.vy * 0.6 * (1 / 60);
        f.x += Math.sin(f.t + f.y * 0.02) * 6 * (1 / 60);
        f.t += 0.016;
        if (f.y > VIEW_H) { f.y = -4; f.x = Math.random() * VIEW_W; }
        ctx.fillStyle = `rgba(255, 255, 255, ${f.a * 0.8})`;
        ctx.fillRect(f.x, f.y, 2, 2);
      }
      ctx.restore();
    }

    // vignette
    const v = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.78);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(4, 6, 14, 0.35)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}
