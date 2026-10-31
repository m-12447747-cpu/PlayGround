import { VW, VH, clamp, hash } from "./constants.js";
import { drawText } from "./text.js";

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

function snowTexture(ctx, w, h, seed = 1) {
  r(ctx, 0, 0, w, h, "#dbe8f7");
  // soft drifts
  for (let i = 0; i < 80; i += 1) {
    const x = hash(i, seed) * w;
    const y = hash(i + 91, seed) * h;
    const rx = 18 + hash(i + 17, seed) * 55;
    const ry = 5 + hash(i + 31, seed) * 16;
    ellipse(ctx, x, y, rx, ry, `rgba(255,255,255,${0.03 + hash(i, 3) * 0.05})`);
  }
  // speckles
  for (let i = 0; i < 900; i += 1) {
    const x = hash(i, seed + 7) * w;
    const y = hash(i + 33, seed + 13) * h;
    const c = hash(i, seed + 19);
    ctx.fillStyle = c > 0.62 ? "rgba(255,255,255,0.38)" : c > 0.3 ? "rgba(160,185,220,0.20)" : "rgba(120,150,195,0.12)";
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
  }
}

function drawRoad(ctx, x, y, w, h) {
  r(ctx, x, y, w, h, "#262d42");
  r(ctx, x, y, w, 2, "#1b2132");
  r(ctx, x, y + h - 2, w, 2, "#1b2132");
  // asphalt grain
  for (let i = 0; i < 240; i += 1) {
    const px = x + hash(i, 11) * w;
    const py = y + 4 + hash(i + 7, 11) * (h - 8);
    ctx.fillStyle = hash(i, 13) > 0.5 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.10)";
    ctx.fillRect(Math.floor(px), Math.floor(py), 1, 1);
  }
  // center line
  for (let lx = x + 10; lx < x + w; lx += 34) {
    r(ctx, lx, y + h / 2 - 1, 18, 2, "#c7a45b");
  }
  // tire tracks
  r(ctx, x, y + 13, w, 2, "rgba(10,14,25,0.24)");
  r(ctx, x, y + h - 16, w, 2, "rgba(10,14,25,0.24)");
  // snow at edges
  for (let sx = x; sx < x + w; sx += 7) {
    const edge = hash(sx, 5) * 4;
    ellipse(ctx, sx, y + 1, 4, 1 + edge * 0.3, "rgba(235,245,255,0.55)");
    ellipse(ctx, sx, y + h - 1, 4, 1 + edge * 0.3, "rgba(235,245,255,0.55)");
  }
}

function drawSidewalk(ctx, x, y, w, h) {
  r(ctx, x, y, w, h, "#b8c8db");
  r(ctx, x, y, w, 1, "#d6e3f1");
  r(ctx, x, y + h - 1, w, 1, "#93a5bd");
  for (let tx = x; tx < x + w; tx += 16) {
    r(ctx, tx, y, 1, h, "rgba(115,135,165,0.22)");
  }
  for (let ty = y + 10; ty < y + h; ty += 12) {
    r(ctx, x, ty, w, 1, "rgba(115,135,165,0.14)");
  }
}

function drawCrosswalk(ctx, x, y, w, h) {
  for (let i = 0; i < 6; i += 1) {
    r(ctx, x + 2, y + 4 + i * 9, w - 4, 5, "#d8e3f2");
  }
}

function drawPine(ctx, x, y, scale = 1) {
  const s = scale;
  r(ctx, x - 2 * s, y - 8 * s, 4 * s, 8 * s, "#4a3327");
  const layers = [
    { w: 20, h: 18, y: -8 },
    { w: 16, h: 16, y: -17 },
    { w: 12, h: 14, y: -26 },
  ];
  for (const layer of layers) {
    ctx.fillStyle = "#1f3a3a";
    ctx.beginPath();
    ctx.moveTo(x, y + (layer.y - layer.h) * s);
    ctx.lineTo(x - (layer.w / 2) * s, y + layer.y * s);
    ctx.lineTo(x + (layer.w / 2) * s, y + layer.y * s);
    ctx.closePath();
    ctx.fill();
    // snow on the branches
    ctx.fillStyle = "#eaf4ff";
    ctx.beginPath();
    ctx.moveTo(x, y + (layer.y - layer.h + 2) * s);
    ctx.lineTo(x - (layer.w / 2 - 2) * s, y + layer.y * s);
    ctx.lineTo(x - (layer.w / 2 - 6) * s, y + (layer.y + 1) * s);
    ctx.lineTo(x, y + (layer.y - layer.h + 5) * s);
    ctx.closePath();
    ctx.fill();
  }
  ellipse(ctx, x, y + 1, 9 * s, 2.4 * s, "rgba(90,120,160,0.18)");
}

function drawBareTree(ctx, x, y, scale = 1) {
  const s = scale;
  r(ctx, x - 2 * s, y - 22 * s, 4 * s, 22 * s, "#46352d");
  line(ctx, x, y - 16 * s, x - 10 * s, y - 26 * s, "#46352d", 2 * s);
  line(ctx, x, y - 19 * s, x + 9 * s, y - 29 * s, "#46352d", 2 * s);
  line(ctx, x - 10 * s, y - 26 * s, x - 14 * s, y - 31 * s, "#46352d", 1.4 * s);
  line(ctx, x + 9 * s, y - 29 * s, x + 14 * s, y - 33 * s, "#46352d", 1.4 * s);
  r(ctx, x - 9 * s, y - 27 * s, 6 * s, 1 * s, "#eaf4ff");
  r(ctx, x + 6 * s, y - 30 * s, 6 * s, 1 * s, "#eaf4ff");
  ellipse(ctx, x, y + 1, 8 * s, 2 * s, "rgba(90,120,160,0.18)");
}

function drawLamp(ctx, x, y, scale = 1) {
  const s = scale;
  r(ctx, x - 1 * s, y - 30 * s, 2 * s, 30 * s, "#202738");
  r(ctx, x - 3 * s, y - 2 * s, 6 * s, 2 * s, "#202738");
  r(ctx, x - 5 * s, y - 33 * s, 10 * s, 4 * s, "#202738");
  r(ctx, x - 3 * s, y - 31 * s, 6 * s, 2 * s, "#ffd98a");
  r(ctx, x - 1 * s, y - 34 * s, 2 * s, 1 * s, "#202738");
  r(ctx, x - 4 * s, y - 34 * s, 8 * s, 1 * s, "#eaf4ff");
}

