function r(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

const OUTLINE = "#0a0c15";

function drawShadow(ctx, rx = 8, ry = 2.4) {
  ellipse(ctx, 0, -1, rx, ry, "rgba(7, 10, 22, 0.34)");
}

function bobFor(frame, time, moving) {
  if (moving) return [0, -1, 0, 1][frame % 4];
  return Math.sin(time * 2.1) > 0.4 ? -1 : 0;
}

export function drawSrif(ctx, x, y, opts = {}) {
  const dir = opts.dir || "down";
  const frame = opts.frame || 0;
  const time = opts.time || 0;
  const moving = !!opts.moving;
  const demon = opts.demon;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (dir === "left") ctx.scale(-1, 1);
  drawShadow(ctx, 7.5, 2.2);

  const bob = bobFor(frame, time, moving);
  const legA = moving ? [0, 2, 0, -2][frame % 4] : 0;
  const legB = moving ? [0, -2, 0, 2][frame % 4] : 0;
  const coat = "#222b4d";
  const coatDark = "#141a33";
  const sweater = "#c74452";
  const sweater2 = "#3f8f9a";
  const skin = "#f1d6c3";
  const skinShade = "#d9b29e";
  const hair = "#1b1b2e";
  const hairHi = "#333552";
  const scarf = "#e94f64";
  const scarfDark = "#a9273d";
  const pants = "#171c2c";
  const boots = "#0b0e17";

  // backpack
  if (dir === "up" || dir === "left" || dir === "right") {
    r(ctx, dir === "right" ? -6 : -5, -18 + bob, 8, 10, "#2c4f57");
    r(ctx, dir === "right" ? -6 : -5, -18 + bob, 8, 2, "#3d6a73");
    r(ctx, dir === "right" ? -3 : -2, -15 + bob, 3, 3, "#1b343a");
  }

  // legs
  if (dir === "up") {
    r(ctx, -4, -7 + bob, 3, 6 + legA, pants);
    r(ctx, 1, -7 + bob, 3, 6 + legB, pants);
    r(ctx, -5, -2 + bob + legA, 4, 2, boots);
    r(ctx, 1, -2 + bob + legB, 4, 2, boots);
  } else if (dir === "right") {
    r(ctx, -3 + legA, -7 + bob, 3, 6, pants);
    r(ctx, 1 + legB, -7 + bob, 3, 6, pants);
    r(ctx, -4 + legA, -2 + bob, 5, 2, boots);
    r(ctx, 1 + legB, -2 + bob, 5, 2, boots);
  } else {
    r(ctx, -4 + legA, -7 + bob, 3, 6, pants);
    r(ctx, 1 + legB, -7 + bob, 3, 6, pants);
    r(ctx, -5 + legA, -2 + bob, 4, 2, boots);
    r(ctx, 1 + legB, -2 + bob, 4, 2, boots);
  }

  // torso / coat
  r(ctx, -5, -17 + bob, 10, 11, coat);
  r(ctx, -5, -17 + bob, 10, 1, coatDark);
  r(ctx, -6, -16 + bob, 1, 7, coatDark);
  r(ctx, 5, -16 + bob, 1, 7, coatDark);
  // sweater collar / stripes
  if (dir !== "up") {
    r(ctx, -3, -16 + bob, 6, 7, sweater);
    r(ctx, -3, -14 + bob, 6, 1, sweater2);
    r(ctx, -3, -12 + bob, 6, 1, sweater2);
    r(ctx, -3, -10 + bob, 6, 1, sweater2);
    r(ctx, -1, -16 + bob, 2, 7, "#d8dce8");
  } else {
    r(ctx, -3, -16 + bob, 6, 6, coatDark);
  }

  // arms
  if (dir === "right") {
    r(ctx, 3, -16 + bob, 3, 6, coat);
    r(ctx, 4, -10 + bob, 2, 4, skinShade);
  } else if (dir === "up") {
    r(ctx, -7, -16 + bob, 2, 7, coat);
    r(ctx, 5, -16 + bob, 2, 7, coat);
  } else {
    r(ctx, -7, -16 + bob, 2, 7, coat);
    r(ctx, 5, -16 + bob, 2, 7, coat);
    r(ctx, -7, -9 + bob, 2, 2, skinShade);
    r(ctx, 5, -9 + bob, 2, 2, skinShade);
  }

  // scarf
  r(ctx, -5, -18 + bob, 10, 3, scarf);
  r(ctx, -5, -18 + bob, 10, 1, "#ff7c8c");
  r(ctx, -5, -16 + bob, 2, 2, scarfDark);
  r(ctx, 3, -17 + bob, 2, 3, scarf);
  r(ctx, 4, -15 + bob, 2, 4, scarfDark);

  // head
  r(ctx, -5, -27 + bob, 10, 9, skin);
  r(ctx, -5, -27 + bob, 10, 1, skinShade);
  r(ctx, -6, -26 + bob, 1, 6, skinShade);
  // hair
  r(ctx, -6, -29 + bob, 12, 4, hair);
  r(ctx, -6, -27 + bob, 2, 5, hair);
  r(ctx, 4, -27 + bob, 2, 4, hair);
  r(ctx, -6, -30 + bob, 3, 2, hairHi);
  r(ctx, -2, -28 + bob, 5, 2, hair);
  if (dir === "right") {
    r(ctx, 1, -26 + bob, 4, 3, hair);
    r(ctx, 3, -25 + bob, 2, 2, hair);
    r(ctx, 1, -23 + bob, 2, 2, "#201c2b");
    r(ctx, 4, -22 + bob, 1, 1, "#b23a48");
  } else if (dir === "up") {
    r(ctx, -6, -27 + bob, 12, 7, hair);
    r(ctx, -4, -21 + bob, 8, 2, hair);
  } else {
    r(ctx, -4, -25 + bob, 2, 2, "#f8eadf");
    r(ctx, 2, -25 + bob, 2, 2, "#f8eadf");
    r(ctx, -3, -24 + bob, 1, 1, "#221b2b");
    r(ctx, 2, -24 + bob, 1, 1, "#221b2b");
    if (demon) {
      r(ctx, -3, -24 + bob, 1, 1, "#ff3b54");
      r(ctx, 2, -24 + bob, 1, 1, "#ff3b54");
      r(ctx, -2, -21 + bob, 5, 1, "#6d1022");
      r(ctx, -1, -22 + bob, 1, 1, "#fff0f0");
    } else {
      r(ctx, -1, -22 + bob, 3, 1, "#b97872");
    }
    // the small mark under the left eye
    r(ctx, -3, -22 + bob, 1, 2, "#d59a8f");
  }

  // tiny horns
  r(ctx, -5, -31 + bob, 2, 2, "#e9dcc4");
  r(ctx, 3, -31 + bob, 2, 2, "#e9dcc4");
  r(ctx, -5, -31 + bob, 1, 1, "#b8a98e");
  r(ctx, 3, -31 + bob, 1, 1, "#b8a98e");

  ctx.restore();
}

export function drawChris(ctx, x, y, opts = {}) {
  const dir = opts.dir || "down";
  const frame = opts.frame || 0;
  const time = opts.time || 0;
  const moving = !!opts.moving;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (dir === "left") ctx.scale(-1, 1);
  drawShadow(ctx, 9, 2.6);

  const bob = bobFor(frame, time, moving);
  const legA = moving ? [0, 2, 0, -2][frame % 4] : 0;
  const legB = moving ? [0, -2, 0, 2][frame % 4] : 0;
  const fur = "#d99a66";
  const furLight = "#f0c18d";
  const furDark = "#b87443";
  const hair = "#7a4b2f";
  const sweater = "#4aa377";
  const sweaterDark = "#2f7458";
  const scarf = "#e85d5d";
  const pants = "#2b3246";
  const boots = "#161b28";
  const antler = "#e8cf9f";

  // legs
  r(ctx, -5 + legA, -8 + bob, 4, 7, pants);
  r(ctx, 1 + legB, -8 + bob, 4, 7, pants);
  r(ctx, -6 + legA, -2 + bob, 5, 2, boots);
  r(ctx, 1 + legB, -2 + bob, 5, 2, boots);

  // torso
  r(ctx, -6, -19 + bob, 12, 12, sweater);
  r(ctx, -6, -19 + bob, 12, 2, sweaterDark);
  r(ctx, -6, -12 + bob, 12, 2, sweaterDark);
  r(ctx, -2, -17 + bob, 4, 8, "#d7efe1");
  r(ctx, -6, -17 + bob, 1, 7, "#2f7458");
  r(ctx, 5, -17 + bob, 1, 7, "#2f7458");
  // scarf
  r(ctx, -6, -20 + bob, 12, 3, scarf);
  r(ctx, -6, -20 + bob, 12, 1, "#ff8888");
  r(ctx, 2, -18 + bob, 3, 6, scarf);
  r(ctx, 4, -15 + bob, 2, 4, "#b83b3b");

  // arms
  if (dir === "right") {
    r(ctx, 5, -18 + bob, 3, 7, sweater);
    r(ctx, 6, -11 + bob, 2, 3, fur);
  } else if (dir === "up") {
    r(ctx, -8, -18 + bob, 2, 8, sweater);
    r(ctx, 6, -18 + bob, 2, 8, sweater);
  } else {
    r(ctx, -8, -18 + bob, 2, 8, sweater);
    r(ctx, 6, -18 + bob, 2, 8, sweater);
    r(ctx, -8, -10 + bob, 2, 2, fur);
    r(ctx, 6, -10 + bob, 2, 2, fur);
  }

  // head
  r(ctx, -5, -29 + bob, 10, 10, fur);
  r(ctx, -5, -29 + bob, 10, 1, furLight);
  r(ctx, -6, -28 + bob, 1, 7, furDark);
  // ears
  r(ctx, -7, -28 + bob, 2, 4, fur);
  r(ctx, 5, -28 + bob, 2, 4, fur);
  r(ctx, -7, -28 + bob, 1, 2, furDark);
  r(ctx, 6, -28 + bob, 1, 2, furDark);
  // hair
  r(ctx, -5, -31 + bob, 10, 3, hair);
  r(ctx, -6, -29 + bob, 2, 3, hair);
  r(ctx, 4, -29 + bob, 2, 2, hair);
  r(ctx, -3, -29 + bob, 4, 1, "#9b6842");
  // antlers
  r(ctx, -5, -35 + bob, 2, 5, antler);
  r(ctx, 3, -35 + bob, 2, 5, antler);
  r(ctx, -7, -36 + bob, 3, 2, antler);
  r(ctx, -7, -38 + bob, 1, 3, antler);
  r(ctx, 4, -37 + bob, 3, 2, antler);
  r(ctx, 6, -39 + bob, 1, 3, antler);
  r(ctx, -5, -35 + bob, 1, 1, "#b99a6b");
  r(ctx, 3, -35 + bob, 1, 1, "#b99a6b");

  // face
  if (dir === "right") {
    r(ctx, 2, -25 + bob, 2, 2, "#2a1a14");
    r(ctx, 5, -23 + bob, 2, 2, "#6b3a2c");
    r(ctx, 3, -21 + bob, 2, 1, "#8f4a3d");
    r(ctx, 1, -23 + bob, 3, 1, "#f6b3a2");
  } else if (dir === "up") {
    r(ctx, -5, -27 + bob, 10, 7, hair);
    r(ctx, -4, -21 + bob, 8, 2, hair);
  } else {
    r(ctx, -3, -26 + bob, 2, 2, "#f8eadf");
    r(ctx, 2, -26 + bob, 2, 2, "#f8eadf");
    r(ctx, -2, -25 + bob, 1, 1, "#2a1a14");
    r(ctx, 2, -25 + bob, 1, 1, "#2a1a14");
    r(ctx, -1, -22 + bob, 3, 1, "#8f4a3d");
    r(ctx, -4, -23 + bob, 1, 1, "#b87443");
    r(ctx, 4, -23 + bob, 1, 1, "#b87443");
    r(ctx, -1, -24 + bob, 1, 1, "#f6b3a2");
  }

  ctx.restore();
}

export function drawMich(ctx, x, y, opts = {}) {
  const dir = opts.dir || "down";
  const frame = opts.frame || 0;
  const time = opts.time || 0;
  const moving = !!opts.moving;
  const soft = opts.soft;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (dir === "left") ctx.scale(-1, 1);
  drawShadow(ctx, 10, 2.8);

  const bob = bobFor(frame, time, moving);
  const legA = moving ? [0, 2, 0, -2][frame % 4] : 0;
  const legB = moving ? [0, -2, 0, 2][frame % 4] : 0;
  const fur = "#e7923f";
  const furLight = "#f6c07a";
  const furDark = "#c66f25";
  const stripe = "#241a18";
  const jacket = "#161821";
  const jacketHi = "#2a2e3d";
  const shirt = "#e7e2d8";
  const pants = "#12151e";

  // legs
  r(ctx, -6 + legA, -8 + bob, 4, 7, pants);
  r(ctx, 2 + legB, -8 + bob, 4, 7, pants);
  r(ctx, -7 + legA, -2 + bob, 5, 2, "#0a0c12");
  r(ctx, 2 + legB, -2 + bob, 5, 2, "#0a0c12");

  // tail
  r(ctx, 6, -13 + bob, 3, 2, fur);
  r(ctx, 8, -15 + bob, 2, 3, fur);
  r(ctx, 9, -16 + bob, 1, 2, stripe);

  // torso / jacket
  r(ctx, -7, -20 + bob, 14, 13, jacket);
  r(ctx, -7, -20 + bob, 14, 1, jacketHi);
  r(ctx, -7, -9 + bob, 14, 2, "#0d0f16");
  r(ctx, -2, -19 + bob, 4, 8, shirt);
  r(ctx, -1, -18 + bob, 2, 6, "#bdb6a8");
  // jacket zip / chain
  r(ctx, 0, -18 + bob, 1, 9, "#5f6675");
  r(ctx, -4, -15 + bob, 8, 1, "#c9d2df");
  // arms
  if (dir === "right") {
    r(ctx, 6, -19 + bob, 3, 8, jacket);
    r(ctx, 7, -11 + bob, 2, 3, fur);
    r(ctx, 7, -10 + bob, 1, 1, stripe);
  } else if (dir === "up") {
    r(ctx, -9, -19 + bob, 2, 9, jacket);
    r(ctx, 7, -19 + bob, 2, 9, jacket);
  } else {
    r(ctx, -9, -19 + bob, 2, 9, jacket);
    r(ctx, 7, -19 + bob, 2, 9, jacket);
    r(ctx, -9, -10 + bob, 2, 3, fur);
    r(ctx, 7, -10 + bob, 2, 3, fur);
    r(ctx, -9, -9 + bob, 1, 1, stripe);
    r(ctx, 7, -9 + bob, 1, 1, stripe);
  }

  // head
  r(ctx, -6, -31 + bob, 12, 11, fur);
  r(ctx, -6, -31 + bob, 12, 1, furLight);
  r(ctx, -7, -30 + bob, 1, 8, furDark);
  r(ctx, -7, -29 + bob, 1, 1, stripe);
  r(ctx, 6, -29 + bob, 1, 1, stripe);
  // ears
  r(ctx, -8, -32 + bob, 2, 4, fur);
  r(ctx, 6, -32 + bob, 2, 4, fur);
  r(ctx, -8, -32 + bob, 1, 2, stripe);
  r(ctx, 7, -32 + bob, 1, 2, stripe);

  // ushanka
  r(ctx, -7, -35 + bob, 14, 5, "#101218");
  r(ctx, -7, -35 + bob, 14, 1, "#2a2d36");
  r(ctx, -8, -32 + bob, 2, 5, "#101218");
  r(ctx, 6, -32 + bob, 2, 5, "#101218");
  r(ctx, -8, -28 + bob, 2, 2, "#1b1e27");
  r(ctx, 6, -28 + bob, 2, 2, "#1b1e27");
  r(ctx, -2, -34 + bob, 4, 2, "#3a3f4c");
  r(ctx, -1, -34 + bob, 2, 1, "#7d8495");

  // face
  if (dir === "right") {
    r(ctx, 2, -27 + bob, 2, 2, "#f8eadf");
    r(ctx, 3, -27 + bob, 1, 1, "#ffcf5c");
    r(ctx, 6, -25 + bob, 2, 2, "#3a1f17");
    r(ctx, 3, -23 + bob, 3, 1, "#6d2e1f");
    r(ctx, 1, -29 + bob, 4, 1, stripe);
  } else if (dir === "up") {
    r(ctx, -6, -30 + bob, 12, 8, fur);
    r(ctx, -4, -30 + bob, 2, 2, stripe);
    r(ctx, 2, -30 + bob, 2, 2, stripe);
  } else {
    r(ctx, -4, -28 + bob, 3, 2, "#f8eadf");
    r(ctx, 1, -28 + bob, 3, 2, "#f8eadf");
    r(ctx, -3, -28 + bob, 1, 1, "#ffcf5c");
    r(ctx, 2, -28 + bob, 1, 1, "#ffcf5c");
    if (soft) {
      r(ctx, -2, -24 + bob, 4, 1, "#6d2e1f");
      r(ctx, -3, -25 + bob, 1, 1, "#6d2e1f");
    } else {
      r(ctx, -2, -24 + bob, 3, 1, "#6d2e1f");
    }
    // tiger stripes
    r(ctx, -5, -30 + bob, 2, 1, stripe);
    r(ctx, 3, -30 + bob, 2, 1, stripe);
    r(ctx, -5, -26 + bob, 1, 1, stripe);
    r(ctx, 4, -26 + bob, 1, 1, stripe);
    // muzzle
    r(ctx, -2, -25 + bob, 4, 3, "#f6d7ae");
    r(ctx, -1, -25 + bob, 2, 1, "#3a1f17");
    r(ctx, -1, -23 + bob, 2, 1, "#6d2e1f");
  }

  ctx.restore();
}

export function drawAsgore(ctx, x, y, opts = {}) {
  const dir = opts.dir || "down";
  const frame = opts.frame || 0;
  const time = opts.time || 0;
  const moving = !!opts.moving;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (dir === "left") ctx.scale(-1, 1);
  drawShadow(ctx, 12, 3.2);

  const bob = bobFor(frame, time, moving);
  const legA = moving ? [0, 2, 0, -2][frame % 4] : 0;
  const legB = moving ? [0, -2, 0, 2][frame % 4] : 0;
  const fur = "#f2e4c8";
  const furDark = "#d7c4a2";
  const beard = "#e8c76a";
  const coat = "#2c3b63";
  const coatDark = "#1d2947";
  const cap = "#1e2a4a";
  const gold = "#ffd166";

  r(ctx, -7 + legA, -8 + bob, 5, 7, "#1c243c");
  r(ctx, 2 + legB, -8 + bob, 5, 7, "#1c243c");
  r(ctx, -8 + legA, -2 + bob, 6, 2, "#0d1220");
  r(ctx, 2 + legB, -2 + bob, 6, 2, "#0d1220");

  // broad torso
  r(ctx, -9, -22 + bob, 18, 15, coat);
  r(ctx, -9, -22 + bob, 18, 2, coatDark);
  r(ctx, -9, -10 + bob, 18, 3, coatDark);
  r(ctx, -2, -21 + bob, 4, 12, "#d9d4c4");
  r(ctx, 0, -21 + bob, 1, 11, "#5b6478");
  // badge
  r(ctx, -6, -19 + bob, 3, 3, gold);
  r(ctx, -5, -18 + bob, 1, 1, "#8a5a12");
  // belt
  r(ctx, -9, -11 + bob, 18, 2, "#111725");
  r(ctx, -2, -11 + bob, 4, 2, gold);

  // arms
  if (dir === "right") {
    r(ctx, 8, -21 + bob, 4, 9, coat);
    r(ctx, 9, -12 + bob, 3, 3, fur);
  } else if (dir === "up") {
    r(ctx, -11, -21 + bob, 2, 10, coat);
    r(ctx, 9, -21 + bob, 2, 10, coat);
  } else {
    r(ctx, -11, -21 + bob, 2, 10, coat);
    r(ctx, 9, -21 + bob, 2, 10, coat);
    r(ctx, -11, -11 + bob, 2, 3, fur);
    r(ctx, 9, -11 + bob, 2, 3, fur);
  }

  // head
  r(ctx, -6, -32 + bob, 12, 11, fur);
  r(ctx, -6, -32 + bob, 12, 1, "#fff6df");
  r(ctx, -7, -31 + bob, 1, 8, furDark);
  // horns
  r(ctx, -8, -37 + bob, 3, 6, "#e6d7b4");
  r(ctx, 5, -37 + bob, 3, 6, "#e6d7b4");
  r(ctx, -9, -38 + bob, 2, 3, "#d5c39d");
  r(ctx, 7, -38 + bob, 2, 3, "#d5c39d");
  // ears
  r(ctx, -8, -30 + bob, 2, 4, fur);
  r(ctx, 6, -30 + bob, 2, 4, fur);
  // beard
  r(ctx, -5, -24 + bob, 10, 4, beard);
  r(ctx, -4, -20 + bob, 8, 2, beard);
  r(ctx, -2, -22 + bob, 4, 2, "#f4df9c");
  // cap
  r(ctx, -7, -35 + bob, 14, 4, cap);
  r(ctx, -8, -32 + bob, 16, 2, "#15203a");
  r(ctx, -4, -34 + bob, 8, 2, "#324269");
  r(ctx, -1, -35 + bob, 2, 1, gold);
  // face
  if (dir === "right") {
    r(ctx, 2, -28 + bob, 2, 2, "#f8eadf");
    r(ctx, 3, -28 + bob, 1, 1, "#5a3a1f");
    r(ctx, 6, -26 + bob, 2, 2, "#3a2a1a");
    r(ctx, 3, -25 + bob, 2, 1, "#8a5a12");
  } else if (dir === "up") {
    r(ctx, -6, -30 + bob, 12, 8, fur);
  } else {
    r(ctx, -4, -29 + bob, 2, 2, "#f8eadf");
    r(ctx, 2, -29 + bob, 2, 2, "#f8eadf");
    r(ctx, -3, -29 + bob, 1, 1, "#5a3a1f");
    r(ctx, 2, -29 + bob, 1, 1, "#5a3a1f");
    r(ctx, -1, -26 + bob, 3, 1, "#8a5a12");
    r(ctx, -5, -27 + bob, 1, 1, furDark);
    r(ctx, 4, -27 + bob, 1, 1, furDark);
  }

  ctx.restore();
}

export function drawToriel(ctx, x, y, opts = {}) {
  const dir = opts.dir || "down";
  const frame = opts.frame || 0;
  const time = opts.time || 0;
  const moving = !!opts.moving;
  const stern = opts.stern;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (dir === "left") ctx.scale(-1, 1);
  drawShadow(ctx, 9.5, 2.7);

  const bob = bobFor(frame, time, moving);
  const fur = "#f4efe7";
  const furDark = "#d8d0c2";
  const robe = "#6b4c8f";
  const robeDark = "#4a3268";
  const scarf = "#d65b6e";

  r(ctx, -5, -8 + bob, 4, 7, robeDark);
  r(ctx, 1, -8 + bob, 4, 7, robeDark);
  r(ctx, -6, -2 + bob, 5, 2, "#2a1c38");
  r(ctx, 1, -2 + bob, 5, 2, "#2a1c38");

  // robe
  r(ctx, -7, -21 + bob, 14, 14, robe);
  r(ctx, -7, -21 + bob, 14, 2, robeDark);
  r(ctx, -7, -8 + bob, 14, 2, robeDark);
  r(ctx, -2, -20 + bob, 4, 11, "#8566a8");
  r(ctx, -1, -19 + bob, 2, 9, "#b295cc");
  // scarf
  r(ctx, -7, -22 + bob, 14, 3, scarf);
  r(ctx, -7, -22 + bob, 14, 1, "#ff8a9a");
  r(ctx, 4, -20 + bob, 2, 5, scarf);

  // arms / hands on hips
  if (dir === "right") {
    r(ctx, 6, -20 + bob, 3, 6, robe);
    r(ctx, 7, -14 + bob, 2, 2, fur);
  } else if (dir === "up") {
    r(ctx, -9, -20 + bob, 2, 8, robe);
    r(ctx, 7, -20 + bob, 2, 8, robe);
  } else {
    r(ctx, -9, -20 + bob, 2, 7, robe);
    r(ctx, 7, -20 + bob, 2, 7, robe);
    r(ctx, -9, -13 + bob, 2, 2, fur);
    r(ctx, 7, -13 + bob, 2, 2, fur);
  }

  // head
  r(ctx, -5, -31 + bob, 10, 10, fur);
  r(ctx, -5, -31 + bob, 10, 1, "#fffaf1");
  r(ctx, -6, -30 + bob, 1, 7, furDark);
  // horns
  r(ctx, -6, -34 + bob, 2, 4, "#e8ddc7");
  r(ctx, 4, -34 + bob, 2, 4, "#e8ddc7");
  // ears
  r(ctx, -7, -29 + bob, 2, 4, fur);
  r(ctx, 5, -29 + bob, 2, 4, fur);
  // hair tuft
  r(ctx, -5, -33 + bob, 10, 2, "#e6dfd3");
  r(ctx, -3, -34 + bob, 6, 1, "#fffaf1");
  // face
  if (dir === "right") {
    r(ctx, 2, -27 + bob, 2, 2, "#f8eadf");
    r(ctx, 3, -27 + bob, 1, 1, "#7a3f4d");
    r(ctx, 6, -25 + bob, 2, 2, "#4a2a30");
    r(ctx, 3, -23 + bob, 2, 1, "#b46a72");
  } else if (dir === "up") {
    r(ctx, -5, -30 + bob, 10, 7, "#e6dfd3");
  } else {
    r(ctx, -3, -28 + bob, 2, 2, "#f8eadf");
    r(ctx, 2, -28 + bob, 2, 2, "#f8eadf");
    r(ctx, -2, -28 + bob, 1, 1, "#7a3f4d");
    r(ctx, 2, -28 + bob, 1, 1, "#7a3f4d");
    if (stern) {
      r(ctx, -2, -24 + bob, 4, 1, "#8a4a55");
      r(ctx, -3, -25 + bob, 1, 1, "#8a4a55");
      r(ctx, 2, -25 + bob, 1, 1, "#8a4a55");
    } else {
      r(ctx, -1, -24 + bob, 3, 1, "#b46a72");
    }
  }

  ctx.restore();
}

export function drawSnowman(ctx, x, y, time = 0) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  drawShadow(ctx, 9, 2.6);
  ellipse(ctx, 0, -6, 8, 7, "#eef6ff");
  ellipse(ctx, 0, -15, 6.5, 6, "#f7fbff");
  ellipse(ctx, 0, -23, 5.5, 5, "#ffffff");
  // hat
  r(ctx, -5, -30, 10, 3, "#1b2233");
  r(ctx, -4, -35, 8, 6, "#1b2233");
  r(ctx, -4, -32, 8, 2, "#b33a4a");
  // face
  r(ctx, -3, -25, 1, 1, "#141821");
  r(ctx, 2, -25, 1, 1, "#141821");
  r(ctx, 0, -23, 2, 1, "#e08a3a");
  // scarf
  r(ctx, -5, -19, 10, 2, "#d65b6e");
  r(ctx, 3, -17, 2, 5, "#d65b6e");
  // buttons
  r(ctx, -1, -15, 1, 1, "#2a2f3d");
  r(ctx, -1, -11, 1, 1, "#2a2f3d");
  // twig arms
  line(ctx, -8, -15, -12, -19, "#5b3d2a", 1);
  line(ctx, 8, -15, 12, -18, "#5b3d2a", 1);
  ctx.restore();
}

