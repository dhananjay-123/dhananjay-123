// An original avatar, rendered in 3D and shown on a flip-dot board.
//
// The figure is a few signed-distance shapes: a rounded helmet with a visor
// band, headphones on a headband, an antenna, a neck and shoulders. Each disc
// of the board casts one ray into the scene; how much light the surface catches
// picks how brightly the disc is lit, and anything in shadow stays dark.
//
// The head turns in a handful of steps, the way a dot board redraws, holds,
// blinks its visor, and turns back. Each pose is its own group of discs, shown
// in turn by a stepped CSS animation; with reduced motion only the front-facing
// pose is shown. Run: node scripts/avatar.mjs
import { pathToFileURL } from "node:url";
import { BONE, DISC, LIME, mix, write } from "./dots.mjs";

const COLS = 38;
const ROWS = 44;
const SPAN = 2.15; // world units across the board
const CELL = SPAN / COLS;
const TOP = 1.05;

const SUIT = "#8b7cf6";
const PHONES = "#f08a45";
const TIP = "#ef7fb0";
const TONES = { suit: SUIT, head: BONE, visor: LIME, phones: PHONES, tip: TIP, dim: LIME };
const SHADES = [0, 0.34, 0.56, 0.78, 1];

// ── vectors ────────────────────────────────────────────────────────────────
const v = (x, y, z) => [x, y, z];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => mul(a, 1 / len(a));
const rotY = (p, a) => [p[0] * Math.cos(a) - p[2] * Math.sin(a), p[1], p[0] * Math.sin(a) + p[2] * Math.cos(a)];
const rotX = (p, a) => [p[0], p[1] * Math.cos(a) - p[2] * Math.sin(a), p[1] * Math.sin(a) + p[2] * Math.cos(a)];

// ── shapes ─────────────────────────────────────────────────────────────────
function ellipsoid(p, r) {
  const k0 = len([p[0] / r[0], p[1] / r[1], p[2] / r[2]]);
  const k1 = len([p[0] / (r[0] * r[0]), p[1] / (r[1] * r[1]), p[2] / (r[2] * r[2])]);
  return (k0 * (k0 - 1)) / k1;
}
function cylinderX(p, h, r) {
  const dx = Math.hypot(p[1], p[2]) - r;
  const dy = Math.abs(p[0]) - h;
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
}
function cylinderY(p, h, r) {
  const dx = Math.hypot(p[0], p[2]) - r;
  const dy = Math.abs(p[1]) - h;
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
}
function capsule(p, a, b, r) {
  const pa = sub(p, a);
  const ba = sub(b, a);
  const h = Math.max(0, Math.min(1, dot(pa, ba) / dot(ba, ba)));
  return len(sub(pa, mul(ba, h))) - r;
}
const smin = (a, b, k) => {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
  return b + (a - b) * h - k * h * (1 - h);
};

/** The scene at point p, for a head turned by `yaw` and tilted by `pitch`. Returns [distance, material]. */
function scene(p, yaw, pitch, blink) {
  let best = [Infinity, "none"];
  const take = (d, m) => {
    if (d < best[0]) best = [d, m];
  };

  // Shoulders and neck turn a little with the head.
  const b = rotY(p, -yaw * 0.25);
  const torso = ellipsoid(sub(b, v(0, -1.38, -0.05)), v(0.9, 0.56, 0.5));
  const neck = cylinderY(sub(b, v(0, -0.62, -0.02)), 0.2, 0.19);
  take(smin(torso, neck, 0.12), "suit");

  const q = rotX(rotY(sub(p, v(0, 0.08, 0)), -yaw), -pitch);
  const helmet = ellipsoid(q, v(0.5, 0.58, 0.52));
  const visor = Math.max(ellipsoid(q, v(0.535, 0.6, 0.555)), Math.abs(q[1] - 0.06) - 0.13, 0.04 - q[2]);
  take(helmet, "head");
  take(visor, blink ? "dim" : "visor");

  for (const side of [-1, 1]) {
    take(cylinderX(sub(q, v(side * 0.52, 0.0, -0.02)), 0.075, 0.21), "phones");
  }
  // The headband: a thin arc over the top of the helmet, ear to ear.
  const arc = Math.hypot(Math.hypot(q[0], q[1] + 0.02) - 0.56, q[2] + 0.02) - 0.045;
  take(Math.max(arc, -(q[1] - 0.02)), "phones");

  take(capsule(q, v(0.16, 0.5, -0.05), v(0.27, 0.83, -0.08), 0.022), "head");
  take(len(sub(q, v(0.28, 0.86, -0.08))) - 0.055, "tip");
  return best;
}

const LIGHT = norm(v(-0.55, 0.6, 0.75));
const VIEW = v(0, 0, 1);

