/**
 * Prepares the brand plate — the small "Julio(liolio)" lightbox, the
 * site's home mark (packages/lab/src/pieces/brand-sign), which the
 * hello sign becomes on the scroll (packages/lab/src/sign-travel.tsx).
 *
 * Input:  source-assets/brand/front.png — the plate at rest, a
 *         transparent PNG, any size.
 * Output: apps/web/public/brand/front.webp — trimmed to its alpha and
 *         scaled to 400 tall (it shows at about 7vh, like the road
 *         signs).
 *
 * Prints its aspect (w / h) — paste it into BRAND_ASPECT in
 * packages/lab/src/brand.tsx so the plate's box is sized before the
 * photo decodes.
 *
 * Usage: node scripts/prepare-brand.mjs
 * Sources are not committed (source-assets is gitignored); the output is.
 */
import { mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "apps/web/public/brand");
const outPath = join(outDir, "front.webp");

mkdirSync(outDir, { recursive: true });
const info = await sharp(join(root, "source-assets/brand/front.png"))
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .resize({ height: 400 })
  .webp({ quality: 80 })
  .toFile(outPath);
console.log(
  `brand/front.webp  ${info.width}x${info.height}  aspect ${(info.width / info.height).toFixed(3)}  ${(statSync(outPath).size / 1024).toFixed(0)}KB`,
);
