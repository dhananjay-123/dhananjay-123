// Writes README.md. Copy is kept short on purpose: one line per thing.
// Logos are in their brand colours. A brand whose own colour is too dark to read
// on GitHub's dark theme is bone there and ink on the light theme, as on the site.
// Run: node scripts/readme.mjs
import { writeFileSync } from "node:fs";

/** Bump when an image changes, so GitHub's image cache lets go of the old one. */
const V = 10;
const DARK = new Set(["nextdotjs", "radixui", "threedotjs", "webgl", "ffmpeg", "express", "socketdotio", "prisma", "razorpay", "expo", "vercel", "framer"]);
const icon = (slug, hex) => `https://cdn.simpleicons.org/${slug}${hex ? `/${hex}` : ""}`;
const logo = ([name, slug]) =>
  DARK.has(slug)
    ? `<picture><source media="(prefers-color-scheme: dark)" srcset="${icon(slug, "ece6da")}"><img alt="${name}" title="${name}" width="24" height="24" src="${icon(slug, "0b0a09")}"></picture>`
    : `<img alt="${name}" title="${name}" width="24" height="24" src="${icon(slug)}">`;

const STACK = [
  ["Interface", [["TypeScript", "typescript"], ["React", "react"], ["Next.js", "nextdotjs"], ["Tailwind CSS", "tailwindcss"], ["Radix UI", "radixui"]]],
  ["Motion and 3D", [["Three.js", "threedotjs"], ["WebGL", "webgl"], ["GSAP", "greensock"], ["Motion", "framer"], ["FFmpeg", "ffmpeg"]]],
  ["Server and data", [["Node.js", "nodedotjs"], ["Express", "express"], ["Socket.IO", "socketdotio"], ["Zod", "zod"], ["PostgreSQL", "postgresql"], ["Prisma", "prisma"], ["Supabase", "supabase"], ["Redis", "redis"]]],
  ["Beyond the browser", [["WhatsApp", "whatsapp"], ["Razorpay", "razorpay"], ["Flutter", "flutter"], ["Expo", "expo"], ["Gemini", "googlegemini"]]],
  ["Shipping", [["Git", "git"], ["GitHub Actions", "githubactions"], ["Vitest", "vitest"], ["Docker", "docker"], ["Vercel", "vercel"], ["Cloudflare", "cloudflare"]]],
];

// [name, link, line, disc] — the disc is the project's own colour, from boards.mjs.
const WORK = [
  ["PhysicsSimulation", "https://physicssimulation.org", "160 browser labs in physics, chemistry, maths and biology.", "physics"],
  ["Coaching Platform", null, "Enquiries, batches, attendance, fees and tests for a coaching institute.", "coaching"],
  ["Smart Attendance", null, "Biometric attendance with WhatsApp alerts to parents.", "attendance"],
  ["Arogyani", "https://www.arogyani.in/", "OPD software for clinics with a live token queue.", "arogyani"],
  ["Sher-e-Darbar", "https://www.sheredarbar.com/", "Hindi and English restaurant site with a scroll-driven 3D opening.", "sheredarbar"],
  ["INKPLAY", "https://inkplay-lemon.vercel.app", "Draw a level on paper, play it as a platformer.", "inkplay"],
  ["Films", null, "Launch reels and explainers rendered from code with HyperFrames.", "films"],
];

const heading = (word) => `<img src="assets/h-${word.toLowerCase()}.svg?v=${V}" alt="${word}" height="32">`;

const md = `<img src="assets/hero.svg?v=${V}" alt="Dhananjay Agrawal" width="100%">

<img src="assets/avatar.svg?v=${V}" alt="Avatar" align="left" width="190">

&nbsp;

**Dhananjay Agrawal**

I build web products, simulations and motion: institution software, virtual labs and films made in code.

Integrated B.Tech + M.Tech in IT at ABV-IIITM Gwalior.

[dhananjaypvt.me](https://dhananjaypvt.me) &nbsp; [LinkedIn](https://linkedin.com/in/dhananjay-agrawal-b5843b211) &nbsp; [dhananjayworkmain@gmail.com](mailto:dhananjayworkmain@gmail.com)

<br clear="left">

<br>

${heading("Work")}

| Project | |
| --- | --- |
${WORK.map(([name, href, what, dot]) => `| <img src="assets/dot-${dot}.svg?v=${V}" width="10" alt=""> **${href ? `[${name}](${href})` : name}** | ${what} |`).join("\n")}

<sub>Most of this ships from private repositories.</sub>

<br>

${heading("Stack")}

<table>
${STACK.map(([group, items]) => `<tr><td width="200"><b>${group}</b></td><td width="680">${items.map(logo).join("&nbsp;&nbsp;&nbsp;")}</td></tr>`).join("\n")}
</table>

<br>

${heading("Activity")}

<img src="assets/contributions.svg?v=${V}" alt="GitHub contribution calendar" width="100%">

<br>

${heading("Contact")}

Open to full-time roles and freelance work.<br>
**[dhananjayworkmain@gmail.com](mailto:dhananjayworkmain@gmail.com)**
`;

writeFileSync("README.md", md);
console.log("README.md written");
