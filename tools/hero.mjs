// The profile's hero animation: a runner on a platformer course that jumps over spikes, collects coins and
// runs through a full day (sunrise, noon, dusk, night with stars and fireflies) in one 6.5 second loop.
// Everything is drawn from Kenney's CC0 "Pixel Platformer" tiles plus the bitmap font; the loop is exact,
// so the GIF repeats without a jump.
import sharp from "sharp";
import { paintCells, pixelText, rng, svgDoc, textWidth } from "./pixel.mjs";

export const HERO = { W: 207, H: 128, FRAMES: 72 };

const GROUND = 104; // y of the top of the grass row
const BG_TOP = GROUND - 72; // the background theme is 72 px tall and sits on the ground
const SPEED = 4; // px per frame the ground moves
const PERIOD = 288; // 72 frames * 4 px: the ground repeats exactly once per loop
const RUNNER_X = 32;
const SPIKES = [108, 252]; // world x of the two obstacles (144 apart)
const APEX_FRAMES = SPIKES.map((x) => (x - 36) / SPEED); // the frame each obstacle is under the runner: 18 and 54

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Colour and strength of the light over the scene at time t (0..1 across the loop). */
function tint(t) {
  const keys = [
    { t: 0, c: [255, 160, 190], a: 0.16 }, // dawn
    { t: 0.1, c: [255, 220, 180], a: 0 },
    { t: 0.4, c: [255, 220, 180], a: 0 },
    { t: 0.52, c: [255, 120, 50], a: 0.3 }, // dusk
    { t: 0.64, c: [10, 16, 48], a: 0.58 }, // night
    { t: 0.84, c: [10, 16, 48], a: 0.58 },
    { t: 0.94, c: [255, 140, 170], a: 0.24 },
    { t: 1, c: [255, 160, 190], a: 0.16 },
  ];
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1].t) i += 1;
  const k = clamp01((t - keys[i].t) / (keys[i + 1].t - keys[i].t));
  const c = keys[i].c.map((v, n) => Math.round(lerp(v, keys[i + 1].c[n], k)));
  return { r: c[0], g: c[1], b: c[2], alpha: lerp(keys[i].a, keys[i + 1].a, k) };
}

/** 0 in daylight, 1 in full night. */
function nightness(t) {
  if (t < 0.5 || t > 0.97) return 0;
  if (t < 0.64) return (t - 0.5) / 0.14;
  if (t < 0.84) return 1;
  return 1 - (t - 0.84) / 0.13;
}

const disc = (r) => {
  const cells = [];
  for (let y = -r; y <= r; y += 1) for (let x = -r; x <= r; x += 1) if (x * x + y * y <= r * r + r * 0.8) cells.push([x + r, y + r]);
  return cells;
};
const SUN = paintCells({ "#fff3a0": disc(6) }, 1, 0, 0);
const SUN_CORE = paintCells({ "#ffe14d": disc(4).map(([x, y]) => [x + 2, y + 2]) }, 1, 0, 0);
const MOON = paintCells({ "#f4f1d6": disc(5) }, 1, 0, 0) + paintCells({ "#d8d4b0": [[3, 4], [4, 4], [4, 5], [7, 3], [7, 7], [8, 7]] }, 1, 0, 0);

const CLOUD_GRIDS = [
  ["..wwww..........", ".wwwwwwwwww.....", "wwwwwwwwwwwwwww.", "sssssssssssssss."],
  ["....www....", ".wwwwwwwww.", "wwwwwwwwwww", "sssssssssss"],
];
const cloudSvg = (rows) =>
  rows
    .map((row, y) => [...row].map((ch, x) => (ch === "." ? "" : `<rect x="${x}" y="${y}" width="1" height="1" fill="${ch === "w" ? "#ffffff" : "#cfeaf8"}"/>`)).join(""))
    .join("");

