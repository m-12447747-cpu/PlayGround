/* Oppidan's snowbound main street. */
import { TAU, INK, C, WORLD_WIDTH, layout, clamp, rr, poly, ellipse, glow, star, drawSnow, drawVignette, hash, rng, battleBoard } from "./draw-utils.js";
import { drawSrif, drawChris, drawAsgore, drawToriel, drawShadow } from "./characters.js";

const BUILDINGS = [
  {
    x: -170, w: 400, h: 268, type: "house", body: "#302e46", trim: "#4a455f",
    roof: "gable", roofColor: "#1d1b2e", name: "", door: 114, doorColor: "#241f31",
    windows: [0.18, 0.45, 0.78], lit: [true, false, true], awning: null,
  },
  {
    x: 280, w: 300, h: 248, type: "shop", body: "#24354c", trim: "#3f546b",
    roof: "flat", roofColor: "#182335", name: "SNOWBELL MART", door: 146, doorColor: "#2b1e24",
    windows: [0.15, 0.36, 0.58, 0.8], lit: [true, true, false, true], awning: "#8e4050",
  },
  {
    x: 620, w: 330, h: 306, type: "shop", body: "#28304b", trim: "#46516c",
    roof: "flat", roofColor: "#1a2032", name: "OPPIDAN POLICE", door: 166, doorColor: "#17243a",
    windows: [0.16, 0.62, 0.84], lit: [false, true, true], awning: null,
  },
  {
    x: 1000, w: 310, h: 264, type: "shop", body: "#3b2f47", trim: "#5c4a67",
    roof: "gable", roofColor: "#251e31", name: "T. DREEMURR BAKERY", door: 156, doorColor: "#2a1e2b",
    windows: [0.18, 0.43, 0.66, 0.86], lit: [true, true, true, false], awning: "#8a505c",
  },
  {
    x: 1350, w: 350, h: 292, type: "shop", body: "#243f43", trim: "#3e615f",
    roof: "flat", roofColor: "#192a2e", name: "HOLIDAY & CO.", door: 178, doorColor: "#1f332f",
    windows: [0.16, 0.39, 0.62, 0.85], lit: [true, true, true, true], awning: "#446f60",
  },
  {
    x: 1740, w: 490, h: 318, type: "diner", body: "#3a2d3f", trim: "#5a455c",
    roof: "flat", roofColor: "#241d2a", name: "LAKESIDE DINER", door: 330, doorColor: "#34221f",
    windows: [0.12, 0.3, 0.49, 0.68, 0.86], lit: [true, true, false, true, true], awning: "#6d3540",
  },
];

const LAMPS = [40, 410, 760, 1110, 1490, 1880, 2160];

const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: hash(i * 2.31 + 1),
  y: hash(i * 7.57 + 2) * 0.56,
  r: 0.5 + hash(i * 4.19) * 1.7,
  a: 0.18 + hash(i * 9.71) * 0.6,
  tw: hash(i * 6.33) * TAU,
}));

function sky(ctx, W, H, groundY, t, dawn = false) {
  const g = ctx.createLinearGradient(0, 0, 0, groundY + 20);
  if (dawn) {
    g.addColorStop(0, "#25244d");
    g.addColorStop(0.38, "#51456e");
    g.addColorStop(0.68, "#b0737d");
    g.addColorStop(0.9, "#e3ad8d");
    g.addColorStop(1, "#eacaa5");
  } else {
    g.addColorStop(0, "#050611");
    g.addColorStop(0.35, "#0d1229");
    g.addColorStop(0.67, "#292849");
    g.addColorStop(0.85, "#6b4f67");
    g.addColorStop(1, "#a76b70");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, groundY + 30);

  // Aurora breath.
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const aurora = ctx.createLinearGradient(0, H * 0.06, W, H * 0.42);
  aurora.addColorStop(0, "rgba(97,221,204,0)");
  aurora.addColorStop(0.35, "rgba(97,221,204,.045)");
  aurora.addColorStop(0.6, "rgba(141,122,243,.07)");
  aurora.addColorStop(1, "rgba(141,122,243,0)");
  ctx.fillStyle = aurora;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.17);
  ctx.bezierCurveTo(W * 0.24, H * 0.01, W * 0.5, H * 0.28, W * 0.72, H * 0.12);
  ctx.bezierCurveTo(W * 0.86, H * 0.02, W * 0.94, H * 0.16, W, H * 0.11);
  ctx.lineTo(W, H * 0.34);
  ctx.bezierCurveTo(W * 0.7, H * 0.27, W * 0.42, H * 0.39, 0, H * 0.29);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Stars.
  if (!dawn) {
    ctx.save();
    STARS.forEach((s) => {
      ctx.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(t * 0.7 + s.tw));
      ctx.fillStyle = "#fff8e1";
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, TAU);
      ctx.fill();
    });
    ctx.restore();
  }

  // Moon.
  const mx = W * 0.79;
  const my = H * 0.155;
  const mr = Math.min(W, H) * (dawn ? 0.035 : 0.055);
  glow(ctx, mx, my, mr * 4.5, dawn ? "rgba(255,221,178,.24)" : "rgba(212,209,255,.22)");
  ctx.fillStyle = dawn ? "#ffe3bd" : "#f5efd4";
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = "#756f8f";
  ctx.beginPath();
  ctx.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.27, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(mx + mr * 0.35, my + mr * 0.15, mr * 0.18, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Soft clouds.
  ctx.save();
  ctx.globalAlpha = dawn ? 0.17 : 0.11;
  ctx.fillStyle = dawn ? "#ffe1cb" : "#b8b2df";
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 0.26 + t * 0.003) % 1.2 - 0.1) * W;
    const cy = H * (0.16 + i * 0.055);
    ellipse(ctx, cx, cy, W * 0.16, H * 0.012);
    ctx.fill();
    ellipse(ctx, cx + W * 0.08, cy - H * 0.008, W * 0.11, H * 0.01);
    ctx.fill();
  }
  ctx.restore();
}

