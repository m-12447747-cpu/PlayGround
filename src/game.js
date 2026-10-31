/* OPPIDAN — game flow, input and scene orchestration. */
import { drawScene, drawPortrait } from "./art.js";
import { layout, WORLD_WIDTH, clamp, battleBoard } from "./draw-utils.js";
import { GameAudio } from "./audio.js";
import * as STORY from "./story.js";

const $ = (id) => document.getElementById(id);

const ui = {
  canvas: $("game-canvas"),
  title: $("title-screen"),
  btnStart: $("btn-start"),
  btnContinue: $("btn-continue"),
  btnControls: $("btn-controls"),
  continueLabel: $("continue-label"),
  chapter: $("chapter-card"),
  chapterKicker: $("chapter-kicker"),
  chapterTitle: $("chapter-title"),
  chapterMeta: $("chapter-meta"),
  hud: $("hud"),
  hudObjective: $("hud-objective"),
  objectiveText: $("objective-text"),
  tiltPill: $("tilt-pill"),
  btnSound: $("btn-sound"),
  btnPause: $("btn-pause"),
  battleStats: $("battle-stats"),
  hpFill: $("hp-fill"),
  hpText: $("hp-text"),
  enemyFill: $("enemy-fill"),
  battleTrust: $("battle-trust"),
  dialogueLayer: $("dialogue-layer"),
  dialogueBox: $("dialogue-box"),
  portraitFrame: $("portrait-frame"),
  portraitCanvas: $("portrait-canvas"),
  nameplate: $("nameplate"),
  speakerName: $("speaker-name"),
  dialogueText: $("dialogue-text"),
  choiceList: $("choice-list"),
  continueMark: $("continue-mark"),
  battleActions: $("battle-actions"),
  dodgeUI: $("dodge-ui"),
  dodgeTimer: $("dodge-timer"),
  struggleUI: $("struggle-ui"),
  btnStruggle: $("btn-struggle"),
  struggleFill: $("struggle-fill"),
  touch: $("touch-controls"),
  joystick: $("joystick"),
  joystickKnob: $("joystick-knob"),
  btnInteract: $("btn-interact"),
  interactLabel: $("interact-label"),
  fade: $("fade"),
  modal: $("pause-modal"),
  pauseTitle: $("pause-title"),
  pauseSub: $("pause-sub"),
  btnResume: $("btn-resume"),
  btnTilt: $("btn-tilt-toggle"),
  tiltStatus: $("tilt-status"),
  btnSoundToggle: $("btn-sound-toggle"),
  soundStatus: $("sound-status"),
  btnFullscreen: $("btn-fullscreen"),
  btnRestart: $("btn-restart"),
  btnQuit: $("btn-quit"),
  modalDanger: document.querySelector(".modal-danger"),
  modalNote: document.querySelector(".modal-note"),
  ending: $("ending-screen"),
  btnAgain: $("btn-again"),
  btnEndingTitle: $("btn-ending-title"),
  toast: $("toast"),
};

const ctx = ui.canvas.getContext("2d");
const audio = new GameAudio();
const SAVE_KEY = "oppidan-save-v1";
const DINER_DOOR = 2070;
const ASGORE_X = 720;
const TORIEL_X = 1090;
const CHRIS_X = 1546;

let W = window.innerWidth;
let H = window.innerHeight;
let dpr = 1;
let lastTime = performance.now();
let objectiveTimer = 0;
let toastTimer = 0;
let chapterHideTimer = 0;

const freshBath = () => ({
  mode: "normal",
  playerX: 0.25,
  michX: 0.67,
  pin: 0,
  pinTarget: 0,
  recognize: 0,
  recognizeTarget: 0,
  zoom: 1,
  zoomTarget: 1,
  shake: 0,
  spray: 0,
  sprayTarget: 0,
  after: false,
  ominous: false,
  mood: "neutral",
});

const freshBattle = () => ({
  phase: "intro",
  hp: 24,
  maxHp: 24,
  enemyHp: 36,
  maxEnemyHp: 36,
  trust: 0,
  itemUses: 2,
  heart: { x: 0, y: 0 },
  projectiles: [],
  dodgeTime: 0,
  dodgeDuration: 5.4,
  spawnClock: 0,
  invuln: 0,
  hurt: 0,
  damageFlash: 0,
  trustBurst: 0,
  victory: 0,
  showBoard: false,
  introFade: 0,
  dodgeResolve: null,
  winning: false,
  menu: "main",
  menuDelay: 0,
  defeated: false,
  turn: 0,
});

const state = {
  scene: "title",
  time: 0,
  camera: 1400,
  paused: false,
  busy: false,
  starting: false,
  player: { x: 230, facing: 1, walking: false, phase: 0, mood: "neutral", visible: true },
  npcs: {
    asgore: { x: ASGORE_X, visible: true, talked: false },
    toriel: { x: TORIEL_X, visible: true, talked: false },
    chris: { x: CHRIS_X, visible: true, talked: false, leaving: false },
  },
  flags: {
    introDone: false,
    chrisMet: false,
    hugging: false,
    choiceId: null,
    asgoreTalked: false,
    torielTalked: false,
    battleWon: false,
  },
  footprints: [],
  marker: null,
  dialogueActive: false,
  typing: null,
  choices: null,
  dialogueAdvance: null,
  near: null,
  autoWalk: null,
  pendingInteract: null,
  joystick: { active: false, x: 0, y: 0 },
  tilt: { active: false, x: 0, y: 0, base: null, baseBeta: 0 },
  keys: new Set(),
  bath: freshBath(),
  battle: freshBattle(),
  shake: 0,
  flash: 0,
  stepClock: 0,
  printClock: 0,
  checkpoint: null,
  modalTitle: false,
  struggle: null,
  interactCooldown: 0,
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isCoarse() {
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 821;
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function vibrate(pattern) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (_) {}
  }
}

function shake(amount = 10) {
  if (reducedMotion()) amount *= 0.3;
  state.shake = Math.max(state.shake, amount);
}

function flash(amount = 0.7) {
  state.flash = Math.max(state.flash, amount);
}

/* ---------- Save ---------- */

function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.checkpoint) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

const CHECKPOINT_NAMES = {
  "street-intro": "CHAPTER I",
  "street-free": "CHAPTER I",
  "street-diner": "CHAPTER I",
  bathroom: "INTERLUDE",
  battle: "THE MIRROR",
  ending: "EPILOGUE",
};

function saveCheckpoint(checkpoint) {
  state.checkpoint = checkpoint;
  const data = {
    checkpoint,
    choiceId: state.flags.choiceId,
    asgoreTalked: !!state.flags.asgoreTalked,
    torielTalked: !!state.flags.torielTalked,
    chrisMet: !!state.flags.chrisMet,
    introDone: !!state.flags.introDone,
    savedAt: Date.now(),
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (_) {}
  updateContinueButton();
}

function updateContinueButton() {
  const save = readSave();
  if (!save) {
    ui.btnContinue.hidden = true;
    return;
  }
  ui.btnContinue.hidden = false;
  ui.continueLabel.textContent = CHECKPOINT_NAMES[save.checkpoint] || "CHAPTER I";
}

/* ---------- HUD ---------- */

function showHud(on) {
  ui.hud.hidden = !on;
}

function setObjective(text) {
  if (!text) {
    ui.hudObjective.style.opacity = "0";
    return;
  }
  ui.hudObjective.style.opacity = "";
  if (ui.objectiveText.textContent === text) return;
  ui.hudObjective.classList.add("is-updating");
  clearTimeout(objectiveTimer);
  objectiveTimer = setTimeout(() => {
    ui.objectiveText.textContent = text;
    ui.hudObjective.classList.remove("is-updating");
  }, 170);
}

function updateMarker() {
  if (state.scene !== "street") {
    state.marker = null;
    return;
  }
  if (!state.flags.chrisMet) {
    state.marker = { x: state.npcs.chris.x };
  } else {
    state.marker = { x: DINER_DOOR };
  }
}

function showChapterCard(kicker, title, meta, duration = 2800) {
  clearTimeout(chapterHideTimer);
  ui.chapterKicker.textContent = kicker;
  ui.chapterTitle.textContent = title;
  ui.chapterMeta.textContent = meta;
  ui.chapter.hidden = false;
  ui.chapter.classList.remove("is-leaving");
  chapterHideTimer = setTimeout(() => {
    ui.chapter.classList.add("is-leaving");
    setTimeout(() => {
      ui.chapter.hidden = true;
      ui.chapter.classList.remove("is-leaving");
    }, 500);
  }, duration);
}

function toast(message, ms = 2400) {
  ui.toast.textContent = message;
  ui.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove("is-visible"), ms);
}

