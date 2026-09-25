/**
 * The site's few constants of style, for the pieces that write their own
 * stylesheets: the inks, the blue, the two cuts of the type that are not
 * the page's own, and the curve big things settle on.
 */

/** The ink: text, the controls, the contents' words. */
export const INK = "#2b2722";
/** The rope's blue: one blue for the whole site. */
export const BLUE = "#2f6df6";
/** Medium is a family of its own (--font-neue-montreal-extra; see
 *  globals.css in the web app): anything at 500 has to name it, or the
 *  browser fakes the weight from Regular. */
export const MEDIUM = `var(--font-neue-montreal-extra), var(--font-neue-montreal), "Helvetica Neue", Arial, sans-serif`;
export const MONO = `var(--font-neue-montreal-mono), ui-monospace, Menlo, monospace`;
/** Quick out, long settle: the smooth moves that are not on a spring. */
export const SETTLE_EASE = "cubic-bezier(.22, 1, .36, 1)";

// ------------------------------------------------------------- the paper

/** The prints' paper, a seamless tile of Julio's plain scan
 *  (scripts/prepare-paper.mjs), and the size it is laid at: at 512px the
 *  fibres are about print scale on a laptop. The sheet (the project
 *  window) lays its own scan at the same scale, so a print picked up
 *  keeps its grain. */
export const PAPER_TILE = "/paper/tile.webp";
export const PAPER_TILE_SIZE = "512px";
/** Under the paper while it loads, and where the tile is not: its own
 *  off-white. */
export const PAPER_BASE = "#f3f0ea";
/** A print's shadow at rest on the mat: a hairline, a contact shadow and a
 *  soft one. Three layers, the same count as the lifted and the resting
 *  sheet's, so the window can interpolate between them. */
export const PRINT_SHADOW =
  "0 0 0 1px rgba(43, 39, 34, .16), 0 1px 2px rgba(0, 0, 0, .10), 0 10px 24px rgba(0, 0, 0, .16)";
/** A print's frame: the paper round the picture, px, and the band under
 *  it with the blurb and the pills. */
export const PRINT_PAD = 14;
export const PRINT_BAND = 64;
