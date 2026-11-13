// Renders the public GitHub contribution calendar as a flip-dot board.
// No third-party service, no token: GitHub's own /users/<login>/contributions
// fragment is public. Refreshed daily by .github/workflows/contributions.yml.
//
// Each day is a disc. Quiet days stay dark; busier days light in deeper lime.
// The board turns over in a wave from the left, holds, and turns back.
// The avatar stands to the left, and a signal runs from its antenna into the board.
import { ASH, BONE, INK, LIME, disc, flipKeyframes, flipRule, mix, reducedMotion, textCells, textCols, wall, write } from "./dots.mjs";
import { avatar } from "./avatar.mjs";

const USER = process.argv[2] ?? "dhananjay-123";
const OUT = process.argv[3] ?? "assets/contributions.svg";

const W = 880;
const PITCH = 12;
const R = PITCH * 0.4;
const PAD = 22;
const TOP = 66;          // first row of days
const CYCLE = 16;
const LEVELS = [null, mix("#151311", LIME, 0.35), mix("#151311", LIME, 0.58), mix("#151311", LIME, 0.8), LIME];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const html = await fetch(`https://github.com/users/${USER}/contributions`, {
  headers: { "User-Agent": "profile-readme-contribution-renderer", Accept: "text/html" },
}).then((r) => {
  if (!r.ok) throw new Error(`GitHub returned ${r.status} for ${USER}`);
  return r.text();
});

// Day counts live in the sr-only tool-tips, keyed to each cell's id.
const counts = new Map();
for (const m of html.matchAll(/for="(contribution-day-component-\d+-\d+)"[^>]*>([^<]*)</g)) {
  const n = /^No contributions/.test(m[2]) ? 0 : Number(m[2].match(/^([\d,]+)/)?.[1].replace(/,/g, "") ?? 0);
  counts.set(m[1], n);
}

const days = [];
for (const m of html.matchAll(/<td[^>]*class="ContributionCalendar-day"[^>]*>/g)) {
  const tag = m[0];
  const attr = (k) => tag.match(new RegExp(`${k}="([^"]*)"`))?.[1];
  const id = attr("id");
  const date = attr("data-date");
  if (!id || !date) continue;
  const [, row, col] = id.match(/-(\d+)-(\d+)$/).map(Number);
  days.push({ date, row, col, level: Number(attr("data-level") ?? 0), count: counts.get(id) ?? 0 });
}
if (!days.length) throw new Error("no contribution cells parsed — GitHub markup may have changed");

const weeks = Math.max(...days.map((d) => d.col)) + 1;
const total = days.reduce((a, d) => a + d.count, 0);
const gridW = weeks * PITCH;
const X0 = W - PAD - gridW;
const H = TOP + 7 * PITCH + PAD;

// The avatar, small, standing at the bottom left.
const AV = avatar(0.5, "av");
const AX = PAD;
const AY = H - AV.h - 6;
const tipX = AX + AV.tip[0];
const tipY = AY + AV.tip[1];
const endX = X0 - 6;
const endY = TOP + 3.5 * PITCH;
// A slack curve from the antenna down into the board's left edge.
const signal = `M${tipX.toFixed(1)} ${tipY.toFixed(1)} C${(tipX + 40).toFixed(1)} ${(tipY - 18).toFixed(1)} ${(endX - 30).toFixed(1)} ${(endY + 30).toFixed(1)} ${endX} ${endY}`;

// Small dot type: the heading and the month names, set in the same 5x7 font.
function label(text, x, y, pitch, fill) {
  return textCells(text)
    .map(([c, r]) => `<circle cx="${(x + (c + 0.5) * pitch).toFixed(1)}" cy="${(y + (r + 0.5) * pitch).toFixed(1)}" r="${(pitch * 0.4).toFixed(2)}" fill="${fill}"/>`)
    .join("");
}

const heading = `${total.toLocaleString("en-US")} CONTRIBUTIONS IN THE LAST YEAR`;
const months = [];
let last = -1;
for (const d of days.filter((d) => d.row === 0).sort((a, b) => a.col - b.col)) {
  const mo = Number(d.date.slice(5, 7)) - 1;
  const prev = months.at(-1);
  if (mo !== last && d.col < weeks - 2 && (!prev || d.col - prev.col >= 3)) months.push({ col: d.col, text: MONTHS[mo] });
  last = mo;
}

const keyframes = [];
const rules = [];
for (let lv = 1; lv < LEVELS.length; lv++) {
  keyframes.push(flipKeyframes(`k${lv}`, LEVELS[lv], false));
  rules.push(flipRule(`f${lv}`, `k${lv}`, CYCLE, false));
}

const lit = days
  .filter((d) => d.level > 0)
  .map((d) => disc(X0 + (d.col + 0.5) * PITCH, TOP + (d.row + 0.5) * PITCH, R, LEVELS[d.level], `f${d.level}`, 0.3 + d.col * 0.035 + d.row * 0.05))
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">GitHub contributions for ${USER}</title>
  <desc id="d">${total} contributions over ${weeks} weeks, one disc per day, lit brighter on busier days, with the avatar beside it.</desc>
  <style>
    ${keyframes.join("\n    ")}
    ${rules.join("\n    ")}
    ${reducedMotion(".f1, .f2, .f3, .f4, .sig")}
    @keyframes sig { to { stroke-dashoffset: -24 } }
    .sig { animation: sig 0.9s linear infinite }
    ${AV.style}
  </style>
  <defs>${wall("w", PITCH, R, X0, TOP)}</defs>
  <rect width="${W}" height="${H}" rx="12" fill="${INK}"/>
  ${label(heading, X0, PAD, 2.6, BONE)}
  ${months.map((m) => label(m.text, X0 + m.col * PITCH + 2, TOP - 16, 1.7, ASH)).join("\n  ")}
  <rect x="${X0}" y="${TOP}" width="${gridW}" height="${7 * PITCH}" fill="url(#w)"/>
  <path d="${signal}" stroke="${LIME}" stroke-opacity="0.25" stroke-width="1.2" fill="none"/>
  <path class="sig" d="${signal}" stroke="${LIME}" stroke-width="1.6" stroke-dasharray="3 9" stroke-linecap="round" fill="none"/>
  <circle cx="${endX}" cy="${endY}" r="2.4" fill="${LIME}"/>
  <g transform="translate(${AX} ${AY})">${AV.body}</g>
  ${lit}
</svg>
`;

await write(OUT, svg);
console.log(`${total} contributions, ${weeks} weeks, heading ${textCols(heading)} cols`);
