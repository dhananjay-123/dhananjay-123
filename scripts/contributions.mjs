// Renders the public GitHub contribution calendar as an on-brand SVG.
// No third-party service, no token: GitHub's own /users/<login>/contributions
// fragment is public, and every colour here comes from the profile palette.
//
// The panel plays as a terminal session on a loop: the command that generates
// this very file types itself out, the calendar prints a weekday row at a time,
// the panel holds long enough to read, then the screen clears and it runs again.
// Through the hold, cells keep refreshing at their own rhythms so the readout
// stays alive rather than freezing into a screenshot.
//
// Animation is CSS — no SMIL, and no script, which an <img>-embedded SVG would
// never run anyway — so prefers-reduced-motion can switch the whole thing off
// and leave a finished, legible panel behind.

const USER = process.argv[2] ?? "dhananjay-123";
const OUT = process.argv[3] ?? "assets/contributions.svg";

const PANEL_W = 880;
const PAD_X = 48;
const GUTTER = 39;       // weekday label column
const CELL = 11;
const PITCH = 14;
const GRID_X = PAD_X + GUTTER;
const GRID_Y = 106;
const BAND_Y = 212;      // weekly-volume trace
const BAND_H = 26;
const PANEL_H = 272;

// Typing is driven by character count, so the cursor lands on the last glyph.
const CMD_SIZE = 12.5;
const CMD_ADV = 8.1;     // forced advance per character, via textLength

// One session, in seconds. Everything shares CYCLE and carries its own timing
// inside its keyframes, so the choreography holds exactly on every repeat.
const CYCLE = 15;
const T_TYPE = 0.3;      // command starts typing
const T_OUT = 2.15;      // result line prints
const T_GRID = 2.35;     // first weekday row prints
const T_TRACE = 3.6;     // volume trace draws
const T_REST = 4.6;      // legend and marker settle
const T_CLEAR = 13.4;    // screen blanks, ready to run again
const CLEAR_DUR = 0.4;
const REFRESH = 4.2;     // period of the per-cell refresh flicker

// Terminal palette: blue at the low end of the ramp, violet at the top.
const BG = "#0A0B11";
const DOT = "#141827";
const INK = "#E6E8F2";
const MUTED = "#7C86A8";
const HAIRLINE = "#1E2334";
const ACCENT = "#A78BFA";        // violet — prompt, brackets, headings
const BLUE = "#60A5FA";          // blue — the volume trace
const GLOW = "#DDD6FE";
const RAMP = ["#171B2A", "#243A72", "#3558B8", "#6366F1", "#A78BFA"];
// What a cell brightens to when it refreshes, per level.
const LIFT = ["#171B2A", "#3B5CA8", "#4E7BE0", "#8B8CFF", "#C9BCFF"];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const n1 = (v) => Number(v.toFixed(1));
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// Stable per-cell jitter: hashing the date keeps the refresh pattern identical
// between runs, so a daily rebuild only diffs where the data actually moved.
const jitter = (key) => {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
};