export function drawKid(ctx, x, y, opts = {}) {
  const time = opts.time || 0;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  drawShadow(ctx, 6, 2);
  const bob = Math.sin(time * 2.4) > 0.2 ? -1 : 0;
  r(ctx, -3, -7 + bob, 2, 6, "#2c3550");
  r(ctx, 1, -7 + bob, 2, 6, "#2c3550");
  r(ctx, -4, -2 + bob, 3, 2, "#141a28");
  r(ctx, 1, -2 + bob, 3, 2, "#141a28");
  r(ctx, -5, -16 + bob, 10, 10, "#c95a5a");
  r(ctx, -5, -16 + bob, 10, 2, "#e97a7a");
  r(ctx, -4, -23 + bob, 8, 8, "#e0b08b");
  r(ctx, -5, -25 + bob, 10, 4, "#3b7a9e");
  r(ctx, -3, -27 + bob, 6, 3, "#4d95bb");
  r(ctx, -2, -21 + bob, 1, 1, "#1a1a24");
  r(ctx, 2, -21 + bob, 1, 1, "#1a1a24");
  r(ctx, -1, -19 + bob, 3, 1, "#9c5a4a");
  ctx.restore();
}

export function drawCat(ctx, x, y, time = 0) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  drawShadow(ctx, 5, 1.6);
  const bob = Math.sin(time * 1.7) > 0.7 ? -1 : 0;
  ellipse(ctx, 0, -4, 5, 4, "#3a3440");
  ellipse(ctx, 0, -8 + bob, 4, 3.4, "#3a3440");
  r(ctx, -4, -11 + bob, 2, 2, "#3a3440");
  r(ctx, 2, -11 + bob, 2, 2, "#3a3440");
  r(ctx, -2, -9 + bob, 1, 1, "#ffd166");
  r(ctx, 1, -9 + bob, 1, 1, "#ffd166");
  line(ctx, 4, -5, 8, -8, "#3a3440", 1.5);
  ctx.restore();
}

