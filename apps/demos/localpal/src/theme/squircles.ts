/**
 * Central registry of every squircle "role" in the prototype. Each component
 * references a role (not a hard-coded radius), so tuning a role here — or live
 * in the Lab — updates every squircle of that kind across the app.
 */
export type SquircleStyle = { radius: number; smoothing: number };

export type SquircleRole =
  | "button"
  | "control"
  | "sheet"
  | "field"
  | "chip"
  | "card"
  | "avatar"
  | "pin"
  | "lozenge"
  | "photo"
  | "badge"
  | "cta"
  | "planCard"
  | "slider"
  | "sliderKnob"
  | "plate"
  | "stepDot"
  | "profileAvatar"
  | "statCard"
  | "qrCard"
  | "miniButton"
  | "tooltip"
  | "banner"
  | "bubble"
  | "onbCard";

export const SQUIRCLE_ROLES: Array<{
  role: SquircleRole;
  label: string;
  hint: string;
}> = [
  {
    role: "button",
    label: "Buttons",
    hint: "Search pill + calendar (square nav)",
  },
  {
    role: "control",
    label: "Controls",
    hint: "Round map buttons (chat, locate)",
  },
  {
    role: "sheet",
    label: "Sheet",
    hint: "The big search sheet / bottom sheets",
  },
  {
    role: "field",
    label: "Search field",
    hint: "The search input inside the sheet",
  },
  { role: "card", label: "Cards", hint: "List cards, panels" },
  { role: "chip", label: "Chips", hint: "Filter chips, small tags" },
  {
    role: "avatar",
    label: "Avatar",
    hint: "Profile / photo tiles (peer pins)",
  },
  {
    role: "pin",
    label: "Venue pin",
    hint: "Blue map tiles for venues / organizations",
  },
  {
    role: "lozenge",
    label: "Selected pin",
    hint: "Expanded icon+name pin of the selected venue",
  },
  {
    role: "photo",
    label: "Photos",
    hint: "Photo collage tiles on the venue sheet",
  },
  {
    role: "badge",
    label: "Time badge",
    hint: "White day/time plate on venue event cards",
  },
  {
    role: "cta",
    label: "CTA buttons",
    hint: "Big white actions on the venue sheet (Create plan, ×)",
  },
  {
    role: "planCard",
    label: "Plan card",
    hint: "The big white focused-plan card on Your plans",
  },
  {
    role: "slider",
    label: "Plan plate",
    hint: "Focused-plan bottom plate / RSVP slider track (300×50)",
  },
  {
    role: "sliderKnob",
    label: "Slider knob",
    hint: "The white 38px knob riding the RSVP slider",
  },
  {
    role: "plate",
    label: "Create plates",
    hint: "Create-plan input plates: time wheels, people stepper, description, results panel",
  },
  {
    role: "stepDot",
    label: "Step dots",
    hint: "Create-plan step indicator dots (8px; active stretches to 24px)",
  },
  {
    role: "profileAvatar",
    label: "Profile avatar",
    hint: "The big 120px profile-header photo (Figma 1431:2253)",
  },
  {
    role: "statCard",
    label: "Stat cards",
    hint: "Profile friends / plans-organized cards (~126px tall, Figma 1431:2271)",
  },
  {
    role: "qrCard",
    label: "QR card",
    hint: "The big white QR plate on Add-new-friends (268×272, Figma 1426:1752)",
  },
  {
    role: "miniButton",
    label: "Mini buttons",
    hint: "Tiny 24px white close/utility buttons on the profile header (Figma 1431:2371)",
  },
  {
    role: "tooltip",
    label: "Tour tooltip",
    hint: "White coach bubbles of the first-plan tour (anchored to pin / Join / calendar)",
  },
  {
    role: "banner",
    label: "Tour banner",
    hint: "iOS-notification-style announcement banner of the first-plan tour",
  },
  {
    role: "bubble",
    label: "Message bubble",
    hint: "Chat bubbles in the messages thread (incoming + outgoing)",
  },
  {
    role: "onbCard",
    label: "Onboarding card",
    hint: "Floating white step cards over the toy-city onboarding stage",
  },
];

export const defaultSquircles: Record<SquircleRole, SquircleStyle> = {
  button: { radius: 15, smoothing: 1 },
  control: { radius: 20, smoothing: 1 }, // 40px → radius 20 = circle; lower for a squircle
  sheet: { radius: 30, smoothing: 1 }, // measured from Figma sheet corner
  field: { radius: 11, smoothing: 1 }, // measured from Figma search-field corner
  card: { radius: 11, smoothing: 1 }, // measured from Figma card squircle (321×72, corner extent ≈22px)
  chip: { radius: 12, smoothing: 0.6 },
  avatar: { radius: 10, smoothing: 1 },
  pin: { radius: 10, smoothing: 1 },
  lozenge: { radius: 18, smoothing: 0.6 }, // 64px-tall expanded pin (Figma 1277:3462); keep < 32 for a squircle
  photo: { radius: 14, smoothing: 1 }, // collage tiles on the venue sheet (Figma 1277:3366)
  badge: { radius: 12, smoothing: 1 }, // 90×50 white time plate (Figma 1277:3381)
  cta: { radius: 20, smoothing: 1 }, // 64px-tall Create plan / close buttons (Figma 1277:3424)
  planCard: { radius: 24, smoothing: 1 }, // white focused-plan card (Figma 1384:2292, 329×184)
  slider: { radius: 16, smoothing: 1 }, // 300×50 plate/track on the focused plan (Figma 1384:2320)
  sliderKnob: { radius: 12, smoothing: 1 }, // 38px RSVP knob (Figma 1384:2528)
  plate: { radius: 16, smoothing: 1 }, // create-flow input plates (Figma 1431:4475 / 4612 / 4813)
  stepDot: { radius: 2.5, smoothing: 1 }, // 8px step dots — squircle (rounded square), not a full circle; pill when active (Figma 1431:4021)
  profileAvatar: { radius: 28, smoothing: 1 }, // 120px header photo (Figma 1431:2253; corner extent ≈ 56px)
  statCard: { radius: 13.5, smoothing: 1 }, // friends / plans-organized cards (extent ≈ 27, Figma 1431:2272)
  qrCard: { radius: 34, smoothing: 1 }, // big white QR plate (Figma 1426:1752)
  miniButton: { radius: 8, smoothing: 1 }, // 24px profile-header close/utility buttons (keep < 12 for a squircle look)
  tooltip: { radius: 14, smoothing: 1 }, // coach bubbles (~54px tall; keep < 27 for a squircle look)
  banner: { radius: 20, smoothing: 1 }, // 68px-tall notification banner (keep < 34 for a squircle look)
  bubble: { radius: 18, smoothing: 1 }, // chat bubbles (~40px+ tall; keep < 20 so short bubbles stay squircles, not pills)
  onbCard: { radius: 24, smoothing: 1 }, // onboarding stage step cards (planCard family; cards are 100px+ tall)
};