function drawBench(ctx, x, y) {
  r(ctx, x - 16, y - 8, 32, 3, "#5b4030");
  r(ctx, x - 16, y - 12, 32, 3, "#6b4a36");
  r(ctx, x - 14, y - 5, 2, 5, "#2b2a30");
  r(ctx, x + 12, y - 5, 2, 5, "#2b2a30");
  r(ctx, x - 16, y - 9, 32, 1, "#eaf4ff");
  r(ctx, x - 16, y - 13, 32, 1, "#eaf4ff");
}

function drawFence(ctx, x1, x2, y) {
  for (let x = x1; x <= x2; x += 18) {
    r(ctx, x, y - 16, 2, 16, "#30394b");
    r(ctx, x - 1, y - 17, 4, 2, "#eaf4ff");
  }
  r(ctx, x1, y - 12, x2 - x1, 2, "#30394b");
  r(ctx, x1, y - 5, x2 - x1, 2, "#30394b");
  r(ctx, x1, y - 12, x2 - x1, 1, "#eaf4ff");
}

function drawSnowbank(ctx, x, y, w) {
  for (let i = 0; i < w; i += 12) {
    const h = 4 + hash(i + x, y) * 7;
    ellipse(ctx, x + i, y, 10, h, "rgba(238,247,255,0.92)");
  }
}

function drawCar(ctx, x, y) {
  // police cruiser side view, facing left
  r(ctx, x + 4, y - 16, 42, 10, "#e8eef8");
  r(ctx, x + 10, y - 22, 24, 8, "#dce6f4");
  r(ctx, x + 12, y - 21, 9, 6, "#6c8db6");
  r(ctx, x + 24, y - 21, 8, 6, "#6c8db6");
  r(ctx, x + 4, y - 8, 42, 2, "#1a2130");
  r(ctx, x + 2, y - 14, 3, 6, "#1a2130");
  r(ctx, x + 46, y - 14, 3, 6, "#1a2130");
  r(ctx, x + 14, y - 15, 22, 3, "#2c3b63");
  r(ctx, x + 20, y - 17, 8, 3, "#ffd166");
  r(ctx, x + 21, y - 16, 2, 1, "#5a3a00");
  r(ctx, x + 33, y - 17, 6, 3, "#ff5d73");
  r(ctx, x + 34, y - 16, 1, 1, "#fff");
  // snow on roof
  r(ctx, x + 10, y - 23, 24, 2, "#f2f8ff");
  ellipse(ctx, x + 18, y + 1, 7, 2.4, "rgba(60,80,115,0.18)");
  ellipse(ctx, x + 36, y + 1, 7, 2.4, "rgba(60,80,115,0.18)");
}

function drawSign(ctx, x, y, w, text, sub) {
  r(ctx, x - 2, y - 2, w + 4, 26, "#1b2338");
  r(ctx, x, y, w, 22, "#2b3a5b");
  r(ctx, x + 2, y + 2, w - 4, 18, "#1d2946");
  drawText(ctx, text, x + w / 2, y + 4, {
    font: '7px "Press Start 2P", monospace',
    color: "#ffd98a",
    align: "center",
    shadow: "#000",
  });
  if (sub) {
    drawText(ctx, sub, x + w / 2, y + 13, {
      font: '12px "VT323", monospace',
      color: "#a9c9f5",
      align: "center",
    });
  }
  r(ctx, x + 4, y + 1, w - 8, 1, "#eaf4ff");
}

function drawHouse(ctx) {
  const x = 58;
  const y = 186;
  const w = 164;
  const h = 124;
  r(ctx, x + 6, y + h, w - 12, 8, "rgba(70,90,125,0.18)");
  // roof
  r(ctx, x - 8, y - 4, w + 16, 12, "#eaf4ff");
  r(ctx, x - 6, y + 6, w + 12, 4, "#c8d8ea");
  r(ctx, x, y + 10, w, h - 10, "#6b3f45");
  // brick
  for (let by = y + 18; by < y + h; by += 8) {
    r(ctx, x, by, w, 1, "rgba(55,28,34,0.35)");
    for (let bx = x + ((by / 8) % 2 ? 8 : 0); bx < x + w; bx += 16) {
      r(ctx, bx, by, 1, 8, "rgba(55,28,34,0.28)");
    }
  }
  r(ctx, x, y + 10, w, 3, "#7b4b52");
  // chimney
  r(ctx, x + 126, y - 26, 16, 30, "#59353c");
  r(ctx, x + 124, y - 28, 20, 5, "#eaf4ff");
  r(ctx, x + 126, y - 23, 16, 1, "#3e2228");
  // windows
  const window = (wx, wy) => {
    r(ctx, wx - 2, wy - 2, 28, 26, "#e7eef8");
    r(ctx, wx, wy, 24, 22, "#1c2b47");
    r(ctx, wx + 2, wy + 2, 20, 18, "#ffd98a");
    r(ctx, wx + 2, wy + 2, 20, 4, "#ffe9b0");
    r(ctx, wx + 11, wy + 2, 2, 18, "#c99b52");
    r(ctx, wx + 2, wy + 11, 20, 2, "#c99b52");
    r(ctx, wx - 2, wy + 24, 28, 2, "#eaf4ff");
  };
  window(x + 18, y + 38);
  window(x + 120, y + 38);
  // door
  r(ctx, x + 66, y + 66, 32, 58, "#e7eef8");
  r(ctx, x + 68, y + 68, 28, 54, "#2f6f6a");
  r(ctx, x + 70, y + 70, 24, 52, "#245a56");
  r(ctx, x + 72, y + 72, 20, 2, "#3b807a");
  r(ctx, x + 90, y + 95, 2, 2, "#ffd166");
  // wreath
  ellipse(ctx, x + 82, y + 88, 6, 6, "#2f6b4b");
  ellipse(ctx, x + 82, y + 88, 4, 4, "#1f4e36");
  r(ctx, x + 80, y + 83, 2, 2, "#d65b6e");
  // porch
  r(ctx, x + 54, y + 122, 56, 4, "#c8d8ea");
  r(ctx, x + 54, y + 126, 56, 3, "#aebfd4");
  r(ctx, x + 56, y + 129, 52, 2, "#eaf4ff");
  // sign
  r(ctx, x + 56, y + 20, 52, 14, "#2b2330");
  drawText(ctx, "DREEMURR", x + 82, y + 23, {
    font: '5px "Press Start 2P", monospace',
    color: "#ffd98a",
    align: "center",
  });
  // little mailbox
  r(ctx, x + 140, y + 116, 2, 9, "#2a2a30");
  r(ctx, x + 136, y + 108, 10, 8, "#b33a4a");
  r(ctx, x + 136, y + 108, 10, 2, "#eaf4ff");
}

