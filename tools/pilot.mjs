// The "pilot profile" card that replaces a paragraph of text: a portrait (the suit's head, enlarged) and a data
// sheet that types itself out. Logical size 276 x 84, shown at 3x.
import { FB } from "./fb.mjs";
import { PALETTE, SUIT } from "./mech-art.mjs";
import { COLOURS, frame, starfield } from "./ui.mjs";

export const PILOT = { W: 276, H: 84, FRAMES: 48, DELAY: 100 };

const SHEET = [
  ["NAME", "BRYAN RUMUY"],
  ["ROLE", "WEB DEVELOPER"],
  ["FOCUS", "AI AUTOMATION"],
  ["BASE", "SURABAYA, INDONESIA"],
  ["SCHOOL", "UNIVERSITAS SURABAYA"],
  ["STATUS", "OPEN TO WORK"],
];

/** The head and shoulders of the suit (rows 0-16, columns 10-29) drawn at 3x. */
function portrait(fb, x, y, f) {
  const blink = f % 24 === 21;
  SUIT.body.slice(0, 17).forEach((row, r) => {
    [...row].slice(10, 30).forEach((ch, c) => {
      const colour = PALETTE[ch];
      if (colour) fb.rect(x + c * 3, y + r * 3, 3, 3, colour);
    });
  });
  const eye = blink ? "#1fae6a" : f % 24 < 2 ? "#c9ffe3" : "#58ffa6";
  for (const ex of [14, 22]) fb.rect(x + (ex - 10) * 3, y + 10 * 3, 12, 3, eye);
  for (const tx of [10, 28]) fb.rect(x + (tx - 10) * 3, y + 5 * 3, 6, 9, Math.floor(f / 4) % 2 === 0 ? "#6af0ff" : "#2aa8c0");
}

export function pilotFrame(f) {
  const fb = new FB(PILOT.W, PILOT.H, COLOURS.bg);
  starfield(fb, 0, 4, 36, 1e9);
  frame(fb);
  // Portrait panel with a scanning line
  fb.rect(7, 7, 70, 70, "#0a0f2e");
  fb.rect(7, 7, 70, 1, COLOURS.line, 0.5);
  fb.rect(7, 76, 70, 1, COLOURS.line, 0.5);
  fb.rect(7, 7, 1, 70, COLOURS.line, 0.5);
  fb.rect(76, 7, 1, 70, COLOURS.line, 0.5);
  portrait(fb, 13, 12, f);
  fb.text("PILOT 01", 15, 67, COLOURS.gold);
  // Data sheet
  fb.text("PILOT DATA", 88, 8, COLOURS.gold);
  fb.rect(88, 18, 180, 1, COLOURS.gold, 0.5);
  SHEET.forEach(([label, value], i) => {
    const y = 23 + i * 10;
    fb.text(label, 88, y, COLOURS.dim);
    const status = label === "STATUS";
    fb.text(value, 130, y, status ? COLOURS.green : "#ffffff");
    if (status && f % 16 < 10) fb.rect(130 + value.length * 6 + 2, y + 1, 4, 5, COLOURS.green);
  });
  return fb;
}
