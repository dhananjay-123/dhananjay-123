// An original avatar, drawn as a soft-shaded vector illustration.
//
// A hooded wanderer with fox ears stands in front of a pale moon. Its face is
// lost in the hood except for two lime eyes. A bone scarf trails in the wind, a
// tail with a lime tip curls behind, and it carries a lantern whose light falls
// on the cloak. No outlines: form comes from gradients, rim light and blur.
//
// The cloak sways, the scarf and tail drift, the lantern swings and breathes,
// the eyes blink, and fireflies rise. All CSS on fill-box origins, so the figure
// can be placed at any scale inside another SVG. Reduced motion holds it still.
// Run: node scripts/avatar.mjs
import { pathToFileURL } from "node:url";
import { write } from "./dots.mjs";

const BONE = "#ece6da";
const LIME = "#c5f24a";
const W = 260;
const H = 320;

const HOOD = "M92 152C76 122 82 96 96 84L88 46L114 72Q130 66 146 72L172 46L164 84C178 96 184 122 168 152Z";
const CLOAK = "M100 142C86 180 62 228 28 262Q50 268 60 288Q84 272 100 292Q124 276 142 294Q160 278 184 290C182 240 174 190 160 142Z";

/**
 * The avatar at `scale`: its CSS, its markup, its size, and where the lantern
 * is. `id` prefixes every class and def so two SVGs never collide.
 */