function drawDiner(ctx) {
  const x = 556;
  const y = 158;
  const w = 194;
  const h = 152;
  r(ctx, x + 6, y + h, w - 12, 8, "rgba(70,90,125,0.2)");
  // roof
  r(ctx, x - 8, y - 6, w + 16, 12, "#eaf4ff");
  r(ctx, x - 6, y + 4, w + 12, 4, "#c8d8ea");
  // facade
  r(ctx, x, y + 8, w, h - 8, "#e6d6b5");
  r(ctx, x, y + 8, w, 10, "#2f6f6b");
  r(ctx, x, y + 18, w, 3, "#234f4c");
  // sign board
  r(ctx, x + 14, y + 24, w - 28, 34, "#2b2330");
  r(ctx, x + 16, y + 26, w - 32, 30, "#2f6f6b");
  r(ctx, x + 18, y + 28, w - 36, 26, "#245a56");
  drawText(ctx, "HOLIDAY", x + w / 2, y + 30, {
    font: '9px "Press Start 2P", monospace',
    color: "#ffd98a",
    align: "center",
    shadow: "#1b0e00",
  });
  drawText(ctx, "DINER", x + w / 2, y + 42, {
    font: '9px "Press Start 2P", monospace',
    color: "#ff8a9a",
    align: "center",
    shadow: "#1b0e00",
  });
  // awning
  for (let i = 0; i < 10; i += 1) {
    r(ctx, x + 10 + i * 18, y + 64, 18, 12, i % 2 ? "#e7e2d8" : "#b33a4a");
    r(ctx, x + 10 + i * 18, y + 64, 18, 2, "#f2f8ff");
  }
  r(ctx, x + 8, y + 76, w - 16, 2, "#7c2a36");
  // windows
  const win = (wx, ww) => {
    r(ctx, wx - 2, y + 84, ww + 4, 54, "#f2f8ff");
    r(ctx, wx, y + 86, ww, 50, "#203653");
    r(ctx, wx + 2, y + 88, ww - 4, 46, "#ffd98a");
    r(ctx, wx + 2, y + 88, ww - 4, 10, "#ffeab5");
    r(ctx, wx + 2, y + 116, ww - 4, 18, "#d89a4e");
    r(ctx, wx + 2, y + 88, ww - 4, 1, "#fff4d0");
    // silhouettes of booths
    r(ctx, wx + 8, y + 116, 10, 10, "#7a4a2c");
    r(ctx, wx + 8, y + 112, 10, 4, "#8f5a37");
    r(ctx, wx + ww - 20, y + 116, 10, 10, "#7a4a2c");
    r(ctx, wx + ww - 20, y + 112, 10, 4, "#8f5a37");
    r(ctx, wx - 2, y + 136, ww + 4, 2, "#eaf4ff");
  };
  win(x + 18, 56);
  win(x + 88, 56);
  // door
  r(ctx, x + 148, y + 90, 32, 52, "#f2f8ff");
  r(ctx, x + 150, y + 92, 28, 48, "#2f6f6b");
  r(ctx, x + 152, y + 94, 24, 46, "#245a56");
  r(ctx, x + 154, y + 96, 20, 2, "#3b807a");
  r(ctx, x + 172, y + 116, 2, 2, "#ffd166");
  // door wreath
  ellipse(ctx, x + 164, y + 108, 5, 5, "#2f6b4b");
  ellipse(ctx, x + 164, y + 108, 3, 3, "#1f4e36");
  r(ctx, x + 162, y + 104, 2, 2, "#d65b6e");
  // step
  r(ctx, x + 142, y + 142, 44, 4, "#c8d8ea");
  r(ctx, x + 140, y + 146, 48, 3, "#eaf4ff");
  // OPEN neon
  r(ctx, x + 40, y + 94, 28, 11, "#1a2236");
  drawText(ctx, "OPEN", x + 54, y + 95, {
    font: '6px "Press Start 2P", monospace',
    color: "#ff8a9a",
    align: "center",
    shadow: "#3a0b14",
  });
  // little holiday lights
  for (let i = 0; i < 14; i += 1) {
    const lx = x + 12 + i * 13;
    const ly = y + 78 + Math.sin(i * 0.9) * 2;
    r(ctx, lx, ly, 2, 2, i % 3 === 0 ? "#ffd166" : i % 3 === 1 ? "#ff7a9e" : "#5fe0c8");
  }
}

function drawPolice(ctx) {
  const x = 300;
  const y = 170;
  const w = 156;
  const h = 140;
  r(ctx, x + 6, y + h, w - 12, 8, "rgba(70,90,125,0.18)");
  r(ctx, x - 8, y - 4, w + 16, 10, "#eaf4ff");
  r(ctx, x - 6, y + 4, w + 12, 4, "#c8d8ea");
  r(ctx, x, y + 8, w, h - 8, "#33415f");
  for (let by = y + 18; by < y + h; by += 10) {
    r(ctx, x, by, w, 1, "rgba(16,24,42,0.4)");
    for (let bx = x + ((by / 10) % 2 ? 9 : 0); bx < x + w; bx += 18) {
      r(ctx, bx, by, 1, 10, "rgba(16,24,42,0.3)");
    }
  }
  // sign
  r(ctx, x + 24, y + 18, 108, 22, "#1b2338");
  drawText(ctx, "OPPIDAN PD", x + w / 2, y + 23, {
    font: '8px "Press Start 2P", monospace',
    color: "#9ecbff",
    align: "center",
    shadow: "#000",
  });
  // windows
  const win = (wx) => {
    r(ctx, wx - 2, y + 52, 30, 26, "#e7eef8");
    r(ctx, wx, y + 54, 26, 22, "#1c2b47");
    r(ctx, wx + 2, y + 56, 22, 18, "#a9c9f5");
    r(ctx, wx + 2, y + 56, 22, 5, "#d6e7ff");
    r(ctx, wx + 12, y + 56, 2, 18, "#55729e");
    r(ctx, wx + 2, y + 65, 22, 2, "#55729e");
  };
  win(x + 22);
  win(x + 104);
  // door
  r(ctx, x + 62, y + 88, 32, 52, "#e7eef8");
  r(ctx, x + 64, y + 90, 28, 48, "#1d2947");
  r(ctx, x + 66, y + 92, 24, 46, "#26365a");
  r(ctx, x + 74, y + 96, 8, 2, "#9ecbff");
  r(ctx, x + 86, y + 114, 2, 2, "#ffd166");
  // blue lamp
  r(ctx, x + 74, y + 74, 2, 14, "#1a2130");
  r(ctx, x + 70, y + 68, 10, 7, "#1a2130");
  r(ctx, x + 72, y + 70, 6, 4, "#4f8dff");
  // steps
  r(ctx, x + 56, y + 140, 44, 4, "#c8d8ea");
  r(ctx, x + 54, y + 144, 48, 3, "#eaf4ff");
}

