// The animated header: an original pixel-art mobile suit hovers above a night city, locks onto a round drone
// and shoots it down, twice per loop, under a title with a moving glint. 60 frames, every moving part is
// periodic so the loop has no seam. Run through tools/mech-scenes.mjs.
import { FB, rgb } from "./fb.mjs";
import { rng } from "./pixel.mjs";
import { DRONE, DRONE_COLOURS, PALETTE, SUIT, explode } from "./mech-art.mjs";

export const HEADER = { W: 207, H: 108, FRAMES: 60, DELAY: 70 };
const { W, H, FRAMES } = HEADER;

const BODY_X = 18;
const BODY_Y = 46;
const MUZZLE_X = BODY_X + 54;
const BEAM_Y = BODY_Y + 38; // top row of the 2-row beam
const SHOTS = [
  { start: 20, from: 215, enter: 0 },
  { start: 50, from: 215, enter: 30 },
];
const DRONE_SPEED = 2.5;

// ---------------------------------------------------------------------------------------------
// Static layers

const BANDS = [
  [18, "#070b24"], [35, "#0c1440"], [51, "#151f6a"], [64, "#262a86"], [76, "#4a3496"], [87, "#82409e"], [97, "#c4529c"], [108, "#ff8c8a"],
];

function sky() {
  const fb = new FB(W, H);
  for (let y = 0; y < H; y += 1) {
    const i = BANDS.findIndex(([to]) => y < to);
    const next = BANDS[Math.min(BANDS.length - 1, i + 1)][1];
    const edge = BANDS[i][0] - y; // rows left in this band
    for (let x = 0; x < W; x += 1) {
      const dither = edge <= 2 && (x + y) % (edge === 1 ? 2 : 4) === 0;
      fb.px(x, y, dither ? next : BANDS[i][1]);
    }
  }
  // Moon with craters and a soft rim
  fb.disc(42, 20, 15, "#ffffff", 0, 0.08);
  fb.disc(42, 20, 12, "#e8ecff");
  for (const [dx, dy, r] of [[-4, -3, 3], [4, 3, 4], [-2, 6, 2], [6, -5, 2]]) fb.disc(42 + dx, 20 + dy, r, "#c5cbee");
  fb.disc(42, 20, 12, "#9aa4d8", 11, 0.55);
  return fb;
}

function skylineTile(period, seed, minW, maxW, minH, maxH) {
  const rand = rng(seed);
  const buildings = [];
  let x = 0;
  while (x < period) {
    let w = minW + Math.floor(rand() * (maxW - minW + 1));
    if (period - (x + w) < minW) w = period - x;
    buildings.push({ x, w, h: minH + Math.floor(rand() * (maxH - minH + 1)), mast: rand() < 0.3, id: buildings.length });
    x += w;
  }
  return buildings;
}

const FAR = skylineTile(60, 11, 7, 12, 8, 20);
const NEAR = skylineTile(120, 23, 10, 18, 14, 28);

function drawSkyline(fb, tile, period, shift, colour, windows, f) {
  for (let copy = -1; copy <= Math.ceil(W / period) + 1; copy += 1) {
    for (const b of tile) {
      const left = copy * period + b.x - (shift % period);
      if (left > W || left + b.w < 0) continue;
      const top = H - 5 - b.h;
      fb.rect(left, top, b.w, b.h, colour);
      if (b.mast) fb.rect(left + Math.floor(b.w / 2), top - 5, 1, 5, colour);
      if (!windows) continue;
      for (let wy = top + 3; wy < H - 8; wy += 4) {
        for (let wx = left + 2; wx < left + b.w - 2; wx += 3) {
          const key = (b.id * 31 + Math.floor(wx - left) * 7 + (wy - top) * 13) % 11;
          const on = key < 5 ? true : key < 8 ? Math.floor((f + key * 5) / 10) % 3 !== 0 : false;
          if (on) fb.px(wx, wy, key % 4 === 0 ? "#6af0ff" : "#ffd96a");
        }
      }
    }
  }
}