export function avatar(scale = 1, id = "av") {
  const c = (name) => `${id}-${name}`;
  const u = (name) => `url(#${c(name)})`;

  const style = `
.${id} * { transform-box: fill-box }
.${c("breathe")} { animation: ${c("breathe")} 4s ease-in-out infinite alternate }
.${c("sway")} { transform-origin: 60% 0%; animation: ${c("sway")} 4s ease-in-out infinite alternate }
.${c("scarf")} { transform-origin: 100% 40%; animation: ${c("scarf")} 2.6s ease-in-out infinite alternate }
.${c("tail")} { transform-origin: 0% 100%; animation: ${c("tail")} 3.2s ease-in-out infinite alternate }
.${c("swing")} { transform-origin: 50% 0%; animation: ${c("swing")} 3s ease-in-out infinite alternate }
.${c("glow")} { transform-origin: center; animation: ${c("glow")} 2.4s ease-in-out infinite alternate }
.${c("eye")} { transform-origin: center; animation: ${c("blink")} 5s ease-in-out infinite }
.${c("fly")} { animation: ${c("fly")} 7s ease-in-out infinite }
@keyframes ${c("breathe")} { from { transform: translateY(1.5px) } to { transform: translateY(-1.5px) } }
@keyframes ${c("sway")} { from { transform: skewX(-1.6deg) } to { transform: skewX(2.2deg) } }
@keyframes ${c("scarf")} { from { transform: rotate(-6deg) scaleX(0.97) } to { transform: rotate(7deg) scaleX(1.03) } }
@keyframes ${c("tail")} { from { transform: rotate(-5deg) } to { transform: rotate(7deg) } }
@keyframes ${c("swing")} { from { transform: rotate(-6deg) } to { transform: rotate(6deg) } }
@keyframes ${c("glow")} { from { transform: scale(0.88); opacity: 0.55 } to { transform: scale(1.12); opacity: 0.95 } }
@keyframes ${c("blink")} { 0%, 92% { transform: scaleY(1) } 95% { transform: scaleY(0.1) } 98%, 100% { transform: scaleY(1) } }
@keyframes ${c("fly")} { 0% { transform: translate(0, 10px); opacity: 0 } 20% { opacity: 1 } 80% { opacity: 0.8 } 100% { transform: translate(8px, -46px); opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .${id} * { animation: none !important } }`;

  const fly = (x, y, r, delay) =>
    `<circle class="${c("fly")}" style="animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="#e6ff9a" filter="${u("b1")}"/>`;

  const body = `<g class="${id}" transform="scale(${scale})">
<defs>
  <radialGradient id="${c("moon")}" cx="0.38" cy="0.32" r="0.8"><stop offset="0" stop-color="#fffdf5"/><stop offset="0.6" stop-color="${BONE}"/><stop offset="1" stop-color="#bfb5a2"/></radialGradient>
  <radialGradient id="${c("halo")}"><stop offset="0.55" stop-color="${BONE}" stop-opacity="0.35"/><stop offset="1" stop-color="${BONE}" stop-opacity="0"/></radialGradient>
  <linearGradient id="${c("cloak")}" x1="0.2" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#3b3166"/><stop offset="0.5" stop-color="#231c44"/><stop offset="1" stop-color="#110d22"/></linearGradient>
  <linearGradient id="${c("hood")}" x1="0.2" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="#4a3f80"/><stop offset="0.6" stop-color="#2a2250"/><stop offset="1" stop-color="#171230"/></linearGradient>
  <radialGradient id="${c("face")}" cx="0.5" cy="0.4" r="0.7"><stop offset="0" stop-color="#0c0a16"/><stop offset="1" stop-color="#030208"/></radialGradient>
  <linearGradient id="${c("scarfg")}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="0.6" stop-color="${BONE}"/><stop offset="1" stop-color="#a99e8b"/></linearGradient>
  <linearGradient id="${c("tailg")}" x1="0" y1="1" x2="0.9" y2="0"><stop offset="0" stop-color="#1b1536"/><stop offset="0.5" stop-color="#3b3166"/><stop offset="0.78" stop-color="#8fbf3a"/><stop offset="1" stop-color="#e6ff9a"/></linearGradient>
  <radialGradient id="${c("lamp")}" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="#e6ff9a"/><stop offset="1" stop-color="${LIME}"/></radialGradient>
  <radialGradient id="${c("light")}"><stop offset="0" stop-color="${LIME}" stop-opacity="0.75"/><stop offset="0.4" stop-color="${LIME}" stop-opacity="0.25"/><stop offset="1" stop-color="${LIME}" stop-opacity="0"/></radialGradient>
  <radialGradient id="${c("mist")}"><stop offset="0" stop-color="${BONE}" stop-opacity="0.3"/><stop offset="1" stop-color="${BONE}" stop-opacity="0"/></radialGradient>
  <filter id="${c("b1")}" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.2"/></filter>
  <filter id="${c("b3")}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="${c("b6")}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
  <clipPath id="${c("ccloak")}"><path d="${CLOAK}"/></clipPath>
  <clipPath id="${c("chood")}"><path d="${HOOD}"/></clipPath>
  <clipPath id="${c("cmoon")}"><circle cx="130" cy="118" r="88"/></clipPath>
</defs>

<circle cx="130" cy="118" r="128" fill="${u("halo")}"/>
<circle cx="130" cy="118" r="88" fill="${u("moon")}"/>
<g clip-path="${u("cmoon")}" fill="#a79d8a" fill-opacity="0.28">
  <circle cx="84" cy="84" r="13"/><circle cx="186" cy="74" r="8"/><circle cx="196" cy="150" r="16"/><circle cx="70" cy="150" r="7"/><circle cx="146" cy="50" r="5"/>
</g>
<ellipse cx="126" cy="296" rx="104" ry="13" fill="${u("mist")}"/>
<ellipse cx="124" cy="292" rx="60" ry="5" fill="#05040a" fill-opacity="0.55" filter="${u("b3")}"/>

<g class="${c("breathe")}">
  <g class="${c("tail")}">
    <path d="M160 280C208 288 250 256 250 206C250 180 222 176 218 200C222 236 198 258 160 254Z" fill="${u("tailg")}"/>
    <path d="M226 192C236 192 243 202 242 214" fill="none" stroke="#f4ffc8" stroke-width="3" stroke-linecap="round" stroke-opacity="0.7" filter="${u("b1")}"/>
  </g>

  <g class="${c("scarf")}">
    <path d="M104 150C72 138 52 158 16 134C28 150 32 160 22 174C54 182 76 162 104 168Z" fill="${u("scarfg")}"/>
    <path d="M100 158C74 152 56 168 30 164" fill="none" stroke="#8d8372" stroke-width="2" stroke-linecap="round" stroke-opacity="0.5"/>
  </g>

  <g class="${c("sway")}">
    <path d="${CLOAK}" fill="${u("cloak")}"/>
    <g clip-path="${u("ccloak")}">
      <path d="M118 160C110 210 96 250 84 296L110 296C116 250 124 208 128 160Z" fill="#07050f" fill-opacity="0.55" filter="${u("b3")}"/>
      <path d="M146 166C152 210 156 252 156 296L170 296C170 250 164 208 156 164Z" fill="#07050f" fill-opacity="0.45" filter="${u("b3")}"/>
      <path d="M76 214C66 236 56 254 44 270" fill="none" stroke="#07050f" stroke-width="7" stroke-opacity="0.4" filter="${u("b3")}"/>
      <path d="M100 142C86 180 62 228 28 262" fill="none" stroke="#b9aaff" stroke-width="5" stroke-opacity="0.75" filter="${u("b3")}"/>
      <path d="M160 142C174 190 182 240 184 290" fill="none" stroke="${LIME}" stroke-width="9" stroke-opacity="0.6" filter="${u("b6")}"/>
      <circle cx="196" cy="228" r="60" fill="${u("light")}" fill-opacity="0.5"/>
    </g>
  </g>

  <path d="M154 172C170 172 186 180 199 192L193 205C180 198 166 194 152 194Z" fill="#2a2250"/>
  <path d="M158 174C172 175 185 182 196 190" fill="none" stroke="${LIME}" stroke-width="3" stroke-opacity="0.45" filter="${u("b1")}"/>
  <circle cx="197" cy="199" r="5.5" fill="${BONE}"/>

  <g class="${c("swing")}">
    <path d="M197 200V216" stroke="#8d8372" stroke-width="1.6"/>
    <circle class="${c("glow")}" cx="197" cy="231" r="40" fill="${u("light")}"/>
    <rect x="189" y="214" width="16" height="5" rx="2" fill="#171230"/>
    <rect x="186" y="218" width="22" height="27" rx="9" fill="${u("lamp")}"/>
    <rect x="189" y="244" width="16" height="4" rx="2" fill="#171230"/>
    <path d="M197 218V245M186 231H208" stroke="#171230" stroke-width="1.2" stroke-opacity="0.55"/>
  </g>

  <path d="M96 146Q130 164 164 146L166 158Q130 180 94 158Z" fill="${u("scarfg")}"/>
  <path d="M100 156Q130 172 160 156" fill="none" stroke="#8d8372" stroke-width="2" stroke-opacity="0.45" stroke-linecap="round"/>

  <path d="${HOOD}" fill="${u("hood")}"/>
  <g clip-path="${u("chood")}">
    <path d="M94 58L104 78L112 72Z" fill="#0c0a16" fill-opacity="0.7"/>
    <path d="M166 58L156 78L148 72Z" fill="#0c0a16" fill-opacity="0.7"/>
    <path d="M92 152C76 122 82 96 96 84L88 46" fill="none" stroke="#c4b8ff" stroke-width="5" stroke-opacity="0.8" filter="${u("b3")}"/>
    <path d="M168 152C184 122 178 96 164 84" fill="none" stroke="${LIME}" stroke-width="6" stroke-opacity="0.4" filter="${u("b3")}"/>
    <ellipse cx="130" cy="120" rx="32" ry="29" fill="${u("face")}"/>
    <ellipse cx="130" cy="120" rx="32" ry="29" fill="none" stroke="#5a4e96" stroke-width="2" stroke-opacity="0.6"/>
  </g>
  <g filter="${u("b3")}" opacity="0.8"><ellipse cx="117" cy="118" rx="9" ry="6" fill="${LIME}"/><ellipse cx="143" cy="118" rx="9" ry="6" fill="${LIME}"/></g>
  <path class="${c("eye")}" d="M108 119Q116 108 126 117Q118 125 108 119Z" fill="#e6ff9a"/>
  <path class="${c("eye")}" d="M152 119Q144 108 134 117Q142 125 152 119Z" fill="#e6ff9a"/>
</g>

${fly(46, 236, 2.2, 0)}${fly(226, 150, 1.8, -2.4)}${fly(70, 196, 1.6, -4.1)}${fly(214, 268, 2, -5.5)}${fly(150, 262, 1.5, -1.2)}
</g>`;

  return { style, body, w: W * scale, h: H * scale, tip: [197 * scale, 231 * scale] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = avatar(1);
  await write(
    "assets/avatar.svg",
    `<svg xmlns="http://www.w3.org/2000/svg" width="${a.w}" height="${a.h}" viewBox="0 0 ${a.w} ${a.h}" role="img" aria-label="Avatar: a hooded wanderer with fox ears and glowing eyes, holding a lantern in front of the moon">
<title>Avatar</title>
<style>${a.style}
</style>
${a.body}
</svg>
`,
  );
}
