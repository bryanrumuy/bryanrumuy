// The smaller animated pieces of the profile: section banners, the skill "loadout" panel and the footer.
import { FB } from "./fb.mjs";
import { rng } from "./pixel.mjs";
import { DRONE, DRONE_COLOURS, PALETTE, SUIT } from "./mech-art.mjs";

const W = 207;

// ---------------------------------------------------------------------------------------------
// Section banners

export const BANNER = { H: 22, FRAMES: 24, DELAY: 80 };

export function bannerFrame(label, f) {
  const fb = new FB(W, BANNER.H, "#0d1233");
  const star = rng(3);
  for (let i = 0; i < 24; i += 1) fb.px(Math.floor(star() * W), Math.floor(star() * BANNER.H), "#ffffff", 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(f / 3.8 + i)));
  fb.rect(0, 0, W, 1, "#6af0ff", 0.8);
  fb.rect(0, BANNER.H - 1, W, 1, "#6af0ff", 0.8);
  // A beam that runs along the lower edge
  const x = (f * 9) % (W + 30) - 30;
  fb.rect(x, BANNER.H - 3, 30, 1, "#ffffff", 0.9);
  fb.rect(x - 8, BANNER.H - 3, 8, 1, "#6af0ff", 0.5);
  // Arrow chevrons that blink in turn
  for (let i = 0; i < 3; i += 1) {
    const on = Math.floor(f / 4) % 4 > i;
    const cx = 6 + i * 6;
    for (let k = 0; k < 4; k += 1) {
      fb.px(cx + k, 5 + k, on ? "#ffd24a" : "#3a3f78");
      fb.px(cx + k, 14 - k, on ? "#ffd24a" : "#3a3f78");
    }
  }
  const glint = ((f / BANNER.FRAMES) * (label.length * 12 + 40)) - 20;
  fb.text(
    label,
    30,
    4,
    (col, row) => (Math.abs(col * 2 + row * 2 - glint) < 5 ? "#ffffff" : row < 4 ? "#ffe27a" : "#ffb43a"),
    { size: 2, shadow: "#050824" }
  );
  return fb;
}

// ---------------------------------------------------------------------------------------------
// Skill loadout

export const LOADOUT = { H: 80, FRAMES: 28, DELAY: 90 };

const ICONS = {
  web: ["#######", "#######", "#.....#", "#.###.#", "#.....#", "#.###.#", "#######"],
  data: [".#####.", "#######", ".#####.", "#######", ".#####.", "#######", ".#####."],
  ai: ["..#.#..", ".#####.", "#.#.#.#", "#######", "#.###.#", ".#####.", "..#.#.."],
};

const COLUMNS = [
  { x: 3, icon: "web", colour: "#6af0ff", title: "WEB", items: ["PHP", "LARAVEL", "JS + TS", "REACT", "NODE.JS", "TAILWIND"] },
  { x: 72, icon: "data", colour: "#ffd24a", title: "DATA", items: ["MYSQL", "POSTGRES", "SUPABASE", "SQLITE", "PYTHON", "TENSORFLOW"] },
  { x: 142, icon: "ai", colour: "#ff8fd0", title: "AI+TOOLS", items: ["OPENAI", "LLM APPS", "PROMPTS", "EVALS", "GIT", "CI+TESTS"] },
];

export function loadoutFrame(f) {
  const fb = new FB(W, LOADOUT.H, "#0d1233");
  const star = rng(9);
  for (let i = 0; i < 40; i += 1) fb.px(Math.floor(star() * W), Math.floor(star() * LOADOUT.H), "#ffffff", 0.15 + 0.4 * (0.5 + 0.5 * Math.sin(f / 4.5 + i * 1.7)));
  // Frame with notched corners
  fb.rect(2, 0, W - 4, 1, "#6af0ff");
  fb.rect(2, LOADOUT.H - 1, W - 4, 1, "#6af0ff");
  fb.rect(0, 2, 1, LOADOUT.H - 4, "#6af0ff");
  fb.rect(W - 1, 2, 1, LOADOUT.H - 4, "#6af0ff");
  for (const [x, y] of [[1, 1], [W - 2, 1], [1, LOADOUT.H - 2], [W - 2, LOADOUT.H - 2]]) fb.px(x, y, "#6af0ff");

  COLUMNS.forEach((col, ci) => {
    fb.blit(ICONS[col.icon], { "#": col.colour }, col.x, 7);
    fb.text(col.title, col.x + 10, 7, col.colour);
    fb.rect(col.x, 17, 62, 1, col.colour, 0.6);
    const active = (Math.floor(f / 3) + ci * 2) % col.items.length;
    col.items.forEach((item, i) => {
      const y = 21 + i * 9;
      const on = i === active;
      if (on) {
        fb.rect(col.x - 1, y - 1, 64, 9, "#1f3a8a");
        fb.rect(col.x - 1, y - 1, 1, 9, col.colour);
        fb.text(">", col.x + 1, y, col.colour);
        fb.text(item, col.x + 8, y, "#ffffff");
      } else {
        fb.px(col.x + 3, y + 3, col.colour, 0.55);
        fb.text(item, col.x + 8, y, "#a9bfe8");
      }
    });
  });
  // Blinking cursor in the bottom right corner
  if (f % 8 < 5) fb.rect(W - 9, LOADOUT.H - 8, 4, 5, "#58ffa6");
  return fb;
}

