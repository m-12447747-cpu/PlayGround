/* The Lakeside Diner restroom — where the mirror starts looking back. */
import { TAU, INK, C, layout, clamp, rr, poly, ellipse, glow, star, drawSnow, drawVignette, hash, smoothstep } from "./draw-utils.js";
import { drawSrif, drawMich, drawShadow } from "./characters.js";

function tileWall(ctx, W, H, t, flicker) {
  const base = ctx.createLinearGradient(0, 0, 0, H * 0.76);
  base.addColorStop(0, "#203a3c");
  base.addColorStop(0.48, "#182e33");
  base.addColorStop(1, "#102126");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H * 0.76);

  // Large tile grid.
  const tw = Math.max(48, W / 12);
  const th = Math.max(38, H / 16);
  ctx.save();
  ctx.strokeStyle = "rgba(112,164,161,.12)";
  ctx.lineWidth = 1;
  for (let x = -tw; x < W + tw; x += tw) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 8, H * 0.75);
    ctx.stroke();
  }
  for (let y = 22; y < H * 0.75; y += th) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y + 2);
    ctx.stroke();
  }
  // Occasional grime.
  for (let i = 0; i < 16; i++) {
    ctx.globalAlpha = 0.025 + hash(i * 3.2) * 0.05;
    ctx.fillStyle = "#9ec4ba";
    ellipse(ctx, hash(i * 7.4) * W, hash(i * 2.1) * H * 0.65, 8 + hash(i) * 34, 5 + hash(i * 4) * 20);
    ctx.fill();
  }
  ctx.restore();

  // Wall trim and lower tile.
  ctx.fillStyle = "#0c1b20";
  ctx.fillRect(0, H * 0.615, W, 9);
  ctx.fillStyle = "rgba(146,199,191,.2)";
  ctx.fillRect(0, H * 0.615, W, 2);
  ctx.fillStyle = "#11262a";
  ctx.fillRect(0, H * 0.625, W, H * 0.14);
  ctx.strokeStyle = "rgba(106,160,154,.15)";
  for (let x = 0; x < W; x += Math.max(30, W / 20)) {
    ctx.beginPath();
    ctx.moveTo(x, H * 0.625);
    ctx.lineTo(x + 2, H * 0.765);
    ctx.stroke();
  }
  for (let y = H * 0.66; y < H * 0.77; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Subtle light bloom from ceiling.
  const bloom = ctx.createRadialGradient(W / 2, 0, 10, W / 2, 0, H * 0.55);
  bloom.addColorStop(0, `rgba(167,241,219,${0.09 * flicker})`);
  bloom.addColorStop(1, "rgba(167,241,219,0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, H * 0.7);
}

function floor(ctx, W, H) {
  const g = ctx.createLinearGradient(0, H * 0.74, 0, H);
  g.addColorStop(0, "#121c24");
  g.addColorStop(1, "#070a10");
  ctx.fillStyle = g;
  ctx.fillRect(0, H * 0.74, W, H * 0.26);

  // Perspective floor tiles.
  const horizon = H * 0.74;
  ctx.save();
  ctx.strokeStyle = "rgba(121,165,170,.18)";
  ctx.lineWidth = 1;
  const vx = W * 0.5;
  for (let i = -8; i <= 8; i++) {
    const x = vx + i * W * 0.09;
    ctx.beginPath();
    ctx.moveTo(vx + i * W * 0.016, horizon);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let i = 1; i <= 6; i++) {
    const p = i / 6;
    const y = horizon + Math.pow(p, 1.7) * (H - horizon);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  // Wall base shadow.
  const sh = ctx.createLinearGradient(0, H * 0.73, 0, H * 0.82);
  sh.addColorStop(0, "rgba(0,0,0,.4)");
  sh.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sh;
  ctx.fillRect(0, H * 0.73, W, H * 0.1);
}

function fluorescent(ctx, W, H, t) {
  const flicker = 0.72 + 0.14 * Math.sin(t * 7.2) + (hash(Math.floor(t * 4)) > 0.92 ? -0.24 : 0);
  for (let i = 0; i < 2; i++) {
    const x = W * (0.22 + i * 0.5);
    const y = H * 0.055;
    const w = Math.min(150, W * 0.24);
    ctx.fillStyle = "#d8ffe9";
    ctx.strokeStyle = "#0a1115";
    ctx.lineWidth = 2;
    rr(ctx, x - w / 2, y, w, 7, 2);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.25 * flicker;
    ctx.fillStyle = "#b9fff0";
    rr(ctx, x - w / 2 - 3, y - 2, w + 6, 11, 3);
    ctx.fill();
    ctx.restore();
    glow(ctx, x, y + 4, W * 0.16, "rgba(144,255,220,.13)", flicker);
  }
  // Wires.
  ctx.strokeStyle = "rgba(6,11,14,.7)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.04);
  ctx.lineTo(W, H * 0.04);
  ctx.stroke();
  return flicker;
}

function mirror(ctx, x, y, w, h, t, ominous) {
  // Frame.
  ctx.fillStyle = "#0d181c";
  ctx.strokeStyle = "#4c6968";
  ctx.lineWidth = 3;
  rr(ctx, x - w / 2 - 5, y - 5, w + 10, h + 10, 4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  rr(ctx, x - w / 2 - 8, y - 8, w + 16, h + 16, 5);
  ctx.stroke();
  // Glass.
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, "#334b53");
  g.addColorStop(0.42, "#18282f");
  g.addColorStop(0.7, "#23383f");
  g.addColorStop(1, "#0b141c");
  ctx.fillStyle = g;
  rr(ctx, x - w / 2, y, w, h, 2);
  ctx.fill();

  // Smudges / reflection.
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = "#d7f1e9";
  ellipse(ctx, x - w * 0.2, y + h * 0.24, w * 0.26, h * 0.07, -0.3);
  ctx.fill();
  ellipse(ctx, x + w * 0.1, y + h * 0.18, w * 0.34, h * 0.03, 0.2);
  ctx.fill();
  ctx.restore();

  // A shape in the glass.
  ctx.save();
  ctx.globalAlpha = ominous ? 0.5 : 0.18;
  ctx.fillStyle = "#091015";
  ctx.beginPath();
  ctx.arc(x, y + h * 0.29, w * 0.14, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - w * 0.24, y + h);
  ctx.quadraticCurveTo(x - w * 0.16, y + h * 0.48, x, y + h * 0.5);
  ctx.quadraticCurveTo(x + w * 0.16, y + h * 0.48, x + w * 0.24, y + h);
  ctx.closePath();
  ctx.fill();
  if (ominous) {
    ctx.globalAlpha = 0.55 + 0.35 * Math.sin(t * 4);
    ctx.fillStyle = "#ff6070";
    ctx.beginPath();
    ctx.arc(x - w * 0.055, y + h * 0.275, 2.1, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w * 0.06, y + h * 0.275, 2.1, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // Crack.
  if (ominous) {
    ctx.strokeStyle = "rgba(226,244,238,.5)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.24, y + 3);
    ctx.lineTo(x + w * 0.1, y + h * 0.28);
    ctx.lineTo(x + w * 0.16, y + h * 0.48);
    ctx.lineTo(x + w * 0.04, y + h * 0.74);
    ctx.moveTo(x + w * 0.1, y + h * 0.28);
    ctx.lineTo(x - w * 0.13, y + h * 0.36);
    ctx.stroke();
  }
}

function sink(ctx, x, y, w, t, running) {
  // Pedestal / counter.
  ctx.fillStyle = "#dbe7e4";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w * 0.36, y + 28);
  ctx.quadraticCurveTo(x, y + 38, x - w * 0.36, y + 28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#9fb9b7";
  ellipse(ctx, x, y + 3, w * 0.34, 5);
  ctx.fill();
  ctx.fillStyle = "#1a2e32";
  ellipse(ctx, x, y + 2, w * 0.26, 3.3);
  ctx.fill();

  // Faucet.
  ctx.strokeStyle = "#b6c7c4";
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y - 3);
  ctx.lineTo(x, y - 20);
  ctx.quadraticCurveTo(x + 13, y - 24, x + 15, y - 13);
  ctx.stroke();
  ctx.strokeStyle = "#eef7f4";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  if (running) {
    ctx.strokeStyle = "rgba(153,228,247,.62)";
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 3; i++) {
      const dx = Math.sin(t * 20 + i * 1.7) * 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 15 + dx, y - 12);
      ctx.lineTo(x + 14 + dx * 1.6, y + 2);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(188,242,255,.5)";
    ctx.beginPath();
    ctx.arc(x + 14, y + 4, 4 + Math.sin(t * 12) * 1.2, 0, TAU);
    ctx.fill();
  }
}

function towelDispenser(ctx, x, y) {
  ctx.fillStyle = "#8b9998";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  rr(ctx, x, y, 28, 40, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#d6dfdc";
  rr(ctx, x + 4, y + 8, 20, 17, 1);
  ctx.fill();
  ctx.strokeStyle = "rgba(16,12,25,.3)";
  ctx.stroke();
  ctx.fillStyle = "rgba(197,218,215,.6)";
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 25);
  ctx.lineTo(x + 23, y + 25);
  ctx.lineTo(x + 21, y + 52);
  ctx.quadraticCurveTo(x + 14, y + 58, x + 7, y + 52);
  ctx.closePath();
  ctx.fill();
}

function stall(ctx, x, w, H) {
  const y = H * 0.16;
  const h = H * 0.6;
  ctx.fillStyle = "#173036";
  ctx.strokeStyle = "#0b171b";
  ctx.lineWidth = 2.5;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  // Panel lines.
  ctx.strokeStyle = "rgba(104,166,161,.16)";
  ctx.lineWidth = 1.2;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + (w / 3) * i, y + 10);
    ctx.lineTo(x + (w / 3) * i, y + h - 28);
    ctx.stroke();
  }
  // Door gap + darkness.
  ctx.fillStyle = "#05080b";
  ctx.fillRect(x + w - 4, y + 9, 5, h - 20);
  // Vent.
  ctx.strokeStyle = "rgba(155,198,191,.28)";
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + w * 0.58, y + 18 + i * 5);
    ctx.lineTo(x + w * 0.58 + 21, y + 18 + i * 5);
    ctx.stroke();
  }
}

