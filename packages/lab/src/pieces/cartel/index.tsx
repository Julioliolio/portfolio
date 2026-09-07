"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { asset } from "../../asset";

/**
 * Cartel: a photographed lightbox street sign that "looks at" the pointer.
 *
 * Pre-rendered angle photos form an irregular grid over two axes counted in
 * half-steps (-2..2); "h" frames are the halves. The outer columns and the
 * top/bottom rows have 5 stops; the eye-level row and center column have
 * only the full 3, and the four full corners are disabled
 * (USE_CORNER_FRAMES). Cells without a photo don't exist — the walker steps
 * over them and targets snap off them.
 *
 * Motion is three layers:
 * - A 12fps walker steps the current cell one neighbor per tick toward the
 *   quantized target along precomputed shortest routes (NEXT_STEP) — hard
 *   cuts, no easing: the stop motion. The cadence follows the pointer:
 *   each cut's dwell is the 12fps beat divided by how many steps the
 *   walker trails the target (Chase slider scales the response), so a
 *   fast sweep flicks through every intermediate photo at the pointer's
 *   own speed — steps are never skipped — while a slow drift keeps the
 *   full stop-motion beat. Each cut
 *   carries a one-tick echo (the outgoing photo lingers translucent — the
 *   Spider-Verse "shifting" multiple, their stand-in for motion blur) and a
 *   one-tick smear stretch along the axis the sign is turning.
 * - A spherical glide eases a pair of normalized axes toward the raw input
 *   and maps them to drift + shrink + micro-tilt on the whole stack, so the
 *   sign swings on an arc around a pivot behind it (values hand-tuned).
 * - An idle bob: a continuous up-and-down float around the sign's rest
 *   point, added to the stack's vertical drift so the sign reads as
 *   animated even when nothing else moves. It holds flat only while the
 *   walker is actually cutting between photos and resumes once the cuts
 *   stop — in any pose, and through pointer drift that doesn't change
 *   state. Stepped "on ones" (24fps) while the photo swaps stay
 *   "on twos" (12fps) — the Spider-Verse mixed-rate trick: the subject
 *   keeps its stop-motion cadence while the motion layer is twice as fine,
 *   still hard steps with no tweening. Fast steps get a one-tick vertical
 *   smear stretch (their answer to motion blur). Params are exposed as
 *   sliders on the page.
 *
 * A click (or the Spin button) triggers a 360 flourish: the walker carries
 * the sign home to front, then the turn plays as hard cuts through three
 * spin-only back/edge/return frames and the `left` landing. Timing comes
 * from sampling a draggable cubic-bezier velocity curve at the sheet's step
 * rate — dwell per frame falls out of the curve's shape — and overshoot
 * past a full turn maps to a scaleX-only squash on front. Dead-holds, then
 * normal tracking resumes (see SPIN_DEFAULTS / makeSpinSheet /
 * SpinCurveEditor).
 *
 * The sign has two faces: "julio" (Julio Romero, the full angle grid) and
 * "about" (About me, front + one returning angle). Hovering the sign spins
 * it to the About face; hovering off spins it back. The swap happens
 * mid-spin while the back frames show — no text is visible there, so the
 * turn starts reading one name and lands reading the other. While hovered
 * the sign holds front (About) with the idle bob; pointer tracking is
 * gated off. A hover change during a spin queues the reverse spin for
 * when the current one finishes. The click flourish stays and keeps
 * whatever face it started on (external buttons will trigger transitions
 * later — the hover pair is the interaction seam). Any spin landing on
 * the julio face comes out already IN the pointer-tracked pose (see
 * landingCell) rather than landing front and walking there.
 *
 * The hover hitbox is not the sign's box: entering requires the central
 * plus shape (a vertical and a horizontal band crossing at the center, the
 * four corners dead), so a pointer skimming across an edge or corner on
 * its way elsewhere doesn't flip the sign. Once engaged, the hover only
 * releases outside the whole box plus a margin — roaming the sign can't
 * strobe it (see HOVER_*).
 *
 * Inputs: pointer inside a circle of attention around the sign (outside it
 * the sign faces front and ignores the pointer), gyroscope on touch devices
 * (iOS needs a tap-to-enable pill), or a scripted idle look-around where
 * motion input is unavailable. prefers-reduced-motion gets the static front
 * frame.
 *
 * Built to idle near zero cost: the walker interval exists only while
 * walking, the glide rAF loop only while converging, and the transform is
 * written imperatively so React re-renders only on actual frame cuts. The
 * one standing cost is the bob's 24fps interval, paused while the tab is
 * hidden. No motion library — springs would fight the stop-motion feel.
 *
 * The sign casts a drop shadow (see ShadowParams): a filter on the frame
 * stack, so the shadow's silhouette is the current photo's alpha and
 * changes with every cut, tunable from the panel's Shadow section. The
 * pages that host the sign paint a white wall for it. On top of the
 * frames sits the glow (see GlowParams): a blurred screen-blend copy of
 * the current photo that pushes exposure only where the lightbox is lit,
 * so the sign reads as glowing against the white wall.
 *
 * Frames are served from apps/web/public/cartel/{julio,about}/ (regenerate
 * with scripts/prepare-cartel-frames.mjs) — an intentional coupling to the
 * web app's public dir, like the demo assets.
 */

type Level = -2 | -1 | 0 | 1 | 2; // half-steps: ±1 half, ±2 full
type Cell = { col: Level; row: Level };
type Axes = { x: number; y: number }; // normalized -1..1, positive = right/down

const FRONT: Cell = { col: 0, row: 0 };
const TICK_MS = 1000 / 12; // the walker's cadence: photo swaps "on twos"
// The bob's cadence is BobParams.fps (24 by default: motion "on ones").

// The four full-corner photos are excluded — the walker rounds corners
// through the half-step frames instead. Flip to true to bring them back.
const USE_CORNER_FRAMES = false;

// A cell exists if its photo does (and is enabled): half columns only on the
// top/bottom rows, half rows only on the outer columns, eye-level row and
// center column full-step only.
function isValid(col: number, row: number): boolean {
  if (Math.abs(col) > 2 || Math.abs(row) > 2) return false;
  if (!USE_CORNER_FRAMES && Math.abs(col) === 2 && Math.abs(row) === 2) {
    return false;
  }
  if (Math.abs(row) === 2) return true; // top/bottom rows
  if (row === 0) return col % 2 === 0; // eye level: full columns only
  return Math.abs(col) === 2; // half rows: outer columns only
}

// Printed by scripts/prepare-cartel-frames.mjs — the shared frame canvas.
const FRAME_ASPECT = "929 / 1600";

// Flip these if the sign turns away from the pointer instead of toward it.
const INVERT_X = false;
const INVERT_Y = false;

// The circle of attention: the pointer only drives the sign inside a radius
// of RADIUS × the sign's own width around its center, so the sign ignores
// pointer motion happening elsewhere on the page. Measured in sign widths so
// the zone scales with however big the sign is rendered. Once engaged the
// circle grows by EXIT before it lets go — hysteresis, so grazing the edge
// doesn't strobe the sign between tracking and front.
const POINTER_RADIUS = 2;
const RADIUS_EXIT = 1.12;

// The hover hitbox for the face transition, in normalized container
// coordinates (0..1 across each axis). Entering demands intent: only the
// central plus shape counts — a vertical band (half-width BAND_X) running
// the height minus CAP_Y at each end, crossed by a horizontal band
// (half-height BAND_Y) running the width minus CAP_X at each side. The
// four corners are dead, so skimming past the sign's edge on the way
// somewhere else doesn't spin it. Leaving is generous: the hover holds
// until the pointer exits the whole box grown by EXIT on every side.
const HOVER_BAND_X = 0.25; // vertical band: central 50% of the width
const HOVER_BAND_Y = 0.22; // horizontal band: central 44% of the height
const HOVER_CAP_Y = 0.05; // vertical band's inset from top/bottom edges
const HOVER_CAP_X = 0.07; // horizontal band's inset from left/right edges
const HOVER_EXIT = 0.08; // release margin around the full box

// Both axes quantize to 5 levels: |n| below B0 is 0, between B0 and B1 a
// half (±1), past B1 full (±2). HYST is the margin a value must clear beyond
// its current band before the level changes (anti-flicker hysteresis).
const POINTER_B0 = 0.18; // in radius units, from the sign's center
const POINTER_B1 = 0.55;
const POINTER_HYST = 0.06;
const GYRO_B0 = 8; // degrees from the calibration baseline
const GYRO_B1 = 20;
const GYRO_HYST = 3;

// Spherical motion at full turn, all driven by the same eased axes so drift,
// shrink, and tilt always agree. Values hand-tuned by Julio.
const SPATIAL = {
  tx: 8, // % horizontal drift
  ty: 6, // % vertical drift
  shrink: 5.5, // % scale loss
  tiltX: 3.5, // deg rotateY (verified: + faces viewer-right)
  tiltY: 2.5, // deg rotateX
  ease: 0.3, // lerp factor toward the input per 60fps frame (time-corrected)
};

// The idle bob, one cycle sampled at 24fps in % of container height
// (negative = up). A continuous float around the rest point — not a hop:
// no rest beat, the sign is always drifting up or down. `spring` mixes a
// third harmonic into the sine (the square wave's first overtone), which
// snaps the direction changes and holds the extremes — pure sine at 0,
// puppet-on-a-string by 1.
type BobParams = {
  amount: number; // total vertical travel, % of container height
  cycleSec: number; // seconds per full up-and-down
  spring: number; // 0 = soft sine float, 1 = snappy move-and-hold
  smear: number; // stretch per unit of step speed — smear frames, not blur
  echo: number; // opacity of the outgoing photo's one-tick echo on a cut
  fps: number; // the bob's cadence: 24 = "on ones", 12 = the walker's twos
};

// Values dialed in by Julio with the on-page sliders.
const BOB_DEFAULTS: BobParams = {
  amount: 3.5,
  cycleSec: 2,
  spring: 0.2,
  smear: 1,
  echo: 0.075,
  fps: 24,
};

