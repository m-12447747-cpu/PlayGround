import { clamp, COLORS } from "./constants.js";
import { drawText, wrapText, measure } from "./text.js";
import { drawEnemyReflection } from "./sprites.js";

const BOARD = { x: 110, y: 98, w: 260, h: 118 };
const COMMAND = { x: 24, y: 184, w: 432, h: 64 };
const COMMANDS = ["FIGHT", "ACT", "ITEM", "SPARE"];
const ACTS = ["CHECK", "SMILE", "REMEMBER", "SAY YOUR NAME"];

function r(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

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

function drawHeart(ctx, x, y, scale = 1, color = "#ff4d6d") {
  const s = scale;
  r(ctx, x - 3 * s, y - 3 * s, 3 * s, 3 * s, color);
  r(ctx, x + 1 * s, y - 3 * s, 3 * s, 3 * s, color);
  r(ctx, x - 4 * s, y - 1 * s, 9 * s, 3 * s, color);
  r(ctx, x - 3 * s, y + 2 * s, 7 * s, 2 * s, color);
  r(ctx, x - 2 * s, y + 4 * s, 5 * s, 1 * s, color);
  r(ctx, x - 1 * s, y + 5 * s, 3 * s, 1 * s, color);
  r(ctx, x - 3 * s, y - 2 * s, 2 * s, 1 * s, "#ff9db1");
}

export class Battle {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this.resolve = null;
    this.finished = false;
    this.time = 0;
    this.phase = "intro";
    this.introIndex = 0;
    this.introLines = [
      ["narrator", "The mirror is cold. The face inside is not."],
      ["reflection", "You smile at everyone. You practice in the mirror. You're doing it right now."],
      ["reflection", "What happens when you stop?"],
    ];
    this.message = "";
    this.messageTimer = 0;
    this.messageHold = 0;
    this.commandIndex = 0;
    this.actIndex = 0;
    this.itemIndex = 0;
    this.spareIndex = 0;
    this.defeats = 0;
    this.maxHp = 20;
    this.hp = 20;
    this.tp = 0;
    this.mercy = 0;
    this.maxEnemyHp = 72;
    this.enemyHp = 72;
    this.checked = false;
    this.turn = 1;
    this.items = { cocoa: 2, warmer: 1 };
    this.bullets = [];
    this.soul = { x: BOARD.x + BOARD.w / 2, y: BOARD.y + BOARD.h / 2 };
    this.invuln = 0;
    this.hitFlash = 0;
    this.enemyFlash = 0;
    this.shake = 0;
    this.turnTimer = 0;
    this.spawnTimer = 0;
    this.navCooldown = 0;
    this.fightPos = 0;
    this.fightDir = 1;
    this.fightResult = 0;
    this.taunt = "You're still holding your breath.";
    this.commandRects = [];
    this.listRects = [];
    this.spareEndKind = null;
    this.defeatIndex = 0;
    this.damageNumbers = [];
    this.particles = [];
    this.glitch = 0;
  }

  run() {
    this.game.audio.playTrack("battle");
    this.game.audio.sfx("battle");
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  finish(result) {
    if (this.finished) return;
    this.finished = true;
    const resolve = this.resolve;
    this.resolve = null;
    if (resolve) resolve({
      hp: this.hp,
      maxHp: this.maxHp,
      turns: this.turn,
      ...result,
    });
  }

  update(dt) {
    this.time += dt;
    this.navCooldown = Math.max(0, this.navCooldown - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 3);
    this.enemyFlash = Math.max(0, this.enemyFlash - dt * 4);
    this.shake = Math.max(0, this.shake - dt * 18);
    this.glitch = Math.max(0, this.glitch - dt * 3);

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const d of this.damageNumbers) {
      d.y -= 18 * dt;
      d.life -= dt;
    }
    this.damageNumbers = this.damageNumbers.filter((d) => d.life > 0);

    switch (this.phase) {
      case "intro":
        this._updateIntro();
        break;
      case "menu":
        this._updateMenu();
        break;
      case "act":
        this._updateAct();
        break;
      case "item":
        this._updateItem();
        break;
      case "fight":
        this._updateFight(dt);
        break;
      case "message":
        this._updateMessage(dt);
        break;
      case "enemyTurn":
        this._updateEnemyTurn(dt);
        break;
      case "victory":
      case "violentEnd":
      case "spareEnd":
        this._updateEnd(dt);
        break;
      case "defeat":
        this._updateDefeat();
        break;
      default:
        break;
    }
  }

  _updateIntro() {
    const input = this.game.input;
    const tap = input.consumeTap();
    if (tap || input.justPressed("confirm")) {
      this.introIndex += 1;
      this.game.audio.sfx("select");
      if (this.introIndex >= this.introLines.length) {
        this.phase = "menu";
        this.message = "What will you do?";
      }
    }
  }

  _stickNav(axis) {
    const input = this.game.input;
    const move = input.getMove();
    const value = axis === "x" ? move.x : move.y;
    if (Math.abs(value) > 0.62 && this.navCooldown <= 0) {
      this.navCooldown = 0.18;
      return Math.sign(value);
    }
    return 0;
  }

  _updateMenu() {
    const input = this.game.input;
    const tap = input.consumeTap();
    if (tap) {
      for (const rect of this.commandRects) {
        if (tap.x >= rect.x && tap.x <= rect.x + rect.w && tap.y >= rect.y && tap.y <= rect.y + rect.h) {
          this.commandIndex = rect.index;
          this._selectCommand();
          return;
        }
      }
    }
    let dir = 0;
    if (input.justPressed("left")) dir = -1;
    if (input.justPressed("right")) dir = 1;
    if (!dir) dir = this._stickNav("x");
    if (dir) {
      this.commandIndex = (this.commandIndex + dir + 4) % 4;
      this.game.audio.sfx("select");
    }
    if (input.justPressed("confirm")) this._selectCommand();
  }

  _selectCommand() {
    this.game.audio.sfx("confirm");
    if (this.commandIndex === 0) {
      this.phase = "fight";
      this.fightPos = 0;
      this.fightDir = 1;
      this.fightResult = 0;
    } else if (this.commandIndex === 1) {
      this.phase = "act";
      this.actIndex = 0;
      this.message = "ACT";
    } else if (this.commandIndex === 2) {
      this.phase = "item";
      this.itemIndex = 0;
      this.message = "ITEM";
    } else {
      this._selectSpare();
    }
  }

  _updateAct() {
    const input = this.game.input;
    const tap = input.consumeTap();
    if (tap) {
      for (const rect of this.listRects) {
        if (tap.x >= rect.x && tap.x <= rect.x + rect.w && tap.y >= rect.y && tap.y <= rect.y + rect.h) {
          this.actIndex = rect.index;
          this._selectAct();
          return;
        }
      }
    }
    let dir = 0;
    if (input.justPressed("up")) dir = -1;
    if (input.justPressed("down")) dir = 1;
    if (!dir) dir = this._stickNav("y");
    if (dir) {
      this.actIndex = (this.actIndex + dir + ACTS.length) % ACTS.length;
      this.game.audio.sfx("select");
    }
    if (input.justPressed("cancel")) {
      this.phase = "menu";
      this.game.audio.sfx("cancel");
      return;
    }
    if (input.justPressed("confirm")) this._selectAct();
  }

  _selectAct() {
    this.game.audio.sfx("confirm");
    const act = ACTS[this.actIndex];
    if (act === "CHECK") {
      this.checked = true;
      this._setMessage("THE REFLECTION — ATK 4 DEF 0. It knows your name.", 1.5, "enemyTurn");
    } else if (act === "SMILE") {
      this.mercy = Math.min(100, this.mercy + 34);
      this._setMessage("You smile. It feels like a lie. The reflection smiles back, tired.", 1.7, "enemyTurn");
      this.game.audio.sfx("mercy");
    } else if (act === "REMEMBER") {
      this.mercy = Math.min(100, this.mercy + 34);
      this._setMessage("Chris's hug. Mich's paw. Dad's terrible jokes. You are made of more than the mirror.", 1.9, "enemyTurn");
      this.game.audio.sfx("mercy");
    } else {
      this.mercy = Math.min(100, this.mercy + 34);
      this._setMessage("\"Srif.\" The reflection repeats it. It sounds like yours.", 1.7, "enemyTurn");
      this.game.audio.sfx("mercy");
    }
    if (this.mercy >= 100) {
      this.taunt = "The reflection is listening.";
    }
  }

  _updateItem() {
    const input = this.game.input;
    const options = this._itemOptions();
    const tap = input.consumeTap();
    if (tap) {
      for (const rect of this.listRects) {
        if (tap.x >= rect.x && tap.x <= rect.x + rect.w && tap.y >= rect.y && tap.y <= rect.y + rect.h) {
          this.itemIndex = rect.index;
          this._selectItem();
          return;
        }
      }
    }
    let dir = 0;
    if (input.justPressed("up")) dir = -1;
    if (input.justPressed("down")) dir = 1;
    if (!dir) dir = this._stickNav("y");
    if (dir) {
      this.itemIndex = (this.itemIndex + dir + options.length) % options.length;
      this.game.audio.sfx("select");
    }
    if (input.justPressed("cancel")) {
      this.phase = "menu";
      this.game.audio.sfx("cancel");
      return;
    }
    if (input.justPressed("confirm")) this._selectItem();
  }

  _itemOptions() {
    return [
      { label: `HOLIDAY COCOA  x${this.items.cocoa}`, disabled: this.items.cocoa <= 0, kind: "cocoa" },
      { label: `HAND WARMER    x${this.items.warmer}`, disabled: this.items.warmer <= 0, kind: "warmer" },
      { label: "BACK", kind: "back" },
    ];
  }

  _selectItem() {
    const options = this._itemOptions();
    const option = options[this.itemIndex];
    if (option.kind === "back") {
      this.phase = "menu";
      this.game.audio.sfx("cancel");
      return;
    }
    if (option.disabled) {
      this.game.audio.sfx("cancel");
      return;
    }
    this.game.audio.sfx("confirm");
    if (option.kind === "cocoa") {
      this.items.cocoa -= 1;
      this.hp = Math.min(this.maxHp, this.hp + 9);
      this._setMessage("You drink the cocoa. It tastes like someone believed you'd come back.", 1.6, "enemyTurn");
      this.game.audio.sfx("heal");
    } else {
      this.items.warmer -= 1;
      this.hp = Math.min(this.maxHp, this.hp + 4);
      this.tp = Math.min(100, this.tp + 20);
      this._setMessage("You squeeze the hand warmer. Your fingers remember being yours.", 1.5, "enemyTurn");
      this.game.audio.sfx("heal");
    }
  }

  _selectSpare() {
    this.game.audio.sfx("confirm");
    if (this.mercy >= 100) {
      this.phase = "spareEnd";
      this.messageTimer = 0;
      this.message = "You lower your hands. The reflection lowers its guard.";
      this.game.audio.sfx("spare");
    } else {
      this._setMessage("You offer a hand. The reflection flinches. Not yet.", 1.4, "enemyTurn");
    }
  }

  _setMessage(text, hold, nextPhase) {
    this.message = text;
    this.messageTimer = 0;
    this.messageHold = hold;
    this.nextPhase = nextPhase;
    this.phase = "message";
  }

  _updateMessage(dt) {
    this.messageTimer += dt;
    if (this.messageTimer >= this.messageHold) {
      if (this.nextPhase === "enemyTurn") {
        this._beginEnemyTurn();
      } else if (this.nextPhase === "victory") {
        this.phase = "victory";
        this.messageTimer = 0;
      } else if (this.nextPhase === "violentEnd") {
        this.phase = "violentEnd";
        this.messageTimer = 0;
      } else {
        this.phase = "menu";
      }
    }
  }

  _updateFight(dt) {
    this.fightPos += this.fightDir * dt * 1.65;
    if (this.fightPos > 1) {
      this.fightPos = 1;
      this.fightDir = -1;
    } else if (this.fightPos < 0) {
      this.fightPos = 0;
      this.fightDir = 1;
    }
    const input = this.game.input;
    if (input.justPressed("confirm")) {
      const center = 1 - Math.abs(this.fightPos - 0.5) * 2;
      const damage = Math.round(6 + center * 14);
      this.fightResult = damage;
      this.enemyHp = Math.max(0, this.enemyHp - damage);
      this.enemyFlash = 1;
      this.shake = 5;
      this.game.audio.sfx("hit");
      this.damageNumbers.push({ x: 240, y: 64, value: damage, life: 1.1 });
      if (this.enemyHp <= 0) {
        this._setMessage("The mirror shatters. For a second, the face is gone.", 1.8, "violentEnd");
      } else {
        this._setMessage(`You strike the glass. ${damage} damage. It doesn't feel like winning.`, 1.4, "enemyTurn");
      }
    }
    if (input.justPressed("cancel")) {
      this.phase = "menu";
      this.game.audio.sfx("cancel");
    }
  }

  _beginEnemyTurn() {
    this.phase = "enemyTurn";
    this.turnTimer = 7.6;
    this.spawnTimer = 0;
    this.bullets = [];
    this.soul.x = BOARD.x + BOARD.w / 2;
    this.soul.y = BOARD.y + BOARD.h / 2;
    this.invuln = 0.8;
    this.taunt = [
      "You're still holding your breath.",
      "Smile for me.",
      "You practiced this face for years.",
      "They'll see it eventually.",
      "What happens when you stop?",
    ][(this.turn - 1) % 5];
  }

  _updateEnemyTurn(dt) {
    const input = this.game.input;
    const move = input.getMove();
    const speed = 108;
    this.soul.x = clamp(this.soul.x + move.x * speed * dt, BOARD.x + 5, BOARD.x + BOARD.w - 5);
    this.soul.y = clamp(this.soul.y + move.y * speed * dt, BOARD.y + 5, BOARD.y + BOARD.h - 5);

    this.turnTimer -= dt;
    this.spawnTimer -= dt;

    if (this.turnTimer > 1.9 && this.spawnTimer <= 0) {
      this._spawnPattern();
    }

    for (const bullet of this.bullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      bullet.rot += (bullet.spin || 0) * dt;
    }
    this.bullets = this.bullets.filter((b) => {
      if (b.life <= 0) return false;
      if (b.x < BOARD.x - 30 || b.x > BOARD.x + BOARD.w + 30 || b.y < BOARD.y - 30 || b.y > BOARD.y + BOARD.h + 30) return false;
      return true;
    });

    for (const bullet of this.bullets) {
      const dist = Math.hypot(bullet.x - this.soul.x, bullet.y - this.soul.y);
      if (dist < bullet.r + 3.5 && this.invuln <= 0) {
        this._takeDamage(bullet.damage || 2);
        bullet.life = 0;
        break;
      } else if (!bullet.grazed && dist < bullet.r + 12) {
        bullet.grazed = true;
        this.tp = Math.min(100, this.tp + 2);
        this.game.audio.sfx("graze");
      }
    }

    if (this.turnTimer <= 0) {
      this.bullets = [];
      this.phase = "menu";
      this.turn += 1;
      this.commandIndex = 0;
      this.message = this.mercy >= 100 ? "The reflection is listening. SPARE is glowing." : "What will you do?";
    }
  }

  _spawnPattern() {
    const turn = this.turn;
    const board = BOARD;
    if (turn % 4 === 1) {
      this.spawnTimer = 0.36;
      const count = turn > 4 ? 2 : 1;
      for (let i = 0; i < count; i += 1) {
        const x = board.x + 12 + Math.random() * (board.w - 24);
        this.bullets.push({
          x, y: board.y - 8, vx: (Math.random() - 0.5) * 14, vy: 58 + Math.random() * 28,
          r: 4, life: 5, type: "tear", grazed: false, damage: 2,
        });
      }
    } else if (turn % 4 === 2) {
      this.spawnTimer = 0.62;
      const fromLeft = Math.random() < 0.5;
      const y = board.y + 12 + Math.random() * (board.h - 24);
      this.bullets.push({
        x: fromLeft ? board.x - 8 : board.x + board.w + 8,
        y,
        vx: fromLeft ? 112 : -112,
        vy: 0,
        r: 5,
        life: 5,
        type: "shard",
        grazed: false,
        damage: 2,
        rot: 0,
        spin: 4,
      });
      if (turn > 6 && Math.random() < 0.5) {
        const y2 = board.y + 12 + Math.random() * (board.h - 24);
        this.bullets.push({
          x: fromLeft ? board.x + board.w + 8 : board.x - 8,
          y: y2, vx: fromLeft ? -112 : 112, vy: 0, r: 5, life: 5, type: "shard", grazed: false, damage: 2, rot: 0, spin: -4,
        });
      }
    } else if (turn % 4 === 3) {
      this.spawnTimer = 0.5;
      const sx = board.x + board.w / 2;
      const sy = board.y - 6;
      const angle = Math.atan2(this.soul.y - sy, this.soul.x - sx);
      const speed = 92;
      this.bullets.push({
        x: sx, y: sy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        r: 4, life: 5, type: "eye", grazed: false, damage: 3, rot: 0, spin: 0,
      });
    } else {
      this.spawnTimer = 0.46;
      const x = board.x + 12 + Math.random() * (board.w - 24);
      this.bullets.push({
        x, y: board.y - 8, vx: (Math.random() - 0.5) * 20, vy: 66 + Math.random() * 34,
        r: 4, life: 5, type: "tear", grazed: false, damage: 2,
      });
      if (turn > 8 && Math.random() < 0.35) {
        const sx = board.x + board.w / 2;
        const sy = board.y + board.h / 2;
        for (let i = 0; i < 8; i += 1) {
          const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.2;
          this.bullets.push({
            x: sx, y: sy, vx: Math.cos(angle) * 72, vy: Math.sin(angle) * 72,
            r: 3, life: 4, type: "ring", grazed: false, damage: 2, rot: 0, spin: 2,
          });
        }
      }
    }
  }

  _takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.invuln = 1.15;
    this.hitFlash = 1;
    this.shake = 8;
    this.game.audio.sfx("hit");
    this.damageNumbers.push({ x: this.soul.x, y: this.soul.y - 8, value: amount, life: 1.0, hurt: true });
    if (this.hp <= 0) {
      this.phase = "defeat";
      this.defeats += 1;
      this.defeatIndex = 0;
      this.game.audio.sfx("battle");
    }
  }

  _updateDefeat() {
    const input = this.game.input;
    const options = this.defeats >= 2 ? 2 : 1;
    let dir = 0;
    if (input.justPressed("left") || input.justPressed("up")) dir = -1;
    if (input.justPressed("right") || input.justPressed("down")) dir = 1;
    if (!dir) dir = this._stickNav("x");
    if (dir) {
      this.defeatIndex = (this.defeatIndex + dir + options) % options;
      this.game.audio.sfx("select");
    }
    const tap = input.consumeTap();
    if (tap) {
      for (const rect of this.commandRects) {
        if (tap.x >= rect.x && tap.x <= rect.x + rect.w && tap.y >= rect.y && tap.y <= rect.y + rect.h) {
          this.defeatIndex = rect.index;
          this._confirmDefeat();
          return;
        }
      }
    }
    if (input.justPressed("confirm")) this._confirmDefeat();
  }

  _confirmDefeat() {
    this.game.audio.sfx("confirm");
    if (this.defeatIndex === 1) {
      this.finish({ spared: true, skipped: true, turns: this.turn });
      return;
    }
    this._resetFight();
  }

  _resetFight() {
    this.phase = "intro";
    this.introIndex = 0;
    this.hp = this.maxHp;
    this.tp = 0;
    this.mercy = 0;
    this.enemyHp = this.maxEnemyHp;
    this.checked = false;
    this.turn = 1;
    this.items = { cocoa: 2, warmer: 1 };
    this.bullets = [];
    this.soul.x = BOARD.x + BOARD.w / 2;
    this.soul.y = BOARD.y + BOARD.h / 2;
    this.message = "";
    this.commandIndex = 0;
    this.taunt = "You're still holding your breath.";
    this.game.audio.playTrack("battle");
  }

  _updateEnd(dt) {
    this.messageTimer += dt;
    if (this.messageTimer > (this.phase === "victory" ? 1.6 : 2.3)) {
      if (this.phase === "violentEnd") {
        this.finish({ spared: false, violent: true, turns: this.turn });
      } else {
        this.finish({ spared: true, turns: this.turn });
      }
    }
  }

  draw(ctx) {
    const shakeX = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    const shakeY = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    ctx.save();
    ctx.translate(Math.round(shakeX), Math.round(shakeY));

    // background
    const bg = ctx.createLinearGradient(0, 0, 0, 270);
    bg.addColorStop(0, "#081018");
    bg.addColorStop(0.55, "#0b1a24");
    bg.addColorStop(1, "#05080e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 480, 270);

    // tiles / mirror room suggestion
    ctx.save();
    ctx.globalAlpha = 0.12;
    for (let y = 0; y < 270; y += 18) {
      for (let x = 0; x < 480; x += 18) {
        if ((x / 18 + y / 18) % 2 === 0) {
          ctx.fillStyle = "#4a7c7c";
          ctx.fillRect(x, y, 18, 18);
        }
      }
    }
    ctx.restore();

    // glitch streaks
    if (!this.game.reduceMotion) {
      for (let i = 0; i < 4; i += 1) {
        const gy = (this.time * 31 + i * 47) % 270;
        ctx.fillStyle = i % 2 ? "rgba(255, 80, 120, 0.03)" : "rgba(90, 220, 255, 0.025)";
        ctx.fillRect(0, gy, 480, 2);
      }
    }

    // mirror frame
    const frameX = 168;
    const frameY = 18;
    const frameW = 144;
    const frameH = 64;
    r(ctx, frameX - 4, frameY - 4, frameW + 8, frameH + 8, "#6d512d");
    r(ctx, frameX - 2, frameY - 2, frameW + 4, frameH + 4, "#c9a45c");
    r(ctx, frameX, frameY, frameW, frameH, "#101a2a");
    const mirrorGrad = ctx.createLinearGradient(0, frameY, 0, frameY + frameH);
    mirrorGrad.addColorStop(0, "#2f4f6f");
    mirrorGrad.addColorStop(1, "#0d1624");
    ctx.fillStyle = mirrorGrad;
    ctx.fillRect(frameX + 2, frameY + 2, frameW - 4, frameH - 4);
    // reflection glimmer
    ctx.fillStyle = "rgba(180, 230, 255, 0.08)";
    ctx.beginPath();
    ctx.moveTo(frameX + 10, frameY + 2);
    ctx.lineTo(frameX + 44, frameY + 2);
    ctx.lineTo(frameX + 16, frameY + frameH - 2);
    ctx.lineTo(frameX + 2, frameY + frameH - 2);
    ctx.closePath();
    ctx.fill();

    drawEnemyReflection(ctx, 240, frameY + 32, 52, this.time, 1 - this.enemyHp / this.maxEnemyHp);
    if (this.enemyFlash > 0) {
      ctx.save();
      ctx.globalAlpha = this.enemyFlash * 0.55;
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(frameX + 2, frameY + 2, frameW - 4, frameH - 4);
      ctx.restore();
    }
    // cracks on mirror
    const dmg = 1 - this.enemyHp / this.maxEnemyHp;
    if (dmg > 0.25) {
      ctx.strokeStyle = "rgba(220, 245, 255, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(240, frameY + 2);
      ctx.lineTo(236, frameY + 24);
      ctx.lineTo(242, frameY + 40);
      ctx.lineTo(234, frameY + frameH - 2);
      ctx.stroke();
    }

    // enemy name / mercy
    drawText(ctx, this.mercy >= 100 ? "THE REFLECTION  —  LISTENING" : "THE REFLECTION", 240, 3, {
      font: '8px "Press Start 2P", monospace',
      color: "#ff9aae",
      align: "center",
      shadow: "#1a0308",
    });
    // mercy bar
    r(ctx, 178, 14, 124, 4, "#2a1a28");
    r(ctx, 178, 14, Math.round(124 * (this.mercy / 100)), 4, "#ffd166");
    if (this.checked) {
      drawText(ctx, "ATK 4  DEF 0", 406, 3, {
        font: '6px "Press Start 2P", monospace',
        color: "#9eb5dd",
        align: "right",
      });
    }

    if (this.phase === "intro") {
      this._drawMessageBox(ctx, this.introLines[this.introIndex][1], this.introLines[this.introIndex][0]);
    } else if (this.phase === "menu") {
      this._drawMessageBox(ctx, this.message || "What will you do?", "narrator");
      this._drawCommands(ctx);
    } else if (this.phase === "act") {
      this._drawActMenu(ctx);
    } else if (this.phase === "item") {
      this._drawItemMenu(ctx);
    } else if (this.phase === "fight") {
      this._drawFight(ctx);
    } else if (this.phase === "message") {
      this._drawMessageBox(ctx, this.message, "narrator");
      this._drawCommands(ctx, true);
    } else if (this.phase === "enemyTurn") {
      this._drawBoard(ctx);
      this._drawStatus(ctx);
    } else if (this.phase === "defeat") {
      this._drawDefeat(ctx);
    } else {
      this._drawMessageBox(ctx, this.message, "narrator");
      this._drawCommands(ctx, true);
    }

    // damage numbers
    for (const d of this.damageNumbers) {
      drawText(ctx, String(d.value), d.x, d.y, {
        font: '12px "Press Start 2P", monospace',
        color: d.hurt ? "#ff6b8a" : "#ffd166",
        align: "center",
        shadow: "#000",
        alpha: Math.min(1, d.life * 2),
      });
    }

    // particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      ctx.globalAlpha = 1;
    }

    // hit flash
    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(255, 40, 80, ${this.hitFlash * 0.12})`;
      ctx.fillRect(0, 0, 480, 270);
    }

    // scanlines
    ctx.save();
    ctx.globalAlpha = 0.05;
    for (let y = 0; y < 270; y += 3) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, y, 480, 1);
    }
    ctx.restore();

    ctx.restore();
  }

  _drawMessageBox(ctx, text, speaker) {
    const x = 52;
    const y = 98;
    const w = 376;
    const h = 66;
    r(ctx, x + 3, y + 4, w, h, "rgba(0,0,0,0.4)");
    cutRect(ctx, x, y, w, h);
    ctx.fillStyle = "rgba(8, 13, 28, 0.94)";
    ctx.fill();
    ctx.strokeStyle = "#8ca8d8";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (speaker && speaker !== "narrator") {
      drawText(ctx, "THE REFLECTION", x + 12, y - 10, {
        font: '7px "Press Start 2P", monospace',
        color: "#ff6b8a",
        shadow: "#000",
      });
    }
    const lines = wrapText(ctx, text, w - 28, '17px "VT323", monospace').slice(0, 3);
    lines.forEach((line, i) => {
      drawText(ctx, i === 0 ? `* ${line}` : line, x + 14, y + 10 + i * 18, {
        font: '17px "VT323", monospace',
        color: "#eef6ff",
        shadow: "#05070f",
      });
    });
    if (this.phase === "intro") {
      const blink = Math.sin(this.time * 7) > 0;
      if (blink) {
        drawText(ctx, "Z / TAP", x + w - 14, y + h - 15, {
          font: '6px "Press Start 2P", monospace',
          color: "#ffd166",
          align: "right",
        });
      }
    }
  }

  _drawCommands(ctx, dim = false) {
    const x = COMMAND.x;
    const y = COMMAND.y;
    r(ctx, x + 3, y + 4, COMMAND.w, COMMAND.h, "rgba(0,0,0,0.4)");
    cutRect(ctx, x, y, COMMAND.w, COMMAND.h);
    ctx.fillStyle = dim ? "rgba(8, 13, 28, 0.72)" : "rgba(8, 13, 28, 0.95)";
    ctx.fill();
    ctx.strokeStyle = dim ? "#3c4f7d" : "#8ca8d8";
    ctx.lineWidth = 2;
    ctx.stroke();
    this.commandRects = [];
    const bw = 98;
    const bh = 27;
    COMMANDS.forEach((label, i) => {
      const bx = x + 10 + i * 104;
      const by = y + 8;
      const selected = i === this.commandIndex && !dim;
      const spareReady = i === 3 && this.mercy >= 100;
      if (selected) {
        r(ctx, bx, by, bw, bh, spareReady ? "#6ae3cb" : "#ffd166");
        r(ctx, bx, by, bw, 2, "#fff4d0");
        drawHeart(ctx, bx + 9, by - 5, 0.75, "#ff4d6d");
      } else {
        r(ctx, bx, by, bw, bh, "rgba(16, 24, 50, 0.9)");
        ctx.strokeStyle = spareReady ? "#5fe0c8" : "#40527a";
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
      }
      drawText(ctx, label, bx + bw / 2, by + 9, {
        font: '8px "Press Start 2P", monospace',
        color: selected ? "#241600" : spareReady ? "#8ff0c6" : "#dce9ff",
        align: "center",
        shadow: selected ? "rgba(255,255,255,0.3)" : "#000",
      });
      this.commandRects.push({ x: bx, y: by, w: bw, h: bh, index: i });
    });
    // HP / TP
    const hpRatio = this.hp / this.maxHp;
    drawText(ctx, "HP", x + 12, y + 43, { font: '7px "Press Start 2P", monospace', color: "#9eb5dd" });
    r(ctx, x + 30, y + 44, 62, 6, "#2a1a28");
    r(ctx, x + 30, y + 44, Math.round(62 * hpRatio), 6, hpRatio > 0.5 ? "#6ae3cb" : hpRatio > 0.25 ? "#ffd166" : "#ff5d73");
    drawText(ctx, `${this.hp}/${this.maxHp}`, x + 98, y + 41, { font: '14px "VT323", monospace', color: "#eaf3ff" });
    drawText(ctx, "TP", x + 146, y + 43, { font: '7px "Press Start 2P", monospace', color: "#9eb5dd" });
    r(ctx, x + 164, y + 44, 52, 6, "#1a2438");
    r(ctx, x + 164, y + 44, Math.round(52 * (this.tp / 100)), 6, "#5fe0c8");
    drawText(ctx, "TURN " + this.turn, x + COMMAND.w - 12, y + 43, {
      font: '7px "Press Start 2P", monospace',
      color: "#9eb5dd",
      align: "right",
    });
  }

  _drawActMenu(ctx) {
    this._drawMessageBox(ctx, "What do you want to say to yourself?", "narrator");
    const x = 72;
    const y = 176;
    const w = 336;
    const h = 66;
    r(ctx, x + 3, y + 4, w, h, "rgba(0,0,0,0.4)");
    cutRect(ctx, x, y, w, h);
    ctx.fillStyle = "rgba(8, 13, 28, 0.95)";
    ctx.fill();
    ctx.strokeStyle = "#8ca8d8";
    ctx.lineWidth = 2;
    ctx.stroke();
    this.listRects = [];
    ACTS.forEach((label, i) => {
      const rowY = y + 5 + i * 14;
      const selected = i === this.actIndex;
      if (selected) {
        r(ctx, x + 6, rowY - 1, w - 12, 14, "rgba(255, 209, 102, 0.16)");
        drawText(ctx, ">", x + 10, rowY, { font: '14px "VT323", monospace', color: "#ffd166" });
      }
      drawText(ctx, label, x + 24, rowY, {
        font: '15px "VT323", monospace',
        color: selected ? "#fff4d0" : "#b9cceb",
      });
      this.listRects.push({ x: x + 6, y: rowY - 1, w: w - 12, h: 14, index: i });
    });
  }

  _drawItemMenu(ctx) {
    this._drawMessageBox(ctx, "Your pockets are warm.", "narrator");
    const options = this._itemOptions();
    const x = 72;
    const y = 176;
    const w = 336;
    const h = 66;
    r(ctx, x + 3, y + 4, w, h, "rgba(0,0,0,0.4)");
    cutRect(ctx, x, y, w, h);
    ctx.fillStyle = "rgba(8, 13, 28, 0.95)";
    ctx.fill();
    ctx.strokeStyle = "#8ca8d8";
    ctx.lineWidth = 2;
    ctx.stroke();
    this.listRects = [];
    options.forEach((option, i) => {
      const rowY = y + 5 + i * 18;
      const selected = i === this.itemIndex;
      if (selected) {
        r(ctx, x + 6, rowY - 1, w - 12, 17, "rgba(255, 209, 102, 0.16)");
        drawText(ctx, ">", x + 10, rowY, { font: '14px "VT323", monospace', color: "#ffd166" });
      }
      drawText(ctx, option.label, x + 24, rowY, {
        font: '15px "VT323", monospace',
        color: option.disabled ? "#5b6c8e" : selected ? "#fff4d0" : "#b9cceb",
      });
      this.listRects.push({ x: x + 6, y: rowY - 1, w: w - 12, h: 17, index: i });
    });
  }

  _drawFight(ctx) {
    this._drawMessageBox(ctx, "Strike the glass. Find the center.", "narrator");
    const x = 74;
    const y = 180;
    const w = 332;
    const h = 54;
    r(ctx, x + 3, y + 4, w, h, "rgba(0,0,0,0.4)");
    cutRect(ctx, x, y, w, h);
    ctx.fillStyle = "rgba(8, 13, 28, 0.95)";
    ctx.fill();
    ctx.strokeStyle = "#8ca8d8";
    ctx.lineWidth = 2;
    ctx.stroke();
    drawText(ctx, "TIMING", x + 12, y + 8, {
      font: '7px "Press Start 2P", monospace',
      color: "#ffd166",
    });
    const barX = x + 12;
    const barY = y + 24;
    const barW = w - 24;
    r(ctx, barX, barY, barW, 16, "#1a2438");
    r(ctx, barX + barW * 0.42, barY, barW * 0.16, 16, "rgba(255, 209, 102, 0.28)");
    r(ctx, barX + barW * 0.48, barY, barW * 0.04, 16, "rgba(255, 244, 208, 0.55)");
    const markerX = barX + barW * this.fightPos;
    r(ctx, markerX - 2, barY - 4, 4, 24, "#ff5d73");
    r(ctx, markerX - 1, barY - 2, 2, 20, "#fff0f0");
    drawText(ctx, "Z / A TO STRIKE", x + w - 12, y + 8, {
      font: '6px "Press Start 2P", monospace',
      color: "#9eb5dd",
      align: "right",
    });
  }

  _drawBoard(ctx) {
    // taunt
    drawText(ctx, this.taunt, 240, 84, {
      font: '13px "VT323", monospace',
      color: "#9fc4e8",
      align: "center",
      shadow: "#000",
      alpha: 0.85,
    });
    const x = BOARD.x;
    const y = BOARD.y;
    const w = BOARD.w;
    const h = BOARD.h;
    r(ctx, x + 3, y + 4, w, h, "rgba(0,0,0,0.45)");
    cutRect(ctx, x, y, w, h);
    ctx.fillStyle = "rgba(5, 9, 18, 0.92)";
    ctx.fill();
    ctx.strokeStyle = "#eaf3ff";
    ctx.lineWidth = 2;
    ctx.stroke();
    cutRect(ctx, x + 4, y + 4, w - 8, h - 8);
    ctx.strokeStyle = "rgba(120, 150, 210, 0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // bullets and soul are clipped to the board
    ctx.save();
    cutRect(ctx, x + 2, y + 2, w - 4, h - 4);
    ctx.clip();
    for (const bullet of this.bullets) {
      this._drawBullet(ctx, bullet);
    }
    if (this.invuln <= 0 || Math.floor(this.time * 12) % 2 === 0) {
      drawHeart(ctx, this.soul.x, this.soul.y, 1, "#ff4d6d");
    }
    ctx.restore();

    // board corner accents
    ctx.fillStyle = "#5fe0c8";
    ctx.fillRect(x + 4, y + 4, 8, 1);
    ctx.fillRect(x + 4, y + 4, 1, 8);
    ctx.fillRect(x + w - 12, y + h - 5, 8, 1);
    ctx.fillRect(x + w - 5, y + h - 12, 1, 8);
  }

  _drawBullet(ctx, bullet) {
    const x = Math.round(bullet.x);
    const y = Math.round(bullet.y);
    if (bullet.type === "tear") {
      r(ctx, x - 1, y - 4, 3, 5, "#9fe8ff");
      r(ctx, x - 2, y - 1, 5, 4, "#9fe8ff");
      r(ctx, x - 1, y + 3, 3, 2, "#5fb8dd");
      r(ctx, x - 1, y - 3, 1, 2, "#ffffff");
    } else if (bullet.type === "shard") {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(bullet.rot || 0);
      ctx.fillStyle = "#8cc8ff";
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 7);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#eaf7ff";
      ctx.fillRect(-1, -3, 2, 5);
      ctx.restore();
    } else if (bullet.type === "eye") {
      r(ctx, x - 3, y - 3, 6, 6, "#eaf7ff");
      r(ctx, x - 1, y - 2, 3, 3, "#ff5d73");
      r(ctx, x, y - 1, 1, 1, "#1a0308");
    } else {
      r(ctx, x - 1, y - 1, 3, 3, "#b18cff");
      r(ctx, x, y - 2, 1, 5, "#e0d0ff");
    }
  }

  _drawStatus(ctx) {
    const x = 24;
    const y = 226;
    const hpRatio = this.hp / this.maxHp;
    drawText(ctx, "HP", x + 4, y + 3, { font: '7px "Press Start 2P", monospace', color: "#9eb5dd" });
    r(ctx, x + 24, y + 4, 76, 7, "#2a1a28");
    r(ctx, x + 24, y + 4, Math.round(76 * hpRatio), 7, hpRatio > 0.5 ? "#6ae3cb" : hpRatio > 0.25 ? "#ffd166" : "#ff5d73");
    drawText(ctx, `${this.hp}/${this.maxHp}`, x + 106, y, { font: '15px "VT323", monospace', color: "#eaf3ff" });
    drawText(ctx, "TP", x + 166, y + 3, { font: '7px "Press Start 2P", monospace', color: "#9eb5dd" });
    r(ctx, x + 186, y + 4, 64, 7, "#1a2438");
    r(ctx, x + 186, y + 4, Math.round(64 * (this.tp / 100)), 7, "#5fe0c8");
    drawText(ctx, "DODGE", 456, y + 3, { font: '7px "Press Start 2P", monospace', color: "#9eb5dd", align: "right" });
  }

  _drawDefeat(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(2, 4, 10, 0.78)";
    ctx.fillRect(0, 0, 480, 270);
    ctx.restore();
    drawText(ctx, "YOUR MASK SLIPPED.", 240, 62, {
      font: '13px "Press Start 2P", monospace',
      color: "#ff6b8a",
      align: "center",
      shadow: "#1a0308",
    });
    drawText(ctx, "The mirror is still waiting.", 240, 86, {
      font: '18px "VT323", monospace',
      color: "#d5e2f7",
      align: "center",
      shadow: "#000",
    });
    const options = this.defeats >= 2 ? ["TRY AGAIN", "LET GO"] : ["TRY AGAIN"];
    const totalW = options.length * 120;
    this.commandRects = [];
    options.forEach((label, i) => {
      const bx = 240 - totalW / 2 + i * 120 + 10;
      const by = 132;
      const selected = i === this.defeatIndex;
      if (selected) {
        r(ctx, bx, by, 100, 28, "#ffd166");
        drawHeart(ctx, bx + 10, by - 5, 0.7, "#ff4d6d");
      } else {
        r(ctx, bx, by, 100, 28, "rgba(16, 24, 50, 0.9)");
        ctx.strokeStyle = "#40527a";
        ctx.strokeRect(bx + 0.5, by + 0.5, 99, 27);
      }
      drawText(ctx, label, bx + 50, by + 10, {
        font: '7px "Press Start 2P", monospace',
        color: selected ? "#241600" : "#dce9ff",
        align: "center",
      });
      this.commandRects.push({ x: bx, y: by, w: 100, h: 28, index: i });
    });
    drawText(ctx, "You can get up. You've done it before.", 240, 182, {
      font: '17px "VT323", monospace',
      color: "#9fb3d8",
      align: "center",
      shadow: "#000",
    });
  }
}
