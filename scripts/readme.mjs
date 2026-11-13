// Writes README.md. Copy is kept short on purpose: one line per thing.
// Logos are bone on GitHub's dark theme and ink on its light one, as on the site.
// Run: node scripts/readme.mjs
import { writeFileSync } from "node:fs";

/** Bump when an image changes, so GitHub's image cache lets go of the old one. */
const V = 5;
const icon = (slug, hex) => `https://cdn.simpleicons.org/${slug}/${hex}`;
const logo = ([name, slug]) =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="${icon(slug, "ece6da")}"><img alt="${name}" title="${name}" height="24" src="${icon(slug, "0b0a09")}"></picture>`;

const STACK = [
  ["Interface", [["TypeScript", "typescript"], ["React", "react"], ["Next.js", "nextdotjs"], ["Tailwind CSS", "tailwindcss"], ["Radix UI", "radixui"]]],
  ["Motion and 3D", [["Three.js", "threedotjs"], ["WebGL", "webgl"], ["GSAP", "greensock"], ["Motion", "framer"], ["FFmpeg", "ffmpeg"]]],
  ["Server and data", [["Node.js", "nodedotjs"], ["Express", "express"], ["Socket.IO", "socketdotio"], ["Zod", "zod"], ["PostgreSQL", "postgresql"], ["Prisma", "prisma"], ["Supabase", "supabase"], ["Redis", "redis"]]],
  ["Beyond the browser", [["WhatsApp", "whatsapp"], ["Razorpay", "razorpay"], ["Flutter", "flutter"], ["Expo", "expo"], ["Gemini", "googlegemini"]]],
  ["Shipping", [["Git", "git"], ["GitHub Actions", "githubactions"], ["Vitest", "vitest"], ["Docker", "docker"], ["Vercel", "vercel"], ["Cloudflare", "cloudflare"]]],
];

const WORK = [
  ["PhysicsSimulation", "https://physicssimulation.org", "160 browser labs in physics, chemistry, maths and biology."],
  ["Coaching Platform", null, "Enquiries, batches, attendance, fees and tests for a coaching institute."],
  ["Smart Attendance", null, "Biometric attendance with WhatsApp alerts to parents."],
  ["Arogyani", "https://www.arogyani.in/", "OPD software for clinics with a live token queue."],
  ["Sher-e-Darbar", "https://www.sheredarbar.com/", "Hindi and English restaurant site with a scroll-driven 3D opening."],
  ["INKPLAY", "https://inkplay-lemon.vercel.app", "Draw a level on paper, play it as a platformer."],
  ["Films", null, "Launch reels and explainers rendered from code with HyperFrames."],
];

const heading = (word) => `<img src="assets/h-${word.toLowerCase()}.svg?v=${V}" alt="${word}" height="32">`;

const md = `<img src="assets/hero.svg?v=${V}" alt="Dhananjay Agrawal" width="100%">

**I build web products, simulations and motion.**<br>
Institution software, virtual labs and films made in code.

<sub>Integrated B.Tech + M.Tech, IT · ABV-IIITM Gwalior · Gwalior, India</sub>

[dhananjaypvt.me](https://dhananjaypvt.me) · [LinkedIn](https://linkedin.com/in/dhananjay-agrawal-b5843b211) · [Email](mailto:dhananjayworkmain@gmail.com)

<br>

${heading("Work")}

| Project | |
| --- | --- |
${WORK.map(([name, href, what]) => `| **${href ? `[${name}](${href})` : name}** | ${what} |`).join("\n")}

<sub>Most of this ships from private repositories.</sub>

<br>

${heading("Stack")}

<table>
${STACK.map(([group, items]) => `<tr><td><b>${group}</b></td><td>${items.map(logo).join("&nbsp;&nbsp;&nbsp;")}</td></tr>`).join("\n")}
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