function mountainRidge(ctx, W, groundY, cam, t, offset, base, amp, color, snowCap) {
  const parallax = 0.055 + offset * 0.04;
  const shift = -cam * parallax;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-200 + shift, groundY);
  let prev = null;
  const step = 90;
  for (let x = -200; x <= W + 300; x += step) {
    const n = Math.sin((x + offset * 100) * 0.006) * 0.55 + Math.sin((x + 66) * 0.013) * 0.3 + Math.sin((x + 151) * 0.029) * 0.15;
    const y = groundY - base - amp * (0.45 + n * 0.55);
    ctx.lineTo(x + shift, y);
    if (prev && y < prev.y) {
      // snowcap facets are drawn after
    }
    prev = { x, y };
  }
  ctx.lineTo(W + 300 + shift, groundY);
  ctx.closePath();
  ctx.fill();

  // Snow cap facets.
  if (snowCap) {
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = "#b9c4e1";
    for (let x = -180; x <= W + 300; x += step) {
      const n = Math.sin((x + offset * 100) * 0.006) * 0.55 + Math.sin((x + 66) * 0.013) * 0.3 + Math.sin((x + 151) * 0.029) * 0.15;
      const y = groundY - base - amp * (0.45 + n * 0.55);
      if (y < groundY - base - amp * 0.58) {
        poly(ctx, [
          [x + shift - 18, y + 25],
          [x + shift, y],
          [x + shift + 16, y + 23],
          [x + shift + 3, y + 16],
          [x + shift - 4, y + 27],
        ]);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function farTown(ctx, W, groundY, cam, t) {
  const shift = -cam * 0.22;
  ctx.save();
  ctx.fillStyle = "#15162b";
  for (let i = -2; i < 13; i++) {
    const baseX = i * 190 + shift;
    const h = 50 + hash(i * 3.4 + 2) * 90;
    const w = 110 + hash(i * 8.1) * 80;
    ctx.fillRect(baseX, groundY - h, w, h);
    // roof
    if (i % 3 === 0) {
      poly(ctx, [[baseX - 8, groundY - h], [baseX + w / 2, groundY - h - 46], [baseX + w + 8, groundY - h]]);
      ctx.fillStyle = "#121326";
      ctx.fill();
      ctx.fillStyle = "#15162b";
    }
    // warm windows
    ctx.fillStyle = "rgba(255,194,104,.26)";
    for (let j = 0; j < 3; j++) {
      if (hash(i * 9.2 + j) > 0.48) ctx.fillRect(baseX + 18 + j * 27, groundY - h + 24, 8, 11);
    }
  }

  // Water tower.
  const tx = W * 0.16 + shift * 0.55;
  const ty = groundY - 195;
  ctx.strokeStyle = "#111226";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(tx - 24, groundY);
  ctx.lineTo(tx - 14, ty);
  ctx.moveTo(tx + 26, groundY);
  ctx.lineTo(tx + 15, ty);
  ctx.stroke();
  ctx.fillStyle = "#121327";
  ctx.strokeStyle = "#0b0c1b";
  ctx.lineWidth = 2;
  rr(ctx, tx - 31, ty - 31, 62, 38, 3);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tx - 35, ty - 31);
  ctx.lineTo(tx, ty - 49);
  ctx.lineTo(tx + 35, ty - 31);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(201,177,223,.24)";
  ctx.font = "8px Silkscreen, monospace";
  ctx.textAlign = "center";
  ctx.fillText("OPPIDAN", tx, ty - 8);

  // Church / clock spire.
  const cx = W * 0.68 + shift * 0.5;
  ctx.fillStyle = "#141428";
  ctx.fillRect(cx - 22, groundY - 158, 44, 158);
  poly(ctx, [[cx - 26, groundY - 158], [cx, groundY - 235], [cx + 26, groundY - 158]]);
  ctx.fill();
  ctx.fillStyle = "rgba(255,205,112,.28)";
  ctx.beginPath();
  ctx.arc(cx, groundY - 132, 8, 0, TAU);
  ctx.fill();

  ctx.restore();
}

function smoke(ctx, x, y, t, seed) {
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.12 + i * 0.33 + seed) % 1;
    ctx.globalAlpha = (1 - p) * 0.12;
    ctx.fillStyle = "#c9c4db";
    ctx.beginPath();
    ctx.arc(x + Math.sin(p * 4 + seed * 9) * 9, y - p * 44, 5 + p * 11, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function windowAt(ctx, x, y, w, h, lit, t, seed, trim) {
  ctx.fillStyle = lit ? "#ffc16c" : "#15172a";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.7;
  rr(ctx, x, y, w, h, 1);
  ctx.fill();
  ctx.stroke();
  if (lit) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, "rgba(255,222,151,.85)");
    g.addColorStop(1, "rgba(238,146,75,.56)");
    ctx.fillStyle = g;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.restore();
    // silhouettes
    ctx.fillStyle = "rgba(92,36,38,.22)";
    if (seed % 3 === 0) {
      ctx.beginPath();
      ctx.arc(x + w * 0.35, y + h * 0.42, w * 0.12, 0, TAU);
      ctx.fill();
      ctx.fillRect(x + w * 0.22, y + h * 0.5, w * 0.26, h * 0.36);
    } else if (seed % 5 === 0) {
      ctx.fillRect(x + w * 0.6, y + h * 0.56, w * 0.18, h * 0.32);
      ctx.beginPath();
      ctx.arc(x + w * 0.69, y + h * 0.55, w * 0.1, 0, TAU);
      ctx.fill();
    }
  }
  // mullions
  ctx.strokeStyle = trim;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 1);
  ctx.lineTo(x + w / 2, y + h - 1);
  ctx.moveTo(x + 1, y + h * 0.47);
  ctx.lineTo(x + w - 1, y + h * 0.47);
  ctx.stroke();
  // snow sill
  ctx.strokeStyle = "rgba(235,241,255,.62)";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x - 2, y + h + 1);
  ctx.lineTo(x + w + 2, y + h + 1);
  ctx.stroke();
}

