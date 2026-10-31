// Turn-based battle scene with a Deltarune-style bullet-dodging phase.
import { VIEW_W, VIEW_H, clamp, rand, roundRect, wrapLines } from './engine.js';
import { input } from './engine.js';
import {
  drawChar, drawShadowling, drawPortrait, drawSoul, circle, ellipse, rect,
  line, poly, drawGlow,
} from './art.js';
import { audio } from './audio.js';

const ARENA = { x: 156, y: 126, w: 328, h: 124 };

const ITEMS = {
  pie: { name: 'Butterscotch Pie', heal: 24, all: true, text: 'You share the pie. It tastes like being eight.' },
  tea: { name: 'Golden Tea', heal: 30, all: false, text: 'You drink the tea. It is exactly the right temperature.' },
};

const SETS = {
  grinling: {
    music: 'battle',
    intro: 'A grinling peels itself off the light.',
    bg: 'bright',
    enemies: [{
      id: 'grinling', name: 'GRINLING', hp: 42, atk: 4, def: 0, mercy: 0,
      flavor: 'It grins like it is apologizing.',
      telegraph: 'The grinling opens its mouth. Something falls out.',
      patterns: ['rain'],
      acts: [
        { name: 'Smile back', mercy: 45, tp: 12, text: 'You smile back. It hesitates, then smiles smaller.' },
        { name: 'Check', text: 'GRINLING — ATK 4 DEF 0. A smile that forgot who it was for.' },
      ],
    }],
  },
  hush: {
    music: 'battle',
    intro: 'Something tall and quiet steps onto the path.',
    bg: 'bright',
    enemies: [{
      id: 'hush', name: 'HUSH', hp: 58, atk: 5, def: 1, mercy: 0,
      flavor: 'It is waiting for you to say it again.',
      telegraph: 'The hush leans in. It wants you to say it again.',
      patterns: ['sweep', 'rain'],
      acts: [
        { name: 'Hum along', mercy: 40, tp: 12, text: 'You hum a song you do not remember learning. It joins in, badly.' },
        { name: 'Check', text: 'HUSH — ATK 5 DEF 1. It has been holding its breath for years.' },
      ],
    }],
  },
  reflection: {
    music: 'boss',
    intro: 'The door is gone. There is only the mirror, and the mirror is you.',
    bg: 'mirror',
    boss: true,
    enemies: [{
      id: 'reflection', name: 'THE REFLECTION', hp: 150, atk: 6, def: 1, mercy: 0,
      flavor: 'It wears your face. It is not doing it well.',
      telegraph: 'The reflection says the thing you keep thinking.',
      patterns: ['spiral', 'rain', 'mix'],
      acts: [
        { name: 'Look away', mercy: 35, tp: 10, text: 'You look at the floor. The reflection waits. It is patient. It is you.' },
        { name: 'Forgive', mercy: 40, tp: 10, text: 'You try to forgive it. Your voice shakes. It counts.' },
        { name: 'Check', text: 'THE REFLECTION — ATK 6 DEF 1. It is not a demon. It is a boy who stayed.' },
      ],
    }],
  },
};

const COMMANDS = ['FIGHT', 'ACT', 'MAGIC', 'ITEM', 'SPARE', 'DEFEND'];

export class BattleScene {
  constructor(game, setKey, onWin) {
    this.game = game;
    this.set = SETS[setKey] || SETS.grinling;
    this.onWin = onWin;
    this.world = game.scene;
    this.party = game.party;
    this.tp = game.tp ?? 40;
    this.enemies = this.set.enemies.map((e) => ({ ...e, maxhp: e.hp, acts: e.acts.slice() }));
    this.mode = 'idle';
    this.msg = null;
    this.list = null;
    this.timing = null;
    this.dodge = null;
    this.targeting = null;
    this.actions = [];
    this.round = 0;
    this.t = 0;
    this.done = false;
    this.shake = 0;
    this.flash = 0;
    this.hitFlash = 0;
    this.waits = [];
    this.gameOverTimer = 0;
    this.result = 'win';
  }

  enter() {
    audio.playMusic(this.set.music);
    this.run();
  }

  aliveParty() {
    return this.party.filter((p) => p.hp > 0);
  }

  aliveEnemies() {
    return this.enemies.filter((e) => e.hp > 0);
  }

  wait(sec) {
    return new Promise((res) => this.waits.push({ t: sec, res }));
  }

  say(text, speaker = null, auto = 1.65) {
    return new Promise((res) => {
      this.msg = { text, chars: 0, speaker, timer: auto };
      this.msgResolve = res;
      this.mode = 'message';
    });
  }

  menu(items, opts = {}) {
    return new Promise((res) => {
      this.list = {
        items,
        idx: opts.idx || 0,
        cols: opts.cols || 1,
        x: opts.x ?? 386,
        y: opts.y ?? 274,
        w: opts.w ?? 150,
        h: opts.h ?? 20,
        title: opts.title || '',
        cancel: opts.cancel !== false,
        grid: opts.cols === 2,
      };
      this.listResolve = res;
      this.mode = 'list';
    });
  }

