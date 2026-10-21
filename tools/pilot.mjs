// The "pilot profile" card that replaces a paragraph of text: a portrait (the suit's head, enlarged) and a data
// sheet that types itself out. Logical size 276 x 84, shown at 3x.
import { FB } from "./fb.mjs";
import { PALETTE, SUIT } from "./mech-art.mjs";
import { COLOURS, frame, starfield } from "./ui.mjs";

export const PILOT = { W: 276, H: 84, FRAMES: 70, DELAY: 80 };
// The sheet is complete for the first 26 frames (so a still preview shows everything), is then wiped and typed again.
const HOLD = 26;

const SHEET = [
  ["NAME", "BRYAN RUMUY"],
  ["ROLE", "WEB DEVELOPER"],
  ["FOCUS", "AI AUTOMATION"],
  ["BASE", "SURABAYA, INDONESIA"],
  ["SCHOOL", "UNIVERSITAS SURABAYA"],
  ["STATUS", "OPEN TO WORK"],
];
const SPEED = 2.6; // characters per frame

/** The head and shoulders of the suit (rows 0-16, columns 10-29) drawn at 3x. */
function portrait(fb, x, y, f) {
  const blink = f % 30 === 21;
  SUIT.body.slice(0, 17).forEach((row, r) => {
    [...row].slice(10, 30).forEach((ch, c) => {
      const colour = PALETTE[ch];
      if (colour) fb.rect(x + c * 3, y + r * 3, 3, 3, colour);
    });
  });
  const eye = blink ? "#1fae6a" : f % 15 < 2 ? "#c9ffe3" : "#58ffa6";
  for (const ex of [14, 22]) fb.rect(x + (ex - 10) * 3, y + 10 * 3, 12, 3, eye);
  for (const tx of [10, 28]) fb.rect(x + (tx - 10) * 3, y + 5 * 3, 6, 9, Math.floor(f / 4) % 2 === 0 ? "#6af0ff" : "#2aa8c0");
}

export function pilotFrame(f) {
  const fb = new FB(PILOT.W, PILOT.H, COLOURS.bg);
  starfield(fb, f, 4, 36);
  frame(fb);
  // Portrait panel with a scanning line
  fb.rect(7, 7, 70, 70, "#0a0f2e");
  fb.rect(7, 7, 70, 1, COLOURS.line, 0.5);
  fb.rect(7, 76, 70, 1, COLOURS.line, 0.5);
  fb.rect(7, 7, 1, 70, COLOURS.line, 0.5);
  fb.rect(76, 7, 1, 70, COLOURS.line, 0.5);
  portrait(fb, 13, 12, f);
  fb.text("PILOT 01", 15, 67, COLOURS.gold);
  const scan = 8 + ((f * 4) % 66);
  fb.rect(8, scan, 68, 1, COLOURS.line, 0.35);
  fb.rect(8, scan + 1, 68, 1, COLOURS.line, 0.12);
  // Data sheet
  fb.text("PILOT DATA", 88, 8, COLOURS.gold);
  fb.rect(88, 18, 180, 1, COLOURS.gold, 0.5);
  const full = SHEET.reduce((n, [, value]) => n + value.length, 0);
  let typed = f < HOLD ? full : Math.max(0, Math.floor((f - HOLD - 1) * SPEED));
  let cursor = null;
  SHEET.forEach(([label, value], i) => {
    const y = 23 + i * 10;
    fb.text(label, 88, y, COLOURS.dim);
    const shown = Math.max(0, Math.min(value.length, typed));
    typed -= value.length;
    const last = label === "STATUS";
    const colour = last ? COLOURS.green : "#ffffff";
    fb.text(value.slice(0, shown), 130, y, colour);
    if (shown > 0 && shown < value.length) cursor = [130 + shown * 6, y];
    if (last && shown === value.length && f % 16 < 10) fb.rect(262, y + 1, 4, 5, COLOURS.green);
  });
  if (cursor && f % 2 === 0) fb.rect(cursor[0], cursor[1], 5, 7, COLOURS.green);
  return fb;
}