function building(ctx, b, S, groundY, cam, t, dawn) {
  const sx = (b.x - cam) * S;
  const w = b.w * S;
  const h = b.h * S;
  const top = groundY - h;
  if (sx > 5000 || sx + w < -500) return;

  // Back shadow.
  ctx.fillStyle = "rgba(5,5,13,.33)";
  ctx.fillRect(sx + 9 * S, top + 11 * S, w, h);

  // Body.
  const g = ctx.createLinearGradient(sx, top, sx + w, groundY);
  g.addColorStop(0, b.body);
  g.addColorStop(1, "#171626");
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.fillRect(sx, top, w, h);
  ctx.strokeRect(sx, top, w, h);

  // Roof.
  if (b.roof === "gable") {
    ctx.fillStyle = b.roofColor;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    poly(ctx, [[sx - 18 * S, top + 1], [sx + w / 2, top - 58 * S], [sx + w + 18 * S, top + 1]]);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(240,245,255,.82)";
    ctx.lineWidth = 6 * S;
    ctx.beginPath();
    ctx.moveTo(sx - 19 * S, top + 2);
    ctx.lineTo(sx + w / 2, top - 57 * S);
    ctx.lineTo(sx + w + 19 * S, top + 2);
    ctx.stroke();
    // snow lumps
    ctx.fillStyle = "rgba(245,248,255,.9)";
    for (let i = 0; i < 5; i++) {
      const px = sx + (i / 4) * w;
      const py = top - 28 * S + Math.abs(i - 2) * 13 * S;
      ctx.beginPath();
      ctx.ellipse(px, py, 18 * S, 4 * S, 0, 0, TAU);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = b.roofColor;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.fillRect(sx - 7 * S, top - 13 * S, w + 14 * S, 15 * S);
    ctx.strokeRect(sx - 7 * S, top - 13 * S, w + 14 * S, 15 * S);
    ctx.fillStyle = "rgba(244,248,255,.88)";
    rr(ctx, sx - 10 * S, top - 17 * S, w + 20 * S, 5 * S, 2 * S);
    ctx.fill();
  }

  // Floor separator.
  ctx.strokeStyle = b.trim;
  ctx.lineWidth = 2 * S;
  ctx.beginPath();
  ctx.moveTo(sx, groundY - 122 * S);
  ctx.lineTo(sx + w, groundY - 122 * S);
  ctx.stroke();

  // Upper windows.
  const rowY = top + 42 * S;
  const winW = Math.min(31 * S, w / 7);
  const winH = winW * 1.55;
  b.windows.forEach((frac, i) => {
    const wx = sx + frac * w - winW / 2;
    if (wx + winW > sx + w - 5 * S) return;
    windowAt(ctx, wx, rowY, winW, winH, b.lit[i], t, i + Math.round(b.x), dawn ? "#7b6172" : "#5a4c64");
  });

  if (b.h > 275) {
    const row2 = top + 125 * S;
    b.windows.forEach((frac, i) => {
      if (i % 2) return;
      const wx = sx + frac * w - winW / 2;
      if (wx + winW > sx + w - 5 * S) return;
      windowAt(ctx, wx, row2, winW, winH * 0.86, b.lit[(i + 1) % b.lit.length], t, i + 7, "#5a4c64");
    });
  }

  // Storefront glow.
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const glowG = ctx.createRadialGradient(sx + w * 0.55, groundY - 80 * S, 8, sx + w * 0.55, groundY - 76 * S, 170 * S);
  glowG.addColorStop(0, dawn ? "rgba(255,200,131,.24)" : "rgba(255,189,105,.2)");
  glowG.addColorStop(1, "rgba(255,189,105,0)");
  ctx.fillStyle = glowG;
  ctx.fillRect(sx - 80 * S, groundY - 250 * S, w + 160 * S, 270 * S);
  ctx.restore();

  // Storefront windows band.
  const shopY = groundY - 102 * S;
  const shopH = 58 * S;
  const doorX = sx + b.door * S;
  const doorW = 40 * S;
  ctx.fillStyle = dawn ? "rgba(255,204,133,.16)" : "rgba(255,193,108,.1)";
  ctx.strokeStyle = "rgba(19,15,26,.7)";
  ctx.lineWidth = 2 * S;
  ctx.fillRect(sx + 16 * S, shopY, w - 32 * S, shopH);
  ctx.strokeRect(sx + 16 * S, shopY, w - 32 * S, shopH);

  // Big storefront panes.
  const paneW = Math.min(54 * S, (w - 50 * S) / 3);
  for (let i = 0; i < 3; i++) {
    const px = sx + 27 * S + i * (paneW + 11 * S);
    if (px + paneW > sx + w - 24 * S) break;
    if (Math.abs(px + paneW / 2 - doorX) < doorW) continue;
    const warm = b.lit[(i + 1) % b.lit.length];
    ctx.fillStyle = warm ? "rgba(255,197,115,.72)" : "rgba(35,40,65,.8)";
    ctx.fillRect(px, shopY + 7 * S, paneW, shopH - 14 * S);
    ctx.strokeStyle = "rgba(23,18,31,.65)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(px, shopY + 7 * S, paneW, shopH - 14 * S);
    // interior hints
    if (warm) {
      ctx.fillStyle = "rgba(88,32,36,.2)";
      ctx.fillRect(px + paneW * 0.18, shopY + shopH * 0.48, paneW * 0.2, shopH * 0.34);
      ctx.beginPath();
      ctx.arc(px + paneW * 0.28, shopY + shopH * 0.42, paneW * 0.07, 0, TAU);
      ctx.fill();
    }
  }

  // Door.
  ctx.fillStyle = b.doorColor;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  rr(ctx, doorX - doorW / 2, groundY - 84 * S, doorW, 84 * S, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = dawn ? "rgba(255,206,134,.65)" : "rgba(255,185,98,.52)";
  ctx.fillRect(doorX - doorW / 2 + 5 * S, groundY - 76 * S, doorW - 10 * S, 68 * S);
  ctx.strokeStyle = "rgba(28,20,32,.7)";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(doorX - doorW / 2 + 5 * S, groundY - 76 * S, doorW - 10 * S, 68 * S);
  ctx.fillStyle = "#d7b573";
  ctx.beginPath();
  ctx.arc(doorX + doorW * 0.29, groundY - 42 * S, 1.8 * S, 0, TAU);
  ctx.fill();

  // Awning.
  if (b.awning) {
    ctx.fillStyle = b.awning;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(sx + 22 * S, groundY - 116 * S);
    ctx.lineTo(sx + w - 22 * S, groundY - 116 * S);
    ctx.lineTo(sx + w - 12 * S, groundY - 104 * S);
    ctx.lineTo(sx + 12 * S, groundY - 104 * S);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const ax = sx + 22 * S + ((w - 44 * S) / 5) * i;
      ctx.beginPath();
      ctx.moveTo(ax, groundY - 116 * S);
      ctx.lineTo(ax + 2 * S, groundY - 104 * S);
      ctx.stroke();
    }
  }

  // Sign.
  if (b.name) {
    const signW = Math.min(w * 0.72, 235 * S);
    const signH = 24 * S;
    const signX = sx + w / 2 - signW / 2;
    const signY = groundY - 148 * S;
    ctx.fillStyle = "#11111d";
    ctx.strokeStyle = "#6b5d6e";
    ctx.lineWidth = 1.4;
    rr(ctx, signX, signY, signW, signH, 1);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let fs = 10 * S;
    ctx.font = `${fs}px Silkscreen, monospace`;
    while (ctx.measureText(b.name).width > signW - 12 && fs > 5) {
      fs -= 0.5;
      ctx.font = `${fs}px Silkscreen, monospace`;
    }
    ctx.fillStyle = dawn ? "#ffe4b4" : "#efd7a2";
    ctx.shadowColor = dawn ? "rgba(255,190,110,.4)" : "rgba(255,189,105,.55)";
    ctx.shadowBlur = 9;
    ctx.fillText(b.name, signX + signW / 2, signY + signH / 2 + 0.5);
    ctx.restore();
  }

  // Icicles + snow base.
  ctx.strokeStyle = "rgba(205,221,255,.55)";
  ctx.lineWidth = 1.2 * S;
  for (let i = 0; i < 5; i++) {
    const ix = sx + 18 * S + hash(i + b.x * 0.2) * (w - 36 * S);
    const ih = (3 + hash(i * 4.1) * 10) * S;
    ctx.beginPath();
    ctx.moveTo(ix, top + 2 * S);
    ctx.lineTo(ix + 1 * S, top + ih);
    ctx.stroke();
  }

  // Sidewalk snow drift.
  ctx.fillStyle = "rgba(230,238,255,.18)";
  ctx.beginPath();
  ctx.ellipse(sx + w / 2, groundY + 1, w * 0.44, 5 * S, 0, 0, TAU);
  ctx.fill();
}

function footPrints(ctx, prints, cam, S, groundY) {
  prints.forEach((p) => {
    const x = (p.x - cam) * S;
    if (x < -20 || x > ctx.canvas.width + 20) return;
    ctx.save();
    ctx.globalAlpha = p.alpha * 0.32;
    ctx.fillStyle = "#7486b6";
    ellipse(ctx, x + p.side * 2 * S, groundY + 9 * S, 3.2 * S, 1.6 * S, -0.2);
    ctx.fill();
    ctx.restore();
  });
}

function streetBase(ctx, W, H, groundY, cam, t, dawn, prints) {
  // Road and sidewalk.
  const g = ctx.createLinearGradient(0, groundY - 14, 0, H);
  g.addColorStop(0, dawn ? "#a58a9b" : "#6e7199");
  g.addColorStop(0.12, dawn ? "#7a6b84" : "#474c72");
  g.addColorStop(1, dawn ? "#48445f" : "#191b32");
  ctx.fillStyle = g;
  ctx.fillRect(0, groundY - 8, W, H - groundY + 8);

  // Curb.
  ctx.fillStyle = "rgba(227,235,255,.55)";
  ctx.fillRect(0, groundY - 9, W, 5);
  ctx.fillStyle = "rgba(28,27,48,.75)";
  ctx.fillRect(0, groundY - 4, W, 6);

  // Sidewalk slab lines.
  ctx.strokeStyle = "rgba(10,10,23,.23)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    const x = ((i * 160 - cam * 0.8) % (W + 160)) - 80;
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x - 22, H);
    ctx.stroke();
  }

  footPrints(ctx, prints, cam, 1, groundY);

  // Snow drifts along the curb.
  const drift = (yBase, amp, color, alpha) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, yBase);
    for (let x = 0; x <= W + 20; x += 28) {
      ctx.lineTo(x, yBase + Math.sin((x + cam) * 0.018) * amp + Math.sin((x + cam) * 0.007 + 2) * amp * 0.5);
    }
    ctx.lineTo(W + 20, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  drift(groundY + 13, 4, dawn ? "#d9c9d6" : "#cbd6f0", 0.28);
  drift(H - 38, 7, dawn ? "#efd8d7" : "#e3ebff", 0.16);

  // Road tracks.
  ctx.strokeStyle = "rgba(211,226,255,.12)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(((i * 260 - cam * 1.1) % (W + 260)) - 130, groundY + 52);
    ctx.lineTo(((i * 260 - cam * 1.1) % (W + 260)) - 110, H);
    ctx.stroke();
  }
}

