// main.js — boot the town, run the loop, keep the snow falling.
import { Input } from './input.js';
import { Sound } from './sound.js';
import { Dialogue } from './dialogue.js';
import { World } from './world.js';
import { Battle } from './battle.js';
import { UI } from './ui.js';
import { Story } from './story.js';
import {
  drawTitleScene, drawEndingScene, createSnow, updateSnow,
} from './artscene.js';

const W = 480;
const H = 270;
const SAVE_KEY = 'oppidan.save.v1';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const g = {
  mode: 'title',
  paused: false,
  cutscene: false,
  reduceMotion: false,
  debug: false,
  flags: {},
  stats: { acts: 0, dodges: 0, time: 0 },
  checkpoint: 0,
};

g.wait = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

g.loadCheckpoint = () => {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!data || !data.checkpoint) return null;
    return data;
  } catch {
    return null;
  }
};

/* -------------------------------------------------------------------- */
/* systems                                                              */
/* -------------------------------------------------------------------- */

g.input = new Input(canvas);
g.sound = new Sound();
g.dialogue = new Dialogue(g);
g.world = new World(g);
g.battle = new Battle(g);
g.story = new Story(g);
g.script = g.story;
g.ui = new UI(g);

g.newGame = () => g.story.newGame();
g.continueGame = () => g.story.continueGame(g.loadCheckpoint());

// handy for debugging in the console
window.oppidan = g;

/* -------------------------------------------------------------------- */
/* title / scene flakes                                                 */
/* -------------------------------------------------------------------- */

const titleSnow = createSnow(120);
const endingSnow = createSnow(90);
let sceneTime = 0;
let debugTimer = 0;

/* -------------------------------------------------------------------- */
/* update                                                               */
/* -------------------------------------------------------------------- */

function update(dt) {
  g.input.update(dt);
  sceneTime += dt;

  if (g.mode === 'title') {
    updateSnow(titleSnow, dt, W, H, 7);
    g.ui.update(dt);
    return;
  }

  if (g.mode === 'world') {
    if (g.input.consume('pause')) {
      if (g.paused) g.ui.togglePause(false);
      else if (!g.cutscene && !g.dialogue.active) g.ui.togglePause(true);
    }
    if (g.paused) return;
    g.dialogue.update(dt);
    g.world.update(dt);
    g.stats.time += dt;
    return;
  }

  if (g.mode === 'battle') {
    if (g.paused) return;
    g.battle.update(dt);
    g.stats.time += dt;
    return;
  }

  if (g.mode === 'ending') {
    updateSnow(endingSnow, dt, W, H, 3);
    if (g.dialogue.active) g.dialogue.update(dt);
  }
}

/* -------------------------------------------------------------------- */
/* render                                                               */
/* -------------------------------------------------------------------- */

function render() {
  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = false;

  if (g.mode === 'title') {
    drawTitleScene(ctx, sceneTime, titleSnow);
  } else if (g.mode === 'world') {
    g.world.render(ctx);
  } else if (g.mode === 'battle') {
    g.battle.render(ctx);
  } else if (g.mode === 'ending') {
    drawEndingScene(ctx, sceneTime, endingSnow);
  } else {
    ctx.fillStyle = '#05060d';
    ctx.fillRect(0, 0, W, H);
  }

  if (g.debug) {
    const dbg = document.getElementById('debug');
    dbg.classList.remove('hidden');
    const p = g.world?.player || { x: 0, y: 0 };
    dbg.textContent =
      `mode ${g.mode}  map ${g.world?.mapId || '-'}  cut ${g.cutscene ? 1 : 0}  pause ${g.paused ? 1 : 0}\n` +
      `pos ${Math.round(p.x)},${Math.round(p.y)}  checkpoint ${g.checkpoint}  save ${g.ui?.hasSave ? 'yes' : 'no'}\n` +
      `flags ${JSON.stringify(g.flags)}`;
  }
}

/* -------------------------------------------------------------------- */
/* loop                                                                 */
/* -------------------------------------------------------------------- */

let last = performance.now();
let debugAcc = 0;

function frame(now) {
  const raw = (now - last) / 1000;
  const dt = Math.min(0.05, Number.isFinite(raw) ? raw : 0);
  last = now;

  update(dt);
  render();

  // keep the debug readout cheap
  if (g.debug) {
    debugAcc += dt;
    if (debugAcc > 0.25) {
      debugAcc = 0;
      const dbg = document.getElementById('debug');
      if (dbg && g.world?.map) {
        const p = g.world.player;
        dbg.textContent =
          `mode ${g.mode}  map ${g.world.mapId}  cut ${g.cutscene ? 1 : 0}  pause ${g.paused ? 1 : 0}\n` +
          `pos ${Math.round(p.x)},${Math.round(p.y)}  checkpoint ${g.checkpoint}\n` +
          `objective ${document.getElementById('objective-text').textContent}\n` +
          `flags ${JSON.stringify(g.flags)}`;
      }
    }
  }

  g.input.endFrame();
  requestAnimationFrame(frame);
}

/* -------------------------------------------------------------------- */
/* first gesture / boot                                                 */
/* -------------------------------------------------------------------- */

g.input.onFirstGesture(() => {
  g.sound.init();
  if (g.mode === 'title') g.sound.playTrack('snow');
});

g.sound.playTrack('snow');
g.sound.ambience(0.35);
g.ui.showTitle(g.loadCheckpoint());
g.ui.setChapter('CHAPTER 0');

/* -------------------------------------------------------------------- */
/* debug entry points (?cp=3 / ?scene=battle / ?debug=1)                */
/* -------------------------------------------------------------------- */

const params = new URLSearchParams(window.location.search);
g.debug = params.get('debug') === '1';
const cpParam = Number.parseInt(params.get('cp') || '', 10);
const sceneParam = params.get('scene');

if (Number.isFinite(cpParam) && cpParam >= 1) {
  setTimeout(() => { g.story.debugCheckpoint(Math.min(5, cpParam)); }, 320);
} else if (sceneParam) {
  setTimeout(() => { g.story.debugScene(sceneParam); }, 320);
}

requestAnimationFrame(frame);