  async run() {
    this.mode = 'idle';
    await this.wait(0.5);
    await this.say(this.set.intro);
    if (this.done) return;

    while (!this.done) {
      this.actions = [];
      for (const member of this.party) {
        if (member.hp <= 0) continue;
        const action = await this.choose(member);
        if (this.done) return;
        if (action) this.actions.push(action);
      }
      await this.resolveActions();
      if (this.done) return;

      if (this.enemies.every((e) => e.hp <= 0)) {
        await this.finish();
        return;
      }

      await this.enemyPhase();
      if (this.done) return;
      if (this.mode === 'gameover') return;
      this.round++;
      this.game.tp = this.tp;
    }
  }

  async choose(member) {
    while (!this.done) {
      const idx = await this.menu(COMMANDS, {
        cols: 2, x: 386, y: 286, w: 118, h: 21, title: member.name, cancel: false,
      });
      const cmd = COMMANDS[idx];
      if (!cmd) continue;

      if (cmd === 'FIGHT') {
        const target = await this.chooseTarget();
        if (!target) continue;
        const mult = await this.timingBar();
        if (mult === null) continue;
        return { type: 'fight', actor: member, target, mult };
      }

      if (cmd === 'ACT') {
        const target = await this.chooseTarget();
        if (!target) continue;
        const names = target.acts.map((a) => a.name);
        const ai = await this.menu(names, { cols: 1, x: 386, y: 276, w: 150, title: 'ACT' });
        if (ai < 0) continue;
        return { type: 'act', actor: member, target, act: target.acts[ai] };
      }

      if (cmd === 'MAGIC') {
        const spell = member.spell;
        if (!spell) continue;
        if (this.tp < spell.cost) {
          await this.say(`Not enough TP. ${spell.name} costs ${spell.cost}.`);
          continue;
        }
        return { type: 'magic', actor: member, spell };
      }

      if (cmd === 'ITEM') {
        const entries = Object.entries(this.game.items).filter(([, n]) => n > 0);
        if (!entries.length) {
          await this.say('Your pockets are full of lint and one very cold hand.');
          continue;
        }
        const names = entries.map(([k, n]) => `${ITEMS[k].name} x${n}`);
        const ii = await this.menu(names, { cols: 1, x: 386, y: 276, w: 170, title: 'ITEM' });
        if (ii < 0) continue;
        return { type: 'item', actor: member, key: entries[ii][0] };
      }

      if (cmd === 'SPARE') {
        if (this.enemies.every((e) => e.mercy >= 100 || e.hp <= 0)) {
          return { type: 'spare', actor: member };
        }
        await this.say('You cannot spare it yet. Its grin is still holding on.');
        continue;
      }

      if (cmd === 'DEFEND') {
        return { type: 'defend', actor: member };
      }
    }
    return null;
  }

  chooseTarget() {
    const alive = this.aliveEnemies();
    if (alive.length <= 1) return Promise.resolve(alive[0] || null);
    return new Promise((res) => {
      this.targeting = { idx: 0, res };
      this.mode = 'target';
    });
  }

  timingBar() {
    return new Promise((res) => {
      this.timing = { pos: 0, dir: 1, speed: 1.7 };
      this.timingResolve = res;
      this.mode = 'timing';
    });
  }

