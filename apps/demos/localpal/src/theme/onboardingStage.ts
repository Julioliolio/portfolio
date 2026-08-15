/**
 * Onboarding stage — tuning for the toy-city playground behind the flow.
 *
 * The backdrop is NOT the real map: it's a decorative paper city (ToyMap.tsx,
 * rendering the Figma artwork assets/onboarding/toy-city-map.svg) — pale land
 * carved by chunky white streets, a sky-blue river clipping the top-right
 * corner, mint parks along the right edge — a stage set, not cartography. Your profile visibly builds ON it as
 * you answer: the name tag drops, the placeholder-grid avatar lands on the
 * mock photo step, every picked interest slaps a glyph sticker onto the
 * cluster. Only the final exit dives THROUGH the toy world into the real
 * MapLibre city beneath (the zoom-through jump).
 *
 * Everything here is a stage direction, not app UI: poses are gentle
 * step-to-step nudges (CSS transforms, wall-clock — throttle-safe), the
 * cluster block says where profile pieces land, and the palette matches the
 * sticker-collage reference (ink text + brand CTAs live on top of it).
 *
 * Tunable-config convention (like floatShadow.ts): tweak in preview, paste
 * values back here to persist.
 */
import type { InterestId } from "./interests";
import type { StepId } from "../components/onboarding/OnboardingFlow";

/** Gentle per-step nudge of the toy city — alive, not game-like. */
export type StagePose = { scale: number; x: number; y: number };

export const stagePalette = {
  /** Land base behind the artwork — matches its paper-gray ground. */
  land: "#EFEFEF",
  /** Soft gradient behind titles/footer, as "r,g,b" (light!). */
  vignette: "244,243,239",
};

/**
 * Placement of the city artwork (assets/onboarding/toy-city-map.svg) inside
 * the 393×852 stage. Base values lifted from the Figma mock ("Frame 269"):
 * x 125.027, y 1957.54, rotate -165 — the artwork box at native size, rotated
 * about its top-left corner. Nudged (+28, +84) from that mock so the profile
 * collage (CLUSTER) lands on a gray block instead of the same-color white
 * plaza — the smallest shift that keeps the frame covered at every pose.
 */
export const stageArt = {
  width: 1149.18,
  height: 2583.12,
  x: 153.027,
  y: 2041.54,
  rotate: -165,
};

export const stagePoses: Record<StepId, StagePose> = {
  welcome: { scale: 1, x: 0, y: 0 },
  signin: { scale: 1.05, x: -14, y: 10 },
  motivation: { scale: 1.1, x: 12, y: -10 },
  name: { scale: 1.16, x: 0, y: -26 },
  photo: { scale: 1.19, x: -8, y: -6 },
  interests: { scale: 1.22, x: 8, y: -30 }, // lifts the collage clear of the interests footer
  verify: { scale: 1.26, x: -6, y: 0 },
  location: { scale: 1.3, x: 0, y: -46 }, // lifts the collage clear of the location CTAs
};

/** Step-to-step pose glide (CSS transform transition). */
export const stagePoseMs = 950;

/** The exit: dive THROUGH the toy world into the real map beneath. */
export const stageExit = {
  scale: 2.3,
  ms: 680,
  /** Ease-in — the world accelerates past you. */
  ease: "cubic-bezier(0.5, 0, 0.8, 0.4)",
};

/**
 * The profile cluster — the sticker collage that assembles in the lower
 * middle of the stage (between step content and the footer) as you answer.
 * All positions are device coords (393×852) / offsets from `center`.
 */
export const CLUSTER = {
  center: { x: 196, y: 640 },
  /** The profile-page avatar (IconPlaceholder, bare — no sticker framing);
   *  `overlap` is how far the boxed name plates paint over its bottom edge
   *  (the ProfileFlow header construction). */
  avatar: { size: 108, overlap: 24 },
  /** Interest glyph stickers: bare blue glyphs (peer-profile tag style),
   *  height in px + overlapping ring slots. Picks claim slots by pick order
   *  (mod), newest `max` picks stay visible. */
  stickerSize: 54,
  max: 6,
  slots: [
    { dx: -74, dy: -42, rot: -12 },
    { dx: 76, dy: -36, rot: 10 },
    { dx: -84, dy: 26, rot: 8 },
    { dx: 84, dy: 30, rot: -9 },
    { dx: -26, dy: -72, rot: 6 },
    { dx: 40, dy: -70, rot: -7 },
  ],
};

/**
 * Interest → sticker glyph (keys of figmaIcons) — the six glyphs the map
 * pins already use. Sports share the runner; the unclassified interests
 * borrow the closest culture glyph, so every pick still leaves a mark.
 */
export const INTEREST_GLYPH: Record<InterestId, string> = {
  drinks: "cocktail",
  livemusic: "music",
  tapas: "utensils",
  climbing: "chipSports",
  coffee: "coffee",
  running: "chipSports",
  football: "chipSports",
  yoga: "chipSports",
  museums: "museum",
  photography: "museum",
  books: "museum",
  thrifting: "utensils",
};
