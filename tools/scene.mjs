// Builds the animated profile artwork from Kenney's "Pixel Platformer" pack (CC0, assets/kenney) plus the
// bitmap font in pixel.mjs. Every scene is composed at its logical resolution and enlarged 4x with
// nearest-neighbour scaling, so the pixels stay crisp. Run: node tools/scene.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { paintCells, pixelText, svgDoc, textWidth } from "./pixel.mjs";
import { HERO, prepareHero, renderHero } from "./hero.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kenney = (name) => path.join(root, "assets", "kenney", name);

const SCALE = 4;
const W = 207; // logical width: 207 * 4 = 828 px, the width of the README column
const TILE = 18;

// ---------------------------------------------------------------------------------------------
// Pack access

const tileSheet = sharp(kenney("tilemap_packed.png"));
const charSheet = sharp(kenney("tilemap-characters_packed.png"));
const bgSheet = sharp(kenney("tilemap-backgrounds_packed.png"));

const crop = (sheet, left, top, width, height) =>
  sheet.clone().extract({ left, top, width, height }).png().toBuffer();
/** Tile number n of the 20-column, 18 px tile sheet (see the numbers in the pack's own preview). */
const tile = (n) => crop(tileSheet, (n % 20) * TILE, Math.floor(n / 20) * TILE, TILE, TILE);
/** Character sprite (24 px) at column c, row r. */
const sprite = (c, r) => crop(charSheet, c * 24, r * 24, 24, 24);
/** The three background themes: pale (0..95), sunset (96..143) and green (144..191); all 72 px tall. */
const BACKGROUNDS = { pale: [0, 96], sunset: [96, 48], green: [144, 48] };
const background = (name) => crop(bgSheet, BACKGROUNDS[name][0], 0, BACKGROUNDS[name][1], 72);

const T = {
  grassLeft: 0, grass: [1, 2], dirt: [120, 121, 122, 123], sandTop: [41, 42], sand: [140, 141, 142, 143],
  pine: 126, cactus: 127, mushroom: 128, sprout: [124, 125], signRight: 88, signBoard: 86, coin: 151, bar: 172,
  flag: 111, heart: 44, diamond: 67, key: 27, lamp: 129, bush: 17,
};

// ---------------------------------------------------------------------------------------------
// Layers

async function tiled(widthPx, make, y) {
  const parts = [];
  for (let x = 0, i = 0; x < widthPx; x += TILE, i += 1) parts.push({ input: await make(i), left: x, top: y });
  return parts;
}

/** A transparent strip of ground (grass + dirt) with props standing on it. `props` are [tile, x, lift]. */
async function groundStrip({ width, height, top, grass, dirt, props, dirtRows = 1 }) {
  const layers = [];
  layers.push(...(await tiled(width, (i) => tile(grass[i % grass.length]), top)));
  for (let row = 1; row <= dirtRows; row += 1) {
    layers.push(...(await tiled(width, (i) => tile(dirt[(i + row) % dirt.length]), top + row * TILE)));
  }
  for (const [n, x, lift = 0] of props) {
    layers.push({ input: await tile(n), left: x, top: top + 3 - TILE + lift });
  }
  return sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(layers)
    .png()
    .toBuffer();
}

/** Props repeat every `period` pixels so the strip can scroll without a seam. */
const repeatProps = (props, period, copies) =>
  Array.from({ length: copies }, (_, k) => props.map(([n, x, lift]) => [n, x + k * period, lift])).flat();

const svgLayer = async (width, height, body) =>
  sharp(Buffer.from(svgDoc(width, height, "layer", body)), { density: 72 }).png().toBuffer();

const plate = (x, y, w, h) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1f2a44" opacity=".78"/>` +
  `<rect x="${x}" y="${y}" width="${w}" height="1" fill="#ffffff" opacity=".35"/>`;

async function assemble(frames, delay, out, label) {
  const enlarged = [];
  for (const frame of frames) {
    const meta = await sharp(frame).metadata();
    enlarged.push(await sharp(frame).resize(meta.width * SCALE, meta.height * SCALE, { kernel: "nearest" }).png().toBuffer());
  }
  const buffer = await sharp(enlarged, { join: { animated: true } })
    .gif({ delay, loop: 0, effort: 10, dither: 0, colours: 128, interFrameMaxError: 0 })
    .toBuffer();
  fs.writeFileSync(path.join(root, out), buffer);
  console.log(out, `${(buffer.length / 1024).toFixed(0)} KB`, label ?? "");
}

// ---------------------------------------------------------------------------------------------
// Header: the title screen

async function header() {
  const layers = await prepareHero({ tile, sprite, background, groundStrip, repeatProps, T, TILE });
  const frames = await renderHero(layers, { subtitle: "WEB DEVELOPER & AI AUTOMATION" });
  await assemble(frames, 90, "pixel-header.gif", `${frames.length} frames`);
  return frames[0];
}

// ---------------------------------------------------------------------------------------------
// Footer: sunset