/** The cached layers that do not change from frame to frame. */
export async function prepareHero({ tile, sprite, background, groundStrip, repeatProps, T, TILE }) {
  const bg = await background("green");
  const props = repeatProps(
    [
      [T.pine, 14, 0],
      [T.sprout[0], 40, 0],
      [T.signRight, 62, 0],
      ...SPIKES.map((x) => [68, x, 0]),
      [T.mushroom, 170, 0],
      [T.sprout[1], 200, 0],
      [T.pine, 232, 0],
      [T.flag, 270, 0],
    ],
    PERIOD,
    3
  );
  const strip = await groundStrip({
    width: PERIOD + HERO.W + TILE * 3,
    height: HERO.H - 40,
    top: GROUND - 40,
    grass: T.grass,
    dirt: T.dirt,
    props,
    dirtRows: 1,
  });
  const clouds = await Promise.all(
    CLOUD_GRIDS.map(async (rows) =>
      sharp(Buffer.from(svgDoc(rows[0].length, rows.length, "cloud", cloudSvg(rows))), { density: 72 }).png().toBuffer()
    )
  );
  return {
    bg,
    strip,
    clouds,
    coin: await tile(T.coin),
    heart: await tile(T.heart),
    runner: [await sprite(6, 0), await sprite(7, 0)],
    sky: await sharp({ create: { width: HERO.W, height: HERO.H, channels: 4, background: "#86efac" } }).png().toBuffer(),
  };
}

const COINS = [100, 110, 120, 244, 254, 264]; // world x of the six coins, three over each obstacle
const COIN_Y = GROUND - 42;

/** The first frame in which a coin has crossed the runner (screen x below 44) and counts as collected. */
const collectedAt = (x) => Math.floor((x - 44) / SPEED) + 1;