function drawBookshop(ctx) {
  const x = 786;
  const y = 198;
  const w = 118;
  const h = 112;
  r(ctx, x + 4, y + h, w - 8, 7, "rgba(70,90,125,0.18)");
  r(ctx, x - 6, y - 4, w + 12, 10, "#eaf4ff");
  r(ctx, x - 4, y + 4, w + 8, 4, "#c8d8ea");
  r(ctx, x, y + 8, w, h - 8, "#57416f");
  for (let by = y + 18; by < y + h; by += 9) {
    r(ctx, x, by, w, 1, "rgba(32,20,48,0.35)");
  }
  r(ctx, x + 16, y + 16, 86, 18, "#241a33");
  drawText(ctx, "BOOKS", x + 59, y + 20, {
    font: '8px "Press Start 2P", monospace',
    color: "#e0c8ff",
    align: "center",
    shadow: "#000",
  });
  // window
  r(ctx, x + 12, y + 44, 48, 42, "#e7eef8");
  r(ctx, x + 14, y + 46, 44, 38, "#1c2b47");
  r(ctx, x + 16, y + 48, 40, 34, "#c9a45c");
  r(ctx, x + 16, y + 48, 40, 8, "#e8c87a");
  for (let i = 0; i < 5; i += 1) {
    r(ctx, x + 20 + i * 7, y + 62, 5, 14, ["#b33a4a", "#3f7d78", "#6b4c8f", "#c9a45c", "#4aa377"][i]);
  }
  r(ctx, x + 10, y + 84, 52, 2, "#eaf4ff");
  // door
  r(ctx, x + 72, y + 58, 26, 42, "#e7eef8");
  r(ctx, x + 74, y + 60, 22, 38, "#3a2b4a");
  r(ctx, x + 76, y + 62, 18, 34, "#4b375e");
  r(ctx, x + 90, y + 78, 2, 2, "#ffd166");
}

function drawPark(ctx) {
  // fence along the top, with gate
  drawFence(ctx, 20, 370, 414);
  drawFence(ctx, 466, 940, 414);
  // gate posts
  r(ctx, 366, 396, 4, 18, "#30394b");
  r(ctx, 462, 396, 4, 18, "#30394b");
  r(ctx, 364, 394, 8, 3, "#eaf4ff");
  r(ctx, 460, 394, 8, 3, "#eaf4ff");
  // path from gate
  r(ctx, 402, 416, 20, 130, "#c4d2e2");
  r(ctx, 402, 416, 20, 1, "#dbe6f3");
  for (let py = 420; py < 546; py += 14) {
    r(ctx, 402, py, 20, 1, "rgba(130,150,180,0.2)");
  }
  // pond
  ellipse(ctx, 694, 490, 92, 40, "#b8d4e9");
  ellipse(ctx, 694, 490, 88, 36, "#9fc8e3");
  ellipse(ctx, 694, 486, 80, 28, "rgba(230,246,255,0.45)");
  for (let i = 0; i < 8; i += 1) {
    line(ctx, 620 + i * 18, 470 + (i % 3) * 5, 650 + i * 15, 512 - (i % 2) * 8, "rgba(255,255,255,0.35)", 1);
  }
  // path around pond
  r(ctx, 590, 530, 210, 4, "#c4d2e2");
  // benches
  drawBench(ctx, 196, 476);
  drawBench(ctx, 512, 462);
  // sign
  r(ctx, 430, 440, 2, 16, "#2a2a30");
  r(ctx, 414, 428, 34, 16, "#2b3a5b");
  drawText(ctx, "PARK", 431, 432, {
    font: '5px "Press Start 2P", monospace',
    color: "#ffd98a",
    align: "center",
  });
}

function drawTownBackground(world) {
  const canvas = document.createElement("canvas");
  canvas.width = world.w;
  canvas.height = world.h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  snowTexture(ctx, world.w, world.h, 7);
  // distant treeline / hills at the top edge
  for (let x = -20; x < world.w + 20; x += 24) {
    const h = 16 + hash(x, 2) * 22;
    ctx.fillStyle = "#b8cbe0";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 14, h);
    ctx.lineTo(x + 28, 0);
    ctx.closePath();
    ctx.fill();
  }
  r(ctx, 0, 0, world.w, 18, "rgba(160,185,215,0.35)");

  // roads and sidewalks
  drawRoad(ctx, 0, 330, world.w, 58);
  drawSidewalk(ctx, 0, 310, world.w, 20);
  drawSidewalk(ctx, 0, 388, world.w, 22);
  drawCrosswalk(ctx, 418, 330, 54, 58);

  // paths from doors to sidewalks
  r(ctx, 136, 310, 8, 20, "#c4d2e2");
  r(ctx, 720, 310, 8, 20, "#c4d2e2");
  r(ctx, 368, 310, 8, 20, "#c4d2e2");
  r(ctx, 870, 310, 8, 20, "#c4d2e2");

  drawHouse(ctx);
  drawPolice(ctx);
  drawDiner(ctx);
  drawBookshop(ctx);

  // alley details
  drawBareTree(ctx, 256, 308, 1.1);
  drawBareTree(ctx, 506, 308, 0.9);
  drawPine(ctx, 282, 300, 0.9);
  drawPine(ctx, 528, 298, 0.8);

  // lamps
  drawLamp(ctx, 238, 330);
  drawLamp(ctx, 500, 330);
  drawLamp(ctx, 744, 330);
  drawLamp(ctx, 96, 410);
  drawLamp(ctx, 640, 410);

  // parked cruiser
  drawCar(ctx, 402, 366);

  // park and lower block
  drawPark(ctx);

  // trees in park
  drawPine(ctx, 56, 512, 1.3);
  drawPine(ctx, 108, 548, 1.0);
  drawPine(ctx, 300, 508, 1.1);
  drawPine(ctx, 838, 508, 1.25);
  drawPine(ctx, 906, 548, 0.9);
  drawBareTree(ctx, 470, 520, 1.1);
  drawBareTree(ctx, 884, 470, 0.8);

  // snowbanks around park edge
  drawSnowbank(ctx, 10, 414, 350);
  drawSnowbank(ctx, 470, 414, 470);
  drawSnowbank(ctx, 10, 554, 220);
  drawSnowbank(ctx, 760, 554, 190);

  // street sign
  drawSign(ctx, 500, 284, 74, "HOLLY ST", "OPPIDAN");
  // welcome sign near the house
  drawSign(ctx, 22, 268, 92, "WELCOME", "please stay warm");

  // snowman
  // (drawn in game dynamic layer so it can be interacted with)

  // subtle foreground vignette texture
  for (let i = 0; i < 120; i += 1) {
    const x = hash(i, 21) * world.w;
    const y = hash(i + 7, 21) * world.h;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
  }

  world.bg = canvas;
}