const rand = rng(5);
const STARS = Array.from({ length: 58 }, () => ({
  x: Math.floor(rand() * W),
  y: Math.floor(rand() * 78),
  phase: rand(),
  colour: ["#ffffff", "#ffffff", "#9fe8ff", "#ffe9a8"][Math.floor(rand() * 4)],
  big: rand() < 0.14,
}));

function drawStars(fb, f) {
  for (const s of STARS) {
    const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (f / 12 + s.phase)));
    fb.px(s.x, s.y, s.colour, a);
    if (s.big) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) fb.px(s.x + dx, s.y + dy, s.colour, a * 0.55);
    }
  }
  for (const { at, x, y, dx, dy } of [
    { at: 6, x: 168, y: 4, dx: -7, dy: 3 },
    { at: 36, x: 120, y: 2, dx: -7, dy: 3 },
  ]) {
    const t = f - at;
    if (t < 0 || t > 5) continue;
    for (let k = 0; k < 7; k += 1) fb.px(x + dx * t + (-dx * k) / 3, y + dy * t + (-dy * k) / 3, "#ffffff", 1 - k / 7);
  }
}

// ---------------------------------------------------------------------------------------------
// The suit

function flame(fb, cx, top, f) {
  const length = 5 + ((f * 2) % 3) + (f % 4 === 0 ? 2 : 0);
  for (let i = 0; i < length; i += 1) {
    const half = Math.max(0, 3 - Math.floor((i * 3) / length));
    const fade = 1 - (i / length) * 0.5;
    fb.rect(cx - half, top + i, half * 2 + 1, 1, "#ff7a2a", fade);
    if (half > 0) fb.rect(cx - Math.max(0, half - 1), top + i, Math.max(0, half - 1) * 2 + 1, 1, "#ffc83d", fade);
    if (i < length - 2 && half > 1) fb.rect(cx, top + i, 1, 1, "#ffffff");
  }
  fb.disc(cx, top + 1, 6, "#ff9a3a", 0, 0.12);
}

function drawSuit(fb, f) {
  const bob = Math.round(Math.sin((2 * Math.PI * f) / 12));
  const shot = SHOTS.find((s) => f >= s.start - 4 && f <= s.start + 2);
  const recoil = shot && f >= shot.start && f <= shot.start + 1 ? -1 : 0;
  const x = BODY_X + recoil;
  const y = BODY_Y + bob;
  flame(fb, x + 13, y + SUIT.bodyH, f);
  flame(fb, x + 26, y + SUIT.bodyH, f + 1);
  fb.blit(SUIT.body, PALETTE, x, y);
  // Visors pulse, then blink once in a while; the saber tips on the backpack flicker
  const blink = f % 30 === 14;
  const eye = blink ? "#1fae6a" : f % 15 < 2 ? "#c9ffe3" : "#58ffa6";
  for (const ex of [14, 22]) fb.rect(x + ex, y + 10, 4, 1, eye);
  const tip = Math.floor(f / 4) % 2 === 0 ? "#6af0ff" : "#2aa8c0";
  for (const tx of [10, 28]) fb.rect(x + tx, y + 5, 2, 4, tip);
  fb.blit(SUIT.shield, PALETTE, x - 11, y + 24);
  fb.blit(SUIT.rifle, PALETTE, x + 29, y + 35);
  // Muzzle: a charge that grows, a flash when firing
  if (shot) {
    const phase = f - (shot.start - 4);
    const mx = x + 54;
    const my = y + 38;
    if (phase < 4) fb.disc(mx + 2, my, 1 + phase, "#6af0ff", 0, 0.35 + phase * 0.15);
    else fb.disc(mx + 2, my, 4, "#ffffff", 0, 0.9);
  }
}

// ---------------------------------------------------------------------------------------------
// Drones, beams and the lock-on reticle

function droneX(shot, f) {
  return shot.from - DRONE_SPEED * (f - shot.enter);
}