function updateSoundButton() {
  ui.btnSound.classList.toggle("is-muted", audio.muted || !audio.started);
  ui.soundStatus.textContent = audio.muted ? "OFF" : "ON";
}

async function ensureAudio(theme) {
  await audio.init();
  if (theme) audio.setTheme(theme);
  updateSoundButton();
}

/* ---------- Fades ---------- */

async function fadeOut(ms = 500) {
  ui.fade.classList.add("is-on");
  await wait(ms);
}

async function fadeIn(ms = 500) {
  ui.fade.classList.remove("is-on");
  await wait(ms);
}

/* ---------- Dialogue ---------- */

function setSpeaker(line) {
  const narration = line.narration || !line.who;
  state.typing = null;
  state.choices = null;
  state.dialogueAdvance = null;
  state.dialogueActive = true;
  ui.dialogueLayer.hidden = false;
  ui.choiceList.hidden = true;
  ui.choiceList.innerHTML = "";
  ui.continueMark.classList.add("is-hidden");
  ui.dialogueBox.classList.toggle("narration", narration);
  ui.dialogueText.classList.toggle("glitch", line.who === "mirror");
  ui.dialogueText.classList.toggle("whisper", line.who === "mirror");

  if (narration) {
    ui.nameplate.hidden = true;
    ui.speakerName.textContent = "";
  } else {
    ui.nameplate.hidden = false;
    ui.speakerName.textContent = STORY.SPEAKERS[line.who] || line.who || "";
    drawPortrait(ui.portraitCanvas, line.who, line.mood || "neutral", state.time);
  }

  ui.dialogueText.textContent = "";
  const typing = {
    full: line.text,
    shown: 0,
    acc: 0,
    who: line.who,
    revealResolve: null,
  };
  state.typing = typing;
  state.dialogueActive = true;
  syncControls();

  return new Promise((resolve) => {
    typing.revealResolve = resolve;
  });
}

function finishTyping() {
  const typing = state.typing;
  if (!typing) return;
  typing.shown = typing.full.length;
  ui.dialogueText.textContent = typing.full;
  state.typing = null;
  ui.continueMark.classList.remove("is-hidden");
  const resolve = typing.revealResolve;
  if (resolve) resolve();
}

function updateTyping(dt) {
  const typing = state.typing;
  if (!typing) return;
  typing.acc += dt * 88;
  const shown = Math.min(typing.full.length, Math.floor(typing.acc));
  if (shown !== typing.shown) {
    typing.shown = shown;
    ui.dialogueText.textContent = typing.full.slice(0, shown);
    if (shown > 0 && shown % 3 === 0) audio.blip(typing.who || "narrator");
  }
  if (typing.shown >= typing.full.length) finishTyping();
}

async function say(line) {
  const reveal = setSpeaker(line);
  await reveal;
  await new Promise((resolve) => {
    state.dialogueAdvance = resolve;
  });
  hideDialogue();
}

async function dialogueLines(lines) {
  for (const line of lines) {
    if (line.shake) shake(line.shake);
    await say(line);
    await wait(35);
  }
}

async function ask(prompt, options) {
  const reveal = setSpeaker(prompt);
  await reveal;
  ui.continueMark.classList.add("is-hidden");
  ui.choiceList.hidden = false;
  ui.choiceList.innerHTML = "";
  syncControls();

  return new Promise((resolve) => {
    const choose = (option) => {
      if (!state.choices) return;
      state.choices = null;
      ui.choiceList.hidden = true;
      ui.choiceList.innerHTML = "";
      state.dialogueActive = false;
      ui.dialogueLayer.hidden = true;
      audio.confirm();
      syncControls();
      resolve(option);
    };

    state.choices = { options, choose };
    options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-button";
      button.dataset.choice = option.id;
      button.innerHTML = `<span>${option.label}</span><span class="choice-key">${index + 1}</span>`;
      button.addEventListener("pointerdown", (event) => event.stopPropagation());
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        choose(option);
      });
      ui.choiceList.appendChild(button);
    });
  });
}

function advanceDialogue() {
  if (state.choices) return;
  if (!state.dialogueActive) return;
  if (state.typing) {
    finishTyping();
    return;
  }
  const resolve = state.dialogueAdvance;
  if (resolve) {
    state.dialogueAdvance = null;
    resolve();
  }
}

function chooseIndex(index) {
  if (!state.choices) return false;
  const option = state.choices.options[index];
  if (!option) return false;
  state.choices.choose(option);
  return true;
}

function hideDialogue() {
  state.dialogueActive = false;
  state.dialogueAdvance = null;
  state.typing = null;
  state.choices = null;
  state.interactCooldown = 0.2;
  ui.dialogueLayer.hidden = true;
  ui.choiceList.hidden = true;
  ui.continueMark.classList.add("is-hidden");
  syncControls();
}

function showBattlePrompt(text = "What will SRIF do?") {
  state.typing = null;
  state.choices = null;
  state.dialogueActive = false;
  state.dialogueAdvance = null;
  ui.dialogueLayer.hidden = false;
  ui.dialogueBox.classList.add("narration");
  ui.dialogueText.classList.remove("glitch");
  ui.dialogueText.textContent = text;
  ui.nameplate.hidden = true;
  ui.choiceList.hidden = true;
  ui.choiceList.innerHTML = "";
  ui.continueMark.classList.add("is-hidden");
  syncControls();
}

/* ---------- Controls ---------- */

function setInteract(label, enabled) {
  ui.interactLabel.textContent = label;
  ui.btnInteract.disabled = !enabled;
  ui.btnInteract.classList.toggle("is-ready", enabled);
}

function syncControls() {
  const scene = state.scene;
  const blocked = state.paused || state.dialogueActive || state.choices || state.busy;
  const battleDodge = scene === "battle" && state.battle.phase === "dodge";
  const playable = (scene === "street" || scene === "bathroom") && !blocked;

  if (battleDodge) {
    ui.touch.hidden = false;
    ui.joystick.hidden = false;
    ui.btnInteract.hidden = true;
    return;
  }

  if (!playable) {
    ui.touch.hidden = true;
    return;
  }

  ui.touch.hidden = false;
  ui.joystick.hidden = false;
  ui.btnInteract.hidden = false;

  let label = "TALK";
  let enabled = false;
  if (scene === "bathroom") {
    label = "WASH";
    enabled = Math.abs(state.bath.playerX - 0.35) < 0.075;
  } else if (state.near) {
    enabled = true;
    label = state.near === "diner" ? "ENTER" : "TALK";
  }
  setInteract(label, enabled);
}

/* ---------- Scenes ---------- */

