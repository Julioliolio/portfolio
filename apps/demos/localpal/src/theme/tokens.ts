/**
 * LocalPal — Design tokens
 * Extracted from the Figma file "TFM" (LocalPal), frames 1277:1428 / 1277:2287 / 1277:3477.
 *
 * Notes:
 * - Figma only tokenized black; every other value below was read from the frame CSS
 *   (hex fills, Tailwind arbitrary sizes) or measured from the exported screens.
 * - All "boxes" in the design are true squircles (iOS continuous corners / superellipse),
 *   not plain rounded rectangles. Use the <Squircle> primitive + `radius`/`smoothing` here.
 */

export const color = {
  // Brand — the electric indigo used for sheets, primary buttons, active pins
  brand: '#3121FF',
  brandDeep: '#2C1EDF', // slightly darker variant seen on some fills
  brandPressed: '#2417C4',

  // Lavender accents (secondary text / meta on top of indigo surfaces)
  lavender: '#A59FFF',
  lavenderDim: '#968FFB',

  // Text
  ink: '#001D33', // "CONTENT/BLACK" — primary text on light surfaces
  muted: '#6F6A8D', // secondary text / captions on light surfaces
  black: '#000000',

  // Surfaces
  white: '#FFFFFF',
  offWhite: '#FEFEFE',

  // On-indigo surfaces
  onBrand: '#FEFEFE', // primary text on indigo
  onBrandMuted: '#A59FFF', // secondary text on indigo
  cardOnBrand: 'rgba(255,255,255,0.10)', // translucent list cards over indigo
  bubbleOnBrand: 'rgba(255,255,255,0.12)', // activity search bubbles over indigo (reads #4A3DFF; overlaps lighten, per Figma 165:774 / 165:1416)
  bubbleOnMap: 'rgba(73,61,255,0.6)', // interest bubbles over the onboarding toy-city stage — brand-tinted so unpicked bubbles still read over street texture

  // Map (the home map is a flattened raster; these approximate its palette)
  mapLand: '#EDEAE3',
  mapRoad: '#FFFFFF',
  mapWater: '#C7DBEF',
  mapPark: '#DCE6CD',

  // User location dot + halo
  locationDot: '#3121FF',
  locationHalo: 'rgba(49,33,255,0.18)',
} as const;

/**
 * Type scale — typeface is PP Neue Montreal (Medium / SemiBold / Regular).
 * The font isn't bundled yet; the CSS stack falls back to a neutral grotesque.
 * Sizes/weights are the ones actually present in the frames.
 */
export const font = {
  family:
    "'PP Neue Montreal', 'Neue Montreal', 'Inter', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
  weight: { regular: 400, medium: 500, semibold: 600 },
} as const;

export const text = {
  // name:        [size, lineHeight, weight]
  display: { size: 32, line: 36, weight: font.weight.semibold }, // screen titles ("Your plans")
  h1: { size: 24, line: 28, weight: font.weight.semibold },
  h2: { size: 20, line: 26, weight: font.weight.semibold },
  bodyLg: { size: 17, line: 22, weight: font.weight.medium }, // iOS-ish / status
  body: { size: 16, line: 20, weight: font.weight.medium }, // card titles
  caption: { size: 12, line: 16, weight: font.weight.medium }, // meta: time · distance
  micro: { size: 10, line: 13, weight: font.weight.medium },
  nano: { size: 8, line: 10, weight: font.weight.medium },
} as const;

/** 4px base grid — gaps/padding observed: 4, 8, 12, 14, 16, 24 */
export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/**
 * Squircle radii. `smoothing` is Figma's corner-smoothing (0..1); iOS ≈ 0.6.
 * Radii read/measured from the frames.
 */
export const radius = {
  chip: 12,
  card: 18,
  sheet: 28, // bottom-sheet top corners
  fab: 24,
  pill: 999, // fully-rounded search FAB / capsule
  avatar: 18, // squircle avatar on ~40–70px tiles
  bar: 3, // home indicator
} as const;

export const smoothing = 0.6;

export const shadow = {
  fab: '0 8px 24px rgba(20,16,80,0.28)',
  card: '0 2px 12px rgba(0,0,0,0.06)',
  sheet: '0 -8px 40px rgba(0,0,0,0.16)',
} as const;

/**
 * Device frame — screens are drawn at 393 × 852 (iPhone 14/15 logical pt).
 * The corners are continuous (squircle) like the real hardware, and the body
 * radius is the screen radius plus the bezel so the two curves stay concentric
 * — that concentricity is what makes the screen read as *inside* the case.
 */
const SCREEN_RADIUS = 54;
const BEZEL = 12;
export const device = {
  width: 393,
  height: 852,
  screenRadius: SCREEN_RADIUS,
  bezel: BEZEL,
  bodyRadius: SCREEN_RADIUS + BEZEL,
} as const;
