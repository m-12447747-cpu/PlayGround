// ui.js — menus, settings, toasts, pause, title & end cards.
const SAVE_KEY = 'oppidan.save.v1';
const SETTINGS_KEY = 'oppidan.settings.v1';

export class UI {
  constructor(g) {
    this.g = g;
    this.title = document.getElementById('title-screen');
    this.pause = document.getElementById('pause-screen');
    this.settings = document.getElementById('settings-screen');
    this.credits = document.getElementById('credits-screen');
    this.rotate = document.getElementById('rotate-screen');
    this.endCard = document.getElementById('end-card');
    this.gameover = document.getElementById('gameover-screen');
    this.hud = document.getElementById('hud');
    this.toastEl = document.getElementById('toast');
    this.locEl = document.getElementById('location-card');
    this.locName = document.getElementById('location-name');
    this.locSub = document.getElementById('location-sub');
    this.objEl = document.getElementById('objective-text');
    this.chapterEl = document.getElementById('chapter-label');
    this.continueBtn = document.getElementById('continue-btn');
    this.motionBtn = document.getElementById('motion-btn');
    this.calibrateBtn = document.getElementById('calibrate-btn');
    this.motionStatus = document.getElementById('motion-status');
    this.settingsReturn = 'title';
    this.toastTimer = null;
    this.locTimer = null;
    this.titleActive = true;
    this.titleIndex = 0;
    this.gameoverVisible = false;
    this.settingsOpen = false;
    this.paused = false;
    this.hasSave = false;
    this.save = null;
    this.settingsData = this.loadSettings();
    this._bind();
    this.applySettings();
    this._bindRotate();
  }