/** Builds the frames of the loop as logical-size PNG buffers. */
export async function renderHero(layers, { subtitle }) {
  const { W, H, FRAMES } = HERO;
  const random = rng(5);
  const stars = Array.from({ length: 34 }, () => ({ x: Math.floor(random() * W), y: 2 + Math.floor(random() * 60), phase: Math.floor(random() * 6) }));
  const flies = Array.from({ length: 7 }, (_, k) => ({ x: 20 + k * 28, y: GROUND - 14 - (k % 3) * 9, phase: k * 11 }));

  const title = pixelText("BRYAN RUMUY", Math.round((W - textWidth("BRYAN RUMUY", 2)) / 2), 24, 2, "#ff9a1f", "#4a2306", 1);
  const subX = Math.round((W - textWidth(subtitle, 1)) / 2);
  const plate = (x, y, w, h) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1f2a44" opacity=".8"/><rect x="${x}" y="${y}" width="${w}" height="1" fill="#ffffff" opacity=".35"/>`;
  const staticUi =
    plate(subX - 6, 44, textWidth(subtitle, 1) + 12, 13) +
    pixelText(subtitle, subX, 47, 1, "#ffffff", "#0b1424", 1) +
    plate(122, 62, 80, 27) +
    pixelText("PROJECTS", 136, 66, 1, "#ffffff", "#0b1424", 1) +
    pixelText("SKILLS", 136, 75, 1, "#cfe9ff", "#0b1424", 1) +
    pixelText("CONTACT", 136, 84, 1, "#cfe9ff", "#0b1424", 1) +
    title;
  const staticUiPng = await sharp(Buffer.from(svgDoc(W, H, "ui", staticUi)), { density: 72 }).png().toBuffer();

  const frames = [];
  for (let i = 0; i < FRAMES; i += 1) {
    const t = i / FRAMES;
    const night = nightness(t);

    // Background hills, drifting slowly (2 px per frame, an exact multiple of the 48 px tile over the loop)
    const bgShift = (2 * i) % 144;
    const parts = [];
    for (let x = -bgShift; x < W; x += 48) parts.push({ input: layers.bg, left: x, top: BG_TOP });

    // Sun by day, moon by night
    const daySun = t < 0.55 ? t / 0.55 : null;
    const nightMoon = t >= 0.5 ? (t - 0.5) / 0.5 : null;
    const skyBits = [];
    if (daySun !== null) {
      const x = Math.round(8 + 190 * daySun);
      const y = Math.round(58 - 26 * Math.sin(Math.PI * daySun));
      skyBits.push(`<g transform="translate(${x} ${y})">${SUN}<g transform="translate(0 0)">${SUN_CORE}</g></g>`);
    }
    if (nightMoon !== null) {
      const x = Math.round(8 + 190 * nightMoon);
      const y = Math.round(58 - 28 * Math.sin(Math.PI * nightMoon));
      skyBits.push(`<g transform="translate(${x} ${y})">${MOON}</g>`);
    }
    // Clouds drift right, 3 px per frame over a 216 px loop
    const cloudSvgs = [
      [0, 30, 20],
      [1, 40, 100],
      [0, 36, 170],
    ].map(([n, y, x0]) => {
      const x = ((x0 + 3 * i) % 216) - 20;
      return `<g transform="translate(${x} ${y})">${cloudSvg(CLOUD_GRIDS[n])}</g>`;
    });
    const skyPng = await sharp(Buffer.from(svgDoc(W, H, "sky", skyBits.join("") + cloudSvgs.join(""))), { density: 72 }).png().toBuffer();

    // Ground, moving 4 px per frame
    const groundCrop = await sharp(layers.strip).extract({ left: (SPEED * i) % PERIOD, top: 0, width: W, height: H - 40 }).png().toBuffer();

    // The runner: legs alternate every 3 frames, and a jump over each obstacle
    const step = Math.floor(i / 3) % 2;
    let lift = 0;
    let airborne = false;
    for (const apex of APEX_FRAMES) {
      const d = i - apex;
      if (Math.abs(d) <= 6) {
        lift = Math.max(lift, Math.round(22 * (1 - (d / 6) ** 2)));
        airborne = true;
      }
    }
    const runnerTop = GROUND + 3 - 24 - lift + (!airborne && step ? -1 : 0);

    // Coins still in the air: a coin that crossed the runner is gone until it comes round again from the right
    const coinParts = [];
    let collected = 0;
    COINS.forEach((x) => {
      const screenX = (((x - SPEED * i) % PERIOD) + PERIOD) % PERIOD;
      if (i >= collectedAt(x)) collected += 1;
      if (screenX >= 44 && screenX < W + 9) {
        coinParts.push({ input: layers.coin, left: screenX - 9, top: COIN_Y - Math.round(2 * Math.sin((i + x) / 3)) });
      }
    });

    // Night: stars and fireflies
    const nightBits = [];
    if (night > 0) {
      stars.forEach((s, k) => {
        const visible = (i + s.phase + k) % 6 < 4;
        if (visible) nightBits.push(`<rect x="${s.x}" y="${s.y}" width="1" height="1" fill="#ffffff" opacity="${(0.9 * night).toFixed(2)}"/>`);
      });
      flies.forEach((f) => {
        const x = Math.round(f.x + 6 * Math.sin((i + f.phase) / 5));
        const y = Math.round(f.y + 4 * Math.sin((i + f.phase) / 3));
        nightBits.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="#fff27a" opacity="${(0.95 * night).toFixed(2)}"/>`);
        nightBits.push(`<rect x="${x - 1}" y="${y}" width="3" height="1" fill="#fff27a" opacity="${(0.28 * night).toFixed(2)}"/>`);
      });
    }

    // HUD: three hearts on the left, the coin count on the right
    const hud =
      pixelText(`${collected}`, 190, 8, 2, "#ffffff", "#0b1424", 1) +
      pixelText("COINS", 148, 11, 1, "#ffe14d", "#0b1424", 1);
    const dynamicUi = await sharp(Buffer.from(svgDoc(W, H, "hud", hud + (Math.floor(i / 6) % 2 === 0 ? pixelText(">", 127, 66, 1, "#ffcc33", "#0b1424", 1) : "")))).png().toBuffer();
    const nightPng = night > 0 ? await sharp(Buffer.from(svgDoc(W, H, "night", nightBits.join("")))).png().toBuffer() : null;

    const tc = tint(t);
    const tintLayer = await sharp({ create: { width: W, height: H, channels: 4, background: { r: tc.r, g: tc.g, b: tc.b, alpha: tc.alpha } } }).png().toBuffer();

    const heartLeft = [0, 1, 2].map((k) => ({ input: layers.heart, left: 4 + k * 17, top: 3 }));
    const layersList = [
      ...parts,
      { input: skyPng, left: 0, top: 0 },
      { input: groundCrop, left: 0, top: 40 },
      ...coinParts,
      { input: layers.runner[airborne ? 0 : step], left: RUNNER_X, top: runnerTop },
      { input: tintLayer, left: 0, top: 0 },
      ...(nightPng ? [{ input: nightPng, left: 0, top: 0 }] : []),
      ...heartLeft,
      { input: staticUiPng, left: 0, top: 0 },
      { input: dynamicUi, left: 0, top: 0 },
    ];
    frames.push(await sharp(layers.sky).composite(layersList).png().toBuffer());
  }
  return frames;
}