function lamp(ctx, x, S, groundY, t, dawn) {
  const h = 152 * S;
  const top = groundY - h;
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4 * S;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, groundY);
  ctx.lineTo(x, top + 15 * S);
  ctx.quadraticCurveTo(x, top + 3 * S, x + 12 * S, top + 4 * S);
  ctx.stroke();
  ctx.strokeStyle = "#373950";
  ctx.lineWidth = 2 * S;
  ctx.stroke();
  // Lantern.
  ctx.fillStyle = dawn ? "#fff2c8" : "#ffd989";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2 * S;
  rr(ctx, x + 5 * S, top + 6 * S, 15 * S, 18 * S, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#2f3047";
  poly(ctx, [[x + 2 * S, top + 6 * S], [x + 12.5 * S, top - 2 * S], [x + 23 * S, top + 6 * S]]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(245,250,255,.9)";
  rr(ctx, x + 2 * S, top - 4 * S, 22 * S, 3 * S, 1);
  ctx.fill();
  // Glow.
  glow(ctx, x + 12.5 * S, top + 15 * S, 72 * S, "rgba(255,204,108,.4)", dawn ? 0.7 : 1);
  ctx.restore();
}

function policeCar(ctx, x, S, groundY, t) {
  const y = groundY;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S, S);

  // Shadow.
  ctx.fillStyle = "rgba(5,5,12,.35)";
  ellipse(ctx, 0, 2, 88, 10);
  ctx.fill();

  // Body.
  ctx.fillStyle = "#233c61";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-78, -28);
  ctx.lineTo(-58, -52);
  ctx.lineTo(42, -52);
  ctx.lineTo(76, -28);
  ctx.lineTo(82, -12);
  ctx.lineTo(-82, -12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Roof.
  ctx.fillStyle = "#1b2f4d";
  ctx.beginPath();
  ctx.moveTo(-47, -54);
  ctx.lineTo(-32, -73);
  ctx.lineTo(23, -73);
  ctx.lineTo(43, -54);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Windows.
  ctx.fillStyle = "rgba(154,207,235,.35)";
  poly(ctx, [[-43, -55], [-30, -70], [17, -70], [34, -55]]);
  ctx.fill();
  ctx.strokeStyle = "rgba(16,12,25,.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // White door stripe.
  ctx.fillStyle = "rgba(226,233,245,.82)";
  ctx.fillRect(-30, -39, 55, 13);
  ctx.fillStyle = "#25334f";
  ctx.font = "6px Silkscreen, monospace";
  ctx.textAlign = "center";
  ctx.fillText("OPPIDAN PD", 0, -29);

  // Wheels.
  ctx.fillStyle = "#0e0d16";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  [-46, 53].forEach((wx) => {
    ctx.beginPath();
    ctx.arc(wx, -9, 13, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#57556c";
    ctx.beginPath();
    ctx.arc(wx, -9, 5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#0e0d16";
  });

  // Lightbar.
  const flash = Math.sin(t * 8) > 0;
  ctx.fillStyle = flash ? "#ff6678" : "#702a3b";
  rr(ctx, -20, -62, 15, 6, 2);
  ctx.fill();
  ctx.fillStyle = flash ? "#3a335f" : "#79c7ff";
  rr(ctx, 5, -62, 15, 6, 2);
  ctx.fill();
  glow(ctx, flash ? -12 : 12, -58, 30, flash ? "rgba(255,80,100,.45)" : "rgba(90,180,255,.4)");
  ctx.restore();
}

function tree(ctx, x, S, groundY, t) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(S, S);

  // Trunk.
  ctx.strokeStyle = INK;
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-2, -40, 1, -80, 0, -120);
  ctx.stroke();
  ctx.strokeStyle = "#493b43";
  ctx.lineWidth = 10;
  ctx.stroke();

  const rand = rng(41);
  const branch = (x1, y1, angle, len, width, depth) => {
    if (depth <= 0) return;
    const x2 = x1 + Math.cos(angle) * len;
    const y2 = y1 + Math.sin(angle) * len;
    ctx.strokeStyle = INK;
    ctx.lineWidth = width + 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = "#493b43";
    ctx.lineWidth = width;
    ctx.stroke();
    branch(x2, y2, angle - 0.35 - rand() * 0.3, len * 0.68, width * 0.62, depth - 1);
    branch(x2, y2, angle + 0.3 + rand() * 0.32, len * 0.64, width * 0.58, depth - 1);
  };
  branch(0, -108, -1.75, 45, 7, 4);
  branch(0, -112, -1.35, 50, 8, 4);
  branch(0, -101, -2.08, 42, 6, 3);

  // Snow on branches.
  ctx.strokeStyle = "rgba(238,244,255,.72)";
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 9; i++) {
    const bx = -50 + rand() * 100;
    const by = -120 - rand() * 66;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 15, by - 3);
    ctx.stroke();
  }

  // String lights.
  const lights = [
    [-55, -128], [-28, -151], [0, -159], [31, -149], [57, -126],
  ];
  ctx.strokeStyle = "rgba(24,20,28,.85)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  lights.forEach(([lx, ly], i) => (i ? ctx.lineTo(lx, ly) : ctx.moveTo(lx, ly)));
  ctx.stroke();
  lights.forEach(([lx, ly], i) => {
    const flicker = 0.66 + 0.34 * Math.sin(t * 2.5 + i * 1.9);
    ctx.fillStyle = i % 2 ? "#ffd778" : "#ff9f8e";
    ctx.beginPath();
    ctx.arc(lx, ly + 5, 2.6, 0, TAU);
    ctx.fill();
    glow(ctx, lx, ly + 5, 18, i % 2 ? "rgba(255,207,100,.25)" : "rgba(255,140,120,.22)", flicker);
  });

  // Frozen ground.
  ctx.fillStyle = "rgba(239,246,255,.5)";
  ellipse(ctx, 0, 0, 38, 5);
  ctx.fill();
  ctx.restore();
}