// The cast shadow: a drop-shadow filter on the frame stack, so it traces
// the alpha of whichever photo is showing — the silhouette changes with
// every angle cut for free — and, being painted before the transform, it
// rides the bob, drift and jump like a shadow glued to the sign. Offsets
// and blur in % of the sign's height so the shadow scales with however
// big the sign is rendered (trial page vs lab page).
type ShadowParams = {
  x: number; // horizontal offset, % of sign height (positive = right)
  y: number; // vertical offset, % of sign height (positive = down)
  blur: number; // softness, % of sign height
  opacity: number; // 0 disables the filter entirely
};

// Values dialed in by Julio with the on-page sliders: a hard-edged shadow
// tight to the sign, like the reference photo's wall-mounted lightbox.
const SHADOW_DEFAULTS: ShadowParams = {
  x: 5,
  y: 5,
  blur: 1,
  opacity: 0.18,
};

// The lightbox glow: a blurred copy of the current photo screen-blended
// over the stack. Screen can only lighten, and only by what the source
// pixel carries — so the lit white face blooms while the dark frame and
// the wall stay put, and the blur bleeds the light a little past the
// sign's edges. Reads as exposure pushed just where the lamp shines.
type GlowParams = {
  blur: number; // bleed radius, % of sign height
  strength: number; // overlay opacity; 0 removes the layer entirely
  boost: number; // brightness on the blurred copy — the exposure push
  warmth: number; // sepia on the blown-out whites, toward lamp-warm
};

// Values dialed in by Julio with the panel's Glow section on white.
const GLOW_DEFAULTS: GlowParams = {
  blur: 0,
  strength: 0.7,
  boost: 1.45,
  warmth: 0.6,
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

const GLOW_MASK =
  `linear-gradient(to right, transparent ${GLOW_CORE.left - GLOW_CORE.featherX}%, ` +
  `black ${GLOW_CORE.left}%, black ${GLOW_CORE.right}%, ` +
  `transparent ${GLOW_CORE.right + GLOW_CORE.featherX}%), ` +
  `linear-gradient(to bottom, transparent ${GLOW_CORE.top - GLOW_CORE.featherY}%, ` +
  `black ${GLOW_CORE.top}%, black ${GLOW_CORE.bottom}%, ` +
  `transparent ${GLOW_CORE.bottom + GLOW_CORE.featherY}%)`;

// One-tick scale stretch along the axis of a walker cut, per unit of the
// Smear slider — the angle swaps' share of the smear treatment.
const CUT_SMEAR = 0.018;

// When a move interrupts the bob, the offset eases flat by this per-frame
// decay (still stepped at 24fps) instead of hard-cutting to zero — a third
// of a second of diminishing steps, then snap. 1 would never settle, 0 is
// a hard cut.
const BOB_PARK_EASE = 0.7;
const BOB_PARK_SNAP = 0.05; // below this magnitude (%), snap to flat

// Smear stretch per tick: |Δy per frame, %| / 100 * gain * params.smear,
// capped. Lives for exactly the tick that moved fast — the Spider-Verse
// one-frame smear, not a blur.
const SMEAR_GAIN = 6;
const SMEAR_MAX = 0.03;

function makeBobFrames({ amount, cycleSec, spring, fps }: BobParams): number[] {
  const n = Math.max(4, Math.round(cycleSec * fps));
  const raw: number[] = [];
  for (let i = 0; i < n; i++) {
    const th = (2 * Math.PI * i) / n;
    raw.push(Math.sin(th) + (spring / 3) * Math.sin(3 * th));
  }
  // Normalize so `amount` is the true peak-to-peak travel at any spring.
  const max = Math.max(...raw.map(Math.abs)) || 1;
  return raw.map((v) => Number(((-amount / 2) * (v / max)).toFixed(2)));
}

const IDLE_STEP_MS = 1300;
// Targets only — the walker fills in the steps between them. The ring
// avoids the disabled corner cells.
const IDLE_SEQUENCE: Cell[] = [
  { col: 0, row: 0 },
  { col: -2, row: 0 },
  { col: -2, row: -1 },
  { col: -1, row: -2 },
  { col: 0, row: -2 },
  { col: 1, row: -2 },
  { col: 2, row: -1 },
  { col: 2, row: 0 },
  { col: 2, row: 1 },
  { col: 1, row: 2 },
  { col: 0, row: 2 },
  { col: -1, row: 2 },
  { col: -2, row: 1 },
  { col: -2, row: 0 },
  { col: 0, row: 0 },
];

const COL_NAME: Record<Level, string> = {
  [-2]: "left",
  [-1]: "hleft",
  [0]: "",
  [1]: "hright",
  [2]: "right",
};
const ROW_NAME: Record<Level, string> = {
  [-2]: "up",
  [-1]: "hup",
  [0]: "",
  [1]: "hdown",
  [2]: "down",
};

function keyOf({ col, row }: Cell): string {
  return [COL_NAME[col], ROW_NAME[row]].filter(Boolean).join("-") || "front";
}

const LEVELS: Level[] = [-2, -1, 0, 1, 2];

const CELLS: Cell[] = LEVELS.flatMap((row) =>
  LEVELS.filter((col) => isValid(col, row)).map((col) => ({ col, row })),
);

const FRAME_KEYS = CELLS.map(keyOf);

// Spin-only exposures for the 360 flourish — plain keys, never cells: the
// walker's grid (CELLS/NEIGHBORS/NEXT_STEP) can't see them. They ride the
// same stacked-<img> + decode-preload machinery as the grid frames.
const SPIN_KEYS = ["spin-a", "spin-b", "spin-c"];

// The About face's two photos — same treatment, prefixed keys so they can
// share the flat key namespace (srcOf maps the prefix to its subdir). The
// walker can't reach them: only spin exposures resolve to them.
const ABOUT_KEYS = ["about-front", "about-return"];
const ALL_KEYS = [...FRAME_KEYS, ...SPIN_KEYS, ...ABOUT_KEYS];

// Which text the sign is showing (or spinning toward).
type Face = "julio" | "about";

// Resolves a spin stop's base key to the photo for a face. The julio set
// IS the base set. For about, every text-showing stop maps onto its two
// photos: front is front, and the single returning angle (~325°, between
// the spin-c and left stops) covers both post-back stops plus the reverse
// spin's windup. The back/edge frames (spin-a/spin-b) are shared — no text
// is visible there. `right` (the deep-overshoot tick) has no about photo;
// front stands in and the settle reads off the squash instead.
function faceKey(key: string, face: Face): string {
  if (face === "julio") return key;
  switch (key) {
    case "front":
    case "right":
      return "about-front";
    case "spin-c":
    case "left":
      return "about-return";
    default:
      return key;
  }
}

// The rotation angle where a transition spin trades faces: the spin-a stop
// — the sign's back — on the LAST lap, so multi-turn spins keep the
// outgoing text until the final pass behind.
const FACE_SWAP_DEG = 160;

// The 360 spin. The turn's velocity is a tunable cubic-bezier curve of
// progress-over-time (drag its handles in the Spin panel): the curve is
// sampled at the sheet's step rate, each sample picks the frame whose angle
// segment contains the eased rotation — so dwell per frame *emerges* from
// the curve (steep = whip, flat = dwell) instead of hand-counted ticks.
// A dip below 0 is the windup: the sign winds back against the spin and
// shows the `left` frame (-15°). Overshoot past 1 is the settle-through:
// the sign passes front and shows the `right` frame (+15°) before coming
// to rest, with a small scaleX-only squash on the shallow front ticks at
// the crossing (scaleY never moves).
type SpinParams = {
  fps: number; // step rate the curve is sampled at: 12 = stop motion, 60 = fluid
  durationMs: number; // the turn itself; hold/settle come on top
  holdMs: number; // rest on front before the launch
  settleMs: number; // dead hold after the turn — load-bearing
  curve: [number, number, number, number]; // cubic-bezier(x1,y1,x2,y2) of turn progress
  squashDepth: number; // scaleX per unit of curve overshoot: 0 disables
  turns: number; // full 360s per spin: the curve's 0..1 spans all of them
  jump: number; // hop height, % of container height: 0 disables
  // The hop's own bezier, over the same turn timeline as `curve` but
  // anchored back to the ground at both ends (see jumpBezierY): y is height
  // in Jump units — dip below 0 to crouch, raise toward the dashed 1 line
  // for a full-height apex.
  jumpCurve: [number, number, number, number];
};

// The two curves are timed against each other so jump + spin read as ONE
// motion: the sign braces (sinks into the crouch while the velocity dip
// tilts it left), explodes upward and does the whole turn mid-air, over-
// rotates to `right` on the way down, touches down facing front, and
// settles. Keep the phases aligned when retuning: the velocity curve's
// flat windup should span the jump's crouch, and the turn should complete
// around the jump's apex.
const SPIN_DEFAULTS: SpinParams = {
  fps: 24,
  durationMs: 450,
  holdMs: 0,
  settleMs: 100,
  curve: [0.62, -0.21, 0.44, 1.3],
  squashDepth: 1.5,
  turns: 1,
  jump: 10,
  jumpCurve: [0.34, -1.12, 0.53, 2.4],
};

// The spin's hop, shaped by its own bezier (jumpCurve) over the turn's
// timeline: dip below ground for the crouch, apex wherever the handles put
// it. The scaleY treatment mirrors the bob's smear: stretch proportional to
// per-tick travel while airborne, squash on grounded ticks (crouch, impact).
const JUMP_CROUCH_CAP = 0.35; // deepest crouch/dip, fraction of jump height
const JUMP_STRETCH_GAIN = 6; // scaleY per unit of per-tick travel (as bob)
const JUMP_STRETCH_MAX = 0.1;
const JUMP_POSTURE_GAIN = 0.04; // squash per % of crouch depth
const JUMP_POSTURE_MAX = 0.1;

// Where each photo sits on one lap of the turn; a sample shows the nearest
// stop (midpoint boundaries).
const TURN_STOPS: { key: string; deg: number }[] = [
  { key: "front", deg: 0 },
  { key: "spin-a", deg: 160 },
  { key: "spin-b", deg: 255 },
  { key: "spin-c", deg: 310 },
  { key: "left", deg: 345 },
];

// The full stop list for an N-turn spin: the laps chained end to end,
// bookended by the windup (`left` mirrored to -15°) and the overshoot
// (`right` at +15° past the last turn) — reachable only when the curve
// dips below 0 or crosses above 1.
function spinStops(turns: number): { key: string; deg: number }[] {
  const stops: { key: string; deg: number }[] = [{ key: "left", deg: -15 }];
  for (let t = 0; t < turns; t++) {
    for (const stop of TURN_STOPS) {
      stops.push({ key: stop.key, deg: stop.deg + t * 360 });
    }
  }
  stops.push({ key: "front", deg: turns * 360 });
  stops.push({ key: "right", deg: turns * 360 + 15 });
  return stops;
}

function stopForDeg(
  stops: { key: string; deg: number }[],
  deg: number,
): string {
  let best = stops[0]!;
  for (const stop of stops) {
    if (Math.abs(deg - stop.deg) < Math.abs(deg - best.deg)) best = stop;
  }
  return best.key;
}

// CSS-style cubic bezier through (0,0) and (1,1), y as a function of x.
// Newton-Raphson with a bisection fallback, same approach as the browser's.
function bezierAxis(a: number, b: number, u: number): number {
  const inv = 1 - u;
  return 3 * inv * inv * u * a + 3 * inv * u * u * b + u * u * u;
}

function bezierAxisSlope(a: number, b: number, u: number): number {
  return (
    3 * a * (1 - 4 * u + 3 * u * u) + 3 * b * (2 * u - 3 * u * u) + 3 * u * u
  );
}

function bezierSolveU(x1: number, x2: number, x: number): number {
  let u = x;
  for (let i = 0; i < 8; i++) {
    const err = bezierAxis(x1, x2, u) - x;
    if (Math.abs(err) < 1e-5) return u;
    const slope = bezierAxisSlope(x1, x2, u);
    if (Math.abs(slope) < 1e-6) break;
    u -= err / slope;
    if (u <= 0 || u >= 1) break;
  }
  let lo = 0;
  let hi = 1;
  u = x;
  for (let i = 0; i < 24; i++) {
    if (bezierAxis(x1, x2, u) < x) lo = u;
    else hi = u;
    u = (lo + hi) / 2;
  }
  return u;
}

function cubicBezierY(
  [x1, y1, x2, y2]: [number, number, number, number],
  x: number,
): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return bezierAxis(y1, y2, bezierSolveU(x1, x2, x));
}