function signage(ctx, W, H) {
  const x = W * 0.5;
  const y = H * 0.115;
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(181,226,219,.6)";
  ctx.font = `${Math.max(7, Math.round(W * 0.009))}px Silkscreen, monospace`;
  ctx.fillText("LAKESIDE DINER · RESTROOM", x, y);
  ctx.strokeStyle = "rgba(181,226,219,.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - W * 0.13, y + 7);
  ctx.lineTo(x + W * 0.13, y + 7);
  ctx.stroke();

  // Wash hands sign.
  const sx = W * 0.84;
  const sy = H * 0.2;
  ctx.fillStyle = "rgba(222,234,220,.78)";
  ctx.strokeStyle = "rgba(9,17,20,.7)";
  ctx.lineWidth = 1;
  rr(ctx, sx, sy, W * 0.11, W * 0.13, 1);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#31494b";
  ctx.font = `${Math.max(4, Math.round(W * 0.0045))}px Silkscreen, monospace`;
  ctx.fillText("EMPLOYEES", sx + W * 0.055, sy + W * 0.036);
  ctx.fillText("MUST WASH", sx + W * 0.055, sy + W * 0.055);
  ctx.fillText("HANDS", sx + W * 0.055, sy + W * 0.074);
  ctx.strokeStyle = "#31494b";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(sx + W * 0.055, sy + W * 0.1, W * 0.013, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function waterSpray(ctx, x1, y1, x2, y2, t, amount) {
  if (amount <= 0) return;
  ctx.save();
  ctx.strokeStyle = "rgba(154,230,255,.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo((x1 + x2) / 2, Math.min(y1, y2) - 40, x2, y2);
  ctx.stroke();
  for (let i = 0; i < 22; i++) {
    const p = (i / 22 + t * 0.8) % 1;
    const px = x1 + (x2 - x1) * p + Math.sin(p * 20 + t * 9 + i) * 12 * amount;
    const py = y1 + (y2 - y1) * p - Math.sin(p * Math.PI) * 34 + (hash(i) - 0.5) * 14;
    ctx.globalAlpha = 0.3 + hash(i * 2.2) * 0.5;
    ctx.fillStyle = i % 4 ? "#b9efff" : "#7fd9f4";
    ctx.beginPath();
    ctx.arc(px, py, 1.1 + hash(i * 4.3) * 2.1, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function afterBattleHaze(ctx, W, H, t) {
  ctx.save();
  ctx.globalAlpha = 0.2;
  const g = ctx.createRadialGradient(W * 0.44, H * 0.4, 10, W * 0.5, H * 0.5, W * 0.55);
  g.addColorStop(0, "rgba(218,205,255,.4)");
  g.addColorStop(1, "rgba(218,205,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  for (let i = 0; i < 20; i++) {
    const x = ((hash(i * 4.4) * W + t * (2 + i * 0.3)) % (W + 20)) - 10;
    const y = ((hash(i * 7.8) * H - t * (4 + i * 0.5)) % (H + 20) + H + 20) % (H + 20);
    ctx.globalAlpha = 0.06 + hash(i) * 0.12;
    ctx.fillStyle = "#e6dfff";
    ctx.beginPath();
    ctx.arc(x, y, 1 + hash(i * 5.1) * 2, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawBathroom(ctx, W, H, t, state) {
  const L = layout(W, H);
  const S = L.S;
  const groundY = H * (L.portrait ? 0.775 : 0.83);
  const bath = state.bath || {};
  const mode = bath.mode || "normal";
  const pin = clamp(bath.pin || 0, 0, 1);
  const recognize = clamp(bath.recognize || 0, 0, 1);
  const zoom = bath.zoom || 1;
  const shake = bath.shake || 0;

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (shake > 0) {
    ctx.translate((hash(t * 91) - 0.5) * shake, (hash(t * 73 + 9) - 0.5) * shake);
  }
  if (zoom !== 1) {
    const fx = W * 0.5;
    const fy = H * 0.54;
    ctx.translate(fx, fy);
    ctx.scale(zoom, zoom);
    ctx.translate(-fx, -fy);
  }

  const flicker = fluorescent(ctx, W, H, t);
  tileWall(ctx, W, H, t, flicker);
  signage(ctx, W, H);

  // Stalls.
  if (W > 760) {
    stall(ctx, W * 0.055, W * 0.13, H);
    stall(ctx, W * 0.815, W * 0.13, H);
  } else {
    stall(ctx, -W * 0.04, W * 0.16, H);
    stall(ctx, W * 0.88, W * 0.16, H);
  }

  // Mirrors.
  const mirrorW = Math.min(W * 0.2, 172);
  const mirrorH = Math.min(H * 0.23, 188);
  const m1x = W * 0.35;
  const m2x = W * 0.7;
  mirror(ctx, m1x, H * 0.18, mirrorW, mirrorH, t, !!bath.ominous);
  mirror(ctx, m2x, H * 0.18, mirrorW, mirrorH, t, false);

  // Sinks + fixtures.
  const sink1x = W * 0.35;
  const sink2x = W * 0.7;
  const sinkW = Math.min(W * 0.19, 160);
  sink(ctx, sink1x, groundY - 27 * S, sinkW, t, mode === "spray" || mode === "normal");
  sink(ctx, sink2x, groundY - 27 * S, sinkW, t, false);
  towelDispenser(ctx, W * 0.08, H * 0.31);
  towelDispenser(ctx, W * 0.88, H * 0.31);

  // Hand dryer.
  ctx.fillStyle = "#a6b4b1";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  rr(ctx, W * 0.79, H * 0.36, 40, 55, 5);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(30,50,50,.55)";
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(W * 0.79 + 8, H * 0.36 + 12 + i * 7);
    ctx.lineTo(W * 0.79 + 31, H * 0.36 + 12 + i * 7);
    ctx.stroke();
  }

  floor(ctx, W, H);

  // Puddle reflections.
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = "#b8fff1";
  ellipse(ctx, W * 0.3, H * 0.9, W * 0.12, H * 0.018);
  ctx.fill();
  ellipse(ctx, W * 0.73, H * 0.95, W * 0.09, H * 0.012);
  ctx.fill();
  ctx.restore();

  // Red pressure wash of the cutscene.
  if (pin > 0) {
    ctx.save();
    ctx.globalAlpha = pin * 0.28;
    const v = ctx.createRadialGradient(W * 0.5, H * 0.55, 20, W * 0.5, H * 0.55, W * 0.7);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(170,21,51,1)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  if (bath.after) afterBattleHaze(ctx, W, H, t);

  // Character positions.
  let srifX = (bath.playerX ?? 0.27) * W;
  let michX = (bath.michX ?? 0.67) * W;
  let srifFace = 1;
  let michFace = -1;
  if (mode === "pin" || mode === "recognize") {
    srifX = W * 0.455;
    michX = W * 0.56 + recognize * W * 0.02;
    srifFace = -1;
    michFace = -1;
  }
  if (mode === "spray") {
    srifFace = 1;
    michFace = -1;
  }

  const srifScale = S * (mode === "pin" ? 1.02 : 1);
  const michScale = S * (mode === "pin" ? 1.14 : 1);

  drawShadow(ctx, michX, groundY + 2, 30 * S, 0.3);
  drawShadow(ctx, srifX, groundY + 2, 24 * S, 0.28);

  if (mode === "pin" || mode === "recognize") {
    ctx.save();
    ctx.translate(srifX, groundY);
    ctx.rotate(-0.12 + recognize * 0.06);
    ctx.translate(-srifX, -groundY);
    drawSrif(ctx, srifX, groundY, srifScale, {
      t,
      facing: 1,
      mood: recognize > 0.45 ? "sad" : "hurt",
      pose: "up",
    });
    ctx.restore();
    drawMich(ctx, michX, groundY, michScale, {
      t,
      facing: -1,
      mood: recognize > 0.4 ? "soft" : "tough",
      pose: "pin",
    });
    if (recognize < 0.3) {
      // The grip.
      ctx.save();
      ctx.strokeStyle = "rgba(255,150,150,.55)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(michX - 70 * S, groundY - 96 * S);
      ctx.lineTo(srifX + 24 * S, groundY - 90 * S);
      ctx.stroke();
      ctx.restore();
    }
  } else {
    drawSrif(ctx, srifX, groundY, srifScale, {
      t,
      facing: srifFace,
      mood: mode === "after" ? "soft" : bath.mood || "neutral",
      pose: "idle",
    });
    drawMich(ctx, michX, groundY, michScale, {
      t,
      facing: michFace,
      mood: mode === "after" ? "soft" : "tough",
      pose: "crossed",
    });
  }

  // Speech bubble over Mich.
  if (mode === "normal") {
    const bob = Math.sin(t * 2.1) * 2;
    ctx.save();
    ctx.translate(michX - 33 * S, groundY - 162 * S + bob);
    ctx.fillStyle = "rgba(12,11,22,.9)";
    ctx.strokeStyle = "#7e749b";
    ctx.lineWidth = 1.2;
    rr(ctx, -9, -9, 18, 16, 3);
    ctx.fill();
    ctx.stroke();
    poly(ctx, [[-2, 7], [3, 7], [0, 12]]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#a49abc";
    ctx.font = "8px Silkscreen, monospace";
    ctx.textAlign = "center";
    ctx.fillText("…", 0, 2);
    ctx.restore();
  }

  // Water stream.
  if (bath.spray > 0) {
    waterSpray(ctx, sink1x + 12 * S, groundY - 45 * S, michX - 12 * S, groundY - 88 * S, t, bath.spray);
  }

  // Reflection shifts.
  if (mode === "pin" || mode === "recognize") {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    glow(ctx, mirrorW ? W * 0.35 : W * 0.35, H * 0.25, W * 0.2, "rgba(255,90,110,.13)", pin);
    ctx.restore();
  }

  // Paper towel on the floor.
  ctx.fillStyle = "rgba(222,229,220,.4)";
  ctx.beginPath();
  ctx.moveTo(W * 0.58, H * 0.94);
  ctx.lineTo(W * 0.62, H * 0.93);
  ctx.lineTo(W * 0.63, H * 0.96);
  ctx.lineTo(W * 0.59, H * 0.97);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  drawVignette(ctx, W, H, 0.7);

  // A single cold ceiling glint after the cutscene.
  if (bath.after) {
    ctx.save();
    ctx.globalAlpha = 0.15 + Math.sin(t * 3) * 0.04;
    ctx.strokeStyle = "#e8ddff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.35 - mirrorW / 2, H * 0.2);
    ctx.lineTo(W * 0.35 + mirrorW * 0.18, H * 0.37);
    ctx.stroke();
    ctx.restore();
  }
}
