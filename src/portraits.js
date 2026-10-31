/* Dialogue portraits — painted from the same head studies as the world sprites. */
import { TAU, INK, hash, ellipse, poly, rr, star } from "./draw-utils.js";
import { drawSrifHead, drawChrisHead, drawMichHead, drawAsgoreHead, drawTorielHead, drawMirrorHead } from "./heads.js";

const BG = {
  srif: ["#2b2b4b", "#17162c", "#ef6b7c"],
  chris: ["#244a45", "#12251f", "#ffcf78"],
  mich: ["#332a36", "#17131c", "#d98b41"],
  asgore: ["#243755", "#111a2a", "#ffcf78"],
  toriel: ["#3b2c4b", "#1b1427", "#cfa6d6"],
  mirror: ["#250a18", "#0b050d", "#ef5d78"],
  narrator: ["#1b1a2b", "#0e0d18", "#a291ff"],
};

function background(ctx, who, t) {
  const [a, b, accent] = BG[who] || BG.narrator;
  const g = ctx.createLinearGradient(0, 0, 256, 256);
  g.addColorStop(0, a);
  g.addColorStop(0.7, b);
  g.addColorStop(1, "#090811");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  // Halo.
  const halo = ctx.createRadialGradient(130, 104, 8, 130, 104, 128);
  halo.addColorStop(0, `${accent}33`);
  halo.addColorStop(0.55, `${accent}12`);
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, 256, 256);

  // Diagonal paper cuts.
  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  for (let i = -8; i < 12; i++) {
    ctx.beginPath();
    ctx.moveTo(-20 + i * 30, 260);
    ctx.lineTo(52 + i * 30, 0);
    ctx.stroke();
  }
  ctx.restore();

  // Snow / dust motes.
  ctx.save();
  for (let i = 0; i < 34; i++) {
    const x = hash(i * 5.2 + 1) * 256;
    const y = hash(i * 9.8 + 4) * 230;
    const r = 0.5 + hash(i * 2.3) * 1.7;
    ctx.globalAlpha = 0.15 + hash(i * 6.7) * 0.45;
    ctx.fillStyle = i % 4 ? "#fff7df" : accent;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // Giant ghost letter.
  ctx.save();
  ctx.globalAlpha = 0.055;
  ctx.fillStyle = accent;
  ctx.font = "700 188px Pixelify, serif";
  ctx.textAlign = "center";
  ctx.fillText(who === "mirror" ? "?" : who.slice(0, 1).toUpperCase(), 192, 218);
  ctx.restore();

  // Bottom stage.
  const floor = ctx.createLinearGradient(0, 190, 0, 256);
  floor.addColorStop(0, "rgba(5,4,10,0)");
  floor.addColorStop(1, "rgba(5,4,10,.8)");
  ctx.fillStyle = floor;
  ctx.fillRect(0, 180, 256, 76);
}

