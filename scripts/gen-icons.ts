/**
 * Rasterizes public/icon.svg into the PWA icon sizes.
 * Usage: npx tsx scripts/gen-icons.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const SVG_PATH = resolve(process.cwd(), "public/icon.svg");
const OUT_DIR = resolve(process.cwd(), "public");

const SIZES: Array<{ size: number; name: string }> = [
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
  { size: 180, name: "apple-touch-icon.png" }, // iOS expects this name
  { size: 32, name: "favicon-32.png" },
  { size: 16, name: "favicon-16.png" },
];

async function main() {
  const svg = readFileSync(SVG_PATH);
  for (const { size, name } of SIZES) {
    const out = resolve(OUT_DIR, name);
    await sharp(svg)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(out);
    console.log(`✓ ${name} (${size}×${size})`);
  }
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
