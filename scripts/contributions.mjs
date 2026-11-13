// Renders the public GitHub contribution calendar as a flip-dot board.
// No third-party service, no token: GitHub's own /users/<login>/contributions
// fragment is public. Refreshed daily by .github/workflows/contributions.yml.
//
// Each day is a disc. Quiet days stay dark; busier days light in deeper lime.
// The board turns over in a wave from the left, holds, and turns back.
// A sweep of light crosses it, the busiest days glint, today is ringed, a weekly
// level meter bounces underneath, and three numbers sit along the bottom.
// Dot, the avatar, stands to the left and sends a signal into the board.
import { ASH, BONE, INK, LIME, disc, flipKeyframes, flipRule, mix, reducedMotion, textCells, textCols, wall, write } from "./dots.mjs";
import { avatar } from "./avatar.mjs";

const USER = process.argv[2] ?? "dhananjay-123";
const OUT = process.argv[3] ?? "assets/activity.svg";

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

// ── Dot, standing to the left, sending a signal into the board ─────────────
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

const keyframes = [];
const rules = [];
for (let lv = 1; lv < LEVELS.length; lv++) {
  keyframes.push(flipKeyframes(`k${lv}`, LEVELS[lv], false));
  rules.push(flipRule(`f${lv}`, `k${lv}`, CYCLE, false));
}

const cx = (col) => X0 + (col + 0.5) * PITCH;
const cy = (row) => TOP + (row + 0.5) * PITCH;
const lit = days
  .filter((d) => d.level > 0)
  .map((d) => disc(cx(d.col), cy(d.row), R, LEVELS[d.level], `f${d.level}`, 0.3 + d.col * 0.035 + d.row * 0.05))
  .join("");

// The busiest days glint now and then.
const glints = days
  .filter((d) => d.level === 4)
  .map((d) => `<circle class="gl" style="animation-delay:${(-jitter(d.date) * 5).toFixed(2)}s" cx="${cx(d.col)}" cy="${cy(d.row)}" r="${R}" fill="#fff"/>`)
  .join("");

// The weekly meter: a column of small discs per week, tall for a busy week,
// bouncing like a level meter. Square-root scale, or one big week flattens the rest.
const PINK = "#ef7fb0";
const meter = weekly
  .map((v, col) => {
    const n = v ? Math.max(1, Math.round(Math.sqrt(v / peak) * METER_ROWS)) : 0;
    if (!n) return "";
    const dots = Array.from({ length: n }, (_, i) => {
      const fill = i === n - 1 && n >= 4 ? PINK : mix("#151311", LIME, 0.9 - i * 0.12);
      return `<circle cx="${cx(col)}" cy="${METER_Y + (i + 0.5) * METER_PITCH}" r="2.3" fill="${fill}"/>`;
    }).join("");
    const j = jitter(`w${col}`);
    return `<g class="mt" style="animation-duration:${(1.1 + j * 0.9).toFixed(2)}s;animation-delay:${(-j * 2).toFixed(2)}s">${dots}</g>`;
  })
  .join("");

// Three numbers along the bottom: a small ash label over a larger lit value.
const stat = (x, name, value, tone) => `${label(name, x, STATS_Y, 1.7, ASH)}${label(value, x, STATS_Y + 16, 2.6, tone)}`;
const third = gridW / 3;
const stats = [
  stat(X0, "CURRENT STREAK", `${streak} ${streak === 1 ? "DAY" : "DAYS"}`, LIME),
  stat(X0 + third, "LONGEST STREAK", `${longest} DAYS`, "#5aa9ff"),
  stat(X0 + 2 * third, "BEST DAY", `${best.count} ON ${MONTHS[Number(best.date.slice(5, 7)) - 1]} ${Number(best.date.slice(8, 10))}`, "#f08a45"),
].join("\n  ");

