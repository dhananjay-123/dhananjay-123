// Renders the public GitHub contribution calendar in the avatar's look: iron, green and gold.
// No third-party service, no token: GitHub's own /users/<login>/contributions
// fragment is public. Refreshed daily by .github/workflows/contributions.yml.
//
// Each day is a cut stone. Quiet days stay iron; busier days go green, the busiest gold.
// The board turns over in a wave from the left, holds, and turns back.
// A sweep of light crosses it, the busiest days glint, today is ringed, a weekly
// skyline of spires stands underneath, and three numbers sit along the bottom.
// The avatar stands to the left, joined to the board by a gold chain.
import { BONE, flipKeyframes, flipRule, textCells, textCols, write } from "./dots.mjs";
import { avatar } from "./avatar.mjs";

const USER = process.argv[2] ?? "dhananjay-123";
const OUT = process.argv[3] ?? "assets/activity.svg";

const W = 880;
const PITCH = 12;
const R = PITCH * 0.4;
const PAD = 22;
const TOP = 66;          // first row of days
const CYCLE = 16;
const LEVELS = [null, "#2f5230", "#4c8245", "#8fbb66", "#e9d9a0"];
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
const GRID_H = 7 * PITCH;
const METER_Y = TOP + GRID_H + 8;   // the weekly meter hangs under the grid
const METER_PITCH = 6;
const METER_ROWS = 5;
const STATS_Y = METER_Y + METER_ROWS * METER_PITCH + 16;
const H = STATS_Y + 34 + PAD;

// ── numbers worth showing ───────────────────────────────────────────────────
const byDate = [...days].sort((a, b) => a.date.localeCompare(b.date));
let longest = 0;
let run = 0;
for (const d of byDate) {
  run = d.count > 0 ? run + 1 : 0;
  longest = Math.max(longest, run);
}
// The current streak may end yesterday: today is allowed to be empty so far.
let streak = 0;
for (let i = byDate.length - 1; i >= 0; i--) {
  if (byDate[i].count > 0) streak++;
  else if (i !== byDate.length - 1) break;
}
const best = byDate.reduce((a, d) => (d.count > a.count ? d : a), byDate[0]);
const today = byDate.at(-1);
const weekly = Array.from({ length: weeks }, (_, c) => days.filter((d) => d.col === c).reduce((a, d) => a + d.count, 0));
const peak = Math.max(...weekly, 1);

// ── the avatar, to the left, chained to the board────────────
const AV = avatar(0.56, "av");
const AX = Math.round((X0 - AV.w) / 2) - 4;
const AY = Math.round((H - AV.h) / 2) + 4;
const tipX = AX + AV.tip[0];
const tipY = AY + AV.tip[1];
const endX = X0 - 6;
const endY = TOP + 3.5 * PITCH;
const signal = `M${tipX.toFixed(1)} ${tipY.toFixed(1)} C${(tipX + 16).toFixed(1)} ${(tipY - 26).toFixed(1)} ${(endX - 18).toFixed(1)} ${(endY + 22).toFixed(1)} ${endX} ${endY}`;

// Small dot type, set in the same 5x7 font as everything else.
function label(text, x, y, pitch, fill, cls = "") {
  const dots = textCells(text)
    .map(([c, r]) => `<circle cx="${(x + (c + 0.5) * pitch).toFixed(1)}" cy="${(y + (r + 0.5) * pitch).toFixed(1)}" r="${(pitch * 0.4).toFixed(2)}"/>`)
    .join("");
  return `<g fill="${fill}"${cls ? ` class="${cls}"` : ""}>${dots}</g>`;
}

const heading = `${total.toLocaleString("en-US")} CONTRIBUTIONS IN A YEAR`;
const months = [];
let last = -1;
for (const d of days.filter((d) => d.row === 0).sort((a, b) => a.col - b.col)) {
  const mo = Number(d.date.slice(5, 7)) - 1;
  const prev = months.at(-1);
  if (mo !== last && d.col < weeks - 2 && (!prev || d.col - prev.col >= 3)) months.push({ col: d.col, text: MONTHS[mo] });
  last = mo;
}

// Stable per-item jitter, so a daily rebuild only changes what the data changed.
const jitter = (key) => {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};

// ── the look: iron, deep green and gold, after the avatar ───────────────────
const NIGHT = "#070907";
const IRON = "#171b16";
const GOLD = "#c9b678";
const GOLD_L = "#e9d9a0";
const MOSS = "#7d8a74";
const SKY_H = METER_ROWS * METER_PITCH;
const BASE = METER_Y + SKY_H;       // the skyline's ground line

const keyframes = [];
const rules = [];
for (let lv = 1; lv < LEVELS.length; lv++) {
  keyframes.push(flipKeyframes(`k${lv}`, LEVELS[lv], false));
  rules.push(flipRule(`f${lv}`, `k${lv}`, CYCLE, false));
}