function shoulders(ctx, who) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;

  if (who === "srif") {
    ctx.fillStyle = "#26304c";
    ctx.beginPath();
    ctx.moveTo(42, 256);
    ctx.quadraticCurveTo(55, 206, 92, 191);
    ctx.lineTo(164, 191);
    ctx.quadraticCurveTo(201, 206, 214, 256);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e6d5b2";
    ctx.beginPath();
    ctx.moveTo(91, 196);
    ctx.lineTo(165, 196);
    ctx.lineTo(173, 256);
    ctx.lineTo(83, 256);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Scarf.
    ctx.fillStyle = "#c34a5c";
    ctx.beginPath();
    ctx.moveTo(70, 203);
    ctx.quadraticCurveTo(128, 234, 187, 199);
    ctx.lineTo(198, 220);
    ctx.quadraticCurveTo(130, 252, 59, 224);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,206,197,.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(76, 211);
    ctx.quadraticCurveTo(129, 239, 181, 209);
    ctx.stroke();
  } else if (who === "chris") {
    ctx.fillStyle = "#2f695f";
    ctx.beginPath();
    ctx.moveTo(35, 256);
    ctx.quadraticCurveTo(48, 205, 86, 190);
    ctx.lineTo(170, 190);
    ctx.quadraticCurveTo(207, 204, 221, 256);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Fur collar.
    ctx.fillStyle = "#f1e4ca";
    ctx.beginPath();
    ctx.moveTo(66, 204);
    ctx.quadraticCurveTo(84, 182, 105, 197);
    ctx.quadraticCurveTo(128, 181, 151, 198);
    ctx.quadraticCurveTo(172, 182, 191, 205);
    ctx.quadraticCurveTo(153, 230, 128, 222);
    ctx.quadraticCurveTo(102, 229, 66, 204);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#c34d59";
    ctx.beginPath();
    ctx.moveTo(94, 220);
    ctx.quadraticCurveTo(128, 240, 163, 219);
    ctx.lineTo(168, 234);
    ctx.quadraticCurveTo(127, 257, 89, 235);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (who === "mich") {
    ctx.fillStyle = "#191820";
    ctx.beginPath();
    ctx.moveTo(28, 256);
    ctx.quadraticCurveTo(44, 199, 85, 185);
    ctx.lineTo(171, 185);
    ctx.quadraticCurveTo(211, 198, 228, 256);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Orange collar fur.
    ctx.fillStyle = "#cf7c38";
    ctx.beginPath();
    ctx.moveTo(72, 200);
    ctx.quadraticCurveTo(83, 179, 102, 193);
    ctx.lineTo(128, 216);
    ctx.lineTo(154, 192);
    ctx.quadraticCurveTo(172, 178, 184, 201);
    ctx.quadraticCurveTo(151, 226, 128, 221);
    ctx.quadraticCurveTo(102, 229, 72, 200);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Jacket zip.
    ctx.strokeStyle = "#666071";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(128, 217);
    ctx.lineTo(128, 256);
    ctx.stroke();
  } else if (who === "asgore") {
    ctx.fillStyle = "#1e2c49";
    ctx.beginPath();
    ctx.moveTo(13, 256);
    ctx.quadraticCurveTo(32, 197, 80, 177);
    ctx.lineTo(176, 177);
    ctx.quadraticCurveTo(224, 197, 243, 256);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#17233b";
    ctx.beginPath();
    ctx.moveTo(113, 181);
    ctx.lineTo(143, 181);
    ctx.lineTo(151, 256);
    ctx.lineTo(105, 256);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Badge.
    star(ctx, 78, 217, 8.5, "#efc66b");
    ctx.strokeStyle = "#5e4921";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(78, 217, 8.5, 0, TAU);
    ctx.stroke();
    // Button.
    ctx.fillStyle = "#d8b766";
    ctx.beginPath();
    ctx.arc(160, 226, 3, 0, TAU);
    ctx.fill();
  } else if (who === "toriel") {
    ctx.fillStyle = "#5b4364";
    ctx.beginPath();
    ctx.moveTo(23, 256);
    ctx.quadraticCurveTo(42, 201, 86, 184);
    ctx.lineTo(170, 184);
    ctx.quadraticCurveTo(214, 201, 233, 256);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Fur collar.
    ctx.fillStyle = "#d7c7d6";
    ctx.beginPath();
    ctx.moveTo(69, 201);
    ctx.quadraticCurveTo(83, 181, 103, 194);
    ctx.lineTo(128, 210);
    ctx.lineTo(153, 194);
    ctx.quadraticCurveTo(173, 181, 188, 201);
    ctx.quadraticCurveTo(155, 223, 128, 218);
    ctx.quadraticCurveTo(101, 223, 69, 201);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Scarf.
    ctx.fillStyle = "#a3495a";
    ctx.beginPath();
    ctx.moveTo(93, 216);
    ctx.quadraticCurveTo(128, 237, 164, 215);
    ctx.lineTo(169, 230);
    ctx.quadraticCurveTo(128, 253, 88, 231);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Mirror: jagged shoulders.
    ctx.fillStyle = "#120b17";
    ctx.beginPath();
    ctx.moveTo(20, 256);
    ctx.lineTo(65, 196);
    ctx.lineTo(89, 213);
    ctx.lineTo(112, 184);
    ctx.lineTo(131, 213);
    ctx.lineTo(158, 188);
    ctx.lineTo(183, 216);
    ctx.lineTo(236, 256);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(239,93,120,.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(65, 196);
    ctx.lineTo(79, 232);
    ctx.lineTo(57, 256);
    ctx.moveTo(183, 216);
    ctx.lineTo(174, 240);
    ctx.stroke();
  }

  ctx.restore();
}

function rimLight(ctx, who) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const color = who === "mirror" ? "#ef5d78" : who === "chris" ? "#8ce0c8" : who === "mich" ? "#ffb15c" : "#b6a9f5";
  const g = ctx.createLinearGradient(0, 0, 0, 220);
  g.addColorStop(0, `${color}00`);
  g.addColorStop(0.55, `${color}18`);
  g.addColorStop(1, `${color}00`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  ctx.restore();
}

export function drawPortrait(canvas, who, mood = "neutral", t = 0) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 256, 256);

  const known = ["srif", "chris", "mich", "asgore", "toriel", "mirror"].includes(who) ? who : "narrator";
  background(ctx, known, t);

  if (known === "narrator") {
    ctx.fillStyle = "#c9bfdc";
    ctx.font = "400 116px Press Start, monospace";
    ctx.textAlign = "center";
    ctx.fillText("…", 128, 160);
    return;
  }

  shoulders(ctx, known);

  if (known === "srif") {
    drawSrifHead(ctx, 127, 115, 63, mood, 1, t);
  } else if (known === "chris") {
    drawChrisHead(ctx, 127, 114, 60, mood, 1, t);
  } else if (known === "mich") {
    drawMichHead(ctx, 128, 116, 62, mood, 1, t);
  } else if (known === "asgore") {
    drawAsgoreHead(ctx, 128, 108, 68, mood, 1, t);
  } else if (known === "toriel") {
    drawTorielHead(ctx, 128, 110, 65, mood, 1, t);
  } else if (known === "mirror") {
    drawMirrorHead(ctx, 128, 114, 66, mood === "soft" ? 2.2 : 0, t);
    // Scanline displacement.
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#ef5d78";
    for (let i = 0; i < 6; i++) {
      const y = 74 + hash(i * 4.2) * 96;
      ctx.fillRect(0, y, 256, 1 + hash(i) * 2);
    }
    ctx.restore();
  }

  rimLight(ctx, known);

  // Inner frame shadow.
  const shadow = ctx.createRadialGradient(128, 120, 54, 128, 120, 170);
  shadow.addColorStop(0, "rgba(0,0,0,0)");
  shadow.addColorStop(1, "rgba(0,0,0,.58)");
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 0, 256, 256);

  // A few foreground flakes.
  ctx.save();
  for (let i = 0; i < 8; i++) {
    ctx.globalAlpha = 0.15 + hash(i * 3.7) * 0.28;
    ctx.fillStyle = "#fff8e5";
    ctx.beginPath();
    ctx.arc(hash(i * 7.1) * 256, hash(i * 11.3) * 256, 1 + hash(i) * 1.8, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