function resetRun() {
  state.scene = "street";
  state.title = false;
  state.ending = false;
  state.time = 0;
  state.camera = 0;
  state.paused = false;
  state.busy = true;
  state.player = { x: 230, facing: 1, walking: false, phase: 0, mood: "neutral", visible: true };
  state.npcs = {
    asgore: { x: ASGORE_X, visible: true, talked: false },
    toriel: { x: TORIEL_X, visible: true, talked: false },
    chris: { x: CHRIS_X, visible: true, talked: false, leaving: false },
  };
  state.flags = {
    introDone: false,
    chrisMet: false,
    hugging: false,
    choiceId: null,
    asgoreTalked: false,
    torielTalked: false,
    battleWon: false,
  };
  state.footprints = [];
  state.marker = null;
  state.near = null;
  state.autoWalk = null;
  state.pendingInteract = null;
  state.joystick = { active: false, x: 0, y: 0 };
  state.bath = freshBath();
  state.battle = freshBattle();
  state.shake = 0;
  state.flash = 0;
  state.stepClock = 0;
  state.typing = null;
  state.dialogueActive = false;
  state.dialogueAdvance = null;
  state.choices = null;
  state.interactCooldown = 0;
  document.body.classList.remove("in-battle");
  document.body.classList.remove("battle-submenu");
  ui.ending.hidden = true;
  ui.battleStats.hidden = true;
  ui.battleActions.hidden = true;
  ui.dodgeUI.hidden = true;
  ui.struggleUI.hidden = true;
  ui.fade.classList.remove("is-on");
  hideDialogue();
}

function setupStreet() {
  state.scene = "street";
  state.camera = 0;
  state.bath = freshBath();
  document.body.classList.remove("in-battle");
  ui.battleStats.hidden = true;
  ui.battleActions.hidden = true;
  ui.dodgeUI.hidden = true;
  ui.ending.hidden = true;
  showHud(true);
  showBattleHud(false);
  updateMarker();
  syncControls();
}

function setupBathroom() {
  state.scene = "bathroom";
  state.bath = freshBath();
  state.marker = null;
  document.body.classList.remove("in-battle");
  ui.battleStats.hidden = true;
  ui.battleActions.hidden = true;
  ui.dodgeUI.hidden = true;
  showHud(true);
  showBattleHud(false);
  audio.setTheme("bathroom");
  setObjective("Wash your hands.");
  syncControls();
}

function showBattleHud(on) {
  ui.battleStats.hidden = !on;
  document.body.classList.toggle("in-battle", on);
  if (on) {
    showHud(true);
    ui.hud.querySelector(".hud-left").style.display = "none";
  } else {
    const left = ui.hud.querySelector(".hud-left");
    if (left) left.style.display = "";
  }
}

function showTitle() {
  state.scene = "title";
  state.paused = false;
  state.busy = false;
  state.starting = false;
  state.camera = 1400;
  state.title = true;
  state.ending = false;
  ui.title.hidden = false;
  ui.title.classList.remove("is-leaving");
  ui.ending.hidden = true;
  ui.hud.hidden = true;
  ui.battleStats.hidden = true;
  ui.battleActions.hidden = true;
  ui.dodgeUI.hidden = true;
  ui.touch.hidden = true;
  ui.modal.hidden = true;
  hideDialogue();
  document.body.classList.remove("in-battle");
  updateContinueButton();
  audio.setTheme("title");
}

/* ---------- Cutscenes ---------- */

async function startNewGame() {
  if (state.starting) return;
  state.starting = true;
  await ensureAudio("street");
  ui.title.classList.add("is-leaving");
  await wait(460);
  ui.title.hidden = true;
  ui.title.classList.remove("is-leaving");
  resetRun();
  setupStreet();
  showHud(true);
  state.busy = true;
  syncControls();
  showChapterCard("CHAPTER I", "HOME", "OPPIDAN · 6:42 PM");
  saveCheckpoint("street-intro");
  await dialogueLines(STORY.intro);
  state.flags.introDone = true;
  state.busy = false;
  setObjective("Find Chris by the plaza.");
  updateMarker();
  syncControls();
  saveCheckpoint("street-free");
  state.starting = false;
}

async function continueGame() {
  const save = readSave();
  if (!save) return;
  if (state.starting) return;
  state.starting = true;
  await ensureAudio("street");
  ui.title.classList.add("is-leaving");
  await wait(460);
  ui.title.hidden = true;
  ui.title.classList.remove("is-leaving");
  resetRun();
  state.flags.choiceId = save.choiceId || null;
  state.flags.asgoreTalked = !!save.asgoreTalked;
  state.flags.torielTalked = !!save.torielTalked;
  state.npcs.asgore.talked = !!save.asgoreTalked;
  state.npcs.toriel.talked = !!save.torielTalked;

  if (save.checkpoint === "ending") {
    state.starting = false;
    showEnding();
    return;
  }

  if (save.checkpoint === "battle") {
    setupBattle();
    state.starting = false;
    runBattleIntro();
    return;
  }

  if (save.checkpoint === "bathroom") {
    setupBathroom();
    state.starting = false;
    runBathroomEntry();
    return;
  }

  setupStreet();
  state.flags.introDone = true;
  state.busy = false;

  if (save.checkpoint === "street-diner") {
    state.flags.chrisMet = true;
    state.npcs.chris.visible = false;
    state.player.x = 1870;
    state.camera = clamp(state.player.x - 300, 0, WORLD_WIDTH - 400);
    setObjective("Meet Chris inside the Lakeside Diner.");
    updateMarker();
  } else if (save.checkpoint === "street-intro") {
    state.busy = true;
    syncControls();
    showChapterCard("CHAPTER I", "HOME", "OPPIDAN · 6:42 PM");
    await dialogueLines(STORY.intro);
    state.busy = false;
    setObjective("Find Chris by the plaza.");
    updateMarker();
    saveCheckpoint("street-free");
  } else {
    setObjective("Find Chris by the plaza.");
    updateMarker();
  }

  syncControls();
  state.starting = false;
}

async function talkAsgore() {
  if (state.busy || state.dialogueActive) return;
  state.busy = true;
  syncControls();
  const first = !state.flags.asgoreTalked;
  await dialogueLines(first ? STORY.asgoreFirst : STORY.asgoreAgain);
  state.flags.asgoreTalked = true;
  state.npcs.asgore.talked = true;
  state.busy = false;
  syncControls();
}

async function talkToriel() {
  if (state.busy || state.dialogueActive) return;
  state.busy = true;
  syncControls();
  const first = !state.flags.torielTalked;
  await dialogueLines(first ? STORY.torielFirst : STORY.torielAgain);
  state.flags.torielTalked = true;
  state.npcs.toriel.talked = true;
  state.busy = false;
  syncControls();
}

async function runReunion() {
  if (state.flags.chrisMet || state.busy) return;
  state.busy = true;
  state.flags.hugging = true;
  state.player.facing = 1;
  state.player.x = CHRIS_X - 26;
  state.npcs.chris.visible = true;
  state.autoWalk = null;
  syncControls();
  await wait(260);
  await dialogueLines(STORY.chrisReunion);
  const chosen = await ask(
    { narration: true, text: STORY.chrisChoices.prompt },
    STORY.chrisChoices.options,
  );
  state.flags.choiceId = chosen.id;
  audio.heart();
  await dialogueLines(chosen.response);
  await dialogueLines(STORY.chrisAfterChoice);
  state.flags.hugging = false;
  state.flags.chrisMet = true;
  state.npcs.chris.leaving = true;
  setObjective("Meet Chris inside the Lakeside Diner.");
  updateMarker();
  saveCheckpoint("street-diner");
  state.busy = false;
  syncControls();
}

async function enterDiner() {
  if (!state.flags.chrisMet) {
    if (state.busy || state.dialogueActive) return;
    state.busy = true;
    syncControls();
    await dialogueLines(STORY.dinerLocked);
    state.busy = false;
    syncControls();
    return;
  }
  if (state.busy || state.dialogueActive) return;
  state.busy = true;
  syncControls();
  audio.open();
  await fadeOut(420);
  setupBathroom();
  await fadeIn(420);
  saveCheckpoint("bathroom");
  state.busy = false;
  syncControls();
  runBathroomEntry();
}

async function runBathroomEntry() {
  state.busy = true;
  syncControls();
  await dialogueLines(STORY.bathroomIntro);
  setObjective("Wash your hands.");
  state.busy = false;
  syncControls();
}

