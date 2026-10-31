export const VW = 480;
export const VH = 270;

export const COLORS = {
  ink: "#060913",
  deep: "#0a1024",
  panel: "#101731",
  panel2: "#151e3e",
  line: "#7f9bd4",
  lineDim: "#3c4f7d",
  snow: "#e8f2ff",
  ice: "#a9c9f5",
  amber: "#ffd166",
  amber2: "#ffb347",
  rose: "#ff7a9e",
  teal: "#5fe0c8",
  violet: "#b18cff",
  danger: "#ff5d73",
  text: "#eaf3ff",
  textDim: "#a8bcdd",
};

export const SPEAKER = {
  srif: { name: "SRIF", color: "#9ecbff", portrait: "srif" },
  chris: { name: "CHRIS", color: "#8ff0c6", portrait: "chris" },
  mich: { name: "MICH", color: "#ffc46b", portrait: "mich" },
  asgore: { name: "ASGORE", color: "#ffe08a", portrait: "asgore" },
  toriel: { name: "TORIEL", color: "#d6b4ff", portrait: "toriel" },
  narrator: { name: "", color: "#b9c8e8", portrait: "narrator" },
  reflection: { name: "THE REFLECTION", color: "#ff6b8a", portrait: "reflection" },
  echo: { name: "ECHO", color: "#ff9aae", portrait: "reflection" },
};

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function approach(value, target, speed, dt) {
  const delta = target - value;
  const step = speed * dt;
  if (Math.abs(delta) <= step) return target;
  return value + Math.sign(delta) * step;
}

export function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function hash(x, y) {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}