/* ------------------------------- portraits ------------------------------- */

function portraitBg(ctx, colorA, colorB) {
  const grad = ctx.createLinearGradient(0, 0, 0, 56);
  grad.addColorStop(0, colorA);
  grad.addColorStop(1, colorB);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 56, 56);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(0, 0, 56, 1);
  ctx.fillRect(0, 0, 1, 56);
}

function portraitSrif(ctx, emotion, time) {
  portraitBg(ctx, "#2a3c6a", "#0d1427");
  // glow
  const glow = ctx.createRadialGradient(28, 24, 2, 28, 24, 30);
  glow.addColorStop(0, "rgba(150, 190, 255, 0.18)");
  glow.addColorStop(1, "rgba(150, 190, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 56, 56);

  // shoulders
  r(ctx, 8, 45, 40, 11, "#222b4d");
  r(ctx, 8, 45, 40, 2, "#141a33");
  r(ctx, 18, 44, 20, 12, "#c74452");
  r(ctx, 18, 47, 20, 1, "#3f8f9a");
  r(ctx, 18, 50, 20, 1, "#3f8f9a");
  // scarf
  r(ctx, 13, 42, 30, 5, "#e94f64");
  r(ctx, 13, 42, 30, 1, "#ff7c8c");
  r(ctx, 36, 46, 7, 9, "#a9273d");
  // neck
  r(ctx, 22, 38, 12, 8, "#d9b29e");
  // head
  r(ctx, 15, 13, 26, 27, "#f1d6c3");
  r(ctx, 15, 13, 26, 2, "#f8e6d9");
  r(ctx, 14, 18, 1, 16, "#d9b29e");
  // hair
  r(ctx, 13, 8, 30, 9, "#1b1b2e");
  r(ctx, 13, 13, 4, 17, "#1b1b2e");
  r(ctx, 39, 13, 4, 11, "#1b1b2e");
  r(ctx, 17, 10, 9, 3, "#333552");
  r(ctx, 25, 9, 7, 2, "#25263f");
  r(ctx, 15, 17, 5, 5, "#1b1b2e");
  r(ctx, 35, 17, 4, 3, "#1b1b2e");
  // horns
  r(ctx, 14, 5, 4, 5, "#e9dcc4");
  r(ctx, 38, 5, 4, 5, "#e9dcc4");
  r(ctx, 14, 5, 2, 2, "#b8a98e");
  r(ctx, 40, 5, 2, 2, "#b8a98e");
  // brows
  r(ctx, 19, 21, 7, 1, "#2c2635");
  r(ctx, 31, 21, 7, 1, "#2c2635");
  // eyes
  if (emotion === "demon") {
    r(ctx, 19, 23, 7, 5, "#090a10");
    r(ctx, 31, 23, 7, 5, "#090a10");
    r(ctx, 21, 24, 3, 3, "#ff3b54");
    r(ctx, 33, 24, 3, 3, "#ff3b54");
    r(ctx, 22, 25, 1, 1, "#fff0f0");
    r(ctx, 34, 25, 1, 1, "#fff0f0");
  } else if (emotion === "sad") {
    r(ctx, 20, 24, 5, 2, "#f8eadf");
    r(ctx, 31, 24, 5, 2, "#f8eadf");
    r(ctx, 21, 25, 2, 2, "#221b2b");
    r(ctx, 33, 25, 2, 2, "#221b2b");
    r(ctx, 19, 21, 7, 1, "#2c2635");
    r(ctx, 31, 21, 7, 1, "#2c2635");
  } else if (emotion === "smile") {
    r(ctx, 20, 24, 5, 2, "#f8eadf");
    r(ctx, 31, 24, 5, 2, "#f8eadf");
    r(ctx, 21, 24, 2, 2, "#221b2b");
    r(ctx, 33, 24, 2, 2, "#221b2b");
  } else {
    r(ctx, 20, 23, 5, 3, "#f8eadf");
    r(ctx, 31, 23, 5, 3, "#f8eadf");
    r(ctx, 21, 24, 2, 2, "#221b2b");
    r(ctx, 33, 24, 2, 2, "#221b2b");
  }
  // nose
  r(ctx, 27, 27, 2, 2, "#d59a8f");
  // mouth
  if (emotion === "demon") {
    r(ctx, 21, 31, 14, 3, "#2a0710");
    r(ctx, 22, 31, 12, 1, "#ff5d73");
    r(ctx, 23, 33, 1, 1, "#fff0f0");
    r(ctx, 27, 33, 1, 1, "#fff0f0");
    r(ctx, 31, 33, 1, 1, "#fff0f0");
  } else if (emotion === "smile") {
    r(ctx, 22, 31, 12, 1, "#b97872");
    r(ctx, 21, 30, 1, 1, "#b97872");
    r(ctx, 34, 30, 1, 1, "#b97872");
  } else if (emotion === "sad") {
    r(ctx, 24, 32, 8, 1, "#b97872");
    r(ctx, 23, 33, 1, 1, "#b97872");
    r(ctx, 32, 33, 1, 1, "#b97872");
  } else {
    r(ctx, 24, 31, 8, 1, "#b97872");
  }
  // mark under left eye
  r(ctx, 20, 28, 1, 2, "#d59a8f");
  r(ctx, 19, 29, 1, 1, "#c9857a");
  if (emotion === "demon") {
    r(ctx, 16, 30, 3, 1, "#5b0e1e");
    r(ctx, 38, 28, 3, 1, "#5b0e1e");
    r(ctx, 17, 34, 1, 2, "#5b0e1e");
    r(ctx, 37, 33, 1, 2, "#5b0e1e");
  }
}

function portraitChris(ctx, emotion) {
  portraitBg(ctx, "#234c43", "#0b1c1a");
  const glow = ctx.createRadialGradient(28, 26, 2, 28, 26, 32);
  glow.addColorStop(0, "rgba(120, 255, 210, 0.16)");
  glow.addColorStop(1, "rgba(120, 255, 210, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 56, 56);
  // shoulders
  r(ctx, 7, 45, 42, 11, "#4aa377");
  r(ctx, 7, 45, 42, 2, "#2f7458");
  r(ctx, 22, 44, 12, 12, "#d7efe1");
  r(ctx, 12, 42, 32, 5, "#e85d5d");
  r(ctx, 12, 42, 32, 1, "#ff8888");
  r(ctx, 36, 46, 7, 9, "#b83b3b");
  // neck
  r(ctx, 23, 39, 10, 7, "#b87443");
  // ears
  r(ctx, 8, 20, 5, 9, "#d99a66");
  r(ctx, 43, 20, 5, 9, "#d99a66");
  r(ctx, 9, 21, 2, 6, "#b87443");
  r(ctx, 44, 21, 2, 6, "#b87443");
  // head
  r(ctx, 13, 14, 30, 27, "#d99a66");
  r(ctx, 13, 14, 30, 2, "#f0c18d");
  r(ctx, 12, 19, 1, 16, "#b87443");
  // antlers
  r(ctx, 12, 2, 4, 13, "#e8cf9f");
  r(ctx, 40, 2, 4, 13, "#e8cf9f");
  r(ctx, 7, 1, 8, 3, "#e8cf9f");
  r(ctx, 6, 0, 3, 6, "#e8cf9f");
  r(ctx, 42, 2, 8, 3, "#e8cf9f");
  r(ctx, 48, 0, 3, 6, "#e8cf9f");
  r(ctx, 12, 3, 2, 2, "#b99a6b");
  r(ctx, 42, 3, 2, 2, "#b99a6b");
  // hair
  r(ctx, 13, 11, 30, 7, "#7a4b2f");
  r(ctx, 13, 16, 5, 8, "#7a4b2f");
  r(ctx, 38, 16, 5, 5, "#7a4b2f");
  r(ctx, 17, 12, 12, 3, "#9b6842");
  r(ctx, 18, 18, 8, 2, "#7a4b2f");
  // brows
  r(ctx, 17, 21, 8, 1, "#4d2c1c");
  r(ctx, 31, 21, 8, 1, "#4d2c1c");
  // eyes
  r(ctx, 18, 23, 7, 4, "#f8eadf");
  r(ctx, 31, 23, 7, 4, "#f8eadf");
  r(ctx, 20, 24, 3, 3, "#2a1a14");
  r(ctx, 33, 24, 3, 3, "#2a1a14");
  r(ctx, 21, 24, 1, 1, "#ffffff");
  r(ctx, 34, 24, 1, 1, "#ffffff");
  // freckles
  r(ctx, 17, 28, 1, 1, "#b87443");
  r(ctx, 20, 29, 1, 1, "#b87443");
  r(ctx, 35, 28, 1, 1, "#b87443");
  r(ctx, 38, 29, 1, 1, "#b87443");
  // muzzle / nose
  r(ctx, 22, 27, 12, 8, "#f0c18d");
  r(ctx, 26, 28, 4, 3, "#6b3a2c");
  r(ctx, 25, 27, 6, 1, "#8f4a3d");
  // mouth
  if (emotion === "laugh") {
    r(ctx, 22, 33, 12, 3, "#8f4a3d");
    r(ctx, 24, 34, 8, 1, "#ffb3a8");
  } else if (emotion === "concerned") {
    r(ctx, 24, 34, 8, 1, "#8f4a3d");
    r(ctx, 23, 33, 1, 1, "#8f4a3d");
    r(ctx, 32, 33, 1, 1, "#8f4a3d");
  } else {
    r(ctx, 23, 33, 10, 1, "#8f4a3d");
    r(ctx, 22, 32, 1, 1, "#8f4a3d");
    r(ctx, 33, 32, 1, 1, "#8f4a3d");
  }
}

function portraitMich(ctx, emotion) {
  portraitBg(ctx, "#2e2a36", "#100e15");
  const glow = ctx.createRadialGradient(28, 24, 2, 28, 24, 32);
  glow.addColorStop(0, "rgba(255, 190, 90, 0.13)");
  glow.addColorStop(1, "rgba(255, 190, 90, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 56, 56);
  // shoulders / jacket
  r(ctx, 5, 45, 46, 11, "#161821");
  r(ctx, 5, 45, 46, 2, "#2a2e3d");
  r(ctx, 23, 44, 10, 12, "#e7e2d8");
  r(ctx, 20, 47, 16, 1, "#c9d2df");
  // neck
  r(ctx, 23, 39, 10, 7, "#c66f25");
  // ears
  r(ctx, 7, 18, 6, 10, "#e7923f");
  r(ctx, 43, 18, 6, 10, "#e7923f");
  r(ctx, 8, 19, 2, 3, "#241a18");
  r(ctx, 45, 19, 2, 3, "#241a18");
  // head
  r(ctx, 12, 12, 32, 29, "#e7923f");
  r(ctx, 12, 12, 32, 2, "#f6c07a");
  r(ctx, 11, 17, 1, 18, "#c66f25");
  // stripes
  r(ctx, 12, 16, 3, 2, "#241a18");
  r(ctx, 41, 16, 3, 2, "#241a18");
  r(ctx, 11, 23, 2, 2, "#241a18");
  r(ctx, 43, 23, 2, 2, "#241a18");
  // muzzle
  r(ctx, 19, 28, 18, 11, "#f6d7ae");
  r(ctx, 26, 29, 4, 4, "#3a1f17");
  r(ctx, 25, 28, 6, 1, "#6d2e1f");
  // ushanka
  r(ctx, 10, 4, 36, 9, "#101218");
  r(ctx, 10, 4, 36, 2, "#2a2d36");
  r(ctx, 8, 10, 6, 14, "#101218");
  r(ctx, 42, 10, 6, 14, "#101218");
  r(ctx, 8, 22, 6, 3, "#1b1e27");
  r(ctx, 42, 22, 6, 3, "#1b1e27");
  r(ctx, 24, 6, 8, 4, "#3a3f4c");
  r(ctx, 26, 6, 4, 2, "#7d8495");
  // brows
  r(ctx, 16, 20, 8, 1, "#241a18");
  r(ctx, 32, 20, 8, 1, "#241a18");
  // eyes
  r(ctx, 17, 22, 7, 4, "#f8eadf");
  r(ctx, 32, 22, 7, 4, "#f8eadf");
  r(ctx, 19, 23, 3, 3, "#ffcf5c");
  r(ctx, 34, 23, 3, 3, "#ffcf5c");
  r(ctx, 20, 23, 1, 1, "#2a1a14");
  r(ctx, 35, 23, 1, 1, "#2a1a14");
  // nose/mouth
  r(ctx, 25, 33, 6, 1, "#6d2e1f");
  if (emotion === "soft") {
    r(ctx, 23, 35, 10, 1, "#6d2e1f");
    r(ctx, 22, 34, 1, 1, "#6d2e1f");
    r(ctx, 33, 34, 1, 1, "#6d2e1f");
  } else if (emotion === "surprised") {
    r(ctx, 26, 35, 4, 3, "#6d2e1f");
  } else {
    r(ctx, 24, 35, 8, 1, "#6d2e1f");
  }
}

function portraitAsgore(ctx, emotion) {
  portraitBg(ctx, "#37304a", "#120f1c");
  const glow = ctx.createRadialGradient(28, 24, 2, 28, 24, 32);
  glow.addColorStop(0, "rgba(255, 220, 130, 0.17)");
  glow.addColorStop(1, "rgba(255, 220, 130, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 56, 56);
  // shoulders
  r(ctx, 4, 45, 48, 11, "#2c3b63");
  r(ctx, 4, 45, 48, 2, "#1d2947");
  r(ctx, 24, 44, 8, 12, "#d9d4c4");
  r(ctx, 15, 48, 8, 8, "#ffd166");
  // neck
  r(ctx, 22, 38, 12, 8, "#d7c4a2");
  // horns
  r(ctx, 9, 1, 6, 14, "#e6d7b4");
  r(ctx, 41, 1, 6, 14, "#e6d7b4");
  r(ctx, 7, 0, 5, 4, "#d5c39d");
  r(ctx, 44, 0, 5, 4, "#d5c39d");
  // ears
  r(ctx, 7, 18, 6, 10, "#f2e4c8");
  r(ctx, 43, 18, 6, 10, "#f2e4c8");
  // head
  r(ctx, 12, 13, 32, 27, "#f2e4c8");
  r(ctx, 12, 13, 32, 2, "#fff6df");
  r(ctx, 11, 18, 1, 17, "#d7c4a2");
  // beard
  r(ctx, 16, 30, 24, 9, "#e8c76a");
  r(ctx, 18, 39, 20, 5, "#e8c76a");
  r(ctx, 21, 33, 14, 3, "#f4df9c");
  // cap
  r(ctx, 10, 4, 36, 8, "#1e2a4a");
  r(ctx, 8, 10, 40, 4, "#15203a");
  r(ctx, 19, 7, 18, 3, "#324269");
  r(ctx, 27, 7, 3, 3, "#ffd166");
  // brows
  r(ctx, 16, 20, 9, 1, "#8a5a12");
  r(ctx, 31, 20, 9, 1, "#8a5a12");
  // eyes
  r(ctx, 17, 22, 7, 4, "#f8eadf");
  r(ctx, 32, 22, 7, 4, "#f8eadf");
  r(ctx, 19, 23, 3, 3, "#5a3a1f");
  r(ctx, 34, 23, 3, 3, "#5a3a1f");
  r(ctx, 20, 23, 1, 1, "#ffffff");
  r(ctx, 35, 23, 1, 1, "#ffffff");
  // nose
  r(ctx, 26, 27, 4, 3, "#8a5a12");
  r(ctx, 25, 28, 6, 1, "#5a3a1f");
  // mouth
  if (emotion === "laugh") {
    r(ctx, 22, 34, 12, 3, "#8a5a12");
    r(ctx, 24, 35, 8, 1, "#f8eadf");
  } else {
    r(ctx, 24, 35, 8, 1, "#8a5a12");
  }
}

function portraitToriel(ctx, emotion) {
  portraitBg(ctx, "#35284a", "#120d1c");
  const glow = ctx.createRadialGradient(28, 24, 2, 28, 24, 32);
  glow.addColorStop(0, "rgba(210, 160, 255, 0.14)");
  glow.addColorStop(1, "rgba(210, 160, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 56, 56);
  // shoulders
  r(ctx, 5, 45, 46, 11, "#6b4c8f");
  r(ctx, 5, 45, 46, 2, "#4a3268");
  r(ctx, 23, 44, 10, 12, "#8566a8");
  r(ctx, 12, 42, 32, 5, "#d65b6e");
  r(ctx, 12, 42, 32, 1, "#ff8a9a");
  // neck
  r(ctx, 23, 38, 10, 8, "#d8d0c2");
  // ears
  r(ctx, 8, 18, 6, 10, "#f4efe7");
  r(ctx, 42, 18, 6, 10, "#f4efe7");
  // head
  r(ctx, 13, 12, 30, 28, "#f4efe7");
  r(ctx, 13, 12, 30, 2, "#fffaf1");
  r(ctx, 12, 17, 1, 17, "#d8d0c2");
  // horns
  r(ctx, 12, 4, 4, 9, "#e8ddc7");
  r(ctx, 40, 4, 4, 9, "#e8ddc7");
  r(ctx, 11, 3, 3, 3, "#d5c9b2");
  r(ctx, 42, 3, 3, 3, "#d5c9b2");
  // hair
  r(ctx, 13, 9, 30, 5, "#e6dfd3");
  r(ctx, 13, 13, 5, 8, "#e6dfd3");
  r(ctx, 38, 13, 5, 5, "#e6dfd3");
  r(ctx, 18, 10, 12, 2, "#fffaf1");
  // brows
  r(ctx, 17, 21, 8, 1, "#8a7d6b");
  r(ctx, 31, 21, 8, 1, "#8a7d6b");
  // eyes
  r(ctx, 18, 23, 7, 4, "#f8eadf");
  r(ctx, 31, 23, 7, 4, "#f8eadf");
  r(ctx, 20, 24, 3, 3, "#7a3f4d");
  r(ctx, 33, 24, 3, 3, "#7a3f4d");
  r(ctx, 21, 24, 1, 1, "#ffffff");
  r(ctx, 34, 24, 1, 1, "#ffffff");
  // nose
  r(ctx, 26, 28, 4, 3, "#d8d0c2");
  r(ctx, 25, 29, 6, 1, "#b46a72");
  // mouth
  if (emotion === "soft") {
    r(ctx, 24, 34, 8, 1, "#b46a72");
    r(ctx, 23, 33, 1, 1, "#b46a72");
    r(ctx, 32, 33, 1, 1, "#b46a72");
  } else if (emotion === "stern") {
    r(ctx, 24, 34, 8, 1, "#8a4a55");
    r(ctx, 23, 33, 1, 1, "#8a4a55");
    r(ctx, 32, 33, 1, 1, "#8a4a55");
  } else {
    r(ctx, 25, 34, 6, 1, "#b46a72");
  }
}

function portraitNarrator(ctx) {
  portraitBg(ctx, "#1a2440", "#080c18");
  // a little snowflake / heart
  ctx.save();
  ctx.translate(28, 28);
  ctx.strokeStyle = "rgba(190, 215, 255, 0.55)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i += 1) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(-4, -13);
    ctx.moveTo(0, -9);
    ctx.lineTo(4, -13);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(0, 0, 56, 1);
}

const PORTRAITS = {
  srif: portraitSrif,
  chris: portraitChris,
  mich: portraitMich,
  asgore: portraitAsgore,
  toriel: portraitToriel,
  narrator: portraitNarrator,
  reflection: (ctx, emotion, time) => portraitSrif(ctx, "demon", time),
};

export function drawPortrait(ctx, who, x, y, size, emotion = "neutral", time = 0) {
  const fn = PORTRAITS[who] || PORTRAITS.narrator;
  const scale = size / 56;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.rect(0, 0, 56, 56);
  ctx.clip();
  fn(ctx, emotion, time);
  ctx.restore();
}

export function drawEnemyReflection(ctx, x, y, size, time, damage = 0) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  const s = size / 56;
  ctx.scale(s, s);
  // mirror shards aura
  const pulse = 0.5 + Math.sin(time * 3) * 0.5;
  ctx.strokeStyle = `rgba(140, 210, 255, ${0.15 + pulse * 0.12})`;
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2 + time * 0.14;
    const r1 = 34 + Math.sin(time * 2 + i) * 3;
    const r2 = 46 + Math.cos(time * 1.4 + i) * 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
    ctx.lineTo(Math.cos(angle + 0.2) * r2, Math.sin(angle + 0.2) * r2);
    ctx.stroke();
  }
  portraitSrif(ctx, "demon", time);
  // glitch bars
  if (!window.matchMedia || !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (let i = 0; i < 3; i += 1) {
      const gy = ((time * 37 + i * 19) % 56);
      ctx.fillStyle = i % 2 ? "rgba(255, 70, 100, 0.12)" : "rgba(100, 220, 255, 0.10)";
      ctx.fillRect(0, gy, 56, 1 + (i % 2));
    }
  }
  // cracks
  if (damage > 0.2) {
    ctx.strokeStyle = "rgba(220, 240, 255, 0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, 2);
    ctx.lineTo(24, 16);
    ctx.lineTo(29, 27);
    ctx.lineTo(25, 42);
    ctx.stroke();
    if (damage > 0.6) {
      ctx.beginPath();
      ctx.moveTo(24, 16);
      ctx.lineTo(12, 22);
      ctx.moveTo(29, 27);
      ctx.lineTo(44, 33);
      ctx.stroke();
    }
  }
  ctx.restore();
}
