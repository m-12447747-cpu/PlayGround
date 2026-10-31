// world.js — overworld, camera, collisions, weather, prompts.
import { MAPS } from './maps.js';
import { buildMap } from './artmap.js';
import { drawActor, shadow, heart, text, rr, rect, ellipse, glow, snowflake } from './art.js';
import { createSnow, updateSnow, drawSnow } from './artscene.js';

const W = 480;
const H = 270;

export class World {
  constructor(g) {
    this.g = g;
    this.mapId = null;
    this.map = null;
    this.bg = null;
    this.player = { x: 0, y: 0, dir: 'down', moving: false, anim: 0, skin: 'srif', expr: 'neutral', stepAcc: 0 };
    this.npcs = [];
    this.camera = { x: W / 2, y: H / 2 };
    this.zoom = 1;
    this.focus = null;
    this.shakeAmt = 0;
    this.shakeTime = 0;
    this.tension = 0;
    this.fade = 0;
    this.fadeAnim = null;
    this.transitioning = false;
    this.snow = createSnow(150);
    this.snowIntensity = 1;
    this.footprints = [];
    this.footTimer = 0;
    this.prompt = null;
    this.cooldown = 0;
    this.walkers = [];
    this.interactables = [];
    this.motes = [];
    this.flash = 0;
    this.flashColor = '#ffffff';
    this.storm = false;
    this.ambientTime = 0;
    this._zoneLock = false;
  }

  leave() {
    this.mapId = null;
    this.map = null;
    this.bg = null;
    this.npcs = [];
    this.player.moving = false;
  }

  load(id, spawn, opt = {}) {
    const g = this.g;
    this.mapId = id;
    this.map = MAPS[id];
    this.bg = buildMap(id);
    const s = spawn || this.map.spawn;
    this.player.x = s.x;
    this.player.y = s.y;
    this.player.dir = s.dir || 'up';
    this.player.moving = false;
    this.player.anim = 0;
    this.player.expr = 'neutral';
    this.footprints = [];
    this.prompt = null;
    this.cooldown = 0.3;
    this._zoneLock = false;
    this.walkers.forEach((w) => w.resolve && w.resolve());
    this.walkers = [];
    this.transitioning = false;
    this.zoom = 1;
    this.focus = null;
    this.tension = 0;
    this.camera.x = this.clampCamX(this.player.x);
    this.camera.y = this.clampCamY(this.player.y - 8);
    this.npcs = this.buildNpcs(id).map((n) => ({ anim: Math.random() * 10, moving: false, ...n }));
    this.buildInteractables();
    this.storm = id === 'town' && !!g.flags.storm;
    this.snowIntensity = this.storm ? 1.9 : 1;
    if (id !== 'town') this.snowIntensity = 0;
    if (!g.reduceMotion) {
      this.snow = createSnow(this.storm ? 240 : 160);
    } else {
      this.snow = createSnow(this.storm ? 80 : 60);
    }
    this.motes = [];
    for (let i = 0; i < 20; i++) {
      this.motes.push({ x: Math.random() * W, y: 40 + Math.random() * 190, p: Math.random() * 6.2, s: 0.5 + Math.random() });
    }
    if (opt.location !== false) g.ui.location(this.map.name, this.map.sub);
    // music
    if (id === 'town') {
      g.sound.playTrack(this.storm ? 'storm' : 'snow');
      g.sound.ambience(this.storm ? 1 : 0.35);
    } else if (id === 'diner') {
      g.sound.playTrack('diner');
      g.sound.ambience(0.12);
    } else if (id === 'bathroom') {
      g.sound.playTrack('storm');
      g.sound.ambience(0.25);
    } else if (id === 'home') {
      g.sound.playTrack('snow');
      g.sound.ambience(0.24);
    }
    g.input.setTouchVisibleForScene(true);
  }

  async enterMap(id, spawn, opt = {}) {
    if (this.transitioning) return;
    this.transitioning = true;
    const instant = opt.instant;
    const hadMap = !!this.map;
    if (!instant && hadMap) {
      await this.fadeTo(1, opt.fadeOut ?? 300);
      this.g.sound.sfx('door');
    }
    this.load(id, spawn, opt);
    if (!instant && hadMap) {
      await this.g.wait(opt.hold ?? 130);
      await this.fadeTo(0, opt.fadeIn ?? 360);
    } else {
      this.fade = 0;
    }
    this.transitioning = false;
  }

