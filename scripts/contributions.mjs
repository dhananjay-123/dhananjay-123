// Renders the public GitHub contribution calendar as an on-brand SVG.
// No third-party service, no token: GitHub's own /users/<login>/contributions
// fragment is public, and every colour here comes from the profile palette.

const USER = process.argv[2] ?? "dhananjay-123";
const OUT = process.argv[3] ?? "assets/contributions.svg";

const PANEL_W = 880;
const PAD_X = 48;
const GUTTER = 39;       // weekday label column
const CELL = 11;
const PITCH = 14;
const GRID_X = PAD_X + GUTTER;
const GRID_Y = 92;
const PANEL_H = 236;

const INK = "#E8E6E3";
const MUTED = "#767D89";
const HAIRLINE = "#1C1F26";
const ACCENT = "#F0A63C";
const RAMP = ["#16191E", "#4B3512", "#8A5F1B", "#C08628", "#F0A63C"];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

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
const total = days.reduce((a, d) => a + d.count, 0);
const span = `${days[0].date} → ${days.at(-1).date}`;

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

// Columns fade in left to right, but the base opacity stays 1 so the graph is
// fully legible anywhere SMIL does not run.
const REVEAL = 1.8;
const cols = [];
for (let c = 0; c < weeks; c++) {
  const cells = days.filter((d) => d.col === c).map((d) =>
    // no per-cell <title>: an <img>-embedded SVG never surfaces them, and 371 of
    // them would triple the file. The summary lives in <desc> for screen readers.
    `<rect x="${GRID_X + c * PITCH}" y="${GRID_Y + d.row * PITCH}" width="${CELL}" height="${CELL}" rx="2" fill="${RAMP[d.level]}"/>`
  ).join("");
  const t1 = (0.05 + c * 0.022) / REVEAL;
  const t2 = Math.min(t1 + 0.35 / REVEAL, 1);
  cols.push(`<g opacity="1"><animate attributeName="opacity" values="0;0;1" keyTimes="0;${t1.toFixed(4)};${t2.toFixed(4)}" dur="${REVEAL}s" fill="freeze"/>${cells}</g>`);
}

const legendX = PANEL_W - PAD_X - 5 * 15 - 4;
const legend = RAMP.map((f, i) =>
  `<rect x="${legendX + i * 15}" y="205" width="${CELL}" height="${CELL}" rx="2" fill="${f}"/>`).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PANEL_W}" height="${PANEL_H}" viewBox="0 0 ${PANEL_W} ${PANEL_H}" fill="none" role="img" aria-labelledby="cTitle cDesc">
  <title id="cTitle">GitHub contribution activity for ${esc(USER)}</title>
  <desc id="cDesc">${esc(total)} contributions between ${esc(span)}, shown as a calendar heatmap of ${weeks} weeks by 7 days. Darker cells are quieter days; amber cells are the busiest.</desc>
  <defs>
    <pattern id="cgrid" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#14171C"/></pattern>
  </defs>
  <rect width="${PANEL_W}" height="${PANEL_H}" rx="10" fill="#0B0C0E"/>
  <rect width="${PANEL_W}" height="${PANEL_H}" rx="10" fill="url(#cgrid)"/>
  <rect x="0.5" y="0.5" width="${PANEL_W - 1}" height="${PANEL_H - 1}" rx="10" stroke="${HAIRLINE}"/>
  <g stroke="${ACCENT}" stroke-width="1.25" opacity="0.55">
    <path d="M18 34 L18 18 L34 18"/><path d="M${PANEL_W - 18} 34 L${PANEL_W - 18} 18 L${PANEL_W - 34} 18"/>
    <path d="M18 ${PANEL_H - 34} L18 ${PANEL_H - 18} L34 ${PANEL_H - 18}"/><path d="M${PANEL_W - 18} ${PANEL_H - 34} L${PANEL_W - 18} ${PANEL_H - 18} L${PANEL_W - 34} ${PANEL_H - 18}"/>
  </g>
  <text x="${PAD_X}" y="44" font-family="${MONO}" font-size="13" letter-spacing="2.6" fill="${ACCENT}">CONTRIBUTION ACTIVITY</text>
  <text x="${PANEL_W - PAD_X}" y="44" text-anchor="end" font-family="${MONO}" font-size="13" letter-spacing="1.2" fill="${INK}">${total.toLocaleString("en-US")} in the last year</text>
  <line x1="${PAD_X}" y1="60" x2="${PANEL_W - PAD_X}" y2="60" stroke="${HAIRLINE}"/>
  <line x1="${PAD_X}" y1="60" x2="${PANEL_W - PAD_X}" y2="60" stroke="${ACCENT}" stroke-dasharray="56 728"><animate attributeName="stroke-dashoffset" values="0;-784" dur="8s" repeatCount="indefinite"/></line>
  <g font-family="${MONO}" font-size="10" letter-spacing="1.1" fill="${MUTED}">
    ${monthMarks.map((m) => `<text x="${GRID_X + m.col * PITCH}" y="84">${m.label}</text>`).join("\n    ")}
    <text x="${GRID_X - 10}" y="${GRID_Y + PITCH + 9}" text-anchor="end">Mon</text>
    <text x="${GRID_X - 10}" y="${GRID_Y + 3 * PITCH + 9}" text-anchor="end">Wed</text>
    <text x="${GRID_X - 10}" y="${GRID_Y + 5 * PITCH + 9}" text-anchor="end">Fri</text>
  </g>
  ${cols.join("\n  ")}
  <text x="${legendX - 14}" y="214" text-anchor="end" font-family="${MONO}" font-size="10" letter-spacing="1.1" fill="${MUTED}">LESS</text>
  ${legend}
  <text x="${PANEL_W - PAD_X + 4}" y="214" font-family="${MONO}" font-size="10" letter-spacing="1.1" fill="${MUTED}">MORE</text>
</svg>
`;

await (await import("node:fs/promises")).writeFile(OUT, svg, "utf8");
console.log(`${OUT}: ${total} contributions, ${weeks} weeks, ${(svg.length / 1024).toFixed(1)} KB`);
