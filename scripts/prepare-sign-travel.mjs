/**
 * Prepares the frames of the sign's travel — the hello screen's tall
 * sign leaving for the corner, where it becomes the brand plate
 * (packages/lab/src/sign-travel.tsx) — and the plate itself, the site's
 * home mark (packages/lab/src/pieces/brand-sign).
 *
 * Input: transparent PNGs, any size —
 *   source-assets/sign-travel/  sink, launch, smear, land — the tall
 *                               sign deformed by hand, one per held
 *                               cut (see the storyboard in sign-travel.tsx).
 *                               The smear is drawn left-to-right; the
 *                               travel turns it along the path.
 *   source-assets/brand/        front — the "Julio(liolio)" plate at rest.
 * Output: apps/web/public/sign-travel/<name>.webp and
 *         apps/web/public/brand/front.webp — each trimmed to its alpha
 *         and scaled: the travel frames to a longest side of 1600 (they
 *         show at up to the hello sign's size), the plate to 400 tall
 *         (it shows at about 7vh, like the road signs).
 *
 * Every frame keeps its own canvas: unlike the cartel's grid, the shapes
 * have nothing in common, so the travel sizes each cut's box by the
 * frame's aspect. Prints each aspect (w / h) — paste them into
 * FRAMES in packages/lab/src/sign-travel.tsx and BRAND_ASPECT in
 * packages/lab/src/brand.tsx so the boxes are sized before the photos
 * decode.
 *
 * Usage: node scripts/prepare-sign-travel.mjs
 * Sources are not committed (source-assets is gitignored); outputs are.
 */
import { mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const WEBP_QUALITY = 80;

const SETS = [
  {
    from: "source-assets/sign-travel",
    to: "apps/web/public/sign-travel",
    frames: ["sink", "launch", "smear", "land"],
    // The longest side; the frames are wide or tall as their pose is.
    size: 1600,
  },
  {
    from: "source-assets/brand",
    to: "apps/web/public/brand",
    frames: ["front"],
    size: 400,
    byHeight: true,
  },
];

let total = 0;
for (const set of SETS) {
  const outDir = join(root, set.to);
  mkdirSync(outDir, { recursive: true });
  for (const name of set.frames) {
    const trimmed = sharp(join(root, set.from, `${name}.png`)).trim({
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
    const outPath = join(outDir, `${name}.webp`);
    const info = await (
      set.byHeight
        ? trimmed.resize({ height: set.size })
        : trimmed.resize({
            width: set.size,
            height: set.size,
            fit: "inside",
            withoutEnlargement: false,
          })
    )
      .webp({ quality: WEBP_QUALITY })
      .toFile(outPath);
    const size = statSync(outPath).size;
    total += size;
    console.log(
      `${set.to.replace("apps/web/public/", "")}/${name}.webp  ${info.width}x${info.height}  aspect ${(info.width / info.height).toFixed(3)}  ${(size / 1024).toFixed(0)}KB`,
    );
  }
}
console.log(`\ntotal: ${(total / 1024).toFixed(0)}KB`);