  fadeTo(target, ms = 300) {
    if (this.fadeAnim?.resolve) this.fadeAnim.resolve();
    return new Promise((resolve) => {
      this.fadeAnim = { from: this.fade, to: target, t: 0, dur: Math.max(0.01, ms / 1000), resolve };
    });
  }

  shake(amount = 4, ms = 260) {
    if (this.g.reduceMotion) amount *= 0.3;
    this.shakeAmt = Math.max(this.shakeAmt, amount);
    this.shakeTime = Math.max(this.shakeTime, ms / 1000);
  }

  flashScreen(color = '#ffffff', ms = 260) {
    this.flash = 1;
    this.flashColor = color;
    this.flashDecay = 1 / (ms / 1000);
  }

  setFocus(x, y) { this.focus = { x, y }; }
  clearFocus() { this.focus = null; }

  getNpc(id) { return this.npcs.find((n) => n.id === id); }
  addNpc(npc) { this.npcs.push({ anim: Math.random() * 10, moving: false, dir: 'down', ...npc }); this.buildInteractables(); }
  removeNpc(id) {
    this.npcs = this.npcs.filter((n) => n.id !== id);
    this.buildInteractables();
  }

  buildNpcs(id) {
    const f = this.g.flags;
    const list = [];
    if (id === 'town') {
      if (!f.storm && !f.homeEntered) {
        list.push({ id: 'toriel', skin: 'toriel', x: 462, y: 646, dir: 'down', expr: 'soft' });
      } else if (f.storm) {
        list.push({ id: 'toriel', skin: 'toriel', x: 162, y: 470, dir: 'down', expr: 'soft' });
      }
      list.push({ id: 'asgore', skin: 'asgore', x: 338, y: 480, dir: 'left', expr: 'sad' });
      if (!f.chrisMet) {
        list.push({ id: 'chris', skin: 'chris', x: 652, y: 404, dir: 'down', expr: 'grin', bounce: true });
      }
      list.push({ id: 'lark', skin: 'bird', x: 412, y: 590, dir: 'down', expr: 'neutral' });
      if (f.storm && f.bathroomDone) {
        list.push({ id: 'mich', skin: 'mich', x: 900, y: 476, dir: 'left', expr: 'soft' });
      }
    } else if (id === 'diner') {
      if (f.chrisMet) list.push({ id: 'chris', skin: 'chris', x: 320, y: 126, dir: 'down', expr: 'grin' });
      if (f.bathroomDone) list.push({ id: 'mich', skin: 'mich', x: 172, y: 220, dir: 'right', expr: 'soft' });
      list.push({ id: 'patron', skin: 'bird', x: 414, y: 226, dir: 'left', expr: 'neutral' });
    }
    return list;
  }

  buildInteractables() {
    if (!this.map) return;
    const list = [];
    for (const [id, data] of Object.entries(this.map.interact || {})) {
      list.push({ id, ...data });
    }
    for (const n of this.npcs) {
      list.push({ id: 'npc:' + n.id, npcId: n.id, x: n.x, y: n.y - 10, r: 26, label: 'TALK' });
    }
    this.interactables = list;
  }

  clampCamX(x) {
    const vw = W / this.zoom;
    if (this.map.w <= vw) return this.map.w / 2;
    return Math.max(vw / 2, Math.min(this.map.w - vw / 2, x));
  }

  clampCamY(y) {
    const vh = H / this.zoom;
    if (this.map.h <= vh) return this.map.h / 2;
    return Math.max(vh / 2, Math.min(this.map.h - vh / 2, y));
  }

  collides(x, y) {
    const box = { x: x - 5, y: y - 7, w: 10, h: 10 };
    for (const c of this.map.colliders || []) {
      if (box.x < c.x + c.w && box.x + box.w > c.x && box.y < c.y + c.h && box.y + box.h > c.y) return true;
    }
    for (const n of this.npcs) {
      const dx = n.x - x;
      const dy = (n.y - 8) - y;
      if (dx * dx + dy * dy < 100) return true;
    }
    return false;
  }

  async walkTo(actor, tx, ty, speed = 62) {
    return new Promise((resolve) => {
      this.walkers.push({ actor, tx, ty, speed, resolve });
    });
  }

  face(actor, dir) { if (actor) actor.dir = dir; }
  facePlayer(actor) {
    if (!actor) return;
    const dx = this.player.x - actor.x;
    const dy = this.player.y - actor.y;
    actor.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }

  nearest() {
    let best = null;
    let bd = Infinity;
    for (const it of this.interactables) {
      const d = Math.hypot(it.x - this.player.x, it.y - this.player.y);
      if (d < it.r && d < bd) { bd = d; best = it; }
    }
    return best;
  }

