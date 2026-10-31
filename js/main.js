// Boot, scene management, title screen, ending, and the main loop.
import { VIEW_W, VIEW_H, input, fitCanvas, bindTouch, clamp, roundRect, wrapLines } from './engine.js';
import { audio } from './audio.js';
import { Dialogue } from './dialogue.js';
import { WorldScene } from './world.js';
import { BattleScene } from './battle.js';
import { drawPortrait, drawSnowfall, makeFlakes, drawGlow, drawMirror, circle, rect, ellipse, poly, line } from './art.js';
import { ENDING, INTRO } from './story.js';

function makeParty() {
  return [
    { id: 'srif', name: 'SRIF', hp: 40, maxhp: 40, atk: 9, def: 1, spell: { name: 'Quiet', cost: 25, kind: 'quiet' } },
    { id: 'chris', name: 'CHRIS', hp: 34, maxhp: 34, atk: 7, def: 1, spell: { name: 'Heal Prayer', cost: 30, kind: 'heal' } },
    { id: 'mich', name: 'MICH', hp: 48, maxhp: 48, atk: 11, def: 2, spell: { name: 'Roar', cost: 20, kind: 'roar' } },
  ];
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.dialogue = new Dialogue(this);
    this.flags = {};
    this.items = { pie: 2, tea: 2 };
    this.tp = 40;
    this.party = makeParty();
    this.objective = '';
    this.objectiveT = 0;
    this.fade = 0;
    this.fadeDir = 0;
    this.fadeCb = null;
    this.shakeAmt = 0;
    this.flashAmt = 0;
    this.flashColor = '#ffffff';
    this.help = false;
    this.scene = null;
    this.world = null;
    this.muted = false;
    this.time = 0;
  }

  setScene(scene, enter = true) {
    this.scene = scene;
    if (enter && scene.enter) scene.enter();
  }

  newGame() {
    this.flags = {};
    this.items = { pie: 2, tea: 2 };
    this.tp = 40;
    this.party = makeParty();
    this.objective = '';
    this.objectiveT = 0;
    const world = new WorldScene(this);
    this.world = world;
    this.setScene(world, false);
    world.enter('town');
    this.dialogue.start(INTRO, () => this.setObjective('Find Chris near the Holiday house.'));
  }

  enterMap(id, spawn) {
    this.world.load(id, spawn);
  }

  startBattle(key, onWin) {
    if (this.fadeDir !== 0) return;
    this.fadeTo(() => {
      this.setScene(new BattleScene(this, key, onWin));
    });
  }

  setObjective(text) {
    this.objective = text;
    this.objectiveT = 2.6;
  }

  fadeTo(cb) {
    if (this.fadeDir !== 0) return false;
    this.fadeDir = 1;
    this.fadeCb = cb;
    return true;
  }

  shake(n) {
    this.shakeAmt = Math.max(this.shakeAmt, n);
  }

  flash(color = '#ffffff', a = 0.6) {
    this.flashColor = color;
    this.flashAmt = Math.max(this.flashAmt, a);
  }

  showEnding(result) {
    this.fadeTo(() => this.setScene(new EndingScene(this, result)));
  }

  toTitle() {
    this.fadeTo(() => this.setScene(new TitleScene(this)));
  }

  begin() {
    audio.ensure();
    audio.playMusic('title');
    this.fadeTo(() => this.newGame());
  }

  onTap() {
    audio.ensure();
    if (this.dialogue.active) {
      this.dialogue.advance();
      return;
    }
    if (this.scene && this.scene.onTap) this.scene.onTap();
  }

  toggleMute() {
    this.muted = !this.muted;
    audio.setMuted(this.muted);
    const btn = document.getElementById('mute');
    if (btn) {
      btn.classList.toggle('muted', this.muted);
      btn.textContent = this.muted ? '×' : '♪';
    }
  }

  update(dt) {
    this.time += dt;
    if (input.wasPressed('mute')) this.toggleMute();
    if (input.wasPressed('help')) this.help = !this.help;

    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 30);
    this.flashAmt = Math.max(0, this.flashAmt - dt * 2.2);
    this.objectiveT = Math.max(0, this.objectiveT - dt);

    if (this.dialogue.active) {
      this.dialogue.update(dt);
      if (input.wasPressed('confirm')) this.dialogue.advance();
    } else if (this.scene) {
      this.scene.update(dt);
    }

    if (this.fadeDir === 1) {
      this.fade = Math.min(1, this.fade + dt * 2.4);
      if (this.fade >= 1) {
        const cb = this.fadeCb;
        this.fadeCb = null;
        this.fadeDir = -1;
        if (cb) cb();
      }
    } else if (this.fadeDir === -1) {
      this.fade = Math.max(0, this.fade - dt * 1.8);
      if (this.fade <= 0) this.fadeDir = 0;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VIEW_W, VIEW_H);
    ctx.clip();
    if (this.shakeAmt > 0.2) {
      ctx.translate((Math.random() * 2 - 1) * this.shakeAmt, (Math.random() * 2 - 1) * this.shakeAmt);
    }
    if (this.scene) this.scene.draw(ctx);
    ctx.restore();

    if (this.scene instanceof WorldScene) {
      this.drawObjective(ctx);
    }
    this.dialogue.draw(ctx);

    if (this.help) this.drawHelp(ctx);

    if (this.flashAmt > 0) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = clamp(this.flashAmt, 0, 0.95);
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.globalAlpha = 1;
    }

    if (this.fade > 0) {
      ctx.fillStyle = '#04050a';
      ctx.globalAlpha = clamp(this.fade, 0, 1);
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.globalAlpha = 1;
    }
  }

  drawObjective(ctx) {
    if (!this.objective) return;
    ctx.save();
    ctx.font = '10px ui-monospace, monospace';
    const w = Math.min(300, ctx.measureText(this.objective).width + 34);
    const pulse = this.objectiveT > 0 ? 0.5 + Math.sin(this.time * 8) * 0.4 : 0.25;
    ctx.fillStyle = 'rgba(9, 13, 24, 0.62)';
    roundRect(ctx, 14, 12, w, 22, 11);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 209, 102, ${0.18 + pulse * 0.35})`;
    ctx.lineWidth = 1;
    roundRect(ctx, 14.5, 12.5, w - 1, 21, 11);
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(27, 23, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(238, 244, 255, 0.92)';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.objective, 37, 23.5);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  drawHelp(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(4, 6, 12, 0.82)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#f2f6ff';
    ctx.font = 'bold 18px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HOW TO PLAY', 320, 80);
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(220, 230, 250, 0.8)';
    const rows = [
      'MOVE        arrow keys / WASD / on-screen pad',
      'CONFIRM     Z / Enter / A button',
      'CANCEL      X / Shift / B button',
      'MUTE        M          HELP  H',
      '',
      'In battle: pick FIGHT to strike, ACT to build mercy,',
      'SPARE when the mercy bar is full, or DEFEND for TP.',
      'When the box closes in, move the heart and dodge.',
      '',
      'Press H or tap to close.',
    ];
    let y = 116;
    for (const r of rows) {
      ctx.fillText(r, 320, y);
      y += 17;
    }
    ctx.textAlign = 'left';
    ctx.restore();
  }
}

// ------------------------------------------------------------------- title

class TitleScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.flakes = makeFlakes(90);
    this.started = false;
  }

  enter() {
    this.t = 0;
    audio.playMusic('title');
  }

  update(dt) {
    this.t += dt;
    if (!this.started && input.anyPressed) {
      this.started = true;
      audio.ensure();
      audio.playMusic('title');
    }
    if (input.wasPressed('confirm')) this.game.begin();
  }

  onTap() {
    this.game.begin();
  }

  draw(ctx) {
    const t = this.t;
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, '#080d1a');
    g.addColorStop(0.55, '#16233b');
    g.addColorStop(1, '#2c3a54');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // stars
    for (let i = 0; i < 50; i++) {
      const x = (i * 137.5) % VIEW_W;
      const y = (i * 71.3) % 190;
      const a = 0.15 + (Math.sin(t * 1.4 + i) * 0.5 + 0.5) * 0.5;
      ctx.fillStyle = `rgba(230, 240, 255, ${a})`;
      ctx.fillRect(x, y, 1.4, 1.4);
    }

    // distant town
    ctx.fillStyle = '#0b1220';
    for (let i = 0; i < 9; i++) {
      const w = 52 + (i % 3) * 22;
      const h = 34 + ((i * 37) % 46);
      const x = i * 78 - 14;
      ctx.fillRect(x, 262 - h, w, h + 40);
      ctx.fillStyle = '#ffcf7a';
      for (let k = 0; k < 2; k++) {
        if ((i + k) % 3 === 0) continue;
        ctx.fillRect(x + 12 + k * 20, 262 - h + 14, 6, 7);
      }
      ctx.fillStyle = '#0b1220';
    }
    ctx.fillStyle = '#0d1422';
    ctx.fillRect(0, 286, VIEW_W, VIEW_H - 286);

    // snow ground
    const gg = ctx.createLinearGradient(0, 286, 0, VIEW_H);
    gg.addColorStop(0, '#2b3a54');
    gg.addColorStop(1, '#121a2a');
    ctx.fillStyle = gg;
    ctx.fillRect(0, 286, VIEW_W, VIEW_H - 286);

    // mirror monument
    const mx = 320;
    const my = 208;
    drawGlow(ctx, mx, my, 110, 'rgba(150, 190, 255, 0.1)');
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(-0.04);
    drawMirror(ctx, -62, -52, 124, 104, { cracked: true, t });
    // faint face
    ctx.globalAlpha = 0.26 + Math.sin(t * 1.7) * 0.08;
    ellipse(ctx, 0, -6, 21, 26, '#0b0a12');
    ctx.fillStyle = '#ff5a6e';
    ctx.globalAlpha = 0.5 + Math.sin(t * 2.3) * 0.3;
    ctx.fillRect(-12, -14, 4, 3);
    ctx.fillRect(8, -14, 4, 3);
    ctx.globalAlpha = 1;
    ctx.restore();

    // title
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '900 58px ui-monospace, "Arial Black", sans-serif';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
    ctx.fillStyle = 'rgba(255, 80, 110, 0.35)';
    ctx.fillText('RATLEDUNE', 322, 106);
    ctx.fillStyle = 'rgba(120, 220, 255, 0.35)';
    ctx.fillText('RATLEDUNE', 318, 106);
    ctx.fillStyle = '#f6f0e2';
    ctx.fillText('RATLEDUNE', 320, 104);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.font = 'bold 11px ui-monospace, monospace';
    ctx.fillStyle = '#ffd166';
    ctx.fillText('CHAPTER 1  ·  THE BOY IN THE GLASS', 320, 132);
    ctx.restore();

    // start
    const a = 0.55 + Math.sin(t * 3.2) * 0.35;
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px ui-monospace, monospace';
    ctx.fillStyle = `rgba(240, 246, 255, ${a})`;
    ctx.fillText('PRESS Z  /  TAP TO BEGIN', 320, 292);

    ctx.font = '9px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(220, 232, 255, 0.45)';
    ctx.fillText('ARROWS / WASD move   ·   Z confirm   ·   X cancel   ·   M mute', 320, 330);
    ctx.fillStyle = 'rgba(220, 232, 255, 0.28)';
    ctx.fillText('A fan chapter inspired by Deltarune. Contains themes of self-image and self-hatred.', 320, 346);

    drawSnowfall(ctx, this.flakes, 1 / 60, VIEW_W, VIEW_H);
    ctx.textAlign = 'left';

    // vignette
    const v = ctx.createRadialGradient(320, 180, 120, 320, 180, 400);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(2, 4, 10, 0.6)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

// ------------------------------------------------------------------ ending

class EndingScene {
  constructor(game, result) {
    this.game = game;
    this.result = result;
    this.idx = 0;
    this.chars = 0;
    this.card = false;
    this.t = 0;
    this.flakes = makeFlakes(50);
  }

  enter() {
    audio.playMusic('title');
  }

  get line() {
    return ENDING[this.idx];
  }

  update(dt) {
    this.t += dt;
    if (this.card) {
      if (input.wasPressed('confirm')) this.game.toTitle();
      return;
    }
    const line = this.line;
    if (!line) {
      this.card = true;
      return;
    }
    if (this.chars < line.text.length) {
      this.chars = Math.min(line.text.length, this.chars + dt * 45);
      if (input.wasPressed('confirm')) this.chars = line.text.length;
    } else if (input.wasPressed('confirm')) {
      this.idx++;
      this.chars = 0;
      if (this.idx >= ENDING.length) this.card = true;
    }
  }

  onTap() {
    if (this.card) {
      this.game.toTitle();
      return;
    }
    const line = this.line;
    if (!line) {
      this.card = true;
      return;
    }
    if (this.chars < line.text.length) this.chars = line.text.length;
    else {
      this.idx++;
      this.chars = 0;
      if (this.idx >= ENDING.length) this.card = true;
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#05060b';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    for (let i = 0; i < 30; i++) {
      const x = (i * 127 + this.t * 8) % VIEW_W;
      const y = (i * 61 + this.t * 14) % VIEW_H;
      ctx.fillStyle = `rgba(190, 205, 235, ${0.05 + (i % 5) * 0.02})`;
      ctx.fillRect(x, y, 2, 2);
    }

    if (!this.card) {
      const line = this.line;
      if (!line) return;
      ctx.font = line.who ? '13px ui-monospace, monospace' : 'italic 13px ui-monospace, monospace';
      const shown = line.text.slice(0, Math.floor(this.chars));
      const lines = wrapLines(ctx, shown, 460);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (line.who) {
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 10px ui-monospace, monospace';
        ctx.fillText(line.who.toUpperCase(), 320, 150);
      }
      ctx.font = line.who ? '13px ui-monospace, monospace' : 'italic 13px ui-monospace, monospace';
      ctx.fillStyle = line.who ? '#eef4ff' : 'rgba(200, 212, 234, 0.85)';
      let y = 180 - (lines.length - 1) * 10;
      for (const l of lines) {
        ctx.fillText(l, 320, y);
        y += 22;
      }
      const a = 0.4 + Math.sin(this.t * 3) * 0.3;
      ctx.fillStyle = `rgba(255, 209, 102, ${a})`;
      ctx.font = '9px ui-monospace, monospace';
      ctx.fillText('Z / TAP', 320, 318);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      return;
    }

    // card
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f6f0e2';
    ctx.font = '900 34px ui-monospace, monospace';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
    ctx.fillText('RATLEDUNE', 320, 108);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.font = 'bold 10px ui-monospace, monospace';
    ctx.fillStyle = '#ffd166';
    ctx.fillText('CHAPTER 1  ·  THE BOY IN THE GLASS', 320, 130);

    ctx.font = '11px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(220, 230, 250, 0.75)';
    const rows = this.result === 'spare'
      ? [
          'You walked through the reflection instead of breaking it.',
          'The Novella will remember that.',
        ]
      : [
          'You broke the reflection. It did not feel like winning.',
          'The Novella will remember that too.',
        ];
    let y = 176;
    for (const r of rows) {
      ctx.fillText(r, 320, y);
      y += 19;
    }

    ctx.font = '9px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(200, 212, 234, 0.4)';
    ctx.fillText('TO BE CONTINUED', 320, 236);

    const a = 0.45 + Math.sin(this.t * 3) * 0.3;
    ctx.fillStyle = `rgba(255, 209, 102, ${a})`;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText('PRESS Z / TAP TO RETURN TO THE TITLE', 320, 302);

    ctx.fillStyle = 'rgba(200, 212, 234, 0.25)';
    ctx.font = '8px ui-monospace, monospace';
    ctx.fillText('written for the OMGithub playground · a fan work, not affiliated with Toby Fox', 320, 336);
    ctx.textAlign = 'left';
  }
}

// -------------------------------------------------------------------- boot

const canvas = document.getElementById('game');
const view = fitCanvas(canvas);
const ctx = view.ctx;
const game = new Game(canvas);

const isTouch = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
if (isTouch) {
  document.body.classList.add('touch');
  document.getElementById('touch').classList.add('enabled');
}
bindTouch(document);

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  audio.ensure();
  game.onTap();
});

document.getElementById('mute').addEventListener('click', (e) => {
  e.stopPropagation();
  game.toggleMute();
});

addEventListener('pointerdown', () => audio.ensure(), { once: true });
addEventListener('keydown', () => audio.ensure(), { once: true });

game.setScene(new TitleScene(game));

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;

  game.update(dt);

  // clear the full backing store, then draw in 640x360 logical space
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#04060b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  view.apply();
  game.draw(ctx);

  input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// expose for quick debugging / screenshots
window.__ratledune = { game, input };