function interact() {
  if (state.dialogueActive) {
    advanceDialogue();
    return;
  }
  if (state.paused || state.busy || state.choices || state.interactCooldown > 0) return;
  if (state.scene === "street") {
    if (state.near === "asgore") talkAsgore();
    else if (state.near === "toriel") talkToriel();
    else if (state.near === "diner") enterDiner();
  } else if (state.scene === "bathroom") {
    if (Math.abs(state.bath.playerX - 0.35) < 0.075) startWashCutscene();
  }
}

// === PART 2 ===

/* ---------- The wash, the pin, the mirror ---------- */

function startStruggle() {
  hideDialogue();
  state.struggle = { taps: 0, needed: 7, resolve: null, done: false };
  ui.struggleUI.hidden = false;
  ui.struggleFill.style.width = "0%";
  syncControls();
  return new Promise((resolve) => {
    state.struggle.resolve = resolve;
  });
}

function tapStruggle() {
  const st = state.struggle;
  if (!st || st.done) return;
  st.taps += 1;
  const pct = Math.min(100, (st.taps / st.needed) * 100);
  ui.struggleFill.style.width = `${pct}%`;
  audio.thud();
  vibrate(12);
  if (state.bath) state.bath.shake = Math.max(state.bath.shake || 0, 5);
  if (st.taps >= st.needed) {
    st.done = true;
    ui.struggleUI.hidden = true;
    audio.heart();
    const resolve = st.resolve;
    state.struggle = null;
    if (resolve) resolve();
  }
}

async function startWashCutscene() {
  if (state.busy || state.dialogueActive || state.bath.mode !== "normal") return;
  state.busy = true;
  syncControls();
  const bath = state.bath;
  bath.playerX = 0.35;
  bath.mood = "empty";
  state.player.facing = 1;

  await dialogueLines(STORY.washStart.slice(0, 1));
  await wait(180);
  audio.splash();
  await dialogueLines(STORY.washStart.slice(1));

  bath.mode = "spray";
  bath.sprayTarget = 1;
  bath.spray = 0.2;
  bath.shake = 8;
  audio.splash();
  shake(6);
  vibrate(30);
  await wait(620);
  bath.sprayTarget = 0;

  await say(STORY.michPin[0]);
  bath.mode = "pin";
  bath.pinTarget = 1;
  bath.zoomTarget = 1.055;
  bath.shake = 16;
  audio.thud();
  shake(14);
  vibrate([35, 40, 70]);
  await say(STORY.michPin[1]);
  await say(STORY.michPin[2]);

  hideDialogue();
  await startStruggle();

  bath.mode = "recognize";
  bath.recognizeTarget = 1;
  bath.pinTarget = 0.55;
  bath.zoomTarget = 1.02;
  bath.shake = 7;
  audio.heart();
  await wait(220);
  await dialogueLines(STORY.michPin.slice(3));

  bath.ominous = true;
  bath.zoomTarget = 1;
  bath.shake = 9;
  audio.glass();
  shake(9);
  await wait(450);
  enterMirrorBattle();
}

async function enterMirrorBattle() {
  state.busy = true;
  syncControls();
  showChapterCard("INTERLUDE", "THE MIRROR", "LAKESIDE DINER · 7:15 PM", 2200);
  await fadeOut(760);
  setupBattle();
  await fadeIn(760);
  runBattleIntro();
}

/* ---------- Battle setup ---------- */

const BATTLE_ACTS = [
  { act: "check", symbol: "?", label: "CHECK", hint: "LOOK" },
  { act: "smile", symbol: "☺", label: "SMILE", hint: "PRACTICED" },
  { act: "apologize", symbol: "…", label: "APOLOGIZE", hint: "AGAIN" },
  { act: "honest", symbol: "♥", label: "BE HONEST", hint: "STOP HIDING" },
];

function setupBattle() {
  state.scene = "battle";
  state.battle = freshBattle();
  state.busy = true;
  state.paused = false;
  state.marker = null;
  state.near = null;
  state.autoWalk = null;
  state.dialogueActive = false;
  state.choices = null;
  state.typing = null;
  document.body.classList.remove("in-battle");
  document.body.classList.remove("battle-submenu");
  ui.ending.hidden = true;
  ui.battleActions.hidden = true;
  ui.dodgeUI.hidden = true;
  ui.struggleUI.hidden = true;
  ui.touch.hidden = true;
  hideDialogue();
  showBattleHud(true);
  updateBattleHud();
  audio.setTheme("battle");
  setObjective("Face the mirror.");
  saveCheckpoint("battle");
  syncControls();
}

async function runBattleIntro() {
  const battle = state.battle;
  battle.phase = "intro";
  battle.introFade = 1;
  state.busy = true;
  syncControls();
  await wait(520);
  await dialogueLines(STORY.mirrorIntro);
  battle.introFade = 0;
  battle.phase = "menu";
  state.busy = false;
  updateBattleHud();
  renderBattleMenu();
}

/* ---------- Battle HUD / menus ---------- */

function updateBattleHud() {
  const b = state.battle;
  if (!b) return;
  const hpPct = clamp((b.hp / b.maxHp) * 100, 0, 100);
  const enemyPct = clamp((b.enemyHp / b.maxEnemyHp) * 100, 0, 100);
  ui.hpFill.style.width = `${hpPct}%`;
  ui.hpText.textContent = `${Math.max(0, Math.round(b.hp))} / ${b.maxHp}`;
  ui.enemyFill.style.width = `${enemyPct}%`;
  const marks = [0, 1, 2].map((i) => (i < b.trust ? "●" : "○")).join(" ");
  ui.battleTrust.innerHTML = `${b.trust >= 3 ? "IT IS LISTENING" : b.trust > 0 ? "IT IS LISTENING" : "IT IS WAITING"} <span>${marks}</span>`;
  ui.battleTrust.classList.toggle("is-ready", b.trust >= 3);
}

function actionMarkup(command, symbol, label, hint, extra = "") {
  return `<button type="button" class="battle-action ${extra}" data-command="${command}"><span class="act-symbol">${symbol}</span><span>${label}</span><span class="action-hint">${hint}</span></button>`;
}

function bindBattleButtons() {
  ui.battleActions.querySelectorAll("button").forEach((button) => {
    button.addEventListener("pointerdown", (event) => event.stopPropagation());
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const command = button.dataset.command;
      const act = button.dataset.act;
      if (command === "back") {
        audio.back();
        renderBattleMenu();
      } else if (command === "act-menu") {
        audio.select();
        renderActMenu();
      } else if (command === "fight") {
        runFight();
      } else if (command === "item") {
        useItem();
      } else if (command === "mercy") {
        useMercy();
      } else if (act) {
        runAct(act);
      }
    });
  });
}

function renderBattleMenu() {
  const battle = state.battle;
  if (!battle || battle.winning || battle.defeated) return;
  battle.phase = "menu";
  battle.menu = "main";
  state.busy = false;
  document.body.classList.remove("battle-submenu");
  ui.battleActions.classList.remove("is-sub");
  ui.battleActions.innerHTML = [
    actionMarkup("fight", "⚔", "FIGHT", "STRIKE"),
    actionMarkup("act-menu", "◇", "ACT", "SPEAK"),
    actionMarkup("item", "▣", "ITEM", battle.itemUses > 0 ? `COCOA ×${battle.itemUses}` : "EMPTY"),
    actionMarkup("mercy", "✧", "MERCY", battle.trust >= 3 ? "READY" : "SPARE", battle.trust >= 3 ? "is-special" : ""),
  ].join("");
  ui.battleActions.hidden = false;
  ui.dodgeUI.hidden = true;
  showBattlePrompt("What will SRIF do?");
  bindBattleButtons();
  updateBattleHud();
  syncControls();
}

