// Generates assets/build.svg — the "HOW I BUILD" panel.
//
// The three slabs are real solids turning on their vertical axes, not a flat
// picture that bobs. Two mechanisms do the work, and the split between them is
// the whole trick:
//
//   * Anything lying IN a slab's own plane — the top face, the inset outline,
//     the label — sits inside a constant isometric matrix with a plain
//     rotate() under it. A rotation in that local plane IS the 3D rotation
//     about the vertical axis, so one animateTransform drives it exactly, at
//     whatever frame rate the browser feels like, with no baked geometry.
//   * Only the two side faces span the vertical, so only they need their
//     geometry morphed frame by frame. Across the sweep the same two faces
//     stay visible — the face normals never leave the viewer's half-plane — so
//     two fixed <path> elements can carry the whole cycle without ever having
//     to hand off to a different face.
//
// SMIL rather than CSS because it animates `d` in every browser that renders
// SVG at all, where the CSS `d` property is a good deal newer. SMIL can't be
// switched off by a media query the way a CSS animation can, so the still pose
// is emitted as a second copy and prefers-reduced-motion swaps which is drawn.

import { writeFileSync } from 'node:fs';

const W = 880, H = 440;
const CX = 170;                    // centre column of the stack
const A = 51.4286;                 // slab half-side, in the slab's own plane
const R = A * Math.SQRT2;          // corner radius
const T = 12;                      // slab thickness
const C = 0.894427, S = 0.447214;  // isometric basis, columns normalised
const AMP = 22, BIAS = -8;         // rotation sweep, degrees: BIAS +- AMP
const SPIN = 10, BOB = 7;          // seconds per turn / per bob
const BOBAMP = 2.5;                // bob travel; kept under the slab clearance
const NROT = 40, NBOB = 16;        // samples per cycle

const rad = d => d * Math.PI / 180;
const proj = (X, Y) => [C * (X - Y), S * (X + Y)];
const n2 = v => (Math.round(v * 100) / 100).toString();

// corner j of a slab turned by phi, as a screen offset from the slab centre
const corner = (j, phi) => {
  const t = rad(45 + 90 * j + phi);
  return proj(R * Math.cos(t), R * Math.sin(t));
};

// face k spans corners k-1 and k; the quad is that edge extruded straight down
const faceD = (k, phi, cy) => {
  const [px, py] = corner((k + 3) % 4, phi);
  const [qx, qy] = corner(k, phi);
  return `M${n2(CX + px)} ${n2(cy + py)} L${n2(CX + qx)} ${n2(cy + qy)} `
       + `L${n2(CX + qx)} ${n2(cy + qy + T)} L${n2(CX + px)} ${n2(cy + py + T)} Z`;
};

// lambert-ish: a side face normal is horizontal, so brightness follows its angle
const LIGHT = 105;
const shade = (k, phi) => 0.30 + 0.55 * (0.5 + 0.5 * Math.cos(rad(90 * k + phi - LIGHT)));
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (lo, hi, u) => '#' + hex(lo).map((c, i) =>
  Math.round(c + (hex(hi)[i] - c) * u).toString(16).padStart(2, '0')).join('');

// biased off centre: the label is painted on the face, and a sweep centred on
// zero would swing it up to a 52-degree tilt at one end. Leaning the sweep
// negative keeps the same travel while holding the text between 8 and 40.
const phiAt = (t, phase) => BIAS + AMP * Math.sin(2 * Math.PI * (t + phase));
const bobAt = (t, phase) => -BOBAMP + BOBAMP * Math.cos(2 * Math.PI * (t + phase));

const layers = [
  { cy: 120, label: 'INTERFACE', grad: 't1', lo: '#3B276E', hi: '#8A6BE0', ink: '#140A26', phase: 0.00 },
  { cy: 221, label: 'SYSTEMS',   grad: 't2', lo: '#1D3F66', hi: '#559AE0', ink: '#06111F', phase: 0.10 },
  { cy: 315, label: 'PRACTICE',  grad: 't3', lo: '#333952', hi: '#8892AF', ink: '#0D1017', phase: 0.20 },
];