function drawAction(fb, f) {
  for (const shot of SHOTS) {
    const cx = Math.round(droneX(shot, shot.start));
    const alive = f >= shot.enter && f <= shot.start + 1;
    if (alive) {
      const x = Math.round(droneX(shot, f));
      const bobY = Math.round(Math.sin(f / 2));
      fb.blit(DRONE.rows, DRONE_COLOURS[f % 4 < 2 ? 0 : 1], x - 6, BEAM_Y - 6 + bobY);
      fb.rect(x - 2, BEAM_Y + 8 + bobY, 5, 1, "#ff7a2a", 0.5 + 0.3 * (f % 2));
      if (f >= shot.start - 8 && x < W - 6 && f % 2 === 0) {
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const bx = x + sx * 9;
          const by = BEAM_Y + 1 + bobY + sy * 9;
          fb.rect(bx, by, 3, 1, "#ff4b4b");
          fb.rect(bx + (sx > 0 ? 2 : 0), by + (sy > 0 ? -2 : 1), 1, 3, "#ff4b4b");
        }
      }
    }
    if (f >= shot.start && f <= shot.start + 2) {
      const from = MUZZLE_X + 2;
      const len = cx - from;
      fb.rect(from, BEAM_Y - 3, len, 8, "#6af0ff", 0.18);
      fb.rect(from, BEAM_Y - 1, len, 4, "#6af0ff", 0.55);
      fb.rect(from, BEAM_Y, len, 2, "#ffffff");
      fb.disc(cx, BEAM_Y + 1, 4, "#ffffff", 0, 0.8);
    }
    const t = f - (shot.start + 1);
    if (t >= 0 && t <= 8) explode(fb, cx, BEAM_Y + 1, t);
  }
}

// ---------------------------------------------------------------------------------------------
// Title and HUD

const TITLE_COLOURS = ["#ffe27a", "#ffd24a", "#ffb43a", "#ff8f2e"];

function title(fb, f) {
  const glint = ((f / FRAMES) * 150) - 25; // diagonal band sweeping across the title
  const paint = (rows) => (col, row) => {
    const d = col * 3 + row * 3 - glint; // column and row in glyph units, scaled to the 3x size
    if (Math.abs(d) < 5) return "#ffffff";
    return TITLE_COLOURS[Math.min(3, Math.floor((row * 4) / 7))];
  };
  fb.text("BRYAN", 106, 12, paint(), { size: 3, shadow: "#0a1030" });
  fb.text("RUMUY", 106, 37, paint(), { size: 3, shadow: "#0a1030" });
  fb.text("WEB DEVELOPER", 107, 64, "#9fe8ff", { shadow: "#0a1030" });
  fb.text("AI AUTOMATION", 107, 73, "#ffffff", { shadow: "#0a1030" });
  // Blinking cursor after the last line
  if (f % 8 < 5) fb.rect(107 + 13 * 6 + 1, 73, 4, 7, "#58ffa6");
}

function hud(fb, f) {
  const c = "#6af0ff";
  for (const [x, y, sx, sy] of [[2, 2, 1, 1], [W - 3, 2, -1, 1], [2, H - 3, 1, -1], [W - 3, H - 3, -1, -1]]) {
    fb.rect(x, y, 6 * sx || 1, 1, c, 0.7);
    fb.rect(x, y, 1, 6 * sy || 1, c, 0.7);
    if (sx < 0) fb.rect(x - 5, y, 6, 1, c, 0.7);
    if (sy < 0) fb.rect(x, y - 5, 1, 6, c, 0.7);
  }
  if (f % 20 < 14) fb.rect(W - 48, 5, 2, 2, "#58ffa6");
  fb.text("ONLINE", W - 44, 3, "#58ffa6");
  fb.text("RX-B", 10, 4, "#9fe8ff");
}

export function renderHeaderFrame(base, f) {
  const fb = new FB(W, H);
  base.data.copy(fb.data);
  drawStars(fb, f);
  drawSkyline(fb, FAR, 60, f, "#2c3180", false, f);
  drawSkyline(fb, NEAR, 120, f * 2, "#14143a", true, f);
  fb.rect(0, H - 5, W, 5, "#0a0a24");
  for (let x = -(f * 4) % 8; x < W; x += 8) fb.rect(x, H - 4, 3, 1, "#6af0ff", 0.8);
  drawSuit(fb, f);
  drawAction(fb, f);
  title(fb, f);
  hud(fb, f);
  return fb;
}

export const headerBase = sky;
void rgb;
