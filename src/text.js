const cache = new Map();

export function drawText(ctx, text, x, y, opts = {}) {
  const {
    font = '16px "VT323", monospace',
    color = "#eaf3ff",
    align = "left",
    baseline = "top",
    shadow = null,
    shadowOffset = 1,
    alpha = 1,
    maxWidth,
  } = opts;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (shadow) {
    ctx.fillStyle = shadow;
    ctx.fillText(text, x + shadowOffset, y + shadowOffset, maxWidth);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y, maxWidth);
  ctx.restore();
}

export function measure(ctx, text, font) {
  ctx.save();
  ctx.font = font;
  const width = ctx.measureText(text).width;
  ctx.restore();
  return width;
}

export function wrapText(ctx, text, maxWidth, font = '16px "VT323", monospace') {
  const key = `${font}|${maxWidth}|${text}`;
  if (cache.has(key)) return cache.get(key);
  const paragraphs = String(text).split("\n");
  const lines = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (measure(ctx, test, font) <= maxWidth) {
        current = test;
      } else {
        if (current) lines.push(current);
        if (measure(ctx, word, font) > maxWidth) {
          // hard-break very long words
          let chunk = "";
          for (const char of word) {
            if (measure(ctx, chunk + char, font) > maxWidth && chunk) {
              lines.push(chunk);
              chunk = char;
            } else {
              chunk += char;
            }
          }
          current = chunk;
        } else {
          current = word;
        }
      }
    }
    if (current) lines.push(current);
  }
  if (cache.size > 500) cache.clear();
  cache.set(key, lines);
  return lines;
}

export function paginate(ctx, text, maxWidth, font, maxLines = 3) {
  const lines = wrapText(ctx, text, maxWidth, font);
  const pages = [];
  for (let i = 0; i < lines.length; i += maxLines) {
    pages.push(lines.slice(i, i + maxLines).join("\n"));
  }
  if (!pages.length) pages.push("");
  return pages;
}

export function drawParagraph(ctx, text, x, y, opts = {}) {
  const { font = '16px "VT323", monospace', lineHeight = 16, color = "#eaf3ff", shadow = "#05070f" } = opts;
  const lines = String(text).split("\n");
  lines.forEach((line, index) => {
    drawText(ctx, line, x, y + index * lineHeight, { font, color, shadow });
  });
  return lines.length * lineHeight;
}
