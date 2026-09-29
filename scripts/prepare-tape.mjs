/**
 * Prepares the tape arrow — the strip of paper tape, torn and stuck to
 * the mat as an arrow, that is the landing's scroll cue
 * (packages/lab/src/tape.tsx; /lab/tape-arrow is its bench).
 *
 * Input:  source-assets/tape/arrow.png — a transparent PNG of the tape,
 *         pointing down, any size.
 * Output: apps/web/public/tape/arrow.webp — trimmed to its alpha and
 *         scaled to 800 tall (it shows at about 5vh, and much bigger
 *         on the bench's close-up).
 *
 * Prints the aspect (w / h) — paste it into TAPE_ASPECT in tape.tsx so
 * the slot is sized before the photo decodes.
 *
 * Usage: node scripts/prepare-tape.mjs
 * The source is not committed (source-assets is gitignored); the output is.
 */
import { mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const HEIGHT = 800;
const WEBP_QUALITY = 82;

const outDir = join(root, "apps/web/public/tape");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "arrow.webp");
const info = await sharp(join(root, "source-assets/tape/arrow.png"))
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .resize({ height: HEIGHT })
  .webp({ quality: WEBP_QUALITY })
  .toFile(outPath);
console.log(
  `tape/arrow.webp  ${info.width}x${info.height}  aspect ${(info.width / info.height).toFixed(3)}  ${(statSync(outPath).size / 1024).toFixed(0)}KB`,
);