function drawDinerBackground(world) {
  const canvas = document.createElement("canvas");
  canvas.width = world.w;
  canvas.height = world.h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // wall
  r(ctx, 0, 0, 480, 104, "#d9c9a8");
  for (let x = 0; x < 480; x += 24) {
    r(ctx, x, 0, 1, 80, "rgba(120,100,70,0.12)");
  }
  r(ctx, 0, 0, 480, 12, "#b8a57f");
  r(ctx, 0, 78, 480, 6, "#2f6f6b");
  r(ctx, 0, 84, 480, 20, "#3b7d78");
  for (let x = 0; x < 480; x += 16) {
    r(ctx, x, 86, 1, 16, "rgba(20,50,48,0.22)");
  }
  // floor
  for (let y = 104; y < 270; y += 20) {
    for (let x = 0; x < 480; x += 20) {
      const even = ((x / 20) + (y / 20)) % 2 === 0;
      r(ctx, x, y, 20, 20, even ? "#d8cbb2" : "#3f7d78");
    }
  }
  // floor shine
  const shine = ctx.createLinearGradient(0, 104, 0, 270);
  shine.addColorStop(0, "rgba(255,230,180,0.12)");
  shine.addColorStop(1, "rgba(0,0,0,0.16)");
  ctx.fillStyle = shine;
  ctx.fillRect(0, 104, 480, 166);

  // windows with snow
  const window = (x, y, w, h) => {
    r(ctx, x - 3, y - 3, w + 6, h + 6, "#8f7d5e");
    r(ctx, x, y, w, h, "#233a5a");
    const sky = ctx.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, "#3d5d8a");
    sky.addColorStop(1, "#c8dff2");
    ctx.fillStyle = sky;
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    // snow on the glass
    for (let i = 0; i < 12; i += 1) {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillRect(x + 4 + hash(i, 3) * (w - 8), y + 4 + hash(i + 9, 3) * (h - 8), 1, 1);
    }
    r(ctx, x + w / 2 - 1, y + 2, 2, h - 4, "#8f7d5e");
    r(ctx, x + 2, y + h / 2 - 1, w - 4, 2, "#8f7d5e");
    r(ctx, x - 3, y + h + 1, w + 6, 2, "#eaf4ff");
  };
  window(146, 18, 70, 46);
  window(280, 18, 70, 46);

  // string lights
  for (let i = 0; i < 22; i += 1) {
    const x = 10 + i * 22;
    const y = 8 + Math.sin(i * 0.7) * 3;
    r(ctx, x, y, 2, 2, i % 3 === 0 ? "#ffd166" : i % 3 === 1 ? "#ff7a9e" : "#5fe0c8");
    if (i < 21) {
      ctx.strokeStyle = "rgba(50,40,30,0.4)";
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 1);
      ctx.lineTo(x + 22, 8 + Math.sin((i + 1) * 0.7) * 3 + 1);
      ctx.stroke();
    }
  }

  // counter
  r(ctx, 108, 62, 264, 10, "#e8dcc4");
  r(ctx, 108, 72, 264, 18, "#2f6f6b");
  r(ctx, 108, 72, 264, 2, "#245a56");
  for (let x = 116; x < 370; x += 22) {
    r(ctx, x, 76, 1, 12, "rgba(20,50,48,0.25)");
  }
  // pie display
  r(ctx, 128, 48, 40, 16, "#a9c9f5");
  r(ctx, 130, 50, 36, 12, "#d6e7ff");
  ellipse(ctx, 148, 58, 11, 4, "#d89a4e");
  ellipse(ctx, 148, 56, 11, 4, "#f0b96b");
  // register
  r(ctx, 320, 48, 24, 16, "#3a4052");
  r(ctx, 323, 51, 18, 8, "#9ecbff");
  // stools
  for (let i = 0; i < 5; i += 1) {
    const sx = 140 + i * 48;
    r(ctx, sx - 1, 92, 2, 14, "#4a3b30");
    r(ctx, sx - 7, 88, 14, 4, "#8f5a37");
    r(ctx, sx - 7, 88, 14, 1, "#c98a5c");
    ellipse(ctx, sx, 108, 8, 2, "rgba(50,40,30,0.16)");
  }

  // booths left and right
  const booth = (x, y, flip = false) => {
    r(ctx, x, y, 74, 52, "#8f5a37");
    r(ctx, x, y, 74, 4, "#c98a5c");
    r(ctx, x + 6, y + 10, 62, 18, "#d8cbb2");
    r(ctx, x + 6, y + 34, 62, 14, "#3f7d78");
    r(ctx, x + 8, y + 38, 58, 6, "#2f6f6b");
    if (!flip) {
      r(ctx, x + 4, y + 8, 4, 38, "#5b3d2a");
      r(ctx, x + 66, y + 8, 4, 38, "#5b3d2a");
    }
  };
  booth(16, 122);
  booth(356, 122, true);

  // jukebox
  r(ctx, 22, 58, 42, 38, "#4a2b3f");
  r(ctx, 24, 60, 38, 34, "#6b3f5a");
  r(ctx, 28, 64, 30, 14, "#ffd98a");
  r(ctx, 30, 66, 26, 10, "#2a1a2a");
  r(ctx, 32, 68, 22, 2, "#ff7a9e");
  r(ctx, 32, 72, 22, 2, "#5fe0c8");
  ellipse(ctx, 43, 88, 12, 4, "#2a1a2a");
  r(ctx, 28, 92, 30, 2, "#2a1a2a");

  // bathroom door
  r(ctx, 432, 44, 40, 56, "#8f7d5e");
  r(ctx, 434, 46, 36, 54, "#2f4a4a");
  r(ctx, 436, 48, 32, 50, "#24403f");
  r(ctx, 438, 50, 28, 2, "#3d6664");
  r(ctx, 462, 72, 2, 3, "#ffd166");
  drawText(ctx, "WC", 452, 52, {
    font: '7px "Press Start 2P", monospace',
    color: "#a9c9f5",
    align: "center",
  });
  // little restroom sign
  r(ctx, 438, 30, 30, 10, "#1b2338");
  drawText(ctx, "RESTROOM", 453, 32, {
    font: '4px "Press Start 2P", monospace',
    color: "#ffd98a",
    align: "center",
  });

  // exit door bottom center
  r(ctx, 220, 244, 40, 26, "#8f7d5e");
  r(ctx, 222, 244, 36, 24, "#3a2b2b");
  r(ctx, 224, 244, 32, 22, "#4d3838");
  r(ctx, 250, 254, 2, 2, "#ffd166");
  r(ctx, 214, 266, 52, 4, "#c8d8ea");

  // rug
  r(ctx, 196, 190, 88, 42, "#5b3d2a");
  r(ctx, 200, 194, 80, 34, "#7a4a2c");
  r(ctx, 204, 198, 72, 26, "#8f5a37");
  for (let i = 0; i < 4; i += 1) {
    r(ctx, 210 + i * 18, 202, 10, 18, i % 2 ? "#b33a4a" : "#d8cbb2");
  }

  // posters
  r(ctx, 88, 24, 34, 30, "#e7e2d8");
  r(ctx, 90, 26, 30, 26, "#c9a45c");
  r(ctx, 94, 30, 22, 14, "#3f7d78");
  r(ctx, 96, 46, 18, 2, "#2a2a30");
  r(ctx, 100, 50, 10, 2, "#2a2a30");
  drawText(ctx, "HOLIDAY", 105, 32, {
    font: '4px "Press Start 2P", monospace',
    color: "#fff4d0",
    align: "center",
  });

  world.bg = canvas;
}

