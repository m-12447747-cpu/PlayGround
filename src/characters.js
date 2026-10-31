/* Full-body sprite illustrations. Origin is at the character's feet. */
import { TAU, INK, C, ellipse, rr, poly, capsule, fillStroke, star } from "./draw-utils.js";
import { drawSrifHead, drawChrisHead, drawMichHead, drawAsgoreHead, drawTorielHead } from "./heads.js";

export function drawShadow(ctx, x, y, w, alpha = 0.3) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#06050d";
  ellipse(ctx, x, y, w, w * 0.23);
  ctx.fill();
  ctx.restore();
}

function boot(ctx, x, y, w = 7.5, h = 4, color = "#17151e") {
  ctx.fillStyle = color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  rr(ctx, x - w / 2, y - h, w + 3, h, 2);
  ctx.fill();
  ctx.stroke();
}

export function drawSrif(ctx, x, y, S, opts = {}) {
  const t = opts.t || 0;
  const walk = opts.walking ? Math.sin((opts.phase || 0) * 1.8) : 0;
  const bob = opts.walking ? Math.abs(Math.cos((opts.phase || 0) * 1.8)) * 1.6 : Math.sin(t * 1.6) * 0.55;
  const face = opts.facing ?? 1;
  const mood = opts.mood || "neutral";
  const pose = opts.pose || "idle";

  drawShadow(ctx, x, y + 1, 22 * S, 0.34);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S * face, S);
  ctx.translate(0, -bob);

  // Back arm.
  ctx.save();
  ctx.translate(-1, 0);
  const armSwing = opts.walking ? walk * 4.5 : 0;
  capsule(ctx, -14.5, -77, -19 + armSwing * 0.3, -49 + armSwing, 5.2, "#242943", 2.3);
  ctx.fillStyle = "#e6cec0";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(-19 + armSwing * 0.3, -47 + armSwing, 4.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Legs.
  [1, -1].forEach((side, i) => {
    ctx.save();
    ctx.translate(side * 7, -37);
    const swing = opts.walking ? walk * (i ? -0.34 : 0.34) : 0;
    ctx.rotate(swing);
    capsule(ctx, 0, 0, 0, 28, 5.2, "#1b2035", 2.2);
    boot(ctx, 0, 39, 8, 4.6);
    ctx.restore();
  });

  // Torso: oversized sweater.
  ctx.fillStyle = "#e6d5b2";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  rr(ctx, -18.5, -84, 37, 48, 11);
  ctx.fill();
  ctx.stroke();

  // Knit lines.
  ctx.strokeStyle = "rgba(120,94,70,.26)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-13 + i * 9, -78);
    ctx.lineTo(-12 + i * 11, -42);
    ctx.stroke();
  }

  // Coat panels — open front.
  ctx.fillStyle = "#26304c";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.moveTo(-18.5, -84);
  ctx.quadraticCurveTo(-24.5, -65, -21.5, -36);
  ctx.lineTo(-10.5, -36);
  ctx.lineTo(-8, -62);
  ctx.lineTo(-9, -81);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(18.5, -84);
  ctx.quadraticCurveTo(24.5, -64, 21.2, -36);
  ctx.lineTo(10.5, -36);
  ctx.lineTo(8, -62);
  ctx.lineTo(9, -81);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Coat seam highlights.
  ctx.strokeStyle = "rgba(122,144,186,.26)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-16, -79);
  ctx.lineTo(-15, -40);
  ctx.moveTo(16, -79);
  ctx.lineTo(15, -40);
  ctx.stroke();

  // Scarf.
  ctx.fillStyle = "#c34a5c";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.1;
  rr(ctx, -14.5, -88, 29, 9.5, 4.2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(7, -80);
  ctx.bezierCurveTo(13, -72, 9.5, -60, 12.5, -53);
  ctx.lineTo(6.5, -51);
  ctx.bezierCurveTo(4.2, -62, 7.2, -70, 3.5, -80);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,190,180,.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(8.5, -77);
  ctx.lineTo(9.8, -58);
  ctx.stroke();

  // Front arm.
  ctx.save();
  ctx.translate(1, 0);
  let hx = 19 - armSwing * 0.3;
  let hy = -48 - armSwing;
  let sx = 14.5;
  let sy = -77;
  if (pose === "hug") {
    hx = 26;
    hy = -61;
    sx = 14;
    sy = -75;
  } else if (pose === "reach") {
    hx = 27;
    hy = -55;
  } else if (pose === "up") {
    hx = 14;
    hy = -100;
  }
  capsule(ctx, sx, sy, hx, hy, 5.2, "#2b3552", 2.3);
  ctx.fillStyle = "#ecd9cb";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.arc(hx + 1, hy - 1, 4.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Neck.
  ctx.fillStyle = "#e6c9bd";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  rr(ctx, -5.5, -96, 11, 13, 4);
  ctx.fill();
  ctx.stroke();

  // Head.
  drawSrifHead(ctx, 1.5, -107, 20, mood, 1, t);

  // Tiny snow dusting.
  ctx.fillStyle = "rgba(244,241,255,.55)";
  ctx.beginPath();
  ctx.arc(-8, -123, 1.2, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(9.8, -124.5, 0.9, 0, TAU);
  ctx.fill();

  ctx.restore();
}

export function drawChris(ctx, x, y, S, opts = {}) {
  const t = opts.t || 0;
  const walk = opts.walking ? Math.sin((opts.phase || 0) * 1.8) : 0;
  const bob = opts.walking ? Math.abs(Math.cos((opts.phase || 0) * 1.8)) * 1.7 : Math.sin(t * 1.9 + 1) * 0.6;
  const face = opts.facing ?? 1;
  const mood = opts.mood || "smile";
  const pose = opts.pose || "idle";

  drawShadow(ctx, x, y + 1, 23 * S, 0.32);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S * face, S);
  ctx.translate(0, -bob);

  // Legs.
  [1, -1].forEach((side, i) => {
    ctx.save();
    ctx.translate(side * 7, -34);
    ctx.rotate(opts.walking ? walk * (i ? -0.32 : 0.32) : 0);
    capsule(ctx, 0, 0, 0, 26, 5.2, "#34312f", 2.2);
    boot(ctx, 0, 38, 8.7, 5, "#261f21");
    ctx.restore();
  });

  // Tail.
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-17, -53);
  ctx.quadraticCurveTo(-29, -58, -26, -69);
  ctx.stroke();
  ctx.strokeStyle = "#b97a51";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-17, -53);
  ctx.quadraticCurveTo(-29, -58, -26, -69);
  ctx.stroke();

  // Coat body.
  ctx.fillStyle = "#2f695f";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  rr(ctx, -19, -84, 38, 52, 10);
  ctx.fill();
  ctx.stroke();

  // Coat front opening + cream sweater.
  ctx.fillStyle = "#e8d4b3";
  ctx.beginPath();
  ctx.moveTo(-5.5, -81);
  ctx.lineTo(5.5, -81);
  ctx.lineTo(7, -35);
  ctx.lineTo(-7, -35);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(16,12,25,.7)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Fluffy collar.
  ctx.fillStyle = "#f1e4ca";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.moveTo(-14.5, -84);
  ctx.quadraticCurveTo(-9, -93, -3.5, -86);
  ctx.quadraticCurveTo(0, -93, 4, -86);
  ctx.quadraticCurveTo(9.3, -93, 14.5, -84);
  ctx.quadraticCurveTo(7, -78, -14.5, -84);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Scarf.
  ctx.fillStyle = "#c34d59";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  rr(ctx, -13, -91, 26, 9, 4);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10, -84);
  ctx.bezierCurveTo(-13, -72, -9, -65, -12, -57);
  ctx.lineTo(-6.5, -56);
  ctx.bezierCurveTo(-3.8, -66, -6, -74, -4.8, -84);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Arms.
  ctx.save();
  ctx.translate(0, 0);
  const swing = opts.walking ? walk * 4 : 0;
  let hx = 19 - swing;
  let hy = -46 + swing * 0.4;
  if (pose === "hug") {
    hx = 25;
    hy = -62;
  } else if (pose === "wave") {
    hx = 24;
    hy = -100;
  }
  capsule(ctx, 14.5, -77, hx, hy, 5.1, "#2a6158", 2.3);
  ctx.fillStyle = "#bd7d54";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.arc(hx + 1, hy - 1, 4.1, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(0, 0);
  const swing2 = opts.walking ? -walk * 4 : 0;
  let bx = -19 - swing2;
  let by = -46 + swing2 * 0.4;
  if (pose === "hug") {
    bx = -25;
    by = -62;
  }
  capsule(ctx, -14.5, -77, bx, by, 5.1, "#25564f", 2.3);
  ctx.fillStyle = "#bd7d54";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.arc(bx - 1, by - 1, 4.1, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Neck + head.
  ctx.fillStyle = "#b97a51";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  rr(ctx, -5, -96, 10, 12, 3.5);
  ctx.fill();
  ctx.stroke();
  drawChrisHead(ctx, 0.5, -107, 20, pose === "hug" ? "hug" : mood, 1, t);

  ctx.restore();
}

export function drawMich(ctx, x, y, S, opts = {}) {
  const t = opts.t || 0;
  const face = opts.facing ?? 1;
  const mood = opts.mood || "tough";
  const pose = opts.pose || "idle";
  const walk = opts.walking ? Math.sin((opts.phase || 0) * 1.7) : 0;
  const bob = opts.walking ? Math.abs(Math.cos((opts.phase || 0) * 1.7)) * 1.3 : Math.sin(t * 1.5 + 2) * 0.45;

  drawShadow(ctx, x, y + 1, 27 * S, 0.36);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S * face, S);
  ctx.translate(0, -bob);

  // Tail.
  const sway = Math.sin(t * 2.2) * 7;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6.5;
  ctx.beginPath();
  ctx.moveTo(-20, -48);
  ctx.bezierCurveTo(-35, -48, -35, -67 + sway * 0.4, -44, -63 + sway);
  ctx.stroke();
  ctx.strokeStyle = "#c77837";
  ctx.lineWidth = 4.1;
  ctx.stroke();
  ctx.strokeStyle = "#3f2622";
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-28 - i * 4.5, -53 - i * 2.5 + sway * 0.15);
    ctx.lineTo(-28 - i * 4.5, -59 - i * 2.5 + sway * 0.15);
    ctx.stroke();
  }

  // Legs.
  [1, -1].forEach((side, i) => {
    ctx.save();
    ctx.translate(side * 9, -38);
    ctx.rotate(opts.walking ? walk * (i ? -0.3 : 0.3) : 0);
    capsule(ctx, 0, 0, 0, 28, 6.2, "#191820", 2.4);
    boot(ctx, 0, 42, 10, 5.5, "#111015");
    ctx.restore();
  });

  // Bulky jacket.
  ctx.fillStyle = "#191820";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  rr(ctx, -24, -86, 48, 53, 12);
  ctx.fill();
  ctx.stroke();

  // Jacket quilting.
  ctx.strokeStyle = "rgba(120,115,140,.18)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-18 + i * 13, -82);
    ctx.lineTo(-19 + i * 13, -38);
    ctx.stroke();
  }

  // Orange chest fur.
  ctx.fillStyle = "#cf7c38";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.moveTo(-10, -86);
  ctx.lineTo(10, -86);
  ctx.lineTo(8, -68);
  ctx.lineTo(1, -62);
  ctx.lineTo(-6, -68);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#3d241f";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-4, -80);
  ctx.lineTo(-1, -73);
  ctx.moveTo(3.5, -79);
  ctx.lineTo(1.2, -72);
  ctx.stroke();

  // Zipper.
  ctx.strokeStyle = "#6d6677";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, -84);
  ctx.lineTo(10, -42);
  ctx.stroke();

  // Arms crossed.
  if (pose === "crossed" || pose === "idle") {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.fillStyle = "#20202a";
    capsule(ctx, -20, -72, 4, -58, 6.3, "#20202a", 2.4);
    capsule(ctx, 20, -72, -4, -55, 6.3, "#20202a", 2.4);
    ctx.fillStyle = "#d0803d";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(7, -57, 4.8, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-8, -54, 4.8, 0, TAU);
    ctx.fill();
    ctx.stroke();
  } else if (pose === "pin") {
    capsule(ctx, 16, -78, 37, -66, 6.2, "#20202a", 2.4);
    ctx.fillStyle = "#d0803d";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(40, -65, 5.2, 0, TAU);
    ctx.fill();
    ctx.stroke();
  } else {
    capsule(ctx, 18, -77, 22, -44, 6.1, "#20202a", 2.4);
    capsule(ctx, -18, -77, -22, -44, 6.1, "#20202a", 2.4);
  }

  // Neck + head.
  ctx.fillStyle = "#c47736";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  rr(ctx, -6, -98, 12, 14, 4);
  ctx.fill();
  ctx.stroke();
  drawMichHead(ctx, 0, -110, 21, mood, 1, t);

  ctx.restore();
}

