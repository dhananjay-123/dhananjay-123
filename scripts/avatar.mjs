// An original avatar: a superhero whose emblem is a flip-dot.
//
// A hovering figure in a dark suit, fists on hips, with a sleek helmet,
// one angular lime visor and a lime cape in the wind. The chest emblem is the
// site's disc, ink on one half and lime on the other, and it turns over now and
// then. One disc circles the hero like an electron.
//
// No outlines: form comes from gradients, rim light and blur. The hero hovers,
// the cape billows, the visor and emblem glow, sparks rise from below. All CSS
// on fill-box origins, so the figure can be placed at any scale inside another
// SVG. Reduced motion holds it still. Run: node scripts/avatar.mjs
import { pathToFileURL } from "node:url";
import { write } from "./dots.mjs";

const BONE = "#ece6da";
const LIME = "#c5f24a";
const W = 260;
const H = 320;
const CX = 130;
const CY = 150;

const TORSO = "M86 106Q130 90 174 106L154 190Q130 198 106 190Z";
const CAPE = "M98 98C60 112 30 164 12 240C38 230 52 248 62 268C76 244 96 254 106 276C118 250 136 254 152 268C162 204 166 144 162 98Z";

/**
 * The avatar at `scale`: its CSS, its markup, its size, and the point a signal
 * can leave from. `id` prefixes every class and def so two SVGs never collide.
 */