  loadSettings() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch {}
    return {
      music: s.music ?? 55,
      sfx: s.sfx ?? 70,
      invert: !!s.invert,
      reduce: !!s.reduce,
      touch: s.touch || 'auto',
      motion: !!s.motion,
    };
  }

  saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settingsData)); } catch {}
  }

  applySettings() {
    const s = this.settingsData;
    this.g.sound.setMusicVolume(s.music / 100);
    this.g.sound.setSfxVolume(s.sfx / 100);
    this.g.input.setTouchMode(s.touch);
    this.g.input.setInvert(s.invert);
    if (s.motion && !this.g.input.tilt.enabled) {
      // enabling motion still requires a user gesture; the button asks.
    }
    this.g.reduceMotion = s.reduce;
    document.getElementById('music-volume').value = s.music;
    document.getElementById('music-volume-out').textContent = s.music;
    document.getElementById('sfx-volume').value = s.sfx;
    document.getElementById('sfx-volume-out').textContent = s.sfx;
    document.getElementById('invert-tilt').checked = s.invert;
    document.getElementById('reduce-motion').checked = s.reduce;
    document.getElementById('touch-mode').value = s.touch;
    this.updateMotionStatus();
  }

  _bind() {
    for (const btn of this.title.querySelectorAll('[data-action]')) {
      btn.addEventListener('click', () => {
        const a = btn.dataset.action;
        if (a === 'continue') this.g.continueGame();
        else if (a === 'new') this.g.newGame();
        else if (a === 'settings') this.openSettings('title');
        else if (a === 'credits') this.showCredits();
      });
    }
    document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
    for (const btn of this.pause.querySelectorAll('[data-pause]')) {
      btn.addEventListener('click', () => {
        const a = btn.dataset.pause;
        if (a === 'resume') this.togglePause(false);
        else if (a === 'settings') { this.pause.classList.add('hidden'); this.settingsOpen = true; this.openSettings('pause'); }
        else if (a === 'title') this.returnToTitle();
      });
    }
    document.getElementById('settings-back').addEventListener('click', () => this.closeSettings());
    document.getElementById('credits-back').addEventListener('click', () => {
      this.credits.classList.add('hidden');
      if (!this.titleActive) this.pause.classList.remove('hidden');
      else this.title.classList.remove('hidden');
    });

    const music = document.getElementById('music-volume');
    music.addEventListener('input', () => {
      this.settingsData.music = +music.value;
      document.getElementById('music-volume-out').textContent = music.value;
      this.g.sound.setMusicVolume(+music.value / 100);
      this.saveSettings();
    });
    music.addEventListener('change', () => this.g.sound.sfx('hover'));
    const sfx = document.getElementById('sfx-volume');
    sfx.addEventListener('input', () => {
      this.settingsData.sfx = +sfx.value;
      document.getElementById('sfx-volume-out').textContent = sfx.value;
      this.g.sound.setSfxVolume(+sfx.value / 100);
      this.saveSettings();
    });
    sfx.addEventListener('change', () => this.g.sound.sfx('confirm'));
    document.getElementById('invert-tilt').addEventListener('change', (e) => {
      this.settingsData.invert = e.target.checked;
      this.g.input.setInvert(e.target.checked);
      this.saveSettings();
      this.g.sound.sfx('confirm');
    });
    document.getElementById('reduce-motion').addEventListener('change', (e) => {
      this.settingsData.reduce = e.target.checked;
      this.g.reduceMotion = e.target.checked;
      this.saveSettings();
      this.g.sound.sfx('confirm');
    });
    document.getElementById('touch-mode').addEventListener('change', (e) => {
      this.settingsData.touch = e.target.value;
      this.g.input.setTouchMode(e.target.value);
      if (this.g.mode === 'world' || this.g.mode === 'battle') this.g.input.setTouchVisibleForScene(true);
      this.saveSettings();
      this.g.sound.sfx('confirm');
    });
    document.getElementById('fullscreen-btn').addEventListener('click', async () => {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      } catch { this.toast('fullscreen is shy on this device', 'save'); }
    });
    this.motionBtn.addEventListener('click', async () => {
      const input = this.g.input;
      if (input.tilt.enabled) {
        input.disableTilt();
        this.settingsData.motion = false;
        this.saveSettings();
        this.updateMotionStatus();
        this.toast('tilt controls off');
        return;
      }
      this.motionBtn.disabled = true;
      const result = await input.enableTilt();
      this.motionBtn.disabled = false;
      if (result === 'on') {
        this.settingsData.motion = true;
        this.saveSettings();
        this.toast('tilt on — hold steady to calibrate');
        this.g.sound.sfx('save');
      } else if (result === 'denied') {
        this.toast('motion permission denied — you can enable it in browser settings', 'save');
      } else if (result === 'unsupported') {
        this.toast('this device has no motion sensor');
      }
      this.updateMotionStatus();
    });
    this.calibrateBtn.addEventListener('click', () => {
      if (!this.g.input.tilt.enabled) { this.toast('turn tilt on first'); return; }
      this.g.input.calibrateTilt();
      this.toast('tilt recalibrated');
      this.g.sound.sfx('confirm');
    });

    document.getElementById('portrait-continue').addEventListener('click', () => {
      this.rotate.classList.add('hidden');
      this.rotateDismissed = true;
    });
    document.getElementById('retry-btn').addEventListener('click', () => {
      this.hideGameover();
      if (this.g.battle) this.g.battle.retry();
    });
    document.getElementById('end-title-btn').addEventListener('click', () => {
      this.endCard.classList.add('hidden');
      this.returnToTitle();
    });
    document.getElementById('end-replay-btn').addEventListener('click', () => {
      this.endCard.classList.add('hidden');
      this.g.newGame();
    });
    window.addEventListener('resize', () => this._bindRotate());
    window.addEventListener('orientationchange', () => this._bindRotate());
  }

  _bindRotate() {
    const coarse = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    const portrait = window.innerHeight > window.innerWidth;
    if (coarse && portrait && !this.rotateDismissed && this.titleActive) {
      this.rotate.classList.remove('hidden');
    } else {
      this.rotate.classList.add('hidden');
    }
  }

  updateMotionStatus() {
    const t = this.g.input.tilt;
    let label = 'motion: off';
    if (t.enabled) {
      if (t.status === 'on') label = t.hasSensor ? 'motion: on' : 'motion: waiting for sensor';
      else if (t.status === 'calibrating') label = 'motion: calibrating…';
      else if (t.status === 'denied') label = 'motion: permission denied';
      else if (t.status === 'nosensor') label = 'motion: no sensor data';
      else label = 'motion: on';
    } else if (t.status === 'denied') label = 'motion: permission denied';
    else if (t.status === 'unsupported') label = 'motion: unsupported';
    this.motionStatus.textContent = label;
    this.motionBtn.textContent = t.enabled ? 'DISABLE' : 'ENABLE';
    this.calibrateBtn.disabled = !t.enabled;
  }

  showTitle(save) {
    this.hasSave = !!save;
    this.save = save || null;
    this.titleActive = true;
    this.title.classList.remove('hidden', 'leaving');
    this.continueBtn.disabled = !save;
    this.continueBtn.textContent = save ? 'CONTINUE' : 'CONTINUE';
    this.hud.classList.add('hidden');
    this.g.input.setTouchVisibleForScene(false);
    this._bindRotate();
    this.setTitleSelection(0);
  }

  setTitleSelection(i) {
    const btns = [...this.title.querySelectorAll('[data-action]')].filter((b) => !b.disabled);
    if (!btns.length) return;
    this.titleIndex = ((i % btns.length) + btns.length) % btns.length;
    btns.forEach((b, j) => b.classList.toggle('selected', j === this.titleIndex));
  }

  hideTitle() {
    this.titleActive = false;
    this.title.classList.add('leaving');
    setTimeout(() => this.title.classList.add('hidden'), 360);
    this.rotate.classList.add('hidden');
    this.hud.classList.remove('hidden');
  }

  showHud(show = true) { this.hud.classList.toggle('hidden', !show); }
  setObjective(text) { if (text) this.objEl.textContent = text; }
  setChapter(text) { if (text) this.chapterEl.textContent = text; }

  togglePause(force = null) {
    if (this.g.mode !== 'world') return;
    const next = force === null ? !this.paused : force;
    if (next && (this.g.cutscene || this.g.dialogue.active)) return;
    this.paused = next;
    this.g.paused = next;
    this.pause.classList.toggle('hidden', !next);
    this.g.input.setTouchVisibleForScene(!next);
    if (next) this.g.sound.sfx('confirm');
    else this.g.sound.sfx('cancel');
  }

  openSettings(returnTo) {
    this.settingsReturn = returnTo;
    this.settingsOpen = true;
    this.settings.classList.remove('hidden');
    if (returnTo === 'title') this.title.classList.add('hidden');
    if (returnTo === 'pause') this.pause.classList.add('hidden');
    this.updateMotionStatus();
  }

  closeSettings() {
    this.settings.classList.add('hidden');
    this.settingsOpen = false;
    if (this.settingsReturn === 'pause') {
      this.pause.classList.remove('hidden');
    } else {
      this.title.classList.remove('hidden');
      this.titleActive = true;
    }
  }

  showCredits() {
    this.title.classList.add('hidden');
    this.credits.classList.remove('hidden');
  }

  update(dt) {
    if (this.g.input.tilt.enabled && Math.random() < 0.03) this.updateMotionStatus();
    if (this.titleActive && !this.settingsOpen && this.credits.classList.contains('hidden')) {
      const input = this.g.input;
      if (input.consume('up')) this.setTitleSelection(this.titleIndex - 1);
      if (input.consume('down')) this.setTitleSelection(this.titleIndex + 1);
      if (input.consume('confirm')) {
        const btns = [...this.title.querySelectorAll('[data-action]')].filter((b) => !b.disabled);
        btns[this.titleIndex]?.click();
      }
    }
  }

  toast(text, type = '', duration = 2800) {
    this.toastEl.textContent = text;
    this.toastEl.className = type ? type : '';
    this.toastEl.classList.remove('hidden');
    // restart transition
    void this.toastEl.offsetWidth;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.remove('show');
      setTimeout(() => this.toastEl.classList.add('hidden'), 320);
    }, duration);
  }

  location(name, sub = '') {
    this.locName.textContent = name;
    this.locSub.textContent = sub;
    this.locEl.classList.add('hidden');
    void this.locEl.offsetWidth;
    this.locEl.classList.remove('hidden');
    this.locEl.style.animation = 'none';
    void this.locEl.offsetWidth;
    this.locEl.style.animation = '';
    clearTimeout(this.locTimer);
    this.locTimer = setTimeout(() => this.locEl.classList.add('hidden'), 4700);
  }

  showGameover() {
    this.gameover.classList.remove('hidden');
    this.gameoverVisible = true;
    this.g.input.setTouchVisibleForScene(false);
  }

  hideGameover() {
    this.gameover.classList.add('hidden');
    this.gameoverVisible = false;
    this.g.input.setTouchVisibleForScene(true);
  }

  showEndCard(stats) {
    document.getElementById('end-stats').innerHTML = `
      <span>TIME<b>${stats.time}</b></span>
      <span>ACTS<b>${stats.acts}</b></span>
      <span>DODGED<b>${stats.dodges}</b></span>
    `;
    this.endCard.classList.remove('hidden');
    this.hud.classList.add('hidden');
    this.g.input.setTouchVisibleForScene(false);
  }

  returnToTitle() {
    this.endCard.classList.add('hidden');
    this.gameover.classList.add('hidden');
    this.pause.classList.add('hidden');
    this.settings.classList.add('hidden');
    this.hud.classList.add('hidden');
    this.titleActive = true;
    this.paused = false;
    this.g.paused = false;
    this.g.mode = 'title';
    this.g.world.leave();
    this.g.sound.playTrack('snow');
    this.g.sound.ambience(0.5);
    this.g.input.setTouchVisibleForScene(false);
    this.showTitle(this.g.loadCheckpoint());
  }

  getSave() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { return null; }
  }

  writeSave(data) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch {}
  }
}
