// battle.js — a small, mean mirror.
import { PAL, rect, rr, line, ellipse, text, heart, hash, glow, snowflake } from './art.js';
import { drawBattleBg, drawColdSelf, drawBattleSnow, drawSoulTrail } from './artscene.js';

const W = 480;
const H = 270;
const BOX = { x: 90, y: 126, w: 300, h: 116 };

const sleep = (g, ms) => g.wait(ms);

export class Battle {
  constructor(g) {
    this.g = g;
    this.reset();
  }

  reset() {
    this.maxHp = 20;
    this.hp = 20;
    this.enemyMax = 72;
    this.enemyHp = 72;
    this.trust = 0;
    this.actsUsed = { remember: false, reach: false, mask: false };
    this.items = 2;
    this.turn = 1;
    this.phase = 'intro';
    this.sel = 0;
    this.subSel = 0;
    this.message = '';
    this.msgShown = 0;
    this.msgTyping = false;
    this.msgResolve = null;
    this.msgColor = '#f2f5ff';
    this.choiceResolve = null;
    this.attackResolve = null;
    this.defResolve = null;
    this.retryResolve = null;
    this.marker = 0;
    this.markerDir = 1;
    this.attackTime = 0;
    this.soul = { x: BOX.x + BOX.w / 2, y: BOX.y + BOX.h / 2 };
    this.trail = [];
    this.bullets = [];
    this.defTimer = 0;
    this.defTotal = 1;
    this.spawnTimer = 0;
    this.pattern = 0;
    this.invuln = 0;
    this.hurt = 0;
    this.shake = 0;
    this.t = 0;
    this.dodges = 0;
    this.spared = false;
    this.dead = false;
    this.gameOver = false;
    this.white = 0;
    this.spareT = 0;
    this.enemyFlash = 0;
    this.running = false;
    this.flakes = [];
    for (let i = 0; i < 70; i++) {
      this.flakes.push({ x: hash(i * 1.1) * W, y: hash(i * 2.2) * H, z: hash(i * 3.3) });
    }
    this.msgLinesCache = null;
  }

  async start() {
    this.reset();
    const g = this.g;
    g.mode = 'battle';
    g.cutscene = false;
    g.ui.showHud(false);
    g.input.setTouchVisibleForScene(true);
    g.sound.playTrack('battle');
    g.sound.ambience(0.1);
    g.ui.setObjective('');
    this.running = true;
    this.phase = 'intro';
    await sleep(g, 700);
    await this.say('* COLD SELF blocks the way.\n* It has your face. It always did.');
    await this.say('* FIGHT hurts. ACT understands. ITEM heals. SPARE... is earned.');
    await this.say('* When it attacks, keep your SOUL inside the box.\n* Arrows, joystick, or tilt.');
    await this.battleLoop();
    this.phase = 'done';
    this.running = false;
    return this.spared;
  }

  /* --------------------------- text --------------------------- */
  say(text, opt = {}) {
    const g = this.g;
    return new Promise((resolve) => {
      this.phase = 'message';
      this.message = text;
      this.msgShown = 0;
      this.msgTyping = true;
      this.msgColor = opt.color || '#f2f5ff';
      this.msgResolve = resolve;
      this.msgLinesCache = null;
      if (g.reduceMotion || opt.instant) {
        this.msgShown = text.length;
        this.msgTyping = false;
      }
    });
  }

  advanceMessage() {
    if (!this.msgResolve) return;
    if (this.msgTyping) {
      this.msgShown = this.message.length;
      this.msgTyping = false;
      return;
    }
    const r = this.msgResolve;
    this.msgResolve = null;
    this.phase = 'busy';
    r();
  }

  /* --------------------------- loop --------------------------- */
  async battleLoop() {
    const g = this.g;
    while (!this.spared) {
      this.phase = 'menu';
      this.sel = 0;
      const cmd = await this.chooseCommand();
      if (cmd === 'FIGHT') {
        await this.doFight();
      } else if (cmd === 'ACT') {
        const act = await this.chooseAct();
        if (!act) continue;
        await this.doAct(act);
      } else if (cmd === 'ITEM') {
        const item = await this.chooseItem();
        if (!item) continue;
        await this.doItem(item);
      } else if (cmd === 'SPARE') {
        if (this.trust >= 3) {
          await this.spareSequence();
          return;
        }
        await this.say('* You hold out a hand.\n* It doesn\'t take it. Not yet.');
      }
      if (this.spared) return;
      await this.enemyDialogue();
      await this.defend();
      if (this.dead) {
        await this.gameover();
        if (this.dead) return;
        this.hp = this.maxHp;
        this.items = 2;
        this.invuln = 0;
        await this.say('* You dust yourself off.\n* The mirror is still waiting.');
      }
    }
  }