// The jump's variant: anchored (0,0) → (1,0) — it must land where it took
// off — so the endpoints contribute nothing and the two handles alone
// shape the arc (negative y1 = crouch first, tall y2 = late apex).
function jumpBezierY(
  [x1, y1, x2, y2]: [number, number, number, number],
  x: number,
): number {
  if (x <= 0 || x >= 1) return 0;
  const u = bezierSolveU(x1, x2, x);
  const inv = 1 - u;
  return 3 * inv * inv * u * y1 + 3 * inv * u * u * y2;
}

type SpinExposure = {
  key: string; // base (julio) key; resolved per face at apply time
  squashX: number;
  jumpY: number; // vertical offset, % of container height (negative = up)
  stretchY: number; // scaleY delta: positive = stretch, negative = squash
  // Past the face-swap point (FACE_SWAP_DEG on the last lap): the exposure
  // shows the incoming face. Before it (holds, windup, early turn): the
  // outgoing face. Same-face spins never notice.
  pastSwap: boolean;
};

// front hold · the turn sampled off the curve at fps ticks · front settle.
function makeSpinSheet(p: SpinParams): SpinExposure[] {
  const sheet: SpinExposure[] = [];
  const push = (
    key: string,
    count: number,
    squashX = 1,
    jumpY = 0,
    pastSwap = false,
  ) => {
    for (let i = 0; i < count; i++) {
      sheet.push({ key, squashX, jumpY, stretchY: 0, pastSwap });
    }
  };
  const beats = (ms: number) => Math.round((ms / 1000) * p.fps);
  push("front", Math.max(1, beats(p.holdMs)));
  const ticks = Math.max(2, beats(p.durationMs));
  const stops = spinStops(p.turns);
  for (let i = 1; i <= ticks; i++) {
    const progress = cubicBezierY(p.curve, i / ticks);
    const deg = progress * 360 * p.turns;
    const key = stopForDeg(stops, deg);
    const pastSwap = deg >= (p.turns - 1) * 360 + FACE_SWAP_DEG;
    // The shallow overshoot ticks — past a full turn but still nearer to
    // front than to `right` — carry the squash; the deep ones show the
    // actual overshoot frame instead.
    const squashX =
      key === "front" && progress > 1
        ? Math.max(0.9, 1 - (progress - 1) * p.squashDepth)
        : 1;
    // The hop, off its own curve over the same timeline: negative (up)
    // while the arc is above ground, positive (down) where it dips —
    // crouch and landing dip, depth-capped.
    const jumpY = Math.min(
      p.jump * JUMP_CROUCH_CAP,
      -p.jump * jumpBezierY(p.jumpCurve, i / ticks),
    );
    push(key, 1, squashX, jumpY, pastSwap);
  }
  push("front", Math.max(1, beats(p.settleMs)), 1, 0, true);
  // Squash & stretch off the finished arc: airborne travel stretches,
  // grounded ticks (crouch, impact) squash — the bob's smear treatment.
  let prevY = 0;
  for (const exposure of sheet) {
    const travel = Math.min(
      JUMP_STRETCH_MAX,
      (Math.abs(exposure.jumpY - prevY) / 100) * JUMP_STRETCH_GAIN,
    );
    const posture = Math.min(
      JUMP_POSTURE_MAX,
      Math.max(0, exposure.jumpY) * JUMP_POSTURE_GAIN,
    );
    const airborne = exposure.jumpY < -0.001;
    exposure.stretchY = airborne ? travel : -travel - posture;
    prevY = exposure.jumpY;
  }
  return sheet;
}

const cellId = ({ col, row }: Cell) => `${col},${row}`;

// Cuts the walker may take in one tick: any valid cell within a Manhattan
// distance of 2 half-steps. Under that limit the 13-cell graph is fully
// connected, so a route always exists between any two photos.
const NEIGHBORS = new Map<string, Cell[]>(
  CELLS.map((cell) => [
    cellId(cell),
    CELLS.filter(
      (other) =>
        other !== cell &&
        Math.abs(other.col - cell.col) + Math.abs(other.row - cell.row) <= 2,
    ),
  ]),
);

// NEXT_STEP.get(currentId).get(targetId) → the cell to cut to this tick.
// Dijkstra from each target with squared-distance edge cost, so routes
// prefer several small cuts over one big jump (the stop-motion walk) and
// round the missing corners through the half-step frames. Replaces a
// greedy candidate list that could strand the walker on cells whose
// straight-line neighbors have no photo (e.g. hleft-up → hleft-down).
const NEXT_STEP: Map<string, Map<string, Cell>> = (() => {
  const table = new Map(
    CELLS.map((cell) => [cellId(cell), new Map<string, Cell>()]),
  );
  const cost = (a: Cell, b: Cell) =>
    (a.col - b.col) ** 2 + (a.row - b.row) ** 2;
  for (const target of CELLS) {
    // Distances from every cell to this target (costs are symmetric).
    const dist = new Map<string, number>([[cellId(target), 0]]);
    const done = new Set<string>();
    for (;;) {
      let u: Cell | undefined;
      let best = Infinity;
      for (const c of CELLS) {
        const d = dist.get(cellId(c));
        if (d !== undefined && d < best && !done.has(cellId(c))) {
          best = d;
          u = c;
        }
      }
      if (!u) break;
      done.add(cellId(u));
      for (const v of NEIGHBORS.get(cellId(u))!) {
        const d = best + cost(u, v);
        if (d < (dist.get(cellId(v)) ?? Infinity)) dist.set(cellId(v), d);
      }
    }
    for (const from of CELLS) {
      if (from === target) continue;
      let next: Cell | undefined;
      let bestVia = Infinity;
      let bestHop = Infinity;
      for (const v of NEIGHBORS.get(cellId(from))!) {
        const hop = cost(from, v);
        const via = hop + (dist.get(cellId(v)) ?? Infinity);
        // Tie-break on the smaller immediate cut, keeping steps gentle.
        if (via < bestVia || (via === bestVia && hop < bestHop)) {
          bestVia = via;
          bestHop = hop;
          next = v;
        }
      }
      if (next) table.get(cellId(from))!.set(cellId(target), next);
    }
  }
  return table;
})();

// Number of cuts from `from` to `to` along the route table (0 if equal).
// Bounded by the longest route in the grid (6), so walking the table is
// cheaper than another precomputed map.
function routeLen(from: Cell, to: Cell): number {
  let n = 0;
  let cur = from;
  while (cur.col !== to.col || cur.row !== to.row) {
    const next = NEXT_STEP.get(cellId(cur))?.get(cellId(to));
    if (!next) return n; // unreachable: the graph is connected
    cur = next;
    n++;
  }
  return n;
}

const srcOf = (key: string) =>
  key.startsWith("about-")
    ? asset(`/cartel/about/${key.slice("about-".length)}.webp`)
    : asset(`/cartel/julio/${key}.webp`);

const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));

const cellAxes = (cell: Cell): Axes => ({ x: cell.col / 2, y: cell.row / 2 });

// The composed spherical transform for a pair of eased axes, plus the bob's
// vertical offset (already in % of height) and the one-tick smear stretches
// (scale fractions per axis: bob and vertical cuts feed Y, horizontal cuts
// feed X).
function signTransform(
  { x, y }: Axes,
  bobY = 0,
  stretchX = 0,
  stretchY = 0,
  squashX = 1,
): string {
  const s = 1 - (SPATIAL.shrink / 100) * Math.min(1, Math.hypot(x, y));
  return (
    `translate(${(x * SPATIAL.tx).toFixed(2)}%, ${(y * SPATIAL.ty + bobY).toFixed(2)}%) ` +
    `scale(${(s * (1 + stretchX) * squashX).toFixed(4)}, ${(s * (1 + stretchY)).toFixed(4)}) ` +
    `rotateY(${(x * SPATIAL.tiltX).toFixed(2)}deg) ` +
    `rotateX(${(-y * SPATIAL.tiltY).toFixed(2)}deg)`
  );
}