function drawBathroomBackground(world) {
  const canvas = document.createElement("canvas");
  canvas.width = world.w;
  canvas.height = world.h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // wall tiles
  r(ctx, 0, 0, 480, 168, "#4a7c7c");
  for (let y = 0; y < 168; y += 16) {
    for (let x = 0; x < 480; x += 16) {
      const shade = hash(x, y) > 0.5 ? "#548a8a" : "#4f8383";
      r(ctx, x, y, 16, 16, shade);
      r(ctx, x, y, 16, 1, "#6aa0a0");
      r(ctx, x, y, 1, 16, "#6aa0a0");
      r(ctx, x, y + 15, 16, 1, "#3b6868");
    }
  }
  // wainscot
  r(ctx, 0, 150, 480, 8, "#2f4a4a");
  r(ctx, 0, 158, 480, 10, "#3b6868");
  // floor
  r(ctx, 0, 168, 480, 102, "#6b7f83");
  for (let y = 168; y < 270; y += 12) {
    for (let x = 0; x < 480; x += 12) {
      const shade = ((x / 12) + (y / 12)) % 2 === 0 ? "#75898d" : "#63777b";
      r(ctx, x, y, 12, 12, shade);
    }
  }
  // floor shine
  const shine = ctx.createLinearGradient(0, 168, 0, 270);
  shine.addColorStop(0, "rgba(210,255,250,0.10)");
  shine.addColorStop(1, "rgba(0,0,0,0.20)");
  ctx.fillStyle = shine;
  ctx.fillRect(0, 168, 480, 102);

  // stalls
  r(ctx, 0, 56, 108, 112, "#2f4a4a");
  r(ctx, 4, 60, 100, 104, "#3b6868");
  r(ctx, 8, 64, 44, 96, "#24403f");
  r(ctx, 56, 64, 44, 96, "#24403f");
  r(ctx, 52, 64, 4, 96, "#1b3030");
  r(ctx, 8, 64, 44, 4, "#4a7c7c");
  r(ctx, 56, 64, 44, 4, "#4a7c7c");
  r(ctx, 26, 104, 3, 10, "#ffd166");
  r(ctx, 74, 104, 3, 10, "#ffd166");
  drawText(ctx, "STALLS", 54, 44, {
    font: '5px "Press Start 2P", monospace',
    color: "#a9c9f5",
    align: "center",
  });

  // sink counter
  r(ctx, 138, 112, 210, 22, "#c8d8e0");
  r(ctx, 138, 112, 210, 4, "#eef8ff");
  r(ctx, 138, 130, 210, 4, "#8fa4ad");
  r(ctx, 148, 104, 52, 10, "#b8ccd6");
  r(ctx, 282, 104, 52, 10, "#b8ccd6");
  // faucets
  r(ctx, 172, 100, 4, 8, "#d9e6ec");
  r(ctx, 170, 98, 8, 3, "#eef8ff");
  r(ctx, 306, 100, 4, 8, "#d9e6ec");
  r(ctx, 304, 98, 8, 3, "#eef8ff");
  // basins
  ellipse(ctx, 174, 117, 16, 6, "#9fb8c2");
  ellipse(ctx, 174, 117, 12, 4, "#7f9aa5");
  ellipse(ctx, 308, 117, 16, 6, "#9fb8c2");
  ellipse(ctx, 308, 117, 12, 4, "#7f9aa5");

  // mirror frame
  r(ctx, 160, 24, 160, 76, "#c9a45c");
  r(ctx, 164, 28, 152, 68, "#7a5a35");
  r(ctx, 168, 32, 144, 60, "#1c2b47");
  const mirror = ctx.createLinearGradient(0, 32, 0, 92);
  mirror.addColorStop(0, "#4a6a8f");
  mirror.addColorStop(0.55, "#2a3c5f");
  mirror.addColorStop(1, "#152033");
  ctx.fillStyle = mirror;
  ctx.fillRect(170, 34, 140, 56);
  // reflection highlights
  ctx.fillStyle = "rgba(200,230,255,0.14)";
  ctx.beginPath();
  ctx.moveTo(176, 34);
  ctx.lineTo(208, 34);
  ctx.lineTo(182, 90);
  ctx.lineTo(170, 90);
  ctx.closePath();
  ctx.fill();
  r(ctx, 164, 94, 152, 3, "#eaf4ff");
  // small crack
  line(ctx, 246, 34, 240, 54, "rgba(230,245,255,0.35)", 1);
  line(ctx, 240, 54, 246, 66, "rgba(230,245,255,0.25)", 1);

  // paper towel dispenser
  r(ctx, 382, 62, 30, 18, "#b8ccd6");
  r(ctx, 384, 64, 26, 14, "#eef8ff");
  r(ctx, 388, 78, 18, 14, "#f4fbff");
  // trash
  r(ctx, 402, 126, 26, 30, "#3a4052");
  r(ctx, 404, 124, 22, 4, "#202433");
  // wet floor sign
  ctx.save();
  ctx.translate(360, 194);
  ctx.rotate(-0.1);
  r(ctx, -10, -16, 20, 24, "#ffd166");
  r(ctx, -8, -14, 16, 20, "#e7a333");
  drawText(ctx, "WET", 0, -12, {
    font: '4px "Press Start 2P", monospace',
    color: "#3a2400",
    align: "center",
  });
  ctx.restore();
  // puddles
  ellipse(ctx, 350, 216, 22, 5, "rgba(190,230,240,0.22)");
  ellipse(ctx, 180, 226, 18, 4, "rgba(190,230,240,0.16)");
  ellipse(ctx, 272, 198, 12, 3, "rgba(190,230,240,0.16)");

  // door
  r(ctx, 24, 208, 52, 62, "#2f4a4a");
  r(ctx, 28, 212, 44, 58, "#24403f");
  r(ctx, 30, 214, 40, 2, "#3d6664");
  r(ctx, 66, 242, 2, 3, "#ffd166");
  r(ctx, 18, 266, 64, 4, "#c8d8ea");
  drawText(ctx, "EXIT", 50, 222, {
    font: '5px "Press Start 2P", monospace',
    color: "#a9c9f5",
    align: "center",
  });

  // ceiling light
  r(ctx, 190, 0, 100, 8, "#d9e6ec");
  r(ctx, 196, 2, 88, 4, "#f4fbff");
  r(ctx, 196, 2, 88, 1, "#ffffff");

  world.bg = canvas;
}