const cx = (col) => X0 + (col + 0.5) * PITCH;
const cy = (row) => TOP + (row + 0.5) * PITCH;
const n1 = (v) => Number(v.toFixed(1));
/** A day is a cut stone: a diamond, not a disc. */
const gem = (x, y, r) => `M${n1(x)} ${n1(y - r)}L${n1(x + r)} ${n1(y)}L${n1(x)} ${n1(y + r)}L${n1(x - r)} ${n1(y)}Z`;
/** The four-point star from the banner and the clasp. */
const star = (x, y, r) => `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
const G = PITCH * 0.44;

const lit = days
  .filter((d) => d.level > 0)
  .map((d) => `<path class="f${d.level}" style="animation-delay:${(0.3 + d.col * 0.035 + d.row * 0.05).toFixed(2)}s" d="${gem(cx(d.col), cy(d.row), G)}" fill="${LEVELS[d.level]}"/>`)
  .join("");

// The busiest days glint now and then.
const glints = days
  .filter((d) => d.level === 4)
  .map((d) => `<path class="gl" style="animation-delay:${(-jitter(d.date) * 5).toFixed(2)}s" d="${gem(cx(d.col), cy(d.row), G)}" fill="#fff"/>`)
  .join("");

// The skyline: one spire per week, tall for a busy week, like the towers behind
// the figure. Square-root scale, or one big week flattens the rest.
const skyline = weekly
  .map((v, col) => {
    if (!v) return "";
    const h = 5 + Math.sqrt(v / peak) * (SKY_H - 6);
    const x = cx(col);
    const top = BASE - h;
    const j = jitter(`w${col}`);
    const tall = h > SKY_H * 0.72;
    const spire = `<path d="M${n1(x - 3.6)} ${BASE}V${n1(top + 5)}L${n1(x)} ${n1(top)}L${n1(x + 3.6)} ${n1(top + 5)}V${BASE}Z" fill="url(#tower)"/>`;
    const cap = tall ? `<path d="${gem(x, top + 1, 2.2)}" fill="${GOLD_L}"/>` : "";
    return `<g class="sp" style="animation-duration:${(2.2 + j * 1.6).toFixed(2)}s;animation-delay:${(-j * 3).toFixed(2)}s">${spire}${cap}</g>`;
  })
  .join("");

// Three numbers along the bottom: a small label over a larger lit value.
const stat = (x, name, value, tone) =>
  `<path d="${star(x + 4, STATS_Y + 6, 5)}" fill="${GOLD}"/>${label(name, x + 14, STATS_Y, 1.7, MOSS)}${label(value, x, STATS_Y + 16, 2.6, tone)}`;
const third = gridW / 3;
const stats = [
  stat(X0, "CURRENT STREAK", `${streak} ${streak === 1 ? "DAY" : "DAYS"}`, GOLD_L),
  stat(X0 + third, "LONGEST STREAK", `${longest} DAYS`, LEVELS[3]),
  stat(X0 + 2 * third, "BEST DAY", `${best.count} ON ${MONTHS[Number(best.date.slice(5, 7)) - 1]} ${Number(best.date.slice(8, 10))}`, BONE),
].join("\n  ");

// Less to more, top right.
const legendX = X0 + gridW - (4 * 10 + 5) - textCols("MORE") * 1.7 - 8;
const legend = `${label("LESS", legendX - textCols("LESS") * 1.7 - 8, PAD + 3, 1.7, MOSS)}${[IRON, ...LEVELS.slice(1)].map((f, i) => `<path d="${gem(legendX + i * 10 + 2.5, PAD + 9, 4)}" fill="${f}"/>`).join("")}${label("MORE", legendX + 4 * 10 + 5 + 8, PAD + 3, 1.7, MOSS)}`;

const midX = X0 + gridW / 2;
const midY = TOP + GRID_H / 2;
const corner = (x, y) => `<path d="${star(x, y, 6)}" fill="${GOLD}"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">GitHub contributions for ${USER}</title>
  <desc id="d">${total} contributions over ${weeks} weeks, one cut stone per day, from iron through green to gold on the busiest days. Current streak ${streak} days, longest ${longest}, best day ${best.count}. A skyline of weekly totals stands under the calendar and the avatar beside it.</desc>
  <style>
    ${keyframes.join("\n    ")}
    ${rules.join("\n    ")}
    @keyframes chain { to { stroke-dashoffset: -18 } }
    .ch { animation: chain 1.2s linear infinite }
    @keyframes sweep { from { transform: translateX(0) } to { transform: translateX(${gridW + 60}px) } }
    .sw { animation: sweep 7s linear infinite }
    @keyframes glint { 0%, 86%, 100% { opacity: 0 } 92% { opacity: 0.8 } }
    .gl { opacity: 0; animation: glint 5s ease-in-out infinite }
    @keyframes spire { from { transform: scaleY(0.82) } to { transform: scaleY(1) } }
    .sp { transform-box: fill-box; transform-origin: 50% 100%; animation: spire 3s ease-in-out infinite alternate }
    @keyframes today { 0% { transform: scale(0.8); opacity: 0.9 } 100% { transform: scale(2.3); opacity: 0 } }
    .td { transform-box: fill-box; transform-origin: center; animation: today 1.8s ease-out infinite }
    @keyframes arrive { 0%, 100% { transform: scale(0.7) rotate(0deg) } 50% { transform: scale(1.3) rotate(45deg) } }
    .ar { transform-box: fill-box; transform-origin: center; animation: arrive 2.4s ease-in-out infinite }
    @keyframes ring { to { stroke-dashoffset: -1000 } }
    .rg { animation: ring 14s linear infinite }
    ${AV.style}
    @media (prefers-reduced-motion: reduce) { svg * { animation: none !important } .gl { opacity: 0 } }
  </style>
  <defs>
    <pattern id="w" x="${X0}" y="${TOP}" width="${PITCH}" height="${PITCH}" patternUnits="userSpaceOnUse"><path d="${gem(PITCH / 2, PITCH / 2, G)}" fill="${IRON}"/></pattern>
    <linearGradient id="sweep"><stop offset="0" stop-color="#bfe8a0" stop-opacity="0"/><stop offset="0.8" stop-color="#bfe8a0" stop-opacity="0.1"/><stop offset="1" stop-color="${GOLD_L}" stop-opacity="0.3"/></linearGradient>
    <linearGradient id="tower" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LEVELS[3]}"/><stop offset="1" stop-color="${LEVELS[1]}"/></linearGradient>
    <clipPath id="grid"><rect x="${X0}" y="${TOP}" width="${gridW}" height="${GRID_H}"/></clipPath>
    <clipPath id="panel"><rect width="${W}" height="${H}" rx="14"/></clipPath>
    <radialGradient id="glow" gradientUnits="userSpaceOnUse" cx="${midX}" cy="${midY + 20}" r="300"><stop offset="0" stop-color="#2c4a2a" stop-opacity="0.55"/><stop offset="1" stop-color="${NIGHT}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="14" fill="${NIGHT}"/>
  <g clip-path="url(#panel)">
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <circle cx="${midX}" cy="${midY + 20}" r="210" fill="none" stroke="${GOLD}" stroke-opacity="0.14" stroke-width="1.5"/>
    <circle class="rg" cx="${midX}" cy="${midY + 20}" r="210" fill="none" stroke="${GOLD_L}" stroke-opacity="0.55" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="60 940" pathLength="1000"/>
    <path d="M${midX - 46} 0V${H}M${midX + 46} 0V${H}" stroke="${GOLD}" stroke-opacity="0.07" stroke-width="1"/>
    <rect x="${midX - 46}" y="0" width="92" height="${H}" fill="#2c4a2a" fill-opacity="0.1"/>
  </g>
  <rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="14" fill="none" stroke="${GOLD}" stroke-opacity="0.55" stroke-width="1.5"/>
  <rect x="6.5" y="6.5" width="${W - 13}" height="${H - 13}" rx="9" fill="none" stroke="${GOLD}" stroke-opacity="0.2"/>
  ${corner(14, 14)}${corner(W - 14, 14)}${corner(14, H - 14)}${corner(W - 14, H - 14)}
  ${label(heading, X0, PAD, 2.6, GOLD_L)}
  ${legend}
  ${months.map((m) => label(m.text, X0 + m.col * PITCH + 2, TOP - 16, 1.7, MOSS)).join("\n  ")}
  <rect x="${X0}" y="${TOP}" width="${gridW}" height="${GRID_H}" fill="url(#w)"/>
  ${lit}
  ${glints}
  <g clip-path="url(#grid)"><rect class="sw" x="${X0 - 60}" y="${TOP}" width="60" height="${GRID_H}" fill="url(#sweep)"/></g>
  <path class="td" d="${gem(cx(today.col), cy(today.row), G)}" fill="none" stroke="${GOLD_L}" stroke-width="1.5"/>
  <path d="${gem(cx(today.col), cy(today.row), G + 2)}" fill="none" stroke="${GOLD_L}" stroke-width="1.2"/>
  ${skyline}
  <path d="M${X0} ${BASE + 0.5}H${X0 + gridW}" stroke="${GOLD}" stroke-opacity="0.5"/>
  ${stats}
  <path d="${signal}" stroke="#3a3420" stroke-width="3.4" stroke-linecap="round" fill="none"/>
  <path class="ch" d="${signal}" stroke="${GOLD_L}" stroke-width="2.2" stroke-dasharray="5 4" stroke-linecap="round" fill="none"/>
  <path class="ar" d="${star(endX, endY, 6)}" fill="${GOLD_L}"/>
  <g transform="translate(${AX} ${AY})">${AV.body}</g>
</svg>
`;

await write(OUT, svg);
console.log(`${total} contributions, ${weeks} weeks, streak ${streak}, longest ${longest}, best ${best.count} on ${best.date}`);
