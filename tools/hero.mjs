// The profile's hero animation: an original ninja running through a village at dusk. He leaps over fences,
// grabs coins, and passes wooden houses, lanterns, trees and the village gate while the lanterns flicker and
// the first stars come out. The houses and fences are Kenney's CC0 "Tiny Town" tiles; the ninja, gate,
// lanterns and sky are drawn in code. The loop is exact (72 frames), so the GIF repeats without a jump.
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { paintCells, pixelText, rng, svgDoc, textWidth } from "./pixel.mjs";
import { ninjaFrames } from "./ninja.mjs";

export const HERO = { W: 207, H: 128, FRAMES: 72 };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOWN = sharp(path.join(root, "assets", "kenney-town", "tilemap_packed.png"));
const TS = 16; // tile size of the Tiny Town pack
const COLS = 12;
const townTile = (n) =>
  TOWN.clone().extract({ left: (n % COLS) * TS, top: Math.floor(n / COLS) * TS, width: TS, height: TS }).png().toBuffer();

const GROUND = 104; // y of the top of the dirt path the ninja runs on
const SPEED = 4; // px per frame the village moves
const PERIOD = 288; // 72 frames * 4 px: the village repeats exactly once per loop
const FAR_SPEED = 2; // the distant rooftops
const FAR_PERIOD = 144;
const RUNNER_X = 36;
const FENCES = [112, 256]; // world x of the two fences, 144 apart
const APEX_FRAMES = FENCES.map((x) => (x - RUNNER_X - 4) / SPEED); // frame when each fence is under the ninja
const COINS = [100, 110, 120, 244, 254, 264];
const COIN_Y = GROUND - 44;
const LANTERNS = [58, 130, 202, 274]; // world x of the hanging lanterns (centre)
const LANTERN_Y = GROUND - 30;

const SKY_BANDS = ["#2a2a5c", "#40367a", "#5d3f86", "#8a4a8c", "#b85a85", "#dd6f6e", "#f08f66", "#fbb06c", "#ffd08a"];

const range = (n) => Array.from({ length: n }, (_, i) => i);
const shift = (x, i, speed, period) => (((x - speed * i) % period) + period) % period;

// ---------------------------------------------------------------------------------------------
// Layers that never change

const svgPng = (w, h, body) => sharp(Buffer.from(svgDoc(w, h, "layer", body)), { density: 72 }).png().toBuffer();

async function sky() {
  const bandH = Math.ceil(GROUND / SKY_BANDS.length);
  const body = SKY_BANDS.map((c, k) => `<rect x="0" y="${k * bandH}" width="${HERO.W}" height="${bandH + 1}" fill="${c}"/>`).join("");
  // A low half-sun on the horizon, behind everything
  return svgPng(HERO.W, HERO.H, body + `<rect x="0" y="${GROUND}" width="${HERO.W}" height="${HERO.H - GROUND}" fill="#3a2a2e"/>`);
}

/** Dark hills and distant roofs that drift slowly behind the village. One tile of FAR_PERIOD width. */
async function farLayer() {
  const h = 46;
  const cells = [];
  // rolling hills (a stepped sine) and a few tiny roofs on them
  for (let x = 0; x < FAR_PERIOD; x += 1) {
    const top = Math.round(18 + 8 * Math.sin((x / FAR_PERIOD) * Math.PI * 4) + 4 * Math.sin((x / FAR_PERIOD) * Math.PI * 10));
    for (let y = top; y < h; y += 1) cells.push([x, y]);
  }
  const roofs = [];
  [14, 62, 108].forEach((x0) => {
    const base = Math.round(18 + 8 * Math.sin((x0 / FAR_PERIOD) * Math.PI * 4) + 4 * Math.sin((x0 / FAR_PERIOD) * Math.PI * 10)) + 1;
    for (let r = 0; r < 4; r += 1) for (let x = r; x < 12 - r; x += 1) roofs.push([x0 + x, base - 8 + r]);
    for (let y = base - 4; y < base; y += 1) for (let x = 1; x < 11; x += 1) roofs.push([x0 + x, y]);
  });
  const body = paintCells({ "#4a3366": cells }, 1) + paintCells({ "#3a2858": roofs }, 1);
  return svgPng(FAR_PERIOD, h, body);
}

