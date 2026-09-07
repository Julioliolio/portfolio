/**
 * Prepares the clay cursor images for the web app.
 *
 * Input: source-assets/cursor/ (gitignored; or a dir passed as argv[2]) containing
 *   arrow-1.png..arrow-N.png — boil frames of the clay arrow (transparent
 *     background), each a separate photo of the same arrow re-posed slightly
 *   arrow.png                — single-frame fallback if no numbered frames
 *   arrow-pointer-1.png..N   — pointing-hand state shown over interactive
 *     elements, same numbering convention
 * Output: apps/web/public/cursor/<name>-<i>.webp — one file per boil frame,
 *   lossy WebP with alpha at TARGET_HEIGHT (2x the ~48px display size).
 *   The set has to stay small: every frame is fetched on first load so the
 *   boil never flashes a missing image.
 *
 * Frames are exported individually, so their canvases are not registered to
 * each other. Each frame is trimmed to its alpha bounding box, then padded to
 * the union size so every emitted frame has identical dimensions and the
 * hotspot stays put while the outline boils. The ClayCursor component cycles
 * them at a stop-motion rate and relies on the shared dimensions for hotspot
 * math. Registration differs per variant:
 *   arrow          — anchored at the top-left corner, where the arrow tip is
 *   arrow-pointer  — anchored at the index fingertip: the topmost opaque run
 *                    of each frame, which sits part-way across the image, so
 *                    frames are shifted horizontally to line their tips up.
 *                    The script prints the resulting hotspot fraction; copy
 *                    it into POINTER_HOTSPOT in ClayCursor.tsx if it moves.
 *
 * If no source exists at all, a placeholder is rasterized from an inline SVG
 * (white fill, fat black outline) into every frame slot so the cursor system
 * works before the real photos land. Sources are not committed; outputs are.
 * Rerun after dropping/updating source PNGs:
 *   node scripts/prepare-cursor.mjs
 */
import { existsSync, mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const TARGET_HEIGHT = 96; // 2x the ~48px display size — sharp on retina, tiny on the wire
const WEBP = { quality: 82, alphaQuality: 90, effort: 6 };
// Slots emitted when only a single/placeholder source exists. Real frame
// sources are picked up open-endedly (arrow-1.png, arrow-2.png, ... until a
// gap) — keep the component's frame list in sync with what lands on disk.
const FALLBACK_FRAME_COUNT = 3;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const inputDir = process.argv[2] ?? join(root, "source-assets/cursor");
const outDir = join(root, "apps/web/public/cursor");
mkdirSync(outDir, { recursive: true });

// Classic arrow silhouette approximating the clay photo, used only until
// the real asset exists. viewBox is oversized so the stroke isn't clipped.
const PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -14 128 168">
  <path
    d="M 8 0 L 8 118 L 36 92 L 52 138 L 74 129 L 58 84 L 96 82 Z"
    fill="#f2f0ee" stroke="#181818" stroke-width="16"
    stroke-linejoin="round"
  />
</svg>`;

/** Source frames for a variant: consecutively numbered boil frames, else the
 * single PNG repeated into every slot, else null. */
function findSources(name) {
  const frames = [];
  for (let i = 1; ; i++) {
    const p = join(inputDir, `${name}-${i}.png`);
    if (!existsSync(p)) break;
    frames.push(p);
  }
  if (frames.length > 0) return frames;
  const single = join(inputDir, `${name}.png`);
  if (existsSync(single)) return Array(FALLBACK_FRAME_COUNT).fill(single);
  return null;
}

for (const name of ["arrow", "arrow-pointer"]) {
  const sources = findSources(name);

  if (!sources) {
    if (name === "arrow") {
      // Placeholder into every slot so the cycling component still works.
      const buf = await sharp(Buffer.from(PLACEHOLDER_SVG), { density: 300 })
        .resize({ height: TARGET_HEIGHT })
        .webp(WEBP)
        .toBuffer();
      for (let i = 1; i <= FALLBACK_FRAME_COUNT; i++) {
        await sharp(buf).toFile(join(outDir, `${name}-${i}.webp`));
      }
      console.log(
        `${name}-*.webp  (placeholder — drop real PNGs in ${inputDir})`,
      );
    } else {
      // No pointer asset yet: the component falls back to the arrow frames,
      // so emit nothing rather than a wrong placeholder.
      console.log(`${name}-*.webp  skipped (no source yet)`);
    }
    continue;
  }

  // Trim every frame to its alpha bbox, then pad to the union size anchored
  // top-left (the tip corner) so the frames stay registered at the tip.
  const trimmed = await Promise.all(
    sources.map((src) =>
      sharp(src)
        .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer({ resolveWithObject: true }),
    ),
  );
  // Horizontal anchor per frame: 0 for the arrow (tip at the corner), the
  // fingertip column for the pointer. Frames are padded on the left so all
  // anchors land on the same column, then on the right to a common width.
  const anchors = await Promise.all(
    trimmed.map(({ data }) =>
      name === "arrow-pointer" ? fingertipX(data) : Promise.resolve(0),
    ),
  );
  const anchorX = Math.max(...anchors);
  const unionW = Math.max(
    ...trimmed.map(({ info }, i) => anchorX - anchors[i] + info.width),
  );
  const unionH = Math.max(...trimmed.map(({ info }) => info.height));

  for (let i = 0; i < trimmed.length; i++) {
    const { data, info } = trimmed[i];
    const outPath = join(outDir, `${name}-${i + 1}.webp`);
    const left = anchorX - anchors[i];
    // Two passes: sharp always applies resize before extend within one
    // pipeline, which would pad *after* scaling and desync the frame sizes.
    const padded = await sharp(data)
      .extend({
        left,
        right: unionW - info.width - left,
        bottom: unionH - info.height,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    await sharp(padded)
      .resize({ height: TARGET_HEIGHT })
      .webp(WEBP)
      .toFile(outPath);
    console.log(
      `${name}-${i + 1}.webp  ${(statSync(outPath).size / 1024).toFixed(0)}KB`,
    );
  }
  if (name === "arrow-pointer") {
    console.log(
      `  -> ${trimmed.length} frames; fingertip hotspot x = ${(
        anchorX / unionW
      ).toFixed(
        3,
      )} — keep POINTER_FRAMES / POINTER_HOTSPOT in ClayCursor.tsx in sync`,
    );
  }
}

/** Column of the index fingertip in a trimmed frame: the alpha-weighted
 * centre of the opaque pixels in the top 1% of rows (the tip is the highest
 * point of the hand, and rounded, so a few rows average out the noise). */
async function fingertipX(png) {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rows = Math.max(1, Math.round(info.height * 0.01));
  let sum = 0;
  let n = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        sum += x;
        n++;
      }
    }
  }
  return n ? Math.round(sum / n) : 0;
}
