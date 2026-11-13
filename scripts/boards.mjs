// Renders the README's flip-dot boards: the name at the top, and one small
// board per section heading. Run: node scripts/boards.mjs
import { BONE, INK, LIME, disc, flipKeyframes, flipRule, reducedMotion, textCells, textCols, wall, write } from "./dots.mjs";

/**
 * A board of `cols` x `rows` discs with `text` lit in `lit`, centred.
 * `loop`: the name keeps turning over; headings turn over once and stay.
 */
function board({ text, cols, rows, pitch, lit, loop, title, cycle = 14, wave = 0.02 }) {
  const w = cols * pitch;
  const h = rows * pitch;
  const r = pitch * 0.42;
  const x0 = Math.floor((cols - textCols(text)) / 2);
  const y0 = Math.floor((rows - 7) / 2);
  const seconds = loop ? cycle : 0.32;
  const discs = textCells(text)
    .map(([c, rr]) => {
      const col = x0 + c;
      const row = y0 + rr;
      // A diagonal wave from the top-left, like the site's board on load.
      const delay = (loop ? 0.2 : 0.15) + col * wave + row * wave * 1.6;
      return disc((col + 0.5) * pitch, (row + 0.5) * pitch, r, lit, "f", delay);
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">
  <title>${title}</title>
  <style>
    ${flipKeyframes("k", lit, !loop)}
    ${flipRule("f", "k", seconds, !loop)}
    ${reducedMotion(".f")}
  </style>
  <defs>${wall("w", pitch, r)}</defs>
  <rect width="${w}" height="${h}" rx="${pitch}" fill="${INK}"/>
  <rect width="${w}" height="${h}" rx="${pitch}" fill="url(#w)"/>
  ${discs}
</svg>
`;
}

await write(
  "assets/hero.svg",
  board({ text: "DHANANJAY AGRAWAL", cols: 110, rows: 15, pitch: 8, lit: LIME, loop: true, title: "Dhananjay Agrawal" }),
);

// Each heading lights in one project's colour, the way the site's board takes
// the colour of whatever is on screen.
const HEADINGS = [["WORK", "#f08a45"], ["STACK", "#5aa9ff"], ["ACTIVITY", LIME], ["CONTACT", "#ef7fb0"]];
for (const [word, tone] of HEADINGS) {
  await write(
    `assets/h-${word.toLowerCase()}.svg`,
    board({ text: word, cols: textCols(word) + 6, rows: 11, pitch: 5, lit: tone, loop: false, title: word[0] + word.slice(1).toLowerCase(), wave: 0.012 }),
  );
}

// One lit disc per project, in that project's colour, for the work table.
export const TONES = {
  physics: "#5aa9ff",
  coaching: "#f08a45",
  attendance: "#8b7cf6",
  arogyani: "#35d6c0",
  sheredarbar: "#f0a030",
  inkplay: LIME,
  films: "#ef7fb0",
};
for (const [key, tone] of Object.entries(TONES)) {
  await write(
    `assets/dot-${key}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="5.5" fill="${tone}"/></svg>\n`,
  );
}