// Less to more, top right.
const legendX = X0 + gridW - (4 * 9 + 5) - textCols("MORE") * 1.7 - 8;
const legend = `${label("LESS", legendX - textCols("LESS") * 1.7 - 8, PAD + 3, 1.7, ASH)}${[DISC_DARK(), ...LEVELS.slice(1)].map((f, i) => `<circle cx="${legendX + i * 9 + 2.5}" cy="${PAD + 9}" r="3.4" fill="${f}"/>`).join("")}${label("MORE", legendX + 4 * 9 + 5 + 8, PAD + 3, 1.7, ASH)}`;
function DISC_DARK() {
  return "#1d1a17";
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">GitHub contributions for ${USER}</title>
  <desc id="d">${total} contributions over ${weeks} weeks, one disc per day, lit brighter on busier days. Current streak ${streak} days, longest ${longest}, best day ${best.count}. A weekly level meter runs under the calendar and the avatar stands beside it.</desc>
  <style>
    ${keyframes.join("\n    ")}
    ${rules.join("\n    ")}
    @keyframes sig { to { stroke-dashoffset: -24 } }
    .sig { animation: sig 0.9s linear infinite }
    @keyframes sweep { from { transform: translateX(0) } to { transform: translateX(${gridW + 60}px) } }
    .sw { animation: sweep 7s linear infinite }
    @keyframes glint { 0%, 86%, 100% { opacity: 0 } 92% { opacity: 0.85 } }
    .gl { opacity: 0; animation: glint 5s ease-in-out infinite }
    @keyframes meter { from { transform: scaleY(0.45) } to { transform: scaleY(1) } }
    .mt { transform-box: fill-box; transform-origin: 50% 0%; animation: meter 1.4s ease-in-out infinite alternate }
    @keyframes today { 0% { transform: scale(0.8); opacity: 0.9 } 100% { transform: scale(2.2); opacity: 0 } }
    .td { transform-box: fill-box; transform-origin: center; animation: today 1.8s ease-out infinite }
    @keyframes arrive { 0%, 100% { transform: scale(0.7) } 50% { transform: scale(1.5) } }
    .ar { transform-box: fill-box; transform-origin: center; animation: arrive 0.9s ease-in-out infinite }
    ${AV.style}
    @media (prefers-reduced-motion: reduce) { svg * { animation: none !important } .gl { opacity: 0 } }
  </style>
  <defs>
    ${wall("w", PITCH, R, X0, TOP)}
    <linearGradient id="sweep"><stop offset="0" stop-color="${LIME}" stop-opacity="0"/><stop offset="0.8" stop-color="${LIME}" stop-opacity="0.1"/><stop offset="1" stop-color="#f1ffbe" stop-opacity="0.32"/></linearGradient>
    <clipPath id="grid"><rect x="${X0}" y="${TOP}" width="${gridW}" height="${GRID_H}"/></clipPath>
    <radialGradient id="stage" cx="${((AX + AV.w / 2) / W).toFixed(3)}" cy="0.5" r="0.45"><stop offset="0" stop-color="#231f3a" stop-opacity="0.9"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="14" fill="${INK}"/>
  <rect width="${W}" height="${H}" rx="14" fill="url(#stage)"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${BONE}" stroke-opacity="0.12"/>
  ${label(heading, X0, PAD, 2.6, BONE)}
  ${legend}
  ${months.map((m) => label(m.text, X0 + m.col * PITCH + 2, TOP - 16, 1.7, ASH)).join("\n  ")}
  <rect x="${X0}" y="${TOP}" width="${gridW}" height="${GRID_H}" fill="url(#w)"/>
  ${lit}
  ${glints}
  <g clip-path="url(#grid)"><rect class="sw" x="${X0 - 60}" y="${TOP}" width="60" height="${GRID_H}" fill="url(#sweep)"/></g>
  <circle class="td" cx="${cx(today.col)}" cy="${cy(today.row)}" r="${R}" fill="none" stroke="${PINK}" stroke-width="1.5"/>
  <circle cx="${cx(today.col)}" cy="${cy(today.row)}" r="${R + 1.5}" fill="none" stroke="${PINK}" stroke-width="1.2"/>
  ${meter}
  ${stats}
  <path d="${signal}" stroke="${LIME}" stroke-opacity="0.25" stroke-width="1.2" fill="none"/>
  <path class="sig" d="${signal}" stroke="${LIME}" stroke-width="1.8" stroke-dasharray="3 9" stroke-linecap="round" fill="none"/>
  <circle class="ar" cx="${endX}" cy="${endY}" r="2.6" fill="${LIME}"/>
  <g transform="translate(${AX} ${AY})">${AV.body}</g>
</svg>
`;

await write(OUT, svg);
console.log(`${total} contributions, ${weeks} weeks, streak ${streak}, longest ${longest}, best ${best.count} on ${best.date}`);
