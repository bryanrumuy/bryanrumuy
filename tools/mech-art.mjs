// An original pixel-art mobile suit ("RX-B"), a round enemy drone and an explosion, all drawn from code.
// The design is inspired by classic giant-robot anime but is not any existing character.
import { rng } from "./pixel.mjs";

export const PALETTE = {
  W: "#eef2fa", // armour
  w: "#b9c4dc", // armour shade
  D: "#7d89a8", // dark shade
  B: "#2f62d6", // blue
  b: "#1d3f99", // blue shade
  R: "#dc3b3b", // red
  r: "#8f2227", // red shade
  Y: "#f7c92c", // yellow
  y: "#b98915", // yellow shade
  G: "#59627a", // metal
  g: "#2c3144", // dark metal
  V: "#58ffa6", // visor glow
  v: "#1fae6a", // visor shade
  C: "#6af0ff", // cyan glow
  K: "#10131f", // outline
};

const BODY_W = 40;
const BODY_H = 48;

function grid(w, h) {
  return Array.from({ length: h }, () => Array(w).fill("."));
}

/** Adds a one-pixel outline around the filled pixels. */
function outline(g, ch = "K") {
  const h = g.length;
  const w = g[0].length;
  const filled = (x, y) => g[y]?.[x] !== undefined && g[y][x] !== ".";
  const out = g.map((row) => [...row]);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (g[y][x] === "." && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) out[y][x] = ch;
    }
  }
  return out;
}

const SHADE = { W: "w", B: "b", R: "r", Y: "y", V: "v" };

/** Light from the top left: the bottom and right edge of every coloured plate get the darker tone. */
function shade(g) {
  const out = g.map((row) => [...row]);
  g.forEach((row, y) =>
    row.forEach((ch, x) => {
      const dark = SHADE[ch];
      if (!dark) return;
      if (g[y + 1]?.[x] !== ch || g[y]?.[x + 1] !== ch) out[y][x] = dark;
    })
  );
  return out;
}

const rows = (g) => g.map((row) => row.join(""));

/** The suit seen from the front: a left half is drawn and mirrored. The arms and weapons are added later. */
function body() {
  const g = grid(BODY_W, BODY_H);
  const set = (x, y, ch) => {
    if (g[y]?.[x] !== undefined) g[y][x] = ch;
  };
  const mr = (x, y, w, h, ch) => {
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) {
        set(xx, yy, ch);
        set(BODY_W - 1 - xx, yy, ch);
      }
    }
  };
  // Backpack saber handles, behind the shoulders
  mr(9, 9, 3, 9, "g");
  mr(10, 5, 2, 4, "C");
  // Head: a tall centre fin, thin antennae, a helmet with a red gem, twin visors and a chin
  mr(18, 0, 2, 3, "Y");
  mr(17, 3, 3, 2, "Y");
  mr(16, 5, 4, 1, "Y");
  mr(13, 2, 1, 5, "D");
  mr(15, 6, 5, 1, "W");
  mr(14, 7, 6, 2, "W");
  mr(13, 9, 7, 4, "W");
  mr(14, 13, 6, 2, "W");
  mr(18, 7, 2, 2, "R");
  mr(14, 10, 4, 2, "V");
  mr(15, 13, 4, 1, "D");
  mr(17, 14, 3, 1, "g");
  mr(16, 15, 4, 1, "g");
  // Shoulders, chest, abdomen, waist and skirt
  mr(4, 16, 8, 9, "W");
  mr(4, 16, 8, 2, "B");
  mr(6, 20, 4, 2, "R");
  mr(12, 17, 1, 6, "g");
  mr(13, 16, 7, 7, "B");
  mr(14, 17, 3, 2, "Y");
  mr(18, 16, 2, 7, "W");
  mr(18, 19, 2, 2, "R");
  mr(14, 23, 6, 2, "g");
  mr(13, 25, 7, 3, "W");
  mr(18, 26, 2, 1, "Y");
  mr(11, 28, 9, 5, "W");
  mr(9, 28, 2, 5, "B");
  mr(18, 31, 2, 2, "g");
  // Arms: upper arm, elbow, forearm and fist
  mr(4, 25, 5, 5, "W");
  mr(4, 30, 4, 1, "g");
  mr(3, 31, 6, 7, "B");
  mr(3, 38, 5, 3, "g");
  // Legs: thigh, red knee, calf with a blue panel, ankle and foot
  mr(12, 33, 7, 5, "W");
  mr(12, 38, 7, 2, "R");
  mr(11, 40, 8, 5, "W");
  mr(13, 40, 4, 3, "B");
  mr(11, 45, 8, 1, "g");
  mr(9, 45, 10, 3, "B");
  return outline(shade(g));
}

