// The skill "loadout": six categories on one row each, every skill a chip. A shine sweeps across the chips,
// category by category. Logical size 414 x 90, shown at 2x.
import { FB } from "./fb.mjs";
import { COLOURS, chip, frame, starfield } from "./ui.mjs";

export const SKILLS = { W: 414, H: 90, FRAMES: 48, DELAY: 80 };

const ROWS = [
  { label: "LANGUAGES", colour: COLOURS.line, items: ["PHP", "JAVASCRIPT", "TYPESCRIPT", "PYTHON", "SQL", "C#"] },
  { label: "FRAMEWORKS", colour: COLOURS.gold, items: ["LARAVEL", "REACT", "NODE.JS", "FLASK", "TAILWIND", "BOOTSTRAP"] },
  { label: "DATABASES", colour: COLOURS.green, items: ["MYSQL", "POSTGRESQL", "SQLITE", "SUPABASE"] },
  { label: "DATA + ML", colour: COLOURS.pink, items: ["TENSORFLOW", "KERAS", "PANDAS", "NUMPY", "DEEP LEARNING"] },
  { label: "AI + LLM", colour: COLOURS.orange, items: ["CLAUDE", "OPENAI API", "FUNCTION CALLING", "PROMPTING", "EVALS"] },
  { label: "TOOLS", colour: COLOURS.violet, items: ["GIT + GITHUB", "CI + TESTING", "RBAC + 2FA", "CLOUDFLARE", "PWA"] },
];

export function skillsFrame(f, still = false) {
  const fb = new FB(SKILLS.W, SKILLS.H, COLOURS.bg);
  starfield(fb, still ? 0 : f, 12, 60, 1e9);
  frame(fb);
  ROWS.forEach((row, i) => {
    const y = 6 + i * 13;
    fb.rect(6, y + 1, 2, 7, row.colour);
    fb.text(row.label, 12, y + 1, row.colour);
    // The shine moves along the row; each row starts a little later than the one above
    const sweep = ((f - i * 5 + SKILLS.FRAMES * 2) % SKILLS.FRAMES) / 14; // 0..~3.4 chips per cycle
    let x = 74;
    row.items.forEach((item, k) => {
      const w = chip(fb, x, y, item, row.colour, still ? -1 : sweep - k * 0.55);
      x += w + 4;
    });
  });
  return fb;
}