const samples = n => Array.from({ length: n + 1 }, (_, i) => i / n);

function slab(L, animated) {
  const rot = samples(NROT).map(t => animated ? phiAt(t, L.phase) : 0);
  const bob = samples(NBOB).map(t => animated ? bobAt(t, L.phase) : 0);
  const phi0 = rot[0];

  const sides = [0, 1].map(k => {
    const d = faceD(k, phi0, L.cy);
    const fill = mix(L.lo, L.hi, shade(k, phi0));
    if (!animated) return `      <path d="${d}" fill="${fill}"/>`;
    return `      <path d="${d}" fill="${fill}">
        <animate attributeName="d" dur="${SPIN}s" repeatCount="indefinite" values="${rot.map(p => faceD(k, p, L.cy)).join(';')}"/>
        <animate attributeName="fill" dur="${SPIN}s" repeatCount="indefinite" values="${rot.map(p => mix(L.lo, L.hi, shade(k, p))).join(';')}"/>
      </path>`;
  }).join('\n');

  const spin = animated
    ? `\n            <animateTransform attributeName="transform" type="rotate" dur="${SPIN}s" repeatCount="indefinite" values="${rot.map(n2).join(';')}"/>`
    : '';
  const float = animated
    ? `\n      <animateTransform attributeName="transform" type="translate" dur="${BOB}s" repeatCount="indefinite" values="${bob.map(v => `0 ${n2(v)}`).join(';')}"/>`
    : '';

  const half = n2(A), inset = n2(A - 5);
  return `    <g>${float}
${sides}
      <g transform="translate(${CX} ${L.cy})">
        <g transform="matrix(${C} ${S} ${-C} ${S} 0 0)">
          <g transform="rotate(${n2(phi0)})">${spin}
            <path d="M${-half} ${-half} L${half} ${-half} L${half} ${half} L${-half} ${half} Z" fill="url(#${L.grad})"/>
            <path d="M${-inset} ${-inset} L${inset} ${-inset} L${inset} ${inset} L${-inset} ${inset} Z" fill="none" stroke="#FFFFFF" stroke-opacity="0.18"/>
            <text x="${n2(-L.label.length * 4.88)}" y="4.5" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" letter-spacing="2.2" fill="${L.ink}">${L.label}</text>
          </g>
        </g>
      </g>
    </g>`;
}

const stack = animated =>
  `  <g class="${animated ? 'motion' : 'still'}">\n${layers.map(L => slab(L, animated)).join('\n')}\n  </g>`;

const rows = [
  ['#A78BFA', 0, 'FRONTEND', [
    ['design systems &amp; tokens', ' contrast checked against WCAG AA'],
    ['keyboard focus handled in modals and drawers', ' reduced-motion respected'],
    ['loading, empty and error states on every screen'],
  ]],
  ['#60A5FA', 1, 'BACKEND &amp; INFRA', [
    ['live updates over Socket.IO', ' offline-first with service workers'],
    ['multi-tenant with per-role permissions'],
    ['attendance sync from 3 biometric devices, safe to retry'],
    ['marking rules configured in the database, not hard-coded'],
  ]],
  ['#7C86A8', 2, 'DAY TO DAY', [
    ['conventional commits', ' CI runs typecheck, lint, tests and build'],
    ['225+ DSA problems solved on LeetCode'],
  ]],
];

const copy = rows.map(([col, idx, tag, lines]) => {
  // centre the block on its slab: the run spans 22px to the first line plus
  // 16px per line after it
  const y = Math.round(layers[idx].cy - (22 + (lines.length - 1) * 16) / 2 + 4);
  const head = `      <text x="372" y="${y}" font-size="10" letter-spacing="2.2" fill="${col}">${tag}</text>`;
  const body = lines.map((parts, i) => {
    const span = parts.length === 2
      ? `${parts[0]} <tspan fill="#3A4160">·</tspan>${parts[1]}`
      : parts[0];
    return `      <text x="372" y="${y + 22 + i * 16}" font-size="10.5" letter-spacing="0.15" fill="#7C86A8">${span}</text>`;
  }).join('\n');
  return head + '\n' + body;
}).join('\n\n');

