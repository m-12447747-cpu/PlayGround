// dialogue.js — typewriter box, portraits, choices.
import { drawPortrait } from './portraits.js';

const SPEAKERS = {
  srif: { name: 'SRIF', portrait: 'srif', expr: 'neutral', color: '#ffd166', pitch: 1.02 },
  'srif-inner': { name: 'SRIF', portrait: 'srif', expr: 'tired', color: '#9bb6e8', pitch: 0.98, style: 'inner' },
  chris: { name: 'CHRIS', portrait: 'chris', expr: 'grin', color: '#7bd6a4', pitch: 1.22 },
  mich: { name: 'MICH', portrait: 'mich', expr: 'scowl', color: '#ffb45e', pitch: 0.82 },
  toriel: { name: 'TORIEL', portrait: 'toriel', expr: 'soft', color: '#c9a6ff', pitch: 0.94 },
  asgore: { name: 'ASGORE', portrait: 'asgore', expr: 'neutral', color: '#8fb3e8', pitch: 0.72 },
  demon: { name: '???', portrait: 'srif', expr: 'demon', color: '#ff5d74', pitch: 0.62, style: 'demon' },
  cold: { name: 'COLD SELF', portrait: 'srif', expr: 'demon', color: '#8fe3ff', pitch: 0.66, style: 'demon' },
  child: { name: 'SRIF?', portrait: 'srif', expr: 'sad', color: '#c7d6f2', pitch: 1.05 },
  narr: { name: '', portrait: null, color: '#9aa9c9', pitch: 0.9, style: 'narr' },
  system: { name: '', portrait: null, color: '#ffd166', pitch: 0.9, style: 'cinematic' },
  lark: { name: 'MS. LARK', portrait: null, color: '#c7b8a0', pitch: 1.1 },
  snowman: { name: 'SNOWMAN', portrait: null, color: '#dcecff', pitch: 0.7 },
};