/** The shield carried on the left arm (the viewer's left). */
function shield() {
  const w = 14;
  const h = 30;
  const g = grid(w, h);
  for (let y = 0; y < h; y += 1) {
    const inset = y < 4 ? 3 - y : y > h - 8 ? Math.floor((y - (h - 8)) * 0.8) : 0;
    for (let x = inset; x < w - inset; x += 1) g[y][x] = "W";
  }
  // Red rim: every plate pixel that touches the outside
  const empty = (x, y) => g[y]?.[x] === undefined || g[y][x] === ".";
  const rim = [];
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (g[y][x] === "W" && (empty(x - 1, y) || empty(x + 1, y) || empty(x, y - 1) || empty(x, y + 1))) rim.push([x, y]);
    }
  }
  for (const [x, y] of rim) g[y][x] = "R";
  // Yellow cross emblem with a blue centre
  for (let y = 8; y < 20; y += 1) for (let x = 6; x < 8; x += 1) g[y][x] = "Y";
  for (let x = 3; x < 11; x += 1) {
    g[13][x] = "Y";
    g[14][x] = "Y";
  }
  g[13][6] = g[13][7] = g[14][6] = g[14][7] = "B";
  return outline(shade(g));
}

/** The beam rifle in the right hand. The muzzle is the right end. */
function rifle() {
  const w = 26;
  const h = 9;
  const g = grid(w, h);
  for (let x = 0; x < w; x += 1) {
    g[3][x] = "G";
    g[4][x] = "G";
    g[5][x] = "g";
  }
  for (let x = 2; x < 12; x += 1) {
    g[1][x] = "W";
    g[2][x] = "W";
  }
  for (let x = 3; x < 8; x += 1) g[6][x] = "g";
  for (let x = 16; x < 22; x += 1) {
    g[2][x] = "Y";
    g[6][x] = "y";
  }
  g[3][w - 1] = "C";
  g[4][w - 1] = "C";
  return outline(shade(g));
}

export const SUIT = {
  body: rows(body()),
  shield: rows(shield()),
  rifle: rows(rifle()),
  bodyW: BODY_W,
  bodyH: BODY_H,
};

/** Enemy: a round drone with one red eye. Two frames (the eye pulses). */
const DRONE_ROWS = [
  "....KKKKK....",
  "..KKPPPPPKK..",
  ".KPPPPPPPPPK.",
  "KPPPwwPPPPPPK",
  "KPPPPPPPPPPPK",
  "KPPKKKKKKKPPK",
  "KPPKeeeeeKPPK",
  "KPPKeeWeeKPPK",
  "KPPKeeeeeKPPK",
  "KPPPKKKKKPPPK",
  ".KPPPPPPPPPK.",
  "..KKPPPPPKK..",
  "..KGK...KGK..",
  "...K.....K...",
];
export const DRONE = { rows: DRONE_ROWS, w: 13, h: 14 };
export const DRONE_COLOURS = [
  { P: "#8a6fb5", w: "#c7b6e6", K: "#10131f", G: "#59627a", e: "#e03535", W: "#ffd3d3" },
  { P: "#8a6fb5", w: "#c7b6e6", K: "#10131f", G: "#59627a", e: "#ff7a3d", W: "#ffffff" },
];

const BLAST = ["#ffffff", "#fff3a0", "#ffc83d", "#ff8a2a", "#d6402a", "#7b2338"];

/** Draws step `t` (0..8) of an explosion centred on (cx, cy). */
export function explode(fb, cx, cy, t) {
  const radius = 2 + t * 2;
  const colour = BLAST[Math.min(BLAST.length - 1, Math.floor(t / 1.6))];
  if (t < 7) fb.disc(cx, cy, radius, colour, Math.max(0, radius - 4));
  if (t < 4) fb.disc(cx, cy, Math.max(1, 5 - t), "#ffffff");
  const rand = rng(7);
  for (let i = 0; i < 14; i += 1) {
    const angle = rand() * Math.PI * 2;
    const speed = 2 + rand() * 2.4;
    const x = cx + Math.cos(angle) * speed * t * 1.4;
    const y = cy + Math.sin(angle) * speed * t * 1.1 + t * t * 0.18;
    fb.px(x, y, i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#ffc83d" : "#ff6a2a");
    if (t < 6) fb.px(x + 1, y, "#ffc83d", 0.6);
  }
}