const pulses = layers.map((L, i) => {
  const col = ['#A78BFA', '#60A5FA', '#7C86A8'][i];
  const begin = (i * 0.55).toFixed(2);
  return `  <circle cy="${L.cy}" r="2" fill="${col}" opacity="0">
    <animate attributeName="cx" values="274;348" dur="2.6s" begin="${begin}s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.8;1" dur="2.6s" begin="${begin}s" repeatCount="indefinite"/>
  </circle>`;
}).join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" role="img" aria-labelledby="buildTitle buildDesc">
  <title id="buildTitle">How I build</title>
  <desc id="buildDesc">Three isometric slabs turning slowly in a stack, each wired across to what it covers. INTERFACE — frontend: design systems and tokens, contrast checked against WCAG AA, keyboard focus handled in modals and drawers, reduced-motion respected, loading, empty and error states on every screen. SYSTEMS — backend and infrastructure: live updates over Socket.IO, offline-first with service workers, multi-tenant with per-role permissions, attendance sync from 3 biometric devices that is safe to retry, marking rules configured in the database rather than hard-coded. PRACTICE — day to day: conventional commits, CI runs typecheck, lint, tests and build, 225 or more DSA problems solved on LeetCode.</desc>

  <style>
    /* SMIL drives the turn, and a media query can't switch SMIL off the way it
       can a CSS animation. So the still pose is a second copy and the query
       decides which of the two is drawn. */
    .still { display: none }
    @media (prefers-reduced-motion: reduce) {
      .motion { display: none }
      .still { display: inline }
    }
  </style>

  <defs>
    <pattern id="bgrid" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="#141827"/>
    </pattern>
    <linearGradient id="t1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#C9BCFE"/><stop offset="1" stop-color="#9575F5"/>
    </linearGradient>
    <linearGradient id="t2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8CC0FF"/><stop offset="1" stop-color="#4E92E8"/>
    </linearGradient>
    <linearGradient id="t3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#98A1BE"/><stop offset="1" stop-color="#6B7597"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" rx="10" fill="#0A0B11"/>
  <rect width="${W}" height="${H}" rx="10" fill="url(#bgrid)"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" stroke="#1E2334"/>

  <g stroke="#A78BFA" stroke-width="1.25" opacity="0.55">
    <path d="M18 34 L18 18 L34 18"/>
    <path d="M862 34 L862 18 L846 18"/>
    <path d="M18 ${H - 34} L18 ${H - 18} L34 ${H - 18}"/>
    <path d="M862 ${H - 34} L862 ${H - 18} L846 ${H - 18}"/>
  </g>

  <rect x="40" y="37" width="7" height="7" fill="#A78BFA"/>
  <text x="60" y="44" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" letter-spacing="2.6" fill="#A78BFA">THE WHOLE STACK</text>
  <text x="840" y="44" text-anchor="end" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="10.5" letter-spacing="1.4" fill="#4A5270">THREE LAYERS · ONE PERSON</text>
  <line x1="40" y1="62" x2="840" y2="62" stroke="#1E2334"/>

  <!-- spine: drawn first so the slabs occlude it and only the gaps read -->
  <line x1="${CX}" y1="${layers[0].cy + 58}" x2="${CX}" y2="${layers[2].cy - 46}" stroke="#2A3150" stroke-dasharray="3 5">
    <animate attributeName="stroke-dashoffset" values="0;-8" dur="1.1s" repeatCount="indefinite"/>
  </line>

  <g stroke="#2A3150" stroke-dasharray="2 4">
${layers.map(L => `    <line x1="272" y1="${L.cy}" x2="350" y2="${L.cy}"/>`).join('\n')}
  </g>
${pulses}
${layers.map((L, i) => `  <circle cx="356" cy="${L.cy}" r="2.5" fill="${['#A78BFA', '#60A5FA', '#7C86A8'][i]}"/>`).join('\n')}

${stack(true)}
${stack(false)}

  <g font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">
${copy}
  </g>
</svg>
`;

writeFileSync(new URL('../assets/build.svg', import.meta.url), svg);
console.log('assets/build.svg', (svg.length / 1024).toFixed(1) + ' KB');
