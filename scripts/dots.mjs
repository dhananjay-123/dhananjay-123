// Flip-dot drawing, shared by every image in this README.
//
// The same idea as the board behind dhananjaypvt.me: a wall of discs, each one
// dark on one side and lit on the other, turning over in a wave. Text is set in
// a 5x7 dot font so the README needs no web font and no monospace.
//
// Animation is CSS only (an <img>-embedded SVG runs no script). A disc's own
// fill is its lit colour, and the dark side lives only in the keyframes, so with
// reduced motion or no animation the finished picture is what remains.

export const INK = "#0b0a09";
export const DISC = "#151311";
export const BONE = "#ece6da";
export const ASH = "#958d80";
export const LIME = "#c5f24a";

const GLYPHS = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "#.#.#", ".#.#."],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  2: [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  3: ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  5: ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  6: ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  7: ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  9: [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".....", "..#..", ".#..."],
  ".": [".....", ".....", ".....", ".....", ".....", ".....", "..#.."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
};

/** Columns a string takes: five per glyph and one between. */
export const textCols = (s) => s.length * 6 - 1;

/** The lit cells of a string, as [col, row] from its top-left corner. */
export function textCells(s) {
  const cells = [];
  [...s.toUpperCase()].forEach((ch, i) => {
    const glyph = GLYPHS[ch];
    if (!glyph) throw new Error(`no dot glyph for "${ch}"`);
    glyph.forEach((line, row) => {
      [...line].forEach((px, col) => px === "#" && cells.push([i * 6 + col, row]));
    });
  });
  return cells;
}

const n2 = (v) => Number(v.toFixed(2));

/** A disc turned a fraction of the way over, around the diagonal the board's discs turn on. */
const turn = (s) => `rotate(45deg) scaleY(${s}) rotate(-45deg)`;

/**
 * Keyframes for one disc's flip, as a share of its cycle.
 * `once`: dark, then over to lit, and stay. Otherwise lit for most of the
 * cycle, then back to dark before the next pass.
 */
export function flipKeyframes(name, lit, once) {
  const dark = DISC;
  if (once) {
    return `@keyframes ${name} { 0%, 0.01% { fill: ${dark}; transform: ${turn(1)} } 50% { fill: ${dark}; transform: ${turn(0)} } 50.01% { fill: ${lit}; transform: ${turn(0)} } 100% { fill: ${lit}; transform: ${turn(1)} } }`;
  }
  return `@keyframes ${name} { 0% { fill: ${dark}; transform: ${turn(1)} } 3% { fill: ${dark}; transform: ${turn(0)} } 3.01% { fill: ${lit}; transform: ${turn(0)} } 6%, 86% { fill: ${lit}; transform: ${turn(1)} } 89% { fill: ${lit}; transform: ${turn(0)} } 89.01% { fill: ${dark}; transform: ${turn(0)} } 92%, 100% { fill: ${dark}; transform: ${turn(1)} } }`;
}

/** The unlit wall: one dark disc per cell, as a pattern. */
export function wall(id, pitch, r, x = 0, y = 0) {
  return `<pattern id="${id}" x="${x}" y="${y}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse"><circle cx="${pitch / 2}" cy="${pitch / 2}" r="${r}" fill="${DISC}"/></pattern>`;
}

/**
 * One lit disc. Its fill is the lit colour so the still picture is complete;
 * `cls` and `delay` attach it to a flip.
 */
export function disc(cx, cy, r, fill, cls, delay) {
  const anim = cls ? ` class="${cls}" style="animation-delay:${n2(delay)}s"` : "";
  return `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(r)}" fill="${fill}"${anim}/>`;
}

/** Shared rules: every flipping disc turns around its own centre. */
export function flipRule(cls, keyframesName, seconds, once) {
  return `.${cls} { transform-box: fill-box; transform-origin: center; animation: ${keyframesName} ${seconds}s ease-in-out ${once ? "1 both" : "infinite backwards"} }`;
}

export const reducedMotion = (selector) =>
  `@media (prefers-reduced-motion: reduce) { ${selector} { animation: none } }`;

/** Mixes two hex colours. */
export function mix(a, b, t) {
  const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
  return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

export async function write(path, svg) {
  await (await import("node:fs/promises")).writeFile(path, svg, "utf8");
  console.log(`${path}: ${(svg.length / 1024).toFixed(1)} KB`);
}
