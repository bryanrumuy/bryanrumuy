// Builds the profile artwork: node tools/mech-scenes.mjs [previewFolder]
// Every scene is composed at its logical size and enlarged 4x with nearest-neighbour scaling.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gif } from "./fb.mjs";
import { HEADER, headerBase, renderHeaderFrame } from "./mech-header.mjs";
import { BANNER, FOOTER, LOADOUT, bannerFrame, footerFrame, loadoutFrame } from "./mech-panels.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCALE = 4;
const preview = process.argv[2];
if (preview) fs.mkdirSync(preview, { recursive: true });

async function save(name, frames, delay, colours, previewFrames = []) {
  const pngs = [];
  for (const fb of frames) pngs.push(await fb.png(SCALE));
  const buffer = await gif(pngs, delay, colours);
  fs.writeFileSync(path.join(root, name), buffer);
  console.log(name, `${(buffer.length / 1024).toFixed(0)} KB`, `${frames.length} frames`);
  if (preview) for (const i of previewFrames) fs.writeFileSync(path.join(preview, `${name}-${i}.png`), pngs[i]);
}

const only = process.env.ONLY;
if (!only || only === "header") {
  const base = headerBase();
  const frames = Array.from({ length: HEADER.FRAMES }, (_, f) => renderHeaderFrame(base, f));
  await save("mecha-header.gif", frames, HEADER.DELAY, 128, [0, 18, 21, 26, 50]);
}

const make = (n, fn) => Array.from({ length: n }, (_, f) => fn(f));
if (!only || only === "panels") {
  await save("mecha-loadout.gif", make(LOADOUT.FRAMES, loadoutFrame), LOADOUT.DELAY, 64, [0, 9]);
  await save("mecha-footer.gif", make(FOOTER.FRAMES, footerFrame), FOOTER.DELAY, 128, [0, 20]);
  for (const [file, label] of [["about", "TENTANG SAYA"], ["skill", "SKILL"], ["project", "PROJECT"]]) {
    await save(`mecha-banner-${file}.gif`, make(BANNER.FRAMES, (f) => bannerFrame(label, f)), BANNER.DELAY, 32, [6]);
  }
}
