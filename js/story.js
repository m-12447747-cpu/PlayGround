// story.js — the cold homecoming: scenes, checkpoints, voices, small mercies.

const SAVE_KEY = 'oppidan.save.v1';

export const DEFAULT_FLAGS = {
  started: false,
  chrisMet: false,
  hugChoice: null,
  dinerEntered: false,
  bathroomDone: false,
  storm: false,
  homeEntered: false,
  mirrorSeen: false,
  battleDone: false,
  asgoreTalked: false,
  michTalked: false,
};

const cleanFlags = (source = {}) => {
  const out = { ...DEFAULT_FLAGS };
  for (const key of Object.keys(DEFAULT_FLAGS)) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
};

const fmtTime = (seconds = 0) => {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

export class Story {
  constructor(g) {
    this.g = g;
    this.token = 0;
    this.inMirror = false;
    this.inBathroom = false;
  }

  get flags() { return this.g.flags; }
  get world() { return this.g.world; }
  get dlg() { return this.g.dialogue; }

  alive(token) { return token === this.token; }

  resetState() {
    this.token++;
    this.g.flags = { ...DEFAULT_FLAGS };
    this.g.stats = { acts: 0, dodges: 0, time: 0 };
    this.g.checkpoint = 0;
    this.inMirror = false;
    this.inBathroom = false;
    this.world._zoneLock = false;
    return this.token;
  }

  /* ------------------------------------------------------------------ */
  /* helpers                                                             */
  /* ------------------------------------------------------------------ */

  say(who, text, opts) {
    return this.dlg.say(who, text, opts);
  }

  async wait(ms) {
    return this.g.wait(ms);
  }

  async choose(who, prompt, options, opts = {}) {
    const d = this.dlg;
    // Start the prompt as a normal line, then immediately float the options
    // over it. The first promise is resolved by hide() below.
    d.say(who, prompt, opts);
    const index = await d.choose(prompt, options);
    d.hide();
    return index;
  }

  objective(text) {
    this.g.ui.setObjective(text);
  }

  save(checkpoint) {
    this.g.checkpoint = checkpoint;
    const data = {
      checkpoint,
      flags: { ...this.flags },
      stats: { ...this.g.stats, time: Math.round(this.g.stats.time || 0) },
      savedAt: Date.now(),
    };
    this.g.ui.writeSave(data);
    this.g.ui.toast('checkpoint saved', 'save', 1500);
    this.g.sound.sfx('save');
    return data;
  }

  focus(x, y) { this.world.setFocus(x, y); }
  clearFocus() { this.world.clearFocus(); }

  async fadeOut(ms = 340) {
    if (this.world.mapId) await this.world.fadeTo(1, ms);
  }

  async fadeIn(ms = 340) {
    if (this.world.mapId) await this.world.fadeTo(0, ms);
  }

  /* ------------------------------------------------------------------ */
  /* boot / resume                                                       */
  /* ------------------------------------------------------------------ */

  async newGame() {
    const g = this.g;
    const token = this.resetState();
    g.sound.init();
    g.ui.hideTitle();
    g.ui.showHud(true);
    g.ui.setChapter('CHAPTER 0');
    g.mode = 'world';
    g.paused = false;
    g.cutscene = true;
    g.ui.setObjective('Look around Oppidan.');
    g.sound.playTrack('snow');
    g.sound.ambience(0.35);
    await g.world.enterMap('town', { x: 594, y: 626, dir: 'up' }, { fadeIn: 520, hold: 180 });
    if (!this.alive(token)) return;
    await this.intro(token);
  }

  async continueGame(save) {
    if (!save || !save.checkpoint) {
      await this.newGame();
      return;
    }
    const g = this.g;
    const token = this.resetState();
    g.flags = cleanFlags(save.flags);
    g.stats = { acts: 0, dodges: 0, time: 0, ...(save.stats || {}) };
    g.checkpoint = save.checkpoint;
    g.sound.init();
    g.ui.hideTitle();
    g.ui.showHud(true);
    g.ui.setChapter('CHAPTER 0');
    g.mode = 'world';
    g.paused = false;
    g.cutscene = true;
    await this.resume(save.checkpoint);
    if (!this.alive(token)) return;
  }

  async resume(cp) {
    const g = this.g;
    const token = this.token;
    this.clearFocus();
    if (cp <= 1) {
      await g.world.enterMap('town', { x: 594, y: 626, dir: 'up' }, { fadeIn: 480 });
      if (!this.alive(token)) return;
      this.objective('Find Chris near the square.');
    } else if (cp === 2) {
      g.flags.chrisMet = true;
      await g.world.enterMap('town', { x: 790, y: 500, dir: 'up' }, { fadeIn: 480 });
      if (!this.alive(token)) return;
      this.objective('Meet Chris at the Copper Kettle.');
    } else if (cp === 3) {
      g.flags.chrisMet = true;
      g.flags.bathroomDone = true;
      g.flags.storm = true;
      await g.world.enterMap('town', { x: 848, y: 478, dir: 'down' }, { fadeIn: 480 });
      if (!this.alive(token)) return;
      this.objective('Walk home. Mom is waiting by the house.');
    } else if (cp === 4) {
      g.flags.chrisMet = true;
      g.flags.bathroomDone = true;
      g.flags.storm = true;
      g.flags.homeEntered = true;
      await g.world.enterMap('home', { x: 240, y: 238, dir: 'up' }, { fadeIn: 480 });
      if (!this.alive(token)) return;
      this.objective('Look in the mirror.');
    } else {
      g.mode = 'ending';
      g.cutscene = false;
      g.ui.showHud(false);
      g.sound.playTrack('ending');
      g.sound.ambience(0.35);
      g.ui.showEndCard({
        time: fmtTime(g.stats.time),
        acts: g.stats.acts || 0,
        dodges: g.stats.dodges || 0,
      });
      return;
    }
    g.cutscene = false;
  }

  async debugCheckpoint(cp) {
    const g = this.g;
    this.resetState();
    g.flags.started = cp >= 1;
    g.flags.chrisMet = cp >= 2;
    g.flags.dinerEntered = cp >= 2;
    g.flags.bathroomDone = cp >= 3;
    g.flags.storm = cp >= 3;
    g.flags.homeEntered = cp >= 4;
    g.flags.battleDone = cp >= 5;
    g.stats = { acts: 2, dodges: 31, time: 362 };
    g.checkpoint = cp;
    g.sound.init();
    g.ui.hideTitle();
    g.ui.showHud(true);
    g.ui.setChapter('CHAPTER 0');
    g.mode = cp >= 5 ? 'ending' : 'world';
    g.cutscene = true;
    await this.resume(cp);
  }

  async debugScene(name) {
    const g = this.g;
    this.resetState();
    g.sound.init();
    g.ui.hideTitle();
    g.ui.showHud(false);
    if (name === 'battle') {
      g.mode = 'battle';
      const spared = await g.battle.start();
      if (spared) await this.ending();
    } else if (name === 'ending') {
      g.mode = 'ending';
      await this.ending(true);
    } else if (name === 'bathroom') {
      g.flags.chrisMet = true;
      g.flags.dinerEntered = true;
      g.mode = 'world';
      g.cutscene = true;
      await g.world.enterMap('bathroom', { x: 160, y: 224, dir: 'up' }, { instant: true });
      await this.bathroomScene();
    } else if (name === 'home') {
      g.flags.chrisMet = true;
      g.flags.bathroomDone = true;
      g.flags.storm = true;
      g.flags.homeEntered = true;
      g.mode = 'world';
      g.cutscene = false;
      await g.world.enterMap('home', { x: 240, y: 238, dir: 'up' }, { instant: true });
      this.objective('Look in the mirror.');
    }
  }

  /* ------------------------------------------------------------------ */
  /* arrival                                                             */
  /* ------------------------------------------------------------------ */

  async intro(token) {
    const g = this.g;
    g.cutscene = true;
    this.world.cooldown = 0.8;
    await this.wait(550);
    if (!this.alive(token)) return;

    await this.say('system', 'CHAPTER 0\nCOLD OPEN', { style: 'cinematic' });
    if (!this.alive(token)) return;
    await this.say('narr', 'Oppidan hasn’t changed.\nThat’s the problem.');
    if (!this.alive(token)) return;
    await this.say('narr', 'Six years of snow. Four years of... whatever this is.');
    if (!this.alive(token)) return;
    await this.say({ who: 'srif', style: 'inner', text: 'Smile. Shoulders down.\nYou’re home.' });
    if (!this.alive(token)) return;

    const toriel = this.world.getNpc('toriel');
    if (toriel) {
      this.focus(toriel.x, (toriel.y + this.world.player.y) / 2);
      await this.world.walkTo(toriel, 540, 632, 52);
      if (!this.alive(token)) return;
      this.world.facePlayer(toriel);
      this.world.face(this.world.player, 'left');
    }
    await this.say('toriel', 'There you are. You grew again. I hate when you do that.');
    if (!this.alive(token)) return;
    await this.say('srif', 'Mom.');
    if (!this.alive(token)) return;
    await this.say('toriel', 'Your father is already at the station. He said he would meet us. He is... a police officer now.');
    if (!this.alive(token)) return;
    await this.say({ who: 'srif', style: 'inner', text: '...of course he is.' });
    if (!this.alive(token)) return;
    await this.say('toriel', 'He is still your father.');
    if (!this.alive(token)) return;
    await this.say('srif', 'I know.');
    if (!this.alive(token)) return;

    const answer = await this.choose(
      'toriel',
      'She waits. She has always been good at waiting.',
      ['“I missed you.”', '“The truck ride was long.”'],
    );
    if (!this.alive(token)) return;
    this.flags.hugChoice = this.flags.hugChoice || null;
    if (answer === 0) {
      await this.say('toriel', 'Oh, sweetheart.\nI missed you too. Every day. Even the ones I was mad about.');
    } else {
      await this.say('toriel', 'Long rides make long thoughts.\nYou look like you brought yours with you.');
    }
    if (!this.alive(token)) return;
    await this.say('toriel', 'Chris and Michael should be near the square. Chris has been asking about you for weeks. Michael has not. I suspect he is being Michael.');
    if (!this.alive(token)) return;
    await this.say({ who: 'srif', style: 'inner', text: 'Michael. Right.\nHe probably doesn’t even remember me.' });
    if (!this.alive(token)) return;
    await this.say('toriel', 'Coat. Buttons. You’ll catch cold.');
    if (!this.alive(token)) return;
    await this.say({ who: 'srif', style: 'inner', text: 'I already did.' });
    if (!this.alive(token)) return;

    if (toriel) {
      await this.world.walkTo(toriel, 462, 646, 50);
      this.clearFocus();
      this.world.face(this.world.player, 'up');
    }
    this.flags.started = true;
    this.objective('Find Chris near the square.');
    this.save(1);
    g.cutscene = false;
    g.ui.toast('find chris by the square', 'info', 2400);
  }

  /* ------------------------------------------------------------------ */
  /* Chris                                                               */
  /* ------------------------------------------------------------------ */

  async chrisScene() {
    const g = this.g;
    if (this.flags.chrisMet || g.cutscene) return;
    const token = this.token;
    g.cutscene = true;
    this.world.cooldown = 2;
    const chris = this.world.getNpc('chris');
    if (!chris) { g.cutscene = false; return; }
    this.world.facePlayer(chris);
    this.world.face(this.world.player, chris.x < this.world.player.x ? 'left' : 'right');
    this.focus((chris.x + this.world.player.x) / 2, chris.y - 12);

    await this.say('chris', 'Srif?');
    if (!this.alive(token)) return;
    await this.say('narr', 'He says your name like he is checking whether it still works.');
    if (!this.alive(token)) return;
    await this.say('chris', 'SRIF!');
    if (!this.alive(token)) return;

    this.world.shake(3, 220);
    g.sound.sfx('heart');
    await this.world.walkTo(chris, this.world.player.x + 16, this.world.player.y, 92);
    if (!this.alive(token)) return;
    await this.wait(320);
    this.world.flashScreen('#ffe6a8', 240);
    await this.say('narr', 'He hugs you.\nHe hugs you the way a door slams open in winter.');
    if (!this.alive(token)) return;
    await this.say('chris', 'You’re here. You’re actually here. You’re—');
    if (!this.alive(token)) return;
    await this.say('srif', 'Chris, I’m—');
    if (!this.alive(token)) return;
    await this.say('chris', 'Shut up. I’m hugging you. It’s been four years. You don’t get to talk during the hug.');
    if (!this.alive(token)) return;
    await this.say({ who: 'srif', style: 'inner', text: 'He knows my face. He knows it and he’s still holding on.' });
    if (!this.alive(token)) return;

    const answer = await this.choose(
      'narr',
      'Your arms are still at your sides. They feel heavier than they should.',
      ['Hug him back.', 'Keep your arms where they are.'],
    );
    if (!this.alive(token)) return;
    this.flags.hugChoice = answer === 0 ? 'hug' : 'still';
    if (answer === 0) {
      await this.say('narr', 'You put your arms around him.\nIt takes a second. Then it takes.');
      if (!this.alive(token)) return;
      await this.say('chris', 'There he is.');
    } else {
      await this.say('narr', 'You stay very still. He notices. He does not let go.');
      if (!this.alive(token)) return;
      await this.say('chris', 'Okay. That’s okay. We’ll work on it.');
    }
    if (!this.alive(token)) return;
    await this.say('chris', 'Mich is coming by the Kettle after his shift. He’s been... okay. He’s been Mich.');
    if (!this.alive(token)) return;
    await this.say({ who: 'srif', style: 'inner', text: 'Mich. The tiger with the ushanka and the permanent objection to existing.' });
    if (!this.alive(token)) return;
    await this.say('chris', 'Cocoa. My treat. You’re not buying. You have never bought anything in your life.');
    if (!this.alive(token)) return;
    await this.say('srif', 'I bought a bus ticket.');
    if (!this.alive(token)) return;
    await this.say('chris', 'That’s the saddest sentence I’ve ever heard. Come on.');
    if (!this.alive(token)) return;
    await this.say('narr', 'Chris jogs ahead, waving at you to follow. The snow keeps trying to swallow his footprints.');
    if (!this.alive(token)) return;

    this.world.face(this.world.player, 'right');
    if (chris) {
      await this.world.walkTo(chris, 848, 452, 86);
      if (!this.alive(token)) return;
      this.world.removeNpc('chris');
    }
    this.clearFocus();
    this.flags.chrisMet = true;
    this.world._zoneLock = true;
    this.objective('Meet Chris at the Copper Kettle.');
    this.save(2);
    g.cutscene = false;
  }

  /* ------------------------------------------------------------------ */
  /* diner                                                               */
  /* ------------------------------------------------------------------ */

  async inspect(id) {
    const g = this.g;
    if (g.cutscene || this.dlg.active) return;
    if (this.world.mapId === 'town') return this.inspectTown(id);
    if (this.world.mapId === 'diner') return this.inspectDiner(id);
    if (this.world.mapId === 'home') return this.inspectHome(id);
  }

  async inspectTown(id) {
    const g = this.g;
    if (id === 'houseDoor') {
      if (!this.flags.bathroomDone) {
        if (!this.flags.chrisMet) {
          await this.say({ who: 'srif', style: 'inner', text: 'Not yet.\nI should find Chris first. Or I could stand here until the snow covers me. Both are options.' });
        } else {
          await this.say({ who: 'srif', style: 'inner', text: 'The house can wait.\nChris is waiting at the Copper Kettle. That’s different.' });
        }
        return;
      }
      if (!this.flags.storm) {
        await this.say({ who: 'srif', style: 'inner', text: 'Not yet.\nThere’s something I need to do before I go inside.' });
        return;
      }
      await this.enterHome();
      return;
    }

    if (id === 'dinerDoor') {
      if (!this.flags.chrisMet) {
        await this.say({ who: 'srif', style: 'inner', text: 'Cocoa can wait.\nChris is supposed to be around here somewhere.' });
        return;
      }
      await this.enterDiner();
      return;
    }

    if (id === 'policeDoor') {
      await this.say('narr', 'The station window is lit. Through the glass, a large goat in a police hat two sizes too small is trying to look official.');
      await this.say({ who: 'srif', style: 'inner', text: 'Dad.' });
      return;
    }

    if (id === 'holidayDoor') {
      await this.say('narr', 'The Holiday house. A wreath made of tinsel and dental floss. Chris’s work, probably.');
      await this.say({ who: 'srif', style: 'inner', text: 'Some things really don’t change.' });
      return;
    }

    if (id === 'townSign') {
      await this.say('narr', 'OPPIDAN — pop. 1,204.\n“A warm place in a cold world.”');
      await this.say({ who: 'srif', style: 'inner', text: 'That’s one way to describe it.' });
      return;
    }

    if (id === 'snowman') {
      await this.say('narr', 'Someone has tied your old red scarf around the snowman’s neck. Its smile is made of pebbles. It is doing better than you are.');
      await this.say({ who: 'srif', style: 'inner', text: 'At least one of us got to stay.' });
      return;
    }

    if (id === 'lamp') {
      await this.say('narr', 'The bulb flickers on and off, like it’s thinking about it.');
      await this.say({ who: 'srif', style: 'inner', text: 'Oppidan’s idea of a lighthouse.' });
      return;
    }

    if (id === 'truck') {
      await this.say('narr', 'MOVING. Most of the boxes are labelled DO NOT. Very helpful.');
      await this.say({ who: 'srif', style: 'inner', text: 'We moved four years ago.\nThe boxes still haven’t forgiven us.' });
      return;
    }
  }

  async enterDiner() {
    if (this.world.mapId === 'diner' || this.world.transitioning) return;
    const g = this.g;
    const token = this.token;
    g.cutscene = true;
    await this.world.enterMap('diner', { x: 240, y: 246, dir: 'up' });
    if (!this.alive(token)) return;
    if (this.flags.dinerEntered) {
      this.objective(this.flags.bathroomDone ? 'Leave before the storm gets worse.' : 'The washroom is by the front door.');
      g.cutscene = false;
      return;
    }

    const chris = this.world.getNpc('chris');
    if (chris) {
      this.world.facePlayer(chris);
      this.focus(270, 170);
    }
    await this.world.walkTo(this.world.player, 288, 176, 64);
    if (!this.alive(token)) return;
    this.world.face(this.world.player, 'up');
    if (chris) this.world.face(chris, 'down');

    await this.say('narr', 'The Copper Kettle smells like cinnamon, wet wool, and something that has been on the griddle since before you were born.');
    if (!this.alive(token)) return;
    await this.say('chris', 'There you are. I already ordered. It’s cocoa. It’s always cocoa. Don’t make it weird.');
    if (!this.alive(token)) return;
    await this.say('srif', 'I wasn’t going to make it weird.');
    if (!this.alive(token)) return;
    await this.say('chris', 'You were doing the face. The polite one. The one that means you’re making it weird on the inside.');
    if (!this.alive(token)) return;
    await this.say({ who: 'srif', style: 'inner', text: 'He can still read me.\nThat’s either a gift or a threat.' });
    if (!this.alive(token)) return;

    const answer = await this.choose(
      'chris',
      'Chris slides the mug across the counter. It is painfully hot. It has three marshmallows.',
      ['Ask about Mich.', 'Ask how Chris has been.'],
    );
    if (!this.alive(token)) return;
    if (answer === 0) {
      await this.say('chris', 'Mich? He’s been... Mich. Works at the garage. Wears that hat indoors. Gets mad at soup.');
      if (!this.alive(token)) return;
      await this.say('chris', 'He’s coming by after his shift. Try not to let him see you looking nervous. He smells fear. Or maybe it’s the coat.');
    } else {
      await this.say('chris', 'Me? I’m good. School’s fine. Mom’s fine. Everything’s fine. I’ve been saying that word a lot lately. Fine.');
      if (!this.alive(token)) return;
      await this.say('chris', 'Anyway. Mich is coming by after his shift. Try not to let him see you looking nervous. He smells fear. Or maybe it’s the coat.');
    }
    if (!this.alive(token)) return;
    await this.say({ who: 'srif', style: 'inner', text: 'Mich doesn’t know I’m back. Chris didn’t tell him. Or Mich didn’t care.' });
    if (!this.alive(token)) return;
    await this.say('chris', 'Washroom’s by the front. If you want to splash some water on your face. Not that you need to. You look great. That was weird. Go.');
    if (!this.alive(token)) return;

    this.flags.dinerEntered = true;
    this.clearFocus();
    this.objective('Visit the washroom. Or talk to Chris.');
    this.world.face(this.world.player, 'down');
    g.cutscene = false;
  }

  async inspectDiner(id) {
    const g = this.g;
    if (id === 'exit') {
      if (this.flags.bathroomDone && !this.flags.storm) {
        await this.exitDiner();
      } else {
        g.cutscene = true;
        await this.world.enterMap('town', { x: 848, y: 470, dir: 'down' });
        g.cutscene = false;
      }
      return;
    }

    if (id === 'bathroom') {
      if (!this.flags.dinerEntered) {
        await this.say({ who: 'srif', style: 'inner', text: 'Maybe after I’ve said hello to Chris.' });
        return;
      }
      await this.bathroomScene();
      return;
    }

    if (id === 'counter') {
      await this.say('narr', 'The counter is sticky in a way that suggests history.');
      return;
    }

    if (id === 'booth') {
      await this.say('narr', 'Someone has carved C + M + S into the table. Chris denies it. Chris is lying.');
      return;
    }
  }

  /* ------------------------------------------------------------------ */
  /* washroom                                                            */
  /* ------------------------------------------------------------------ */

  async bathroomScene() {
    if (this.inBathroom || this.flags.bathroomDone) return;
    this.inBathroom = true;
    const g = this.g;
    const token = this.token;
    g.cutscene = true;
    await this.world.enterMap('bathroom', { x: 160, y: 224, dir: 'up' });
    if (!this.alive(token)) { this.inBathroom = false; return; }

    await this.say('narr', 'The washroom light buzzes like it’s thinking about giving up.');
    if (!this.alive(token)) return;
    await this.say({ who: 'srif', style: 'inner', text: 'Just wash your hands. Look at nothing. Leave.' });
    if (!this.alive(token)) return;
    await this.say('narr', 'The cracked mirror above the middle sink is doing its best impression of a smile.');
    if (!this.alive(token)) return;

    const answer = await this.choose(
      'srif-inner',
      'The sink waits. So does the mirror.',
      ['Wash up.', 'Look at the mirror.'],
    );
    if (!this.alive(token)) return;
    if (answer === 1) {
      await this.say('narr', 'You look. The crack runs from one eye to the corner of the smile. It looks almost intentional.');
      if (!this.alive(token)) return;
      await this.say({ who: 'srif', style: 'inner', text: 'Not now. Not here.' });
      if (!this.alive(token)) return;
    }

    await this.world.walkTo(this.world.player, 184, 116, 62);
    if (!this.alive(token)) return;
    this.world.face(this.world.player, 'up');
    await this.wait(200);
    g.sound.sfx('splash');
    await this.say('narr', 'The tap coughs. Then it screams.');
    if (!this.alive(token)) return;
    await this.say('narr', 'The door bangs open behind you.');
    if (!this.alive(token)) return;

    const mich = { id: 'mich-scene', skin: 'mich', x: 72, y: 246, dir: 'up', expr: 'scowl', moving: false, anim: 0 };
    this.world.addNpc(mich);
    g.sound.sfx('door');
    await this.wait(280);
    if (!this.alive(token)) return;
    this.world.facePlayer(mich);
    await this.say('mich', 'Move.');
    if (!this.alive(token)) return;
    await this.say('srif', 'Sorry—');
    if (!this.alive(token)) return;
    await this.say('mich', 'I said move. Some of us have jobs.');
    if (!this.alive(token)) return;
    await this.world.walkTo(mich, 144, 178, 62);
    if (!this.alive(token)) return;
    await this.say('narr', 'You step back. Your elbow catches the faucet. The pipe shrieks.');
    if (!this.alive(token)) return;

    g.sound.sfx('splash');
    this.world.shake(5, 320);
    this.world.flashScreen('#dcecff', 210);
    await this.wait(260);
    if (!this.alive(token)) return;
    await this.say('narr', 'A jet of cold water catches him square in the chest.');
    if (!this.alive(token)) return;
    await this.say('mich', 'Did you just—');
    if (!this.alive(token)) return;
    await this.say('mich', 'This is wool. This is imported wool.');
    if (!this.alive(token)) return;
    await this.say('narr', 'He grabs a fistful of your coat and pins you against the tiles.');
    if (!this.alive(token)) return;

    this.world.shake(4, 280);
    this.world.tension = 1;
    this.focus(180, 120);
    await this.wait(280);
    if (!this.alive(token)) return;
    await this.say({ who: 'srif', style: 'inner', text: 'Don’t smile. Don’t smile. Don’t—' });
    if (!this.alive(token)) return;
    await this.say('mich', 'Who do you think you—');
    if (!this.alive(token)) return;
    await this.say('mich', 'Wait.');
    if (!this.alive(token)) return;
    await this.say('narr', 'He squints at you. His ears flatten slowly, like flags in bad weather.');
    if (!this.alive(token)) return;
    await this.say('mich', 'Srif?');
    if (!this.alive(token)) return;
    await this.say('srif', 'Hey, Mich.');
    if (!this.alive(token)) return;
    await this.say('narr', 'He lets go. All at once, like your coat burned him.');
    if (!this.alive(token)) return;
    await this.say('mich', 'I didn’t— I didn’t recognize you.');
    if (!this.alive(token)) return;
    await this.say('mich', 'You got tall. And your face is—');
    if (!this.alive(token)) return;
    await this.say({ who: 'srif', style: 'inner', text: 'There it is.' });
    if (!this.alive(token)) return;

    const answer2 = await this.choose(
      'mich',
      'Mich is looking at you like the floor moved.',
      ['Tell him the truth.', 'Make a joke.', 'Say nothing.'],
    );
    if (!this.alive(token)) return;
    if (answer2 === 0) {
      await this.say('srif', 'I know. It does that. I’m sorry.');
      if (!this.alive(token)) return;
      await this.say('mich', 'Don’t apologize for your face, dude. That’s insane. That’s the craziest thing I’ve ever heard.');
    } else if (answer2 === 1) {
      await this.say('srif', 'New face. Same disappointment.');
      if (!this.alive(token)) return;
      await this.say('narr', 'Mich does not laugh.');
      if (!this.alive(token)) return;
      await this.say('mich', 'That’s not funny.');
      if (!this.alive(token)) return;
      await this.say('srif', 'I know.');
    } else {
      await this.say('narr', 'You don’t say anything. The tap keeps running.');
      if (!this.alive(token)) return;
      await this.say('mich', 'Okay. We’re doing quiet. Fine. I can do quiet.');
      if (!this.alive(token)) return;
      await this.say('mich', 'I’m not good at it. But I can do it.');
    }
    if (!this.alive(token)) return;
    await this.wait(220);
    await this.say('mich', 'Chris said you were back. I told him he was full of it.');
    if (!this.alive(token)) return;
    await this.say('mich', 'He hugged you, didn’t he.');
    if (!this.alive(token)) return;
    await this.say('srif', 'Immediately.');
    if (!this.alive(token)) return;
    await this.say('mich', 'Yeah. That tracks.');
    if (!this.alive(token)) return;
    await this.say('mich', 'Look. Your face. It’s... I didn’t mean it like—');
    if (!this.alive(token)) return;
    await this.say('srif', 'It’s okay.');
    if (!this.alive(token)) return;
    await this.say('mich', 'It’s not. But okay.');
    if (!this.alive(token)) return;
    await this.say('mich', 'I’m gonna get cocoa. You coming, or are you gonna keep staring at the wall?');
    if (!this.alive(token)) return;
    await this.say('narr', 'He leaves without waiting for an answer. The door swings shut.');
    if (!this.alive(token)) return;

    this.world.removeNpc('mich-scene');
    this.world.face(this.world.player, 'up');
    this.world.tension = 0.7;
    g.sound.sfx('glitch');
    this.world.flashScreen('#ff3b5c', 180);
    this.world.shake(3, 240);
    await this.wait(300);
    if (!this.alive(token)) return;
    this.world.player.expr = 'demon';
    await this.say('narr', 'For a second, the mirror is just a mirror.');
    if (!this.alive(token)) return;
    await this.say('demon', 'They’re being nice to us.');
    if (!this.alive(token)) return;
    await this.say({ who: 'srif', style: 'inner', text: 'Go away.' });
    if (!this.alive(token)) return;
    await this.say('demon', 'They haven’t seen you yet. Not really.');
    if (!this.alive(token)) return;
    await this.say('demon', 'When they do, they’ll do what everyone does.');
    if (!this.alive(token)) return;
    await this.say('srif', 'Stop.');
    if (!this.alive(token)) return;
    this.world.player.expr = 'neutral';
    this.world.tension = 0;
    await this.wait(260);
    await this.say({ who: 'srif', style: 'inner', text: 'You’re still here.\nYou’re always still here.' });
    if (!this.alive(token)) return;

    this.flags.bathroomDone = true;
    this.inBathroom = false;
    this.clearFocus();
    await this.world.enterMap('diner', { x: 240, y: 246, dir: 'up' });
    if (!this.alive(token)) return;

    const chris = this.world.getNpc('chris');
    if (chris) {
      this.world.facePlayer(chris);
      await this.say('chris', 'You were in there a while. Mich came out looking like a drowned cat.');
      if (!this.alive(token)) return;
      await this.say('mich', 'I heard that.');
      if (!this.alive(token)) return;
      await this.say('chris', 'Good.');
      if (!this.alive(token)) return;
    }
    await this.say('mich', 'Your cocoa’s getting cold, Dreemurr.');
    if (!this.alive(token)) return;
    await this.say({ who: 'srif', style: 'inner', text: 'Dreemurr.\nHe said it like it still fits.' });
    if (!this.alive(token)) return;

    this.clearFocus();
    this.objective('Leave the diner. The storm is getting worse.');
    this.save(3);
    g.cutscene = false;
  }

  /* ------------------------------------------------------------------ */
  /* storm                                                               */
  /* ------------------------------------------------------------------ */

  async exitDiner() {
    const g = this.g;
    const token = this.token;
    g.cutscene = true;
    this.flags.storm = true;
    await this.world.enterMap('town', { x: 848, y: 470, dir: 'down' });
    if (!this.alive(token)) return;
    g.sound.sfx('snow');
    this.world.shake(4, 520);
    this.world.flashScreen('#dcecff', 320);
    await this.wait(420);
    if (!this.alive(token)) return;
    await this.say('narr', 'The storm hits you like a wall made of needles.');
    if (!this.alive(token)) return;

    const mich = this.world.getNpc('mich');
    if (mich) {
      this.world.facePlayer(mich);
      await this.say('mich', 'Storm’s coming in fast. You should get home.');
      if (!this.alive(token)) return;
      await this.say('srif', 'I know.');
      if (!this.alive(token)) return;
      await this.say('mich', 'Hey. Srif.');
      if (!this.alive(token)) return;
      await this.say('srif', 'Yeah?');
      if (!this.alive(token)) return;
      await this.say('mich', 'It’s good. That you’re back. Don’t make it weird.');
      if (!this.alive(token)) return;
      await this.say('srif', 'Too late.');
      if (!this.alive(token)) return;
      await this.say('mich', 'Yeah. Go.');
      if (!this.alive(token)) return;
    }

    await this.say({ who: 'srif', style: 'inner', text: 'The house is three blocks away.\nIt feels like a different country.' });
    if (!this.alive(token)) return;
    this.objective('Walk home. Mom is waiting by the house.');
    this.save(3);
    g.cutscene = false;
  }

  /* ------------------------------------------------------------------ */
  /* home & mirror                                                       */
  /* ------------------------------------------------------------------ */

  async enterHome() {
    const g = this.g;
    const token = this.token;
    g.cutscene = true;
    await this.world.enterMap('home', { x: 240, y: 238, dir: 'up' });
    if (!this.alive(token)) return;
    if (!this.flags.homeEntered) {
      this.flags.homeEntered = true;
      await this.say('narr', 'The house breathes. Radiator. Cinnamon. Your mother’s tea.');
      if (!this.alive(token)) return;
      await this.say({ who: 'srif', style: 'inner', text: 'It’s smaller than I remember.' });
      if (!this.alive(token)) return;
      await this.say('narr', 'Upstairs, a floorboard creaks. Toriel is giving you space. It is the loudest thing in the house.');
      if (!this.alive(token)) return;
      await this.say({ who: 'srif', style: 'inner', text: 'Okay.\nLet’s get this over with.' });
      if (!this.alive(token)) return;
    }
    this.objective('Look in the mirror.');
    this.save(4);
    g.cutscene = false;
  }

  async inspectHome(id) {
    const g = this.g;
    if (id === 'exit') {
      if (!this.flags.battleDone) {
        await this.say({ who: 'srif', style: 'inner', text: 'Not yet.\nThere’s something here I need to do.' });
      }
      return;
    }

    if (id === 'mirror') {
      await this.mirrorScene();
      return;
    }

    if (id === 'fridge') {
      await this.say('narr', 'A note in Mom’s handwriting: “Srif — eat something. — Mom”');
      await this.say('narr', 'Below it, in Dad’s: “I second this. — Dad”');
      await this.say('narr', 'Below that, in what might be Chris’s: “I third this. I don’t live here.”');
      await this.say({ who: 'srif', style: 'inner', text: 'The fridge is the most emotionally available thing in this house.' });
      return;
    }

    if (id === 'photo') {
      await this.say('narr', 'A photo of two goats and a kid with a gap-toothed smile. The kid’s face is turned toward the sun.');
      await this.say({ who: 'srif', style: 'inner', text: 'You remember the sun.\nYou remember it not hurting.' });
      return;
    }

    if (id === 'tv') {
      await this.say('narr', 'The TV is playing static. It sounds like the ocean.');
      await this.say({ who: 'srif', style: 'inner', text: 'Four years and the reception is still terrible.' });
      return;
    }

    if (id === 'couch') {
      await this.say('narr', 'You sit for a moment. The cushion remembers you.');
      await this.say({ who: 'srif', style: 'inner', text: 'Traitor.' });
      return;
    }
  }

  async mirrorScene() {
    if (this.inMirror || this.flags.battleDone) {
      if (this.flags.battleDone) {
        await this.say('narr', 'The mirror is just a mirror now. Most days.');
      }
      return;
    }
    this.inMirror = true;
    const g = this.g;
    const token = this.token;
    g.cutscene = true;
    this.focus(132, 138);
    await this.world.walkTo(this.world.player, 86, 150, 54);
    if (!this.alive(token)) { this.inMirror = false; return; }
    this.world.face(this.world.player, 'left');
    await this.wait(300);
    if (!this.alive(token)) return;

    await this.say('narr', 'The mirror is old. The crack runs through the smile.');
    if (!this.alive(token)) return;
    await this.say('srif', 'Okay.');
    if (!this.alive(token)) return;
    await this.say({ who: 'srif', style: 'inner', text: 'It’s just a mirror.\nYou’ve looked in a mirror before.' });
    if (!this.alive(token)) return;
    await this.wait(260);

    g.sound.sfx('glitch');
    this.world.flashScreen('#ff3b5c', 180);
    this.world.shake(3, 260);
    this.world.tension = 0.8;
    this.world.player.expr = 'demon';
    await this.say('demon', 'Hello, Srif.');
    if (!this.alive(token)) return;
    await this.say('srif', 'No.');
    if (!this.alive(token)) return;
    await this.say('demon', 'You didn’t think coming home would fix us, did you?');
    if (!this.alive(token)) return;
    await this.say('demon', 'You brought me. You always bring me.');
    if (!this.alive(token)) return;
    await this.say({ who: 'srif', style: 'inner', text: 'It’s my face.\nIt’s my face and it’s smiling without me.' });
    if (!this.alive(token)) return;

    const answer = await this.choose(
      'demon',
      'The thing in the glass waits. It has your eyes. It has your smile. It has nowhere else to be.',
      ['Put the smile back on.', 'Take it off.'],
    );
    if (!this.alive(token)) return;
    if (answer === 0) {
      await this.say('demon', 'There he is. Good boy. Everybody likes this one.');
      if (!this.alive(token)) return;
      await this.say('srif', 'No.');
      if (!this.alive(token)) return;
      await this.say('srif', 'I’m done performing.');
    } else {
      await this.say('narr', 'You stop smiling.');
      if (!this.alive(token)) return;
      await this.say('demon', '...what are you doing?');
      if (!this.alive(token)) return;
      await this.say('srif', 'Taking it off.\nYou can too.');
    }
    if (!this.alive(token)) return;
    await this.say('demon', 'You can’t just look at me and make me go away.');
    if (!this.alive(token)) return;
    await this.say('srif', 'No. But I can stop looking away.');
    if (!this.alive(token)) return;

    this.flags.mirrorSeen = true;
    g.sound.sfx('shatter');
    this.world.flashScreen('#ffffff', 300);
    this.world.shake(6, 480);
    this.world.tension = 1;
    await this.wait(600);
    if (!this.alive(token)) return;
    this.dlg.hide();
    this.clearFocus();
    g.cutscene = false;
    g.mode = 'battle';
    const spared = await g.battle.start();
    if (spared) await this.ending();
  }

  /* ------------------------------------------------------------------ */
  /* ending                                                              */
  /* ------------------------------------------------------------------ */

  async ending(fast = false) {
    const g = this.g;
    if (this.flags.battleDone && g.mode === 'ending') {
      // Already showing the end card (e.g. debug / resume).
      if (fast) {
        g.ui.showEndCard({
          time: fmtTime(g.stats.time),
          acts: g.stats.acts || 0,
          dodges: g.stats.dodges || 0,
        });
      }
      return;
    }
    const token = this.token;
    this.flags.battleDone = true;
    this.flags.mirrorSeen = true;
    g.mode = 'ending';
    g.cutscene = false;
    g.paused = false;
    g.ui.showHud(false);
    g.dialogue.hide();
    g.sound.playTrack('ending');
    g.sound.ambience(0.35);
    this.clearFocus();
    await this.wait(900);
    if (!this.alive(token)) return;

    if (!fast) {
      await this.say('narr', 'COLD SELF does not vanish.');
      if (!this.alive(token)) return;
      await this.say('cold', '...I’m still here.');
      if (!this.alive(token)) return;
      await this.say('srif', 'I know.');
      if (!this.alive(token)) return;
      await this.say('cold', 'You’re not going to leave?');
      if (!this.alive(token)) return;
      await this.say('srif', 'No. But you don’t get to drive anymore.');
      if (!this.alive(token)) return;
      await this.say('cold', '...okay.');
      if (!this.alive(token)) return;
      await this.say('narr', 'Downstairs, Toriel is pretending not to cry. Asgore is pretending not to notice. Mich is pretending he didn’t run here in the snow.');
      if (!this.alive(token)) return;
      await this.say('narr', 'Chris isn’t pretending at all.');
      if (!this.alive(token)) return;
      await this.say('chris', 'Srif! You okay? You were up there forever.');
      if (!this.alive(token)) return;
      await this.say('srif', 'Yeah. I think I am.');
      if (!this.alive(token)) return;
      await this.say('chris', 'Good. Cocoa’s still warm.');
      if (!this.alive(token)) return;
      await this.say({ who: 'srif', style: 'inner', text: 'For the first time in four years, you look at your face and don’t look away.' });
      if (!this.alive(token)) return;
    }

    this.save(5);
    g.ui.showEndCard({
      time: fmtTime(g.stats.time),
      acts: g.stats.acts || 0,
      dodges: g.stats.dodges || 0,
    });
  }

  /* ------------------------------------------------------------------ */
  /* NPC talk                                                            */
  /* ------------------------------------------------------------------ */

  async talk(id) {
    if (this.g.cutscene || this.dlg.active) return;
    if (id === 'toriel') return this.talkToriel();
    if (id === 'asgore') return this.talkAsgore();
    if (id === 'chris') return this.talkChris();
    if (id === 'mich') return this.talkMich();
    if (id === 'lark') return this.talkLark();
    if (id === 'patron') return this.talkPatron();
    if (id === 'snowman') return this.inspect('snowman');
  }

  async talkToriel() {
    const t = this.world.getNpc('toriel');
    if (t) this.world.facePlayer(t);
    if (!this.flags.chrisMet) {
      await this.say('toriel', 'Chris is by the square, dear. He has been vibrating since morning. I think he might be excited.');
      await this.say({ who: 'srif', style: 'inner', text: 'That makes one of us.' });
      return;
    }
    if (this.flags.storm && !this.flags.homeEntered) {
      await this.say('toriel', 'There you are. Look at you, half-frozen.');
      await this.say('toriel', 'Your father wanted to walk you home, but he got called in. He is... he is trying.');
      const answer = await this.choose('toriel', 'She holds her umbrella a little too far to her side, leaving room for you.', ['“I know.”', '“He can try from the station.”']);
      if (answer === 0) {
        await this.say('toriel', 'I know you do. That is what makes it hard.');
      } else {
        await this.say('toriel', 'Srif.');
        await this.say('toriel', 'He is your father. That does not make him less infuriating.');
        await this.say('toriel', 'But it does mean he loves you. Loudly. Badly. From a distance.');
      }
      await this.say('toriel', 'Go inside. I’ll make tea. Or cocoa. Or both. I have not decided.');
      return;
    }
    if (this.flags.bathroomDone) {
      await this.say('toriel', 'Go home, sweetheart. Before the snow decides to keep you.');
      return;
    }
    await this.say('toriel', 'Go on. Cocoa. And eat something that isn’t snow.');
  }

  async talkAsgore() {
    const a = this.world.getNpc('asgore');
    if (a) this.world.facePlayer(a);
    if (!this.flags.asgoreTalked) {
      this.flags.asgoreTalked = true;
      await this.say('asgore', 'Srif! You’re— look at you. You’re taller than me. Almost.');
      await this.say('srif', 'Dad.');
      await this.say('asgore', 'I’m sorry I couldn’t meet you at the truck. There was a situation at the station. A raccoon.');
      await this.say('srif', 'A raccoon.');
      await this.say('asgore', 'It was wearing a tiny hat. I could not arrest it. It was too small.');
      await this.say({ who: 'srif', style: 'inner', text: 'Four years. Still the same man.' });
      await this.say('asgore', 'How are you? Really?');
      await this.say('srif', 'Fine.');
      await this.say('asgore', 'You don’t have to be fine with me.');
      await this.say({ who: 'srif', style: 'inner', text: 'Yes I do.' });
      await this.say('asgore', 'I’m proud of you. I don’t say it enough. I know I don’t.');
      return;
    }
    await this.say('asgore', 'Mind the ice by the diner. And the raccoon. If you see it. It has a hat.');
  }

  async talkChris() {
    const c = this.world.getNpc('chris');
    if (c) this.world.facePlayer(c);
    if (!this.flags.bathroomDone) {
      await this.say('chris', 'Bathroom’s by the front. Mich is coming by. Try not to make it weird.');
      await this.say({ who: 'srif', style: 'inner', text: 'I make everything weird. It’s a gift.' });
      return;
    }
    await this.say('chris', 'So. You and Mich. Did you talk?');
    await this.say('srif', 'He pinned me to a wall.');
    await this.say('chris', 'That’s how he says hello.');
    await this.say('srif', 'That’s not how people say hello.');
    await this.say('chris', 'You’ve met people. Mich is not people.');
  }

  async talkMich() {
    const m = this.world.getNpc('mich');
    if (m) this.world.facePlayer(m);
    if (!this.flags.michTalked) {
      this.flags.michTalked = true;
      await this.say('mich', 'What.');
      await this.say('srif', 'Nothing.');
      await this.say('mich', 'Then stop looking at me.');
      await this.say('narr', 'He is holding his mug with both hands. The ushanka is still wet.');
      await this.say('mich', '...I’m sorry about the wall thing.');
      await this.say('srif', 'It’s okay.');
      await this.say('mich', 'It’s not. Shut up.');
      return;
    }
    if (this.world.mapId === 'town') {
      await this.say('mich', 'Go home, Srif. I’ll keep an eye on the Kettle.');
      return;
    }
    await this.say('mich', 'Don’t make it weird.');
    await this.say('srif', 'I wasn’t going to.');
    await this.say('mich', 'You were thinking about it. I can tell.');
  }

  async talkLark() {
    await this.say('lark', 'Srif Dreemurr. You’ve got your father’s shoulders and your mother’s worry.');
    await this.say('lark', 'Eat something. The pigeons are winning.');
    await this.say('narr', 'A pigeon lands on her arm. It looks smug.');
  }

  async talkPatron() {
    await this.say('narr', 'The patron does not look up. They are reading the same page they were reading four years ago.');
    await this.say('narr', 'The page does not appear to have changed.');
  }

  /* ------------------------------------------------------------------ */
  /* misc                                                                */
  /* ------------------------------------------------------------------ */

  checkpointName(n) {
    return ({
      1: 'Find Chris near the square',
      2: 'Meet Chris at the Copper Kettle',
      3: 'Walk home through the storm',
      4: 'Look in the mirror',
      5: 'Cold open complete',
    })[n] || 'Oppidan';
  }
}

export { SAVE_KEY };
