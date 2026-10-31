import { SPEAKER, clamp } from "./constants.js";
import { drawText, paginate, measure } from "./text.js";
import { drawPortrait } from "./sprites.js";

const BOX = { x: 18, y: 184, w: 444, h: 74 };
const TEXT_X = 92;
const TEXT_W = 356;
const FONT = '17px "VT323", monospace';
const LINE_H = 17;

const SPEAKER_PITCH = {
  srif: 660,
  chris: 760,
  mich: 540,
  asgore: 430,
  toriel: 610,
  narrator: 500,
  reflection: 380,
  echo: 340,
};

function cutRect(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x + 3, y);
  ctx.lineTo(x + w - 3, y);
  ctx.lineTo(x + w, y + 3);
  ctx.lineTo(x + w, y + h - 3);
  ctx.lineTo(x + w - 3, y + h);
  ctx.lineTo(x + 3, y + h);
  ctx.lineTo(x, y + h - 3);
  ctx.lineTo(x, y + 3);
  ctx.closePath();
}

export class Dialogue {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.pages = [];
    this.pageIndex = 0;
    this.chars = 0;
    this.done = false;
    this.speaker = "narrator";
    this.emotion = "neutral";
    this.resolve = null;
    this.choosing = false;
    this.options = [];
    this.index = 0;
    this.choiceResolve = null;
    this.choiceRects = [];
    this.time = 0;
    this.blipCounter = 0;
    this.lastAdvance = 0;
    this.inputLock = 0;
  }

  show(speaker, text, opts = {}) {
    if (this.resolve) {
      const old = this.resolve;
      this.resolve = null;
      old();
    }
    this.speaker = SPEAKER[speaker] ? speaker : "narrator";
    this.emotion = opts.emotion || "neutral";
    this.active = true;
    this.choosing = false;
    this.pageIndex = 0;
    this.chars = 0;
    this.done = false;
    this.time = 0;
    this.inputLock = 0.2;
    const prefix = this.speaker === "narrator" ? "" : "* ";
    const full = prefix + text;
    this.pages = paginate(this.game.ctx, full, TEXT_W, FONT, 3);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  choose(options, opts = {}) {
    this.active = true;
    this.choosing = true;
    this.options = options.map((option) => (typeof option === "string" ? { label: option } : option));
    this.index = 0;
    this.choiceRects = [];
    this.inputLock = 0.16;
    return new Promise((resolve) => {
      this.choiceResolve = resolve;
    });
  }

  update(dt) {
    if (!this.active) return;
    this.time += dt;
    if (this.inputLock > 0) {
      this.inputLock = Math.max(0, this.inputLock - dt);
      if (this.choosing) this._updateChoice(true);
      else this._updateTyping(dt);
      return;
    }

    if (this.choosing) {
      this._updateChoice();
      return;
    }

    this._updateTyping(dt);

    const tap = this.game.input.consumeTap();
    const confirm = this.game.input.justPressed("confirm");
    if (tap || confirm) {
      const now = performance.now();
      if (now - this.lastAdvance < 90) return;
      this.lastAdvance = now;
      this.advance();
    }
  }

  _updateTyping(dt) {
    const page = this.pages[this.pageIndex] || "";
    if (!this.done) {
      const before = Math.floor(this.chars);
      this.chars = Math.min(page.length, this.chars + dt * 48);
      const after = Math.floor(this.chars);
      if (after > before) {
        this.blipCounter += after - before;
        if (this.blipCounter > 2) {
          this.blipCounter = 0;
          this.game.audio.blip(SPEAKER_PITCH[this.speaker] || 600, 0.012);
        }
      }
      if (this.chars >= page.length) this.done = true;
    }
  }

  advance() {
    if (!this.active || this.choosing) return;
    const page = this.pages[this.pageIndex] || "";
    if (!this.done) {
      this.chars = page.length;
      this.done = true;
      this.game.audio.sfx("select");
      return;
    }
    if (this.pageIndex < this.pages.length - 1) {
      this.pageIndex += 1;
      this.chars = 0;
      this.done = false;
      this.game.audio.sfx("select");
      return;
    }
    this.close();
  }

  close() {
    this.active = false;
    this.choosing = false;
    const resolve = this.resolve;
    this.resolve = null;
    if (resolve) resolve();
  }

  _updateChoice(locked = false) {
    if (locked) return;
    const input = this.game.input;
    const tap = input.consumeTap();
    if (tap) {
      for (const rect of this.choiceRects) {
        if (tap.x >= rect.x && tap.x <= rect.x + rect.w && tap.y >= rect.y && tap.y <= rect.y + rect.h) {
          this.index = rect.index;
          this._confirmChoice();
          return;
        }
      }
    }
    if (input.justPressed("up")) {
      this.index = (this.index - 1 + this.options.length) % this.options.length;
      this.game.audio.sfx("select");
    }
    if (input.justPressed("down")) {
      this.index = (this.index + 1) % this.options.length;
      this.game.audio.sfx("select");
    }
    if (input.justPressed("confirm")) {
      this._confirmChoice();
    }
  }

  _confirmChoice() {
    const index = this.index;
    const resolve = this.choiceResolve;
    this.choiceResolve = null;
    this.choosing = false;
    this.active = false;
    this.game.audio.sfx("confirm");
    if (resolve) resolve(index);
  }

  draw(ctx) {
    if (!this.active) return;
    const sp = SPEAKER[this.speaker] || SPEAKER.narrator;

    if (this.choosing) this._drawChoices(ctx);

    // box shadow
    ctx.save();
    ctx.globalAlpha = 0.4;
    cutRect(ctx, BOX.x + 4, BOX.y + 5, BOX.w, BOX.h);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();

    // box
    cutRect(ctx, BOX.x, BOX.y, BOX.w, BOX.h);
    const grad = ctx.createLinearGradient(0, BOX.y, 0, BOX.y + BOX.h);
    grad.addColorStop(0, "rgba(13, 21, 46, 0.97)");
    grad.addColorStop(1, "rgba(6, 10, 24, 0.98)");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "#d9e6ff";
    ctx.lineWidth = 2;
    ctx.stroke();
    cutRect(ctx, BOX.x + 4, BOX.y + 4, BOX.w - 8, BOX.h - 8);
    ctx.strokeStyle = "rgba(120, 150, 210, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // name tag
    if (sp.name) {
      const nameW = Math.max(44, measure(ctx, sp.name, '8px "Press Start 2P", monospace') + 16);
      ctx.fillStyle = sp.color;
      ctx.fillRect(BOX.x + 10, BOX.y - 13, nameW, 15);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(BOX.x + 10, BOX.y - 1, nameW, 3);
      drawText(ctx, sp.name, BOX.x + 18, BOX.y - 10, {
        font: '8px "Press Start 2P", monospace',
        color: "#0a0e1a",
        shadow: "rgba(255,255,255,0.25)",
      });
    }

    // portrait
    const px = BOX.x + 10;
    const py = BOX.y + 9;
    const size = 56;
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(px - 2, py - 2, size + 4, size + 4);
    drawPortrait(ctx, sp.portrait, px, py, size, this.emotion, this.time);
    ctx.strokeStyle = "rgba(160, 190, 240, 0.55)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px - 1.5, py - 1.5, size + 3, size + 3);
    // portrait corner accents
    ctx.fillStyle = sp.color;
    ctx.fillRect(px - 3, py - 3, 5, 1);
    ctx.fillRect(px - 3, py - 3, 1, 5);
    ctx.fillRect(px + size - 2, py + size + 2, 5, 1);
    ctx.fillRect(px + size + 2, py + size - 2, 1, 5);

    // text
    const page = this.pages[this.pageIndex] || "";
    const visible = page.slice(0, Math.floor(this.chars));
    const lines = visible.split("\n");
    lines.forEach((line, i) => {
      const y = BOX.y + 12 + i * LINE_H;
      if (line.startsWith("* ")) {
        drawText(ctx, "*", TEXT_X, y, {
          font: FONT,
          color: "#ffd166",
          shadow: "#05070f",
        });
        drawText(ctx, line.slice(2), TEXT_X + measure(ctx, "* ", FONT), y, {
          font: FONT,
          color: "#eef6ff",
          shadow: "#05070f",
        });
      } else {
        drawText(ctx, line, TEXT_X, y, {
          font: FONT,
          color: this.speaker === "narrator" ? "#d5e2f7" : "#eef6ff",
          shadow: "#05070f",
        });
      }
    });

    // advance arrow
    if (this.done && !this.choosing) {
      const blink = Math.sin(this.time * 7) > 0;
      if (blink) {
        const ax = BOX.x + BOX.w - 17;
        const ay = BOX.y + BOX.h - 14;
        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + 7, ay);
        ctx.lineTo(ax + 3.5, ay + 5);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  _drawChoices(ctx) {
    const rowH = 20;
    const panelH = this.options.length * rowH + 12;
    const panelW = 340;
    const panelX = 100;
    const panelY = BOX.y - panelH - 8;
    ctx.save();
    ctx.globalAlpha = 0.45;
    cutRect(ctx, panelX + 3, panelY + 4, panelW, panelH);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();
    cutRect(ctx, panelX, panelY, panelW, panelH);
    ctx.fillStyle = "rgba(8, 13, 30, 0.97)";
    ctx.fill();
    ctx.strokeStyle = "#8ca8d8";
    ctx.lineWidth = 2;
    ctx.stroke();
    this.choiceRects = [];
    this.options.forEach((option, i) => {
      const y = panelY + 6 + i * rowH;
      const selected = i === this.index;
      if (selected) {
        ctx.fillStyle = "rgba(255, 209, 102, 0.13)";
        ctx.fillRect(panelX + 5, y - 1, panelW - 10, rowH - 2);
        ctx.fillStyle = "#ffd166";
        ctx.fillRect(panelX + 5, y - 1, 2, rowH - 2);
        ctx.beginPath();
        ctx.moveTo(panelX + 14, y + 6);
        ctx.lineTo(panelX + 14, y + 12);
        ctx.lineTo(panelX + 19, y + 9);
        ctx.closePath();
        ctx.fill();
      }
      drawText(ctx, option.label, panelX + 26, y + 2, {
        font: '16px "VT323", monospace',
        color: selected ? "#fff4d0" : "#b9cceb",
        shadow: "#000",
      });
      this.choiceRects.push({ x: panelX + 4, y: y - 1, w: panelW - 8, h: rowH - 2, index: i });
    });
  }
}