function renderActMenu() {
  const battle = state.battle;
  if (!battle || battle.phase !== "menu") return;
  battle.menu = "act";
  document.body.classList.add("battle-submenu");
  ui.battleActions.classList.add("is-sub");
  ui.battleActions.innerHTML = [
    ...BATTLE_ACTS.map((entry) =>
      `<button type="button" class="battle-action ${entry.act === "honest" && battle.trust >= 2 ? "is-special" : ""}" data-act="${entry.act}"><span class="act-symbol">${entry.symbol}</span><span>${entry.label}</span><span class="action-hint">${entry.hint}</span></button>`,
    ),
    `<button type="button" class="battle-action" data-command="back"><span class="act-symbol">←</span><span>BACK</span><span class="action-hint">RETURN</span></button>`,
  ].join("");
  ui.battleActions.hidden = false;
  showBattlePrompt("What will SRIF say?");
  bindBattleButtons();
  syncControls();
}

async function battleSay(text) {
  await say({ narration: true, text });
  await wait(70);
}

async function runFight() {
  const battle = state.battle;
  if (!battle || battle.phase !== "menu") return;
  battle.phase = "resolve";
  battle.turn += 1;
  state.busy = true;
  ui.battleActions.hidden = true;
  hideDialogue();
  syncControls();
  audio.glass();
  shake(7);
  flash(0.28);
  battle.enemyHp = Math.max(0, battle.enemyHp - 11);
  updateBattleHud();
  await battleSay(STORY.battle.fight);
  await wait(300);
  battle.enemyHp = battle.maxEnemyHp;
  updateBattleHud();
  await battleSay(STORY.battle.fightBroken);
  state.busy = false;
  startDodge();
}

async function runAct(act) {
  const battle = state.battle;
  if (!battle || battle.phase !== "menu") return;
  battle.phase = "resolve";
  battle.turn += 1;
  state.busy = true;
  ui.battleActions.hidden = true;
  hideDialogue();
  syncControls();

  let text = STORY.battle[act] || STORY.battle.check;
  if (act === "honest") {
    battle.trust = Math.min(3, battle.trust + 1);
    battle.trustBurst = 1;
    battle.enemyHp = Math.max(0, Math.round(battle.maxEnemyHp * (1 - battle.trust * 0.22)));
    audio.heart();
    flash(0.35);
    text = STORY.battle.honest[battle.trust - 1] || STORY.battle.honest[2];
  } else if (act === "smile") {
    audio.deny();
  } else if (act === "apologize") {
    audio.back();
  } else {
    audio.select();
  }

  updateBattleHud();
  await battleSay(text);

  if (act === "honest" && battle.trust >= 3) {
    await wait(260);
    toast("The mirror is listening. MERCY is ready.");
    state.busy = false;
    renderBattleMenu();
    return;
  }

  state.busy = false;
  startDodge();
}

async function useItem() {
  const battle = state.battle;
  if (!battle || battle.phase !== "menu") return;
  battle.phase = "resolve";
  battle.turn += 1;
  state.busy = true;
  ui.battleActions.hidden = true;
  hideDialogue();
  syncControls();

  if (battle.itemUses > 0) {
    battle.itemUses -= 1;
    battle.hp = Math.min(battle.maxHp, battle.hp + 10);
    audio.heal();
    updateBattleHud();
    await battleSay(STORY.battle.item);
  } else {
    audio.deny();
    await battleSay(STORY.battle.itemEmpty);
  }
  state.busy = false;
  startDodge();
}

async function useMercy() {
  const battle = state.battle;
  if (!battle || battle.phase !== "menu") return;
  if (battle.trust >= 3) {
    winBattle();
    return;
  }
  battle.phase = "resolve";
  battle.turn += 1;
  state.busy = true;
  ui.battleActions.hidden = true;
  hideDialogue();
  syncControls();
  audio.back();
  await battleSay(battle.trust > 0 ? STORY.battle.mercyReady : STORY.battle.mercy);
  state.busy = false;
  startDodge();
}

/* ---------- Dodging ---------- */

function startDodge() {
  const battle = state.battle;
  if (!battle || battle.winning) return;
  const board = battleBoard(W, H);
  battle.phase = "dodge";
  battle.showBoard = true;
  battle.dodgeTime = battle.dodgeDuration;
  battle.spawnClock = 0.25;
  battle.projectiles = [];
  battle.heart = { x: board.cx, y: board.cy };
  battle.invuln = 0.5;
  battle.hurt = 0;
  battle.menuDelay = 0;
  state.busy = false;
  state.dialogueActive = false;
  state.choices = null;
  ui.dialogueLayer.hidden = true;
  ui.battleActions.hidden = true;
  ui.dodgeUI.hidden = false;
  ui.dodgeTimer.textContent = battle.dodgeDuration.toFixed(1);
  audio.glass();
  syncControls();
}

function spawnProjectile() {
  const battle = state.battle;
  const b = battleBoard(W, H);
  const heart = battle.heart;
  const roll = Math.random();
  if (roll < 0.52) {
    const fromTop = Math.random() < 0.5;
    const x = b.x + 24 + Math.random() * Math.max(10, b.w - 48);
    const y = fromTop ? b.y - 26 : b.y + b.h + 26;
    battle.projectiles.push({
      type: "tear",
      x,
      y,
      vx: (heart.x - x) * 0.11,
      vy: (fromTop ? 1 : -1) * (78 + Math.random() * 70),
      size: 6 + Math.random() * 4.5,
      rot: 0,
      spin: 1.6,
      color: Math.random() < 0.5 ? "#ef6b7c" : "#d58cff",
    });
  } else if (roll < 0.84) {
    const fromLeft = Math.random() < 0.5;
    const y = b.y + 22 + Math.random() * Math.max(10, b.h - 44);
    const x = fromLeft ? b.x - 24 : b.x + b.w + 24;
    battle.projectiles.push({
      type: "shard",
      x,
      y,
      vx: (fromLeft ? 1 : -1) * (95 + Math.random() * 65),
      vy: (heart.y - y) * 0.14,
      size: 8 + Math.random() * 7,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 5,
      color: Math.random() < 0.4 ? "#b7d9f2" : "#c9b0ff",
    });
  } else {
    battle.projectiles.push({
      type: "ring",
      x: b.x + 44 + Math.random() * Math.max(10, b.w - 88),
      y: b.y + 38 + Math.random() * Math.max(10, b.h - 76),
      vx: (Math.random() - 0.5) * 26,
      vy: (Math.random() - 0.5) * 20,
      size: 10,
      grow: 26 + Math.random() * 16,
      rot: 0,
      spin: 0,
      color: Math.random() < 0.5 ? "#c59bff" : "#ff9db0",
    });
  }
}

function hurtSoul(amount = 3) {
  const battle = state.battle;
  if (battle.invuln > 0 || battle.phase !== "dodge") return;
  battle.hp = Math.max(0, battle.hp - amount);
  battle.invuln = 0.85;
  battle.hurt = 0.4;
  battle.damageFlash = 0.85;
  audio.thud();
  shake(10);
  vibrate([25, 30, 45]);
  updateBattleHud();
  if (battle.hp <= 0) battleDefeat();
}

async function battleDefeat() {
  const battle = state.battle;
  if (!battle || battle.defeated) return;
  battle.defeated = true;
  battle.phase = "resolve";
  battle.showBoard = false;
  battle.projectiles = [];
  battle.hurt = 0;
  ui.dodgeUI.hidden = true;
  ui.touch.hidden = true;
  updateBattleHud();
  audio.deny();
  shake(16);
  await wait(420);
  await battleSay(STORY.battle.survive);
  battle.hp = battle.maxHp;
  battle.trust = Math.max(0, battle.trust - 1);
  battle.defeated = false;
  updateBattleHud();
  await wait(260);
  renderBattleMenu();
}

function endDodge() {
  const battle = state.battle;
  if (!battle || battle.phase !== "dodge") return;
  battle.phase = "resolve";
  battle.showBoard = false;
  battle.projectiles = [];
  battle.dodgeTime = 0;
  battle.menuDelay = 0.3;
  ui.dodgeUI.hidden = true;
  syncControls();
}