/** A Japanese-inspired village gate (generic shape, drawn in code), 44 px wide. */
function gateSvg() {
  const post = (x) => `<rect x="${x}" y="8" width="4" height="40" fill="#b3402e"/><rect x="${x}" y="8" width="1" height="40" fill="#d9644a"/>`;
  return (
    post(6) + post(34) +
    `<rect x="0" y="2" width="44" height="4" fill="#7c2a22"/><rect x="2" y="0" width="40" height="2" fill="#7c2a22"/>` +
    `<rect x="4" y="12" width="36" height="3" fill="#b3402e"/>` +
    `<rect x="19" y="6" width="6" height="6" fill="#7c2a22"/>`
  );
}

async function village({ ninja }) {
  const wall = [72, 73, 75]; // wooden wall
  const roof = [52, 53, 54]; // red tiles
  const parts = [];
  const house = (x, win) => {
    // x is the left edge, three tiles wide: wall row then roof row, standing on the lawn
    const base = GROUND - 12;
    for (let k = 0; k < 3; k += 1) {
      parts.push({ n: roof[k], left: x + k * TS, top: base - 2 * TS });
      parts.push({ n: k === 1 ? 86 : win ? 84 : wall[k], left: x + k * TS, top: base - TS });
    }
  };
  const tree = (n, x) => parts.push({ n, left: x, top: GROUND - 12 - TS });
  const lawn = (x, w) => {
    for (let px = x; px < x + w; px += TS) parts.push({ n: (px / TS) % 3 === 0 ? 0 : 1, left: px, top: GROUND - 16 });
  };

  const items = [
    () => house(8, true),
    () => tree(16, 66),
    () => tree(28, 84),
    () => house(150, false),
    () => tree(15, 204),
    () => tree(4, 228),
  ];
  items.forEach((fn) => fn());

  const strip = await sharp({ create: { width: PERIOD, height: HERO.H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
  const layers = [];
  // lawn across the whole period
  for (let x = 0; x < PERIOD; x += TS) layers.push({ input: await townTile((x / TS) % 4 === 1 ? 2 : (x / TS) % 3 === 0 ? 1 : 0), left: x, top: GROUND - 16 });
  for (const p of parts.filter((q) => q.top !== GROUND - 16)) layers.push({ input: await townTile(p.n), left: p.left, top: p.top });
  // the village gate between the two houses
  layers.push({ input: await svgPng(44, 48, gateSvg()), left: 100 - 22 + 0, top: GROUND - 12 - 48 });
  // the dirt path
  for (let x = 0; x < PERIOD; x += TS) {
    layers.push({ input: await townTile([39, 40, 41, 40][(x / TS) % 4]), left: x, top: GROUND });
    layers.push({ input: await townTile(25), left: x, top: GROUND + TS });
  }
  const villageStrip = await sharp(strip).composite(layers).png().toBuffer();
  // twice the width so a window of any offset is one extract
  const doubled = await sharp({ create: { width: PERIOD * 2, height: HERO.H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: villageStrip, left: 0, top: 0 }, { input: villageStrip, left: PERIOD, top: 0 }])
    .png()
    .toBuffer();
  void ninja;
  return doubled;
}

/** The cached layers that do not change from frame to frame. */
export async function prepareHero() {
  const ninja = await ninjaFrames();
  const fences = await Promise.all([44, 46].map(townTile));
  return {
    sky: await sky(),
    far: await farLayer(),
    village: await village({ ninja }),
    ninja,
    fence: fences,
    coin: await townTile(93),
  };
}

// ---------------------------------------------------------------------------------------------
// Frames

const CLOUD = ["..wwww..........", ".wwwwwwwwww.....", "wwwwwwwwwwwwwww.", "sssssssssssssss."];
const cloudSvg = (rows) =>
  rows
    .map((row, y) => [...row].map((ch, x) => (ch === "." ? "" : `<rect x="${x}" y="${y}" width="1" height="1" fill="${ch === "w" ? "#f8c9b8" : "#e29aa0"}"/>`)).join(""))
    .join("");

const disc = (r) => {
  const cells = [];
  for (let y = -r; y <= r; y += 1) for (let x = -r; x <= r; x += 1) if (x * x + y * y <= r * r + r * 0.8) cells.push([x + r, y + r]);
  return cells;
};
const MOON = paintCells({ "#fff3c4": disc(5) }, 1) + paintCells({ "#e6d9a0": [[3, 4], [4, 4], [4, 5], [7, 3], [7, 7], [8, 7]] }, 1);

const collectedAt = (x) => Math.floor((x - 44) / SPEED) + 1;

/** Builds the frames of the loop as logical-size PNG buffers. */
export async function renderHero(layers, { subtitle }) {
  const { W, H, FRAMES } = HERO;
  const random = rng(11);
  const stars = Array.from({ length: 30 }, () => ({ x: Math.floor(random() * W), y: 1 + Math.floor(random() * 40), phase: Math.floor(random() * 6) }));
  const flies = range(8).map((k) => ({ x: 14 + k * 26, y: GROUND - 10 - (k % 3) * 8, phase: k * 11 }));

  const title = pixelText("BRYAN RUMUY", Math.round((W - textWidth("BRYAN RUMUY", 2)) / 2), 24, 2, "#ffb43a", "#3d1d08", 1);
  const subX = Math.round((W - textWidth(subtitle, 1)) / 2);
  const plate = (x, y, w, h) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1c1636" opacity=".8"/><rect x="${x}" y="${y}" width="${w}" height="1" fill="#ffffff" opacity=".35"/>`;
  const staticUi =
    plate(subX - 6, 44, textWidth(subtitle, 1) + 12, 13) +
    pixelText(subtitle, subX, 47, 1, "#ffffff", "#0b0818", 1) +
    plate(122, 62, 80, 27) +
    pixelText("PROJECTS", 136, 66, 1, "#ffffff", "#0b0818", 1) +
    pixelText("SKILLS", 136, 75, 1, "#ffd9b0", "#0b0818", 1) +
    pixelText("CONTACT", 136, 84, 1, "#ffd9b0", "#0b0818", 1) +
    title;
  const staticUiPng = await svgPng(W, H, staticUi);
  const moonPng = await svgPng(W, H, `<g transform="translate(8 6)">${MOON}</g>`);

  const frames = [];
  for (let i = 0; i < FRAMES; i += 1) {
    // distant rooftops, 2 px per frame; they sit on the horizon
    const farShift = (FAR_SPEED * i) % FAR_PERIOD;
    const far = await sharp(layers.far).extract({ left: 0, top: 0, width: FAR_PERIOD, height: 46 }).png().toBuffer();
    const farParts = [];
    for (let x = -farShift; x < W; x += FAR_PERIOD) farParts.push({ input: far, left: x, top: GROUND - 16 - 46 + 6 });

    const clouds = [[30, 20], [40, 110], [34, 190]].map(([y, x0]) => {
      const x = ((x0 + 3 * i) % 216) - 20;
      return `<g transform="translate(${x} ${y})">${cloudSvg(CLOUD)}</g>`;
    });
    const stuff = [];
    stars.forEach((s, k) => {
      if ((i + s.phase + k) % 6 < 4) stuff.push(`<rect x="${s.x}" y="${s.y}" width="1" height="1" fill="#ffffff" opacity=".85"/>`);
    });
    const skyPng = await svgPng(W, H, stuff.join("") + clouds.join(""));

    const villageCrop = await sharp(layers.village).extract({ left: (SPEED * i) % PERIOD, top: 0, width: W, height: H }).png().toBuffer();

    // lanterns: a warm glow that flickers, drawn above the village in screen space
    const lanternBits = LANTERNS.map((wx, k) => {
      const x = shift(wx, i, SPEED, PERIOD);
      if (x < -10 || x > W + 10) return "";
      const flick = (i + k * 3) % 6 < 3 ? 0.34 : 0.22;
      return (
        `<rect x="${x - 9}" y="${LANTERN_Y - 8}" width="19" height="19" fill="#ffb347" opacity="${(flick * 0.55).toFixed(2)}"/>` +
        `<rect x="${x - 6}" y="${LANTERN_Y - 5}" width="13" height="13" fill="#ffb347" opacity="${flick.toFixed(2)}"/>` +
        `<rect x="${x}" y="${LANTERN_Y - 12}" width="1" height="8" fill="#3a1a14"/>` +
        `<rect x="${x - 3}" y="${LANTERN_Y - 4}" width="7" height="9" fill="#d6362e"/><rect x="${x - 2}" y="${LANTERN_Y - 3}" width="5" height="7" fill="#ffd36b"/>` +
        `<rect x="${x - 3}" y="${LANTERN_Y - 4}" width="7" height="1" fill="#3a1a14"/><rect x="${x - 3}" y="${LANTERN_Y + 4}" width="7" height="1" fill="#3a1a14"/>`
      );
    }).join("");
    const glowBits = flies.map((f) => {
      const x = Math.round(f.x + 6 * Math.sin((i + f.phase) / 5));
      const y = Math.round(f.y + 4 * Math.sin((i + f.phase) / 3));
      return `<rect x="${x}" y="${y}" width="1" height="1" fill="#fff27a" opacity=".95"/><rect x="${x - 1}" y="${y}" width="3" height="1" fill="#fff27a" opacity=".3"/>`;
    }).join("");

    // fences (obstacles) and coins
    const fenceParts = FENCES.flatMap((x) => {
      const sx = shift(x, i, SPEED, PERIOD);
      return [sx, sx - PERIOD].filter((v) => v > -2 * TS && v < W).flatMap((v) => [
        { input: layers.fence[0], left: v, top: GROUND - TS + 2 },
        { input: layers.fence[1], left: v + TS, top: GROUND - TS + 2 },
      ]);
    });
    const coinParts = [];
    let collected = 0;
    COINS.forEach((x) => {
      const sx = shift(x, i, SPEED, PERIOD);
      if (i >= collectedAt(x)) collected += 1;
      if (sx >= 44 && sx < W + 9) coinParts.push({ input: layers.coin, left: sx - 9, top: COIN_Y - Math.round(2 * Math.sin((i + x) / 3)) });
    });

    // the ninja: legs alternate every 3 frames, a jump over each fence
    const step = Math.floor(i / 3) % 4;
    let lift = 0;
    let airborne = false;
    for (const apex of APEX_FRAMES) {
      const d = i - apex;
      if (Math.abs(d) <= 7) {
        lift = Math.max(lift, Math.round(22 * (1 - (d / 7) ** 2)));
        airborne = true;
      }
    }
    const bob = !airborne && step % 2 === 1 ? -1 : 0;
    const ninjaTop = GROUND + 2 - 22 - lift + bob;

    const hud = pixelText(`${collected}`, 190, 8, 2, "#ffffff", "#0b0818", 1) + pixelText("COINS", 148, 11, 1, "#ffd36b", "#0b0818", 1);
    const cursor = Math.floor(i / 6) % 2 === 0 ? pixelText(">", 127, 66, 1, "#ffcc33", "#0b0818", 1) : "";
    const dynamicUi = await svgPng(W, H, hud + cursor);
    const lanternPng = await svgPng(W, H, lanternBits + glowBits);

    frames.push(
      await sharp(layers.sky)
        .composite([
          { input: skyPng, left: 0, top: 0 },
          { input: moonPng, left: 0, top: 0 },
          ...farParts,
          { input: villageCrop, left: 0, top: 0 },
          { input: lanternPng, left: 0, top: 0 },
          ...fenceParts,
          ...coinParts,
          { input: airborne ? layers.ninja.jump : layers.ninja.run[step], left: RUNNER_X, top: ninjaTop },
          { input: staticUiPng, left: 0, top: 0 },
          { input: dynamicUi, left: 0, top: 0 },
        ])
        .png()
        .toBuffer()
    );
  }
  return frames;
}
