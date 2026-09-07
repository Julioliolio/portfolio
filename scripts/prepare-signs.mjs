/**
 * Prepares the project road-sign photos for the web app.
 *
 * Input: a directory of transparent PNGs named by project slug —
 *   localpal.png, camper.png, convertr.png
 * Output: apps/web/public/signs/<slug>.webp — each sign trimmed to its
 * alpha bounding box and scaled to ONE shared height, keeping its own
 * width. Real signs of the same series are the same height and as wide as
 * their text needs, so the stack is sized by height in the component and
 * the widths fall out of the photos.
 *
 * Prints each sign's width / height ratio — paste those into SIGNS in
 * packages/lab/src/pieces/road-signs/index.tsx so the <img> boxes are sized
 * before the photos decode (no layout jump on first paint).
 *
 * Usage: node scripts/prepare-signs.mjs [input-dir]
 *   default input: source-assets/signs (gitignored, in-repo)
 *
 * Sources are not committed (originals live in source-assets/signs, gitignored);
 * outputs are.
 */
import { mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SLUGS = ["localpal", "camper", "convertr"];

// The stack renders signs at roughly 60-100px tall (hovered ~1.2x), so
// 400px covers 3x displays with headroom for the bench's size slider.
const TARGET_HEIGHT = 400;
const WEBP_QUALITY = 85;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const inputDir = process.argv[2] ?? join(root, "source-assets/signs");
const outDir = join(root, "apps/web/public/signs");
mkdirSync(outDir, { recursive: true });

let total = 0;
for (const slug of SLUGS) {
  const outPath = join(outDir, `${slug}.webp`);
  const info = await sharp(join(inputDir, `${slug}.png`))
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ height: TARGET_HEIGHT })
    .webp({ quality: WEBP_QUALITY })
    .toFile(outPath);
  const size = statSync(outPath).size;
  total += size;
  console.log(
    `${slug}.webp  ${info.width}x${info.height}  aspect ${(
      info.width / info.height
    ).toFixed(3)}  ${(size / 1024).toFixed(0)}KB`,
  );
}
console.log(
  `\ntotal: ${(total / 1024).toFixed(0)}KB for ${SLUGS.length} signs`,
);