export function avatar(scale = 1, id = "av") {
  const c = (name) => `${id}-${name}`;
  const u = (name) => `url(#${c(name)})`;

  const style = `
.${id} * { transform-box: fill-box }
.${c("hover")} { animation: ${c("hover")} 3.2s ease-in-out infinite alternate }
.${c("shadow")} { transform-origin: center; animation: ${c("shadow")} 3.2s ease-in-out infinite alternate }
.${c("cape")} { transform-origin: 85% 0%; animation: ${c("cape")} 2.2s ease-in-out infinite alternate }
.${c("fold")} { animation: ${c("fold")} 2.2s ease-in-out infinite alternate }
.${c("visor")} { animation: ${c("visor")} 2.6s ease-in-out infinite alternate }
.${c("emblem")} { transform-origin: center; animation: ${c("flip")} 6s ease-in-out infinite }
.${c("halo")} { transform-origin: center; animation: ${c("halo")} 2.6s ease-in-out infinite alternate }
.${c("spin")} { transform-origin: center; animation: ${c("spin")} 5s linear infinite }
.${c("keep")} { transform-origin: center; animation: ${c("spin")} 5s linear infinite reverse }
.${c("spark")} { animation: ${c("spark")} 2.4s linear infinite }
@keyframes ${c("hover")} { from { transform: translateY(4px) } to { transform: translateY(-6px) } }
@keyframes ${c("shadow")} { from { transform: scaleX(1); opacity: 0.55 } to { transform: scaleX(0.78); opacity: 0.3 } }
@keyframes ${c("cape")} { from { transform: skewX(3deg) scaleX(0.95) } to { transform: skewX(-5deg) scaleX(1.05) } }
@keyframes ${c("fold")} { from { transform: translateX(-3px) } to { transform: translateX(4px) } }
@keyframes ${c("visor")} { from { opacity: 0.55 } to { opacity: 1 } }
@keyframes ${c("flip")} { 0%, 80% { transform: rotate(45deg) scaleY(1) rotate(-45deg) } 86% { transform: rotate(45deg) scaleY(0) rotate(-45deg) } 92%, 100% { transform: rotate(45deg) scaleY(1) rotate(-45deg) } }
@keyframes ${c("halo")} { from { transform: scale(0.85); opacity: 0.45 } to { transform: scale(1.2); opacity: 0.9 } }
@keyframes ${c("spin")} { to { transform: rotate(360deg) } }
@keyframes ${c("spark")} { 0% { transform: translateY(0); opacity: 0 } 15% { opacity: 1 } 100% { transform: translateY(-54px); opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .${id} * { animation: none !important } }`;

  // One disc on a tilted ring around the hero. `front` draws only the near half.
  const SQ = 0.28;
  const RX = 96;
  const orbit = (front) => `
  <g transform="rotate(-16 ${CX} ${CY})">
    <g transform="translate(${CX} ${CY}) scale(1 ${SQ})"${front ? ` clip-path="${u("near")}"` : ""}>
      <circle r="${RX}" fill="none" stroke="${BONE}" stroke-opacity="${front ? 0.45 : 0.18}" stroke-width="1.4" vector-effect="non-scaling-stroke"/>
      <g class="${c("spin")}">
        <circle r="${RX}" fill="none"/>
        <g transform="translate(${RX} 0)">
          <g class="${c("keep")}">
            <ellipse rx="12" ry="${12 / SQ}" fill="${LIME}" fill-opacity="0.4" filter="${u("b3")}"/>
            <ellipse rx="6" ry="${6 / SQ}" fill="#f1ffbe"/>
          </g>
        </g>
      </g>
    </g>
  </g>`;

  const spark = (x, y, w, delay) =>
    `<rect class="${c("spark")}" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${w}" height="${w * 5}" rx="${w / 2}" fill="#e6ff9a"/>`;

  // An arm as two thick strokes, shoulder to elbow to fist on the hip.
  const arm = (sx, ex, fx) => `
    <path d="M${sx} 110L${ex} 150L${fx} 186" fill="none" stroke="${u("limb")}" stroke-width="21" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${(ex + fx) / 2} 168L${fx} 186" fill="none" stroke="${u("glove")}" stroke-width="20" stroke-linecap="round"/>
    <circle cx="${fx}" cy="186" r="10.5" fill="${u("glove")}"/>`;

  const body = `<g class="${id}" transform="scale(${scale})">
<defs>
  <linearGradient id="${c("suit")}" x1="0.15" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="#5a4e9c"/><stop offset="0.45" stop-color="#2c2552"/><stop offset="1" stop-color="#120e24"/></linearGradient>
  <linearGradient id="${c("limb")}" gradientUnits="userSpaceOnUse" x1="60" y1="100" x2="200" y2="300"><stop offset="0" stop-color="#4a3f86"/><stop offset="0.5" stop-color="#262048"/><stop offset="1" stop-color="#100c20"/></linearGradient>
  <linearGradient id="${c("glove")}" gradientUnits="userSpaceOnUse" x1="60" y1="140" x2="200" y2="200"><stop offset="0" stop-color="#dcff7a"/><stop offset="1" stop-color="#86b526"/></linearGradient>
  <linearGradient id="${c("capeg")}" x1="0.9" y1="0" x2="0.2" y2="1"><stop offset="0" stop-color="#e2ff8a"/><stop offset="0.4" stop-color="${LIME}"/><stop offset="1" stop-color="#4f7412"/></linearGradient>
  <radialGradient id="${c("helm")}" cx="0.36" cy="0.26" r="0.9"><stop offset="0" stop-color="#7468b8"/><stop offset="0.5" stop-color="#2c2552"/><stop offset="1" stop-color="#0d0a1a"/></radialGradient>
  <linearGradient id="${c("boot")}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dcff7a"/><stop offset="1" stop-color="#7aa822"/></linearGradient>
  <radialGradient id="${c("aura")}"><stop offset="0.3" stop-color="${LIME}" stop-opacity="0.2"/><stop offset="1" stop-color="${LIME}" stop-opacity="0"/></radialGradient>
  <radialGradient id="${c("thrust")}"><stop offset="0" stop-color="${LIME}" stop-opacity="0.55"/><stop offset="1" stop-color="${LIME}" stop-opacity="0"/></radialGradient>
  <filter id="${c("b1")}" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.4"/></filter>
  <filter id="${c("b3")}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="${c("b6")}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
  <clipPath id="${c("ctorso")}"><path d="${TORSO}"/></clipPath>
  <clipPath id="${c("ccape")}"><path d="${CAPE}"/></clipPath>
  <clipPath id="${c("cemb")}"><circle cx="130" cy="132" r="14"/></clipPath>
  <clipPath id="${c("near")}"><rect x="-140" y="0" width="280" height="220"/></clipPath>
</defs>

<ellipse cx="${CX}" cy="160" rx="124" ry="140" fill="${u("aura")}"/>
<ellipse class="${c("shadow")}" cx="${CX}" cy="306" rx="50" ry="6" fill="#05040a" filter="${u("b3")}"/>
<ellipse cx="${CX}" cy="304" rx="44" ry="9" fill="${u("thrust")}"/>
${spark(96, 300, 2, 0)}${spark(120, 304, 2.4, -0.7)}${spark(142, 302, 2, -1.3)}${spark(164, 300, 1.8, -1.9)}${spark(108, 302, 1.6, -1.6)}

<g class="${c("hover")}">
  ${orbit(false)}

  <g class="${c("cape")}">
    <path d="${CAPE}" fill="${u("capeg")}"/>
    <g clip-path="${u("ccape")}">
      <g class="${c("fold")}">
        <path d="M92 110C70 150 52 200 44 262L60 262C66 204 82 152 104 112Z" fill="#35500a" fill-opacity="0.55" filter="${u("b3")}"/>
        <path d="M128 112C116 160 104 214 98 280L112 280C118 214 130 160 140 112Z" fill="#35500a" fill-opacity="0.5" filter="${u("b3")}"/>
        <path d="M76 124C56 160 38 200 26 246" fill="none" stroke="#f6ffd0" stroke-width="4" stroke-opacity="0.7" filter="${u("b3")}"/>
      </g>
      <path d="M150 100C156 160 156 220 150 276L170 276L170 100Z" fill="#1c2a05" fill-opacity="0.6" filter="${u("b6")}"/>
    </g>
  </g>

  <path d="M105 188L133 188L130 244L127 292L106 292L103 244Z" fill="${u("limb")}"/>
  <path d="M128 188L157 188L166 238L156 286L136 282L138 238Z" fill="${u("limb")}"/>
  <path d="M104 264L129 264L127 292L121 311L107 304Z" fill="${u("boot")}"/>
  <path d="M137 258L162 262L156 286L147 304L134 295Z" fill="${u("boot")}"/>
  <path d="M112 196L110 244" fill="none" stroke="#8d82d6" stroke-width="2.5" stroke-opacity="0.6" stroke-linecap="round" filter="${u("b1")}"/>

  ${arm(90, 64, 106)}
  ${arm(170, 196, 154)}

  <path d="${TORSO}" fill="${u("suit")}"/>
  <g clip-path="${u("ctorso")}">
    <path d="M130 100V196" stroke="#0d0a1a" stroke-width="2" stroke-opacity="0.5"/>
    <path d="M100 150Q130 162 160 150M106 170Q130 180 154 170" fill="none" stroke="#0d0a1a" stroke-width="2" stroke-opacity="0.4"/>
    <path d="M86 106Q98 150 106 190" fill="none" stroke="#a99cff" stroke-width="6" stroke-opacity="0.7" filter="${u("b3")}"/>
    <path d="M174 106Q164 150 154 190" fill="none" stroke="${LIME}" stroke-width="6" stroke-opacity="0.45" filter="${u("b3")}"/>
    <path d="M92 104Q130 92 168 104L164 116Q130 104 96 116Z" fill="#fff" fill-opacity="0.12"/>
  </g>
  <path d="M106 182Q130 190 154 182L153 193Q130 201 107 193Z" fill="${u("glove")}"/>
  <ellipse cx="88" cy="108" rx="15" ry="12" fill="${u("helm")}"/>
  <ellipse cx="172" cy="108" rx="15" ry="12" fill="${u("helm")}"/>
  <path d="M102 98Q130 110 158 98L156 106Q130 120 104 106Z" fill="${u("capeg")}"/>

  <circle class="${c("halo")}" cx="130" cy="132" r="22" fill="${LIME}" fill-opacity="0.45" filter="${u("b6")}"/>
  <g class="${c("emblem")}">
    <circle cx="130" cy="132" r="14" fill="${LIME}"/>
    <path clip-path="${u("cemb")}" d="M112 112H150L112 150Z" fill="#141026"/>
    <circle cx="130" cy="132" r="14" fill="none" stroke="#f1ffbe" stroke-width="1.6"/>
  </g>

  <rect x="121" y="84" width="18" height="18" rx="6" fill="#1a1533"/>
  <path d="M107 62C107 34 153 34 153 62C153 80 143 96 130 98C117 96 107 80 107 62Z" fill="${u("helm")}"/>
  <path d="M112 50C116 42 124 38 132 38" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-opacity="0.55" filter="${u("b1")}"/>
  <path d="M130 84L122 90Q130 96 138 90Z" fill="#0d0a1a" fill-opacity="0.6"/>
  <g class="${c("visor")}">
    <path d="M109 58L128 66H132L151 58L149 71L133 77H127L111 71Z" fill="${LIME}" filter="${u("b3")}"/>
  </g>
  <path d="M110 59L128 66.5H132L150 59L148.500 70L133 76H127L111.500 70Z" fill="#eaffa6"/>
  <path d="M128 66.500H132V76H128Z" fill="#2c2552"/>

  ${orbit(true)}
</g>
</g>`;

  return { style, body, w: W * scale, h: H * scale, tip: [204 * scale, 150 * scale] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = avatar(1);
  await write(
    "assets/avatar-hero-2.svg",
    `<svg xmlns="http://www.w3.org/2000/svg" width="${a.w}" height="${a.h}" viewBox="0 0 ${a.w} ${a.h}" role="img" aria-label="Avatar: a hovering superhero in a dark suit with a lime cape and visor, and a flip-dot disc as the chest emblem">
<title>Avatar</title>
<style>${a.style}
</style>
${a.body}
</svg>
`,
  );
}
