// Builds the profile artwork: node tools/mech-scenes.mjs [previewFolder]
// Every scene is composed at its logical size and enlarged with nearest-neighbour scaling.
// ONLY=header|about|skills|missions|chrome|footer builds just that group.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gif } from "./fb.mjs";
import { HEADER, headerBase, renderHeaderFrame } from "./mech-header.mjs";
import { PILOT, pilotFrame } from "./pilot.mjs";
import { SKILLS, skillsFrame } from "./skills.mjs";
import { CARD, PROJECTS, cardFrame } from "./missions.mjs";
import { BANNER, BUTTON, COLOURS, bannerFrame, buttonFrame } from "./ui.mjs";
import { FOOTER, footerFrame } from "./footer.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const preview = process.argv[2];
if (preview) fs.mkdirSync(preview, { recursive: true });
const only = process.env.ONLY;
const want = (group) => !only || only === group;
const make = (n, fn) => Array.from({ length: n }, (_, f) => fn(f));

async function save(name, frames, { scale, delay, colours = 64, look = [] }) {
  const pngs = [];
  for (const fb of frames) pngs.push(await fb.png(scale));
  const still = frames.length === 1;
  const buffer = still ? pngs[0] : await gif(pngs, delay, colours);
  fs.writeFileSync(path.join(root, "art", name), buffer);
  console.log(name, `${(buffer.length / 1024).toFixed(0)} KB`, `${frames.length} frames`);
  if (preview) for (const i of look) fs.writeFileSync(path.join(preview, `${name}-${i}.png`), pngs[i]);
}

fs.mkdirSync(path.join(root, "art"), { recursive: true });

if (want("header")) {
  const base = headerBase();
  await save("header.gif", make(HEADER.FRAMES, (f) => renderHeaderFrame(base, f)), { scale: 4, delay: HEADER.DELAY, colours: 128, look: [0, 21] });
}
if (want("about")) {
  await save("pilot.gif", make(PILOT.FRAMES, pilotFrame), { scale: 3, delay: PILOT.DELAY, look: [0, 20, 50] });
}
if (want("skills")) {
  await save("skills.png", [skillsFrame(0, true)], { scale: 2, delay: 0 });
}
if (want("missions")) {
  for (const project of PROJECTS) {
    await save(`mission-${project.id}.png`, [cardFrame(project, 0, true)], { scale: 3, delay: 0 });
  }
}
if (want("chrome")) {
  for (const [file, label] of [["pilot", "PILOT PROFILE"], ["loadout", "LOADOUT"], ["missions", "MISSIONS"]]) {
    await save(`banner-${file}.png`, [bannerFrame(label, 0, true)], { scale: 3, delay: 0 });
  }
  for (const [file, label, icon, colour] of [
    ["portfolio", "PORTFOLIO", "globe", COLOURS.gold],
    ["linkedin", "LINKEDIN", "link", COLOURS.line],
    ["email", "EMAIL", "mail", COLOURS.pink],
  ]) {
    await save(`button-${file}.png`, [buttonFrame(label, icon, colour, 0, true)], { scale: 3, delay: 0 });
  }
}
if (want("footer")) {
  await save("footer.gif", make(FOOTER.FRAMES, footerFrame), { scale: 4, delay: FOOTER.DELAY, colours: 128, look: [0, 20] });
}
