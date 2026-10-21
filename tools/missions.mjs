// "Mission select" cards, one per project, each with a 16x16 pixel icon, a type tag, a stack row and a
// public / private badge. Logical size 138 x 70, shown at 3x.
import { FB } from "./fb.mjs";
import { COLOURS, chip, frame, textW } from "./ui.mjs";

export const CARD = { W: 138, H: 78, FRAMES: 24, DELAY: 90 };

const P = {
  K: "#10131f", R: "#dc3b3b", r: "#8f2227", W: "#eef2fa", w: "#b9c4dc", Y: "#f7c92c", y: "#b98915",
  B: "#2f62d6", b: "#1d3f99", G: "#4fd37a", g: "#1f8a4c", P: "#ff8fd0", p: "#c2589a", C: "#6af0ff",
  c: "#2aa8c0", O: "#ff9a4a", N: "#8a5a3a", S: "#9aa4c0", s: "#59627a",
};

const ICONS = {
  book: [
    "................",
    "..KKKKK..KKKKK..",
    ".KWWWWWKKWWWWWK.",
    ".KWRRRWKKWRRRWK.",
    ".KWWWWWKKWWWWWK.",
    ".KWRRRWKKWRRRWK.",
    ".KWWWWWKKWWWWWK.",
    ".KWRRRWKKWRRRWK.",
    ".KWWWWWKKWWWWWK.",
    ".KWwwwwKKwwwwWK.",
    "KBBBBBBKKBBBBBBK",
    "KbbbbbbKKbbbbbbK",
    ".KKKKKKKKKKKKKK.",
    "................",
    "................",
    "................",
  ],
  coins: [
    "................",
    "................",
    ".....KKKKKK.....",
    "....KYYYYYYK....",
    "...KYyYYYYyYK...",
    "...KKKKKKKKKK...",
    "..KKYYYYYYYYKK..",
    ".KYyYYYYYYYYyYK.",
    ".KKKKKKKKKKKKKK.",
    "..KYYYYYYYYYYK..",
    ".KYyYYYYYYYYyYK.",
    ".KKKKKKKKKKKKKK.",
    "..KyyyyyyyyyyK..",
    "...KKKKKKKKKK...",
    "................",
    "................",
  ],
  bottle: [
    "................",
    ".......KKKK.....",
    "......KSSSSK....",
    ".......KKKK.....",
    ".......KssK.....",
    "......KKKKKK....",
    ".....KPPPPPPK...",
    ".....KPWWWWPK...",
    ".....KPWppWPK...",
    ".....KPWppWPK...",
    ".....KPWWWWPK...",
    ".....KPPPPPPK...",
    ".....KppppppK...",
    "......KKKKKK....",
    "................",
    "................",
  ],
  bot: [
    "......KK........",
    ".......K........",
    "....KKKKKKKK....",
    "...KSSSSSSSSK...",
    "..KSKKKKKKKKSK..",
    "..KSKCCKKCCKSK..",
    "..KSKCCKKCCKSK..",
    "..KSKKKKKKKKSK..",
    "..KSSKWKWKWSSK..",
    "...KSSSSSSSSK...",
    "....KKKKKKKK....",
    ".....KK..KK.....",
    "................",
    "................",
    "................",
    "................",
  ],
  chain: [
    "................",
    "................",
    "................",
    "................",
    ".KKKK..KKKK.KKKK",
    ".KBBK..KBBK.KBBK",
    ".KBBKKKKBBKKKBBK",
    ".KBBKccKBBKccBBK",
    ".KBBKKKKBBKKKBBK",
    ".KBBK..KBBK.KBBK",
    ".KKKK..KKKK.KKKK",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  leaf: [
    "................",
    "..........KKKK..",
    "......KKKKGGGGK.",
    "....KKGGGGGGGGK.",
    "...KGGGgGGGGGGK.",
    "..KGGGGGgGGGGGK.",
    "..KGGGGGGgGGGK..",
    ".KGGGGGGGGgGGK..",
    ".KGGGgGGGGGGK...",
    "KGGGGGgGGGKK....",
    "KGGGGGGKKK......",
    "KKNKKKK.........",
    "KNN.............",
    "................",
    "................",
    "................",
  ],
};

export const PROJECTS = [
  { id: "hanzilearn", icon: "book", colour: COLOURS.line, tag: "FREELANCE", title: "HANZILEARN", sub: "TUTORING APP", stack: ["REACT", "SUPABASE", "PWA"], visibility: "PRIVATE", fresh: true },
  { id: "finance", icon: "coins", colour: COLOURS.gold, tag: "FREELANCE", title: "OFFICE FINANCE", sub: "FINANCE SYSTEM", stack: ["LARAVEL", "MYSQL", "2FA"], visibility: "PRIVATE" },
  { id: "flbeauty", icon: "bottle", colour: COLOURS.pink, tag: "INTERNSHIP", title: "FL BEAUTY", sub: "SALES + STOCK", stack: ["PHP", "MYSQL", "BPMN"], visibility: "PRIVATE" },
  { id: "alter", icon: "bot", colour: COLOURS.orange, tag: "PERSONAL POC", title: "ALTER", sub: "AI ASSISTANT", stack: ["NODE.JS", "OPENAI"], visibility: "PUBLIC" },
  { id: "blockchain", icon: "chain", colour: COLOURS.violet, tag: "COURSE PROJECT", title: "WFH BLOCKCHAIN", sub: "ACTIVITY LOG", stack: ["FABRIC", "NODE.JS", "PHP"], visibility: "PUBLIC" },
  { id: "herbalscan", icon: "leaf", colour: COLOURS.green, tag: "THESIS", title: "HERBALSCAN", sub: "LEAF SCANNER", stack: ["PYTHON", "KERAS", "FLASK"], visibility: "PRIVATE" },
];

export function cardFrame(project, f, still = false) {
  const fb = new FB(CARD.W, CARD.H, COLOURS.bg);
  const pulse = still ? 1 : 0.55 + 0.45 * Math.sin((2 * Math.PI * f) / CARD.FRAMES);
  // Header strip with the type tag and the repo badge
  fb.rect(0, 0, CARD.W, 11, project.colour, 0.22);
  fb.text(project.tag, 5, 2, project.colour);
  const badge = project.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE";
  fb.text(badge, CARD.W - 5 - textW(badge), 2, COLOURS.dim);
  frame(fb, project.colour, 0.55 + 0.45 * pulse);
  // Icon in a small socket, bobbing
  const bob = still ? 0 : Math.round(Math.sin((2 * Math.PI * f) / CARD.FRAMES));
  fb.rect(5, 14, 34, 34, "#0a0f2e");
  fb.rect(5, 14, 34, 1, project.colour, 0.5);
  fb.rect(5, 47, 34, 1, project.colour, 0.5);
  fb.rect(5, 14, 1, 34, project.colour, 0.25);
  fb.rect(38, 14, 1, 34, project.colour, 0.25);
  fb.blit(ICONS[project.icon], P, 6, 15 + bob, { scale: 2 });
  if (!still && f % 12 < 2) {
    fb.px(35, 18 + bob, "#ffffff");
    fb.px(34, 19 + bob, "#ffffff", 0.6);
    fb.px(36, 19 + bob, "#ffffff", 0.6);
    fb.px(35, 20 + bob, "#ffffff", 0.6);
  }
  fb.text(project.title, 45, 20, "#ffffff", { shadow: "#050824" });
  fb.text(project.sub, 45, 31, COLOURS.dim);
  fb.text(project.fresh ? "LATEST" : "", 45, 41, COLOURS.gold);
  // Stack chips
  let x = 6;
  project.stack.forEach((item, i) => {
    const w = chip(fb, x, 54, item, project.colour, still ? -1 : (f / CARD.FRAMES) * 3.2 - i * 0.9);
    x += w + 3;
  });
  // Call to action
  const nudge = still ? 0 : Math.floor(f / 6) % 2;
  const cta = project.visibility === "PUBLIC" ? "CODE ON GITHUB" : "SEE PORTFOLIO";
  fb.text(cta, 6, 67, COLOURS.text);
  fb.text(">", 6 + textW(cta) + 4 + nudge, 67, COLOURS.gold);
  return fb;
}
