// The footer: the suit watches the sunset while birds fly past. Logical size 207 x 66, shown at 4x.
import { FB } from "./fb.mjs";
import { rng } from "./pixel.mjs";
import { PALETTE, SUIT } from "./mech-art.mjs";

const W = 207;

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
  fb.text("THANKS FOR", 4, 5, (col, row) => (row < 4 ? "#fff4c4" : "#ffd24a"), { size: 2, shadow: "#3a1d57" });
  fb.text("VISITING", 4, 22, (col, row) => (row < 4 ? "#fff4c4" : "#ffd24a"), { size: 2, shadow: "#3a1d57" });
  if (f % 16 < 11) fb.text("MISSION COMPLETE", 4, 41, "#58ffa6", { shadow: "#10331f" });
  return fb;
}
