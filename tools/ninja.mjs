// An original ninja runner, 16x22 pixels, drawn from code: a navy suit, a silver headband plate, a red scarf
// that trails behind and a red belt. The outline is generated around the filled pixels, so every frame
// gets the same crisp edge. Four run frames and one jump pose.
import sharp from "sharp";
import { paintCells, svgDoc } from "./pixel.mjs";

export const NINJA = { W: 16, H: 22 };

const PALETTE = {
  B: "#34407a", // suit
  b: "#4d5ca3", // suit highlight
  W: "#dfe3ee", // headband plate
  S: "#f2c9a0", // skin
  E: "#1a1a2e", // eye
  R: "#d6362e", // scarf and belt
  r: "#9b2323", // scarf shadow
  K: "#14142a", // outline
};

// Head, scarf and torso (no outline: it is added afterwards). Eleven rows, 16 columns.
const BODY = [
  "......BBBB......",
  ".....BBBBBB.....",
  ".....WWWWWW.....",
  ".....SSSSES.....",
  ".....BBBBBB.....",
  ".RRRRRRRRRR.....",
  "rrr..BBBBBB.....",
  "....bBBBBBBB....",
  "....BBBBBBBB....",
  "....RRRRRRRR....",
  ".....BBBBBB.....",
  ".....BBBBBB.....",
];

// Each run frame: two legs as [knee, foot] from the hips, and the hands of the front and back arm.
const RUN = [
  { a: [[10, 16], [12, 20]], b: [[5, 16], [3, 20]], front: [13, 10], back: [2, 6] },
  { a: [[8, 16], [8, 20]], b: [[9, 15], [6, 15]], front: [12, 8], back: [3, 8] },
  { a: [[5, 16], [3, 20]], b: [[11, 16], [13, 20]], front: [13, 6], back: [2, 10] },
  { a: [[8, 15], [5, 15]], b: [[8, 16], [8, 20]], front: [12, 8], back: [3, 8] },
];
const JUMP = { a: [[10, 15], [9, 18]], b: [[5, 15], [6, 18]], front: [13, 3], back: [2, 3] };

function line(grid, [x0, y0], [x1, y1], ch, thick = 1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let s = 0; s <= steps; s += 1) {
    const x = Math.round(x0 + ((x1 - x0) * s) / steps);
    const y = Math.round(y0 + ((y1 - y0) * s) / steps);
    for (let dx = 0; dx < thick; dx += 1) if (grid[y]?.[x + dx] !== undefined) grid[y][x + dx] = ch;
  }
}

function pose({ a, b, front, back }) {
  const grid = Array.from({ length: NINJA.H }, () => Array(NINJA.W).fill("."));
  const rows = [...BODY];
  rows.forEach((row, y) => [...row].forEach((ch, x) => (grid[y][x] = ch)));
  line(grid, [5, 7], back, "b");
  grid[back[1]][back[0]] = "S";
  line(grid, [7, 12], a[0], "B", 2);
  line(grid, a[0], a[1], "B", 2);
  line(grid, [8, 12], b[0], "b", 2);
  line(grid, b[0], b[1], "b", 2);
  line(grid, [10, 7], front, "B");
  grid[front[1]][front[0]] = "S";
  // The outline: any empty pixel next to a filled one.
  const filled = (x, y) => grid[y]?.[x] !== undefined && grid[y][x] !== ".";
  const out = grid.map((row) => [...row]);
  for (let y = 0; y < NINJA.H; y += 1) {
    for (let x = 0; x < NINJA.W; x += 1) {
      if (grid[y][x] === "." && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) out[y][x] = "K";
    }
  }
  return out;
}

async function render(grid) {
  const cells = {};
  grid.forEach((row, y) =>
    row.forEach((ch, x) => {
      if (ch !== ".") (cells[PALETTE[ch]] ??= []).push([x, y]);
    })
  );
  return sharp(Buffer.from(svgDoc(NINJA.W, NINJA.H, "ninja", paintCells(cells, 1))), { density: 72 }).png().toBuffer();
}

/** The four run frames and the jump pose as PNG buffers. */
export async function ninjaFrames() {
  return { run: await Promise.all(RUN.map((p) => render(pose(p)))), jump: await render(pose(JUMP)) };
}