  async resolveActions() {
    for (const a of this.actions) {
      if (this.done) return;
      if (a.actor.hp <= 0) continue;

      if (a.type === 'fight') {
        if (a.target.hp <= 0) continue;
        const dmg = Math.max(1, Math.round(a.actor.atk * a.mult * (1 - a.target.def * 0.04)));
        a.target.hp = Math.max(0, a.target.hp - dmg);
        a.target.hit = 0.35;
        this.hitFlash = 0.18;
        this.shake = 5;
        audio.hit();
        const praise = a.mult > 1.75 ? ' Perfect!' : a.mult > 1.25 ? ' Nice!' : '';
        await this.say(`${a.actor.name} strikes ${a.target.name} for ${dmg}.${praise}`, a.actor.name, 1.35);
        if (a.target.hp <= 0) {
          await this.say(`${a.target.name} comes apart into quiet.`, null, 1.6);
        }
      } else if (a.type === 'act') {
        a.target.mercy = clamp(a.target.mercy + a.act.mercy, 0, 100);
        this.tp = clamp(this.tp + (a.act.tp || 8), 0, 100);
        audio.select();
        await this.say(a.act.text, a.actor.name, 1.85);
        if (a.target.mercy >= 100) {
          await this.say(`${a.target.name} has stopped smiling so hard. You could SPARE it now.`, null, 1.75);
        }
      } else if (a.type === 'magic') {
        const sp = a.spell;
        this.tp = clamp(this.tp - sp.cost, 0, 100);
        if (sp.kind === 'heal') {
          audio.heal();
          for (const p of this.party) {
            if (p.hp > 0) p.hp = Math.min(p.maxhp, p.hp + 16);
          }
          await this.say('Chris prays. Warm light settles over everyone. +16 HP', a.actor.name, 1.75);
        } else if (sp.kind === 'quiet') {
          for (const e of this.aliveEnemies()) e.mercy = clamp(e.mercy + 30, 0, 100);
          audio.select();
          await this.say('Srif goes quiet. The room gets quieter with him. Mercy up.', a.actor.name, 1.75);
        } else if (sp.kind === 'roar') {
          audio.hit();
          this.shake = 8;
          for (const e of this.aliveEnemies()) e.hp = Math.max(0, e.hp - 16);
          await this.say('Mich roars. It is not a scary roar. It is a tired one. 16 damage.', a.actor.name, 1.6);
        }
      } else if (a.type === 'item') {
        const item = ITEMS[a.key];
        if (!this.game.items[a.key]) continue;
        this.game.items[a.key]--;
        audio.heal();
        if (item.all) {
          for (const p of this.party) if (p.hp > 0) p.hp = Math.min(p.maxhp, p.hp + item.heal);
        } else {
          const hurt = this.party.filter((p) => p.hp > 0).sort((x, y) => x.hp / x.maxhp - y.hp / y.maxhp)[0];
          if (hurt) hurt.hp = Math.min(hurt.maxhp, hurt.hp + item.heal);
        }
        await this.say(item.text, null, 1.6);
      } else if (a.type === 'spare') {
        audio.select();
        for (const e of this.enemies) {
          if (e.hp > 0) {
            e.hp = 0;
            e.spared = true;
            await this.say(`You spare ${e.name}. It lets go of the shape it was making.`, null, 1.75);
          }
        }
      } else if (a.type === 'defend') {
        a.actor.defending = true;
        this.tp = clamp(this.tp + 18, 0, 100);
        audio.select();
        await this.say(`${a.actor.name} braces. TP +18.`, null, 1.35);
      }
    }
  }

  async enemyPhase() {
    for (const p of this.party) p.defending = false;
    for (const enemy of this.aliveEnemies()) {
      if (this.done) return;
      await this.say(enemy.telegraph, null, 1.6);
      if (this.done) return;
      await this.dodgePhase(enemy);
      if (this.done) return;
      if (this.party.every((p) => p.hp <= 0)) {
        this.gameOver();
        return;
      }
    }
    if (this.tp < 100) this.tp = clamp(this.tp + 4, 0, 100);
  }

  dodgePhase(enemy) {
    return new Promise((res) => {
      this.dodge = {
        enemy,
        t: this.set.boss ? 7.2 : 5.2,
        max: this.set.boss ? 7.2 : 5.2,
        heart: { x: ARENA.x + ARENA.w / 2, y: ARENA.y + ARENA.h / 2 },
        bullets: [],
        spawn: 0.35,
        iframe: 0.7,
        hits: 0,
        pattern: enemy.patterns[0],
        patternIdx: 0,
        angle: 0,
        rot: 0,
      };
      this.dodgeResolve = res;
      this.mode = 'dodge';
    });
  }

  damageParty(amount) {
    const alive = this.aliveParty();
    for (const p of alive) {
      const reduced = p.defending ? Math.ceil(amount * 0.5) : amount;
      p.hp = Math.max(0, p.hp - reduced);
    }
    this.tp = clamp(this.tp + 6, 0, 100);
    this.hitFlash = 0.5;
    this.shake = 8;
    audio.hurt();
  }

  spawnBullet(d, x, y, vx, vy, r, type) {
    d.bullets.push({ x, y, vx, vy, r, type, rot: rand(0, Math.PI) });
  }