function updateDodge(dt) {
  const battle = state.battle;
  if (!battle || battle.phase !== "dodge") return;
  const b = battleBoard(W, H);
  const move = readMoveVector();

  battle.dodgeTime = Math.max(0, battle.dodgeTime - dt);
  battle.invuln = Math.max(0, battle.invuln - dt);
  battle.hurt = Math.max(0, battle.hurt - dt);
  ui.dodgeTimer.textContent = Math.ceil(battle.dodgeTime * 10) / 10;

  battle.heart.x = clamp(battle.heart.x + move.x * 250 * dt, b.x + 13, b.x + b.w - 13);
  battle.heart.y = clamp(battle.heart.y + move.y * 250 * dt, b.y + 13, b.y + b.h - 13);

  battle.spawnClock -= dt;
  if (battle.spawnClock <= 0) {
    spawnProjectile();
    battle.spawnClock = 0.46 + Math.random() * 0.32;
  }

  const keep = [];
  for (const p of battle.projectiles) {
    p.x += (p.vx || 0) * dt;
    p.y += (p.vy || 0) * dt;
    p.rot = (p.rot || 0) + (p.spin || 0) * dt;
    if (p.grow) p.size += p.grow * dt;

    const dx = p.x - battle.heart.x;
    const dy = p.y - battle.heart.y;
    const dist = Math.hypot(dx, dy);
    let hit = false;
    if (p.type === "ring") {
      hit = Math.abs(dist - p.size) < 9.5;
    } else {
      hit = dist < p.size * 0.78 + 5.4;
    }
    if (hit && battle.invuln <= 0) {
      hurtSoul(3);
      p.alpha = 0;
    } else {
      keep.push(p);
    }
  }
  battle.projectiles = keep.filter((p) => {
    const margin = 90;
    return p.x > b.x - margin && p.x < b.x + b.w + margin && p.y > b.y - margin && p.y < b.y + b.h + margin;
  });

  if (battle.dodgeTime <= 0) endDodge();
}

async function winBattle() {
  const battle = state.battle;
  if (!battle || battle.winning) return;
  battle.winning = true;
  battle.phase = "victory";
  battle.showBoard = false;
  battle.projectiles = [];
  state.busy = true;
  ui.battleActions.hidden = true;
  ui.dodgeUI.hidden = true;
  ui.touch.hidden = true;
  hideDialogue();
  syncControls();
  updateBattleHud();
  audio.shatter();
  shake(19);
  flash(0.9);
  vibrate([40, 55, 120]);
  await wait(2350);
  battle.victory = 1;
  await say(STORY.victory[0]);
  await say(STORY.victory[1]);
  await wait(320);
  await fadeOut(720);
  setupBathroomAfter();
  await fadeIn(720);
  await dialogueLines(STORY.victory.slice(2));
  await wait(420);
  showEnding();
}

function setupBathroomAfter() {
  state.scene = "bathroom";
  state.bath = freshBath();
  state.bath.mode = "after";
  state.bath.after = true;
  state.bath.playerX = 0.43;
  state.bath.michX = 0.6;
  state.bath.ominous = false;
  state.marker = null;
  state.busy = true;
  hideDialogue();
  showBattleHud(false);
  showHud(false);
  ui.battleStats.hidden = true;
  ui.battleActions.hidden = true;
  ui.dodgeUI.hidden = true;
  ui.touch.hidden = true;
  audio.setTheme("bathroom");
  syncControls();
}

function showEnding() {
  state.scene = "ending";
  state.ending = true;
  state.title = false;
  state.busy = false;
  state.paused = false;
  state.dialogueActive = false;
  state.choices = null;
  state.typing = null;
  hideDialogue();
  showHud(false);
  showBattleHud(false);
  document.body.classList.remove("battle-submenu");
  ui.battleActions.hidden = true;
  ui.dodgeUI.hidden = true;
  ui.struggleUI.hidden = true;
  ui.touch.hidden = true;
  ui.chapter.hidden = true;
  ui.ending.hidden = false;
  ui.fade.classList.remove("is-on");
  saveCheckpoint("ending");
  audio.setTheme("ending");
  syncControls();
}

/* ---------- Update helpers ---------- */

function updateBathAnimation(dt) {
  const bath = state.bath;
  if (!bath) return;
  const ease = Math.min(1, dt * 5.5);
  bath.pin += ((bath.pinTarget ?? 0) - bath.pin) * ease;
  bath.recognize += ((bath.recognizeTarget ?? 0) - bath.recognize) * ease;
  bath.spray += ((bath.sprayTarget ?? 0) - bath.spray) * Math.min(1, dt * 7);
  bath.zoom += ((bath.zoomTarget ?? 1) - bath.zoom) * Math.min(1, dt * 3.4);
  if (bath.shake > 0.05) {
    bath.shake *= Math.pow(0.025, dt);
  } else {
    bath.shake = 0;
  }
}

function updateBattle(dt) {
  const battle = state.battle;
  if (!battle) return;
  battle.introFade = Math.max(0, battle.introFade - dt * 0.85);
  battle.damageFlash = Math.max(0, battle.damageFlash - dt * 2.6);
  battle.trustBurst = Math.max(0, battle.trustBurst - dt * 1.3);
  battle.invuln = Math.max(0, battle.invuln - dt);
  battle.hurt = Math.max(0, battle.hurt - dt);

  if (battle.phase === "dodge") {
    updateDodge(dt);
  } else if (battle.phase === "victory") {
    battle.victory = Math.min(1, battle.victory + dt / 2.4);
    updateBattleHud();
  } else if (battle.menuDelay > 0) {
    battle.menuDelay = Math.max(0, battle.menuDelay - dt);
    if (battle.menuDelay === 0 && !battle.winning && !battle.defeated) renderBattleMenu();
  }
}

// === PART 3 ===

/* ---------- Movement ---------- */

function readMoveVector() {
  let x = 0;
  let y = 0;
  if (state.keys.has("a") || state.keys.has("arrowleft")) x -= 1;
  if (state.keys.has("d") || state.keys.has("arrowright")) x += 1;
  if (state.keys.has("w") || state.keys.has("arrowup")) y -= 1;
  if (state.keys.has("s") || state.keys.has("arrowdown")) y += 1;

  if (state.joystick.active) {
    x += state.joystick.x;
    y += state.joystick.y;
  }
  if (state.tilt.active) {
    x += state.tilt.x;
    y += state.tilt.y;
  }

  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  if (Math.abs(x) < 0.14) x = 0;
  if (Math.abs(y) < 0.14) y = 0;
  return { x, y };
}

function viewWidth() {
  return W / layout(W, H).S;
}

