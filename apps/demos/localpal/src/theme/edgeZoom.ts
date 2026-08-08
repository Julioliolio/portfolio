/**
 * Tunable config for the edge-zoom gesture (Snap-Map style): put a finger on
 * the LEFT or RIGHT screen edge and slide it VERTICALLY — up zooms the camera
 * in, down zooms out, continuously, anchored at the screen centre. While the
 * finger is down, a black "goo" blob bulges in from the edge and rides the
 * finger (the reference's meniscus around the thumb). The blob's size follows
 * the finger's HORIZONTAL distance from the edge — hugging the edge it's a
 * sliver, at `growDistance` px inward it reaches full size — and on release it
 * springs back into the edge. The map stays full-screen throughout.
 *
 * Paste tuned values back here to persist (same pattern as floatShadow.ts).
 * The blob's enter/exit spring is the `morph` motion role (Lab → Motion).
 */
export type EdgeZoomConfig = {
  /** Px from the L/R edge where the gesture can begin (the catch strip). */
  edgeMargin: number;
  /** Finger px of vertical travel per camera zoom level (lower = faster). */
  pxPerZoom: number;
  /**
   * Camera zoom floor/ceiling for the gesture. A long drag would otherwise fly
   * out past Spain (or into blank over-zoomed tiles) and COMMIT there — the
   * floor is the metro extent (every pin in view), the ceiling street level.
   */
  minZoom: number;
  maxZoom: number;
  /** How far the blob bulges into the screen, px. */
  blobWidth: number;
  /** Vertical extent of the blob, px (tails taper back to the edge). */
  blobHeight: number;
  /** Finger px from the edge at which the blob reaches full size. */
  growDistance: number;
  /** Blob fill — the reference is pure black goo. */
  blobColor: string;
};

// Hand-tuned to the reference: ~56px bulge, ~340px tall meniscus, and a zoom
// rate where a half-screen slide (~380px) sheds/gains ~5 levels.
export const defaultEdgeZoom: EdgeZoomConfig = {
  edgeMargin: 26,
  pxPerZoom: 75,
  minZoom: 10.4,
  maxZoom: 18,
  blobWidth: 56,
  blobHeight: 340,
  growDistance: 90,
  blobColor: '#000',
};