  updateDodge(dt) {
    const d = this.dodge;
    if (!d) return;
    d.t -= dt;
    d.iframe -= dt;
    d.rot += dt;
    const heart = d.heart;
    const speed = 98;
    const ax = input.axis();
    heart.x = clamp(heart.x + ax.x * speed * dt, ARENA.x + 10, ARENA.x + ARENA.w - 10);
    heart.y = clamp(heart.y + ax.y * speed * dt, ARENA.y + 10, ARENA.y + ARENA.h - 10);

    d.spawn -= dt;
    if (d.spawn <= 0) {
      const p = d.pattern;
      if (p === 'rain') {
        d.spawn = 0.34;
        const x = rand(ARENA.x + 14, ARENA.x + ARENA.w - 14);
        this.spawnBullet(d, x, ARENA.y + 4, rand(-8, 8), rand(58, 84), 4, 'tear');
      } else if (p === 'sweep') {
        d.spawn = 0.5;
        const fromLeft = Math.random() > 0.5;
        const y = rand(ARENA.y + 14, ARENA.y + ARENA.h - 14);
        this.spawnBullet(d, fromLeft ? ARENA.x + 4 : ARENA.x + ARENA.w - 4, y, fromLeft ? 92 : -92, 0, 5, 'shard');
      } else if (p === 'spiral') {
        d.spawn = 0.14;
        d.angle += 0.55;
        const cx = ARENA.x + ARENA.w / 2;
        const cy = ARENA.y + ARENA.h / 2;
        for (let i = 0; i < 2; i++) {
          const a = d.angle + i * Math.PI;
          this.spawnBullet(d, cx + Math.cos(a) * 12, cy + Math.sin(a) * 12, Math.cos(a) * 66, Math.sin(a) * 66, 4, 'shard');
        }
      } else if (p === 'mix') {
        d.spawn = 0.26;
        if (Math.random() > 0.5) {
          const x = rand(ARENA.x + 14, ARENA.x + ARENA.w - 14);
          this.spawnBullet(d, x, ARENA.y + 4, 0, rand(60, 80), 4, 'tear');
        } else {
          const y = rand(ARENA.y + 14, ARENA.y + ARENA.h - 14);
          this.spawnBullet(d, ARENA.x + 4, y, 86, 0, 4, 'tear');
        }
      }
    }

    // pattern changes over time for the boss
    if (this.set.boss) {
      const progress = 1 - d.t / d.max;
      const idx = Math.min(d.enemy.patterns.length - 1, Math.floor(progress * d.enemy.patterns.length));
      if (idx !== d.patternIdx) {
        d.patternIdx = idx;
        d.pattern = d.enemy.patterns[idx];
        d.spawn = 0.25;
      }
    }

    // bullets
    for (const b of d.bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += dt * 2;
    }
    d.bullets = d.bullets.filter((b) =>
      b.x > ARENA.x - 24 && b.x < ARENA.x + ARENA.w + 24 &&
      b.y > ARENA.y - 24 && b.y < ARENA.y + ARENA.h + 24);

    // collisions + grazing
    for (const b of d.bullets) {
      const dd = Math.hypot(b.x - heart.x, b.y - heart.y);
      if (dd < b.r + 4) {
        if (d.iframe <= 0) {
          d.iframe = 1.0;
          d.hits++;
          this.damageParty(d.enemy.atk + (Math.random() > 0.6 ? 1 : 0));
          b.dead = true;
        }
      } else if (dd < b.r + 14) {
        this.tp = clamp(this.tp + 7 * dt, 0, 100);
      }
    }
    d.bullets = d.bullets.filter((b) => !b.dead);

    if (d.t <= 0) {
      const hits = d.hits;
      this.dodge = null;
      this.mode = 'idle';
      const resolve = this.dodgeResolve;
      this.dodgeResolve = null;
      if (hits > 0) this.say(`You took ${hits} hit${hits > 1 ? 's' : ''}.`, null, 1.25).then(resolve);
      else {
        this.tp = clamp(this.tp + 8, 0, 100);
        this.say('You did not get hit. TP +8.', null, 1.25).then(resolve);
      }
    }
  }

  gameOver() {
    this.mode = 'gameover';
    this.gameOverTimer = 0.6;
    audio.stopMusic();
  }

  retry() {
    for (const p of this.party) p.hp = p.maxhp;
    for (const e of this.enemies) {
      e.hp = e.maxhp;
      e.mercy = 0;
      e.spared = false;
    }
    this.tp = 50;
    this.done = false;
    this.mode = 'idle';
    this.actions = [];
    this.msg = null;
    this.list = null;
    this.dodge = null;
    this.round = 0;
    this.game.tp = 50;
    audio.playMusic(this.set.music);
    this.run();
  }

  async finish() {
    this.done = true;
    this.mode = 'idle';
    const spared = this.enemies.every((e) => e.spared);
    this.result = spared ? 'spare' : 'win';
    if (spared) {
      audio.heal();
      await this.say('You spared it. The light is quieter now.', null, 1.75);
      for (const p of this.party) if (p.hp > 0) p.hp = Math.min(p.maxhp, p.hp + 8);
    } else {
      await this.say('YOU WON! Everyone catches their breath.', null, 1.75);
    }
    this.game.tp = this.tp;
    this.game.fadeTo(() => {
      this.game.setScene(this.world, false);
      if (this.onWin) this.onWin(this.result);
    });
  }