function updateStreet(dt) {
  const p = state.player;
  const blocked = state.busy || state.dialogueActive || state.choices || state.paused;
  const move = blocked ? { x: 0, y: 0 } : readMoveVector();
  let walking = false;

  if (!blocked && state.autoWalk && typeof state.autoWalk.x === "number") {
    const diff = state.autoWalk.x - p.x;
    if (Math.abs(diff) < 5) {
      state.autoWalk = null;
      if (state.pendingInteract) {
        const pending = state.pendingInteract;
        state.pendingInteract = null;
        if (pending === "asgore") talkAsgore();
        else if (pending === "toriel") talkToriel();
        else if (pending === "diner") enterDiner();
      }
    } else {
      p.x += Math.sign(diff) * Math.min(Math.abs(diff), 225 * dt);
      p.facing = Math.sign(diff) || p.facing;
      walking = true;
    }
  } else if (!blocked && move.x !== 0) {
    p.x += move.x * 225 * dt;
    p.facing = Math.sign(move.x) || p.facing;
    walking = true;
  }

  p.x = clamp(p.x, 150, WORLD_WIDTH - 150);
  p.walking = walking;
  if (walking) {
    p.phase += dt * 9.4;
    state.stepClock += dt;
    if (state.stepClock > 0.22) {
      state.stepClock = 0;
      audio.step();
      state.footprints.push({ x: p.x, side: Math.random() < 0.5 ? -1 : 1, alpha: 0.9 });
      if (state.footprints.length > 90) state.footprints.shift();
    }
  } else {
    state.stepClock = 0;
  }

  state.footprints.forEach((f) => (f.alpha -= dt * 0.045));
  state.footprints = state.footprints.filter((f) => f.alpha > 0);

  // Camera follow.
  const vw = viewWidth();
  const targetCam = clamp(p.x - vw * 0.46, 0, Math.max(0, WORLD_WIDTH - vw));
  state.camera += (targetCam - state.camera) * Math.min(1, dt * 5.5);

  // Chris jogs off toward the diner after the reunion.
  const chris = state.npcs.chris;
  if (chris.leaving && chris.visible) {
    chris.x += 165 * dt;
    if (chris.x > DINER_DOOR - 40) {
      chris.visible = false;
      chris.leaving = false;
    }
  }

  // The reunion triggers itself when Srif gets close.
  if (
    !state.flags.chrisMet &&
    !state.busy &&
    !state.dialogueActive &&
    chris.visible &&
    Math.abs(p.x - CHRIS_X) < 96
  ) {
    runReunion();
  }

  // Nearby interactions.
  let near = null;
  const candidates = [];
  if (state.npcs.asgore.visible) candidates.push({ id: "asgore", x: state.npcs.asgore.x, range: 78 });
  if (state.npcs.toriel.visible) candidates.push({ id: "toriel", x: state.npcs.toriel.x, range: 78 });
  if (chris.visible && state.flags.chrisMet) candidates.push({ id: "chris", x: chris.x, range: 76 });
  candidates.push({ id: "diner", x: DINER_DOOR, range: 86 });

  let best = Infinity;
  for (const c of candidates) {
    const dist = Math.abs(p.x - c.x);
    if (dist < c.range && dist < best) {
      best = dist;
      near = c.id;
    }
  }
  if (near === "chris") near = null;

  if (near !== state.near) {
    state.near = near;
    syncControls();
  }
}

function updateBathScene(dt) {
  const bath = state.bath;
  if (!bath || bath.mode !== "normal" || bath.after) return;
  const blocked = state.busy || state.dialogueActive || state.choices || state.paused;
  if (blocked) return;

  let dir = 0;
  if (state.autoWalk && typeof state.autoWalk.bathX === "number") {
    const diff = state.autoWalk.bathX - bath.playerX;
    if (Math.abs(diff) < 0.006) {
      state.autoWalk = null;
    } else {
      dir = Math.sign(diff) * Math.min(1, Math.abs(diff) / 0.05);
    }
  } else {
    const move = readMoveVector();
    dir = move.x;
  }

  if (dir !== 0) {
    bath.playerX = clamp(bath.playerX + dir * 0.18 * dt, 0.12, 0.88);
    bath.mood = "neutral";
  }

  const washable = Math.abs(bath.playerX - 0.35) < 0.075;
  if (washable !== state.bathNear) {
    state.bathNear = washable;
    syncControls();
  }
}

/* ---------- Pause, restart, title ---------- */

function openPause(fromTitle = false) {
  if (!ui.modal.hidden) return;
  if (!fromTitle && (state.scene === "title" || state.scene === "ending")) return;
  state.paused = true;
  state.modalTitle = !!fromTitle;
  ui.pauseTitle.textContent = fromTitle ? "HOW TO PLAY" : "PAUSED";
  ui.pauseSub.textContent = fromTitle
    ? "Touch, tilt, or keyboard. All three work."
    : state.scene === "battle"
      ? "The mirror will wait."
      : "The snow will wait.";
  ui.btnResume.textContent = fromTitle ? "BACK" : "RESUME";
  if (ui.modalDanger) ui.modalDanger.hidden = fromTitle;
  if (ui.modalNote) ui.modalNote.hidden = fromTitle;
  ui.modal.hidden = false;
  updateSoundButton();
  updateTiltUI();
  syncControls();
}

function closePause() {
  if (ui.modal.hidden) return;
  ui.modal.hidden = true;
  state.paused = false;
  state.modalTitle = false;
  ui.btnResume.textContent = "RESUME";
  if (ui.modalDanger) ui.modalDanger.hidden = false;
  if (ui.modalNote) ui.modalNote.hidden = false;
  syncControls();
}

async function restartChapter() {
  if (state.starting) return;
  state.starting = true;
  ui.modal.hidden = true;
  state.paused = false;
  state.modalTitle = false;
  ui.ending.hidden = true;
  ui.title.hidden = true;
  await fadeOut(340);
  resetRun();
  setupStreet();
  await fadeIn(340);
  await ensureAudio("street");
  state.busy = true;
  syncControls();
  showChapterCard("CHAPTER I", "HOME", "OPPIDAN · 6:42 PM");
  saveCheckpoint("street-intro");
  await dialogueLines(STORY.intro);
  state.flags.introDone = true;
  state.busy = false;
  setObjective("Find Chris by the plaza.");
  updateMarker();
  syncControls();
  saveCheckpoint("street-free");
  state.starting = false;
}

async function backToTitle() {
  if (state.starting) return;
  state.starting = true;
  ui.modal.hidden = true;
  state.paused = false;
  state.modalTitle = false;
  await fadeOut(340);
  resetRun();
  ui.ending.hidden = true;
  ui.title.hidden = false;
  showTitle();
  await fadeIn(340);
  state.starting = false;
}

/* ---------- Tilt ---------- */

function updateTiltUI() {
  ui.tiltStatus.textContent = state.tilt.active ? "ON" : "OFF";
  ui.tiltPill.hidden = !state.tilt.active;
  ui.tiltPill.textContent = state.tilt.active ? "◒ TILT" : "";
}

function handleTilt(event) {
  if (!state.tilt.active || event.beta == null) return;
  if (!state.tilt.base) {
    state.tilt.base = { beta: event.beta, gamma: event.gamma || 0 };
  }
  const rawX = ((event.gamma || 0) - state.tilt.base.gamma) / 23;
  const rawY = (event.beta - state.tilt.base.beta) / 23;
  state.tilt.x = Math.abs(rawX) < 0.14 ? 0 : clamp(rawX, -1, 1);
  state.tilt.y = Math.abs(rawY) < 0.14 ? 0 : clamp(rawY, -1, 1);
}

async function enableTilt() {
  if (!window.DeviceOrientationEvent) {
    toast("This device doesn't report tilt.");
    return;
  }
  try {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== "granted") {
        toast("Motion access was declined.");
        updateTiltUI();
        return;
      }
    }
    window.addEventListener("deviceorientation", handleTilt, true);
    state.tilt.active = true;
    state.tilt.base = null;
    state.tilt.x = 0;
    state.tilt.y = 0;
    updateTiltUI();
    toast("Tilt enabled. Move your device to walk.");
    audio.confirm();
  } catch (_) {
    toast("Motion access isn't available here.");
  }
}

function disableTilt() {
  window.removeEventListener("deviceorientation", handleTilt, true);
  state.tilt.active = false;
  state.tilt.x = 0;
  state.tilt.y = 0;
  state.tilt.base = null;
  updateTiltUI();
  toast("Tilt disabled.");
}

async function toggleTilt() {
  if (state.tilt.active) disableTilt();
  else await enableTilt();
}

/* ---------- Sound ---------- */

async function toggleSound() {
  await ensureAudio();
  audio.toggleMute();
  updateSoundButton();
  if (!audio.muted) audio.confirm();
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch (_) {
    toast("Fullscreen isn't available on this browser.");
  }
}

/* ---------- Pointer input ---------- */

function resetJoystick() {
  state.joystick.x = 0;
  state.joystick.y = 0;
  state.joystick.active = false;
  ui.joystickKnob.style.transform = "";
}

let joystickPointer = null;