export class World {
  constructor(kind) {
    this.kind = kind;
    this.colliders = [];
    this.interactables = [];
    this.glows = [];
    this.spawn = { x: 240, y: 240, dir: "up" };
    if (kind === "town") {
      this.w = 960;
      this.h = 560;
      this.spawn = { x: 150, y: 328, dir: "up" };
      this._buildTown();
    } else if (kind === "diner") {
      this.w = 480;
      this.h = 270;
      this.spawn = { x: 240, y: 214, dir: "up" };
      this._buildDiner();
    } else if (kind === "bathroom") {
      this.w = 480;
      this.h = 270;
      this.spawn = { x: 52, y: 224, dir: "up" };
      this._buildBathroom();
    }
  }

  _buildTown() {
    drawTownBackground(this);
    const addRect = (x, y, w, h) => this.colliders.push({ x, y, w, h });
    // buildings
    addRect(50, 180, 180, 136);
    addRect(292, 164, 172, 150);
    addRect(548, 152, 210, 162);
    addRect(778, 192, 134, 122);
    // trees / lamps / props
    addRect(250, 296, 14, 14);
    addRect(500, 296, 14, 14);
    addRect(274, 288, 18, 18);
    addRect(520, 288, 18, 18);
    addRect(232, 326, 12, 8);
    addRect(494, 326, 12, 8);
    addRect(738, 326, 12, 8);
    addRect(90, 406, 12, 8);
    addRect(634, 406, 12, 8);
    addRect(386, 348, 92, 26); // police cruiser
    // park fence segments (top)
    addRect(18, 398, 352, 16);
    addRect(464, 398, 480, 16);
    // benches
    addRect(180, 466, 32, 12);
    addRect(496, 452, 32, 12);
    // park trees
    addRect(44, 496, 24, 18);
    addRect(96, 532, 24, 18);
    addRect(288, 492, 24, 18);
    addRect(826, 492, 24, 18);
    addRect(894, 532, 24, 18);
    addRect(458, 504, 22, 18);
    addRect(872, 454, 22, 18);
    // pond edge (allow walking on ice? block the middle)
    // no collider for pond; the player can walk on the ice.

    this.interactables = [
      { id: "house", x: 150, y: 318, radius: 24, label: "home", kind: "door" },
      { id: "police", x: 368, y: 318, radius: 24, label: "police station", kind: "door" },
      { id: "diner", x: 720, y: 318, radius: 28, label: "Holiday Diner", kind: "diner" },
      { id: "books", x: 870, y: 318, radius: 22, label: "bookshop", kind: "door" },
      { id: "sign", x: 530, y: 294, radius: 24, label: "read sign", kind: "sign" },
      { id: "bench", x: 196, y: 470, radius: 24, label: "sit", kind: "bench" },
      { id: "snowman", x: 120, y: 470, radius: 24, label: "snowman", kind: "snowman" },
      { id: "car", x: 432, y: 360, radius: 30, label: "police cruiser", kind: "car" },
    ];
    this.glows = [
      { x: 238, y: 304, r: 54, color: "255, 196, 110", phase: 0.1 },
      { x: 500, y: 304, r: 54, color: "255, 196, 110", phase: 1.4 },
      { x: 744, y: 304, r: 58, color: "255, 196, 110", phase: 2.2 },
      { x: 96, y: 386, r: 54, color: "255, 196, 110", phase: 0.7 },
      { x: 640, y: 386, r: 54, color: "255, 196, 110", phase: 1.9 },
      { x: 654, y: 220, r: 92, color: "255, 196, 110", phase: 0.4 },
      { x: 368, y: 260, r: 50, color: "120, 170, 255", phase: 1.1 },
    ];
  }

  _buildDiner() {
    drawDinerBackground(this);
    const addRect = (x, y, w, h) => this.colliders.push({ x, y, w, h });
    // walls
    addRect(0, 0, 480, 104);
    addRect(0, 0, 14, 270);
    addRect(466, 0, 14, 270);
    addRect(0, 258, 480, 12);
    // counter
    addRect(104, 58, 272, 34);
    // booths
    addRect(14, 120, 80, 58);
    addRect(352, 120, 82, 58);
    // jukebox
    addRect(18, 54, 50, 42);
    // exit door frame
    addRect(214, 262, 52, 8);
    // tables / rug (rug walkable)
    this.interactables = [
      { id: "chris", x: 240, y: 120, radius: 30, label: "talk to Chris", kind: "actor" },
      { id: "jukebox", x: 46, y: 102, radius: 28, label: "jukebox", kind: "jukebox" },
      { id: "bathroom", x: 452, y: 104, radius: 28, label: "restroom", kind: "bathroom" },
      { id: "exit", x: 240, y: 250, radius: 26, label: "leave diner", kind: "exit" },
      { id: "poster", x: 105, y: 58, radius: 24, label: "family photo", kind: "poster" },
      { id: "pie", x: 148, y: 58, radius: 22, label: "pie case", kind: "pie" },
    ];
    this.glows = [
      { x: 180, y: 40, r: 72, color: "255, 196, 110", phase: 0.2 },
      { x: 315, y: 40, r: 72, color: "255, 196, 110", phase: 1.2 },
      { x: 46, y: 80, r: 48, color: "255, 140, 190", phase: 0.8 },
      { x: 240, y: 86, r: 60, color: "255, 210, 150", phase: 2.1 },
    ];
  }

