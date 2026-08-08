/**
 * Map pin clustering — how event pins behave when they crowd each other
 * (Bump-style: density is solved by CURATION first, clustering second):
 *
 * 0. TIERS (see `defaultMapDensity` + MapDensityProvider): the zoom range is
 *    split into far / mid / near. Far = the map hides all content behind one
 *    aggregate count pill (only your location stays). Mid = only the top
 *    `tileBudget` pins by priority render as tiles; the rest are subtle dots.
 *    Near = everything, governed by the collision mechanics below.
 * 1. STACKS: pins of the same kind that crowd each other glide together into
 *    one stacked container (tilted overlapping tiles, same language as
 *    AvatarCluster) with a count badge — peer stacks AND venue stacks.
 *    Tapping it zooms in just enough for the members to split apart.
 * 2. DEMOTION: in a mixed group, whatever doesn't match the most interesting
 *    pin's kind (highest `priority` in the pin data) shrinks into small
 *    brand-colored dots, painted UNDER the full tiles. Zoom is the only
 *    variable, so zooming out progressively demotes/merges and zooming back
 *    in restores.
 *
 * Tunables follow the theme convention: edit here to change app-wide feel.
 */
export const defaultMapCluster = {
  /** Two pins collide when closer than pinSize * this (screen px). */
  collideFactor: 1.3,
  /** Demoted-pin dot diameter (px). */
  dotSize: 4,
  /** White ring around a demoted dot so it lifts off the map (px). */
  dotStroke: 1.25,
  /** Stacked members fan out horizontally by pinSize * this. */
  stackSpread: 0.58,
  /** Most tiles a stack ever fans out — extra members collapse into the centre
   *  and the count badge carries the true total. Keeps a 20-pin pile-up reading
   *  as the usual 3-tile cluster (like AvatarCluster), not a long line. */
  stackMaxTiles: 3,
  /** Playful tilts (deg) for stacked tiles, front-to-back. */
  stackTilts: [-9, 8, 5],
  /** Small vertical offsets (px) for stacked tiles, front-to-back. */
  stackLift: [0, -2, 2],
  /** Count badge diameter as a fraction of pinSize (min 18px). */
  badgeRatio: 0.6,
  /** Tap-to-split zooms until members clear collide radius * this. */
  splitMargin: 1.15,
  /** ...but always zooms in at least this many levels. */
  minSplitZoom: 0.8,
  /** ...and never more than this many (near-identical coords would otherwise
   *  compute a dive past the deepest useful zoom). */
  maxSplitZoom: 3,
  /** Tapping a demoted dot zooms in by this much toward it. */
  dotZoomStep: 1.3,
};

/**
 * Zoom-tier density curation (Bump-style progressive disclosure) — the map
 * earns detail as you zoom in, instead of representing every pin at every
 * zoom. Live-tunable from Lab → Squircles → "Map density"; paste tuned values
 * back here to persist.
 *
 * far  (zoom < farZoom): tiles hide behind the place crest (PlaceHint); the
 *      quiet dots linger until `dotsZoom`, then fade too — a staged exit,
 *      not one cliff. Tap the crest to dive back in.
 * mid  (farZoom ≤ zoom < nearZoom): a GRADUATED budget — near the top of the
 *      band virtually every pin keeps its tile (you can still map your own
 *      district), thinning linearly by `priority` down to `tileBudget` at the
 *      far edge. Pins shed one rank at a time as you zoom out, never in one
 *      drop. Everything over budget is a subtle dot (opacity below).
 * near (zoom ≥ nearZoom): every pin participates, collision rules only.
 *
 * Tier switches carry a ±hysteresis band so easing across a boundary can't
 * flicker pins between modes.
 */
export const defaultMapDensity = {
  /** Below this zoom: tiles hide behind the place crest. */
  farZoom: 12.6,
  /** Below this zoom the far-tier dots fade out too (set at/above farZoom to
   *  make everything vanish at once; below the camera's minZoom = never). */
  dotsZoom: 11.8,
  /** At/above this zoom: full detail (collision clustering only). */
  nearZoom: 15.2,
  /** Mid tier: the budget FLOOR — how few tiles survive right before the
   *  crest takes over. The budget slides from all-pins (at nearZoom) down to
   *  this (at farZoom). */
  tileBudget: 8,
  /** Opacity of demoted/over-budget dots — quiet texture, not markers. */
  dotOpacity: 0.55,
  /** Your own / joined plan tiles render pinSize * this (identity reads
   *  bigger than content, like Bump's own-avatar hierarchy). */
  ownPinScale: 1.2,
  /** Zoom padding either side of a tier boundary before the tier flips. */
  tierHysteresis: 0.12,
};

export type MapDensityConfig = typeof defaultMapDensity;