export class Dialogue {
  constructor(g) {
    this.g = g;
    this.active = false;
    this.typing = false;
    this.done = false;
    this.full = '';
    this.shown = 0;
    this.acc = 0;
    this.resolve = null;
    this.choice = null;
    this.speaker = null;
    this.style = '';
    this.portraitTimer = 0;
    this.t = 0;
    this.el = document.getElementById('dialogue');
    this.box = document.getElementById('dlg-box');
    this.nameEl = document.getElementById('dlg-name');
    this.textEl = document.getElementById('dlg-text');
    this.hintEl = document.getElementById('dlg-hint');
    this.portraitWrap = document.getElementById('dlg-portrait-wrap');
    this.portraitCanvas = document.getElementById('dlg-portrait');
    this.choicesEl = document.getElementById('choices');

    this.box.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.choice-btn')) return;
      e.preventDefault();
      this.advance();
    });
    this._choicesBuilt = [];
  }

  speakerFor(who, opts = {}) {
    const base = SPEAKERS[who] || SPEAKERS.srif;
    return { ...base, ...opts };
  }

  say(whoOrObj, textMaybe, opts = {}) {
    let who = whoOrObj;
    let text = textMaybe;
    let o = opts;
    if (typeof whoOrObj === 'object') {
      who = whoOrObj.who || 'narr';
      text = whoOrObj.text || '';
      o = whoOrObj;
    }
    const sp = this.speakerFor(who, o);
    this.active = true;
    this.typing = true;
    this.done = false;
    this.full = text;
    this.shown = 0;
    this.acc = 0;
    this.speaker = sp;
    this.style = o.style || sp.style || '';
    this.el.classList.remove('hidden');
    this.el.className = this.style ? `style-${this.style}` : '';
    this.nameEl.textContent = sp.name || '';
    this.nameEl.style.color = sp.color || '#ffd166';
    this.textEl.textContent = '';
    this.hintEl.style.opacity = '0';
    this.choicesEl.classList.add('hidden');
    this.choicesEl.innerHTML = '';
    if (sp.portrait) {
      this.portraitWrap.classList.remove('none');
      drawPortrait(this.portraitCanvas, sp.portrait, sp.expr || 'neutral', this.t);
    } else {
      this.portraitWrap.classList.add('none');
    }
    this.g.input.setTouchVisibleForScene(false);
    return new Promise((resolve) => {
      this.resolve = resolve;
      if (this.g.reduceMotion || o.instant) {
        this.shown = this.full.length;
        this.typing = false;
        this.done = true;
        this.textEl.textContent = this.full;
        this.hintEl.style.opacity = '1';
      }
    });
  }

  region(text) { return text; }

  choose(prompt, options, opts = {}) {
    const o = options.map((x) => (typeof x === 'string' ? { label: x } : x));
    this.choice = { options: o, index: 0, resolve: null };
    this.choicesEl.innerHTML = '';
    this.choicesEl.classList.remove('hidden');
    const buttons = o.map((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn' + (i === 0 ? ' selected' : '');
      btn.type = 'button';
      const heart = document.createElement('span');
      heart.className = 'heart';
      heart.textContent = '♥';
      const label = document.createElement('span');
      label.textContent = opt.label;
      btn.append(heart, label);
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!this.choice) return;
        this.choice.index = i;
        this.g.sound.sfx('confirm');
        this._resolveChoice(i);
      });
      this.choicesEl.append(btn);
      return btn;
    });
    this._choiceButtons = buttons;
    // prompt is shown in the main box so the choice list floats above it
    if (prompt) {
      this.typing = false;
      this.done = true;
      this.full = prompt;
      this.shown = prompt.length;
      this.textEl.textContent = prompt;
      this.hintEl.style.opacity = '0';
      if (!this.el.classList.contains('hidden') && !this.speaker) {
        this.nameEl.textContent = '';
      }
    }
    this.g.input.setTouchVisibleForScene(false);
    return new Promise((resolve) => { this.choice.resolve = resolve; });
  }

  _resolveChoice(i) {
    if (!this.choice) return;
    const r = this.choice.resolve;
    this.choice = null;
    this.choicesEl.classList.add('hidden');
    this.choicesEl.innerHTML = '';
    this._choiceButtons = [];
    if (r) r(i);
  }

  _select(delta) {
    if (!this.choice) return;
    const n = this.choice.options.length;
    this.choice.index = (this.choice.index + delta + n) % n;
    this._choiceButtons.forEach((b, i) => b.classList.toggle('selected', i === this.choice.index));
    this.g.sound.sfx('hover');
  }

  advance() {
    if (!this.active) return;
    if (this.choice) return;
    if (this.typing) {
      this.shown = this.full.length;
      this.textEl.textContent = this.full;
      this.typing = false;
      this.done = true;
      this.hintEl.style.opacity = '1';
      this.g.sound.sfx('blip', { pitch: 1.4 });
      return;
    }
    if (this.done) {
      const r = this.resolve;
      this.resolve = null;
      this.active = false;
      this.el.classList.add('hidden');
      this.g.input.setTouchVisibleForScene(true);
      if (r) r();
    }
  }

  update(dt) {
    this.t += dt;
    if (!this.active) return;
    if (this.choice) {
      const input = this.g.input;
      if (input.consume('up')) this._select(-1);
      if (input.consume('down')) this._select(1);
      if (input.consume('confirm') || input.consume('cancel')) {
        this.g.sound.sfx('confirm');
        this._resolveChoice(this.choice.index);
        return;
      }
      if (input.pressed.has('one')) { input.consume('one'); this.g.sound.sfx('confirm'); this._resolveChoice(0); return; }
      if (input.pressed.has('two')) { input.consume('two'); this.g.sound.sfx('confirm'); this._resolveChoice(1); return; }
      if (input.pressed.has('three')) { input.consume('three'); this.g.sound.sfx('confirm'); this._resolveChoice(2); return; }
      // still animate portrait
      if (this.speaker?.portrait) drawPortrait(this.portraitCanvas, this.speaker.portrait, this.speaker.expr || 'neutral', this.t);
      return;
    }
    if (this.typing) {
      this.acc += dt;
      const cps = 46;
      const target = Math.floor(this.acc * cps);
      if (target > this.shown) {
        const before = this.shown;
        this.shown = Math.min(this.full.length, target);
        this.textEl.textContent = this.full.slice(0, this.shown);
        const newChars = this.full.slice(before, this.shown);
        if (newChars.length && Math.random() < 0.72) {
          this.g.sound.sfx('blip', { pitch: (this.speaker?.pitch || 1) * (0.94 + Math.random() * 0.12) });
        }
        if (this.shown >= this.full.length) {
          this.typing = false;
          this.done = true;
          this.hintEl.style.opacity = '1';
        }
      }
      if (this.g.input.consume('confirm') || this.g.input.consume('cancel')) {
        this.shown = this.full.length;
        this.textEl.textContent = this.full;
        this.typing = false;
        this.done = true;
        this.hintEl.style.opacity = '1';
      }
    } else if (this.done) {
      if (this.g.input.consume('confirm') || this.g.input.consume('cancel')) {
        const r = this.resolve;
        this.resolve = null;
        this.active = false;
        this.el.classList.add('hidden');
        this.g.input.setTouchVisibleForScene(true);
        if (r) r();
      }
    }
    if (this.speaker?.portrait) {
      this.portraitTimer += dt;
      if (this.portraitTimer > 0.12) {
        this.portraitTimer = 0;
        drawPortrait(this.portraitCanvas, this.speaker.portrait, this.speaker.expr || 'neutral', this.t);
      }
    }
  }

  hide() {
    this.active = false;
    this.typing = false;
    this.done = false;
    this.choice = null;
    this.el.classList.add('hidden');
    this.choicesEl.classList.add('hidden');
    if (this.resolve) { const r = this.resolve; this.resolve = null; r(); }
    this.g.input.setTouchVisibleForScene(true);
  }
}