function bench(ctx, x, S, groundY) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(S, S);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.fillStyle = "#3b3544";
  ctx.fillRect(-34, -23, 68, 7);
  ctx.strokeRect(-34, -23, 68, 7);
  ctx.fillRect(-34, -38, 68, 6);
  ctx.strokeRect(-34, -38, 68, 6);
  ctx.fillRect(-29, -16, 5, 16);
  ctx.strokeRect(-29, -16, 5, 16);
  ctx.fillRect(24, -16, 5, 16);
  ctx.strokeRect(24, -16, 5, 16);
  ctx.fillStyle = "rgba(240,245,255,.7)";
  rr(ctx, -36, -41, 72, 4, 2);
  ctx.fill();
  ctx.restore();
}

function fairyLights(ctx, cam, S, groundY, t) {
  const start = (1300 - cam) * S;
  const end = (1740 - cam) * S;
  if (end < -100 || start > ctx.canvas.width + 100) return;
  const y1 = groundY - 230 * S;
  const y2 = groundY - 238 * S;
  const sag = 34 * S;
  ctx.save();
  ctx.strokeStyle = "rgba(22,18,28,.85)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(start, y1);
  ctx.quadraticCurveTo((start + end) / 2, y1 + sag * 2, end, y2);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const p = i / 11;
    const x = start + (end - start) * p;
    const y = y1 + (y2 - y1) * p + Math.sin(p * Math.PI) * sag;
    const flicker = 0.55 + 0.45 * Math.sin(t * 2.2 + i * 1.5);
    ctx.fillStyle = i % 3 === 0 ? "#ffd475" : "#ffab86";
    ctx.beginPath();
    ctx.arc(x, y, 1.9, 0, TAU);
    ctx.fill();
    glow(ctx, x, y, 14 * S, i % 3 === 0 ? "rgba(255,211,112,.2)" : "rgba(255,155,120,.17)", flicker);
  }
  ctx.restore();
}

