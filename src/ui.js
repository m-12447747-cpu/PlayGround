const STORE = "srif.coldreturn.";

function load(key, fallback) {
  try {
    const value = localStorage.getItem(STORE + key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(STORE + key, JSON.stringify(value));
  } catch {
    /* storage can be unavailable */
  }
}

export class UI {
  constructor(game, input, audio) {
    this.game = game;
    this.input = input;
    this.audio = audio;
    this.returnToPause = false;
    this.toastTimer = null;
    this.touchMode = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
    this.forceTouch = load("forceTouch", false);
    this._cache();
    this._bind();
    this._applyStoredSettings();
    this._updateTouchUI();
    this._updateRotateHint();
    document.body.classList.toggle("touch", this.touchMode);
    document.body.classList.toggle("show-touch", this.forceTouch);
  }

  _cache() {
    const $ = (id) => document.getElementById(id);
    this.el = {
      title: $("title-ui"),
      howto: $("howto"),
      settings: $("settings"),
      pause: $("pause"),
      ending: $("ending"),
      loading: $("loading"),
      pauseBtn: $("pause-btn"),
      soundToggle: $("sound-toggle"),
      tiltToggle: $("tilt-toggle"),
      motionToggle: $("motion-toggle"),
      touchToggle: $("touch-toggle"),
      calibrate: $("calibrate-tilt"),
      tiltChip: $("tilt-chip"),
      toast: $("toast"),
      rotate: $("rotate-hint"),
      touchHelp: $("touch-help"),
      tiltHelp: $("tilt-help"),
      endingCopy: $("ending-copy"),
      endingStats: $("ending-stats"),
      touchBar: $("touch-bar"),
    };
  }

  _bind() {
    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        this.audio.ensure();
        button.blur();
        const action = button.dataset.action;
        if (action === "begin") this.game.newGame();
        else if (action === "howto") this.openModal("howto");
        else if (action === "settings") this.openModal("settings");
        else if (action === "resume") this.game.resume();
        else if (action === "restart") window.location.reload();
        else if (action === "title") window.location.reload();
        else if (action === "again") this.game.newGame();
      });
    });

    document.querySelectorAll("[data-close]").forEach((button) => {
      button.addEventListener("click", () => this.closeModal(button.dataset.close));
    });

    this.el.pauseBtn.addEventListener("click", () => {
      this.audio.ensure();
      this.game.togglePause();
    });

    this.el.soundToggle.addEventListener("click", () => {
      const next = this.el.soundToggle.getAttribute("aria-checked") !== "true";
      this.audio.ensure();
      this.audio.setMuted(!next);
      this._setSwitch(this.el.soundToggle, next, next ? "ON" : "OFF");
      save("sound", next);
      this.toast(next ? "Sound on." : "Sound muted.");
    });

    this.el.motionToggle.addEventListener("click", () => {
      const next = this.el.motionToggle.getAttribute("aria-checked") !== "true";
      this.game.reduceMotion = next;
      this._setSwitch(this.el.motionToggle, next, next ? "ON" : "OFF");
      save("reduceMotion", next);
      this.toast(next ? "Reduced motion on." : "Reduced motion off.");
    });

    this.el.touchToggle.addEventListener("click", () => {
      this.forceTouch = this.el.touchToggle.getAttribute("aria-checked") !== "true";
      save("forceTouch", this.forceTouch);
      document.body.classList.toggle("show-touch", this.forceTouch);
      this._updateTouchUI();
      this.toast(this.forceTouch ? "Touch controls forced on." : "Touch controls set to auto.");
    });

    this.el.tiltToggle.addEventListener("click", () => this.toggleTilt());
    this.el.tiltChip.addEventListener("click", () => this.toggleTilt());
    this.el.calibrate.addEventListener("click", () => {
      this.input.calibrateTilt();
      this.audio.sfx("confirm");
      this.toast("Tilt recalibrated. Hold your device how you like to play.");
    });

    document.addEventListener("keydown", (event) => {
      if (event.code !== "Escape") return;
      if (!this.isModalOpen()) return;
      event.preventDefault();
      if (!this.el.ending.classList.contains("hidden")) return;
      if (!this.el.settings.classList.contains("hidden")) this.closeModal("settings");
      else if (!this.el.howto.classList.contains("hidden")) this.closeModal("howto");
      else if (!this.el.pause.classList.contains("hidden")) {
        this.el.pause.classList.add("hidden");
        this.game.resume();
      }
      this.input.pressed.delete("cancel");
    });

    window.addEventListener("resize", () => this._updateRotateHint());
    window.addEventListener("orientationchange", () => {
      this.input.calibrateTilt();
      this._updateRotateHint();
    });
  }

  _applyStoredSettings() {
    const sound = load("sound", true);
    this.audio.muted = !sound;
    this._setSwitch(this.el.soundToggle, sound, sound ? "ON" : "OFF");
    if (this.audio.master) this.audio.setMuted(!sound);

    const reduce = load("reduceMotion", false);
    this.game.reduceMotion = reduce;
    this._setSwitch(this.el.motionToggle, reduce, reduce ? "ON" : "OFF");

    const tilt = load("tilt", false);
    if (tilt) {
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission !== "function") {
        this.input.requestTilt().then((result) => {
          if (result.ok) this._updateTiltUI();
        });
      } else {
        this._setSwitch(this.el.tiltToggle, false, "OFF");
        this.el.tiltHelp.textContent = "Tap TILT to request motion access";
      }
    }
    this._updateTiltUI();
  }

  _setSwitch(el, on, label) {
    if (!el) return;
    el.setAttribute("aria-checked", on ? "true" : "false");
    const em = el.querySelector("em");
    if (em) em.textContent = label;
  }

  _updateTiltUI() {
    const on = this.input.tilt.enabled;
    this._setSwitch(this.el.tiltToggle, on, on ? "ON" : "OFF");
    this.el.tiltChip.setAttribute("aria-pressed", on ? "true" : "false");
    this.el.calibrate.classList.toggle("hidden", !on);
    if (on) {
      this.el.tiltHelp.textContent = "Tilt to move · tap CALIBRATE to reset";
    } else if (this.input.tilt.supported) {
      this.el.tiltHelp.textContent = "Optional accelerometer steering";
    } else {
      this.el.tiltHelp.textContent = "Motion sensors are not available here";
    }
  }

  async toggleTilt() {
    this.audio.ensure();
    if (this.input.tilt.enabled) {
      this.input.disableTilt();
      save("tilt", false);
      this._updateTiltUI();
      this.toast("Tilt controls off.");
      return;
    }
    const result = await this.input.requestTilt();
    if (result.ok) {
      save("tilt", true);
      this._updateTiltUI();
      this.toast("Tilt controls on. Hold your device steady for a moment.");
      this.audio.sfx("confirm");
    } else {
      this._setSwitch(this.el.tiltToggle, false, "OFF");
      this.toast(result.reason || "Tilt could not be enabled.");
    }
  }

  _updateTouchUI() {
    this.el.touchToggle.setAttribute("aria-checked", this.forceTouch ? "true" : "false");
    const em = this.el.touchToggle.querySelector("em");
    if (em) em.textContent = this.forceTouch ? "ON" : "AUTO";
    this.el.touchHelp.textContent = this.forceTouch
      ? "Always visible, even without a touch screen"
      : "Shown automatically on touch screens";
    document.body.classList.toggle("show-touch", this.forceTouch);
  }

  _updateRotateHint() {
    const portrait = window.matchMedia("(orientation: portrait)").matches;
    const titleVisible = this.el.title && !this.el.title.classList.contains("hidden");
    const endingVisible = this.el.ending && !this.el.ending.classList.contains("hidden");
    const show = this.touchMode && portrait && !titleVisible && !endingVisible;
    this.el.rotate.classList.toggle("hidden", !show);
  }

  isModalOpen() {
    return [this.el.howto, this.el.settings, this.el.pause, this.el.ending].some(
      (el) => el && !el.classList.contains("hidden")
    );
  }

  openModal(id) {
    if (id === "settings" && !this.el.pause.classList.contains("hidden")) {
      this.returnToPause = true;
      this.el.pause.classList.add("hidden");
    } else {
      this.returnToPause = false;
    }
    this.el.settings.classList.add("hidden");
    this.el.howto.classList.add("hidden");
    this.el.pause.classList.add("hidden");
    const target = this.el[id];
    if (target) target.classList.remove("hidden");
    this._updateRotateHint();
  }

  closeModal(id) {
    const target = this.el[id];
    if (target) target.classList.add("hidden");
    if (id === "settings" && this.returnToPause && this.game.paused) {
      this.returnToPause = false;
      this.el.pause.classList.remove("hidden");
    } else {
      this.returnToPause = false;
    }
    this._updateRotateHint();
  }

  closeAllModals() {
    ["settings", "howto", "pause"].forEach((id) => this.el[id].classList.add("hidden"));
    this.returnToPause = false;
  }

  showPause() {
    this.el.pause.classList.remove("hidden");
    this._updateRotateHint();
  }

  showTitle() {
    this.el.title.classList.remove("hidden");
    this.el.pauseBtn.classList.add("hidden");
    this._updateRotateHint();
  }

  hideTitle() {
    this.el.title.classList.add("hidden");
    this._updateRotateHint();
  }

  showPauseButton() {
    this.el.pauseBtn.classList.remove("hidden");
  }

  hidePauseButton() {
    this.el.pauseBtn.classList.add("hidden");
  }

  showEnding(stats) {
    let copy = "";
    let route = "";
    if (stats.skipped) {
      copy = "You stepped away. Not every mirror has to be faced today. The cocoa is still warm.";
      route = "STEPPED AWAY";
    } else if (stats.violent) {
      copy = "You broke the mirror. The face is still yours. The cocoa is still warm. That has to count for something.";
      route = "SHATTERED";
    } else {
      copy = "You looked at the thing that hates you and didn't look away. The mirror let go. The cocoa is still warm.";
      route = "MERCY";
    }
    this.el.endingCopy.textContent = copy;
    this.el.endingStats.innerHTML = "";
    const chips = [
      `ROUTE: ${route}`,
      `TURNS: ${stats.turns || 0}`,
      `HP: ${stats.hp ?? "?"}/${stats.maxHp ?? "?"}`,
    ];
    for (const text of chips) {
      const span = document.createElement("span");
      span.textContent = text;
      this.el.endingStats.appendChild(span);
    }
    this.el.ending.classList.remove("hidden");
    this.el.pauseBtn.classList.add("hidden");
    this._updateRotateHint();
  }

  hideEnding() {
    this.el.ending.classList.add("hidden");
    this._updateRotateHint();
  }

  toast(message, duration = 2800) {
    this.el.toast.textContent = message;
    this.el.toast.classList.remove("hidden");
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.el.toast.classList.add("hidden");
    }, duration);
  }

  ready() {
    this.el.loading.classList.add("done");
    setTimeout(() => this.el.loading.classList.add("hidden"), 500);
    this._updateRotateHint();
  }
}
