// The skill "loadout": six categories, every skill a chip, chips wrapping onto further lines when a category
// is long. The names and lists are identical to the Skills page of the portfolio (app/data.ts). Shown at 2x.
import { FB } from "./fb.mjs";
import { COLOURS, chip, frame, starfield, textW } from "./ui.mjs";

export const SKILLS = { W: 414 };

const ROWS = [
  { label: "LANGUAGES", colour: COLOURS.line, items: ["PHP", "JavaScript", "TypeScript", "Python", "SQL", "C#"] },
  { label: "FRAMEWORKS", colour: COLOURS.violet, items: ["Laravel", "React", "Node.js", "Flask", "Tailwind CSS", "Bootstrap"] },
  { label: "DATABASES", colour: COLOURS.gold, items: ["MySQL", "PostgreSQL", "SQLite", "Supabase"] },
  { label: "DATA & ML", colour: COLOURS.pink, items: ["TensorFlow", "Keras", "Pandas", "NumPy", "Deep Learning", "Transfer Learning", "Ensemble Learning"] },
  { label: "AI & LLM", colour: COLOURS.line, items: ["Claude", "OpenAI API", "Function Calling", "Prompt Engineering", "Conversational Agents", "Workflow Automation", "LLM Evaluation", "Telegram Bot API"] },
  { label: "TOOLS", colour: COLOURS.violet, items: ["Git & GitHub", "CI & Automated Testing", "RBAC & 2FA", "Row Level Security", "Cloudflare", "PWA & Web Push", "AI-Assisted Development", "Microsoft Office"] },
];

const LEFT = 74;
const LINE = 12;

/** Lays the chips of one row out in lines: [{ item, x, line }]. */
function layout(items) {
  const placed = [];
  let x = LEFT;
  let line = 0;
  for (const item of items) {
    const w = textW(item.toUpperCase()) + 8;
    if (x + w > SKILLS.W - 6) {
      x = LEFT;
      line += 1;
    }
    placed.push({ item, x, line });
    x += w + 4;
  }
  return { placed, lines: line + 1 };
}

const LAID_OUT = ROWS.map((row) => ({ ...row, ...layout(row.items) }));
export const SKILLS_HEIGHT = 8 + LAID_OUT.reduce((n, row) => n + row.lines * LINE + 4, 0);

/** A still picture: the loadout does not move, so it stays easy to read. */
export function skillsFrame() {
  const fb = new FB(SKILLS.W, SKILLS_HEIGHT, COLOURS.bg);
  starfield(fb, 0, 12, 70, 1e9);
  frame(fb);
  let y = 6;
  for (const row of LAID_OUT) {
    fb.rect(6, y + 1, 2, 7, row.colour);
    fb.text(row.label, 12, y + 1, row.colour);
    for (const { item, x, line } of row.placed) chip(fb, x, y + line * LINE, item.toUpperCase(), row.colour);
    y += row.lines * LINE + 4;
  }
  return fb;
}