function speechBubble(ctx, x, y, type, t) {
  const bob = Math.sin(t * 2.2) * 2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = "rgba(12,11,22,.9)";
  ctx.strokeStyle = type === "!" ? "#ffd36a" : "#7e749b";
  ctx.lineWidth = 1.4;
  rr(ctx, -11, -11, 22, 19, 3);
  ctx.fill();
  ctx.stroke();
  poly(ctx, [[-2, 8], [4, 8], [0, 14]]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = type === "!" ? "#ffd36a" : "#a49abc";
  ctx.font = "10px Silkscreen, monospace";
  ctx.textAlign = "center";
  ctx.fillText(type, 0, 3);
  ctx.restore();
}

function targetMarker(ctx, x, y, t) {
  const bob = Math.sin(t * 3) * 4;
  ctx.save();
  ctx.translate(x, y + bob);
  glow(ctx, 0, 0, 26, "rgba(255,211,106,.2)");
  ctx.fillStyle = "#ffd36a";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(7, 0);
  ctx.lineTo(0, 8);
  ctx.lineTo(-7, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff4d3";
  ctx.beginPath();
  ctx.arc(0, 0, 1.7, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function breath(ctx, x, y, t, S, seed) {
  const p = (t * 0.45 + seed) % 1;
  if (p > 0.5) return;
  const a = (1 - p * 2) * 0.12;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "#e9efff";
  ctx.beginPath();
  ctx.arc(x + p * 18 * S, y - p * 12 * S, 2 + p * 6, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 7 * S + p * 25 * S, y - 4 * S - p * 17 * S, 1.5 + p * 5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawStreet(ctx, W, H, t, state) {
  const L = layout(W, H);
  const { S, groundY } = L;
  const cam = state.camera || 0;
  const dawn = !!state.ending;
  const title = !!state.title;

  ctx.clearRect(0, 0, W, H);
  sky(ctx, W, H, groundY, t, dawn);
  mountainRidge(ctx, W, groundY, cam, t, 0, 96 * S, 70 * S, dawn ? "#766d8c" : "#20223f", true);
  mountainRidge(ctx, W, groundY, cam, t, 1, 54 * S, 42 * S, dawn ? "#5f5879" : "#2b2b49", true);
  farTown(ctx, W, groundY, cam, t);

  // Fog band.
  ctx.save();
  ctx.globalAlpha = dawn ? 0.09 : 0.13;
  ctx.fillStyle = dawn ? "#ffd9cb" : "#b7b0d9";
  ctx.fillRect(0, groundY - 92 * S, W, 52 * S);
  ctx.restore();

  BUILDINGS.forEach((b) => building(ctx, b, S, groundY, cam, t, dawn));

  tree(ctx, (1618 - cam) * S, S, groundY, t);
  fairyLights(ctx, cam, S, groundY, t);
  bench(ctx, (1420 - cam) * S, S, groundY);
  streetBase(ctx, W, H, groundY, cam, t, dawn, state.footprints || []);

  // Props behind characters.
  LAMPS.forEach((lx) => {
    const sx = (lx - cam) * S;
    if (sx > -100 && sx < W + 100) lamp(ctx, sx, S, groundY, t, dawn);
  });

  const carX = (700 - cam) * S;
  if (carX > -230 && carX < W + 230) policeCar(ctx, carX, S, groundY, t);

  if (title || dawn) {
    // No actors during the title or epilogue. A single warm window holds the frame.
    ctx.save();
    ctx.globalAlpha = 0.8;
    glow(ctx, W * 0.31, groundY - 150 * S, 120 * S, "rgba(255,190,110,.2)");
    ctx.restore();
    drawSnow(ctx, W, H, t, title ? 1.2 : 0.8);
    drawVignette(ctx, W, H, 0.65);
    return;
  }

  const p = state.player || {};
  const px = (p.x - cam) * S;
  const visible = p.visible !== false;
  const hugging = !!state.flags?.hugging;

  // NPCs.
  const npcs = state.npcs || {};
  if (npcs.asgore?.visible !== false) {
    const x = (npcs.asgore?.x || 760);
    const sx = (x - cam) * S;
    if (sx > -100 && sx < W + 100) {
      drawAsgore(ctx, sx, groundY, S, { t, facing: 1, mood: npcs.asgore?.talked ? "kind" : "kind" });
      speechBubble(ctx, sx + 31 * S, groundY - 165 * S, npcs.asgore?.talked ? "…" : "!", t);
    }
  }
  if (npcs.toriel?.visible !== false) {
    const x = (npcs.toriel?.x || 1110);
    const sx = (x - cam) * S;
    if (sx > -100 && sx < W + 100) {
      drawToriel(ctx, sx, groundY, S, { t, facing: -1, mood: "warm" });
      speechBubble(ctx, sx - 31 * S, groundY - 156 * S, npcs.toriel?.talked ? "…" : "!", t);
    }
  }
  if (npcs.chris?.visible !== false) {
    const x = npcs.chris?.x || 1540;
    const sx = (x - cam) * S;
    if (sx > -120 && sx < W + 120) {
      drawChris(ctx, sx, groundY, S, {
        t,
        facing: hugging ? -1 : -1,
        mood: hugging ? "hug" : "smile",
        pose: hugging ? "hug" : "idle",
      });
      if (!hugging) speechBubble(ctx, sx - 27 * S, groundY - 160 * S, "!", t);
    }
  }

  // Srif.
  if (visible) {
    drawSrif(ctx, px, groundY, S, {
      t,
      facing: p.facing || 1,
      walking: p.walking,
      phase: p.phase || 0,
      mood: hugging ? "hug" : p.mood || "neutral",
      pose: hugging ? "hug" : "idle",
    });
    breath(ctx, px + (p.facing || 1) * 12 * S, groundY - 108 * S, t, S, p.x * 0.01);
  }

  // Hug warmth.
  if (hugging) {
    ctx.save();
    const cx = px;
    const cy = groundY - 82 * S;
    glow(ctx, cx, cy, 110 * S, "rgba(255,190,120,.18)", 0.8);
    for (let i = 0; i < 5; i++) {
      const a = t * 0.7 + i * 1.6;
      const hx = cx + Math.sin(a) * 48 * S;
      const hy = cy - 66 * S - ((t * 18 + i * 17) % 48) * S;
      ctx.globalAlpha = 0.4 + Math.sin(t * 2 + i) * 0.2;
      ctx.fillStyle = "#ffb2b7";
      star(ctx, hx, hy, 3.2 * S, "#ffb2b7");
    }
    ctx.restore();
  }

  // Marker over Chris.
  if (state.marker && npcs.chris?.visible !== false) {
    const sx = (state.marker.x - cam) * S;
    if (sx > -40 && sx < W + 40) targetMarker(ctx, sx, groundY - 182 * S, t);
  }

  // Keep the player readable against the street.
  if (visible) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const g = ctx.createRadialGradient(px, groundY - 52 * S, 2, px, groundY - 52 * S, 88 * S);
    g.addColorStop(0, "rgba(150,165,255,.055)");
    g.addColorStop(1, "rgba(150,165,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(px - 90 * S, groundY - 160 * S, 180 * S, 190 * S);
    ctx.restore();
  }

  // Edge arrow for the objective if it is off-screen.
  if (state.marker) {
    const mx = (state.marker.x - cam) * S;
    const dir = mx > W ? 1 : mx < 0 ? -1 : 0;
    if (dir) {
      const ax = dir > 0 ? W - 22 : 22;
      const ay = groundY - 110 * S;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.scale(dir, 1);
      ctx.fillStyle = "rgba(255,211,106,.9)";
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.lineTo(4, 0);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // Snow flurries, foreground flakes, and a soft cold bloom.
  drawSnow(ctx, W, H, t, 1, Math.sin(t * 0.3) * 0.35);
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#eef3ff";
  for (let i = 0; i < 8; i++) {
    const x = ((hash(i * 4.8) * W + t * (5 + i)) % (W + 40)) - 20;
    const y = ((hash(i * 6.1) * H + t * (18 + i * 4)) % (H + 40)) - 20;
    ctx.beginPath();
    ctx.arc(x, y, 2.6 + hash(i) * 3.4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  drawVignette(ctx, W, H, dawn ? 0.42 : 0.62);
}