const html = await fetch(`https://github.com/users/${USER}/contributions`, {
  headers: { "User-Agent": "profile-readme-contribution-renderer", "Accept": "text/html" },
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
  if (!id || !date) continue;                     // padding cells carry no date
  const [, row, col] = id.match(/-(\d+)-(\d+)$/).map(Number);
  days.push({ date, row, col, level: Number(attr("data-level") ?? 0), count: counts.get(id) ?? 0 });
}
if (!days.length) throw new Error("no contribution cells parsed — GitHub markup may have changed");

const weeks = Math.max(...days.map((d) => d.col)) + 1;
const rows = Math.max(...days.map((d) => d.row)) + 1;
const total = days.reduce((a, d) => a + d.count, 0);
const span = `${days[0].date} → ${days.at(-1).date}`;
const cellX = (c) => GRID_X + c * PITCH;

// Month label sits above the first week that opens a new month.
const monthMarks = [];
let last = -1;
for (const d of days.filter((d) => d.row === 0).sort((a, b) => a.col - b.col)) {
  const mo = Number(d.date.slice(5, 7)) - 1;
  const prev = monthMarks.at(-1);
  // Skip a label that would crowd the one before it — the first column is usually
  // a stub of the month that the second column then labels properly.
  if (mo !== last && d.col < weeks - 1 && (!prev || d.col - prev.col >= 3)) {
    monthMarks.push({ col: d.col, label: MONTHS[mo] });
  }
  last = mo;
}

// ── weekly volume trace ──────────────────────────────────────────────────────
const weekly = Array.from({ length: weeks }, (_, c) =>
  days.filter((d) => d.col === c).reduce((a, d) => a + d.count, 0));
const peakWeek = weekly.indexOf(Math.max(...weekly));
const peakVal = weekly[peakWeek];
// Square-root scale: against a peak this tall, a linear axis flattens every
// ordinary week onto the baseline and the line stops saying anything.
const traceY = (v) => BAND_Y + BAND_H - (peakVal ? Math.sqrt(v / peakVal) * (BAND_H - 3) : 0);
const pts = weekly.map((v, c) => ({ x: cellX(c) + CELL / 2, y: traceY(v) }));
// Smoothed with a midpoint cubic — a polyline reads jagged at this amplitude.
let trace = `M${n1(pts[0].x)} ${n1(pts[0].y)}`;
for (let i = 1; i < pts.length; i++) {
  const a = pts[i - 1], b = pts[i], mx = n1((a.x + b.x) / 2);
  trace += ` C${mx} ${n1(a.y)} ${mx} ${n1(b.y)} ${n1(b.x)} ${n1(b.y)}`;
}
const traceArea = `${trace} L${n1(pts.at(-1).x)} ${BAND_Y + BAND_H} L${n1(pts[0].x)} ${BAND_Y + BAND_H} Z`;

// ── cues ─────────────────────────────────────────────────────────────────────
// Each cue is one element's whole session: hidden until its moment, revealed
// over `dur`, held while the panel is readable, then dropped at the clear. The
// hidden state lives only in the keyframes, never in the element's own styling,
// so switching the animation off leaves the finished panel rather than a blank.
const WIPED = "clip-path: inset(0 100% 0 0)";
const DRAWN = "clip-path: inset(0 0 0 0)";
const keyframes = [];
const rules = [];
const names = [];
let seq = 0;

function cue(at, dur, hidden, shown, timing = "linear", emitRule = true) {
  const name = `c${seq++}`;
  const p = (s) => n1((s / CYCLE) * 100);
  keyframes.push(`@keyframes ${name} { 0%, ${p(at)}% { ${hidden} } ` +
    `${p(at + dur)}%, ${p(T_CLEAR)}% { ${shown} } ` +
    `${p(T_CLEAR + CLEAR_DUR)}%, 100% { ${hidden} } }`);
  if (emitRule) rules.push(`.${name} { animation: ${name} ${CYCLE}s ${timing} infinite }`);
  names.push(`.${name}`);
  return name;
}

const fadeIn = (at) => cue(at, 0.55, "opacity: 0", "opacity: 1", "ease-out");

// A cell holds its colour, lifts for a beat, and drops back. Spread across
// randomised delays this reads as a readout refreshing, not as a wave.
for (let lv = 1; lv < RAMP.length; lv++) {
  keyframes.push(`@keyframes rf${lv} { 0%, 88% { fill: ${RAMP[lv]} } 94% { fill: ${LIFT[lv]} } 100% { fill: ${RAMP[lv]} } }`);
  rules.push(`.rf${lv} { animation: rf${lv} ${REFRESH}s ease-in-out infinite }`);
  names.push(`.rf${lv}`);
}

// ── the session ──────────────────────────────────────────────────────────────
// The typed command really is the one that writes this file, so the panel
// documents its own provenance instead of decorating with a fictional prompt.
const cmd = `$ node scripts/contributions.mjs ${USER}`;
const cmdW = Math.round(cmd.length * CMD_ADV);
const result = `${total.toLocaleString("en-US")} contributions · ${weeks} weeks · busiest week ${peakVal}`;

const cCmd = cue(T_TYPE, 1.75, WIPED, DRAWN, `steps(${cmd.length})`);
const cOut = cue(T_OUT, 0.4, WIPED, DRAWN, `steps(${result.length})`);
const cLabels = fadeIn(T_GRID);
// The cursor rides the typing, then blinks on its own clock — both animations
// have to sit in one shorthand, so this cue emits no rule of its own.
const cRun = cue(T_TYPE, 1.75, `transform: translateX(-${cmdW}px)`, "transform: translateX(0)",
  `steps(${cmd.length})`, false);
rules.push(`.cur { animation: ${cRun} ${CYCLE}s steps(${cmd.length}) infinite, blink 1.06s steps(1) infinite }`);
names.push(".cur");

// One group per weekday row, printed left to right a week at a time.
const grid = [];
for (let r = 0; r < rows; r++) {
  // no per-cell <title>: an <img>-embedded SVG never surfaces them, and 371 of
  // them would triple the file. The summary lives in <desc> for screen readers.
  const cells = days.filter((d) => d.row === r).map((d) => {
    const refresh = d.level > 0
      ? ` class="rf${d.level}" style="animation-delay:${n1(-jitter(d.date) * REFRESH)}s"`
      : "";
    return `<rect x="${cellX(d.col)}" y="${GRID_Y + r * PITCH}" width="${CELL}" height="${CELL}" rx="2" fill="${RAMP[d.level]}"${refresh}/>`;
  }).join("");
  grid.push(`<g class="${cue(T_GRID + r * 0.14, 0.5, WIPED, DRAWN, `steps(${weeks})`)}">${cells}</g>`);
}

const cArea = fadeIn(T_TRACE + 0.6);
const cTrace = cue(T_TRACE, 1.25,
  "stroke-dasharray: 100; stroke-dashoffset: 100",
  "stroke-dasharray: 100; stroke-dashoffset: 0", "ease-out");
const cRest = fadeIn(T_REST);

// ── legend, right-aligned so it clears the corner bracket ─────────────────────
const legendRight = PANEL_W - PAD_X;
const firstSwatch = legendRight - 30 - 8 - (CELL + 4 * 15);
const legendY = PANEL_H - 22;
const legend = RAMP.map((f, i) =>
  `<rect x="${firstSwatch + i * 15}" y="${legendY}" width="${CELL}" height="${CELL}" rx="2" fill="${f}"/>`).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PANEL_W}" height="${PANEL_H}" viewBox="0 0 ${PANEL_W} ${PANEL_H}" fill="none" role="img" aria-labelledby="cTitle cDesc">
  <title id="cTitle">GitHub contribution activity for ${esc(USER)}</title>
  <desc id="cDesc">${esc(total)} contributions between ${esc(span)}, shown as a calendar heatmap of ${weeks} weeks by ${rows} days above a line of weekly totals. Darker cells are quieter days; violet cells are the busiest. The busiest week had ${peakVal}.</desc>
  <style>
    ${rules.join("\n    ")}
    @keyframes blink { 0%, 50% { opacity: 1 } 50.01%, 100% { opacity: 0 } }
    ${keyframes.join("\n    ")}
    @media (prefers-reduced-motion: reduce) {
      ${names.join(", ")} { animation: none }
    }
  </style>
  <defs>
    <pattern id="cgrid" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${DOT}"/></pattern>
    <linearGradient id="cfill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BLUE}" stop-opacity="0.2"/>
      <stop offset="1" stop-color="${BLUE}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${PANEL_W}" height="${PANEL_H}" rx="10" fill="${BG}"/>
  <rect width="${PANEL_W}" height="${PANEL_H}" rx="10" fill="url(#cgrid)"/>
  <rect x="0.5" y="0.5" width="${PANEL_W - 1}" height="${PANEL_H - 1}" rx="10" stroke="${HAIRLINE}"/>
  <g stroke="${ACCENT}" stroke-width="1.25" opacity="0.55">
    <path d="M18 34 L18 18 L34 18"/><path d="M${PANEL_W - 18} 34 L${PANEL_W - 18} 18 L${PANEL_W - 34} 18"/>
    <path d="M18 ${PANEL_H - 34} L18 ${PANEL_H - 18} L34 ${PANEL_H - 18}"/><path d="M${PANEL_W - 18} ${PANEL_H - 34} L${PANEL_W - 18} ${PANEL_H - 18} L${PANEL_W - 34} ${PANEL_H - 18}"/>
  </g>

  <text class="${cCmd}" x="${PAD_X}" y="44" textLength="${cmdW}" lengthAdjust="spacing" font-family="${MONO}" font-size="${CMD_SIZE}" fill="${ACCENT}">${esc(cmd)}</text>
  <rect class="cur" x="${PAD_X + cmdW + 2}" y="34" width="7" height="13" fill="${GLOW}"/>
  <text class="${cOut}" x="${PAD_X}" y="66" font-family="${MONO}" font-size="11.5" letter-spacing="0.4" fill="${INK}">${esc(result)}</text>
  <line x1="${PAD_X}" y1="80" x2="${PANEL_W - PAD_X}" y2="80" stroke="${HAIRLINE}"/>

  <g class="${cLabels}" font-family="${MONO}" font-size="10" letter-spacing="1.1" fill="${MUTED}">
    ${monthMarks.map((m) => `<text x="${cellX(m.col)}" y="98">${m.label}</text>`).join("\n    ")}
    <text x="${GRID_X - 10}" y="${GRID_Y + PITCH + 9}" text-anchor="end">Mon</text>
    <text x="${GRID_X - 10}" y="${GRID_Y + 3 * PITCH + 9}" text-anchor="end">Wed</text>
    <text x="${GRID_X - 10}" y="${GRID_Y + 5 * PITCH + 9}" text-anchor="end">Fri</text>
  </g>
  ${grid.join("\n  ")}

  <path class="${cArea}" d="${traceArea}" fill="url(#cfill)"/>
  <path class="${cTrace}" pathLength="100" d="${trace}" stroke="${BLUE}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle class="${cRest}" cx="${n1(pts[peakWeek].x)}" cy="${n1(pts[peakWeek].y)}" r="2.4" fill="${GLOW}"/>
  <text class="${cRest}" x="${GRID_X - 10}" y="${BAND_Y + BAND_H}" text-anchor="end" font-family="${MONO}" font-size="8" letter-spacing="0.8" fill="${MUTED}">WEEKLY</text>

  <g class="${cRest}">
    <text x="${firstSwatch - 8}" y="${legendY + 9}" text-anchor="end" font-family="${MONO}" font-size="10" letter-spacing="1.1" fill="${MUTED}">LESS</text>
    ${legend}
    <text x="${legendRight}" y="${legendY + 9}" text-anchor="end" font-family="${MONO}" font-size="10" letter-spacing="1.1" fill="${MUTED}">MORE</text>
  </g>
</svg>
`;

await (await import("node:fs/promises")).writeFile(OUT, svg, "utf8");
console.log(`${OUT}: ${total} contributions, ${weeks} weeks, peak ${peakVal}, ${CYCLE}s loop, ${(svg.length / 1024).toFixed(1)} KB`);