  chooseCommand() {
    return new Promise((resolve) => { this.choiceResolve = resolve; });
  }

  chooseAct() {
    return new Promise((resolve) => {
      this.phase = 'act';
      this.subSel = 0;
      this.actResolve = resolve;
    });
  }

  chooseItem() {
    return new Promise((resolve) => {
      this.phase = 'item';
      this.subSel = 0;
      this.itemResolve = resolve;
    });
  }

  async doFight() {
    const g = this.g;
    this.phase = 'attack';
    this.marker = 0;
    this.markerDir = 1;
    this.attackTime = 0;
    const dmg = await new Promise((resolve) => { this.attackResolve = resolve; });
    g.sound.sfx('shatter');
    this.enemyFlash = 1;
    this.shake = 4;
    this.enemyHp = Math.max(0, this.enemyHp - dmg);
    if (this.enemyHp <= 0) {
      await this.say('* The mirror cracks.\n* Then it un-cracks.\n* COLD SELF: you can\'t hit a feeling.');
      this.enemyHp = this.enemyMax;
      this.enemyFlash = 0.4;
    } else {
      await this.say(`* You strike the glass. ${dmg} damage.\n* COLD SELF: see? you're just like me.`);
    }
  }

  async doAct(act) {
    const g = this.g;
    this.actsUsed[act] = true;
    g.stats.acts++;
    g.sound.sfx('confirm');
    if (act === 'remember') {
      await this.say('* You remember building a snow fort with Chris and Mich.\n* You laughed so hard you couldn\'t breathe.');
      await this.say('* COLD SELF: that was before.');
      await this.say('* SRIF: Before what?');
      await this.say('* COLD SELF: before you learned what you are.');
    } else if (act === 'reach') {
      await this.say('* You reach toward the glass.\n* It is cold enough to burn.');
      this.hp = Math.max(1, this.hp - 1);
      g.sound.sfx('hit');
      await this.say('* You don\'t pull away.');
      await this.say('* COLD SELF: stop. why are you doing that?');
      await this.say('* SRIF: Because you\'re not the only one who gets to be brave.');
    } else if (act === 'mask') {
      await this.say('* You stop smiling.\n* The face in the glass stops too.');
      await this.say('* COLD SELF: ...what are you doing?');
      await this.say('* SRIF: Taking it off.\n* You can too.');
      this.enemyFlash = 0.25;
      g.sound.sfx('heart');
    }
    this.trust = Math.min(3, this.trust + 1);
    if (this.trust >= 3) {
      g.sound.sfx('spare');
      await this.say('* Something in the mirror loosens.\n* Its hands are shaking.\n* SPARE is open.', { color: '#ffe6a8' });
    } else {
      await this.say(`* It understands a little more. (${this.trust}/3)`, { color: '#8fe3ff' });
    }
  }