function moveJoystick(event) {
  const rect = ui.joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const max = rect.width * 0.31;
  let dx = event.clientX - cx;
  let dy = event.clientY - cy;
  const dist = Math.hypot(dx, dy);
  if (dist > max) {
    dx = (dx / dist) * max;
    dy = (dy / dist) * max;
  }
  state.joystick.x = clamp(dx / max, -1, 1);
  state.joystick.y = clamp(dy / max, -1, 1);
  state.joystick.active = true;
  ui.joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
}

function onJoystickDown(event) {
  event.preventDefault();
  event.stopPropagation();
  joystickPointer = event.pointerId;
  try {
    ui.joystick.setPointerCapture(event.pointerId);
  } catch (_) {}
  moveJoystick(event);
  audio.select();
}

function onJoystickMove(event) {
  if (joystickPointer !== event.pointerId) return;
  event.preventDefault();
  moveJoystick(event);
}

function onJoystickUp(event) {
  if (joystickPointer !== event.pointerId) return;
  joystickPointer = null;
  resetJoystick();
}

function canvasTap(event) {
  if (state.dialogueActive) {
    advanceDialogue();
    return;
  }
  if (state.paused || state.busy || state.choices || state.interactCooldown > 0) return;
  if (state.scene === "street") {
    const rect = ui.canvas.getBoundingClientRect();
    const S = layout(W, H).S;
    const worldX = clamp(state.camera + (event.clientX - rect.left) / S, 150, WORLD_WIDTH - 150);
    const hits = [
      { id: "asgore", x: state.npcs.asgore.x, threshold: 82 },
      { id: "toriel", x: state.npcs.toriel.x, threshold: 82 },
      { id: "chris", x: CHRIS_X, threshold: 86 },
      { id: "diner", x: DINER_DOOR, threshold: 90 },
    ];
    let hit = null;
    let best = Infinity;
    for (const h of hits) {
      if (h.id === "chris" && (!state.npcs.chris.visible || state.flags.chrisMet)) continue;
      const distance = Math.abs(worldX - h.x);
      if (distance < h.threshold && distance < best) {
        best = distance;
        hit = h;
      }
    }
    if (hit) {
      const stand = hit.id === "diner" ? DINER_DOOR : hit.x - 46;
      state.autoWalk = { x: clamp(stand, 150, WORLD_WIDTH - 150) };
      state.pendingInteract = hit.id === "chris" ? null : hit.id;
    } else {
      state.pendingInteract = null;
      state.autoWalk = { x: worldX };
    }
    state.player.facing = Math.sign(worldX - state.player.x) || state.player.facing;
  } else if (state.scene === "bathroom" && state.bath.mode === "normal") {
    const rect = ui.canvas.getBoundingClientRect();
    const normX = clamp((event.clientX - rect.left) / rect.width, 0.12, 0.88);
    state.autoWalk = { bathX: normX };
  }
}

/* ---------- Keyboard input ---------- */

function selectBattleByIndex(index) {
  if (state.scene !== "battle") return;
  const buttons = ui.battleActions.querySelectorAll("button");
  const button = buttons[index];
  if (button) button.click();
}

function onKeyDown(event) {
  const key = event.key;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(key)) event.preventDefault();

  if (key === "Escape") {
    if (!ui.modal.hidden) closePause();
    else openPause();
    return;
  }
  if (!ui.modal.hidden || state.paused) return;

  state.keys.add(key.toLowerCase());

  if (state.struggle) {
    if (key === " " || key === "Enter" || key.toLowerCase() === "e") {
      if (!event.repeat) tapStruggle();
      event.preventDefault();
    }
    return;
  }

  if (key === " " || key === "Enter") {
    if (state.dialogueActive) {
      advanceDialogue();
      return;
    }
    if (state.scene === "street" || state.scene === "bathroom") {
      interact();
      return;
    }
  }

  if (key === "e" || key === "E") {
    if (state.dialogueActive) advanceDialogue();
    else interact();
    return;
  }

  if (/^[1-5]$/.test(key)) {
    const n = Number(key) - 1;
    if (state.choices) {
      chooseIndex(n);
      return;
    }
    if (state.scene === "battle" && (state.battle.phase === "menu" || state.battle.phase === "resolve")) {
      selectBattleByIndex(n);
    }
  }
}

function onKeyUp(event) {
  state.keys.delete(event.key.toLowerCase());
}

/* ---------- Render ---------- */

function resize() {
  W = Math.max(320, window.innerWidth);
  H = Math.max(320, window.innerHeight);
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  ui.canvas.width = Math.round(W * dpr);
  ui.canvas.height = Math.round(H * dpr);
  ui.canvas.style.width = `${W}px`;
  ui.canvas.style.height = `${H}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function update(dt) {
  state.time += dt;
  updateTyping(dt);
  updateBathAnimation(dt);
  if (state.interactCooldown > 0) state.interactCooldown = Math.max(0, state.interactCooldown - dt);

  if (state.shake > 0.25) {
    state.shake *= Math.pow(0.02, dt);
  } else {
    state.shake = 0;
  }
  if (state.flash > 0.004) {
    state.flash = Math.max(0, state.flash - dt * 2.8);
  } else {
    state.flash = 0;
  }

  if (state.scene === "street") updateStreet(dt);
  else if (state.scene === "bathroom") updateBathScene(dt);
  else if (state.scene === "battle") updateBattle(dt);
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (state.shake > 0.25 && !reducedMotion()) {
    const sx = (Math.random() - 0.5) * state.shake;
    const sy = (Math.random() - 0.5) * state.shake;
    ui.canvas.style.transform = `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) scale(1.02)`;
  } else if (ui.canvas.style.transform) {
    ui.canvas.style.transform = "";
  }

  drawScene(ctx, W, H, state.time, state);

  if (state.flash > 0.004) {
    ctx.save();
    ctx.globalAlpha = state.flash;
    ctx.fillStyle = "#fff7ec";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

let lastFrame = performance.now();

function loop(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  if (!state.paused) update(dt);
  render();
  requestAnimationFrame(loop);
}

/* ---------- Bindings and boot ---------- */

function bindEvents() {
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 120));

  ui.btnStart.addEventListener("click", startNewGame);
  ui.btnContinue.addEventListener("click", continueGame);
  ui.btnControls.addEventListener("click", () => openPause(true));
  ui.btnResume.addEventListener("click", closePause);
  ui.modal.querySelectorAll("[data-close-modal]").forEach((el) => el.addEventListener("click", closePause));
  ui.btnTilt.addEventListener("click", toggleTilt);
  ui.btnSoundToggle.addEventListener("click", toggleSound);
  ui.btnFullscreen.addEventListener("click", toggleFullscreen);
  ui.btnRestart.addEventListener("click", restartChapter);
  ui.btnQuit.addEventListener("click", backToTitle);
  ui.btnAgain.addEventListener("click", restartChapter);
  ui.btnEndingTitle.addEventListener("click", backToTitle);
  ui.btnPause.addEventListener("click", () => openPause());
  ui.btnSound.addEventListener("click", toggleSound);
  ui.btnInteract.addEventListener("click", interact);
  ui.btnStruggle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    tapStruggle();
  });

  ui.dialogueBox.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".choice-button")) return;
    if (state.choices) return;
    advanceDialogue();
  });

  ui.canvas.addEventListener("pointerdown", canvasTap);

  ui.joystick.addEventListener("pointerdown", onJoystickDown);
  ui.joystick.addEventListener("pointermove", onJoystickMove);
  ui.joystick.addEventListener("pointerup", onJoystickUp);
  ui.joystick.addEventListener("pointercancel", onJoystickUp);
  ui.joystick.addEventListener("lostpointercapture", () => {
    joystickPointer = null;
    resetJoystick();
  });

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", () => {
    state.keys.clear();
    resetJoystick();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      state.keys.clear();
      resetJoystick();
    }
  });
  ui.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
}

function boot() {
  resize();
  bindEvents();
  showTitle();
  updateContinueButton();
  updateSoundButton();
  updateTiltUI();
  audio.setTheme("title");
  lastFrame = performance.now();
  requestAnimationFrame(loop);
  window.__oppidan = state;
}

boot();