  _buildBathroom() {
    drawBathroomBackground(this);
    const addRect = (x, y, w, h) => this.colliders.push({ x, y, w, h });
    addRect(0, 0, 480, 168);
    addRect(0, 0, 14, 270);
    addRect(466, 0, 14, 270);
    addRect(0, 262, 480, 8);
    // stalls
    addRect(0, 56, 108, 112);
    // sink counter
    addRect(134, 100, 218, 36);
    // trash
    addRect(400, 122, 30, 36);
    // door frame
    addRect(18, 262, 64, 8);
    this.interactables = [
      { id: "sink", x: 240, y: 142, radius: 46, label: "wash hands", kind: "sink" },
      { id: "mirror", x: 240, y: 142, radius: 50, label: "look in mirror", kind: "mirror" },
      { id: "exit", x: 50, y: 252, radius: 22, label: "leave restroom", kind: "exit" },
    ];
    this.glows = [
      { x: 240, y: 50, r: 110, color: "150, 235, 255", phase: 0.3 },
      { x: 240, y: 74, r: 70, color: "180, 220, 255", phase: 1.4 },
    ];
  }

  collides(x, y) {
    if (x < 8 || y < 8 || x > this.w - 8 || y > this.h - 6) return true;
    const box = { x: x - 4, y: y - 7, w: 8, h: 7 };
    for (const c of this.colliders) {
      if (box.x < c.x + c.w && box.x + box.w > c.x && box.y < c.y + c.h && box.y + box.h > c.y) {
        return true;
      }
    }
    return false;
  }

  nearestInteractable(x, y, range = 34) {
    let best = null;
    let bestDist = range;
    for (const item of this.interactables) {
      const dist = Math.hypot(item.x - x, item.y - y);
      if (dist < bestDist) {
        bestDist = dist;
        best = item;
      }
    }
    return best;
  }

  drawBackground(ctx, camX, camY) {
    if (!this.bg) return;
    const sx = clamp(Math.round(camX), 0, Math.max(0, this.w - VW));
    const sy = clamp(Math.round(camY), 0, Math.max(0, this.h - VH));
    ctx.drawImage(this.bg, sx, sy, Math.min(VW, this.w), Math.min(VH, this.h), 0, 0, Math.min(VW, this.w), Math.min(VH, this.h));
  }

  drawDynamic(ctx, camX, camY, time, reduceMotion = false) {
    const ox = Math.round(camX);
    const oy = Math.round(camY);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const glow of this.glows) {
      const sx = glow.x - ox;
      const sy = glow.y - oy;
      if (sx < -glow.r || sy < -glow.r || sx > VW + glow.r || sy > VH + glow.r) continue;
      const flicker = reduceMotion ? 1 : 0.86 + Math.sin(time * 2.2 + glow.phase) * 0.08 + Math.sin(time * 7.1 + glow.phase * 2) * 0.04;
      const grad = ctx.createRadialGradient(sx, sy, 1, sx, sy, glow.r);
      grad.addColorStop(0, `rgba(${glow.color}, ${0.22 * flicker})`);
      grad.addColorStop(0.35, `rgba(${glow.color}, ${0.10 * flicker})`);
      grad.addColorStop(1, `rgba(${glow.color}, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(sx - glow.r, sy - glow.r, glow.r * 2, glow.r * 2);
    }
    ctx.restore();

    if (this.kind === "town") {
      // chimney smoke
      const cx = 192;
      const cy = 156;
      for (let i = 0; i < 5; i += 1) {
        const t = (time * 0.18 + i * 0.19) % 1;
        const sx = cx - ox + Math.sin(t * 6 + i) * 4;
        const sy = cy - oy - t * 42;
        const alpha = (1 - t) * 0.18;
        ellipse(ctx, sx, sy, 3 + t * 5, 3 + t * 4, `rgba(210,225,245,${alpha})`);
      }
      // diner neon flicker
      const neon = reduceMotion ? 1 : (Math.sin(time * 9) > -0.85 ? 1 : 0.35);
      ctx.save();
      ctx.globalAlpha = neon;
      drawText(ctx, "OPEN", 610 - ox, 252 - oy, {
        font: '6px "Press Start 2P", monospace',
        color: "#ff8a9a",
        align: "center",
        shadow: "#3a0b14",
      });
      ctx.restore();
      // window shimmer
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(255,230,170,0.05)";
      for (let i = 0; i < 4; i += 1) {
        const wx = [76, 178, 574, 644][i] - ox;
        const wy = [224, 224, 244, 314][i] - oy;
        ctx.fillRect(wx, wy, 24, 1);
      }
      ctx.restore();
    }

    if (this.kind === "diner") {
      // jukebox light pulse
      const pulse = 0.6 + Math.sin(time * 3.1) * 0.25;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const grad = ctx.createRadialGradient(43, 80, 1, 43, 80, 34);
      grad.addColorStop(0, `rgba(255, 120, 190, ${0.22 * pulse})`);
      grad.addColorStop(1, "rgba(255, 120, 190, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(8, 44, 70, 70);
      ctx.restore();
      // steam from cocoa on the counter
      for (let i = 0; i < 3; i += 1) {
        const t = (time * 0.32 + i * 0.33) % 1;
        ellipse(ctx, 250 + Math.sin(t * 5 + i) * 4, 58 - t * 22, 2 + t * 2, 2 + t * 2, `rgba(255,245,220,${(1 - t) * 0.16})`);
      }
      // string light twinkle
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 22; i += 1) {
        const x = 10 + i * 22;
        const y = 8 + Math.sin(i * 0.7) * 3;
        const tw = 0.25 + Math.abs(Math.sin(time * 2 + i * 0.8)) * 0.3;
        ctx.fillStyle = `rgba(255, 230, 170, ${tw})`;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.restore();
    }

    if (this.kind === "bathroom") {
      // fluorescent flicker
      const flicker = reduceMotion ? 1 : (Math.sin(time * 13) > 0.93 ? 0.5 : 1);
      ctx.save();
      ctx.globalAlpha = 0.10 * flicker;
      ctx.fillStyle = "#d8ffff";
      ctx.fillRect(0, 0, 480, 168);
      ctx.restore();
      // mirror shimmer
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const shimmer = 0.05 + Math.sin(time * 1.7) * 0.02;
      ctx.fillStyle = `rgba(150, 230, 255, ${shimmer})`;
      ctx.fillRect(170, 34, 140, 56);
      ctx.restore();
      // drip
      const drip = (time * 0.6) % 1;
      ellipse(ctx, 174, 104 + drip * 10, 1, 2, `rgba(180, 230, 245, ${(1 - drip) * 0.5})`);
    }
  }
}
