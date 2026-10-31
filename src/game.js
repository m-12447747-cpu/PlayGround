import { VW, VH, COLORS, clamp, approach, easeInOut, hash } from "./constants.js";
import { Dialogue } from "./dialogue.js";
import { World } from "./world.js";
import { Battle } from "./battle.js";
import { drawSrif, drawChris, drawMich, drawAsgore, drawToriel, drawSnowman, drawKid, drawCat } from "./sprites.js";
import { drawText, wrapText } from "./text.js";

const SPRITES = {
  srif: drawSrif,
  chris: drawChris,
  mich: drawMich,
  asgore: drawAsgore,
  toriel: drawToriel,
  snowman: drawSnowman,
  kid: drawKid,
  cat: drawCat,
};

const TALK_PITCH = { toriel: 610, asgore: 430, chris: 760, mich: 540, snowman: 500, kid: 700, cat: 800 };

export class Game {
  constructor(canvas, input, audio) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.input = input;
    this.audio = audio;
    this.dialogue = new Dialogue(this);
    this.ui = null;

    this.mode = "title";
    this.time = 0;
    this.paused = false;
    this.reduceMotion = false;
    this.cinematic = false;
    this.location = "OPPIDAN";
    this.objective = "";
    this.banner = { text: "", sub: "", timer: 0, duration: 0 };
    this.fade = { alpha: 1, target: 0, speed: 1.4, resolve: null };
    this.flash = 0;
    this.impact = 0;
    this.shake = 0;

