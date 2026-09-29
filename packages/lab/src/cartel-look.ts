/**
 * The cartel's look, shared: its drop shadow and its lightbox glow, as
 * the sign (pieces/cartel) paints them and as the travel's layer
 * (sign-travel.tsx) paints its stand-in for the sign, so a hand-off
 * between the two is seamless. Every length is a share of the sign's
 * height, so the same look reads at any size.
 */

export type ShadowParams = {
  x: number; // horizontal offset, % of sign height (positive = right)
  y: number; // vertical offset, % of sign height (positive = down)
  blur: number; // softness, % of sign height
  opacity: number; // 0 disables the filter entirely
};

// Julio's numbers off the /lab/cartel sliders on the mat (2026-09-26):
// thrown a little down and to the right, soft-edged, darker than on the
// white wall.
export const SHADOW_DEFAULTS: ShadowParams = {
  x: 6,
  y: 6,
  blur: 2,
  opacity: 0.34,
};

// The lightbox glow: a blurred copy of the current photo screen-blended
// over the stack. Screen can only lighten, and only by what the source
// pixel carries — so the lit white face blooms while the dark frame and
// the wall stay put, and the blur bleeds the light a little past the
// sign's edges. Reads as exposure pushed just where the lamp shines.
export type GlowParams = {
  blur: number; // bleed radius, % of sign height
  strength: number; // overlay opacity; 0 removes the layer entirely
  boost: number; // brightness on the blurred copy — the exposure push
  warmth: number; // sepia on the blown-out whites, toward lamp-warm
};

// Read off the same mockup, where the face is the photo's own cream
// (a few points lighter, no more): the push is all but off — a faint,
// warm lift where the tubes are, nothing blown to white.
export const GLOW_DEFAULTS: GlowParams = {
  blur: 0,
  strength: 0.35,
  boost: 1.06,
  warmth: 0.9,
};

// The window the glow shines through: where the tube bank actually sits
// behind the acrylic (marked by Julio on the front photo, mapped into
// container % via the sign's opaque bbox in the frame canvas). Two
// crossed linear-gradient masks intersect into a feathered rectangle —
// full glow inside, fading out over the feather distance. The mask lives
// on the glow layer only and is fixed in the stack's space, so it rides
// the transform but not the angle cuts; the band stays near the sign's
// center in every photo, so the drift is invisible at this feather.
const GLOW_CORE = {
  left: 27, // container %, band edges
  right: 74,
  top: 17,
  bottom: 92,
  featherX: 18, // fade-out distance past each edge, container %
  featherY: 14,
};

export const GLOW_MASK =
  `linear-gradient(to right, transparent ${GLOW_CORE.left - GLOW_CORE.featherX}%, ` +
  `black ${GLOW_CORE.left}%, black ${GLOW_CORE.right}%, ` +
  `transparent ${GLOW_CORE.right + GLOW_CORE.featherX}%), ` +
  `linear-gradient(to bottom, transparent ${GLOW_CORE.top - GLOW_CORE.featherY}%, ` +
  `black ${GLOW_CORE.top}%, black ${GLOW_CORE.bottom}%, ` +
  `transparent ${GLOW_CORE.bottom + GLOW_CORE.featherY}%)`;

/** A share of the sign's height (`height`, any CSS length), as a
 *  length. */
const share = (height: string, v: number) =>
  `calc((${height}) * ${(v / 100).toFixed(4)})`;

/** The shadow as a filter for a sign `height` tall, or undefined when
 *  off. */
export function cartelShadow(
  height: string,
  p: ShadowParams = SHADOW_DEFAULTS,
): string | undefined {
  return p.opacity > 0
    ? `drop-shadow(${share(height, p.x)} ${share(height, p.y)} ${share(height, p.blur)} rgba(0, 0, 0, ${p.opacity}))`
    : undefined;
}

/** The glow layer's filter for a sign `height` tall. */
export function cartelGlow(height: string, p: GlowParams = GLOW_DEFAULTS) {
  return `blur(${share(height, p.blur)}) brightness(${p.boost}) sepia(${p.warmth})`;
}
