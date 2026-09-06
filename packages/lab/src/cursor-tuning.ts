/**
 * Live tuning for the site-wide clay cursor (apps/web ClayCursor).
 *
 * The cursor reads `clayCursorTuning` every animation frame, so mutating it
 * takes effect immediately — the /lab/clay-cursor piece is a slider bench
 * over this object. Values reset on reload; once a feel is locked in, copy
 * it into CLAY_CURSOR_DEFAULTS here.
 *
 * Physics model (matched to the Tramuntana hover-card feel the user
 * referenced): the tip is glued to the real pointer — position is never
 * animated. The body leans a few degrees with pointer velocity, ramping in
 * softly, and when the pointer stops it EASES back upright with no bounce
 * (near-critical damping). The weight reads from the slow ramp and glide,
 * not from wobble.
 *
 * This lives in @portfolio/lab (not apps/web) so both the app cursor and
 * the lab piece can import the same module instance.
 */
export type ClayCursorTuning = {
  /** Rendered cursor height in px. */
  size: number;
  /** Deg of lean per px/s of horizontal pointer velocity. */
  tiltPerVx: number;
  /** Max lean in deg. */
  maxTilt: number;
  /** Spring toward the target lean. Lower = slower, heavier ramp. */
  tiltStiffness: number;
  /** Near 2*sqrt(stiffness) = eases back with no bounce (the card feel). */
  tiltDamping: number;
  /** Velocity smoothing. Lower = softer, heavier onset. */
  velocitySmoothing: number;
  /** Squish scale while a button is held. */
  pressScale: number;
  /** Spring for the squish scale. */
  scaleStiffness: number;
  /** Damping for the squish scale. */
  scaleDamping: number;
  /** Stop-motion boil rate, frames/s. 0 disables the boil. */
  boilFps: number;
  /**
   * Height of the pointing-hand variant as a multiple of `size`.
   *
   * The two variants are exported to the same pixel height, but height is
   * not what the eye reads: the arrow is one solid wedge running corner to
   * corner, while the hand spends its top third on a thin raised finger, so
   * at equal height the hand's body reads smaller than the arrow. This
   * scales the hand back up so the swap has no visible size pop.
   */
  pointerScale: number;
  /**
   * Arrow<->hand crossfade length in ms. 0 = hard cut. A hover that
   * flickers reverses the fade mid-way rather than restarting it.
   */
  swapMs: number;
  /**
   * How far the cursor pinches in at the midpoint of the swap, as a
   * fraction of its size (0 = pure crossfade, 1 = collapses to the tip and
   * re-grows as the other shape).
   */
  swapSquish: number;
  /**
   * Stop-motion beat for the body — the lean, the press squish and the
   * swap pinch — in cuts per second. 0 = the springs are drawn every
   * frame. Above 0 the physics still runs every frame, but what is drawn
   * only catches up on the beat, so the body moves in held poses like the
   * boil. The tip stays glued to the pointer either way: position is
   * never quantised.
   */
  stepFps: number;
};

// Hand-tuned by Julio on the /lab/clay-cursor bench (2026-08-15, swap
// revisited 2026-09-04): pronounced lean (up to 15deg), fast stiff
// response, deep press squish; return has a touch of bounce (zeta ~0.41 at
// this stiffness). The arrow<->hand swap is a quick 100ms fade with a
// light pinch — enough to read as re-forming without feeling laggy.
// Body beat set to 10 on 2026-09-06: the lean and squish are drawn in
// held poses ten times a second, the stop-motion treatment (see
// /lab/stop-motion-trial); the tip still tracks the pointer every frame.
export const CLAY_CURSOR_DEFAULTS: Readonly<ClayCursorTuning> = Object.freeze({
  size: 48,
  tiltPerVx: 0.01,
  maxTilt: 15,
  tiltStiffness: 600,
  tiltDamping: 20,
  velocitySmoothing: 28,
  pressScale: 0.77,
  scaleStiffness: 600,
  scaleDamping: 24,
  boilFps: 6,
  pointerScale: 1.15,
  swapMs: 100,
  swapSquish: 0.2,
  stepFps: 10,
});

/** Mutable singleton — the cursor reads it per frame, the lab tuner writes it. */
export const clayCursorTuning: ClayCursorTuning = { ...CLAY_CURSOR_DEFAULTS };

export type ClayCursorVariant = "arrow" | "pointer";

/**
 * Bench-only override of which shape the cursor shows. `null` (the default)
 * lets hover decide; "arrow" / "pointer" pin it so the arrow<->hand swap
 * can be played and inspected without hunting for a link. Kept separate
 * from the numeric tuning so it never ends up in copied defaults.
 */
export const clayCursorOverride: { variant: ClayCursorVariant | null } = {
  variant: null,
};