    this.world = null;
    this.battle = null;
    this.actors = [];
    this.fx = [];
    this.snow = [];
    this.waiters = [];
    this.tweens = [];
    this.camera = { x: 0, y: 190 };
    this.cameraTween = null;
    this.player = {
      id: "srif",
      x: 150,
      y: 328,
      dir: "up",
      frame: 0,
      moving: false,
      stepTimer: 0,
      hidden: false,
      sprite: "srif",
    };
    this.flags = {};
    this.breathTimer = 0;
    this.footTimer = 0;
    this.nearest = null;
    this.endingStats = null;
    this._initSnow();
  }

  setUI(ui) {
    this.ui = ui;
  }

  /* ------------------------------------------------------------------ */
  /* lifecycle                                                           */
  /* ------------------------------------------------------------------ */

  start() {
    this.mode = "title";
    this.audio.playTrack("title");
    this.fade.alpha = 0;
    this.fade.target = 0;
  }

  newGame() {
    this.flags = {};
    this.dialogue.close();
    this.paused = false;
    this.cinematic = true;
    this.mode = "intro";
    this.battle = null;
    this.actors = [];
    this.fx = [];
    this.waiters = [];
    this.tweens = [];
    this.cameraTween = null;
    this.flash = 0;
    this.impact = 0;
    this.shake = 0;
    this.endingStats = null;
    this.world = new World("town");
    this.setupTownActors();
    this.player = {
      id: "srif", x: 150, y: 328, dir: "up", frame: 0, moving: false,
      stepTimer: 0, hidden: true, sprite: "srif",
    };
    this.camera = { x: 0, y: 196 };
    this.location = "OPPIDAN — HOLLY STREET";
    this.objective = "";
    this.fade.alpha = 1;
    this.fade.target = 0;
    this.fade.speed = 1.1;
    this.banner = { text: "", sub: "", timer: 0, duration: 0 };
    if (this.ui) {
      this.ui.hideTitle();
      this.ui.hideEnding();
      this.ui.showPauseButton();
      this.ui.closeAllModals();
    }
    this.audio.playTrack("warm");
    this.runIntro();
  }

  toTitle() {
    this.mode = "title";
    this.paused = false;
    this.world = null;
    this.actors = [];
    this.battle = null;
    this.dialogue.close();
    this.cinematic = false;
    this.player.hidden = true;
    this.objective = "";
    this.fade.alpha = 0;
    this.fade.target = 0;
    if (this.ui) {
      this.ui.showTitle();
      this.ui.hidePauseButton();
      this.ui.hideEnding();
      this.ui.closeAllModals();
    }
    this.audio.playTrack("title");
  }

  togglePause() {
    if (this.mode === "title" || this.mode === "ending") return;
    if (this.ui && this.ui.isModalOpen()) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.audio.sfx("confirm");
      if (this.ui) this.ui.showPause();
    } else {
      this.audio.sfx("cancel");
      if (this.ui) this.ui.closeModal("pause");
    }
  }

  resume() {
    this.paused = false;
    if (this.ui) this.ui.closeModal("pause");
  }

  /* ------------------------------------------------------------------ */
  /* update                                                              */
  /* ------------------------------------------------------------------ */

  update(dt) {
    this.time += dt;
    this._updateSnow(dt);
    this._updateFx(dt);
    this.flash = Math.max(0, this.flash - dt * 2.4);
    this.impact = Math.max(0, this.impact - dt * 0.9);
    this.shake = Math.max(0, this.shake - dt * 16);
    this._updateBanner(dt);

    if (this.paused) {
      this.input.endFrame();
      return;
    }

    if (this.mode === "title") {
      this.input.endFrame();
      return;
    }

    if (this.mode === "intro" || this.mode === "town" || this.mode === "diner" || this.mode === "bathroom") {
      this._updateCamera(dt);
      this._updateTweens(dt);
      this._updateWaiters(dt);
      this._updateFade(dt);
      this._updateActors(dt);
      if (!this.cinematic && !this.dialogue.active) this._updatePlayer(dt);
      this._updateNearest();
      if (!this.cinematic && !this.dialogue.active) this._handleWorldInput();
      this._updateBreath(dt);
      this.dialogue.update(dt);
    } else if (this.mode === "battle") {
      this._updateFade(dt);
      this._updateWaiters(dt);
      if (this.battle) this.battle.update(dt);
    } else if (this.mode === "ending") {
      this._updateFade(dt);
      this._updateActors(dt);
      this._updateWaiters(dt);
    }

    if (!this.cinematic && !this.dialogue.active && !(this.ui && this.ui.isModalOpen())) {
      if (this.input.justPressed("cancel") && this.mode !== "battle") {
        this.togglePause();
      }
    }

    this.input.endFrame();
  }

  _updatePlayer(dt) {
    if (this.player.hidden) return;
    const move = this.input.getMove();
    const speed = 74;
    const len = Math.hypot(move.x, move.y);
    if (len > 0.08) {
      const nx = move.x / Math.max(1, len);
      const ny = move.y / Math.max(1, len);
      const dx = nx * speed * dt;
      const dy = ny * speed * dt;
      if (!this.world.collides(this.player.x + dx, this.player.y)) this.player.x += dx;
      if (!this.world.collides(this.player.x, this.player.y + dy)) this.player.y += dy;
      this.player.moving = true;
      this.player.stepTimer += dt * 10;
      this.player.frame = Math.floor(this.player.stepTimer) % 4;
      if (Math.abs(nx) > Math.abs(ny)) this.player.dir = nx > 0 ? "right" : "left";
      else this.player.dir = ny > 0 ? "down" : "up";
      this.footTimer -= dt;
      if (this.footTimer <= 0) {
        this.footTimer = 0.28;
        this.audio.sfx("step");
      }
    } else {
      this.player.moving = false;
      this.player.frame = 0;
    }
  }

  _updateActors(dt) {
    for (const actor of this.actors) {
      if (actor.hidden) continue;
      if (actor.tween) continue;
      if (actor.wander) {
        actor.wanderTimer = (actor.wanderTimer || 0) - dt;
        if (actor.wanderTimer <= 0) {
          actor.wanderTimer = 1.5 + Math.random() * 2;
          actor.dir = ["down", "left", "right", "up"][Math.floor(Math.random() * 4)];
        }
      }
    }
  }

  _updateNearest() {
    if (!this.world || this.cinematic || this.dialogue.active) {
      this.nearest = null;
      return;
    }
    this.nearest = this._findNearest(this.player.x, this.player.y, 34);
  }

  _handleWorldInput() {
    const tap = this.input.consumeTap();
    if (tap) {
      const wx = tap.x + this.camera.x;
      const wy = tap.y + this.camera.y;
      const target = this._findNearest(wx, wy, 28);
      if (target) {
        this.handleInteract(target);
        return;
      }
    }
    if (this.input.justPressed("confirm") && this.nearest) {
      this.handleInteract(this.nearest);
    }
  }

  _findNearest(x, y, range) {
    let best = null;
    let bestDist = range;
    const candidates = [];
    for (const item of this.world.interactables) {
      if (item.active === false) continue;
      candidates.push(item);
    }
    for (const actor of this.actors) {
      if (actor.hidden || actor.interactable === false) continue;
      candidates.push({
        id: actor.id,
        x: actor.x,
        y: actor.y,
        radius: 34,
        label: actor.label || `talk to ${actor.name || actor.id}`,
        kind: "actor",
        actor,
      });
    }
    for (const item of candidates) {
      const dist = Math.hypot(item.x - x, item.y - y);
      if (dist < bestDist) {
        bestDist = dist;
        best = item;
      }
    }
    return best;
  }

  _updateFade(dt) {
    if (this.fade.alpha === this.fade.target) return;
    const dir = Math.sign(this.fade.target - this.fade.alpha);
    this.fade.alpha = approach(this.fade.alpha, this.fade.target, this.fade.speed, dt);
    if (Math.abs(this.fade.alpha - this.fade.target) < 0.005) {
      this.fade.alpha = this.fade.target;
      const resolve = this.fade.resolve;
      this.fade.resolve = null;
      if (resolve) resolve();
    }
  }

  _updateWaiters(dt) {
    for (const waiter of this.waiters) {
      waiter.time -= dt;
    }
    const ready = this.waiters.filter((w) => w.time <= 0);
    this.waiters = this.waiters.filter((w) => w.time > 0);
    for (const waiter of ready) waiter.resolve();
  }

  _updateTweens(dt) {
    for (const tween of this.tweens) {
      tween.t += dt;
      const raw = clamp(tween.t / tween.duration, 0, 1);
      const e = easeInOut(raw);
      const actor = tween.actor;
      actor.x = tween.sx + (tween.tx - tween.sx) * e;
      actor.y = tween.sy + (tween.ty - tween.sy) * e;
      if (Math.abs(tween.tx - tween.sx) > Math.abs(tween.ty - tween.sy)) {
        actor.dir = tween.tx > tween.sx ? "right" : "left";
      } else {
        actor.dir = tween.ty > tween.sy ? "down" : "up";
      }
      actor.moving = true;
      actor.frame = Math.floor(this.time * 8) % 4;
    }
    const done = this.tweens.filter((t) => t.t >= t.duration);
    this.tweens = this.tweens.filter((t) => t.t < t.duration);
    for (const tween of done) {
      tween.actor.x = tween.tx;
      tween.actor.y = tween.ty;
      tween.actor.moving = false;
      tween.actor.frame = 0;
      tween.resolve();
    }
    if (this.cameraTween) {
      const tween = this.cameraTween;
      tween.t += dt;
      const raw = clamp(tween.t / tween.duration, 0, 1);
      const e = easeInOut(raw);
      this.camera.x = tween.sx + (tween.tx - tween.sx) * e;
      this.camera.y = tween.sy + (tween.ty - tween.sy) * e;
      if (raw >= 1) {
        this.cameraTween = null;
        tween.resolve();
      }
    }
  }

  _updateCamera(dt) {
    if (this.cameraTween) return;
    if (this.mode === "town") {
      const targetX = clamp(this.player.x - VW / 2, 0, this.world.w - VW);
      const targetY = clamp(this.player.y - VH / 2, 0, this.world.h - VH);
      const k = 1 - Math.exp(-7 * dt);
      this.camera.x += (targetX - this.camera.x) * k;
      this.camera.y += (targetY - this.camera.y) * k;
    } else if (this.mode === "diner" || this.mode === "bathroom") {
      this.camera.x = 0;
      this.camera.y = 0;
    }
  }

  _updateBanner(dt) {
    if (this.banner.timer > 0) this.banner.timer -= dt;
  }

  _updateBreath(dt) {
    if (!this.world || this.mode !== "town" || this.player.hidden) return;
    this.breathTimer -= dt;
    if (this.breathTimer <= 0) {
      this.breathTimer = 2.2 + Math.random() * 1.6;
      this.fx.push({
        type: "breath",
        x: this.player.x + (this.player.dir === "left" ? -5 : this.player.dir === "right" ? 5 : 0),
        y: this.player.y - 30,
        vx: (Math.random() - 0.5) * 4,
        vy: -7,
        life: 1.4,
        maxLife: 1.4,
        size: 2,
      });
    }
  }

  _updateFx(dt) {
    for (const p of this.fx) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.life -= dt;
    }
    this.fx = this.fx.filter((p) => p.life > 0);
  }

  _initSnow() {
    this.snow = [];
    for (let i = 0; i < 110; i += 1) {
      this.snow.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        z: Math.random(),
        speed: 12 + Math.random() * 34,
        drift: (Math.random() - 0.5) * 14,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  _updateSnow(dt) {
    const count = this.reduceMotion ? 45 : 110;
    for (let i = 0; i < this.snow.length; i += 1) {
      const flake = this.snow[i];
      if (i >= count) continue;
      flake.y += flake.speed * (this.reduceMotion ? 0.45 : 1) * dt;
      flake.x += (flake.drift + Math.sin(this.time * 0.7 + flake.phase) * 5) * dt;
      if (flake.y > VH + 4) {
        flake.y = -4;
        flake.x = Math.random() * VW;
      }
      if (flake.x < -4) flake.x = VW + 4;
      if (flake.x > VW + 4) flake.x = -4;
    }
  }

  /* ------------------------------------------------------------------ */
  /* async helpers                                                       */
  /* ------------------------------------------------------------------ */

  say(speaker, text, opts = {}) {
    return this.dialogue.show(speaker, text, opts);
  }

  choose(options) {
    return this.dialogue.choose(options);
  }

  wait(seconds) {
    return new Promise((resolve) => {
      this.waiters.push({ time: seconds, resolve });
    });
  }

  fadeTo(alpha, speed = 1.2) {
    if (this.fade.resolve) {
      const old = this.fade.resolve;
      this.fade.resolve = null;
      old();
    }
    this.fade.target = alpha;
    this.fade.speed = speed;
    if (Math.abs(this.fade.alpha - alpha) < 0.005) {
      this.fade.alpha = alpha;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.fade.resolve = resolve;
    });
  }

  moveActor(actor, tx, ty, duration = 0.6) {
    return new Promise((resolve) => {
      this.tweens.push({
        actor,
        sx: actor.x,
        sy: actor.y,
        tx,
        ty,
        t: 0,
        duration,
        resolve,
      });
    });
  }

  panCamera(tx, ty, duration = 2) {
    return new Promise((resolve) => {
      this.cameraTween = {
        sx: this.camera.x,
        sy: this.camera.y,
        tx,
        ty,
        t: 0,
        duration,
        resolve,
      };
    });
  }

  showBanner(text, sub = "", duration = 3.2) {
    this.banner = { text, sub, timer: duration, duration };
  }

  splash(x, y) {
    for (let i = 0; i < 26; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 70;
      this.fx.push({
        type: "splash",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 25,
        gravity: 150,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        size: 1 + Math.floor(Math.random() * 2),
      });
    }
    this.flash = 0.35;
  }

  /* ------------------------------------------------------------------ */
  /* actors + interactions                                               */
  /* ------------------------------------------------------------------ */

  makeActor(config) {
    return {
      id: config.id,
      name: config.name || config.id,
      x: config.x,
      y: config.y,
      dir: config.dir || "down",
      sprite: config.sprite || "srif",
      label: config.label || `talk to ${config.name || config.id}`,
      emotion: config.emotion || "neutral",
      hidden: !!config.hidden,
      interactable: config.interactable !== false,
      soft: !!config.soft,
      wander: !!config.wander,
      wanderTimer: 0,
      frame: 0,
      moving: false,
      interact: config.interact || null,
    };
  }

  addActor(config) {
    const actor = this.makeActor(config);
    this.actors.push(actor);
    return actor;
  }

  setupTownActors() {
    this.actors = [
      this.makeActor({
        id: "toriel", name: "Toriel", x: 204, y: 326, dir: "right", sprite: "toriel",
        label: "talk to Mom", interact: () => this.torielTalk(),
      }),
      this.makeActor({
        id: "asgore", name: "Asgore", x: 372, y: 342, dir: "right", sprite: "asgore",
        label: "talk to Dad", interact: () => this.asgoreTalk(),
      }),
      this.makeActor({
        id: "chris", name: "Chris", x: 706, y: 344, dir: "left", sprite: "chris",
        label: "talk to Chris", interact: () => this.chrisScene(),
      }),
      this.makeActor({
        id: "snowman", name: "Mr. Frost", x: 120, y: 470, dir: "down", sprite: "snowman",
        label: "talk to the snowman", interact: () => this.snowmanTalk(),
      }),
      this.makeActor({
        id: "kid", name: "Kid", x: 300, y: 392, dir: "left", sprite: "kid",
        label: "talk to the kid", interact: () => this.kidTalk(), wander: true,
      }),
      this.makeActor({
        id: "cat", name: "Cat", x: 830, y: 334, dir: "left", sprite: "cat",
        label: "pet the cat", interact: () => this.catTalk(),
      }),
    ];
  }

  setupDinerActors() {
    this.actors = [
      this.makeActor({
        id: "chris", name: "Chris", x: 240, y: 118, dir: "down", sprite: "chris",
        label: "talk to Chris", interact: () => this.dinerChrisTalk(),
      }),
    ];
  }

  async handleInteract(item) {
    if (this.dialogue.active || this.cinematic) return;
    if (item.actor && item.actor.interact) {
      await item.actor.interact();
      return;
    }
    const kind = item.kind;
    switch (kind) {
      case "diner":
        if (this.flags.metChris) await this.goDiner();
        else {
          this.audio.sfx("select");
          await this.say("narrator", "Chris is waving at you from across the street. You should say hi first.");
        }
        break;
      case "bathroom":
        await this.goBathroom();
        break;
      case "sign":
        await this.say("narrator", "WELCOME TO OPPIDAN — pop. 1,204. Please drive slowly. Please stay warm. Please stay.");
        break;
      case "bench":
        await this.say("narrator", "You used to sit here when the shouting got loud. The wood is colder than you remember.");
        break;
      case "snowman":
        await this.snowmanTalk();
        break;
      case "car":
        await this.say("narrator", "The cruiser's heater is broken. Dad says it builds character.");
        break;
      case "house":
        await this.say("narrator", "The door is unlocked. Mom is watching from the window with the exact expression of someone who has been watching for a while.");
        break;
      case "police":
        await this.say("narrator", "The station is closed. A note on the door says BACK IN 5 MINUTES. It is dated 2019.");
        break;
      case "books":
        await this.say("narrator", "CLOSED — GONE TO READ. The sign is handwritten. It feels like a threat.");
        break;
      case "jukebox":
        this.flags.jukebox = true;
        this.audio.sfx("mercy");
        await this.say("narrator", "A song from before you left. It sounds like a room you can't go back to.");
        break;
      case "pie":
        await this.say("narrator", "One slice left. The tin says SRIF in Chris's handwriting.");
        await this.say("srif", "...You kept a slice?");
        await this.say("chris", "I kept a slice.");
        break;
      case "poster":
        await this.say("narrator", "HOLIDAY FAMILY PHOTO — Chris, his mom, his dad, twelve cousins, one very confused cat.");
        await this.say("srif", "Which one is the cat?");
        await this.say("chris", "All of them, spiritually.");
        break;
      case "exit":
        await this.say("narrator", "You're not leaving yet. Chris would never forgive you.");
        break;
      case "sink":
        await this.sinkScene();
        break;
      case "mirror":
        await this.mirrorScene();
        break;
      default:
        break;
    }
  }

  async torielTalk() {
    if (!this.flags.metChris) {
      await this.say("toriel", "Text me when you get there. Text me when you leave. Text me when you breathe.", { emotion: "soft" });
      await this.say("srif", "Mom.");
      await this.say("toriel", "I'm joking. Mostly. Take the thermos.", { emotion: "stern" });
    } else {
      await this.say("toriel", "Go on, dear. I'll be here. Freezing responsibly.", { emotion: "soft" });
    }
  }

  async asgoreTalk() {
    if (!this.flags.metChris) {
      await this.say("asgore", "Srif! If anyone gives you trouble, tell them your dad is a police officer.", { emotion: "laugh" });
      await this.say("srif", "And?");
      await this.say("asgore", "And a Dreemurr. And very good at hugging.", { emotion: "laugh" });
      await this.say("srif", "Please don't hug me in front of the town.");
      await this.say("asgore", "No promises.", { emotion: "laugh" });
    } else {
      await this.say("asgore", "That's my boy. Back in one piece. Mostly.", { emotion: "soft" });
    }
  }

  async snowmanTalk() {
    await this.say("snowman", "Hi. I'm Mr. Frost. I'm not okay. But I'm festive.");
    await this.say("srif", "...Same.");
    await this.say("snowman", "Stay warm, kid.");
  }

  async kidTalk() {
    await this.say("kid", "Are you the new kid? You look like a ghost with a backpack.");
    await this.say("srif", "Thanks.");
    await this.say("kid", "That was a compliment.");
  }

  async catTalk() {
    await this.say("narrator", "The cat is warm. It has no interest in your emotional arc.");
    await this.say("srif", "Fair.");
  }

  async dinerChrisTalk() {
    if (this.flags.metMich) {
      await this.say("chris", "Bathroom's right there. I'll guard the cocoa with my life.", { emotion: "laugh" });
    } else {
      await this.say("chris", "Bathroom's right there. I'll guard the cocoa with my life.", { emotion: "laugh" });
    }
    await this.say("srif", "That's a lot of pressure for cocoa.");
    await this.say("chris", "It's very good cocoa.", { emotion: "smile" });
  }

  /* ------------------------------------------------------------------ */
  /* story                                                               */
  /* ------------------------------------------------------------------ */

  async runIntro() {
    this.mode = "intro";
    this.cinematic = true;
    this.player.hidden = true;
    this.location = "OPPIDAN — HOLLY STREET";
    this.objective = "";
    this.fade.alpha = 1;
    this.fade.target = 0;
    this.fade.speed = 1.2;
    this.audio.playTrack("warm");

    await this.fadeTo(0, 1.0);
    await this.say("narrator", "Oppidan has two seasons: winter, and getting ready for winter.");
    await this.say("narrator", "W. D. Comic Srifken Dreemurr — Srif to everyone who loved him — was seventeen, and very good at pretending to be fine.");
    await this.panCamera(180, 196, 2.2);
    await this.say("narrator", "The Dreemurrs left when he was small. They came back with a moving truck, four coats, and an apology neither parent said out loud.");
    await this.say("toriel", "Srif, honey. Your thermals.", { emotion: "soft" });
    await this.say("srif", "I'm wearing them.");
    await this.say("toriel", "All three?", { emotion: "stern" });
    await this.say("srif", "...All three.");
    await this.say("asgore", "That's my boy! Warm as a furnace. A little furnace. A furnace with a backpack.", { emotion: "laugh" });
    await this.say("toriel", "Asgore.");
    await this.say("asgore", "Yes, dear.");
    await this.say("toriel", "You're a police officer. Please act like one.", { emotion: "stern" });
    await this.say("asgore", "I am acting like one. I'm patrolling the sidewalk. Very dangerous sidewalk.", { emotion: "laugh" });
    await this.panCamera(320, 196, 2.4);
    await this.say("narrator", "Srif's phone buzzed. CHRIS: YOU'RE HERE. I KNOW YOU'RE HERE. I'M AT THE DINER. COME GET HUGGED.");
    await this.say("srif", "...Okay. I'm going.");
    await this.say("toriel", "Take the thermos.", { emotion: "soft" });
    await this.say("asgore", "And your father's luck!");
    await this.say("srif", "You don't have luck, Dad.");
    await this.say("asgore", "I have a badge.", { emotion: "laugh" });

    this.cinematic = false;
    this.player.hidden = false;
    this.mode = "town";
    this.objective = "Find Chris at the Holiday Diner";
    this.showBanner("OPPIDAN", "HOLLY STREET · 4:12 PM");
    this.audio.playTrack("town");
    await this.wait(0.4);
    await this.say("narrator", "The snow is already on your shoulders. It doesn't ask permission.");
  }

  async chrisScene() {
    if (this.flags.metChris || this.cinematic) return;
    this.cinematic = true;
    this.objective = "";
    this.audio.sfx("confirm");
    const chris = this.actors.find((a) => a.id === "chris");
    await this.say("narrator", "Chris looks up from his phone. He sees you.");
    await this.say("chris", "Wait. Wait wait wait.", { emotion: "laugh" });
    await this.say("narrator", "He crosses the street at a speed that should be illegal.");
    if (chris) await this.moveActor(chris, this.player.x + 30, this.player.y + 2, 0.5);
    await this.say("narrator", "You hug him first.");
    await this.say("chris", "You're here. You're actually here.", { emotion: "laugh" });
    await this.say("srif", "I'm here.");
    await this.say("chris", "You're freezing. Where's your thermal?", { emotion: "concerned" });
    await this.say("srif", "I'm wearing three.");
    await this.say("chris", "I meant your emotional thermal.");
    await this.say("srif", "...Also three.");
    await this.say("chris", "You're still you.", { emotion: "smile" });
    await this.say("chris", "Come inside. Cocoa's on. Bathroom's inside. The door locks. It's the pride of the Holiday family.", { emotion: "laugh" });
    await this.say("srif", "Your family's pride is a bathroom door?");
    await this.say("chris", "We have a lot of pride.", { emotion: "smile" });
    this.flags.metChris = true;
    await this.fadeTo(1, 0.8);
    this.enterDiner();
    await this.fadeTo(0, 0.8);
    this.cinematic = false;
    this.objective = "Wash up in the restroom (right side)";
    await this.say("chris", "Welcome to the Holiday Diner. Best cocoa in Oppidan. Only cocoa in Oppidan.", { emotion: "laugh" });
    await this.say("srif", "That's not a high bar.");
    await this.say("chris", "It's a warm bar. Bathroom's to the right. Wash up, then cocoa.", { emotion: "smile" });
  }

  enterDiner() {
    this.world = new World("diner");
    this.setupDinerActors();
    this.player = {
      id: "srif", x: 240, y: 214, dir: "up", frame: 0, moving: false,
      stepTimer: 0, hidden: false, sprite: "srif",
    };
    this.camera = { x: 0, y: 0 };
    this.mode = "diner";
    this.location = "HOLIDAY DINER — 4:26 PM";
    this.objective = "Wash up in the restroom (right side)";
    this.showBanner("HOLIDAY DINER", "BEST COCOA IN OPPIDAN");
    this.audio.playTrack("diner");
  }

  async goDiner() {
    if (this.cinematic) return;
    this.cinematic = true;
    await this.fadeTo(1, 0.6);
    this.enterDiner();
    await this.fadeTo(0, 0.7);
    this.cinematic = false;
    await this.say("chris", "There he is. The prodigal son. The cocoa heir.", { emotion: "laugh" });
  }

  async goBathroom() {
    if (this.cinematic) return;
    this.cinematic = true;
    this.audio.sfx("door");
    await this.fadeTo(1, 0.55);
    this.world = new World("bathroom");
    this.actors = [];
    this.player = {
      id: "srif", x: 52, y: 224, dir: "up", frame: 0, moving: false,
      stepTimer: 0, hidden: false, sprite: "srif",
    };
    this.camera = { x: 0, y: 0 };
    this.mode = "bathroom";
    this.location = "HOLIDAY DINER — RESTROOM";
    this.objective = "Wash your hands";
    this.showBanner("RESTROOM", "THE PRIDE OF THE HOLIDAY FAMILY");
    this.audio.playTrack("diner");
    await this.fadeTo(0, 0.7);
    this.cinematic = false;
    await this.say("narrator", "The bathroom is small, warm, and aggressively teal. The tap coughs twice before it remembers how to be water.");
    await this.say("srif", "Okay. Wash hands. Be normal. Go drink cocoa.");
  }

  async sinkScene() {
    if (this.flags.metMich || this.cinematic) return;
    this.cinematic = true;
    this.objective = "";
    const sink = this.world.interactables.find((i) => i.id === "sink");
    if (sink) sink.active = false;
    await this.say("narrator", "The tap coughs. The door bangs open.");
    this.audio.sfx("door");
    const mich = this.addActor({
      id: "mich", name: "Mich", x: 52, y: 250, dir: "up", sprite: "mich",
      label: "talk to Mich", interact: () => this.michTalk(), soft: false,
    });
    await this.moveActor(mich, 170, 170, 0.75);
    await this.say("mich", "Yo. Watch the—", { emotion: "neutral" });
    this.splash(250, 132);
    this.shake = 9;
    this.audio.sfx("splash");
    await this.say("narrator", "The tap jumps. Cold water arcs across the room. It hits the tiger's jacket.");
    await this.say("mich", "...You.", { emotion: "neutral" });
    await this.say("narrator", "He moves fast. Your back hits the tile. A paw pins your collar.");
    this.impact = 1.2;
    this.shake = 13;
    this.flash = 0.5;
    this.audio.sfx("hit");
    await this.say("mich", "You think you can just—", { emotion: "neutral" });
    await this.say("narrator", "His eyes narrow. Then widen.");
    await this.say("mich", "...Srif?", { emotion: "surprised" });
    await this.say("srif", "Hi, Mich.", { emotion: "scared" });
    await this.say("narrator", "The paw lets go. Mich steps back like the floor is hot.");
    await this.say("mich", "Your face got taller.", { emotion: "soft" });
    await this.say("srif", "Your hat got blacker.");
    await this.say("mich", "...It's the same hat.", { emotion: "soft" });
    await this.say("srif", "I know.");
    await this.say("mich", "You sprayed me.", { emotion: "soft" });
    await this.say("srif", "I know.");
    await this.say("mich", "...You're still weird.", { emotion: "soft" });
    await this.say("narrator", "He offers a paw. You take it.");
    await this.say("mich", "I thought you weren't coming back.", { emotion: "soft" });
    await this.say("srif", "I thought so too.");
    await this.say("mich", "You look... like you're holding your breath.", { emotion: "soft" });
    await this.say("srif", "...I'm fine.");
    await this.say("mich", "Sure. Everybody's fine.", { emotion: "soft" });
    await this.say("mich", "Hey. The mirror in here is busted. Shows stuff weird. Don't stare at it too long.", { emotion: "soft" });
    await this.say("narrator", "The door clicks shut. The mirror is very quiet.");
    this.audio.sfx("door");
    await this.moveActor(mich, 52, 250, 0.65);
    mich.hidden = true;
    await this.say("srif", "It's just a mirror.");
    this.flags.metMich = true;
    this.cinematic = false;
    this.objective = "Look in the mirror";
    this.audio.playTrack("warm");
  }

  async michTalk() {
    await this.say("mich", "You gonna stand there, or are you gonna wash your hands?", { emotion: "soft" });
  }

  async mirrorScene() {
    if (this.flags.mirrorDone || this.cinematic) return;
    this.cinematic = true;
    this.objective = "";
    await this.say("narrator", "Demon Face Syndrome, the doctors called it. A face that only ever happened to you. A reflection that arrived a half-second late.");
    await this.say("reflection", "Hi, Srif.", { emotion: "demon" });
    await this.say("srif", "…", { emotion: "scared" });
    await this.say("reflection", "You're still wearing me.", { emotion: "demon" });
    await this.say("srif", "I'm not wearing anything.");
    await this.say("reflection", "You're doing it right now. The smile. The little nod. The 'I'm fine.'", { emotion: "demon" });
    await this.say("srif", "…");
    await this.say("reflection", "What happens when you stop?", { emotion: "demon" });
    const choice = await this.choose(["LOOK BACK.", "LOOK AWAY."]);
    if (choice === 1) {
      await this.say("reflection", "You can't. I'm behind your eyes.", { emotion: "demon" });
      await this.say("srif", "...Yeah. I know.");
    }
    await this.fadeTo(1, 0.55);
    this.mode = "battle";
    this.battle = new Battle(this);
    const battlePromise = this.battle.run();
    await this.fadeTo(0, 0.6);
    const result = await battlePromise;
    this.battle = null;
    this.mode = "bathroom";
    this.flags.mirrorDone = true;
    this.flags.spared = !!result.spared;
    this.flags.violent = !result.spared && !result.skipped;
    this.flags.skipped = !!result.skipped;
    this.endingStats = result;
    await this.fadeTo(1, 0.8);
    this.audio.playTrack("warm");
    this.mode = "bathroom";
    this.cinematic = true;
    this.player.hidden = false;
    this.player.x = 240;
    this.player.y = 160;
    this.player.dir = "up";
    this.objective = "";
    this.showBanner("THE MIRROR", "SOMETHING LET GO");
    await this.fadeTo(0, 0.8);

    if (result.skipped) {
      await this.say("narrator", "You step back from the mirror. It doesn't follow.");
      await this.say("srif", "Not today.");
    } else if (result.spared) {
      await this.say("narrator", "The mirror cracks. Not shattering. Just... letting go.");
      await this.say("srif", "I'm still here.");
      await this.say("reflection", "Yeah. I know.", { emotion: "soft" });
    } else {
      await this.say("narrator", "The mirror shatters. For a second, the face is gone. Then it's yours again, in every shard.");
      await this.say("srif", "…I'm sorry.", { emotion: "sad" });
      await this.say("echo", "You always are.", { emotion: "demon" });
    }

    await this.fadeTo(1, 0.8);
    this.enterEndingDiner();
    await this.fadeTo(0, 0.8);
    this.cinematic = false;
    await this.endingDialogue(result);
  }

  enterEndingDiner() {
    this.world = new World("diner");
    this.player = {
      id: "srif", x: 240, y: 206, dir: "up", frame: 0, moving: false,
      stepTimer: 0, hidden: false, sprite: "srif",
    };
    this.actors = [
      this.makeActor({
        id: "chris", name: "Chris", x: 300, y: 150, dir: "left", sprite: "chris",
        label: "talk to Chris", interact: () => this.endingChrisTalk(),
      }),
      this.makeActor({
        id: "mich", name: "Mich", x: 350, y: 152, dir: "left", sprite: "mich", soft: true,
        label: "talk to Mich", interact: () => this.endingMichTalk(),
      }),
    ];
    this.camera = { x: 0, y: 0 };
    this.mode = "diner";
    this.location = "HOLIDAY DINER — 5:02 PM";
    this.objective = "";
    this.showBanner("HOLIDAY DINER", "STILL WARM");
    this.audio.playTrack("warm");
  }

  async endingChrisTalk() {
    await this.say("chris", "You want more cocoa? I can add a fourth marshmallow. I'm not supposed to, but I can.", { emotion: "smile" });
  }

  async endingMichTalk() {
    await this.say("mich", "Your cocoa's getting cold. Drink it before I do.", { emotion: "soft" });
  }

  async endingDialogue(result) {
    await this.say("chris", "Srif? You okay? You look like you saw a ghost.", { emotion: "concerned" });
    await this.say("srif", "Just my reflection.");
    if (result.skipped) {
      await this.say("mich", "You ran from a mirror.", { emotion: "soft" });
      await this.say("srif", "It was a very scary mirror.");
      await this.say("mich", "...Fair.", { emotion: "soft" });
    } else if (result.violent) {
      await this.say("mich", "You look like you fought the mirror and the mirror won.", { emotion: "soft" });
      await this.say("srif", "Something like that.");
    } else {
      await this.say("mich", "Told you. Busted.", { emotion: "soft" });
    }
    await this.say("chris", "Cocoa?", { emotion: "smile" });
    await this.say("srif", "...Yeah. Cocoa.");
    await this.say("narrator", "The diner is warm. Mich steals the marshmallows off your cocoa. Chris lets him. Outside, the snow keeps falling.");
    await this.say("narrator", "You don't know if you're good. You don't know if the face in the mirror will ever feel like yours.");
    await this.say("narrator", "But you're here. And you're warm. For now, that's enough.");
    await this.say("srif", "Hey, Chris?");
    await this.say("chris", "Yeah?", { emotion: "smile" });
    await this.say("srif", "Thanks for recognizing me.");
    await this.say("chris", "Always.", { emotion: "smile" });
    this.finishEnding(result);
  }

  finishEnding(result) {
    this.mode = "ending";
    this.cinematic = false;
    this.objective = "";
    if (this.ui) {
      this.ui.showEnding({
        spared: !!result.spared,
        violent: !!result.violent,
        skipped: !!result.skipped,
        turns: result.turns || 0,
        hp: result.hp,
        maxHp: result.maxHp,
      });
      this.ui.hidePauseButton();
    }
    this.audio.playTrack("warm");
  }

  /* ------------------------------------------------------------------ */
  /* draw                                                                */
  /* ------------------------------------------------------------------ */

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, VW, VH);
    ctx.save();
    if (this.mode === "title") {
      this._drawTitle(ctx);
    } else if (this.mode === "battle") {
      if (this.battle) this.battle.draw(ctx);
    } else if (this.mode === "ending") {
      this._drawWorld(ctx, false);
    } else {
      this._drawWorld(ctx, this.mode !== "intro");
    }
    ctx.restore();

    if (this.mode !== "battle") {
      this._drawSnow(ctx);
    }

    this.dialogue.draw(ctx);

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 250, 240, ${this.flash * 0.35})`;
      ctx.fillRect(0, 0, VW, VH);
    }
    if (this.impact > 0) {
      const grad = ctx.createRadialGradient(VW / 2, VH / 2, 40, VW / 2, VH / 2, 300);
      grad.addColorStop(0, "rgba(255, 20, 60, 0)");
      grad.addColorStop(1, `rgba(120, 0, 20, ${Math.min(0.55, this.impact * 0.45)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VW, VH);
    }

    if (this.fade.alpha > 0) {
      ctx.fillStyle = `rgba(2, 4, 10, ${this.fade.alpha})`;
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  _drawWorld(ctx, hud) {
    if (!this.world) return;
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    const shakeY = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    const camX = this.camera.x + shakeX;
    const camY = this.camera.y + shakeY;
    ctx.save();
    this.world.drawBackground(ctx, camX, camY);
    this.world.drawDynamic(ctx, camX, camY, this.time, this.reduceMotion);

    // actors + player, depth sorted by feet
    const drawables = [];
    for (const actor of this.actors) {
      if (actor.hidden) continue;
      drawables.push({ type: "actor", y: actor.y, actor });
    }
    if (!this.player.hidden) drawables.push({ type: "player", y: this.player.y, actor: this.player });
    drawables.sort((a, b) => a.y - b.y);
    for (const item of drawables) {
      const actor = item.actor;
      const fn = SPRITES[actor.sprite] || drawSrif;
      const x = actor.x - camX;
      const y = actor.y - camY;
      if (x < -40 || y < -50 || x > VW + 40 || y > VH + 40) continue;
      if (actor.sprite === "snowman") fn(ctx, x, y, this.time);
      else if (actor.sprite === "cat") fn(ctx, x, y, this.time);
      else fn(ctx, x, y, {
        dir: actor.dir,
        frame: actor.frame || 0,
        time: this.time,
        moving: actor.moving,
        soft: actor.soft,
        stern: actor.id === "toriel",
        demon: actor.demon,
      });
    }

    // fx
    for (const p of this.fx) {
      const x = p.x - camX;
      const y = p.y - camY;
      if (p.type === "breath") {
        ctx.fillStyle = `rgba(225, 240, 255, ${Math.min(0.28, (p.life / p.maxLife) * 0.3)})`;
        ctx.beginPath();
        ctx.arc(x, y, p.size + (1 - p.life / p.maxLife) * 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(160, 225, 255, ${Math.min(0.8, p.life * 1.6)})`;
        ctx.fillRect(Math.round(x), Math.round(y), p.size, p.size);
      }
    }

    // markers
    if (this.mode === "town" && !this.flags.metChris) {
      const chris = this.actors.find((a) => a.id === "chris");
      if (chris && !chris.hidden) this._drawMarker(ctx, chris.x - camX, chris.y - camY - 43, "heart");
    }
    if (this.mode === "bathroom" && this.flags.metMich && !this.flags.mirrorDone) {
      this._drawMarker(ctx, 240 - camX, 96 - camY, "eye");
    }

    // interaction prompt
    if (this.nearest && !this.dialogue.active && !this.cinematic) {
      this._drawPrompt(ctx, this.nearest.x - camX, this.nearest.y - camY - 34, this.nearest.label);
    }

    // HUD
    if (hud) this._drawHUD(ctx);

    // banner
    this._drawBanner(ctx);

    ctx.restore();
  }

  _drawHUD(ctx) {
    const x = 10;
    const y = 8;
    const w = 248;
    const h = this.objective ? 38 : 26;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "rgba(6, 10, 24, 0.78)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(140, 170, 225, 0.42)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(x, y, 3, h);
    // tiny heart
    const hx = x + 12;
    const hy = y + 10;
    ctx.fillStyle = "#ff5d73";
    ctx.fillRect(hx - 2, hy - 1, 2, 2);
    ctx.fillRect(hx + 1, hy - 1, 2, 2);
    ctx.fillRect(hx - 3, hy + 1, 7, 2);
    ctx.fillRect(hx - 2, hy + 3, 5, 1);
    drawText(ctx, this.location, x + 22, y + 5, {
      font: '6px "Press Start 2P", monospace',
      color: "#9ecbff",
      shadow: "#000",
    });
    if (this.objective) {
      drawText(ctx, this.objective, x + 12, y + 20, {
        font: '16px "VT323", monospace',
        color: "#eaf3ff",
        shadow: "#000",
        maxWidth: w - 24,
      });
    }
    ctx.restore();
  }

  _drawPrompt(ctx, x, y, label) {
    const text = this.ui && this.ui.touchMode ? "TAP" : "Z";
    const bob = Math.sin(this.time * 4) * 1.5;
    ctx.save();
    ctx.fillStyle = "rgba(6, 10, 24, 0.9)";
    ctx.fillRect(x - 11, y - 9 + bob, 22, 16);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 10.5, y - 8.5 + bob, 21, 15);
    drawText(ctx, text, x, y - 7 + bob, {
      font: '7px "Press Start 2P", monospace',
      color: "#ffd166",
      align: "center",
      shadow: "#000",
    });
    if (this.ui && !this.ui.touchMode) {
      drawText(ctx, label, x, y - 16 + bob, {
        font: '13px "VT323", monospace',
        color: "#cfe0ff",
        align: "center",
        shadow: "#000",
      });
    }
    ctx.restore();
  }

  _drawMarker(ctx, x, y, kind) {
    const bob = Math.sin(this.time * 4) * 2;
    ctx.save();
    if (kind === "heart") {
      ctx.fillStyle = "rgba(255, 77, 109, 0.2)";
      ctx.beginPath();
      ctx.arc(x, y + bob, 12 + Math.sin(this.time * 5) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff5d73";
      ctx.fillRect(x - 2, y - 4 + bob, 2, 2);
      ctx.fillRect(x + 1, y - 4 + bob, 2, 2);
      ctx.fillRect(x - 3, y - 2 + bob, 7, 2);
      ctx.fillRect(x - 2, y + 0 + bob, 5, 1);
      ctx.fillRect(x - 1, y + 1 + bob, 3, 1);
    } else {
      ctx.fillStyle = "rgba(150, 235, 255, 0.18)";
      ctx.beginPath();
      ctx.arc(x, y + bob, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#9fe8ff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, y + bob, 6, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#9fe8ff";
      ctx.beginPath();
      ctx.arc(x, y + bob, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawBanner(ctx) {
    if (this.banner.timer <= 0) return;
    const t = this.banner.timer;
    const d = this.banner.duration;
    const fadeIn = clamp((d - t) / 0.35, 0, 1);
    const fadeOut = clamp(t / 0.55, 0, 1);
    const alpha = Math.min(fadeIn, fadeOut);
    const y = 58;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(4, 8, 20, 0.62)";
    ctx.fillRect(0, y - 10, VW, 36);
    ctx.strokeStyle = "rgba(160, 190, 240, 0.22)";
    ctx.beginPath();
    ctx.moveTo(0, y - 10);
    ctx.lineTo(VW, y - 10);
    ctx.moveTo(0, y + 26);
    ctx.lineTo(VW, y + 26);
    ctx.stroke();
    drawText(ctx, this.banner.text, VW / 2, y - 3, {
      font: '10px "Press Start 2P", monospace',
      color: "#fff4d0",
      align: "center",
      shadow: "#000",
    });
    if (this.banner.sub) {
      drawText(ctx, this.banner.sub, VW / 2, y + 12, {
        font: '14px "VT323", monospace',
        color: "#a9c9f5",
        align: "center",
        shadow: "#000",
      });
    }
    ctx.restore();
  }

  _drawSnow(ctx) {
    if (this.mode === "diner" || this.mode === "bathroom" || this.mode === "battle" || this.mode === "ending") return;
    if (this.mode !== "title" && !this.world) return;
    const count = this.reduceMotion ? 45 : 110;
    ctx.save();
    for (let i = 0; i < count; i += 1) {
      const f = this.snow[i];
      if (!f) continue;
      const size = f.z > 0.7 ? 2 : 1;
      const alpha = 0.22 + f.z * 0.5;
      ctx.fillStyle = `rgba(235, 246, 255, ${alpha})`;
      ctx.fillRect(Math.round(f.x), Math.round(f.y), size, size);
      if (f.z > 0.85) {
        ctx.fillStyle = `rgba(180, 215, 255, ${alpha * 0.5})`;
        ctx.fillRect(Math.round(f.x) + 1, Math.round(f.y) + 1, 1, 1);
      }
    }
    ctx.restore();
  }

  _drawTitle(ctx) {
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, VH);
    sky.addColorStop(0, "#070d22");
    sky.addColorStop(0.42, "#14244a");
    sky.addColorStop(0.72, "#2c2a4a");
    sky.addColorStop(1, "#0a0d1a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VW, VH);

    // stars
    for (let i = 0; i < 90; i += 1) {
      const x = hash(i, 4) * VW;
      const y = hash(i + 11, 4) * 150;
      const tw = 0.25 + Math.abs(Math.sin(this.time * 1.2 + i)) * 0.5;
      ctx.fillStyle = `rgba(220, 235, 255, ${tw * (1 - y / 190)})`;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }

    // moon
    const mx = 374;
    const my = 54;
    const glow = ctx.createRadialGradient(mx, my, 2, mx, my, 46);
    glow.addColorStop(0, "rgba(220, 235, 255, 0.22)");
    glow.addColorStop(1, "rgba(220, 235, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(mx - 50, my - 50, 100, 100);
    ctx.fillStyle = "#e8f2ff";
    ctx.beginPath();
    ctx.arc(mx, my, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(150, 175, 215, 0.35)";
    ctx.beginPath();
    ctx.arc(mx - 7, my - 5, 4, 0, Math.PI * 2);
    ctx.arc(mx + 8, my + 6, 3, 0, Math.PI * 2);
    ctx.arc(mx + 2, my - 11, 2, 0, Math.PI * 2);
    ctx.fill();

    // aurora
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 4; i += 1) {
      const grad = ctx.createLinearGradient(0, 40 + i * 20, 0, 170);
      grad.addColorStop(0, "rgba(90, 220, 200, 0)");
      grad.addColorStop(0.5, `rgba(90, 220, 200, ${0.018 + i * 0.008})`);
      grad.addColorStop(1, "rgba(150, 120, 255, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-40, 170);
      ctx.quadraticCurveTo(140 + i * 20, 40 + Math.sin(this.time * 0.2 + i) * 18, 300, 150);
      ctx.lineTo(480, 190);
      ctx.lineTo(480, 220);
      ctx.lineTo(-40, 220);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // distant mountains
    ctx.fillStyle = "#17254a";
    ctx.beginPath();
    ctx.moveTo(0, 180);
    ctx.lineTo(60, 118);
    ctx.lineTo(122, 168);
    ctx.lineTo(188, 104);
    ctx.lineTo(262, 174);
    ctx.lineTo(340, 122);
    ctx.lineTo(414, 168);
    ctx.lineTo(480, 132);
    ctx.lineTo(480, 220);
    ctx.lineTo(0, 220);
    ctx.closePath();
    ctx.fill();
    // snow caps
    ctx.fillStyle = "rgba(210, 230, 255, 0.5)";
    ctx.beginPath();
    ctx.moveTo(60, 118);
    ctx.lineTo(72, 132);
    ctx.lineTo(48, 132);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(188, 104);
    ctx.lineTo(202, 122);
    ctx.lineTo(174, 122);
    ctx.closePath();
    ctx.fill();

    // town silhouette
    const townY = 196;
    ctx.fillStyle = "#0b1328";
    ctx.fillRect(0, townY, VW, 60);
    const buildings = [
      [18, 36, 24], [48, 26, 30], [78, 46, 22], [128, 30, 34], [162, 22, 26],
      [192, 38, 40], [238, 52, 24], [266, 30, 32], [302, 42, 20], [328, 26, 36],
      [372, 34, 28], [406, 20, 32], [442, 40, 22],
    ];
    for (const [bx, bh, bw] of buildings) {
      ctx.fillRect(bx, townY - bh, bw, bh + 60);
      // roof
      ctx.beginPath();
      ctx.moveTo(bx - 3, townY - bh);
      ctx.lineTo(bx + bw / 2, townY - bh - 12);
      ctx.lineTo(bx + bw + 3, townY - bh);
      ctx.closePath();
      ctx.fill();
      // windows
      for (let wy = townY - bh + 8; wy < townY + 20; wy += 10) {
        for (let wx = bx + 5; wx < bx + bw - 4; wx += 9) {
          if (hash(wx, wy) > 0.45) {
            ctx.fillStyle = hash(wx + 3, wy) > 0.5 ? "rgba(255, 209, 102, 0.8)" : "rgba(255, 180, 120, 0.55)";
            ctx.fillRect(wx, wy, 2, 2);
            ctx.fillStyle = "#0b1328";
          }
        }
      }
    }
    // church steeple
    ctx.fillStyle = "#0b1328";
    ctx.beginPath();
    ctx.moveTo(214, townY - 38);
    ctx.lineTo(222, townY - 58);
    ctx.lineTo(230, townY - 38);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(218, townY - 42, 8, 10);

    // snowy foreground
    const snowGrad = ctx.createLinearGradient(0, 218, 0, 270);
    snowGrad.addColorStop(0, "#cfe0f2");
    snowGrad.addColorStop(1, "#8fa8c6");
    ctx.fillStyle = snowGrad;
    ctx.beginPath();
    ctx.moveTo(0, 232);
    ctx.quadraticCurveTo(90, 214, 180, 230);
    ctx.quadraticCurveTo(300, 250, 480, 224);
    ctx.lineTo(480, 270);
    ctx.lineTo(0, 270);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.moveTo(0, 232);
    ctx.quadraticCurveTo(90, 214, 180, 230);
    ctx.quadraticCurveTo(300, 250, 480, 224);
    ctx.lineTo(480, 230);
    ctx.quadraticCurveTo(300, 256, 180, 236);
    ctx.quadraticCurveTo(90, 220, 0, 238);
    ctx.closePath();
    ctx.fill();

    // lamp and bench
    this._drawTitleLamp(ctx, 70, 246);
    this._drawTitleLamp(ctx, 414, 242);
    // two small figures
    drawSrif(ctx, 96, 258, { dir: "right", time: this.time });
    drawChris(ctx, 384, 258, { dir: "left", time: this.time });

    // a small floating heart over the town
    const hb = Math.sin(this.time * 2) * 3;
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = "#ff5d73";
    const hx = 240;
    const hy = 154 + hb;
    ctx.fillRect(hx - 3, hy - 3, 3, 3);
    ctx.fillRect(hx + 1, hy - 3, 3, 3);
    ctx.fillRect(hx - 4, hy, 9, 3);
    ctx.fillRect(hx - 3, hy + 3, 7, 2);
    ctx.fillRect(hx - 2, hy + 5, 5, 1);
    ctx.restore();

    // foreground snowbank
    ctx.fillStyle = "rgba(240, 248, 255, 0.5)";
    ctx.beginPath();
    ctx.moveTo(0, 266);
    ctx.quadraticCurveTo(120, 254, 240, 264);
    ctx.quadraticCurveTo(380, 274, 480, 258);
    ctx.lineTo(480, 270);
    ctx.lineTo(0, 270);
    ctx.closePath();
    ctx.fill();
  }

  _drawTitleLamp(ctx, x, y) {
    ctx.fillStyle = "#121a2e";
    ctx.fillRect(x - 1, y - 34, 2, 34);
    ctx.fillRect(x - 3, y - 2, 6, 2);
    ctx.fillRect(x - 5, y - 37, 10, 4);
    ctx.fillStyle = "#ffd98a";
    ctx.fillRect(x - 3, y - 35, 6, 2);
    const glow = ctx.createRadialGradient(x, y - 34, 1, x, y - 34, 34);
    glow.addColorStop(0, "rgba(255, 210, 120, 0.28)");
    glow.addColorStop(1, "rgba(255, 210, 120, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 36, y - 70, 72, 72);
  }
}
