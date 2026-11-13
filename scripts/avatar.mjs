// An original avatar: Dot, a flip-dot that came off the board.
//
// A flip-dot disc has a dark side and a lit side. Dot is that idea as a
// creature: a glossy round body split on the diagonal, ink above and lime
// below, with limbs in the opposite colour of the side they are on. Small discs
// orbit it like electrons, a nod to the physics labs.
//
// No outlines: form comes from gradients, gloss and rim light. Dot floats, its
// eyes glance and blink, the tuft flickers, and the discs go round, passing
// behind the body and back in front. All CSS on fill-box origins, so the figure
// can be placed at any scale inside another SVG. Reduced motion holds it still.
// Run: node scripts/avatar.mjs
import { pathToFileURL } from "node:url";
import { write } from "./dots.mjs";

const BONE = "#ece6da";
const LIME = "#c5f24a";
const PINK = "#ef7fb0";
const W = 260;
const H = 300;
const CX = 130;
const CY = 148;

/**
 * The avatar at `scale`: its CSS, its markup, its size, and the point a signal
 * can leave from. `id` prefixes every class and def so two SVGs never collide.
 */
export function avatar(scale = 1, id = "av") {
  const c = (name) => `${id}-${name}`;
  const u = (name) => `url(#${c(name)})`;

  const style = `
.${id} * { transform-box: fill-box }
.${c("float")} { animation: ${c("float")} 3.4s ease-in-out infinite alternate }
.${c("shadow")} { transform-origin: center; animation: ${c("shadow")} 3.4s ease-in-out infinite alternate }
.${c("tuft")} { transform-origin: 50% 100%; animation: ${c("tuft")} 1.7s ease-in-out infinite alternate }
.${c("pupils")} { animation: ${c("look")} 8s ease-in-out infinite }
.${c("eye")} { transform-origin: center; animation: ${c("blink")} 4.6s ease-in-out infinite }
.${c("armL")} { transform-origin: 100% 0%; animation: ${c("wave")} 1.7s ease-in-out infinite alternate }
.${c("armR")} { transform-origin: 0% 0%; animation: ${c("wave")} 1.7s ease-in-out -0.8s infinite alternate-reverse }
.${c("foot")} { animation: ${c("foot")} 1.7s ease-in-out infinite alternate }
.${c("spinA")} { transform-origin: center; animation: ${c("spin")} 6s linear infinite }
.${c("keepA")} { transform-origin: center; animation: ${c("spin")} 6s linear infinite reverse }
.${c("spinB")} { transform-origin: center; animation: ${c("spin")} 9.5s linear infinite reverse }
.${c("keepB")} { transform-origin: center; animation: ${c("spin")} 9.5s linear infinite }
.${c("star")} { transform-origin: center; animation: ${c("star")} 3s ease-in-out infinite }
@keyframes ${c("float")} { from { transform: translateY(4px) } to { transform: translateY(-6px) } }
@keyframes ${c("shadow")} { from { transform: scaleX(1); opacity: 0.5 } to { transform: scaleX(0.8); opacity: 0.28 } }
@keyframes ${c("tuft")} { from { transform: rotate(-9deg) scaleY(0.94) } to { transform: rotate(8deg) scaleY(1.06) } }
@keyframes ${c("look")} { 0%, 28% { transform: none } 34%, 52% { transform: translate(5px, 1px) } 58%, 76% { transform: translate(-5px, 1px) } 82%, 100% { transform: none } }
@keyframes ${c("blink")} { 0%, 91% { transform: scaleY(1) } 94% { transform: scaleY(0.08) } 97%, 100% { transform: scaleY(1) } }
@keyframes ${c("wave")} { from { transform: rotate(-10deg) } to { transform: rotate(12deg) } }
@keyframes ${c("foot")} { from { transform: translateY(0) } to { transform: translateY(3px) } }
@keyframes ${c("spin")} { to { transform: rotate(360deg) } }
@keyframes ${c("star")} { 0%, 100% { transform: scale(0.4); opacity: 0.15 } 50% { transform: scale(1); opacity: 0.9 } }
@media (prefers-reduced-motion: reduce) { .${id} * { animation: none !important } }`;

  // One orbit: a ring tilted by `tilt`, squashed to look like it lies in depth,
  // and a disc going round it. The disc is counter-rotated so it stays round.
  // `front` draws only the near half, to go over the body.
  const SQ = 0.3;
  const orbit = (k, tilt, rx, fill, start, front) => `
  <g transform="rotate(${tilt} ${CX} ${CY})">
    <g transform="translate(${CX} ${CY}) scale(1 ${SQ})"${front ? ` clip-path="${u("near")}"` : ""}>
      <circle r="${rx}" fill="none" stroke="${BONE}" stroke-opacity="${front ? 0.5 : 0.22}" stroke-width="1.6" vector-effect="non-scaling-stroke"/>
      <g class="${c(`spin${k}`)}" style="animation-delay:${start}s">
        <circle r="${rx}" fill="none"/>
        <g transform="translate(${rx} 0)">
          <g class="${c(`keep${k}`)}" style="animation-delay:${start}s">
            <ellipse rx="13" ry="${13 / SQ}" fill="${fill}" fill-opacity="0.35" filter="${u("b3")}"/>
            <ellipse rx="7.5" ry="${7.5 / SQ}" fill="${fill}"/>
            <ellipse cx="-2" cy="${-2 / SQ}" rx="2.6" ry="${2.6 / SQ}" fill="#fff" fill-opacity="0.75"/>
          </g>
        </g>
      </g>
    </g>
  </g>`;

  const star = (x, y, r, fill, delay) =>
    `<path class="${c("star")}" style="animation-delay:${delay}s" fill="${fill}" d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z"/>`;

  const body = `<g class="${id}" transform="scale(${scale})">
<defs>
  <radialGradient id="${c("lime")}" cx="0.6" cy="0.62" r="0.75"><stop offset="0" stop-color="#e9ff9c"/><stop offset="0.45" stop-color="${LIME}"/><stop offset="1" stop-color="#6f9a1c"/></radialGradient>
  <radialGradient id="${c("ink")}" cx="0.3" cy="0.25" r="0.9"><stop offset="0" stop-color="#4b4470"/><stop offset="0.5" stop-color="#231f3a"/><stop offset="1" stop-color="#0c0a16"/></radialGradient>
  <radialGradient id="${c("shade")}" cx="0.4" cy="0.35" r="0.72"><stop offset="0.7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient>
  <radialGradient id="${c("eyeg")}" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfc7b8"/></radialGradient>
  <radialGradient id="${c("aura")}"><stop offset="0.45" stop-color="${LIME}" stop-opacity="0.22"/><stop offset="1" stop-color="${LIME}" stop-opacity="0"/></radialGradient>
  <linearGradient id="${c("tuftg")}" x1="0" y1="1" x2="0.3" y2="0"><stop offset="0" stop-color="#8fbf3a"/><stop offset="1" stop-color="#f1ffbe"/></linearGradient>
  <filter id="${c("b3")}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="${c("b6")}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
  <clipPath id="${c("ball")}"><circle cx="${CX}" cy="${CY}" r="70"/></clipPath>
  <clipPath id="${c("near")}"><rect x="-140" y="0" width="280" height="200"/></clipPath>
</defs>

<ellipse class="${c("shadow")}" cx="${CX}" cy="280" rx="52" ry="6" fill="#05040a" filter="${u("b3")}"/>
${star(26, 70, 7, LIME, 0)}${star(236, 52, 5, PINK, -1.2)}${star(40, 240, 5, BONE, -2.1)}${star(228, 236, 6, LIME, -0.6)}

<g class="${c("float")}">
  <circle cx="${CX}" cy="${CY}" r="112" fill="${u("aura")}"/>
  ${orbit("A", -24, 98, PINK, 0, false)}
  ${orbit("B", 30, 90, BONE, -3, false)}

  <g class="${c("foot")}"><ellipse cx="108" cy="226" rx="15" ry="10" fill="${u("lime")}"/></g>
  <g class="${c("foot")}" style="animation-delay:-0.85s"><ellipse cx="154" cy="226" rx="15" ry="10" fill="${u("ink")}"/></g>
  <g class="${c("armL")}"><ellipse cx="60" cy="168" rx="13" ry="10" fill="${u("lime")}"/></g>
  <g class="${c("armR")}"><ellipse cx="201" cy="160" rx="13" ry="10" fill="${u("ink")}"/></g>

  <path class="${c("tuft")}" d="M118 86C108 62 128 56 124 34C144 48 150 68 140 88Z" fill="${u("tuftg")}"/>

  <circle cx="${CX}" cy="${CY}" r="70" fill="${u("lime")}"/>
  <g clip-path="${u("ball")}">
    <path d="M40 60H214L206 84C170 104 112 150 66 214L40 226Z" fill="${u("ink")}"/>
    <path d="M206 84C170 104 112 150 66 214" fill="none" stroke="#f4ffc8" stroke-width="3" stroke-opacity="0.65" filter="${u("b3")}"/>
    <path d="M207 86C171 106 113 152 67 216" fill="none" stroke="#f4ffc8" stroke-width="1.2" stroke-opacity="0.7"/>
    <circle cx="${CX}" cy="${CY}" r="70" fill="${u("shade")}"/>
    <ellipse cx="100" cy="106" rx="30" ry="16" transform="rotate(-32 100 106)" fill="#fff" fill-opacity="0.28" filter="${u("b6")}"/>
    <ellipse cx="94" cy="100" rx="13" ry="5" transform="rotate(-32 94 100)" fill="#fff" fill-opacity="0.5" filter="${u("b3")}"/>
    <path d="M182 196A70 70 0 0 0 199 160" fill="none" stroke="#f6ffd0" stroke-width="5" stroke-opacity="0.7" filter="${u("b3")}"/>
  </g>

  <ellipse cx="92" cy="176" rx="11" ry="6" fill="${PINK}" fill-opacity="0.45" filter="${u("b3")}"/>
  <ellipse cx="170" cy="176" rx="11" ry="6" fill="${PINK}" fill-opacity="0.5" filter="${u("b3")}"/>
  <g class="${c("eye")}">
    <ellipse cx="108" cy="150" rx="15" ry="19" fill="${u("eyeg")}"/>
    <ellipse cx="152" cy="150" rx="15" ry="19" fill="${u("eyeg")}"/>
    <g class="${c("pupils")}">
      <circle cx="110" cy="153" r="9" fill="#0c0a16"/><circle cx="154" cy="153" r="9" fill="#0c0a16"/>
      <circle cx="113" cy="149" r="3.2" fill="#fff"/><circle cx="157" cy="149" r="3.2" fill="#fff"/>
      <circle cx="107" cy="157" r="1.5" fill="#fff" fill-opacity="0.7"/><circle cx="151" cy="157" r="1.5" fill="#fff" fill-opacity="0.7"/>
    </g>
  </g>
  <path d="M122 180Q131 189 141 179" fill="none" stroke="#1a1730" stroke-width="3.2" stroke-linecap="round"/>

  ${orbit("A", -24, 98, PINK, 0, true)}
  ${orbit("B", 30, 90, BONE, -3, true)}
</g>
</g>`;

  return { style, body, w: W * scale, h: H * scale, tip: [214 * scale, 160 * scale] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = avatar(1);
  await write(
    "assets/avatar.svg",
    `<svg xmlns="http://www.w3.org/2000/svg" width="${a.w}" height="${a.h}" viewBox="0 0 ${a.w} ${a.h}" role="img" aria-label="Avatar: Dot, a round two-tone creature, ink on one side and lime on the other, with small discs orbiting it">
<title>Dot</title>
<style>${a.style}
</style>
${a.body}
</svg>
`,
  );
}
