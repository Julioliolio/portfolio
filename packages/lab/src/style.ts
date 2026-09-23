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