  update(dt) {
    const g = this.g;
    if (!this.map) return;
    this.ambientTime += dt;
    // fade animation
    if (this.fadeAnim) {
      const a = this.fadeAnim;
      a.t += dt;
      const k = Math.min(1, a.t / a.dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      this.fade = a.from + (a.to - a.from) * e;
      if (k >= 1) {
        this.fade = a.to;
        const r = a.resolve;
        this.fadeAnim = null;
        if (r) r();
      }
    }
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * (this.flashDecay || 4));
    if (this.tension > 0) this.tension = Math.max(0, this.tension - dt * 0.5);
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime <= 0) this.shakeAmt = 0;
    }
    this.cooldown = Math.max(0, this.cooldown - dt);

    // weather
    if (this.mapId === 'town') {
      const wind = this.storm ? 30 : 8;
      updateSnow(this.snow, dt, W, H + 10, wind);
    } else if (this.mapId === 'home' || this.mapId === 'diner') {
      for (const m of this.motes) {
        m.y -= dt * (2 + m.s);
        m.x += Math.sin(this.ambientTime * 0.6 + m.p) * dt * 3;
        if (m.y < 30) { m.y = 230; m.x = Math.random() * W; }
      }
    }

    // camera
    const target = this.focus || { x: this.player.x, y: this.player.y - 8 };
    const tx = this.clampCamX(target.x);
    const ty = this.clampCamY(target.y);
    const follow = this.focus ? 3.2 : (this.g.reduceMotion ? 8 : 6.5);
    this.camera.x += (tx - this.camera.x) * Math.min(1, follow * dt);
    this.camera.y += (ty - this.camera.y) * Math.min(1, follow * dt);

    // actors animation + cutscene walkers
    for (const n of this.npcs) {
      n.anim += dt * (n.bounce ? 2.2 : 1);
      if (!this.g.cutscene && !this.g.dialogue.active && !g.paused) {
        const d = Math.hypot(this.player.x - n.x, this.player.y - n.y);
        if (d < 58 && !n.moving) this.facePlayer(n);
      }
    }
    if (this.walkers.length) {
      for (let i = this.walkers.length - 1; i >= 0; i--) {
        const w = this.walkers[i];
        const a = w.actor;
        const dx = w.tx - a.x;
        const dy = w.ty - a.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1.5) {
          a.x = w.tx; a.y = w.ty; a.moving = false;
          this.walkers.splice(i, 1);
          if (w.resolve) w.resolve();
          continue;
        }
        a.moving = true;
        a.anim += dt * 6;
        a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        const step = Math.min(dist, w.speed * dt);
        a.x += (dx / dist) * step;
        a.y += (dy / dist) * step;
      }
    }

    const frozen = this.g.cutscene || this.g.dialogue.active || g.paused || this.transitioning;
    this.player.moving = false;
    if (!frozen) {
      const axis = g.input.axis;
      const moving = Math.abs(axis.x) > 0.08 || Math.abs(axis.y) > 0.08;
      if (moving) {
        const run = g.input.isDown('run') || Math.hypot(g.input.touchVector.x, g.input.touchVector.y) > 0.92;
        const speed = run ? 94 : 64;
        const nx = this.player.x + axis.x * speed * dt;
        const ny = this.player.y + axis.y * speed * dt;
        if (!this.collides(nx, this.player.y)) this.player.x = nx;
        if (!this.collides(this.player.x, ny)) this.player.y = ny;
        this.player.moving = true;
        this.player.anim += dt * (run ? 12 : 8.4);
        if (Math.abs(axis.x) > Math.abs(axis.y)) this.player.dir = axis.x > 0 ? 'right' : 'left';
        else this.player.dir = axis.y > 0 ? 'down' : 'up';
        this.player.stepAcc += dt;
        if (this.player.stepAcc > (run ? 0.25 : 0.34)) {
          this.player.stepAcc = 0;
          if (this.mapId === 'town') g.sound.sfx('step');
          if (this.mapId === 'town') {
            this.footTimer += 0.34;
            this.footprints.push({
              x: this.player.x + (Math.random() - 0.5) * 2,
              y: this.player.y + 1,
              dir: this.player.dir,
              life: 9,
              side: Math.random() > 0.5 ? 1 : -1,
            });
            if (this.footprints.length > 60) this.footprints.shift();
          }
        }
      }
      this.prompt = this.nearest();
      if (this.prompt && this.cooldown <= 0 && g.input.consume('confirm')) {
        this.activate(this.prompt.id);
      }
      // story zone
      if (this.mapId === 'town' && !g.flags.chrisMet && !this._zoneLock) {
        const z = this.map.zones.chris;
        if (Math.hypot(this.player.x - z.x, this.player.y - z.y) < z.r) {
          this._zoneLock = true;
          g.script.chrisScene();
        }
      }
    } else {
      this.prompt = null;
    }

    for (const f of this.footprints) f.life -= dt * 0.25;
    this.footprints = this.footprints.filter((f) => f.life > 0);
  }

  activate(id) {
    const g = this.g;
    this.cooldown = 0.35;
    g.sound.sfx('confirm');
    if (id.startsWith('npc:')) {
      g.script.talk(id.slice(4));
      return;
    }
    if (g.script.inspect) g.script.inspect(id);
  }

  render(ctx) {
    if (!this.map) {
      ctx.fillStyle = '#05060d';
      ctx.fillRect(0, 0, W, H);
      return;
    }
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false;
    const shakeX = this.shakeTime > 0 ? (Math.random() - 0.5) * this.shakeAmt : 0;
    const shakeY = this.shakeTime > 0 ? (Math.random() - 0.5) * this.shakeAmt : 0;

    ctx.save();
    ctx.translate(W / 2 + shakeX, H / 2 + shakeY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    ctx.drawImage(this.bg, 0, 0);

    // footprints
    for (const f of this.footprints) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.35, f.life * 0.06);
      ellipse(ctx, f.x + f.side * 2.5, f.y, 2.2, 1.1, '#3f4e6b');
      ctx.restore();
    }

    // drawables sorted by y
    const drawables = [
      ...this.npcs.map((n) => ({ kind: 'npc', y: n.y, n })),
      { kind: 'player', y: this.player.y },
    ].sort((a, b) => a.y - b.y);

    // quest marker target
    const marker = this.markerTarget();
    for (const d of drawables) {
      if (marker && d.kind === 'npc' && marker.npc && d.n.id === marker.npc) {
        this.drawMarker(ctx, d.n.x, d.n.y - 52);
      }
      if (marker && d.kind === 'player' && marker.world && marker.drawWorld) {
        // world objects drawn separately
      }
      if (d.kind === 'npc') {
        const n = d.n;
        drawActor(ctx, n, this.ambientTime, { breath: this.mapId === 'town' });
      } else {
        drawActor(ctx, this.player, this.ambientTime, { breath: this.mapId === 'town' });
      }
    }
    // world-position markers (doors/mirror)
    if (marker && marker.world && marker.map === this.mapId) {
      this.drawMarker(ctx, marker.x, marker.y - 8);
    }

    // lamp glows
    this.drawLights(ctx);

    // prompt
    if (this.prompt && !this.g.cutscene && !this.g.dialogue.active) {
      this.drawPrompt(ctx, this.prompt);
    }
    ctx.restore();

    // screen-space weather
    if (this.mapId === 'town') {
      drawSnow(ctx, this.snow, { alpha: this.storm ? 0.9 : 0.65 });
      if (this.storm && !this.g.reduceMotion) {
        ctx.save();
        ctx.globalAlpha = 0.11;
        ctx.strokeStyle = '#e8f3ff';
        ctx.lineWidth = 1;
        for (let i = 0; i < 16; i++) {
          const x = (i * 41 + this.ambientTime * 90) % 520 - 20;
          const y = (i * 67 + this.ambientTime * 44) % 300 - 20;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 9, y + 4);
          ctx.stroke();
        }
        ctx.restore();
      }
    } else if (this.mapId === 'home' || this.mapId === 'diner') {
      for (const m of this.motes) {
        ctx.globalAlpha = 0.16 * m.s;
        ctx.fillStyle = '#ffe8c0';
        ctx.fillRect(m.x, m.y, 1, 1);
      }
      ctx.globalAlpha = 1;
    }

    // storm tint
    if (this.mapId === 'town' && this.storm) {
      ctx.fillStyle = 'rgba(30,48,84,.16)';
      ctx.fillRect(0, 0, W, H);
    }
    if (this.tension > 0) {
      const v = ctx.createRadialGradient(240, 135, 60, 240, 135, 280);
      v.addColorStop(0, 'rgba(120,0,20,0)');
      v.addColorStop(1, `rgba(120,0,20,${0.5 * this.tension})`);
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.flash > 0) {
      ctx.save();
      ctx.globalAlpha = this.flash * 0.9;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (this.fade > 0) {
      ctx.fillStyle = `rgba(3,4,9,${Math.min(1, this.fade)})`;
      ctx.fillRect(0, 0, W, H);
    }
    // debug
    if (this.g.debug) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      for (const c of this.map.colliders || []) rect(ctx, c.x - this.camera.x + 240, c.y - this.camera.y + 135, c.w, c.h, '#ff0000');
      ctx.restore();
    }
  }

  drawLights(ctx) {
    if (!this.map) return;
    const t = this.ambientTime;
    for (const l of this.map.lamps || []) {
      const flicker = 0.92 + Math.sin(t * 5 + l.x) * 0.04;
      glow(ctx, l.x, l.y - 63, 58 * flicker, 'rgba(255,200,120,.2)', 'rgba(255,180,90,0)', 0.9);
      glow(ctx, l.x, l.y - 63, 18, 'rgba(255,220,160,.3)', 'rgba(255,200,120,0)', 0.9);
    }
    if (this.mapId === 'diner') {
      for (const x of [170, 330]) glow(ctx, x, 30, 46, 'rgba(255,200,120,.18)', 'rgba(255,190,100,0)', 0.9);
      glow(ctx, 240, 120, 160, 'rgba(255,190,110,.05)', 'rgba(255,180,90,0)', 0.9);
    }
    if (this.mapId === 'home') {
      glow(ctx, 300, 122, 62, 'rgba(255,200,120,.16)', 'rgba(255,190,100,0)', 0.9);
      glow(ctx, 63, 132, 54, 'rgba(255,200,120,.13)', 'rgba(255,190,100,0)', 0.9);
      glow(ctx, 356, 40, 60, 'rgba(190,220,255,.09)', 'rgba(190,220,255,0)', 0.8);
    }
    if (this.mapId === 'bathroom') {
      glow(ctx, 240, 8, 120, 'rgba(210,245,255,.12)', 'rgba(210,245,255,0)', 0.8);
    }
    if (this.mapId === 'town') {
      // string-light shimmer on the square tree
      const tree = this.map.trees[0];
      if (tree) glow(ctx, tree.x, tree.y - 74, 70, 'rgba(255,210,130,.1)', 'rgba(255,200,120,0)', 0.9);
    }
  }

  markerTarget() {
    const g = this.g;
    const f = g.flags;
    if (this.mapId === 'town' && !f.chrisMet) {
      const n = this.getNpc('chris');
      if (n) return { npc: 'chris' };
    }
    if (this.mapId === 'town' && f.chrisMet && !f.bathroomDone) {
      return { world: true, x: 848, y: 442, map: 'town' };
    }
    if (this.mapId === 'diner' && f.chrisMet && !f.bathroomDone) {
      return { world: true, x: 82, y: 168, map: 'diner' };
    }
    if (this.mapId === 'town' && f.bathroomDone && !f.homeEntered) {
      return { world: true, x: 144, y: 442, map: 'town' };
    }
    if (this.mapId === 'home' && f.homeEntered && !f.battleDone) {
      return { world: true, x: 74, y: 140, map: 'home' };
    }
    return null;
  }

  drawMarker(ctx, x, y) {
    const t = this.ambientTime;
    const bob = Math.sin(t * 2.6) * 3;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = 'rgba(7,10,22,.8)';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1;
    ctx.stroke();
    rect(ctx, -0.8, -2.2, 1.6, 2.2, '#ffd166');
    rect(ctx, -0.8, 1, 1.6, 1.6, '#ffd166');
    ctx.restore();
  }

  drawPrompt(ctx, p) {
    const t = this.ambientTime;
    const y = p.y - (p.npcId ? 50 : 18) + Math.sin(t * 2.2) * 1.5;
    const label = p.label || 'LOOK';
    ctx.save();
    ctx.font = '600 6px "Pixelify Sans", monospace';
    const w = Math.max(28, ctx.measureText(label).width + 20);
    ctx.globalAlpha = 0.94;
    rr(ctx, p.x - w / 2, y - 12, w, 13, 2, 'rgba(5,7,15,.9)');
    ctx.strokeStyle = 'rgba(238,242,255,.65)';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(p.x - w / 2) + 0.5, Math.round(y - 12) + 0.5, Math.round(w) - 1, 12);
    // A key
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(p.x - w / 2 + 6, y - 5.5, 4, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'A', p.x - w / 2 + 6, y - 3.4, { size: 5.6, color: '#0a0e1c', align: 'center', weight: 600 });
    text(ctx, label, p.x - w / 2 + 12, y - 3.2, { size: 5.4, color: '#f2f5ff', weight: 600, tracking: 0.4 });
    ctx.restore();
  }
}
