/**
 * Tunable config for the "floating squircle" effect.
 * The contact shadow is the squircle's own silhouette, squashed vertically
 * (scaleY) and blurred — as if the squircle casts its shape on the floor.
 * Defaults measured/tuned from the Figma reference. The Lab screen edits a copy
 * of this live; paste tuned values back here to make them the app-wide default.
 */
export type FloatShadow = {
  /** Shadow color as an "r,g,b" string (used in rgba()). */
  color: string;
  /** Contact (floor) shadow peak opacity, 0–1. */
  contactOpacity: number;
  /** Contact shadow blur in px. */
  contactBlur: number;
  /** Contact shape width as a fraction of the squircle width. */
  contactWidthRatio: number;
  /** Vertical scale of the squircle silhouette (1 = full, 0.3 = flat floor). */
  contactSquash: number;
  /** Px to push the contact shadow lower (higher = floats more). */
  contactOffset: number;
  /** Ambient near shadow opacity (0 1px 2px). */
  ambientNear: number;
  /** Ambient far shadow opacity (0 0 2px). */
  ambientFar: number;
};

// Matched to the Figma floating-squircle reference (node 1320:947): a soft,
// even ambient shadow all around the tile plus a gentle, diffuse contact pool
// just below it — a light "floating" whisper, not a hard drop shadow.
export const defaultFloatShadow: FloatShadow = {
  color: "0,29,51",
  contactOpacity: 0.14,
  contactBlur: 9,
  contactWidthRatio: 0.9,
  contactSquash: 0.24,
  contactOffset: 0,
  ambientNear: 0.1,
  ambientFar: 0.16,
};

/**
 * Tiny "point" shadow — a small, barely-blurred dark ellipse marking the ground
 * spot a floating pin sits over. Additive: it appears only while a pin is
 * selected (the venue lozenge float / focused peer tile), as a sharper anchor
 * point inside the diffuse contact pool. Lab-tunable from the Shadows tab.
 */
export type PointShadow = {
  /** Shadow color as an "r,g,b" string (used in rgba()). */
  color: string;
  /** Peak opacity, 0–1. */
  opacity: number;
  /** Blur in px — keep small so it reads as a point, not a pool. */
  blur: number;
  /** Ellipse width in px. */
  width: number;
  /** Ellipse height as a fraction of width (perspective squash). */
  squash: number;
  /** Px below the pin's bottom edge. */
  offset: number;
};

export const defaultPointShadow: PointShadow = {
  color: "0,29,51",
  opacity: 0.62,
  blur: 1.75,
  width: 14.5,
  squash: 0.15,
  offset: 2,
};

/**
 * "Photo avatar" shadow (Figma 1355:1464): a single soft shadow that hugs the
 * squircle on every side, no offset, no ground/contact shadow. Used for user
 * photo tiles that aren't the "own user" map avatar (which keeps the fuller
 * floating-squircle treatment with a contact shadow below it).
 */
export const avatarPhotoShadow: Partial<FloatShadow> = {
  color: "0,0,0",
  contactOpacity: 0,
  ambientNear: 0,
  ambientFar: 0.3,
};
