// A tiny RGBA framebuffer for pixel art: every picture is composed pixel by pixel at its logical size and
// enlarged with nearest-neighbour scaling afterwards, so the pixels stay crisp. No dependencies except sharp.
import sharp from "sharp";
import { FONT } from "./pixel.mjs";

const cache = new Map();
/** "#rrggbb" -> [r, g, b]. */
export function rgb(hex) {
  if (!cache.has(hex)) {
    const n = parseInt(hex.slice(1), 16);
    cache.set(hex, [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
  }
  return cache.get(hex);
}

export class FB {
  constructor(width, height, background = "#000000") {
    this.w = width;
    this.h = height;
    this.data = Buffer.alloc(width * height * 4);
    this.fill(background);
  }

  fill(hex) {
    const [r, g, b] = rgb(hex);
    for (let i = 0; i < this.w * this.h; i += 1) {
      this.data[i * 4] = r;
      this.data[i * 4 + 1] = g;
      this.data[i * 4 + 2] = b;
      this.data[i * 4 + 3] = 255;
    }
  }

  /** One pixel; `a` (0..1) blends it over what is already there. */
  px(x, y, hex, a = 1) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
    const [r, g, b] = rgb(hex);
    const i = (y * this.w + x) * 4;
    if (a >= 1) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
    } else {
      this.data[i] = Math.round(this.data[i] * (1 - a) + r * a);
      this.data[i + 1] = Math.round(this.data[i + 1] * (1 - a) + g * a);
      this.data[i + 2] = Math.round(this.data[i + 2] * (1 - a) + b * a);
    }
  }

  rect(x, y, w, h, hex, a = 1) {
    for (let yy = 0; yy < h; yy += 1) for (let xx = 0; xx < w; xx += 1) this.px(x + xx, y + yy, hex, a);
  }

  /** Filled circle (or a ring when `inner` is given). */
  disc(cx, cy, radius, hex, inner = 0, a = 1) {
    const r2 = radius * radius;
    const i2 = inner * inner;
    for (let y = -radius; y <= radius; y += 1) {
      for (let x = -radius; x <= radius; x += 1) {
        const d = x * x + y * y;
        if (d <= r2 && d >= i2) this.px(cx + x, cy + y, hex, a);
      }
    }
  }

  /** A picture given as rows of characters plus a palette; "." is transparent. */
  blit(rows, palette, x, y, { flip = false, alpha = 1 } = {}) {
    rows.forEach((row, r) => {
      const chars = [...row];
      chars.forEach((ch, c) => {
        const colour = palette[ch];
        if (!colour) return;
        this.px(x + (flip ? chars.length - 1 - c : c), y + r, colour, alpha);
      });
    });
  }

  /** Bitmap-font text; `colour` is a hex string or a function (col, row, index) => hex | null. */
  text(text, x, y, colour, { size = 1, shadow = null } = {}) {
    const draw = (ox, oy, pick) => {
      [...text.toUpperCase()].forEach((ch, index) => {
        const glyph = FONT[ch] ?? FONT[" "];
        glyph.forEach((row, r) => {
          [...row].forEach((bit, c) => {
            if (bit !== "#") return;
            const hex = pick(index * 6 + c, r, index);
            if (hex) this.rect(x + ox + (index * 6 + c) * size, y + oy + r * size, size, size, hex);
          });
        });
      });
    };
    if (shadow) draw(size, size, () => shadow);
    draw(0, 0, typeof colour === "function" ? colour : () => colour);
  }

  /** A PNG enlarged `scale` times with crisp pixels. */
  async png(scale = 1) {
    let image = sharp(this.data, { raw: { width: this.w, height: this.h, channels: 4 } });
    if (scale !== 1) image = image.resize(this.w * scale, this.h * scale, { kernel: "nearest" });
    return image.png().toBuffer();
  }
}

/** Joins PNG buffers into an animated GIF. */
export async function gif(frames, delay, colours = 128) {
  return sharp(frames, { join: { animated: true } })
    .gif({ delay, loop: 0, effort: 10, dither: 0, colours, interFrameMaxError: 0 })
    .toBuffer();
}
