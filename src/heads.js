/* Character head studies — used by both sprites and dialogue portraits. */
import { TAU, INK, C, fillStroke, ellipse, poly, rr, heartPath } from "./draw-utils.js";

function eyeShine(ctx, x, y, r = 1.4) {
  ctx.fillStyle = "#fff9e8";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

function srifEyes(ctx, mood) {
  const eyeY = 1.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (mood === "smile" || mood === "hug") {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.arc(-6.4, eyeY + 1.6, 3.4, Math.PI * 1.10, Math.PI * 1.90);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(6.8, eyeY + 1.6, 3.4, Math.PI * 1.10, Math.PI * 1.90);
    ctx.stroke();
    return;
  }

  if (mood === "hurt") {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(-9.5, eyeY - 1.3);
    ctx.lineTo(-4.2, eyeY + 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(7, eyeY, 2.8, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5.6, eyeY + 2.4);
    ctx.lineTo(8.4, eyeY + 1.3);
    ctx.stroke();
    return;
  }

  if (mood === "shock") {
    ctx.fillStyle = "#fff8e9";
    ellipse(ctx, -6.4, eyeY, 3.6, 4.2);
    ctx.fill();
    ellipse(ctx, 7, eyeY, 3.6, 4.2);
    ctx.fill();
    ctx.fillStyle = "#9e4a3e";
    ctx.beginPath();
    ctx.arc(-6.2, eyeY + 0.2, 1.8, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7.2, eyeY + 0.2, 1.8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(-6.2, eyeY + 0.2, 0.8, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7.2, eyeY + 0.2, 0.8, 0, TAU);
    ctx.fill();
    return;
  }

  if (mood === "empty") {
    ctx.fillStyle = "#2a2438";
    ellipse(ctx, -6.4, eyeY, 3.5, 2.2);
    ctx.fill();
    ellipse(ctx, 7, eyeY, 3.5, 2.2);
    ctx.fill();
    ctx.fillStyle = "rgba(12,9,18,.8)";
    ctx.beginPath();
    ctx.arc(-6.4, eyeY - 2.3, 3.5, Math.PI, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7, eyeY - 2.3, 3.5, Math.PI, TAU);
    ctx.fill();
    return;
  }

  const half = mood === "soft" || mood === "sad";
  ctx.fillStyle = "#fff9ec";
  ellipse(ctx, -6.4, eyeY, 3.2, half ? 2.2 : 3.4);
  ctx.fill();
  ellipse(ctx, 7, eyeY, 3.2, half ? 2.2 : 3.4);
  ctx.fill();

  ctx.fillStyle = "#9c4e43";
  ctx.beginPath();
  ctx.arc(-6.2, eyeY + 0.2, 1.75, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(7.2, eyeY + 0.2, 1.75, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#211a27";
  ctx.beginPath();
  ctx.arc(-6.2, eyeY + 0.3, 0.85, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(7.2, eyeY + 0.3, 0.85, 0, TAU);
  ctx.fill();
  eyeShine(ctx, -5.5, eyeY - 0.8, 0.75);
  eyeShine(ctx, 7.9, eyeY - 0.8, 0.75);

  ctx.strokeStyle = "#2a2030";
  ctx.lineWidth = 1.3;
  if (half) {
    ctx.beginPath();
    ctx.moveTo(-9.6, eyeY - 1.9);
    ctx.lineTo(-3.3, eyeY - 1.2);
    ctx.moveTo(3.9, eyeY - 1.2);
    ctx.lineTo(10, eyeY - 1.9);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-9.1, eyeY - 3.1);
    ctx.quadraticCurveTo(-6.5, eyeY - 4.1, -3.8, eyeY - 2.8);
    ctx.moveTo(4.5, eyeY - 2.8);
    ctx.quadraticCurveTo(7.2, eyeY - 4.1, 9.8, eyeY - 3.1);
    ctx.stroke();
  }

  if (mood === "sad") {
    ctx.strokeStyle = "#3b2a34";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-8.6, eyeY - 3.4);
    ctx.lineTo(-4.2, eyeY - 4.4);
    ctx.moveTo(4.8, eyeY - 4.4);
    ctx.lineTo(9.2, eyeY - 3.4);
    ctx.stroke();
    ctx.fillStyle = "rgba(154,205,255,.55)";
    ellipse(ctx, 7.3, eyeY + 4.7, 1.1, 2.2);
    ctx.fill();
  }
}

function srifMouth(ctx, mood) {
  ctx.strokeStyle = "#6d3942";
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  let y = 11.2;
  if (mood === "smile" || mood === "hug") {
    ctx.beginPath();
    ctx.arc(1.2, y - 0.7, 3.6, 0.12, Math.PI - 0.12);
    ctx.stroke();
  } else if (mood === "sad") {
    ctx.beginPath();
    ctx.moveTo(-1.8, y + 0.9);
    ctx.quadraticCurveTo(1.2, y - 0.3, 4.4, y + 0.8);
    ctx.stroke();
  } else if (mood === "hurt" || mood === "shock") {
    ctx.fillStyle = "#4b2630";
    ellipse(ctx, 1.3, y + 0.6, 2.4, 2.4);
    ctx.fill();
  } else if (mood === "empty") {
    ctx.beginPath();
    ctx.moveTo(-1.6, y);
    ctx.lineTo(4.2, y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-1.4, y - 0.2);
    ctx.quadraticCurveTo(1.3, y + 1.2, 4, y - 0.2);
    ctx.stroke();
  }
}

export function drawSrifHead(ctx, x, y, r, mood = "neutral", face = 1, t = 0) {
  const sc = r / 20;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc * face, sc);

  // Hair silhouette.
  ctx.fillStyle = "#211d31";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-17.2, -9.5);
  ctx.bezierCurveTo(-20.8, -18.8, -14.9, -25, -5.8, -24.1);
  ctx.bezierCurveTo(4.6, -26.5, 18.4, -19.5, 18.2, -7.5);
  ctx.bezierCurveTo(16.1, -2.2, 15.1, 2.2, 14.2, 6.7);
  ctx.lineTo(12.1, 1.2);
  ctx.lineTo(10.2, -3.8);
  ctx.lineTo(6.3, 2.1);
  ctx.lineTo(2.9, -4.2);
  ctx.lineTo(-1.7, 2.4);
  ctx.lineTo(-5.8, -5.4);
  ctx.lineTo(-10.1, 1.8);
  ctx.lineTo(-14.7, -3.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Ears.
  ctx.fillStyle = "#dfc3b6";
  ellipse(ctx, -16.8, 2.5, 4.6, 6.1, -0.2);
  ctx.fill();
  ctx.stroke();
  ellipse(ctx, 16.4, 2.2, 3.7, 5.5, 0.2);
  ctx.fill();
  ctx.stroke();

  // Face.
  const faceGrad = ctx.createLinearGradient(0, -17, 0, 20);
  faceGrad.addColorStop(0, "#f5e4d7");
  faceGrad.addColorStop(1, "#e6c9bd");
  ctx.fillStyle = faceGrad;
  ctx.beginPath();
  ctx.moveTo(-16.2, -12.5);
  ctx.bezierCurveTo(-18.4, -2.2, -13.8, 13.2, -2.7, 18.5);
  ctx.bezierCurveTo(4.9, 21.7, 15.9, 15.3, 17.3, 2.1);
  ctx.bezierCurveTo(18.2, -8.2, 11.7, -16.6, 0.6, -17.3);
  ctx.bezierCurveTo(-8.4, -17.9, -13.7, -14.2, -16.2, -12.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Warm blush.
  ctx.fillStyle = "rgba(214,112,111,.14)";
  ellipse(ctx, -10.3, 7.1, 4.9, 2.5);
  ctx.fill();
  ellipse(ctx, 10.1, 6.5, 4.5, 2.3);
  ctx.fill();

  // Hair fringe — one long lock hides the far eye.
  ctx.fillStyle = "#292438";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-17, -14.8);
  ctx.bezierCurveTo(-11, -24.2, 4.4, -25.9, 16.6, -16.2);
  ctx.lineTo(15.8, -11.5);
  ctx.bezierCurveTo(12.8, -15.2, 10.6, -14.2, 8.5, -10.3);
  ctx.bezierCurveTo(5.7, -16.1, 2.2, -15.7, -0.4, -9.9);
  ctx.bezierCurveTo(-3.8, -15.9, -8.2, -15.4, -10.6, -7.8);
  ctx.bezierCurveTo(-13.2, -13.4, -15.2, -13.8, -17, -14.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Signature cowlick.
  ctx.strokeStyle = "#292438";
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(3.2, -23.5);
  ctx.bezierCurveTo(6.1, -30.2, 13.2, -29, 12.8, -23.9);
  ctx.stroke();

  // Eye shadow beneath the fringe.
  ctx.fillStyle = "rgba(79,60,77,.17)";
  ellipse(ctx, 7.6, 1.2, 6.7, 3.4);
  ctx.fill();

  srifEyes(ctx, mood);

  // Nose.
  ctx.strokeStyle = "rgba(111,70,69,.6)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(5.2, 5.6);
  ctx.quadraticCurveTo(6.7, 7.1, 4.8, 7.5);
  ctx.stroke();

  srifMouth(ctx, mood);

  // The tiny mark he never explains.
  ctx.strokeStyle = "rgba(204,94,95,.55)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(11.1, 0.3);
  ctx.lineTo(12.3, 2.2);
  ctx.lineTo(11.4, 3.6);
  ctx.stroke();

  ctx.restore();
}

function chrisEyes(ctx, mood) {
  const happy = mood === "smile" || mood === "hug" || mood === "neutral";
  if (mood === "sad") {
    ctx.fillStyle = "#2c1d21";
    ellipse(ctx, -5.2, 0.2, 2.6, 3);
    ctx.fill();
    ellipse(ctx, 8.5, 0.2, 2.6, 3);
    ctx.fill();
    eyeShine(ctx, -4.5, -0.8, 0.75);
    eyeShine(ctx, 9.2, -0.8, 0.75);
    ctx.strokeStyle = "#4b3033";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-8.6, -3.5);
    ctx.lineTo(-2.2, -4.5);
    ctx.moveTo(5.3, -4.5);
    ctx.lineTo(11.6, -3.5);
    ctx.stroke();
    return;
  }
  if (happy) {
    ctx.strokeStyle = "#2a1a20";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(-4.7, 0, 3.6, Math.PI * 0.08, Math.PI * 0.92);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(9, 0, 3.6, Math.PI * 0.08, Math.PI * 0.92);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = "#2a1a20";
  ellipse(ctx, -4.7, 0.4, 2.9, 3.5);
  ctx.fill();
  ellipse(ctx, 9, 0.4, 2.9, 3.5);
  ctx.fill();
  eyeShine(ctx, -4, -0.7, 0.9);
  eyeShine(ctx, 9.7, -0.7, 0.9);
}

export function drawChrisHead(ctx, x, y, r, mood = "smile", face = 1, t = 0) {
  const sc = r / 20;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc * face, sc);

  // Antlers behind the head.
  const antler = (sx) => {
    ctx.strokeStyle = "#513829";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx * 8.5, -17);
    ctx.bezierCurveTo(sx * 11, -25, sx * 15, -28, sx * 17, -35);
    ctx.moveTo(sx * 13.2, -26.4);
    ctx.lineTo(sx * 20.2, -29.5);
    ctx.moveTo(sx * 15.7, -30.4);
    ctx.lineTo(sx * 19.4, -38.8);
    ctx.stroke();
  };
  antler(-1);
  antler(1);

  // Ears.
  ctx.fillStyle = "#b77850";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ellipse(ctx, -19.2, 2.3, 9.2, 4.3, -0.24);
  ctx.fill();
  ctx.stroke();
  ellipse(ctx, 20.2, 2.3, 9.2, 4.3, 0.24);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#d99b76";
  ellipse(ctx, -20.8, 2.2, 5.8, 2.4, -0.24);
  ctx.fill();
  ellipse(ctx, 21.8, 2.2, 5.8, 2.4, 0.24);
  ctx.fill();

  // Face.
  const fg = ctx.createLinearGradient(0, -18, 0, 20);
  fg.addColorStop(0, "#c88b5f");
  fg.addColorStop(1, "#b97851");
  ctx.fillStyle = fg;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-15.8, -14.8);
  ctx.bezierCurveTo(-20.6, -3.2, -16.8, 12.4, -3.7, 18.7);
  ctx.bezierCurveTo(7.8, 23.7, 19.5, 14, 19.4, 0.8);
  ctx.bezierCurveTo(19.4, -11.2, 11.7, -19.2, -1.6, -19.1);
  ctx.bezierCurveTo(-9.7, -18.9, -14.1, -17.2, -15.8, -14.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Forehead tuft.
  ctx.fillStyle = "#6e4936";
  ctx.beginPath();
  ctx.moveTo(-9.4, -17.5);
  ctx.bezierCurveTo(-5.9, -24.6, 5.1, -24.3, 8.4, -17.9);
  ctx.bezierCurveTo(2.8, -19.6, 1.2, -16.4, -1.5, -15);
  ctx.bezierCurveTo(-4.1, -17, -6.6, -16.2, -9.4, -17.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Muzzle.
  ctx.fillStyle = "#f1d3ad";
  ellipse(ctx, 3.7, 6, 10.4, 8.1);
  ctx.fill();
  ctx.strokeStyle = "rgba(68,42,33,.28)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Nose + smile.
  ctx.fillStyle = "#3b2522";
  rr(ctx, 5.1, 1.4, 5.4, 3.3, 1.8);
  ctx.fill();
  ctx.strokeStyle = "#4a2a25";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(7.7, 4.7);
  ctx.lineTo(7.7, 6.3);
  ctx.quadraticCurveTo(4.3, 9.4, 0.7, 6.2);
  ctx.stroke();
  if (mood === "smile" || mood === "hug") {
    ctx.fillStyle = "#5a2a2d";
    ctx.beginPath();
    ctx.arc(4.6, 8.1, 1.1, 0, Math.PI);
    ctx.fill();
  }

  // Freckles.
  ctx.fillStyle = "rgba(87,51,38,.5)";
  [[-3.4, 4.7], [-1.4, 7], [-6.1, 7.4], [10.2, 7.1], [12.4, 5.2]].forEach(([fx, fy]) => {
    ctx.beginPath();
    ctx.arc(fx, fy, 0.62, 0, TAU);
    ctx.fill();
  });

  chrisEyes(ctx, mood);

  // Blush.
  ctx.fillStyle = "rgba(212,106,102,.18)";
  ellipse(ctx, -9.4, 6.8, 3.8, 2);
  ctx.fill();

  ctx.restore();
}

export function drawMichHead(ctx, x, y, r, mood = "tough", face = 1, t = 0) {
  const sc = r / 20;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc * face, sc);

  // Ears.
  ctx.fillStyle = "#b96d35";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ellipse(ctx, -16.3, -10.8, 6.4, 5.3, -0.4);
  ctx.fill();
  ctx.stroke();
  ellipse(ctx, 16.6, -10.8, 6.4, 5.3, 0.4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#4a2d28";
  ellipse(ctx, -17, -10.5, 3.1, 2.5, -0.4);
  ctx.fill();
  ellipse(ctx, 17.2, -10.5, 3.1, 2.5, 0.4);
  ctx.fill();

  // Face.
  const fg = ctx.createLinearGradient(0, -16, 0, 20);
  fg.addColorStop(0, "#df8d44");
  fg.addColorStop(1, "#c87635");
  ctx.fillStyle = fg;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-16.1, -12.2);
  ctx.bezierCurveTo(-20.1, 0.7, -15.4, 15.7, -3.1, 19.4);
  ctx.bezierCurveTo(7.9, 22.6, 18.8, 14.2, 19.2, 1.1);
  ctx.bezierCurveTo(19.7, -9.6, 11.7, -18.4, -1.4, -18.4);
  ctx.bezierCurveTo(-9.5, -18.5, -14.3, -15.7, -16.1, -12.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tiger stripes.
  ctx.strokeStyle = "#3d241f";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  const stripes = [
    [-12.8, -8.3, -8.2, -6.8],
    [-14.4, -3.1, -9.7, -2.2],
    [1.3, -17.1, 1.8, -13.2],
    [7.7, -16.1, 7.2, -12.4],
    [-13.9, 11.7, -9.5, 9.9],
  ];
  stripes.forEach(([a, b, c2, d]) => {
    ctx.beginPath();
    ctx.moveTo(a, b);
    ctx.lineTo(c2, d);
    ctx.stroke();
  });

  // Muzzle.
  ctx.fillStyle = "#f1d9b8";
  ellipse(ctx, 2.7, 7, 11, 8.2);
  ctx.fill();
  ctx.strokeStyle = "rgba(55,33,28,.35)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Nose.
  ctx.fillStyle = "#34201e";
  poly(ctx, [[0.3, 2.7], [5.8, 2.7], [4.1, 5], [2, 5]]);
  ctx.fill();
  ctx.strokeStyle = "#462722";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(3.7, 5.4);
  ctx.quadraticCurveTo(0.5, 8.6, -2.2, 5.7);
  ctx.moveTo(3.7, 5.4);
  ctx.quadraticCurveTo(7.1, 8.3, 9.9, 5);
  ctx.stroke();

  // Eyes.
  const soft = mood === "soft" || mood === "sad";
  const wide = mood === "shock" || mood === "hurt";
  ctx.fillStyle = wide ? "#f6f1de" : "#e7d29a";
  if (wide) {
    ellipse(ctx, -5.1, 0.2, 4, 4.8);
    ctx.fill();
    ellipse(ctx, 8.5, 0.2, 4, 4.8);
    ctx.fill();
  } else {
    ellipse(ctx, -5.1, 0.7, 3.4, soft ? 2 : 3.1);
    ctx.fill();
    ellipse(ctx, 8.5, 0.7, 3.4, soft ? 2 : 3.1);
    ctx.fill();
  }
  ctx.fillStyle = "#2a1c1a";
  ctx.beginPath();
  ctx.arc(-5.1, 1, 1.55, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8.5, 1, 1.55, 0, TAU);
  ctx.fill();
  eyeShine(ctx, -4.5, 0.1, 0.65);
  eyeShine(ctx, 9.1, 0.1, 0.65);

  // Heavy brows.
  ctx.strokeStyle = "#3a221d";
  ctx.lineWidth = 2;
  if (soft) {
    ctx.beginPath();
    ctx.moveTo(-9, -3.5);
    ctx.lineTo(-2.6, -2.7);
    ctx.moveTo(5.6, -2.7);
    ctx.lineTo(12, -3.5);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-9.4, -2.4);
    ctx.lineTo(-2.4, -3.6);
    ctx.moveTo(5.3, -3.6);
    ctx.lineTo(12.4, -2.2);
    ctx.stroke();
  }

  // Fangs.
  ctx.fillStyle = "#fff5dc";
  poly(ctx, [[-0.5, 9.1], [1.2, 9.1], [0.4, 11.2]]);
  ctx.fill();
  poly(ctx, [[7.1, 9.1], [8.8, 9.1], [8.1, 11.2]]);
  ctx.fill();

  // Ushanka.
  ctx.fillStyle = "#17151d";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(-19.5, -12.8);
  ctx.bezierCurveTo(-19.7, -24.2, -10.2, -29.4, 0.8, -29.2);
  ctx.bezierCurveTo(12.1, -29, 20.1, -23.4, 19.8, -12.1);
  ctx.lineTo(18.4, -8.8);
  ctx.bezierCurveTo(11.9, -13.6, -10.6, -14, -18.1, -8.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hat flaps.
  ctx.fillStyle = "#201c26";
  ctx.beginPath();
  ctx.moveTo(-20.2, -13.6);
  ctx.lineTo(-17.1, -11.6);
  ctx.lineTo(-16.4, 2.2);
  ctx.quadraticCurveTo(-17.4, 6.1, -20, 4.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(20.1, -13.5);
  ctx.lineTo(17.3, -11.4);
  ctx.lineTo(16.8, 2.1);
  ctx.quadraticCurveTo(17.8, 5.9, 20.1, 3.9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Fur trim.
  ctx.strokeStyle = "#504b58";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-19.7, -13);
  ctx.quadraticCurveTo(-10, -17.4, 0.4, -16.7);
  ctx.quadraticCurveTo(11.3, -17.3, 19.7, -12.7);
  ctx.stroke();

  // Scuffed white patch on the hat.
  ctx.fillStyle = "#d9d1bf";
  ctx.beginPath();
  ctx.arc(13.3, -22.5, 2.1, 0, TAU);
  ctx.fill();

  ctx.restore();
}

export function drawAsgoreHead(ctx, x, y, r, mood = "kind", face = 1, t = 0) {
  const sc = r / 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc * face, sc);

  // Horns.
  ctx.fillStyle = "#d8c29e";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(-16.5, -20);
  ctx.bezierCurveTo(-27, -27, -28, -14.8, -17.8, -9.8);
  ctx.bezierCurveTo(-22.8, -17.4, -20.9, -21.7, -13.8, -17.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(16.5, -20);
  ctx.bezierCurveTo(27, -27, 28, -14.8, 17.8, -9.8);
  ctx.bezierCurveTo(22.8, -17.4, 20.9, -21.7, 13.8, -17.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Ears.
  ctx.fillStyle = "#d7b98d";
  ellipse(ctx, -21, 1.5, 8.7, 4.7, -0.35);
  ctx.fill();
  ctx.stroke();
  ellipse(ctx, 21, 1.5, 8.7, 4.7, 0.35);
  ctx.fill();
  ctx.stroke();

  // Face.
  const fg = ctx.createLinearGradient(0, -20, 0, 22);
  fg.addColorStop(0, "#e5cca7");
  fg.addColorStop(1, "#cda97e");
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(-18.5, -15.2);
  ctx.bezierCurveTo(-23.4, -2.5, -19.1, 15.3, -6.7, 21.8);
  ctx.bezierCurveTo(4.5, 27.4, 20.1, 18.6, 20.7, 2.2);
  ctx.bezierCurveTo(21.2, -10.5, 13, -20.2, -1, -20.6);
  ctx.bezierCurveTo(-10.4, -20.8, -16.3, -18.1, -18.5, -15.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Muzzle.
  ctx.fillStyle = "#f1ddb8";
  ellipse(ctx, 2.6, 7.1, 12.6, 9.9);
  ctx.fill();
  ctx.strokeStyle = "rgba(66,43,33,.3)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Nose.
  ctx.fillStyle = "#3b2927";
  rr(ctx, 3.7, 1.1, 6.4, 3.8, 2);
  ctx.fill();

  // Mouth + beard.
  ctx.strokeStyle = "#51352a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(7.2, 5.2);
  ctx.quadraticCurveTo(3.4, 9.9, -1.2, 6.2);
  ctx.stroke();
  ctx.fillStyle = "#d0ad75";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-12.5, 10.5);
  ctx.bezierCurveTo(-6.2, 28.2, 14.5, 28.7, 18.3, 9.1);
  ctx.bezierCurveTo(9.7, 15.3, -3.2, 16.6, -12.5, 10.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#b08a59";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-5.6, 14.5);
  ctx.lineTo(-4, 21.2);
  ctx.moveTo(1.7, 15.8);
  ctx.lineTo(2.4, 23.1);
  ctx.moveTo(9.5, 14.8);
  ctx.lineTo(11.2, 21.3);
  ctx.stroke();

  // Eyes.
  const stern = mood === "stern";
  ctx.fillStyle = "#f9edcf";
  ellipse(ctx, -5.7, 0.1, 3.7, 4.1);
  ctx.fill();
  ellipse(ctx, 8.6, 0.1, 3.7, 4.1);
  ctx.fill();
  ctx.fillStyle = "#5c4740";
  ctx.beginPath();
  ctx.arc(-5.5, 0.6, 1.9, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8.8, 0.6, 1.9, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#20191c";
  ctx.beginPath();
  ctx.arc(-5.5, 0.7, 0.9, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8.8, 0.7, 0.9, 0, TAU);
  ctx.fill();
  eyeShine(ctx, -4.9, -0.2, 0.7);
  eyeShine(ctx, 9.4, -0.2, 0.7);

  ctx.strokeStyle = "#684a35";
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.moveTo(-10.7, stern ? -3.8 : -4.5);
  ctx.quadraticCurveTo(-6, stern ? -5.2 : -6.2, -1.7, -4);
  ctx.moveTo(4.8, -4);
  ctx.quadraticCurveTo(9.2, -6.2, 13.1, -4.7);
  ctx.stroke();

  // Police cap.
  ctx.fillStyle = "#1e2e4d";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-19.6, -16.2);
  ctx.bezierCurveTo(-18.9, -29.7, -6.1, -35.7, 5.5, -34.3);
  ctx.bezierCurveTo(17.3, -33, 23.9, -24.7, 21.1, -15.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#16223b";
  ctx.beginPath();
  ctx.moveTo(-22.2, -15.4);
  ctx.quadraticCurveTo(-1.1, -19.8, 23.2, -14.9);
  ctx.lineTo(20.1, -10.9);
  ctx.quadraticCurveTo(-1.2, -14.7, -20.1, -11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#d9b15e";
  ctx.beginPath();
  ctx.arc(0.7, -26.2, 4.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#1c2b47";
  ctx.beginPath();
  ctx.arc(0.7, -26.2, 2.2, 0, TAU);
  ctx.fill();
  star(ctx, 0.7, -26.2, 2.2, "#e5c06d");

  ctx.restore();
}

export function drawTorielHead(ctx, x, y, r, mood = "warm", face = 1, t = 0) {
  const sc = r / 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc * face, sc);

  // Horns.
  ctx.fillStyle = "#d6c2d6";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-14.6, -20.2);
  ctx.bezierCurveTo(-23.7, -25, -25.6, -15.2, -17.2, -10.7);
  ctx.bezierCurveTo(-21.4, -17, -19.2, -20.5, -12.4, -17.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(14.6, -20.2);
  ctx.bezierCurveTo(23.7, -25, 25.6, -15.2, 17.2, -10.7);
  ctx.bezierCurveTo(21.4, -17, 19.2, -20.5, 12.4, -17.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Long ears.
  ctx.fillStyle = "#c8aecb";
  ellipse(ctx, -23, 4.1, 9.2, 4.1, -0.42);
  ctx.fill();
  ctx.stroke();
  ellipse(ctx, 23, 4.1, 9.2, 4.1, 0.42);
  ctx.fill();
  ctx.stroke();

  // Face.
  const fg = ctx.createLinearGradient(0, -18, 0, 20);
  fg.addColorStop(0, "#e4d1e4");
  fg.addColorStop(1, "#cdb3d0");
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(-17.2, -13.5);
  ctx.bezierCurveTo(-21.2, -1.2, -17, 15, -5.2, 20.2);
  ctx.bezierCurveTo(6.6, 25.4, 19.4, 16.7, 19.5, 1.8);
  ctx.bezierCurveTo(19.4, -10.8, 10.6, -19.5, -2, -19.4);
  ctx.bezierCurveTo(-10.4, -19.3, -15.3, -16.2, -17.2, -13.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Muzzle.
  ctx.fillStyle = "#f3e5ef";
  ellipse(ctx, 1.2, 8.2, 10.1, 7.4);
  ctx.fill();
  ctx.strokeStyle = "rgba(77,49,73,.25)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Nose.
  ctx.fillStyle = "#5c3f52";
  rr(ctx, 2.1, 5.1, 5.3, 3.1, 1.7);
  ctx.fill();
  ctx.strokeStyle = "#654253";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(4.7, 8);
  ctx.quadraticCurveTo(1.4, 10.8, -1.3, 8.7);
  ctx.stroke();

  // Glasses.
  ctx.strokeStyle = "rgba(207,166,96,.9)";
  ctx.lineWidth = 1.25;
  ellipse(ctx, -5.4, 1, 5.8, 4.5);
  ctx.stroke();
  ellipse(ctx, 9, 1, 5.8, 4.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0.4, 1);
  ctx.quadraticCurveTo(1.8, -0.3, 3.2, 1);
  ctx.stroke();

  // Eyes behind glasses.
  ctx.fillStyle = "#fbf2e5";
  ellipse(ctx, -5.4, 1.2, 3.4, 3.4);
  ctx.fill();
  ellipse(ctx, 9, 1.2, 3.4, 3.4);
  ctx.fill();
  ctx.fillStyle = "#7d4055";
  ctx.beginPath();
  ctx.arc(-5.1, 1.6, 1.65, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(9.3, 1.6, 1.65, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#241923";
  ctx.beginPath();
  ctx.arc(-5.1, 1.7, 0.78, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(9.3, 1.7, 0.78, 0, TAU);
  ctx.fill();
  eyeShine(ctx, -4.4, 0.8, 0.6);
  eyeShine(ctx, 10, 0.8, 0.6);

  // Concerned brows.
  ctx.strokeStyle = "#674862";
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(-10.4, -4.2);
  ctx.quadraticCurveTo(-6, -5.9, -1.8, -4.2);
  ctx.moveTo(4.9, -4.2);
  ctx.quadraticCurveTo(9, -5.9, 13, -4.2);
  ctx.stroke();

  // Mouth.
  ctx.strokeStyle = "#77485c";
  ctx.lineWidth = 1.35;
  ctx.beginPath();
  if (mood === "stern") {
    ctx.moveTo(-0.8, 11.1);
    ctx.quadraticCurveTo(2.2, 10.3, 5.2, 11.1);
  } else {
    ctx.moveTo(-1.6, 10.7);
    ctx.quadraticCurveTo(2.2, 13.1, 6.1, 10.5);
  }
  ctx.stroke();

  // Scarf collar peeking into the portrait.
  ctx.fillStyle = "#954757";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-17, 21);
  ctx.quadraticCurveTo(-4, 15.5, 9, 19.5);
  ctx.lineTo(17.5, 24);
  ctx.lineTo(-19, 28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/* Imported late to avoid a circular-looking silhouette above. */
import { star } from "./draw-utils.js";

export function drawMirrorHead(ctx, x, y, r, trust = 0, t = 0) {
  const sc = r / 24;
  const calm = trust / 3;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);

  // Nested static offsets.
  ctx.globalAlpha = 0.38 + calm * 0.3;
  ctx.fillStyle = "#b9aed7";
  ellipse(ctx, -2.4, 0.8, 22.5, 26.5);
  ctx.fill();
  ctx.fillStyle = "#cabfe4";
  ellipse(ctx, 2.8, -0.8, 21.2, 25.6);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = "#d9d0e4";
  ctx.strokeStyle = "#181020";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-18, -11);
  ctx.bezierCurveTo(-22, 4, -15, 22, 2, 27);
  ctx.bezierCurveTo(18, 31, 25, 15, 22, 0);
  ctx.bezierCurveTo(19, -18, 4, -27, -10, -22);
  ctx.bezierCurveTo(-15.7, -20, -17.2, -16, -18, -11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hair, wrong and too sharp.
  ctx.fillStyle = "#1b1624";
  ctx.beginPath();
  ctx.moveTo(-21, -9);
  ctx.lineTo(-13, -26);
  ctx.lineTo(-7, -15);
  ctx.lineTo(-1, -30);
  ctx.lineTo(5, -16);
  ctx.lineTo(13, -28);
  ctx.lineTo(21, -8);
  ctx.lineTo(17, -2);
  ctx.lineTo(-18, 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Black eyes.
  ctx.fillStyle = "#0b0710";
  ellipse(ctx, -7, 1.5, 5.2, 7.3);
  ctx.fill();
  ellipse(ctx, 8.5, 1.5, 5.2, 7.3);
  ctx.fill();
  if (calm > 0.55) {
    ctx.fillStyle = `rgba(190,175,220,${calm * 0.8})`;
    ellipse(ctx, -6.3, 2.6, 1.7, 2.3);
    ctx.fill();
    ellipse(ctx, 9.2, 2.6, 1.7, 2.3);
    ctx.fill();
  }

  // Grin.
  ctx.fillStyle = "#4a0b18";
  ctx.strokeStyle = "#0d070c";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-12, 11.5);
  ctx.quadraticCurveTo(0.5, 27.5, 14.5, 10.5);
  ctx.quadraticCurveTo(2.5, 18.3, -12, 11.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Teeth.
  ctx.fillStyle = "#e9dfd0";
  for (let i = 0; i < 7; i++) {
    const tx = -9.2 + i * 3.5;
    poly(ctx, [[tx, 13.2], [tx + 1.8, 13.2], [tx + 0.9, 15.8 + Math.sin(i) * 1.2]]);
    ctx.fill();
  }

  // Cracks.
  ctx.strokeStyle = "rgba(42,29,52,.55)";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(12.5, -21.5);
  ctx.lineTo(9.1, -9.8);
  ctx.lineTo(13.7, 2.2);
  ctx.lineTo(10.3, 16.2);
  ctx.moveTo(-16.1, -4.2);
  ctx.lineTo(-10.9, 0.8);
  ctx.lineTo(-14.3, 8.1);
  ctx.stroke();

  if (calm > 0.8) {
    ctx.fillStyle = "rgba(255,244,211,.55)";
    star(ctx, 16, -18, 4.5, "#fff4d3");
  }

  ctx.restore();
}

export function drawHead(ctx, who, x, y, r, mood, face, t) {
  switch (who) {
    case "srif":
      return drawSrifHead(ctx, x, y, r, mood, face, t);
    case "chris":
      return drawChrisHead(ctx, x, y, r, mood, face, t);
    case "mich":
      return drawMichHead(ctx, x, y, r, mood, face, t);
    case "asgore":
      return drawAsgoreHead(ctx, x, y, r, mood, face, t);
    case "toriel":
      return drawTorielHead(ctx, x, y, r, mood, face, t);
    default:
      return drawMirrorHead(ctx, x, y, r, 0, t);
  }
}