export function drawAsgore(ctx, x, y, S, opts = {}) {
  const t = opts.t || 0;
  const face = opts.facing ?? 1;
  const bob = Math.sin(t * 1.3) * 0.4;
  drawShadow(ctx, x, y + 1, 32 * S, 0.36);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S * face, S);
  ctx.translate(0, -bob);

  // Legs.
  [-1, 1].forEach((side) => {
    capsule(ctx, side * 10, -44, side * 11, -3, 7, "#1a2238", 2.5);
    boot(ctx, side * 11, 4, 11, 5.5, "#11121c");
  });

  // Broad police coat.
  ctx.fillStyle = "#1e2c49";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.7;
  ctx.beginPath();
  ctx.moveTo(-27, -96);
  ctx.quadraticCurveTo(-33, -70, -28, -37);
  ctx.lineTo(28, -37);
  ctx.quadraticCurveTo(33, -70, 27, -96);
  ctx.quadraticCurveTo(12, -105, 0, -101);
  ctx.quadraticCurveTo(-12, -105, -27, -96);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Coat opening + belt.
  ctx.fillStyle = "#17233b";
  ctx.beginPath();
  ctx.moveTo(-6, -96);
  ctx.lineTo(6, -96);
  ctx.lineTo(7, -38);
  ctx.lineTo(-7, -38);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(130,151,186,.25)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = "#3c2e23";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  rr(ctx, -27, -52, 54, 10, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#d3ad5e";
  rr(ctx, -4, -52, 9, 10, 1);
  ctx.fill();
  ctx.stroke();

  // Gold buttons.
  ctx.fillStyle = "#d8b766";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(-15, -84 + i * 10, 1.8, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(15, -84 + i * 10, 1.8, 0, TAU);
    ctx.fill();
  }

  // Badge.
  star(ctx, -18, -86, 4.4, "#f0ca6f");
  ctx.strokeStyle = "#5f4a22";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(-18, -86, 4.4, 0, TAU);
  ctx.stroke();

  // Arms.
  capsule(ctx, -25, -91, -31, -52, 7.2, "#1b2944", 2.6);
  capsule(ctx, 25, -91, 31, -52, 7.2, "#1b2944", 2.6);
  ctx.fillStyle = "#d7b98d";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(-31, -48, 6.4, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(31, -48, 6.4, 0, TAU);
  ctx.fill();
  ctx.stroke();

  // Neck + head.
  ctx.fillStyle = "#d7b98d";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.9;
  rr(ctx, -7, -106, 14, 16, 4);
  ctx.fill();
  ctx.stroke();
  drawAsgoreHead(ctx, 0, -124, 25, opts.mood || "kind", 1, t);

  ctx.restore();
}

export function drawToriel(ctx, x, y, S, opts = {}) {
  const t = opts.t || 0;
  const face = opts.facing ?? 1;
  const walk = opts.walking ? Math.sin((opts.phase || 0) * 1.6) : 0;
  const bob = Math.sin(t * 1.4 + 1) * 0.5;
  drawShadow(ctx, x, y + 1, 27 * S, 0.32);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S * face, S);
  ctx.translate(0, -bob);

  // Legs.
  [-1, 1].forEach((side, i) => {
    ctx.save();
    ctx.translate(side * 7, -38);
    ctx.rotate(opts.walking ? walk * (i ? -0.26 : 0.26) : 0);
    capsule(ctx, 0, 0, 0, 27, 5.3, "#3c2f48", 2.2);
    boot(ctx, 0, 39, 8.6, 4.7, "#201b27");
    ctx.restore();
  });

  // Long coat.
  ctx.fillStyle = "#5b4364";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-19, -86);
  ctx.quadraticCurveTo(-25, -66, -24, -27);
  ctx.quadraticCurveTo(-14, -20, 0, -24);
  ctx.quadraticCurveTo(14, -20, 24, -27);
  ctx.quadraticCurveTo(25, -66, 19, -86);
  ctx.quadraticCurveTo(8, -92, 0, -90);
  ctx.quadraticCurveTo(-8, -92, -19, -86);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Coat front and buttons.
  ctx.fillStyle = "#493652";
  ctx.beginPath();
  ctx.moveTo(-5, -86);
  ctx.lineTo(5, -86);
  ctx.lineTo(7, -25);
  ctx.lineTo(-7, -25);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(220,195,225,.16)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#c9a360";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(0, -76 + i * 13, 1.5, 0, TAU);
    ctx.fill();
  }

  // Fur trim.
  ctx.fillStyle = "#d7c7d6";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(-19, -84);
  ctx.quadraticCurveTo(-8, -94, 0, -88);
  ctx.quadraticCurveTo(8, -94, 19, -84);
  ctx.quadraticCurveTo(8, -78, -19, -84);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Scarf.
  ctx.fillStyle = "#a3495a";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  rr(ctx, -14, -93, 28, 9.5, 4);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-8, -86);
  ctx.bezierCurveTo(-12, -75, -9, -67, -13, -60);
  ctx.lineTo(-7.5, -59);
  ctx.bezierCurveTo(-3.5, -68, -6, -76, -4, -86);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Arms + shopping bag.
  const armSwing = opts.walking ? walk * 2.6 : 0;
  capsule(ctx, -17, -79, -25 + armSwing, -48, 5.6, "#553e5f", 2.3);
  capsule(ctx, 17, -79, 25 - armSwing, -48, 5.6, "#553e5f", 2.3);
  ctx.fillStyle = "#cdb5cd";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.arc(-25 + armSwing, -45, 4.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(25 - armSwing, -45, 4.2, 0, TAU);
  ctx.fill();
  ctx.stroke();

  if (opts.bag !== false) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(27, -43, 6, Math.PI * 0.95, Math.PI * 2.05);
    ctx.stroke();
    ctx.fillStyle = "#c49d63";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    rr(ctx, 18, -41, 19, 18, 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(83,61,35,.6)";
    ctx.beginPath();
    ctx.moveTo(27.5, -39);
    ctx.lineTo(27.5, -27);
    ctx.stroke();
  }

  // Neck + head.
  ctx.fillStyle = "#cdb3d0";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  rr(ctx, -6, -102, 12, 14, 4);
  ctx.fill();
  ctx.stroke();
  drawTorielHead(ctx, 0, -119, 24, opts.mood || "warm", 1, t);

  ctx.restore();
}

export const SPRITES = {
  srif: drawSrif,
  chris: drawChris,
  mich: drawMich,
  asgore: drawAsgore,
  toriel: drawToriel,
};