// ---------------------------------------------------------------------------------------------
// Footer: the suit watches the sunset

export const FOOTER = { H: 66, FRAMES: 40, DELAY: 80 };
const FOOTER_BANDS = [[12, "#3a2a7a"], [24, "#7a3a96"], [36, "#c4529c"], [46, "#ff7f8e"], [56, "#ffb070"], [66, "#ffd88a"]];

function hills(fb, colour, base, amp, period, shift) {
  for (let x = 0; x < W; x += 1) {
    const t = ((x + shift) % period) / period;
    const top = Math.round(base - amp * (0.5 + 0.5 * Math.sin(2 * Math.PI * t)) - amp * 0.35 * Math.sin(4 * Math.PI * t + 1));
    fb.rect(x, top, 1, FOOTER.H - top, colour);
  }
}

function bird(fb, x, y, f) {
  const up = Math.floor(f / 2) % 2 === 0;
  const c = "#3a1d57";
  fb.px(x, y, c);
  fb.px(x - 1, y + (up ? -1 : 1), c);
  fb.px(x - 2, y + (up ? -2 : 1), c);
  fb.px(x + 1, y + (up ? -1 : 1), c);
  fb.px(x + 2, y + (up ? -2 : 1), c);
}

export function footerFrame(f) {
  const fb = new FB(W, FOOTER.H);
  for (let y = 0; y < FOOTER.H; y += 1) {
    const i = FOOTER_BANDS.findIndex(([to]) => y < to);
    const next = FOOTER_BANDS[Math.min(FOOTER_BANDS.length - 1, i + 1)][1];
    const edge = FOOTER_BANDS[i][0] - y;
    for (let x = 0; x < W; x += 1) fb.px(x, y, edge <= 2 && (x + y) % (edge === 1 ? 2 : 4) === 0 ? next : FOOTER_BANDS[i][1]);
  }
  const star = rng(21);
  for (let i = 0; i < 18; i += 1) fb.px(Math.floor(star() * W), Math.floor(star() * 20), "#ffffff", 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(f / 4 + i)));
  // The sun and its pulsing glow
  const pulse = Math.round(Math.sin((2 * Math.PI * f) / FOOTER.FRAMES) * 2);
  fb.disc(56, 50, 22 + pulse, "#ffe9a8", 0, 0.14);
  fb.disc(56, 50, 16 + Math.floor(pulse / 2), "#fff2c4", 0, 0.3);
  fb.disc(56, 50, 12, "#fffbe8");
  // Clouds drift with a gentle sway
  for (const [cx, cy, w] of [[20, 20, 22], [98, 12, 28], [160, 24, 20]]) {
    const sway = Math.round(Math.sin((2 * Math.PI * f) / FOOTER.FRAMES + cx) * 2);
    fb.rect(cx + sway, cy, w, 3, "#ffc0cf", 0.8);
    fb.rect(cx + 3 + sway, cy - 2, w - 8, 3, "#ffc0cf", 0.8);
  }
  hills(fb, "#8a3a7e", 52, 8, 207, 0);
  hills(fb, "#4c2368", 58, 5, 103, 30);
  fb.rect(0, FOOTER.H - 4, W, 4, "#2a1445");
  // Birds fly across once per loop
  const bx = 235 - f * 6.9;
  bird(fb, bx, 18, f);
  bird(fb, bx + 12, 24, f + 1);
  bird(fb, bx + 24, 16, f);
  // The suit at ease on the hill, bobbing slightly
  const bob = Math.round(Math.sin((2 * Math.PI * f) / FOOTER.FRAMES));
  const x = 150;
  const y = 14 + bob;
  fb.blit(SUIT.body, PALETTE, x, y);
  const eye = f % 20 === 11 ? "#1fae6a" : "#58ffa6";
  for (const ex of [14, 22]) fb.rect(x + ex, y + 10, 4, 1, eye);
  for (const tx of [10, 28]) fb.rect(x + tx, y + 5, 2, 4, Math.floor(f / 4) % 2 === 0 ? "#6af0ff" : "#2aa8c0");
  fb.blit(SUIT.shield, PALETTE, x - 11, y + 24);
  fb.blit(SUIT.rifle, PALETTE, x + 29, y + 35);
  // Text
  fb.text("TERIMA KASIH", 4, 6, (col, row) => (row < 4 ? "#fff4c4" : "#ffd24a"), { size: 2, shadow: "#3a1d57" });
  fb.text("SUDAH MAMPIR", 4, 24, "#ffffff", { shadow: "#3a1d57" });
  if (f % 16 < 11) fb.text("MISSION COMPLETE", 4, 34, "#58ffa6", { shadow: "#10331f" });
  void DRONE;
  void DRONE_COLOURS;
  return fb;
}