/** Brightness 0..1 and material for the ray through board cell (col, row). */
function shade(col, row, yaw, pitch, blink) {
  const x = -SPAN / 2 + (col + 0.5) * CELL;
  const y = TOP - (row + 0.5) * CELL;
  let o = v(x, y, 3);
  const dir = v(0, 0, -1);
  let t = 0;
  for (let i = 0; i < 90 && t < 6; i++) {
    const p = add(o, mul(dir, t));
    const [d, m] = scene(p, yaw, pitch, blink);
    if (d < 0.002) {
      const e = 0.002;
      const n = norm(v(
        scene(add(p, v(e, 0, 0)), yaw, pitch, blink)[0] - scene(sub(p, v(e, 0, 0)), yaw, pitch, blink)[0],
        scene(add(p, v(0, e, 0)), yaw, pitch, blink)[0] - scene(sub(p, v(0, e, 0)), yaw, pitch, blink)[0],
        scene(add(p, v(0, 0, e)), yaw, pitch, blink)[0] - scene(sub(p, v(0, 0, e)), yaw, pitch, blink)[0],
      ));
      const diffuse = Math.max(0, dot(n, LIGHT));
      const rim = Math.pow(1 - Math.max(0, dot(n, VIEW)), 2.2) * 0.45;
      const spec = Math.pow(Math.max(0, dot(norm(add(LIGHT, VIEW)), n)), 24);
      if (m === "tip") return [1, m];
      if (m === "visor") return [Math.min(1, 0.62 + 0.3 * diffuse + spec * 0.6), m];
      if (m === "dim") return [0.3 + 0.15 * diffuse, m];
      return [Math.min(1, 0.1 + 0.8 * diffuse + rim + spec * 0.35), m];
    }
    t += d;
  }
  return [0, "none"];
}

const level = (b) => (b < 0.24 ? 0 : b < 0.44 ? 1 : b < 0.64 ? 2 : b < 0.84 ? 3 : 4);

// Poses: seven head turns, a slight nod with them, and a blink at the front.
const POSES = [];
for (let i = 0; i < 7; i++) POSES.push({ yaw: (i - 3) * 0.2, pitch: Math.abs(i - 3) * -0.025, blink: false });
POSES.push({ yaw: 0, pitch: 0, blink: true });
const FRONT = 3;
// Which pose shows at each step of the loop.
const SEQ = [3, 3, 3, 3, 7, 3, 3, 4, 5, 6, 6, 6, 6, 5, 4, 3, 3, 3, 7, 3, 2, 1, 0, 0, 0, 0, 1, 2];
const STEP = 0.22;

const n1 = (x) => Number(x.toFixed(1));

/** The lit discs of every pose, as [col, row, fill]. Shaded once, drawn at any size. */
const FRAMES = POSES.map((pose) => {
  const lit = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const [b, m] = shade(col, row, pose.yaw, pose.pitch, pose.blink);
      const lv = level(b);
      if (lv) lit.push([col, row, mix(DISC, TONES[m], SHADES[lv])]);
    }
  }
  return lit;
});

/** Where the antenna tip sits in the front pose, in board cells. */
const TIP_CELL = [(0.28 + SPAN / 2) / CELL, (TOP - 0.94) / CELL];

/**
 * The avatar at a given disc pitch: its CSS, its discs (one group per pose),
 * its size, and where its antenna tip is. `id` keeps class names apart when it
 * shares an SVG with something else.
 */
export function avatar(pitch, id = "av") {
  const r = n1(pitch * 0.42);
  const ring = (cx, cy) => `M${n1(cx - r)} ${n1(cy)}a${r} ${r} 0 1 0 ${n1(2 * r)} 0a${r} ${r} 0 1 0 ${n1(-2 * r)} 0`;
  const groups = FRAMES.map((lit, f) => {
    const paths = new Map();
    for (const [col, row, fill] of lit) paths.set(fill, (paths.get(fill) ?? "") + ring((col + 0.5) * pitch, (row + 0.5) * pitch));
    const body = [...paths].map(([fill, d]) => `<path fill="${fill}" d="${d}"/>`).join("");
    return `<g class="${id}${f}"${f === FRONT ? "" : ' opacity="0"'}>${body}</g>`;
  });

  // Each pose is on for the steps that name it, off otherwise.
  const N = SEQ.length;
  const pct = (k) => n1((k / N) * 100);
  const css = POSES.map((_, f) => {
    const stops = [];
    for (let k = 0; k < N; k++) stops.push(`${pct(k)}% { opacity: ${SEQ[k] === f ? 1 : 0} }`);
    stops.push(`100% { opacity: ${SEQ[0] === f ? 1 : 0} }`);
    return `@keyframes ${id}k${f} { ${stops.join(" ")} }\n.${id}${f} { animation: ${id}k${f} ${n1(N * STEP)}s step-end infinite }`;
  });
  css.push(`@media (prefers-reduced-motion: reduce) { ${POSES.map((_, f) => `.${id}${f}`).join(", ")} { animation: none } }`);

  return {
    style: css.join("\n"),
    body: groups.join("\n"),
    w: COLS * pitch,
    h: ROWS * pitch,
    tip: [TIP_CELL[0] * pitch, TIP_CELL[1] * pitch],
  };
}

// Run directly, it writes the standalone avatar: no board behind it, so it
// stands on the page by itself.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = avatar(6);
  await write(
    "assets/avatar.svg",
    `<svg xmlns="http://www.w3.org/2000/svg" width="${a.w}" height="${a.h}" viewBox="0 0 ${a.w} ${a.h}" role="img" aria-label="Avatar: a figure in a helmet with a glowing visor and headphones, drawn in flip-dots">
  <title>Avatar</title>
  <style>
${a.style}
  </style>
${a.body}
</svg>
`,
  );
}
