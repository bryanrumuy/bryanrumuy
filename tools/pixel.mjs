// Small helpers for drawing pixel art as SVG: a 5x7 bitmap font, merged-run rectangles and a seeded RNG.
// Everything is drawn from rectangles, so the images need no fonts and no external files.

export const FONT = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  2: [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  3: ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  5: ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  6: [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  7: ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  9: [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", "..#..", ".#..."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  ">": ["#....", ".#...", "..#..", "...#.", "..#..", ".#...", "#...."],
  "#": [".#.#.", "#####", ".#.#.", ".#.#.", "#####", ".#.#.", ".#.#."],
  "*": [".....", "..#..", "#.#.#", ".###.", "#.#.#", "..#..", "....."],
  "(": ["...#.", "..#..", ".#...", ".#...", ".#...", "..#..", "...#."],
  ")": [".#...", "..#..", "...#.", "...#.", "...#.", "..#..", ".#..."],
};

export const GLYPH_W = 5;
export const GLYPH_H = 7;
const ADVANCE = 6; // a glyph plus one column of space

/** Width in pixels of a string at pixel size `px`. */
export function textWidth(text, px) {
  return Math.max(0, text.length * ADVANCE - 1) * px;
}

/** Mulberry32: a tiny seeded RNG so every build draws the same scene. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Turns a list of [col, row] cells into merged horizontal runs: [{ c, r, w }]. */
function toRuns(cells) {
  const byRow = new Map();
  for (const [c, r] of cells) {
    if (!byRow.has(r)) byRow.set(r, []);
    byRow.get(r).push(c);
  }
  const runs = [];
  for (const [r, cols] of [...byRow].sort((a, b) => a[0] - b[0])) {
    cols.sort((a, b) => a - b);
    let start = cols[0];
    let prev = cols[0];
    for (const c of cols.slice(1)) {
      if (c === prev + 1) {
        prev = c;
        continue;
      }
      runs.push({ c: start, r, w: prev - start + 1 });
      start = prev = c;
    }
    runs.push({ c: start, r, w: prev - start + 1 });
  }
  return runs;
}

/** One <path> per colour. `cells` maps a colour to [col, row] cells; px is the size of one pixel. */
export function paintCells(cellsByColour, px, ox = 0, oy = 0) {
  return Object.entries(cellsByColour)
    .filter(([, cells]) => cells.length > 0)
    .map(([fill, cells]) => {
      const d = toRuns(cells)
        .map((run) => `M${ox + run.c * px} ${oy + run.r * px}h${run.w * px}v${px}h${-run.w * px}z`)
        .join("");
      return `<path fill="${fill}" d="${d}"/>`;
    })
    .join("");
}

/** A picture given as rows of characters plus a palette ({ char: colour }); "." is transparent. */
export function paintGrid(rows, palette, px, ox = 0, oy = 0) {
  const cells = {};
  rows.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === "." || ch === " " || !palette[ch]) return;
      (cells[palette[ch]] ??= []).push([c, r]);
    });
  });
  return paintCells(cells, px, ox, oy);
}

/** Text in the bitmap font, with an optional offset shadow. Returns SVG markup. */
export function pixelText(text, x, y, px, fill, shadow = null, shadowOffset = 1) {
  const cells = [];
  [...text.toUpperCase()].forEach((ch, index) => {
    const glyph = FONT[ch] ?? FONT[" "];
    glyph.forEach((row, r) => {
      [...row].forEach((bit, c) => {
        if (bit === "#") cells.push([index * ADVANCE + c, r]);
      });
    });
  });
  const draw = (colour, dx, dy) => paintCells({ [colour]: cells }, px, x + dx, y + dy);
  const under = shadow ? draw(shadow, shadowOffset * px, shadowOffset * px) : "";
  return under + draw(fill, 0, 0);
}

export const svgDoc = (width, height, title, body, css = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${title}" shape-rendering="crispEdges">` +
  `<title>${title}</title><style>${css}</style>${body}</svg>`;
