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
};

// Hand-tuned by Julio on the /lab/clay-cursor bench (2026-08-15):
// pronounced lean (up to 15deg), fast stiff response, deep press squish;
// return has a touch of bounce (zeta ~0.41 at this stiffness).
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
});

/** Mutable singleton — the cursor reads it per frame, the lab tuner writes it. */
export const clayCursorTuning: ClayCursorTuning = { ...CLAY_CURSOR_DEFAULTS };