async function footer() {
  const H = 56;
  const GROUND = 38;
  const PERIOD = 144;
  const STEP = 6;
  const FRAMES = 24;

  const bg = await crop(bgSheet, BACKGROUNDS.sunset[0], 16, 48, 56); // the lower 56 rows of the sunset theme
  const base = await sharp({ create: { width: W, height: H, channels: 4, background: "#fcc97b" } }).png().toBuffer();
  const bgComposite = [];
  for (let x = 0; x < W; x += 48) bgComposite.push({ input: bg, left: x, top: 0 });

  const props = repeatProps(
    [
      [T.cactus, 20, 0],
      [T.sprout[0], 52, 0],
      [T.signBoard, 84, 0],
      [T.cactus, 112, 0],
    ],
    PERIOD,
    3
  );
  const strip = await groundStrip({
    width: PERIOD + W + TILE * 2,
    height: H,
    top: GROUND,
    grass: T.sandTop,
    dirt: T.sand,
    props,
    dirtRows: 0,
  });
  const message = "TERIMA KASIH SUDAH MAMPIR";
  const mx = Math.round((W - textWidth(message, 1)) / 2);
  const ui = await svgLayer(W, H, plate(mx - 6, 6, textWidth(message, 1) + 12, 13) + pixelText(message, mx, 9, 1, "#ffffff", "#0b1424", 1));
  const runnerFrames = [await sprite(0, 0), await sprite(1, 0)];

  const frames = [];
  for (let i = 0; i < FRAMES; i += 1) {
    const offset = (i * STEP) % PERIOD;
    const groundCrop = await sharp(strip).extract({ left: offset, top: 0, width: W, height: H }).png().toBuffer();
    const step = Math.floor(i / 3) % 2;
    frames.push(
      await sharp(base)
        .composite([
          ...bgComposite,
          { input: groundCrop, left: 0, top: 0 },
          { input: runnerFrames[step], left: 150, top: GROUND + 3 - 24 + (step ? -1 : 0) },
          { input: ui, left: 0, top: 0 },
        ])
        .png()
        .toBuffer()
    );
  }
  await assemble(frames, 80, "pixel-footer.gif", "footer");
  return frames[0];
}

// ---------------------------------------------------------------------------------------------
// Divider: a short stretch of ground with coins (static)

async function divider() {
  const H = 40;
  const props = [
    [T.pine, 10, 0],
    [T.coin, 52, -6],
    [T.mushroom, 80, 0],
    [T.coin, 100, -6],
    [T.sprout[0], 120, 0],
    [T.coin, 148, -6],
    [T.pine, 176, 0],
  ];
  const strip = await groundStrip({ width: W, height: H, top: H - 18, grass: T.grass, dirt: T.dirt, props, dirtRows: 0 });
  const buffer = await sharp(strip).resize(W * SCALE, H * SCALE, { kernel: "nearest" }).png().toBuffer();
  fs.writeFileSync(path.join(root, "pixel-divider.png"), buffer);
  console.log("pixel-divider.png", `${(buffer.length / 1024).toFixed(0)} KB`);
}

// ---------------------------------------------------------------------------------------------
// Skills board (static)

async function skills() {
  const columns = [
    { x: 8, icon: T.coin, title: "WEB", items: ["PHP", "LARAVEL", "TYPESCRIPT", "NODE.JS", "TAILWIND", "MYSQL", "SQLITE"] },
    { x: 74, icon: T.diamond, title: "DATA+AI", items: ["PYTHON", "TENSORFLOW", "OPENAI API", "LLM APPS", "PROMPTS", "EVALS"] },
    { x: 140, icon: T.key, title: "TOOLS", items: ["GIT", "GITHUB", "TESTING", "CI", "SECURITY", "TELEGRAM"] },
  ];
  const H = 96;
  const border = (w, h) =>
    `<rect width="${w}" height="${h}" fill="#6f3e43"/><rect x="2" y="2" width="${w - 4}" height="${h - 4}" fill="#cb815e"/>` +
    `<rect x="4" y="4" width="${w - 8}" height="${h - 8}" fill="#fbe7c6"/>`;
  const text = columns
    .map((col) => {
      const head = pixelText(col.title, col.x + 22, 9, 1, "#b04a14");
      const underline = `<rect x="${col.x}" y="22" width="60" height="1" fill="#b04a14"/>`;
      const lines = col.items.map((item, i) => pixelText(item, col.x + 2, 27 + i * 9, 1, "#3a2410")).join("");
      return head + underline + lines;
    })
    .join("");
  const board = await svgLayer(W, H, border(W, H) + text);
  const icons = [];
  for (const col of columns) icons.push({ input: await tile(col.icon), left: col.x, top: 4 });
  const composed = await sharp(board).composite(icons).png().toBuffer();
  const buffer = await sharp(composed).resize(W * SCALE, H * SCALE, { kernel: "nearest" }).png().toBuffer();
  fs.writeFileSync(path.join(root, "pixel-stack.png"), buffer);
  console.log("pixel-stack.png", `${(buffer.length / 1024).toFixed(0)} KB`);
}

const firstHeader = await header();
const firstFooter = await footer();
await divider();
await skills();
if (process.argv[2]) {
  // node tools/scene.mjs <folder>: also save the first frame of each animation there, to look at it.
  fs.mkdirSync(process.argv[2], { recursive: true });
  await sharp(firstHeader).resize(W * SCALE, HERO.H * SCALE, { kernel: "nearest" }).png().toFile(path.join(process.argv[2], "header.png"));
  await sharp(firstFooter).resize(W * SCALE, 56 * SCALE, { kernel: "nearest" }).png().toFile(path.join(process.argv[2], "footer.png"));
}
