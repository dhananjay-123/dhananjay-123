// The avatar: the owner's own artwork (assets/avatar-art.webp), brought to life.
//
// The picture is embedded as it is, a crowned figure in an iron mask and a
// green cloak, and the motion is laid over it: the eyes burn and flicker, the
// figure breathes, a glint runs round the gold ring behind it, light sweeps
// across, and embers rise. An SVG shown through <img> cannot load other files,
// so the art travels inside it as a data URI.
//
// All CSS on fill-box origins, so the avatar can be placed at any scale inside
// another SVG. Reduced motion leaves the still picture. Run: node scripts/avatar.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { write } from "./dots.mjs";

const ART = readFileSync(fileURLToPath(new URL("../assets/avatar-art.webp", import.meta.url))).toString("base64");
const SIZE = 300;
const GOLD = "#e9d9a0";
const EYE = "#d6ffd0";

/**
 * The avatar at `scale`: its CSS, its markup, its size, and the point a signal
 * can leave from. `id` prefixes every class and def so two SVGs never collide.
 */
export function avatar(scale = 1, id = "av") {
  const c = (name) => `${id}-${name}`;
  const u = (name) => `url(#${c(name)})`;

  const style = `
.${id} * { transform-box: fill-box }
.${c("art")} { transform-origin: 50% 60%; animation: ${c("breathe")} 5s ease-in-out infinite alternate }
.${c("eye")} { transform-origin: center; animation: ${c("eye")} 3.4s ease-in-out infinite }
.${c("flare")} { transform-origin: center; animation: ${c("flare")} 6.8s ease-in-out infinite }
.${c("sweep")} { animation: ${c("sweep")} 8s ease-in-out infinite }
.${c("glint")} { animation: ${c("glint")} 5s linear infinite }
.${c("ember")} { animation: ${c("ember")} 5s linear infinite }
.${c("gem")} { transform-origin: center; animation: ${c("gem")} 3.4s ease-in-out infinite alternate }
@keyframes ${c("breathe")} { from { transform: scale(1) } to { transform: scale(1.035) } }
@keyframes ${c("eye")} { 0%, 100% { opacity: 0.55; transform: scale(0.9) } 45% { opacity: 1; transform: scale(1.25) } 52% { opacity: 0.7 } 58% { opacity: 1 } }
@keyframes ${c("flare")} { 0%, 88%, 100% { opacity: 0; transform: scale(0.6) } 93% { opacity: 0.9; transform: scale(1.6) } }
@keyframes ${c("sweep")} { 0%, 55% { transform: translateX(0) } 100% { transform: translateX(${SIZE * 2.2}px) } }
@keyframes ${c("glint")} { from { stroke-dashoffset: 260 } to { stroke-dashoffset: -40 } }
@keyframes ${c("ember")} { 0% { transform: translate(0, 0); opacity: 0 } 15% { opacity: 0.9 } 100% { transform: translate(10px, -150px); opacity: 0 } }
@keyframes ${c("gem")} { from { opacity: 0.15 } to { opacity: 0.75 } }
@media (prefers-reduced-motion: reduce) { .${id} * { animation: none !important } .${c("flare")}, .${c("sweep")}, .${c("ember")} { opacity: 0 } }`;

  const eye = (x, y, tilt) => `
    <g transform="rotate(${tilt} ${x} ${y})">
      <ellipse class="${c("eye")}" cx="${x}" cy="${y}" rx="13" ry="6" fill="${EYE}" fill-opacity="0.6" filter="${u("b4")}"/>
      <ellipse class="${c("eye")}" cx="${x}" cy="${y}" rx="6" ry="2.2" fill="#ffffff" filter="${u("b1")}"/>
      <ellipse class="${c("flare")}" cx="${x}" cy="${y}" rx="26" ry="3" fill="#ffffff" filter="${u("b1")}"/>
    </g>`;

  const ember = (x, y, r, delay, fill) =>
    `<circle class="${c("ember")}" style="animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${fill}" filter="${u("b1")}"/>`;

  const body = `<g class="${id}" transform="scale(${scale})">
<defs>
  <clipPath id="${c("frame")}"><rect width="${SIZE}" height="${SIZE}" rx="18"/></clipPath>
  <filter id="${c("b1")}" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1"/></filter>
  <filter id="${c("b4")}" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>
  <linearGradient id="${c("band")}"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#eaffd8" stop-opacity="0.16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>
<g clip-path="${u("frame")}">
  <rect width="${SIZE}" height="${SIZE}" fill="#060806"/>
  <g class="${c("art")}">
    <image width="${SIZE}" height="${SIZE}" href="data:image/webp;base64,${ART}"/>
    <path class="${c("glint")}" d="M13.5 150.7A136 136 0 0 1 105.2 22.1" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="26 400" filter="${u("b1")}"/>
    <path class="${c("glint")}" style="animation-delay:-2.5s" d="M193.8 22.1A136 136 0 0 1 285.5 150.7" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="26 400" filter="${u("b1")}"/>
    <ellipse class="${c("gem")}" cx="170" cy="78" rx="7" ry="10" fill="${GOLD}" filter="${u("b4")}"/>
    <ellipse class="${c("gem")}" style="animation-delay:-1.7s" cx="131" cy="185" rx="12" ry="12" fill="${GOLD}" fill-opacity="0.7" filter="${u("b4")}"/>
    ${eye(143, 100.5, 14)}
    ${eye(179.5, 108.5, 22)}
  </g>
  <g transform="rotate(20 150 150)"><rect class="${c("sweep")}" x="${-SIZE * 0.9}" y="-80" width="70" height="${SIZE + 160}" fill="${u("band")}"/></g>
  ${ember(40, 290, 1.6, 0, "#bfe8a0")}${ember(96, 296, 1.2, -1.4, GOLD)}${ember(210, 292, 1.5, -2.6, "#bfe8a0")}${ember(262, 288, 1.2, -3.7, GOLD)}${ember(150, 298, 1.3, -4.3, "#bfe8a0")}
</g>
<rect x="0.75" y="0.75" width="${SIZE - 1.5}" height="${SIZE - 1.5}" rx="17.5" fill="none" stroke="${GOLD}" stroke-opacity="0.45" stroke-width="1.5"/>
</g>`;

  return { style, body, w: SIZE * scale, h: SIZE * scale, tip: [SIZE * scale, SIZE * 0.5 * scale] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = avatar(1);
  await write(
    "assets/avatar-king.svg",
    `<svg xmlns="http://www.w3.org/2000/svg" width="${a.w}" height="${a.h}" viewBox="0 0 ${a.w} ${a.h}" role="img" aria-label="Avatar: a crowned figure in an iron mask with glowing eyes and a green cloak">
<title>Avatar</title>
<style>${a.style}
</style>
${a.body}
</svg>
`,
  );
}