  async doItem() {
    const g = this.g;
    this.items--;
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + 8);
    g.sound.sfx('heal');
    await this.say(`* You drink the cocoa Chris made.\n* It's still warm. HP ${before} → ${this.hp}.`);
  }

  async enemyDialogue() {
    const lines = [
      "you're still smiling.",
      'they\'d hate you if they knew.',
      'you practiced that face for four years.',
      'you don\'t get to be loved for free.',
      'stop looking at me.',
    ];
    if (this.trust >= 3) {
      await this.say('* COLD SELF: why are you still here?\n* COLD SELF: you could just leave me in the glass.', { color: '#a9d8ff' });
      return;
    }
    if (this.trust === 2) {
      await this.say('* COLD SELF: you should be running.\n* COLD SELF: ...why aren\'t you running?', { color: '#a9d8ff' });
      return;
    }
    if (this.trust === 1) {
      await this.say('* COLD SELF: why are you still here?', { color: '#a9d8ff' });
      return;
    }
    const line = lines[Math.min(lines.length - 1, this.turn - 1)];
    await this.say(`* COLD SELF: ${line}`, { color: '#a9d8ff' });
  }

  async defend() {
    const g = this.g;
    this.phase = 'defend';
    this.bullets = [];
    this.soul.x = BOX.x + BOX.w / 2;
    this.soul.y = BOX.y + BOX.h / 2;
    this.trail = [];
    this.defTotal = Math.min(9, 6.2 + this.turn * 0.55);
    this.defTimer = this.defTotal;
    this.spawnTimer = 0.3;
    this.pattern = (this.turn - 1) % 4;
    this.invuln = 0;
    this.dodges = 0;
    g.sound.sfx('heart');
    return new Promise((resolve) => { this.defResolve = resolve; });
  }

  finishDefense() {
    if (!this.defResolve) return;
    const r = this.defResolve;
    this.defResolve = null;
    this.bullets = [];
    this.phase = 'busy';
    this.turn++;
    r();
  }

  async gameover() {
    const g = this.g;
    this.dead = true;
    this.phase = 'dead';
    this.bullets = [];
    g.sound.sfx('shatter');
    g.ui.showGameover();
    await new Promise((resolve) => { this.retryResolve = resolve; });
    g.ui.hideGameover();
    this.dead = false;
    this.hp = this.maxHp;
    this.items = 2;
    this.invuln = 0;
  }

  retry() {
    if (this.retryResolve) {
      const r = this.retryResolve;
      this.retryResolve = null;
      r();
    }
  }

  async spareSequence() {
    const g = this.g;
    this.spared = true;
    this.phase = 'spare';
    this.spareT = 0;
    g.sound.sfx('spare');
    await sleep(g, 500);
    await this.say('* You don\'t raise a hand.\n* You open your arms.');
    await this.say('* COLD SELF: what are you doing?');
    await this.say('* SRIF: Hug.');
    await this.say('* COLD SELF: you can\'t hug a feeling.');
    await this.say('* SRIF: Watch me.');
    this.white = 0.25;
    await this.say('* You hug the cold.\n* It hugs back with small, shaky arms.');
    await this.say('* It gets smaller. Quieter.\n* It doesn\'t disappear.');
    await this.say('* COLD SELF: ...you\'re not going to leave?');
    await this.say('* SRIF: No.');
    await this.say('* COLD SELF: even though I\'m—');
    await this.say('* SRIF: Even though.');
    await this.say('* COLD SELF: ...okay.', { color: '#ffe6a8' });
    await sleep(g, 400);
    g.sound.sfx('heart');
    await sleep(g, 900);
  }

  /* --------------------------- update --------------------------- */
  update(dt) {
    this.t += dt;
    this.hurt = Math.max(0, this.hurt - dt * 2.2);
    this.enemyFlash = Math.max(0, this.enemyFlash - dt * 2);
    this.shake = Math.max(0, this.shake - dt * 18);
    if (this.phase !== 'defend') this.white = Math.min(this.phase === 'spare' ? 0.7 : 0.4, this.white + dt * 0.15);
    if (this.spared) this.spareT += dt;
    const g = this.g;
    const taps = g.input.taps.splice(0);
    const tap = taps.length ? taps[taps.length - 1] : null;

    if (this.phase === 'message') {
      if (this.msgTyping) {
        this.msgShown += dt * 58;
        if (this.msgShown >= this.message.length) {
          this.msgShown = this.message.length;
          this.msgTyping = false;
        }
        const shown = Math.floor(this.msgShown);
        if (shown % 3 === 0) g.sound.sfx('blip', { pitch: 0.9 });
      }
      if (g.input.consume('confirm') || g.input.consume('cancel') || tap) {
        this.advanceMessage();
      }
      return;
    }

    if (this.phase === 'menu') {
      if (g.input.consume('left')) { this.sel = (this.sel + 3) % 4; g.sound.sfx('hover'); }
      if (g.input.consume('right')) { this.sel = (this.sel + 1) % 4; g.sound.sfx('hover'); }
      if (g.input.consume('up')) { this.sel = (this.sel + 3) % 4; g.sound.sfx('hover'); }
      if (g.input.consume('down')) { this.sel = (this.sel + 1) % 4; g.sound.sfx('hover'); }
      if (tap) {
        for (let i = 0; i < 4; i++) {
          const r = this.menuRect(i);
          if (tap.x >= r.x && tap.x <= r.x + r.w && tap.y >= r.y && tap.y <= r.y + r.h) {
            this.sel = i;
            this.activateCommand();
            return;
          }
        }
      }
      if (g.input.consume('confirm')) this.activateCommand();
      for (let i = 0; i < 4; i++) {
        if (g.input.consume(['one', 'two', 'three', 'four'][i])) { this.sel = i; this.activateCommand(); return; }
      }
      return;
    }

    if (this.phase === 'act') {
      if (g.input.consume('up')) { this.subSel = (this.subSel + 3) % 4; g.sound.sfx('hover'); }
      if (g.input.consume('down')) { this.subSel = (this.subSel + 1) % 4; g.sound.sfx('hover'); }
      if (g.input.consume('cancel')) { this.resolveAct(null); return; }
      if (tap) {
        for (let i = 0; i < 4; i++) {
          const r = this.subRect(i);
          if (tap.x >= r.x && tap.x <= r.x + r.w && tap.y >= r.y && tap.y <= r.y + r.h) {
            this.subSel = i;
            this.pickAct();
            return;
          }
        }
      }
      if (g.input.consume('confirm')) this.pickAct();
      return;
    }

    if (this.phase === 'item') {
      if (g.input.consume('up')) { this.subSel = (this.subSel + 1) % 2; g.sound.sfx('hover'); }
      if (g.input.consume('down')) { this.subSel = (this.subSel + 1) % 2; g.sound.sfx('hover'); }
      if (g.input.consume('cancel')) { this.resolveItem(null); return; }
      if (tap) {
        for (let i = 0; i < 2; i++) {
          const r = this.subRect(i);
          if (tap.x >= r.x && tap.x <= r.x + r.w && tap.y >= r.y && tap.y <= r.y + r.h) {
            this.subSel = i;
            this.pickItem();
            return;
          }
        }
      }
      if (g.input.consume('confirm')) this.pickItem();
      return;
    }

    if (this.phase === 'attack') {
      this.attackTime += dt;
      this.marker += this.markerDir * dt * 1.55;
      if (this.marker > 1) { this.marker = 1; this.markerDir = -1; }
      if (this.marker < 0) { this.marker = 0; this.markerDir = 1; }
      if (g.input.consume('confirm') || tap || this.attackTime > 4.2) {
        this.strike();
      }
      return;
    }

    if (this.phase === 'defend') {
      this.updateDefend(dt, tap);
      return;
    }

    if (this.phase === 'dead') {
      if (g.input.consume('confirm') && g.ui.gameoverVisible) this.retry();
      return;
    }

    if (this.phase === 'spare') {
      this.white = Math.min(0.95, this.white + dt * 0.3);
    }
  }

  activateCommand() {
    const cmd = ['FIGHT', 'ACT', 'ITEM', 'SPARE'][this.sel];
    const r = this.choiceResolve;
    this.choiceResolve = null;
    this.phase = 'busy';
    this.g.sound.sfx('confirm');
    if (r) r(cmd);
  }

  pickAct() {
    const keys = ['remember', 'reach', 'mask'];
    if (this.subSel === 3) { this.resolveAct(null); return; }
    const key = keys[this.subSel];
    if (this.actsUsed[key]) { this.g.sound.sfx('cancel'); return; }
    this.resolveAct(key);
  }

  resolveAct(act) {
    const r = this.actResolve;
    this.actResolve = null;
    this.phase = 'busy';
    this.g.sound.sfx(act ? 'confirm' : 'cancel');
    if (r) r(act);
  }

  pickItem() {
    if (this.subSel === 1) { this.resolveItem(null); return; }
    if (this.items <= 0) { this.g.sound.sfx('cancel'); return; }
    this.resolveItem('cocoa');
  }

  resolveItem(item) {
    const r = this.itemResolve;
    this.itemResolve = null;
    this.phase = 'busy';
    this.g.sound.sfx(item ? 'confirm' : 'cancel');
    if (r) r(item);
  }

  strike() {
    if (!this.attackResolve) return;
    const dist = Math.abs(this.marker - 0.5);
    let dmg;
    if (dist < 0.05) dmg = 20;
    else if (dist < 0.12) dmg = 15;
    else if (dist < 0.22) dmg = 11;
    else dmg = 7;
    const r = this.attackResolve;
    this.attackResolve = null;
    this.g.sound.sfx('impact');
    this.shake = 5;
    this.hurt = 0;
    r(dmg);
  }

  updateDefend(dt, tap) {
    const g = this.g;
    this.defTimer -= dt;
    this.invuln = Math.max(0, this.invuln - dt);
    const speed = 98;
    const axis = g.input.axis;
    if (Math.abs(axis.x) > 0.03 || Math.abs(axis.y) > 0.03) {
      this.soul.x = Math.max(BOX.x + 7, Math.min(BOX.x + BOX.w - 7, this.soul.x + axis.x * speed * dt));
      this.soul.y = Math.max(BOX.y + 7, Math.min(BOX.y + BOX.h - 7, this.soul.y + axis.y * speed * dt));
    }
    this.trail.push({ x: this.soul.x, y: this.soul.y });
    if (this.trail.length > 10) this.trail.shift();
    if (this.defTimer <= 0) { this.finishDefense(); return; }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) this.spawnPattern();

    // bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (b.telegraph > 0) {
        b.telegraph -= dt;
        if (b.telegraph > 0) continue;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += (b.spin || 0) * dt;
      b.life += dt;
      if (b.wave) b.x += Math.sin((b.life + b.seed) * 3) * b.wave * dt;
      const out = b.x < BOX.x - 20 || b.x > BOX.x + BOX.w + 20 || b.y < BOX.y - 20 || b.y > BOX.y + BOX.h + 20;
      if (out) { this.bullets.splice(i, 1); continue; }
      const dx = b.x - this.soul.x;
      const dy = b.y - this.soul.y;
      const d = Math.hypot(dx, dy);
      if (d < b.r + 12 && !b.grazed && b.telegraph <= 0) {
        b.grazed = true;
        this.dodges++;
        g.stats.dodges++;
      }
      if (d < b.r + 3.2 && this.invuln <= 0) {
        this.hurt = 1;
        this.invuln = 1.15;
        this.hp = Math.max(0, this.hp - (b.dmg || 4));
        g.sound.sfx('hit');
        this.shake = 5;
        this.bullets.splice(i, 1);
        if (this.hp <= 0) {
          this.dead = true;
          this.finishDefense();
          return;
        }
      }
    }

    if (tap) {
      // tapping the box nudges the soul toward the tap — nice for phones
      const tx = Math.max(BOX.x + 8, Math.min(BOX.x + BOX.w - 8, tap.x));
      const ty = Math.max(BOX.y + 8, Math.min(BOX.y + BOX.h - 8, tap.y));
      this.soul.x += (tx - this.soul.x) * 0.18;
      this.soul.y += (ty - this.soul.y) * 0.18;
    }
  }

  spawnPattern() {
    const p = this.pattern;
    const g = this.g;
    if (p === 0) {
      // icicles
      this.spawnTimer = this.turn > 3 ? 0.32 : 0.44;
      const n = this.turn > 3 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const x = BOX.x + 14 + Math.random() * (BOX.w - 28);
        this.bullets.push({
          type: 'ice', x, y: BOX.y + 10, r: 4, vx: 0, vy: 105 + this.turn * 8,
          telegraph: 0.42, life: 0, rot: 0, dmg: 4, seed: Math.random() * 6,
        });
      }
    } else if (p === 1) {
      // side sweep
      this.spawnTimer = 0.38;
      const left = Math.random() > 0.5;
      const y = BOX.y + 16 + Math.random() * (BOX.h - 32);
      this.bullets.push({
        type: 'snow', x: left ? BOX.x - 4 : BOX.x + BOX.w + 4, y, r: 5,
        vx: left ? 100 : -100, vy: 0, wave: 22, telegraph: 0.28, life: 0, rot: 0, dmg: 3, seed: Math.random() * 6,
      });
    } else if (p === 2) {
      // ring with a gap
      this.spawnTimer = 1.35;
      const gap = Math.random() * Math.PI * 2;
      const count = 12;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        if (Math.abs(((a - gap + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.4) continue;
        this.bullets.push({
          type: 'ring', x: BOX.x + BOX.w / 2, y: BOX.y + BOX.h / 2, r: 4,
          vx: Math.cos(a) * 64, vy: Math.sin(a) * 64, telegraph: 0.55, life: 0, rot: a, dmg: 4, seed: a,
        });
      }
    } else {
      // mixed weather
      this.spawnTimer = 0.3;
      if (Math.random() > 0.45) {
        const x = BOX.x + 14 + Math.random() * (BOX.w - 28);
        this.bullets.push({
          type: 'ice', x, y: BOX.y + 10, r: 4, vx: 0, vy: 120, telegraph: 0.36, life: 0, rot: 0, dmg: 4, seed: Math.random() * 6,
        });
      } else {
        const left = Math.random() > 0.5;
        this.bullets.push({
          type: 'word', x: left ? BOX.x - 6 : BOX.x + BOX.w + 6, y: BOX.y + 18 + Math.random() * (BOX.h - 36),
          r: 5, vx: left ? 105 : -105, vy: 8, wave: 0, telegraph: 0.3, life: 0, rot: 0, dmg: 5, seed: Math.random() * 6,
          label: ['liar', 'smile', 'alone', 'freak'][Math.floor(Math.random() * 4)],
        });
      }
    }
  }

  menuRect(i) {
    return { x: 62 + i * 93, y: 214, w: 88, h: 26 };
  }

  subRect(i) {
    return { x: 78, y: 204 + i * 13, w: 324, h: 12 };
  }

  /* --------------------------- render --------------------------- */
  render(ctx) {
    const g = this.g;
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    drawBattleBg(ctx, this.t, this.trust);
    drawBattleSnow(ctx, this.t, this.flakes, 0.35);

    const defending = this.phase === 'defend';
    if (defending) {
      ctx.save();
      ctx.translate(240, 48);
      ctx.scale(0.58, 0.58);
      drawColdSelf(ctx, 0, 0, this.t, { trust: this.trust, hurt: this.enemyFlash });
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(240, 90);
      drawColdSelf(ctx, 0, 0, this.t, { trust: this.trust, hurt: this.enemyFlash });
      ctx.restore();
    }

    this.drawHud(ctx);

    if (this.phase === 'defend') this.drawDefense(ctx);
    else this.drawBottom(ctx);
    if (this.phase === 'message') this.drawMessage(ctx);

    if (this.hurt > 0) {
      ctx.save();
      ctx.globalAlpha = this.hurt * 0.35;
      ctx.fillStyle = '#ff3b5c';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (this.phase === 'spare' || this.spared) {
      const a = Math.min(0.92, this.white);
      ctx.fillStyle = `rgba(244,247,255,${a})`;
      ctx.fillRect(0, 0, W, H);
      if (this.spared) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - this.spareT * 0.4);
        text(ctx, 'you stayed.', 240, 130, { size: 14, color: '#0b0f1e', align: 'center', weight: 600, tracking: 2 });
        ctx.restore();
      }
    }
    ctx.restore();
  }

  drawHud(ctx) {
    // player
    rect(ctx, 10, 8, 178, 40, 'rgba(5,7,15,.75)');
    rect(ctx, 10, 8, 3, 40, '#ffd166');
    text(ctx, 'SRIF', 20, 21, { size: 8, color: '#f2f5ff', weight: 600, tracking: 1 });
    text(ctx, 'LV 1', 68, 21, { size: 6, color: '#9aa9c9', tracking: 0.5 });
    const hpW = 108;
    rect(ctx, 20, 25, hpW, 7, '#2b1d25');
    rect(ctx, 21, 26, hpW - 2, 5, '#f0a45a');
    ctx.save();
    ctx.fillStyle = '#ffcf7a';
    ctx.fillRect(21, 26, Math.round((hpW - 2) * (this.hp / this.maxHp)), 5);
    ctx.restore();
    text(ctx, `HP ${this.hp}/${this.maxHp}`, 134, 31, { size: 5.4, color: '#f2f5ff' });
    text(ctx, 'TRUST', 20, 44, { size: 5, color: '#8fe3ff', tracking: 1 });
    for (let i = 0; i < 3; i++) {
      const x = 58 + i * 10;
      const on = i < this.trust;
      ctx.save();
      if (on) { ctx.shadowColor = '#8fe3ff'; ctx.shadowBlur = 5; }
      ctx.fillStyle = on ? '#8fe3ff' : '#26334f';
      ctx.beginPath();
      ctx.moveTo(x, 39); ctx.lineTo(x + 4, 43); ctx.lineTo(x, 47); ctx.lineTo(x - 4, 43);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    // enemy
    rect(ctx, 300, 8, 170, 36, 'rgba(5,7,15,.75)');
    rect(ctx, 467, 8, 3, 36, '#8fe3ff');
    text(ctx, 'COLD SELF', 458, 21, { size: 8, color: '#dcecff', align: 'right', weight: 600, tracking: 1 });
    rect(ctx, 318, 25, 134, 5, '#1b263b');
    ctx.save();
    ctx.fillStyle = '#8fe3ff';
    ctx.fillRect(319, 26, Math.max(0, Math.round(132 * (this.enemyHp / this.enemyMax))), 3);
    ctx.restore();
    text(ctx, this.trust >= 3 ? 'listen' : 'guard', 458, 40, { size: 4.6, color: '#8fa9c9', align: 'right', tracking: 1 });
    // turn indicator
    if (this.phase === 'menu' || this.phase === 'act' || this.phase === 'item') {
      text(ctx, 'YOUR TURN', 240, 14, { size: 5, color: '#ffd166', align: 'center', tracking: 2, alpha: 0.75 });
    }
  }

  drawBottom(ctx) {
    const phase = this.phase;
    if (phase === 'attack') {
      rect(ctx, 40, 198, 400, 58, 'rgba(5,7,15,.9)');
      ctx.strokeStyle = '#eef2ff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40.5, 198.5, 399, 57);
      text(ctx, 'STRIKE', 56, 212, { size: 7, color: '#ffd166', weight: 600, tracking: 2 });
      text(ctx, 'stop the line in the light', 424, 212, { size: 5.2, color: '#9aa9c9', align: 'right' });
      rect(ctx, 78, 224, 324, 9, '#221a2b');
      rect(ctx, 78, 224, 324, 9, 'rgba(255,255,255,.04)');
      rect(ctx, 216, 222, 48, 13, 'rgba(255,209,102,.22)');
      rect(ctx, 238, 222, 4, 13, '#ffd166');
      const mx = 78 + this.marker * 324;
      rect(ctx, mx - 1.5, 221, 3, 15, '#ff3b5c');
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      rect(ctx, mx - 4, 224, 8, 9, 'rgba(255,59,92,.4)');
      ctx.restore();
      text(ctx, 'A / TAP', 240, 248, { size: 5.5, color: '#8fa9c9', align: 'center', tracking: 1.2 });
      return;
    }
    if (phase === 'act') {
      rect(ctx, 52, 190, 376, 68, 'rgba(5,7,15,.92)');
      ctx.strokeStyle = '#eef2ff'; ctx.lineWidth = 1.5; ctx.strokeRect(52.5, 190.5, 375, 67);
      rect(ctx, 52, 190, 376, 3, '#ffd166');
      const labels = ['REMEMBER', 'REACH OUT', 'MASK OFF', 'BACK'];
      const keys = ['remember', 'reach', 'mask', null];
      for (let i = 0; i < 4; i++) {
        const selected = i === this.subSel;
        const used = keys[i] && this.actsUsed[keys[i]];
        const c = used ? '#58637a' : selected ? '#ffd166' : '#dbe4f8';
        if (selected) heart(ctx, 60, 205 + i * 13, 0.8, '#ff3b5c', false);
        text(ctx, labels[i] + (used ? '  ✓' : ''), 74, 212 + i * 13, { size: 6.8, color: c, tracking: 0.8 });
        if (i === 3) text(ctx, 'B / tap', 420, 212 + i * 13, { size: 5, color: '#8fa9c9', align: 'right' });
      }
      return;
    }
    if (phase === 'item') {
      rect(ctx, 52, 190, 376, 68, 'rgba(5,7,15,.92)');
      ctx.strokeStyle = '#eef2ff'; ctx.lineWidth = 1.5; ctx.strokeRect(52.5, 190.5, 375, 67);
      rect(ctx, 52, 190, 376, 3, '#ffd166');
      const labels = [`COCOA  ×${this.items}`, 'BACK'];
      for (let i = 0; i < 2; i++) {
        const selected = i === this.subSel;
        if (selected) heart(ctx, 60, 205 + i * 13, 0.8, '#ff3b5c', false);
        text(ctx, labels[i], 74, 212 + i * 13, { size: 6.8, color: selected ? '#ffd166' : '#dbe4f8', tracking: 0.8 });
      }
      return;
    }
    // command box
    rect(ctx, 52, 198, 376, 58, 'rgba(5,7,15,.88)');
    ctx.strokeStyle = '#eef2ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(52.5, 198.5, 375, 57);
    rect(ctx, 52, 198, 376, 2.5, '#ffd166');
    const opts = ['FIGHT', 'ACT', 'ITEM', 'SPARE'];
    for (let i = 0; i < 4; i++) {
      const selected = phase === 'menu' && i === this.sel;
      let color = '#dbe4f8';
      if (selected) color = '#ffd166';
      if (i === 3 && this.trust >= 3) color = selected ? '#ffe6a8' : '#8fe3ff';
      const r = this.menuRect(i);
      if (i === 3 && this.trust >= 3) {
        ctx.save();
        ctx.globalAlpha = 0.15 + Math.sin(this.t * 4) * 0.05;
        rect(ctx, r.x, r.y - 3, r.w, r.h, 'rgba(143,227,255,.5)');
        ctx.restore();
      }
      if (selected) {
        heart(ctx, r.x - 2, r.y + 8, 0.9, '#ff3b5c', true);
      }
      text(ctx, opts[i] + (i === 3 && this.trust >= 3 ? ' ★' : ''), r.x + r.w / 2, r.y + 14, {
        size: 8, color, align: 'center', weight: 600, tracking: 1,
      });
    }
    text(ctx, '← →  ·  A / TAP', 240, 248, { size: 4.6, color: '#6e7c99', align: 'center', tracking: 1 });
  }

  drawMessage(ctx) {
    rect(ctx, 34, 190, 412, 68, 'rgba(4,6,13,.94)');
    ctx.strokeStyle = '#eef2ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(34.5, 190.5, 411, 67);
    rect(ctx, 34, 190, 412, 2.5, this.msgColor === '#a9d8ff' ? '#8fe3ff' : '#ffd166');
    const shown = this.message.slice(0, Math.floor(this.msgShown));
    const lines = this.wrap(ctx, shown, 386, 7.2);
    let y = 209;
    for (const l of lines) {
      text(ctx, l, 46, y, { size: 7.2, color: this.msgColor });
      y += 11;
    }
    if (!this.msgTyping) {
      text(ctx, '▼', 428, 250, { size: 6, color: '#ffd166', align: 'right' });
    }
  }

  wrap(ctx, str, maxW, size) {
    ctx.save();
    ctx.font = `400 ${size}px "Pixelify Sans", monospace`;
    const out = [];
    for (const para of str.split('\n')) {
      const words = para.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line) {
          out.push(line);
          line = w;
        } else line = test;
      }
      out.push(line);
    }
    ctx.restore();
    return out.slice(0, 5);
  }

  drawDefense(ctx) {
    const { x, y, w, h } = BOX;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    // box interior
    ctx.fillStyle = 'rgba(2,3,8,.94)';
    ctx.fillRect(x, y, w, h);
    // subtle snow inside
    for (let i = 0; i < 18; i++) {
      const fx = x + ((hash(i * 3.1) * w + this.t * 8) % w);
      const fy = y + ((hash(i * 5.7) * h + this.t * 12) % h);
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#cfe4ff';
      ctx.fillRect(fx, fy, 1, 1);
    }
    ctx.globalAlpha = 1;
    // bullets
    for (const b of this.bullets) {
      const telegraphing = b.telegraph > 0;
      if (telegraphing) {
        ctx.save();
        ctx.globalAlpha = 0.35 + Math.sin(this.t * 30) * 0.15;
        if (b.type === 'ice') {
          rect(ctx, b.x - 1, y + 2, 2, 14, '#ff5d74');
        } else if (b.type === 'snow' || b.type === 'word') {
          const ex = b.x < x + w / 2 ? x + 2 : x + w - 2;
          rect(ctx, ex - (b.x < x + w / 2 ? 0 : 2), b.y - 1, 2, 3, '#ff5d74');
        }
        ctx.restore();
      }
      if (telegraphing) continue;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot || 0);
      if (b.type === 'ice') {
        ctx.shadowColor = '#8fe3ff';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#cbeaff';
        ctx.beginPath();
        ctx.moveTo(0, -b.r * 1.8);
        ctx.lineTo(b.r * 0.8, b.r);
        ctx.lineTo(0, b.r * 0.4);
        ctx.lineTo(-b.r * 0.8, b.r);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-0.8, -b.r, 1.6, b.r * 1.2);
      } else if (b.type === 'ring') {
        ctx.shadowColor = '#8fe3ff';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#a9dcff';
        ctx.beginPath();
        ctx.moveTo(0, -b.r);
        ctx.lineTo(b.r, 0);
        ctx.lineTo(0, b.r);
        ctx.lineTo(-b.r, 0);
        ctx.closePath();
        ctx.fill();
      } else if (b.type === 'word') {
        ctx.shadowColor = '#ff5d74';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#ffb3bf';
        text(ctx, b.label || 'alone', 0, 2, { size: 5.4, color: '#ffb3bf', align: 'center', weight: 600 });
      } else {
        ctx.shadowColor = '#dcecff';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#f2f7ff';
        ctx.beginPath();
        ctx.arc(0, 0, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8fb5e0';
        ctx.beginPath();
        ctx.arc(-1.2, -1.2, b.r * 0.38, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    // soul trail + soul
    drawSoulTrail(ctx, this.soul.x, this.soul.y, this.trail, this.t);
    if (this.invuln > 0 && Math.floor(this.invuln * 14) % 2 === 0) {
      ctx.globalAlpha = 0.35;
      heart(ctx, this.soul.x - 3.5, this.soul.y - 5, 1, '#ff3b5c', false);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // border
    ctx.strokeStyle = this.invuln > 0 ? '#ff8a9d' : '#eef2ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.strokeStyle = 'rgba(143,227,255,.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
    text(ctx, 'MOVE', x + 8, y + h - 6, { size: 4.6, color: '#6e7c99', tracking: 1.2 });
    text(ctx, `${Math.max(0, this.defTimer).toFixed(1)}`, x + w - 8, y + h - 6, { size: 4.6, color: '#6e7c99', align: 'right' });
  }
}