  update(dt) {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt * 22);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 2.5);
    for (const e of this.enemies) if (e.hit) e.hit = Math.max(0, e.hit - dt);

    for (const w of this.waits.slice()) {
      w.t -= dt;
      if (w.t <= 0) {
        this.waits.splice(this.waits.indexOf(w), 1);
        w.res();
      }
    }

    if (this.mode === 'message' && this.msg) {
      const len = this.msg.text.length;
      if (this.msg.chars < len) {
        this.msg.chars = Math.min(len, this.msg.chars + dt * 75);
        if (input.wasPressed('confirm')) this.msg.chars = len;
      } else {
        this.msg.timer -= dt;
        if (input.wasPressed('confirm') || this.msg.timer <= 0) {
          const r = this.msgResolve;
          this.msgResolve = null;
          this.msg = null;
          this.mode = 'idle';
          if (r) r();
        }
      }
      return;
    }

    if (this.mode === 'list' && this.list) {
      const l = this.list;
      const n = l.items.length;
      let moved = false;
      if (l.grid) {
        if (input.wasPressed('left') && l.idx % 2 === 1) { l.idx--; moved = true; }
        if (input.wasPressed('right') && l.idx % 2 === 0 && l.idx + 1 < n) { l.idx++; moved = true; }
        if (input.wasPressed('up') && l.idx - 2 >= 0) { l.idx -= 2; moved = true; }
        if (input.wasPressed('down') && l.idx + 2 < n) { l.idx += 2; moved = true; }
      } else {
        if (input.wasPressed('up')) { l.idx = (l.idx - 1 + n) % n; moved = true; }
        if (input.wasPressed('down')) { l.idx = (l.idx + 1) % n; moved = true; }
      }
      if (moved) audio.move();
      if (input.wasPressed('confirm')) {
        audio.select();
        const r = this.listResolve;
        this.listResolve = null;
        const idx = l.idx;
        this.list = null;
        this.mode = 'idle';
        if (r) r(idx);
        return;
      }
      if (input.wasPressed('cancel') && l.cancel) {
        audio.cancel();
        const r = this.listResolve;
        this.listResolve = null;
        this.list = null;
        this.mode = 'idle';
        if (r) r(-1);
        return;
      }
      return;
    }

    if (this.mode === 'target' && this.targeting) {
      const alive = this.aliveEnemies();
      if (input.wasPressed('left')) { this.targeting.idx = (this.targeting.idx - 1 + alive.length) % alive.length; audio.move(); }
      if (input.wasPressed('right')) { this.targeting.idx = (this.targeting.idx + 1) % alive.length; audio.move(); }
      if (input.wasPressed('confirm')) {
        audio.select();
        const r = this.targeting.res;
        const target = alive[this.targeting.idx];
        this.targeting = null;
        this.mode = 'idle';
        r(target);
        return;
      }
      if (input.wasPressed('cancel')) {
        audio.cancel();
        const r = this.targeting.res;
        this.targeting = null;
        this.mode = 'idle';
        r(null);
        return;
      }
      return;
    }

    if (this.mode === 'timing' && this.timing) {
      const t = this.timing;
      t.pos += t.dir * t.speed * dt;
      if (t.pos >= 1) { t.pos = 1; t.dir = -1; }
      if (t.pos <= 0) { t.pos = 0; t.dir = 1; }
      if (input.wasPressed('confirm')) {
        const acc = 1 - Math.abs(t.pos - 0.5) * 2;
        const mult = 0.55 + acc * 1.45;
        audio.hit();
        const r = this.timingResolve;
        this.timingResolve = null;
        this.timing = null;
        this.mode = 'idle';
        r(mult);
        return;
      }
      return;
    }

    if (this.mode === 'dodge') {
      this.updateDodge(dt);
      return;
    }

    if (this.mode === 'gameover') {
      this.gameOverTimer -= dt;
      if (this.gameOverTimer <= 0 && input.wasPressed('confirm')) {
        audio.select();
        this.retry();
      }
      return;
    }
  }

  // ------------------------------------------------------------------ draw

  draw(ctx) {
    const shake = this.shake;
    ctx.save();
    if (shake > 0.2) ctx.translate(rand(-shake, shake), rand(-shake, shake));

    this.drawBackground(ctx);
    this.drawEnemies(ctx);
    this.drawHud(ctx);
    this.drawArena(ctx);
    if (this.mode === 'idle' || this.mode === 'list') this.drawArenaFlavor(ctx);

    if (this.mode === 'message' && this.msg) this.drawMessage(ctx);
    if (this.mode === 'dodge' && this.dodge) this.drawDodge(ctx);
    if (this.mode === 'timing' && this.timing) this.drawTiming(ctx);
    if (this.mode === 'target' && this.targeting) this.drawTarget(ctx);
    if (this.mode === 'list' && this.list) this.drawList(ctx);

    this.drawParty(ctx);
    ctx.restore();

    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(255, 70, 90, ${this.hitFlash * 0.35})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    if (this.mode === 'gameover') this.drawGameOver(ctx);
  }

  drawBackground(ctx) {
    const mirror = this.set.bg === 'mirror';
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    if (mirror) {
      g.addColorStop(0, '#191326');
      g.addColorStop(0.55, '#2a1d3a');
      g.addColorStop(1, '#120d1c');
    } else {
      g.addColorStop(0, '#fff6fb');
      g.addColorStop(0.5, '#ffe6ef');
      g.addColorStop(1, '#ffd8c8');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    if (mirror) {
      // shattered glass field
      ctx.strokeStyle = 'rgba(190, 200, 255, 0.09)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        ctx.moveTo((i * 71) % VIEW_W, 0);
        ctx.lineTo(((i * 131) + 90) % VIEW_W, VIEW_H);
        ctx.stroke();
      }
      for (let i = 0; i < 22; i++) {
        const x = (i * 97 + 30) % VIEW_W;
        const y = (i * 53 + 40) % 130;
        ctx.fillStyle = 'rgba(200, 210, 255, 0.12)';
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(i);
        ctx.fillRect(-4, -4, 8, 8);
        ctx.restore();
      }
      drawGlow(ctx, 320, 110, 140, 'rgba(160, 140, 255, 0.12)');
    } else {
      for (let i = 0; i < 8; i++) {
        const x = (i * 89 + 40) % VIEW_W;
        const y = 30 + (i * 41) % 110;
        const bob = Math.sin(this.t * 1.2 + i) * 4;
        ctx.strokeStyle = ['#ffc6d9', '#bde8ff', '#ffe6a7', '#d6c6ff'][i % 4];
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y + bob, 9 + (i % 3) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawGlow(ctx, 320, 80, 160, 'rgba(255, 255, 255, 0.5)');
    }
  }

  drawEnemies(ctx) {
    const alive = this.aliveEnemies();
    const n = Math.max(1, alive.length);
    for (let i = 0; i < alive.length; i++) {
      const e = alive[i];
      const x = 320 + (i - (n - 1) / 2) * 120;
      const y = 116;
      const bob = Math.sin(this.t * 2.2 + i) * 2;
      ctx.save();
      ctx.translate(x + (e.hit ? rand(-4, 4) : 0), y + bob);
      if (e.id === 'reflection') {
        ctx.scale(1.35, 1.35);
        drawShadowling(ctx, 'reflection', 0, 0, this.t);
      } else {
        drawShadowling(ctx, e.id, 0, 0, this.t);
      }
      ctx.restore();

      // name + bars
      const bw = 96;
      ctx.font = 'bold 9px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = this.set.bg === 'mirror' ? '#e8e2ff' : '#5a3a48';
      ctx.fillText(e.name, x, 46);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(x - bw / 2, 52, bw, 5);
      ctx.fillStyle = this.set.bg === 'mirror' ? '#c3b0ff' : '#ff8aa8';
      ctx.fillRect(x - bw / 2, 52, bw * (e.hp / e.maxhp), 5);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x - bw / 2, 59, bw, 3);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(x - bw / 2, 59, bw * (e.mercy / 100), 3);
      ctx.textAlign = 'left';
    }
  }

  drawHud(ctx) {
    const mirror = this.set.bg === 'mirror';
    // TP
    ctx.font = 'bold 8px ui-monospace, monospace';
    ctx.fillStyle = mirror ? '#cfc4ff' : '#7a5a66';
    ctx.fillText('TP', 512, 22);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    roundRect(ctx, 532, 14, 88, 8, 4);
    ctx.fill();
    const tg = ctx.createLinearGradient(532, 0, 620, 0);
    tg.addColorStop(0, '#ffd166');
    tg.addColorStop(1, '#ff9f6e');
    ctx.fillStyle = tg;
    roundRect(ctx, 532, 14, 88 * (this.tp / 100), 8, 4);
    ctx.fill();

    // round
    ctx.fillStyle = mirror ? 'rgba(220,210,255,0.5)' : 'rgba(90,60,72,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText(`ROUND ${this.round + 1}`, 620, 34);
    ctx.textAlign = 'left';
  }

  drawArena(ctx) {
    const mirror = this.set.bg === 'mirror';
    ctx.save();
    ctx.fillStyle = mirror ? 'rgba(8, 6, 16, 0.82)' : 'rgba(20, 16, 30, 0.78)';
    roundRect(ctx, ARENA.x, ARENA.y, ARENA.w, ARENA.h, 6);
    ctx.fill();
    ctx.strokeStyle = mirror ? 'rgba(210, 200, 255, 0.85)' : 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    roundRect(ctx, ARENA.x, ARENA.y, ARENA.w, ARENA.h, 6);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    roundRect(ctx, ARENA.x + 4, ARENA.y + 4, ARENA.w - 8, ARENA.h - 8, 4);
    ctx.stroke();
    ctx.restore();
  }

  drawArenaFlavor(ctx) {
    const alive = this.aliveEnemies();
    if (!alive.length) return;
    const mirror = this.set.bg === 'mirror';
    const e = alive[0];
    const flavor = e.spared ? 'It has let go. It is resting.' : e.flavor;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillStyle = mirror ? 'rgba(232, 226, 255, 0.9)' : 'rgba(250, 244, 248, 0.92)';
    const lines = wrapLines(ctx, flavor, ARENA.w - 48);
    let y = ARENA.y + 46 - (lines.length - 1) * 7;
    for (const l of lines) {
      ctx.fillText(l, ARENA.x + ARENA.w / 2, y);
      y += 14;
    }
    const who = this.mode === 'list' && this.list
      && this.party.some((p) => p.name === this.list.title)
      ? this.list.title : null;
    if (who) {
      const pulse = 0.72 + Math.sin(this.t * 3) * 0.14;
      ctx.font = 'bold 10px ui-monospace, monospace';
      ctx.fillStyle = `rgba(255, 209, 102, ${pulse})`;
      ctx.fillText(`What will ${who} do?`, ARENA.x + ARENA.w / 2, ARENA.y + ARENA.h - 24);
    }
    ctx.restore();
  }

  drawMessage(ctx) {
    const m = this.msg;
    if (!m) return;
    const shown = m.text.slice(0, Math.floor(m.chars));
    ctx.font = '12px ui-monospace, monospace';
    const lines = wrapLines(ctx, shown, ARENA.w - 36);
    ctx.fillStyle = '#f2f6ff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let y = ARENA.y + 18;
    for (const l of lines) {
      ctx.fillText(l, ARENA.x + 18, y);
      y += 16;
    }
    if (m.chars >= m.text.length) {
      const bob = Math.sin(this.t * 6) * 1.5;
      ctx.fillStyle = 'rgba(255, 209, 102, 0.9)';
      const ax = ARENA.x + ARENA.w - 20;
      const ay = ARENA.y + ARENA.h - 16 + bob;
      ctx.beginPath();
      ctx.moveTo(ax - 4, ay - 3);
      ctx.lineTo(ax + 4, ay - 3);
      ctx.lineTo(ax, ay + 4);
      ctx.fill();
    }
    ctx.textBaseline = 'alphabetic';
  }

  drawDodge(ctx) {
    const d = this.dodge;
    if (!d) return;
    for (const b of d.bullets) {
      if (b.type === 'tear') {
        circle(ctx, b.x, b.y, b.r, '#8fd4ff');
        circle(ctx, b.x - 1, b.y - 1, b.r * 0.45, 'rgba(255,255,255,0.75)');
      } else {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = '#ffb3c8';
        ctx.beginPath();
        ctx.moveTo(0, -b.r - 1);
        ctx.lineTo(b.r, 0);
        ctx.lineTo(0, b.r + 1);
        ctx.lineTo(-b.r, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    drawSoul(ctx, d.heart.x, d.heart.y, 9, d.iframe > 0 ? 'rgba(255, 120, 150, 0.55)' : '#ff4d6d');
    // timer bar
    const w = ARENA.w - 24;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(ARENA.x + 12, ARENA.y + ARENA.h - 9, w, 3);
    ctx.fillStyle = 'rgba(255, 209, 102, 0.7)';
    ctx.fillRect(ARENA.x + 12, ARENA.y + ARENA.h - 9, w * (d.t / d.max), 3);
  }

  drawTiming(ctx) {
    const t = this.timing;
    const bx = ARENA.x + 40;
    const by = ARENA.y + 52;
    const bw = ARENA.w - 80;
    const bh = 18;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, bx, by, bw, bh, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, bw, bh, 4);
    ctx.stroke();
    // sweet spot
    ctx.fillStyle = 'rgba(255, 209, 102, 0.22)';
    ctx.fillRect(bx + bw * 0.5 - 10, by + 2, 20, bh - 4);
    ctx.fillStyle = 'rgba(255, 209, 102, 0.5)';
    ctx.fillRect(bx + bw * 0.5 - 2, by + 2, 4, bh - 4);
    // cursor
    const cx = bx + t.pos * bw;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 2, by - 4, 4, bh + 8);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '9px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS Z AT THE CENTER', ARENA.x + ARENA.w / 2, by + 40);
    ctx.textAlign = 'left';
  }

  drawTarget(ctx) {
    const alive = this.aliveEnemies();
    const t = this.targeting;
    if (!t || !alive.length) return;
    const e = alive[t.idx];
    const n = alive.length;
    const i = alive.indexOf(e);
    const x = 320 + (i - (n - 1) / 2) * 120;
    const bob = Math.sin(this.t * 8) * 3;
    poly(ctx, [[x - 6, 68 + bob], [x + 6, 68 + bob], [x, 78 + bob]], '#ffd166');
    ctx.font = '9px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd166';
    ctx.fillText('TARGET', x, 62 + bob);
    ctx.textAlign = 'left';
  }

  drawList(ctx) {
    const l = this.list;
    if (!l) return;
    if (l.title) {
      ctx.font = 'bold 9px ui-monospace, monospace';
      ctx.fillStyle = 'rgba(235, 242, 255, 0.75)';
      ctx.fillText(l.title, l.x, l.y - 8);
    }
    if (l.grid) {
      const gapX = 6;
      const gapY = 4;
      for (let i = 0; i < l.items.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = l.x + col * (l.w + gapX);
        const y = l.y + row * (l.h + gapY);
        const sel = i === l.idx;
        ctx.fillStyle = sel ? 'rgba(255, 209, 102, 0.22)' : 'rgba(12, 16, 30, 0.55)';
        roundRect(ctx, x, y, l.w, l.h, 3);
        ctx.fill();
        ctx.strokeStyle = sel ? 'rgba(255, 209, 102, 0.9)' : 'rgba(220, 232, 255, 0.28)';
        ctx.lineWidth = 1;
        roundRect(ctx, x + 0.5, y + 0.5, l.w - 1, l.h - 1, 3);
        ctx.stroke();
        ctx.font = 'bold 9px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = sel ? '#ffe6ad' : 'rgba(230, 238, 255, 0.75)';
        ctx.fillText(l.items[i], x + l.w / 2, y + l.h / 2 + 0.5);
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    } else {
      for (let i = 0; i < l.items.length; i++) {
        const y = l.y + i * (l.h + 3);
        const sel = i === l.idx;
        ctx.fillStyle = sel ? 'rgba(255, 209, 102, 0.2)' : 'rgba(12, 16, 30, 0.6)';
        roundRect(ctx, l.x, y, l.w, l.h, 3);
        ctx.fill();
        ctx.strokeStyle = sel ? 'rgba(255, 209, 102, 0.9)' : 'rgba(220, 232, 255, 0.25)';
        ctx.lineWidth = 1;
        roundRect(ctx, l.x + 0.5, y + 0.5, l.w - 1, l.h - 1, 3);
        ctx.stroke();
        ctx.font = '9px ui-monospace, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = sel ? '#ffe6ad' : 'rgba(230, 238, 255, 0.8)';
        ctx.fillText((sel ? '> ' : '  ') + l.items[i], l.x + 8, y + l.h / 2 + 0.5);
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  }

  drawParty(ctx) {
    for (let i = 0; i < this.party.length; i++) {
      const p = this.party[i];
      const x = 10 + i * 124;
      const y = 284;
      const w = 118;
      const h = 66;
      const active = this.mode === 'list' && this.list && this.list.title === p.name;
      ctx.fillStyle = active ? 'rgba(255, 209, 102, 0.14)' : 'rgba(10, 14, 26, 0.62)';
      roundRect(ctx, x, y, w, h, 5);
      ctx.fill();
      ctx.strokeStyle = active ? 'rgba(255, 209, 102, 0.85)' : 'rgba(220, 232, 255, 0.28)';
      ctx.lineWidth = 1.2;
      roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 5);
      ctx.stroke();

      drawPortrait(ctx, p.id, x + 5, y + 5, 30, p.hp <= 0 ? 'sad' : 'normal');
      ctx.font = 'bold 8px ui-monospace, monospace';
      ctx.fillStyle = p.hp <= 0 ? 'rgba(220, 228, 245, 0.35)' : '#e9efff';
      ctx.fillText(p.name, x + 41, y + 14);
      const hpw = 70;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + 41, y + 21, hpw, 5);
      const ratio = p.hp / p.maxhp;
      ctx.fillStyle = ratio > 0.5 ? '#7fe08a' : ratio > 0.22 ? '#ffd166' : '#ff6b7d';
      ctx.fillRect(x + 41, y + 21, hpw * ratio, 5);
      ctx.font = '7px ui-monospace, monospace';
      ctx.fillStyle = p.hp <= 0 ? 'rgba(220, 228, 245, 0.3)' : 'rgba(220, 228, 245, 0.65)';
      ctx.fillText(`${p.hp}/${p.maxhp}`, x + 41, y + 34);
      if (p.hp <= 0) {
        ctx.fillStyle = 'rgba(255, 120, 140, 0.8)';
        ctx.font = 'bold 7px ui-monospace, monospace';
        ctx.fillText('DOWN', x + 41, y + 47);
      }
    }
  }

  drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(5, 6, 12, 0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2f6ff';
    ctx.font = 'bold 20px ui-monospace, monospace';
    ctx.fillText('BUT IT REFUSED.', 320, 150);
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(220, 228, 245, 0.7)';
    ctx.fillText('The Novella is not done with you yet.', 320, 176);
    const a = 0.55 + Math.sin(this.t * 4) * 0.3;
    ctx.fillStyle = `rgba(255, 209, 102, ${a})`;
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText('PRESS Z / TAP A TO TRY AGAIN', 320, 226);
    ctx.textAlign = 'left';
  }
}
