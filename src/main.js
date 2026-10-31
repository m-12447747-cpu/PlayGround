import { Game } from "./game.js";
import { Input } from "./input.js";
import { AudioEngine } from "./audio.js";
import { UI } from "./ui.js";

async function boot() {
  const canvas = document.getElementById("game");
  const audio = new AudioEngine();
  const input = new Input(canvas);
  const game = new Game(canvas, input, audio);
  const ui = new UI(game, input, audio);
  game.setUI(ui);
  input.onAnyInput = () => audio.ensure();
  input.onMute = () => {
    const button = document.getElementById("sound-toggle");
    if (button) button.click();
  };

  try {
    await document.fonts.load('16px "VT323"');
    await document.fonts.load('8px "Press Start 2P"');
    await document.fonts.ready;
  } catch {
    /* fonts fall back to monospace */
  }

  game.start();
  ui.ready();
  window.srifGame = game;
  window.srifUI = ui;

  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    game.update(dt);
    game.draw();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) last = performance.now();
  });

  document.addEventListener("pointerdown", () => audio.ensure(), { passive: true });
  document.addEventListener("keydown", () => audio.ensure());
}

boot();
