// Typewriter dialogue boxes with portraits, used by both the overworld and battle scenes.
import { wrapLines, roundRect } from './engine.js';
import { drawPortrait } from './art.js';
import { audio } from './audio.js';

const NAMES = {
  srif: { name: 'SRIF', color: '#ffd8a8' },
  chris: { name: 'CHRIS', color: '#9fe0a8' },
  mich: { name: 'MICH', color: '#ffb066' },
  asgore: { name: 'ASGORE', color: '#ffe08a' },
  toriel: { name: 'TORIEL', color: '#d7b6e8' },
  sans: { name: 'SANS', color: '#c8d4ff' },
  reflection: { name: '???', color: '#cfc0ff' },
};

export class Dialogue {
  constructor(game) {
    this.game = game;
    this.lines = [];
    this.idx = 0;
    this.chars = 0;
    this.active = false;
    this.onDone = null;
    this.blipTimer = 0;
    this.boxIn = 0;
  }

  start(lines, onDone = null) {
    this.lines = lines.filter(Boolean);
    this.idx = 0;
    this.chars = 0;
    this.active = this.lines.length > 0;
    this.onDone = onDone;
    this.boxIn = 0;
    if (this.active) this.line = this.lines[0];
  }

  get current() {
    return this.lines[this.idx] || null;
  }

  update(dt) {
    if (!this.active) return;
    this.boxIn = Math.min(1, this.boxIn + dt * 6);
    const line = this.current;
    if (!line) return;
    const full = line.text.length;
    if (this.chars < full) {
      this.chars = Math.min(full, this.chars + dt * 62);
      this.blipTimer += dt;
      if (this.blipTimer > 0.055) {
        this.blipTimer = 0;
        if (line.text[Math.floor(this.chars)] !== ' ') audio.blip();
      }
    }
  }

  advance() {
    if (!this.active) return;
    const line = this.current;
    if (!line) return;
    if (this.chars < line.text.length) {
      this.chars = line.text.length;
      return;
    }
    this.idx++;
    this.chars = 0;
    if (this.idx >= this.lines.length) {
      this.active = false;
      const done = this.onDone;
      this.onDone = null;
      this.lines = [];
      if (done) done();
    } else {
      audio.move();
    }
  }

  draw(ctx) {
    if (!this.active) return;
    const line = this.current;
    if (!line) return;

    const ease = 1 - Math.pow(1 - this.boxIn, 3);
    const bx = 20;
    const by = 250 + (1 - ease) * 14;
    const bw = 600;
    const bh = 94;

    ctx.save();
    ctx.globalAlpha = ease;

    // shadow + panel
    ctx.fillStyle = 'rgba(6, 8, 16, 0.55)';
    roundRect(ctx, bx + 3, by + 4, bw, bh, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(12, 15, 28, 0.94)';
    roundRect(ctx, bx, by, bw, bh, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(214, 228, 255, 0.55)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx + 0.5, by + 0.5, bw - 1, bh - 1, 8);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    roundRect(ctx, bx + 4.5, by + 4.5, bw - 9, bh - 9, 5);
    ctx.stroke();

    const isNarration = !line.who;
    let textX = bx + 20;
    let textW = bw - 40;

    if (!isNarration) {
      const meta = NAMES[line.who] || { name: String(line.who).toUpperCase(), color: '#ffffff' };
      // portrait frame
      const px = bx + 14;
      const py = by + 15;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(px - 2, py - 2, 68, 68);
      drawPortrait(ctx, line.who, px, py, 64, line.mood || 'normal');
      ctx.strokeStyle = 'rgba(220, 232, 255, 0.25)';
      ctx.strokeRect(px - 2.5, py - 2.5, 69, 69);

      // name plate
      ctx.font = 'bold 10px ui-monospace, monospace';
      const nameW = ctx.measureText(meta.name).width + 20;
      ctx.fillStyle = 'rgba(8, 10, 20, 0.95)';
      roundRect(ctx, bx + 88, by - 12, nameW, 20, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(214, 228, 255, 0.35)';
      ctx.lineWidth = 1;
      roundRect(ctx, bx + 88.5, by - 11.5, nameW - 1, 19, 4);
      ctx.stroke();
      ctx.fillStyle = meta.color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(meta.name, bx + 98, by - 1.5);

      textX = bx + 96;
      textW = bw - 116;
    } else {
      // narration marker
      ctx.fillStyle = 'rgba(160, 178, 210, 0.5)';
      ctx.fillRect(bx + 16, by + 18, 3, bh - 36);
    }

    ctx.font = isNarration ? 'italic 12px ui-monospace, monospace' : '12.5px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const shown = line.text.slice(0, Math.floor(this.chars));
    const lines = wrapLines(ctx, shown, textW);
    ctx.fillStyle = isNarration ? 'rgba(190, 204, 228, 0.9)' : '#f2f6ff';
    let ty = by + 20;
    for (const l of lines) {
      ctx.fillText(l, textX, ty);
      ty += 17;
    }

    // advance caret
    if (this.chars >= line.text.length) {
      const bob = Math.sin(performance.now() / 240) * 1.5;
      ctx.fillStyle = 'rgba(255, 209, 102, 0.9)';
      const ax = bx + bw - 24;
      const ay = by + bh - 20 + bob;
      ctx.beginPath();
      ctx.moveTo(ax - 5, ay - 4);
      ctx.lineTo(ax + 5, ay - 4);
      ctx.lineTo(ax, ay + 4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}