// 5-level quantizer with hysteresis. `prev` is the previous level from the
// same input source; a level only changes once the value clears the previous
// level's band by `hyst` (bands: 0 → ±b0 → ±b1 → ∞).
function quantize5(
  value: number,
  prev: Level,
  b0: number,
  b1: number,
  hyst: number,
): Level {
  const sign = value < 0 ? -1 : 1;
  const mag = Math.abs(value);
  const raw = (sign * (mag < b0 ? 0 : mag < b1 ? 1 : 2)) as Level;
  if (raw === prev) return prev;
  const bands: Record<Level, [number, number]> = {
    [-2]: [-Infinity, -b1],
    [-1]: [-b1, -b0],
    [0]: [-b0, b0],
    [1]: [b0, b1],
    [2]: [b1, Infinity],
  };
  const [lo, hi] = bands[prev];
  return value > lo - hyst && value < hi + hyst ? prev : raw;
}

// Quantized levels can land on cells that have no photo. Try substitutes in
// order of preference: full column first (horizontal turn is the sign's
// dominant read), then full row, then the softer half-step variants.
function snapCell(col: Level, row: Level): Cell {
  const colSign = col < 0 ? -1 : 1;
  const rowSign = row < 0 ? -1 : 1;
  const candidates: [Level, Level][] = [[col, row]];
  if (col !== 0) candidates.push([(colSign * 2) as Level, row]);
  if (row !== 0) candidates.push([col, (rowSign * 2) as Level]);
  if (col !== 0 && row !== 0) {
    candidates.push(
      [(colSign * 2) as Level, rowSign as Level],
      [colSign as Level, (rowSign * 2) as Level],
    );
  }
  for (const [c, r] of candidates) {
    if (isValid(c, r)) return { col: c, row: r };
  }
  return FRONT;
}

type Mode = "pending" | "pointer" | "gyro" | "reduced";

function TuneSlider({
  label,
  min,
  max,
  step,
  unit,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 56, opacity: 0.75 }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: "#5b7cfa" }}
      />
      <span
        style={{
          width: 44,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
        {unit}
      </span>
    </label>
  );
}

