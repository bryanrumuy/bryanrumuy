// Shared helpers for the profile artwork: a starfield, framed panels, chips, slim banners and contact buttons.
import { FB } from "./fb.mjs";
import { rng } from "./pixel.mjs";

/** Width in logical pixels of `text` in the 5x7 font at size 1. */
export const textW = (text) => Math.max(0, text.length * 6 - 1);

export const COLOURS = {
  bg: "#0d1233",
  panel: "#111a44",
  line: "#6af0ff",
  gold: "#ffd24a",
  pink: "#ff8fd0",
  green: "#58ffa6",
  orange: "#ff9a4a",
  violet: "#b9a2ff",
  text: "#cfe0ff",
  dim: "#7f8fc0",
};

export function starfield(fb, f, seed, count, period = 12) {
  const rand = rng(seed);
  for (let i = 0; i < count; i += 1) {
    const x = Math.floor(rand() * fb.w);
    const y = Math.floor(rand() * fb.h);
    const phase = rand();
    fb.px(x, y, "#ffffff", 0.12 + 0.4 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (f / period + phase))));
  }
}

/** A one-pixel frame with notched corners. */
export function frame(fb, colour = COLOURS.line, alpha = 1) {
  fb.rect(2, 0, fb.w - 4, 1, colour, alpha);
  fb.rect(2, fb.h - 1, fb.w - 4, 1, colour, alpha);
  fb.rect(0, 2, 1, fb.h - 4, colour, alpha);
  fb.rect(fb.w - 1, 2, 1, fb.h - 4, colour, alpha);
  for (const [x, y] of [[1, 1], [fb.w - 2, 1], [1, fb.h - 2], [fb.w - 2, fb.h - 2]]) fb.px(x, y, colour, alpha);
}

/** A small label chip: 9 px tall, `shine` (0..1 across the chip) brightens a diagonal band. */
export function chip(fb, x, y, text, colour, shine = -1) {
  const w = textW(text) + 8;
  fb.rect(x, y, w, 9, "#1a2460");
  fb.rect(x, y, w, 1, colour, 0.55);
  fb.rect(x, y + 8, w, 1, colour, 0.25);
  fb.rect(x, y, 1, 9, colour, 0.55);
  fb.rect(x + w - 1, y, 1, 9, colour, 0.25);
  fb.px(x + 3, y + 4, colour);
  fb.text(text, x + 6, y + 1, shine >= 0 && shine < 1 ? "#ffffff" : COLOURS.text);
  if (shine >= 0 && shine < 1) fb.rect(x + Math.floor(shine * (w - 2)) + 1, y + 1, 2, 7, "#ffffff", 0.35);
  return w;
}

// ---------------------------------------------------------------------------------------------
// Slim section banner

export const BANNER = { W: 276, H: 14, FRAMES: 30, DELAY: 80 };

export function bannerFrame(label, f, still = false) {
  const fb = new FB(BANNER.W, BANNER.H, COLOURS.bg);
  fb.rect(0, BANNER.H - 2, BANNER.W, 1, COLOURS.line, 0.35);
  // Blinking diamond and the label
  const on = still || Math.floor(f / 5) % 2 === 0;
  const dia = on ? COLOURS.gold : "#8a6f1f";
  for (const [dx, dy] of [[3, 0], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [2, 3], [3, 3], [4, 3], [3, 4]]) fb.px(4 + dx, 3 + dy, dia);
  fb.text(label, 16, 3, COLOURS.gold, { shadow: "#050824" });
  // A pulse runs along the line, with a short tail
  const start = 16 + textW(label) + 8;
  const span = BANNER.W - start;
  const x = start + ((f * span) / BANNER.FRAMES);
  fb.rect(start, 6, span, 1, COLOURS.line, 0.35);
  if (!still) {
    fb.rect(x, 5, 10, 3, "#ffffff", 0.9);
    fb.rect(x - 14, 6, 14, 1, COLOURS.line, 0.8);
  }
  return fb;
}

// ---------------------------------------------------------------------------------------------
// Contact buttons

export const BUTTON = { W: 78, H: 16, FRAMES: 24, DELAY: 80 };

const BUTTON_ICONS = {
  globe: [".#####.", "#.#.#.#", "#######", "#.#.#.#", "#######", "#.#.#.#", ".#####."],
  link: ["#######", "#.....#", "#.##..#", "#.#.#.#", "#..##.#", "#.....#", "#######"],
  mail: ["#######", "##...##", "#.#.#.#", "#..#..#", "#.....#", "#.....#", "#######"],
};

export function buttonFrame(label, icon, colour, f, still = false) {
  const fb = new FB(BUTTON.W, BUTTON.H, "#0d1233");
  fb.rect(0, 0, BUTTON.W, BUTTON.H, colour, 0.18);
  fb.rect(1, 1, BUTTON.W - 2, 1, colour);
  fb.rect(1, BUTTON.H - 2, BUTTON.W - 2, 1, colour, 0.5);
  fb.rect(0, 2, 1, BUTTON.H - 4, colour);
  fb.rect(BUTTON.W - 1, 2, 1, BUTTON.H - 4, colour, 0.5);
  fb.blit(BUTTON_ICONS[icon], { "#": colour }, 5, 4);
  fb.text(label, 16, 4, "#ffffff", { shadow: "#050824" });
  // The arrow nudges to the right, and a shine crosses the button
  const nudge = still ? 0 : Math.floor(f / 4) % 3;
  fb.text(">", BUTTON.W - 11 + nudge, 4, COLOURS.gold);
  const x = ((f * (BUTTON.W + 16)) / BUTTON.FRAMES) - 8;
  if (!still) for (let y = 2; y < BUTTON.H - 2; y += 1) fb.px(x + (BUTTON.H - y) / 3, y, "#ffffff", 0.3);
  return fb;
}