// A collapsible group in the tuning panel. Every group starts closed so
// the panel reads as a short table of contents; open only what's being
// tuned. Plain local state — nothing outside the panel cares.
function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderTop: "1px solid rgba(128, 128, 128, 0.25)",
        paddingTop: 4,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          padding: "4px 0",
          border: "none",
          background: "transparent",
          color: "#fff",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity: open ? 0.9 : 0.55,
          cursor: "pointer",
        }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-block",
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform 150ms",
            fontSize: 9,
          }}
        >
          ▶
        </span>
        {title}
      </button>
      {open && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "4px 0 6px",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// Draggable cubic-bezier editor, shared by the spin's two curves — both
// run over the same x (time through the turn), so the panels read as one
// stacked timeline:
// - "curve" (velocity): y is rotation progress (1 = all turns done), the
//   right anchor sits at 1. The faint rungs mark where each photo takes
//   over; the rung below the floor is the windup (`left`), above the
//   ceiling the overshoot (`right`) — dip or overshoot to reach them.
// - "jumpCurve" (hop): both anchors sit on the ground (a jump must land),
//   y is height in Jump units with a dashed full-height line at 1; drag
//   below ground for the crouch.
// The dots are the actual exposure samples at the current Fps × Time.
const CURVE_W = 206;
const CURVE_H = 132;

function SpinCurveEditor({
  params,
  onChange,
  field = "curve",
}: {
  params: SpinParams;
  onChange: (update: (prev: SpinParams) => SpinParams) => void;
  field?: "curve" | "jumpCurve";
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<0 | 1 | null>(null);

  const isJump = field === "jumpCurve";
  const yMin = isJump ? -1.2 : -0.3;
  const yMax = isJump ? 2.4 : 1.3;
  const endY = isJump ? 0 : 1; // right-anchor y: a jump lands, a turn completes
  const sample = isJump ? jumpBezierY : cubicBezierY;

  const px = (x: number) => x * CURVE_W;
  const py = (y: number) => ((yMax - y) / (yMax - yMin)) * CURVE_H;

  const [x1, y1, x2, y2] = params[field];
  const ticks = Math.max(
    2,
    Math.round((params.durationMs / 1000) * params.fps),
  );

  function applyPoint(handle: 0 | 1, e: React.PointerEvent) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(
      yMax,
      Math.max(
        yMin,
        yMax - ((e.clientY - rect.top) / rect.height) * (yMax - yMin),
      ),
    );
    onChange((p) => {
      const curve: SpinParams["curve"] = [...p[field]];
      curve[handle * 2] = Math.round(x * 100) / 100;
      curve[handle * 2 + 1] = Math.round(y * 100) / 100;
      return { ...p, [field]: curve };
    });
  }

  return (
    <svg
      ref={svgRef}
      width={CURVE_W}
      height={CURVE_H}
      viewBox={`0 0 ${CURVE_W} ${CURVE_H}`}
      style={{
        touchAction: "none",
        borderRadius: 8,
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(128, 128, 128, 0.25)",
        overflow: "visible",
      }}
      onPointerMove={(e) => {
        if (dragging.current != null) applyPoint(dragging.current, e);
      }}
      onPointerUp={() => {
        dragging.current = null;
      }}
    >
      {/* ground/rest (0) and completion/full-height (1) baselines */}
      {[0, 1].map((y) => (
        <line
          key={y}
          x1={0}
          y1={py(y)}
          x2={CURVE_W}
          y2={py(y)}
          stroke="rgba(255, 255, 255, 0.25)"
          strokeDasharray="3 3"
        />
      ))}
      {/* photo takeover rungs (velocity curve only); progress is normalized
          over all turns, so a two-turn spin stacks both laps' stops (the
          mid-spin front crossing gets its own "f" rung — only the endpoints
          sit on the baselines) */}
      {!isJump &&
        spinStops(params.turns)
          .filter(({ deg }) => deg !== 0 && deg !== 360 * params.turns)
          .map(({ key, deg }) => (
            <g key={deg}>
              <line
                x1={0}
                y1={py(deg / (360 * params.turns))}
                x2={CURVE_W}
                y2={py(deg / (360 * params.turns))}
                stroke="rgba(255, 255, 255, 0.1)"
              />
              <text
                x={3}
                y={py(deg / (360 * params.turns)) - 2}
                fill="rgba(255, 255, 255, 0.35)"
                fontSize={7}
              >
                {key === "left"
                  ? "L"
                  : key === "right"
                    ? "R"
                    : key === "front"
                      ? "f"
                      : key.slice(-1)}
              </text>
            </g>
          ))}
      {/* handle stems */}
      <line
        x1={px(0)}
        y1={py(0)}
        x2={px(x1)}
        y2={py(y1)}
        stroke="rgba(91, 124, 250, 0.5)"
      />
      <line
        x1={px(1)}
        y1={py(endY)}
        x2={px(x2)}
        y2={py(y2)}
        stroke="rgba(91, 124, 250, 0.5)"
      />
      {/* the curve */}
      <path
        d={`M ${px(0)} ${py(0)} C ${px(x1)} ${py(y1)}, ${px(x2)} ${py(y2)}, ${px(1)} ${py(endY)}`}
        fill="none"
        stroke="#5b7cfa"
        strokeWidth={1.5}
      />
      {/* exposure samples; hidden once the cadence is effectively fluid */}
      {ticks <= 64 &&
        Array.from({ length: ticks - 1 }, (_, i) => {
          const x = (i + 1) / ticks;
          return (
            <circle
              key={i}
              cx={px(x)}
              cy={py(sample(params[field], x))}
              r={1.75}
              fill="#fff"
            />
          );
        })}
      {/* drag handles */}
      {([0, 1] as const).map((handle) => (
        <circle
          key={handle}
          cx={px(handle === 0 ? x1 : x2)}
          cy={py(handle === 0 ? y1 : y2)}
          r={5}
          fill="#5b7cfa"
          stroke="#fff"
          strokeWidth={1}
          style={{ cursor: "grab" }}
          onPointerDown={(e) => {
            dragging.current = handle;
            try {
              svgRef.current?.setPointerCapture(e.pointerId);
            } catch {
              // Synthetic events have no active pointer to capture; the
              // move/up handlers still work without capture.
            }
            applyPoint(handle, e);
          }}
        />
      ))}
    </svg>
  );
}

/**
 * The mount entrance (see the `entrance` prop): the site's shared sm-drop
 * keyframes and --sm-duration, generated from the motion tuning by
 * <MotionStyles> in the root layout (packages/lab/src/motion.tsx), so
 * /lab/motion tunes this too. Fill backwards so that once it ends the
 * wrapper carries no transform at all.
 */
const ENTRANCE_CSS = `
.cartel-enter { animation: sm-drop var(--sm-duration, .38s) steps(1, end) backwards; transform-origin: 50% 60%; }
@media (prefers-reduced-motion: reduce) { .cartel-enter { animation-duration: .01ms; } }
`;

export default function Cartel({
  height = "min(70vh, 600px)",
  controls = true,
  spin: spinOverride,
  bob: bobOverride,
  glideFps = 0,
  entrance = true,
}: {
  /** CSS height of the sign; width follows via the frame aspect ratio. */
  height?: string;
  /** Show the tuning-slider panel. */
  controls?: boolean;
  /** Values laid over SPIN_DEFAULTS / BOB_DEFAULTS — for trial pages
   *  that want another feel without touching the defaults. Re-applied
   *  whenever the values change (a toggle), which resets bench edits. */
  spin?: Partial<SpinParams>;
  bob?: Partial<BobParams>;
  /**
   * Stop-motion beat for the pointer glide (the smooth drift layer
   * between photo cuts), cuts per second. 0 = the 60fps ease. Above 0
   * the ease still runs but the sign is only redrawn on the beat, so the
   * drift reads as held poses like everything else.
   */
  glideFps?: number;
  /**
   * Play the mount entrance once the frames are decoded: the sign stamps
   * in through hard cuts (cartel-enter) — from above, small and tilted;
   * past its mark, wide and short; a hair narrow; rest — on a wrapper
   * around the stack, so the walker's own transform is untouched.
   */
  entrance?: boolean;
} = {}) {
  const [mode, setMode] = useState<Mode>("pending");
  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  // cur is the shown photo; ghost is the outgoing photo, kept translucent
  // for one walker tick after a cut (the echo).
  const [shown, setShown] = useState<{ cur: string; ghost: string | null }>({
    cur: "front",
    ghost: null,
  });
  const [motionPill, setMotionPill] = useState(false);
  const [bobParams, setBobParams] = useState<BobParams>(BOB_DEFAULTS);
  const [shadow, setShadow] = useState<ShadowParams>(SHADOW_DEFAULTS);
  const [glow, setGlow] = useState<GlowParams>(GLOW_DEFAULTS);
  // Radius of the circle of attention, in sign widths. Read inside the input
  // handlers through a ref so dragging the slider retunes the live zone
  // without tearing the effect down; `inRange` only drives the lab overlay.
  const [radius, setRadius] = useState(POINTER_RADIUS);
  const [inRange, setInRange] = useState(false);
  const radiusRef = useRef(radius);
  useEffect(() => {
    radiusRef.current = radius;
  }, [radius]);

  // How hard the walker's cadence chases a trailing target (see tickDelay).
  // Read through a ref for the same live-retune reason as radius.
  const [chase, setChase] = useState(1);
  const chaseRef = useRef(chase);
  useEffect(() => {
    chaseRef.current = chase;
  }, [chase]);

  // The bob interval lives in the [mode] effect; it reads frames and the
  // smear gain through these refs so slider changes retune it without
  // tearing the effect down.
  const bobFramesRef = useRef(makeBobFrames(BOB_DEFAULTS));
  const bobSmearRef = useRef(BOB_DEFAULTS.smear);
  const bobFpsRef = useRef(BOB_DEFAULTS.fps);
  useEffect(() => {
    bobFramesRef.current = makeBobFrames(bobParams);
    bobSmearRef.current = bobParams.smear;
    bobFpsRef.current = bobParams.fps;
  }, [bobParams]);

  // Spin timing, read at trigger time through a ref (same live-retune
  // pattern as the bob): slider changes apply to the next spin without
  // tearing the [mode] effect down.
  const [spinParams, setSpinParams] = useState<SpinParams>(SPIN_DEFAULTS);
  const spinParamsRef = useRef(spinParams);
  useEffect(() => {
    spinParamsRef.current = spinParams;
  }, [spinParams]);

  // Trial-page overrides: laid over the defaults whenever their values
  // change. Keyed by content so a fresh literal per render is a no-op.
  const spinKey = JSON.stringify(spinOverride ?? null);
  const bobKey = JSON.stringify(bobOverride ?? null);
  useEffect(() => {
    if (spinOverride !== undefined)
      setSpinParams({ ...SPIN_DEFAULTS, ...spinOverride });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey]);
  useEffect(() => {
    if (bobOverride !== undefined)
      setBobParams({ ...BOB_DEFAULTS, ...bobOverride });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bobKey]);
  const glideFpsRef = useRef(glideFps);
  useEffect(() => {
    glideFpsRef.current = glideFps;
  }, [glideFps]);

  const containerRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const imgRefs = useRef(new Map<string, HTMLImageElement>());
  const enableMotionRef = useRef<(() => void) | null>(null);
  // Assigned inside the [mode] effect (like enableMotionRef); stays null in
  // reduced mode, so clicks are inert there for free.
  const playSpinRef = useRef<((onComplete?: () => void) => void) | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMode("reduced");
      setPhase("ready");
    } else {
      setMode(
        window.matchMedia("(pointer: coarse)").matches ? "gyro" : "pointer",
      );
    }
  }, []);

  useEffect(() => {
    if (mode !== "pointer" && mode !== "gyro") return;

    let disposed = false;

    // --- 12fps walker: steps `current` one neighbor per tick toward `target`

    let current = FRONT;
    let target = FRONT;
    let ticker: number | null = null;
    let cutStretch: Axes = { x: 0, y: 0 };
    let cutClear: number | undefined;

    function stopTicker() {
      if (ticker != null) {
        window.clearTimeout(ticker);
        ticker = null;
      }
    }

    // Dwell before the next cut, scaled by how far the walker trails the
    // target — the proxy for pointer speed. One step behind keeps the 12fps
    // stop-motion beat; further behind divides the beat by the deficit, so
    // the sign walks every intermediate photo at the speed the pointer
    // actually moved. Chase sets how hard the cadence responds (0 = always
    // 12fps, 1 = fully proportional); capped at the display rate.
    function tickDelay(remaining: number): number {
      const factor = 1 + chaseRef.current * (remaining - 1);
      return Math.max(1000 / 60, TICK_MS / factor);
    }

    function scheduleTick(delay: number) {
      ticker = window.setTimeout(tick, delay);
    }

    function tick() {
      ticker = null;
      if (current.col === target.col && current.row === target.row) return;
      // One cut along the precomputed route (see NEXT_STEP) — guaranteed to
      // reach any target, so the walker can't strand mid-path.
      const next = NEXT_STEP.get(cellId(current))?.get(cellId(target));
      if (!next) return;
      // Gathering for a spin: park one step short of front instead of
      // taking the last cut — the sign crouches at the angle it arrived
      // from and the sheet's windup cut carries it into the launch, so
      // front is never shown as a pre-spin hold.
      if (
        spinPhase === "playing" &&
        !spinTookOver &&
        next.col === FRONT.col &&
        next.row === FRONT.row
      ) {
        return;
      }
      const prev = current;
      current = next;
      // The cut, plus its one-tick echo and axis-aligned smear stretch.
      setShown({ cur: keyOf(current), ghost: keyOf(prev) });
      cutStretch = {
        x: current.col !== prev.col ? CUT_SMEAR * bobSmearRef.current : 0,
        y: current.row !== prev.row ? CUT_SMEAR * bobSmearRef.current : 0,
      };
      writeTransform();
      // Each cut pushes the clear forward, so echo and stretch die one tick
      // after the last cut (mid-walk the next cut replaces them anyway).
      window.clearTimeout(cutClear);
      cutClear = window.setTimeout(() => {
        cutStretch = { x: 0, y: 0 };
        writeTransform();
        setShown((f) => (f.ghost ? { cur: f.cur, ghost: null } : f));
      }, TICK_MS * 1.25);
      const remaining = routeLen(current, target);
      if (remaining > 0) scheduleTick(tickDelay(remaining));
    }

    // --- spherical glide: eases axes toward the raw input, writes the
    // stack transform imperatively (React never touches it)

    let axes: Axes = { x: 0, y: 0 };
    let axesTarget: Axes = { x: 0, y: 0 };
    // The axes the sign is drawn with: `axes` itself at glideFps 0, else
    // a sample of it taken on the beat (see glide) so the drift holds.
    let axesShown: Axes = { x: 0, y: 0 };
    let glideAcc = 0; // ms banked toward the next glide cut
    let raf: number | null = null;
    let glidePrev = 0;

    function writeTransform() {
      if (stackRef.current) {
        stackRef.current.style.transform = signTransform(
          axesShown,
          bobY + spinJumpY,
          cutStretch.x,
          cutStretch.y + bobStretch + spinStretchY,
          spinScaleX,
        );
      }
    }

    function glide(now: number) {
      // SPATIAL.ease is tuned as "per 60fps frame"; scale it by the real
      // frame delta so 120Hz displays converge at the same speed, clamped
      // so a background-tab gap can't turn into a teleport.
      const dt = glidePrev ? Math.min(now - glidePrev, 100) : 1000 / 60;
      glidePrev = now;
      const alpha = 1 - Math.pow(1 - SPATIAL.ease, dt / (1000 / 60));
      axes.x += (axesTarget.x - axes.x) * alpha;
      axes.y += (axesTarget.y - axes.y) * alpha;
      const converged =
        Math.abs(axesTarget.x - axes.x) < 0.001 &&
        Math.abs(axesTarget.y - axes.y) < 0.001;
      if (converged) axes = { ...axesTarget };
      // Stop-motion glide: the ease runs every frame, the drawing only
      // catches up on the beat. The converged frame always draws, so the
      // sign never rests a cut short of where the pointer left it.
      const fps = glideFpsRef.current;
      if (fps <= 0 || converged) {
        axesShown = { ...axes };
        glideAcc = 0;
        writeTransform();
      } else {
        glideAcc += dt;
        const hold = 1000 / fps;
        if (glideAcc >= hold) {
          glideAcc %= hold;
          axesShown = { ...axes };
          writeTransform();
        }
      }
      raf = converged ? null : requestAnimationFrame(glide);
      if (converged) glidePrev = 0;
    }

    // --- idle bob: steps the generated frames at 24fps ("on ones", vs the
    // walker's 12fps photo swaps "on twos"), composed into every transform
    // write. Holds flat while the walker is cutting between photos and
    // resumes from the cycle start once the cuts stop — so it bobs
    // whenever the sign isn't changing state, even mid pointer drift.
    // Fast steps carry a one-tick smear stretch in place of motion blur.

    let bobY = 0;
    let bobStretch = 0;
    let bobIndex = 0;
    let bob: number | null = null;

    function smearOf(dy: number): number {
      return Math.min(
        SMEAR_MAX,
        (Math.abs(dy) / 100) * SMEAR_GAIN * bobSmearRef.current,
      );
    }

    // A self-rescheduling timeout rather than an interval, so the cadence
    // follows bobFpsRef live (a trial toggle or the bench slider).
    function startBob() {
      if (bob != null) return;
      const step = () => {
        bob = window.setTimeout(step, 1000 / bobFpsRef.current);
        if (ticker != null) {
          // Mid-cut: ease the offset flat in diminishing steps so the bob
          // is absorbed by the move instead of chopped by it. Only actual
          // photo cuts park the bob — the smooth glide layer (pointer
          // drift without a state change) composes with it instead.
          bobIndex = 0;
          if (bobY !== 0 || bobStretch !== 0) {
            const next =
              Math.abs(bobY) < BOB_PARK_SNAP ? 0 : bobY * BOB_PARK_EASE;
            bobStretch = smearOf(next - bobY);
            bobY = next;
            writeTransform();
          }
          return;
        }
        const frames = bobFramesRef.current;
        bobIndex = (bobIndex + 1) % frames.length;
        const next = frames[bobIndex] ?? 0;
        const stretch = smearOf(next - bobY);
        // Hard steps; skip the write when nothing moved this tick.
        if (next !== bobY || stretch !== bobStretch) {
          bobY = next;
          bobStretch = stretch;
          writeTransform();
        }
      };
      bob = window.setTimeout(step, 1000 / bobFpsRef.current);
    }

    function stopBob() {
      if (bob != null) {
        window.clearTimeout(bob);
        bob = null;
      }
    }

    // --- 360 spin: the exposure sheet starts at the click and plays as
    // fixed-cadence hard cuts; the walker keeps cutting home underneath
    // the crouch, its photos winning until it arrives (or gets snapped at
    // liftoff), so the gather and the turn home read as one motion.
    // Self-contained on purpose (portable to the homepage hero): only the
    // three input guards, onVisibility and the cleanup know it exists.

    let spinPhase: "none" | "playing" = "none";
    let spinTimer: number | null = null;
    let spinIndex = 0;
    let spinScaleX = 1;
    let spinJumpY = 0;
    let spinStretchY = 0;
    let spinSheet: SpinExposure[] = [];
    let spinLastKey: string | null = null;
    // Whether the sheet owns the photos yet. Starting anywhere but front,
    // the walker's frames win through the gather — parked one step short of
    // front — until the sheet's first non-front exposure (the windup) or
    // liftoff, so the sign never holds on front before the launch.
    let spinTookOver = false;
    let spinDone: (() => void) | null = null;

    // The face pair a running spin resolves its exposures against: the
    // outgoing text before the swap point, the incoming after. Equal for
    // the click flourish.
    let face: Face = "julio";
    let spinFromFace: Face = "julio";
    let spinToFace: Face = "julio";
    // Whether the pointer is over the sign itself (not the circle of
    // attention). Drives which face the sign should be resting on.
    let hovered = false;

    const desiredFace = (): Face => (hovered ? "about" : "julio");

    function startSpin(toFace: Face, onComplete?: () => void) {
      // Re-triggers during a spin are ignored, not stacked — finishSpin
      // re-checks the desired face, so a hover change mid-spin queues the
      // reverse instead of firing ~1.5s late and reading as a glitch.
      if (!revealed || spinPhase !== "none") return;
      spinDone = onComplete ?? null;
      spinFromFace = face;
      spinToFace = toFace;
      // The sheet starts NOW, wherever the sign is looking: the walker
      // keeps cutting home underneath the crouch (with its echoes and
      // smears), so the sign gathers itself while turning back instead of
      // snapping to front and pausing before the brace.
      faceFront();
      startSheet();
    }

    // The click/button flourish: a full turn that keeps the current face.
    function playSpin(onComplete?: () => void) {
      startSpin(face, onComplete);
    }

    // Spin toward the hovered-or-not face if the sign isn't already there
    // (or already turning; finishSpin calls back here for the queue).
    function syncFace() {
      if (spinPhase !== "none") return;
      if (face !== desiredFace()) startSpin(desiredFace());
    }

    // The cell a julio-landing spin should come out on: the live quantized
    // pointer target, so the turn ends already looking at the pointer
    // instead of defaulting to front and walking there. Fresh quantize —
    // faceFront zeroed the hysteresis levels at launch, so prev=0 matches
    // what the first processPointer after the spin will compute. Falls
    // back to front when the pointer is gone or outside the circle (and
    // in gyro mode, where pointerLast never exists).
    function landingCell(): Cell {
      if (!pointerLast || !center || !signWidth) return FRONT;
      const radius = signWidth * radiusRef.current;
      const dx = pointerLast.x - center.x;
      const dy = pointerLast.y - center.y;
      if (Math.hypot(dx, dy) > (engaged ? radius * RADIUS_EXIT : radius)) {
        return FRONT;
      }
      const ax = (INVERT_X ? -dx : dx) / radius;
      const ay = (INVERT_Y ? -dy : dy) / radius;
      return snapCell(
        quantize5(ax, 0, POINTER_B0, POINTER_B1, POINTER_HYST),
        quantize5(ay, 0, POINTER_B0, POINTER_B1, POINTER_HYST),
      );
    }

    function startSheet() {
      // Idempotent: a second call must never leak a doubled interval.
      if (spinTimer != null) {
        window.clearInterval(spinTimer);
        spinTimer = null;
      }
      spinPhase = "playing";
      const params = spinParamsRef.current;
      spinSheet = makeSpinSheet(params);
      spinLastKey = null;
      spinTookOver = cellId(current) === cellId(FRONT);
      // The bob hands over: its interval stops and any residual offset
      // decays tick by tick in stepSheet, so the crouch starts from the
      // float's current height instead of popping to zero. The glide keeps
      // easing toward front on its own — it carries the drift home under
      // the crouch.
      stopBob();
      bobStretch = 0;
      bobIndex = 0;
      spinIndex = 0;
      applyExposure(0);
      // Fixed cadence, deliberately not rAF-tied and not the walker's
      // variable timeout chain: the sheet has no chase.
      spinTimer = window.setInterval(stepSheet, 1000 / params.fps);
    }

    function applyExposure(index: number) {
      const exposure = spinSheet[index];
      if (!exposure) return;
      if (
        !spinTookOver &&
        (exposure.key !== "front" || exposure.jumpY < -0.001)
      ) {
        // The windup cut or liftoff, whichever comes first: the sheet takes
        // the photos over and the parked walker is snapped home silently —
        // `current` must be truthful for cancel/finish, but front itself is
        // never shown as a hold.
        spinTookOver = true;
        stopTicker();
        current = FRONT;
      }
      // Pre-takeover the walker's cuts drive the photos and the sheet only
      // writes transforms (the crouch reads through whatever angle the sign
      // arrived at). After: one image per exposure, hard cut, never a
      // ghost; repeated holds skip the write. Exposures resolve to the
      // outgoing face until the swap point, the incoming after — for a
      // same-face spin both resolve identically.
      let key = faceKey(
        exposure.key,
        exposure.pastSwap ? spinToFace : spinFromFace,
      );
      // A julio landing ends IN the tracked pose: the landing front and
      // the overshoot exposures re-resolve to the live pointer cell (per
      // exposure — the pointer keeps moving through the settle), so the
      // sign comes out of the turn looking at the pointer instead of
      // landing front and walking there. The About face has no angle
      // grid, so its landings keep front.
      if (
        exposure.pastSwap &&
        spinToFace === "julio" &&
        (exposure.key === "front" || exposure.key === "right")
      ) {
        key = keyOf(landingCell());
      }
      if (spinTookOver && key !== spinLastKey) {
        setShown({ cur: key, ghost: null });
        spinLastKey = key;
      }
      spinScaleX = exposure.squashX;
      spinJumpY = exposure.jumpY;
      spinStretchY = exposure.stretchY;
      writeTransform();
    }

    function stepSheet() {
      // Residual bob offset from the moment of the click eases flat in
      // diminishing steps, absorbed into the crouch.
      if (bobY !== 0) {
        bobY = Math.abs(bobY) < BOB_PARK_SNAP ? 0 : bobY * BOB_PARK_EASE;
      }
      spinIndex++;
      if (spinIndex >= spinSheet.length) {
        finishSpin();
        return;
      }
      applyExposure(spinIndex);
    }

    function finishSpin() {
      if (spinTimer != null) {
        window.clearInterval(spinTimer);
        spinTimer = null;
      }
      spinPhase = "none";
      spinIndex = 0;
      spinScaleX = 1;
      spinJumpY = 0;
      spinStretchY = 0;
      face = spinToFace;
      // The landing exposures resolved to the live pointer cell — the
      // walker must agree with what's on screen, or its next route would
      // start from front while the photo shows the pose.
      if (face === "julio") {
        const cell = landingCell();
        current = cell;
        target = cell;
        setShown({ cur: keyOf(cell), ghost: null });
      }
      writeTransform();
      const done = spinDone;
      spinDone = null;
      done?.();
      // The hover state may have flipped mid-spin: play the queued reverse
      // back-to-back instead of resting on the wrong face.
      if (face !== desiredFace()) {
        startSpin(desiredFace());
        return;
      }
      startBob();
      // Re-engage tracking from wherever the pointer is now: moves kept
      // recording during the spin, only their processing was gated. While
      // hovered there is nothing to re-engage — the sign holds front.
      if (!hovered && pointerLast) requestProcess();
    }

    // Shared by visibilitychange and unmount: no resume side effects.
    function cancelSpin() {
      if (spinTimer != null) {
        window.clearInterval(spinTimer);
        spinTimer = null;
      }
      spinPhase = "none";
      spinIndex = 0;
      spinScaleX = 1;
      spinJumpY = 0;
      spinStretchY = 0;
      spinDone = null;
    }

    playSpinRef.current = playSpin;

    // Single entry point for all inputs: quantized cell for the walker plus
    // (optionally raw) axes for the glide.
    function setTarget(cell: Cell, rawAxes: Axes = cellAxes(cell)) {
      axesTarget = rawAxes;
      if (raf == null) raf = requestAnimationFrame(glide);
      target = cell;
      if (ticker == null) {
        const remaining = routeLen(current, cell);
        if (remaining > 0) scheduleTick(tickDelay(remaining));
      }
    }

    // --- idle look-around (touch fallback + iOS pre-permission state) ---

    let idle: number | null = null;
    let idleIndex = 0;

    function startIdle() {
      if (idle != null) return;
      idle = window.setInterval(() => {
        if (spinPhase !== "none") return; // pause, don't skip ahead
        idleIndex = (idleIndex + 1) % IDLE_SEQUENCE.length;
        const next = IDLE_SEQUENCE[idleIndex];
        if (next) setTarget(next);
      }, IDLE_STEP_MS);
    }

    function stopIdle() {
      if (idle != null) {
        window.clearInterval(idle);
        idle = null;
      }
    }

    // --- input wiring ---

    let center: Axes | null = null;
    let signWidth = 0;
    let signHeight = 0;
    // Set by scroll/resize; the next processed pointer frame re-measures.
    // Cheaper than a getBoundingClientRect per scroll event, and self-heals
    // if the first measure ran before the container had a size.
    let measureDirty = true;

    function measure() {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && rect.width > 0) {
        center = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
        signWidth = rect.width;
        signHeight = rect.height;
        measureDirty = false;
      }
    }

    // Pre-snap levels, kept per-axis for hysteresis continuity.
    let colLevel: Level = 0;
    let rowLevel: Level = 0;
    // Whether the pointer is inside the circle of attention.
    let engaged = false;

    // Latest pointer position. Processing is leading-edge throttled to
    // ~120Hz — high-polling mice fire pointermove far above refresh rate —
    // with a rAF trailing pass so a burst always settles on its final
    // position. The throttle, not the rAF, carries the tracking: if rAF
    // stalls (hidden tab, embedded panes), pointer input still works.
    let pointerLast: Axes | null = null;
    let pointerRaf: number | null = null;
    let pointerProcessedAt = 0;

    function requestProcess() {
      if (performance.now() - pointerProcessedAt >= 8) {
        processPointer();
      } else if (pointerRaf == null) {
        pointerRaf = requestAnimationFrame(() => {
          pointerRaf = null;
          processPointer();
        });
      }
    }

    function onPointerMove(event: PointerEvent) {
      pointerLast = { x: event.clientX, y: event.clientY };
      requestProcess();
    }

    // Layout moved under the pointer (scroll/resize): re-measure lazily and
    // re-evaluate the last known pointer, so scrolling past the sign drives
    // it without waiting for pointer motion.
    function onLayoutShift() {
      measureDirty = true;
      if (pointerLast) requestProcess();
    }

    // Geometric hover, not DOM pointerenter: entering needs the central
    // plus shape (intent), leaving needs the whole box plus a margin
    // (hold). Runs off the same processed pointer stream as tracking, and
    // keeps running during spins so a mid-spin change queues the reverse.
    function updateHover(u: number, v: number) {
      const inBox =
        u >= -HOVER_EXIT &&
        u <= 1 + HOVER_EXIT &&
        v >= -HOVER_EXIT &&
        v <= 1 + HOVER_EXIT;
      const inCross =
        (Math.abs(u - 0.5) <= HOVER_BAND_X &&
          v >= HOVER_CAP_Y &&
          v <= 1 - HOVER_CAP_Y) ||
        (Math.abs(v - 0.5) <= HOVER_BAND_Y &&
          u >= HOVER_CAP_X &&
          u <= 1 - HOVER_CAP_X);
      const next = hovered ? inBox : inCross;
      if (next !== hovered) {
        hovered = next;
        syncFace();
      }
    }

    function processPointer() {
      if (!pointerLast) return;
      pointerProcessedAt = performance.now();
      if (measureDirty) measure();
      if (!center || !signWidth || !signHeight) return;
      updateHover(
        (pointerLast.x - center.x) / signWidth + 0.5,
        (pointerLast.y - center.y) / signHeight + 0.5,
      );
      // During a spin the pointer keeps recording (pointerLast) but must
      // not retarget the walker; finishSpin re-processes the last position.
      if (spinPhase !== "none") return;
      // While hovered the sign holds front on the About face — tracking
      // would swap Julio grid photos back in.
      if (hovered) return;
      const radius = signWidth * radiusRef.current;
      const dx = pointerLast.x - center.x;
      const dy = pointerLast.y - center.y;
      // Grown by EXIT while engaged so the boundary doesn't strobe.
      const limit = engaged ? radius * RADIUS_EXIT : radius;
      if (Math.hypot(dx, dy) > limit) {
        if (engaged) {
          engaged = false;
          setInRange(false);
          faceFront();
        }
        return;
      }
      if (!engaged) {
        engaged = true;
        setInRange(true);
      }
      // Normalized against the radius: the full turn lives at the circle's
      // edge, whatever size the zone is dialed to.
      const x = dx / radius;
      const y = dy / radius;
      const ax = INVERT_X ? -x : x;
      const ay = INVERT_Y ? -y : y;
      colLevel = quantize5(ax, colLevel, POINTER_B0, POINTER_B1, POINTER_HYST);
      rowLevel = quantize5(ay, rowLevel, POINTER_B0, POINTER_B1, POINTER_HYST);
      setTarget(snapCell(colLevel, rowLevel), {
        x: clamp1(ax),
        y: clamp1(ay),
      });
    }

    function faceFront() {
      colLevel = 0;
      rowLevel = 0;
      setTarget(FRONT);
    }

    // Leaving the window or the document counts as leaving the circle (and
    // the sign — pointerleave doesn't fire on tab switches). The stored
    // pointer is dropped so a later scroll can't re-engage from a position
    // the pointer no longer occupies.
    function disengage() {
      engaged = false;
      pointerLast = null;
      hovered = false;
      setInRange(false);
      faceFront();
      syncFace();
    }

    function onDocumentLeave(event: MouseEvent) {
      if (event.relatedTarget == null) disengage();
    }

    let gyroBaseline: { beta: number; gamma: number } | null = null;
    let gyroSeen = false;
    let gyroTimer: number | null = null;

    function onOrientation(event: DeviceOrientationEvent) {
      if (spinPhase !== "none") return;
      if (event.beta == null || event.gamma == null) return;
      if (!gyroBaseline) {
        // First reading = neutral: however the phone is held becomes "front".
        gyroBaseline = { beta: event.beta, gamma: event.gamma };
        gyroSeen = true;
        stopIdle();
      }
      const ax = INVERT_X
        ? gyroBaseline.gamma - event.gamma
        : event.gamma - gyroBaseline.gamma;
      const ay = INVERT_Y
        ? gyroBaseline.beta - event.beta
        : event.beta - gyroBaseline.beta;
      colLevel = quantize5(ax, colLevel, GYRO_B0, GYRO_B1, GYRO_HYST);
      rowLevel = quantize5(ay, rowLevel, GYRO_B0, GYRO_B1, GYRO_HYST);
      setTarget(snapCell(colLevel, rowLevel), {
        x: clamp1(ax / GYRO_B1),
        y: clamp1(ay / GYRO_B1),
      });
    }

    function attachGyro() {
      window.addEventListener("deviceorientation", onOrientation);
      // No usable reading (desktop browsers, missing sensors) → keep idling.
      gyroTimer = window.setTimeout(() => {
        if (!gyroSeen) startIdle();
      }, 1500);
    }

    function startInput() {
      if (mode === "pointer") {
        measure();
        window.addEventListener("pointermove", onPointerMove, {
          passive: true,
        });
        window.addEventListener("resize", onLayoutShift, { passive: true });
        // capture: true also catches scrolling inside nested containers.
        window.addEventListener("scroll", onLayoutShift, {
          passive: true,
          capture: true,
        });
        window.addEventListener("blur", disengage);
        document.addEventListener("mouseout", onDocumentLeave);
        return;
      }
      // Gyro mode. iOS 13+ gates DeviceOrientation behind a permission that
      // must be requested from a user gesture — show the pill and idle until
      // then. Elsewhere, attach immediately.
      const doe = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (typeof doe.requestPermission === "function") {
        setMotionPill(true);
        startIdle();
        enableMotionRef.current = () => {
          doe
            .requestPermission?.()
            .then((state) => {
              if (disposed) return;
              setMotionPill(false);
              if (state === "granted") attachGyro();
              // denied → idle loop keeps running
            })
            .catch(() => setMotionPill(false));
        };
      } else {
        startIdle();
        attachGyro();
      }
    }

    function onVisibility() {
      if (document.hidden) {
        // A spin can't survive a hidden tab (its interval would pile up
        // stale exposures); the visible branch below already snaps to the
        // front frame — target and current are both FRONT during a spin —
        // and restarts the bob, which is exactly the recovery we want.
        cancelSpin();
        stopTicker();
        stopBob();
      } else {
        // Snap to the target instead of replaying stale motion on return —
        // resolved against the resting face (a hidden tab cancels any spin
        // without swapping, so `face` is still the pre-spin one).
        current = target;
        setShown({ cur: faceKey(keyOf(target), face), ghost: null });
        cutStretch = { x: 0, y: 0 };
        axes = { ...axesTarget };
        writeTransform();
        if (revealed) startBob();
        // The pointer may still be over the sign (no pointerleave fires on
        // tab switches): replay any transition the cancel swallowed.
        syncFace();
      }
    }

    // --- preload: decode every frame before revealing the stack ---

    let revealed = false;

    function reveal() {
      if (revealed || disposed) return;
      revealed = true;
      setPhase("ready");
      startInput();
      startBob();
    }

    Promise.all(
      ALL_KEYS.map((key) =>
        imgRefs.current
          .get(key)
          ?.decode()
          .catch(() => undefined),
      ),
    ).then(reveal);
    // A stalled frame can't wedge the sign.
    const revealTimer = window.setTimeout(reveal, 4000);

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      cancelSpin();
      stopTicker();
      stopIdle();
      stopBob();
      if (raf != null) cancelAnimationFrame(raf);
      if (pointerRaf != null) cancelAnimationFrame(pointerRaf);
      window.clearTimeout(revealTimer);
      window.clearTimeout(cutClear);
      if (gyroTimer != null) window.clearTimeout(gyroTimer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onLayoutShift);
      window.removeEventListener("scroll", onLayoutShift, { capture: true });
      window.removeEventListener("blur", disengage);
      window.removeEventListener("deviceorientation", onOrientation);
      document.removeEventListener("mouseout", onDocumentLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      enableMotionRef.current = null;
      playSpinRef.current = null;
    };
  }, [mode]);

  const showFrames = mode === "pointer" || mode === "gyro";

  // Shadow lengths in % of the sign's height, resolved with calc() against
  // the height prop so the same values read identically at any render size.
  // React only diffs the properties it owns, so updating `filter` here never
  // disturbs the imperatively-written transform on the same element.
  const shadowLen = (v: number) => `calc((${height}) * ${(v / 100).toFixed(4)})`;
  const shadowFilter =
    shadow.opacity > 0
      ? `drop-shadow(${shadowLen(shadow.x)} ${shadowLen(shadow.y)} ${shadowLen(shadow.blur)} rgba(0, 0, 0, ${shadow.opacity}))`
      : undefined;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height,
        aspectRatio: FRAME_ASPECT,
        userSelect: "none",
      }}
    >
      {/* The circle of attention, drawn behind the sign — a tuning aid, so
          it rides with the slider panel. Sized in % of the container width
          (aspectRatio keeps it round) so it tracks the same sign-width unit
          the pointer math uses. */}
      {controls && showFrames && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: `${radius * 200}%`,
            aspectRatio: "1",
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            border: `1px dashed ${inRange ? "rgba(91, 124, 250, 0.85)" : "rgba(128, 128, 128, 0.45)"}`,
            background: inRange
              ? "radial-gradient(circle, rgba(91, 124, 250, 0.09), rgba(91, 124, 250, 0))"
              : "none",
            transition: "border-color 200ms, background 200ms",
            pointerEvents: "none",
          }}
        />
      )}
      {/* Perspective lives on this inner wrapper: on the root it would
          become the containing block for the fixed-position slider panel.
          It is also the spin's click target — the root would catch slider
          drags and the motion pill. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          perspective: 900,
          cursor: showFrames && phase === "ready" ? "pointer" : undefined,
        }}
        role="button"
        tabIndex={0}
        aria-label="Spin the sign"
        onClick={() => playSpinRef.current?.()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            playSpinRef.current?.();
          }
        }}
      >
        {/* The entrance wrapper: the stamp-in animation runs here, not on
            the stack (whose transform the walker writes every cut).
            preserve-3d keeps the stack's rotateX/Y in the perspective
            above while the wrapper's own transform is in play. */}
        <div
          className={entrance && phase === "ready" ? "cartel-enter" : undefined}
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
          }}
        >
        <div
          ref={stackRef}
          style={{
            position: "absolute",
            inset: 0,
            willChange: "transform",
            filter: shadowFilter,
          }}
        >
          {/* eslint-disable @next/next/no-img-element -- preloaded stacked frames swapped at 12fps; the Next optimizer adds nothing for pre-sized static WebP and would break decode-before-reveal */}
          <img
            src={srcOf("front-blur")}
            alt=""
            aria-hidden
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              opacity: phase === "loading" ? 1 : 0,
              transition: "opacity 300ms",
            }}
          />
          {(showFrames ? ALL_KEYS : ["front"]).map((key) => (
            <img
              key={key}
              ref={(el) => {
                if (el) imgRefs.current.set(key, el);
                else imgRefs.current.delete(key);
              }}
              src={srcOf(key)}
              alt={key === "front" ? "Julio Romero — lightbox street sign" : ""}
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                // Hard cuts on purpose: no transition — this is the stop
                // motion. The ghost is the outgoing photo's one-tick echo,
                // painted above the incoming one so the double image reads.
                opacity:
                  phase !== "ready"
                    ? 0
                    : shown.cur === key
                      ? 1
                      : shown.ghost === key
                        ? bobParams.echo
                        : 0,
                zIndex: shown.ghost === key ? 2 : 1,
              }}
            />
          ))}
          {/* The glow (see GlowParams): a blurred screen-blend copy of the
              current photo, above the frames and the ghost. Same src as the
              shown frame, so it swaps in the same commit as each cut and
              hits the already-decoded cache. The stack's drop-shadow reads
              alpha after this layer, so the shadow softens a hair at the
              edges the bleed crosses — invisible at these radii. */}
          {glow.strength > 0 && (
            <img
              src={srcOf(shown.cur)}
              alt=""
              aria-hidden
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                opacity: phase === "ready" ? glow.strength : 0,
                filter: `blur(${shadowLen(glow.blur)}) brightness(${glow.boost}) sepia(${glow.warmth})`,
                mixBlendMode: "screen",
                maskImage: GLOW_MASK,
                maskComposite: "intersect",
                WebkitMaskComposite: "source-in",
                zIndex: 3,
                pointerEvents: "none",
              }}
            />
          )}
          {/* eslint-enable @next/next/no-img-element */}
        </div>
        </div>
      </div>
      <style>{ENTRANCE_CSS}</style>
      {motionPill && (
        <button
          type="button"
          onClick={() => enableMotionRef.current?.()}
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid rgba(128, 128, 128, 0.4)",
            background: "rgba(20, 20, 24, 0.7)",
            color: "#fff",
            fontSize: 13,
            backdropFilter: "blur(8px)",
          }}
        >
          Enable motion
        </button>
      )}
      {controls && showFrames && (
        <div
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: 230,
            maxHeight: "calc(100vh - 32px)",
            overflowY: "auto",
            padding: "6px 12px 10px",
            borderRadius: 12,
            border: "1px solid rgba(128, 128, 128, 0.4)",
            background: "rgba(20, 20, 24, 0.7)",
            color: "#fff",
            fontSize: 11,
            backdropFilter: "blur(8px)",
          }}
        >
          <Section title="Pointer">
            <TuneSlider
              label="Radius"
              min={0.5}
              max={8}
              step={0.1}
              unit="×"
              value={radius}
              onChange={setRadius}
            />
            <TuneSlider
              label="Chase"
              min={0}
              max={1}
              step={0.05}
              unit=""
              value={chase}
              onChange={setChase}
            />
          </Section>
          <Section title="Stop motion">
            <TuneSlider
              label="Beat"
              min={4}
              max={30}
              step={1}
              unit="fps"
              value={bobParams.fps}
              onChange={(fps) => setBobParams((p) => ({ ...p, fps }))}
            />
            <TuneSlider
              label="Amount"
              min={0}
              max={4}
              step={0.1}
              unit="%"
              value={bobParams.amount}
              onChange={(amount) => setBobParams((p) => ({ ...p, amount }))}
            />
            <TuneSlider
              label="Cycle"
              min={0.5}
              max={4}
              step={0.1}
              unit="s"
              value={bobParams.cycleSec}
              onChange={(cycleSec) => setBobParams((p) => ({ ...p, cycleSec }))}
            />
            <TuneSlider
              label="Spring"
              min={0}
              max={1}
              step={0.05}
              unit=""
              value={bobParams.spring}
              onChange={(spring) => setBobParams((p) => ({ ...p, spring }))}
            />
            <TuneSlider
              label="Smear"
              min={0}
              max={2}
              step={0.05}
              unit=""
              value={bobParams.smear}
              onChange={(smear) => setBobParams((p) => ({ ...p, smear }))}
            />
            <TuneSlider
              label="Echo"
              min={0}
              max={0.6}
              step={0.025}
              unit=""
              value={bobParams.echo}
              onChange={(echo) => setBobParams((p) => ({ ...p, echo }))}
            />
          </Section>
          <Section title="Spin">
            <span style={{ opacity: 0.4, fontSize: 10 }}>Velocity</span>
            <SpinCurveEditor params={spinParams} onChange={setSpinParams} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 56, opacity: 0.75 }}>Turns</span>
              {[1, 2].map((turns) => (
                <button
                  key={turns}
                  type="button"
                  onClick={() => setSpinParams((p) => ({ ...p, turns }))}
                  style={{
                    flex: 1,
                    padding: "4px 0",
                    borderRadius: 6,
                    border: `1px solid ${
                      spinParams.turns === turns
                        ? "#5b7cfa"
                        : "rgba(128, 128, 128, 0.4)"
                    }`,
                    background:
                      spinParams.turns === turns
                        ? "rgba(91, 124, 250, 0.25)"
                        : "transparent",
                    color: "#fff",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {turns}
                </button>
              ))}
            </div>
            <TuneSlider
              label="Fps"
              min={6}
              max={60}
              step={1}
              unit=""
              value={spinParams.fps}
              onChange={(fps) => setSpinParams((p) => ({ ...p, fps }))}
            />
            <TuneSlider
              label="Time"
              min={300}
              max={2500}
              step={50}
              unit=""
              value={spinParams.durationMs}
              onChange={(durationMs) =>
                setSpinParams((p) => ({ ...p, durationMs }))
              }
            />
            <TuneSlider
              label="Hold"
              min={0}
              max={1000}
              step={50}
              unit=""
              value={spinParams.holdMs}
              onChange={(holdMs) => setSpinParams((p) => ({ ...p, holdMs }))}
            />
            <TuneSlider
              label="Settle"
              min={0}
              max={1500}
              step={50}
              unit=""
              value={spinParams.settleMs}
              onChange={(settleMs) =>
                setSpinParams((p) => ({ ...p, settleMs }))
              }
            />
            <TuneSlider
              label="Squash"
              min={0}
              max={2}
              step={0.1}
              unit="×"
              value={spinParams.squashDepth}
              onChange={(squashDepth) =>
                setSpinParams((p) => ({ ...p, squashDepth }))
              }
            />
            <span style={{ opacity: 0.4, fontSize: 10, marginTop: 4 }}>
              Jump arc
            </span>
            <SpinCurveEditor
              params={spinParams}
              onChange={setSpinParams}
              field="jumpCurve"
            />
            <TuneSlider
              label="Jump"
              min={0}
              max={15}
              step={0.5}
              unit="%"
              value={spinParams.jump}
              onChange={(jump) => setSpinParams((p) => ({ ...p, jump }))}
            />
          </Section>
          <Section title="Shadow">
            <TuneSlider
              label="X"
              min={-10}
              max={10}
              step={0.5}
              unit="%"
              value={shadow.x}
              onChange={(x) => setShadow((p) => ({ ...p, x }))}
            />
            <TuneSlider
              label="Y"
              min={-10}
              max={15}
              step={0.5}
              unit="%"
              value={shadow.y}
              onChange={(y) => setShadow((p) => ({ ...p, y }))}
            />
            <TuneSlider
              label="Blur"
              min={0}
              max={15}
              step={0.5}
              unit="%"
              value={shadow.blur}
              onChange={(blur) => setShadow((p) => ({ ...p, blur }))}
            />
            <TuneSlider
              label="Opacity"
              min={0}
              max={0.8}
              step={0.02}
              unit=""
              value={shadow.opacity}
              onChange={(opacity) => setShadow((p) => ({ ...p, opacity }))}
            />
          </Section>
          <Section title="Glow">
            <TuneSlider
              label="Strength"
              min={0}
              max={1}
              step={0.05}
              unit=""
              value={glow.strength}
              onChange={(strength) => setGlow((p) => ({ ...p, strength }))}
            />
            <TuneSlider
              label="Blur"
              min={0}
              max={8}
              step={0.25}
              unit="%"
              value={glow.blur}
              onChange={(blur) => setGlow((p) => ({ ...p, blur }))}
            />
            <TuneSlider
              label="Boost"
              min={1}
              max={2}
              step={0.05}
              unit="×"
              value={glow.boost}
              onChange={(boost) => setGlow((p) => ({ ...p, boost }))}
            />
            <TuneSlider
              label="Warmth"
              min={0}
              max={0.6}
              step={0.05}
              unit=""
              value={glow.warmth}
              onChange={(warmth) => setGlow((p) => ({ ...p, warmth }))}
            />
          </Section>
          <button
            type="button"
            onClick={() => playSpinRef.current?.()}
            style={{
              marginTop: 6,
              padding: "6px 0",
              borderRadius: 8,
              border: "1px solid rgba(128, 128, 128, 0.4)",
              background: "rgba(255, 255, 255, 0.08)",
              color: "#fff",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Spin
          </button>
        </div>
      )}
    </div>
  );
}
