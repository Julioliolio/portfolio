import type { CSSProperties } from 'react';
import type { Transition } from 'framer-motion';

/**
 * Central motion registry — ONE animation personality for the whole prototype.
 *
 * The signature is a single perceptual spring (duration + bounce): everything
 * commits to its motion fast, then overshoots a little and settles — snappy but
 * not stiff, springy but not slow. Every animated element derives its
 * transition from the signature through a role (a speed/bounce multiplier), so
 * re-tuning the signature re-flavors the entire app at once.
 *
 * The rule: animate the INTERACTION, not the INFORMATION. Things you touch or
 * that change shape (press, snap, morph, entrance, pop, ambient) get the
 * springy signature; things that report a fact (progress, loading) use the
 * `inform` role — calm, monotonic ease-out, never overshooting, because a
 * progress bar that overshoots is lying about state.
 *
 * Usage: `useMotion(role)` → a framer-motion Transition. For rAF physics sims
 * (onboarding InterestBubbles) use `useMotionSim(role)` → per-frame spring
 * constants derived from the same tokens. Never hard-code
 * stiffness/damping/ease inline.
 */

export type MotionSignature = {
  /** ms — perceptual duration of the base motion. */
  duration: number;
  /** 0..1 — how much overshoot. Small and fast: a flick, not a wobble. */
  bounce: number;
};

export type MotionRoleTuning = {
  /** Multiplier on the signature duration (1 = base speed). */
  speed: number;
  /** Multiplier on the signature bounce (result clamped to 0..1). */
  bounce: number;
};

export type MotionRole =
  | 'press'
  | 'snap'
  | 'morph'
  | 'entrance'
  | 'pop'
  | 'ambient'
  | 'float'
  | 'inform';

/** Cross-role scalars that aren't a spring shape. */
export type MotionExtras = {
  /** Scale applied to any pressed (whileTap) surface — the "squish". */
  pressScale: number;
  /** s between successive staggered entrances (map pins). */
  entranceStagger: number;
  /** s between ambient idle flourishes (search-glyph reflection spin). */
  ambientEvery: number;
};

export const MOTION_ROLES: Array<{
  role: MotionRole;
  label: string;
  hint: string;
  /** false = deliberately NOT springy (informational motion). */
  springy: boolean;
}> = [
  { role: 'press', label: 'Press', hint: 'Touch squish: scale-down on press, spring back on release', springy: true },
  { role: 'snap', label: 'Snap', hint: 'Click-into-place: slider ticks, drag-release, icon morphs', springy: true },
  { role: 'morph', label: 'Morph', hint: 'Big surface reshaping: pill ⇄ sheet ⇄ text sheet', springy: true },
  { role: 'entrance', label: 'Entrance', hint: 'Elements popping in/out: pins, nav buttons, day slider', springy: true },
  { role: 'pop', label: 'Pop', hint: 'Joyful tap bump: bubble poke (drives the rAF sim too)', springy: true },
  { role: 'ambient', label: 'Ambient', hint: 'Idle "alive" flourish: search-glyph reflection spin', springy: true },
  { role: 'float', label: 'Float', hint: 'Idle floating-wave bob of the selected venue pin: smooth ease-in-out loop, never springs. Speed = half-cycle period.', springy: false },
  { role: 'inform', label: 'Inform', hint: 'Progress/loading: calm ease-out, NEVER springs (would lie)', springy: false },
];

// Tuned live in the Lab: a snappier, springier personality — fast 250ms
// signature with a 0.23 base bounce, roles pushed quicker across the board.
export const defaultSignature: MotionSignature = { duration: 250, bounce: 0.23 };

export const defaultMotionRoles: Record<MotionRole, MotionRoleTuning> = {
  press: { speed: 1.2, bounce: 1.25 },
  snap: { speed: 1.15, bounce: 1 },
  // 2.2 ≈ 550ms — slowed alongside layerZoom so the hierarchy zoom has time
  // to read as depth, not a snap (re-tunable in Lab → Motion).
  morph: { speed: 2.2, bounce: 0.7 },
  entrance: { speed: 3.05, bounce: 1.45 },
  pop: { speed: 2.5, bounce: 1.25 },
  ambient: { speed: 4, bounce: 1.4 },
  float: { speed: 4, bounce: 0 }, // 1s half-cycle → 2s full wave; ease-in-out, bounce unused
  inform: { speed: 0.85, bounce: 0 },
};

export const defaultMotionExtras: MotionExtras = {
  pressScale: 0.92,
  entranceStagger: 0.07,
  ambientEvery: 6,
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Resolve a role to a framer-motion Transition from the live tokens. */
export function resolveTransition(
  sig: MotionSignature,
  role: MotionRole,
  tuning: MotionRoleTuning,
): Transition {
  const duration = (sig.duration * tuning.speed) / 1000;
  if (role === 'inform') return { type: 'tween', duration, ease: 'easeOut' };
  // `float` is an idle loop, not a commit: a reversed ease-in-out tween is a
  // sine wave (zero velocity at the turnarounds), so it floats continuously
  // with no spring settle. `duration` is the half-cycle (one rise or fall).
  if (role === 'float') return { type: 'tween', duration, ease: 'easeInOut' };
  return { type: 'spring', duration, bounce: clamp01(sig.bounce * tuning.bounce) };
}

/* ------------------------------------------------------------------ */
/* Map-camera ease: a real-camera curve, NOT a spring                   */
/* ------------------------------------------------------------------ */

/**
 * The map-camera "commit" move (tapping a pin stack to split it, a dot to zoom
 * toward it) is a camera dolly, not a UI spring — it should ramp up, then
 * decelerate and settle into place with NO overshoot. So it's tuned as a
 * cubic-bezier curve rather than a bounce, with its own duration (independent
 * of the spring signature). MapLibre's `easeTo` takes a concrete duration (ms)
 * + an easing `t → progress`, which is exactly what a bezier timing curve is.
 */
export type CameraEaseConfig = {
  /** Move duration in ms. */
  durationMs: number;
  /** Ease-in (acceleration) amount, 0..1: higher = more gradual ramp-up start. */
  easeIn: number;
  /** Ease-out (settle) amount, 0..1: higher = decelerates harder INTO place. */
  easeOut: number;
};

// Cinematic default, hand-tuned in Lab → Motion → Camera: a long, deliberate
// dolly (630ms) with a very gradual ramp-up and a soft settle into place.
export const defaultCameraEase: CameraEaseConfig = {
  durationMs: 630,
  easeIn: 0.79,
  easeOut: 0.73,
};

/**
 * CSS-style cubic-bezier timing function: y as a function of elapsed-time
 * fraction t, for control points (x1,y1) and (x2,y2) between (0,0) and (1,1).
 * Solves x(u)=t (Newton + bisection fallback) then returns y(u).
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sampleX = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sampleY = (u: number) => ((ay * u + by) * u + cy) * u;
  const slopeX = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  const solveX = (x: number) => {
    let u = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(u) - x;
      if (Math.abs(err) < 1e-6) return u;
      const d = slopeX(u);
      if (Math.abs(d) < 1e-6) break;
      u -= err / d;
    }
    let lo = 0, hi = 1;
    u = x;
    for (let i = 0; i < 20; i++) {
      const err = sampleX(u) - x;
      if (Math.abs(err) < 1e-6) break;
      if (err > 0) hi = u; else lo = u;
      u = (lo + hi) / 2;
    }
    return u;
  };
  return (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : sampleY(solveX(t)));
}

export function resolveCameraEase(cfg: CameraEaseConfig): { durationMs: number; easing: (t: number) => number } {
  // Lock the bezier Y-handles to 0 and 1 → guaranteed monotonic, in-range: a
  // smooth accelerate-then-settle with no overshoot, whatever the X handles.
  const x1 = clamp01(cfg.easeIn);
  const x2 = clamp01(1 - cfg.easeOut);
  return { durationMs: cfg.durationMs, easing: cubicBezier(x1, 0, x2, 1) };
}

/* ------------------------------------------------------------------ */
/* Layer swaps: one hierarchical zoom, wall-clock CSS                   */
/* ------------------------------------------------------------------ */

/**
 * Content-layer swap inside a morphing surface (pill ⇄ sheets, venue ⇄
 * activity, the activity nav stack). ONE personality, iOS-style hierarchical
 * zoom: entering a deeper view, the parent scales PAST the viewer and blurs
 * away while the child grows out of it; stepping back reverses the camera.
 * So a hidden layer rests in one of two states:
 *
 *   'parent' — you zoomed THROUGH it into a deeper view: scaled up + blurred
 *   'child'  — a deeper view you backed out of (or that hasn't opened):
 *              scaled down toward where it grows from + blurred
 *
 * These run as wall-clock CSS transitions, NOT registry springs, on purpose:
 * rAF-driven motion values freeze mid-flight in throttled/background tabs
 * (headless screenshots!), which could leave a stale layer painted over the
 * new one. CSS keeps settling by timestamp, and the trailing `visibility`
 * swap guarantees a hidden layer paints nothing at rest. Timings are chosen
 * to ride the ~550ms `morph` surface spring: outgoing clears first, incoming
 * lands with the surface — slow enough that the depth change is legible.
 */
export const layerZoom = {
  inMs: 450,
  inDelayMs: 90,
  outMs: 300,
  /** Fast-commit ease-out — CSS cousin of the springy signature. */
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  childScale: 0.92,
  parentScale: 1.06,
  blurPx: 6,
};

/** Where a hidden layer sits in the zoom hierarchy relative to the visible one. */
export type LayerDepth = 'parent' | 'child';

/** Style for one swappable content layer. Spread onto the layer wrapper. */
export function layerZoomStyle(visible: boolean, hiddenAs: LayerDepth): CSSProperties {
  const z = layerZoom;
  if (visible) {
    return {
      opacity: 1,
      transform: 'scale(1)',
      filter: 'blur(0px)',
      // 'inherit', NOT 'visible': visibility overrides ancestors, so a layer
      // that forced 'visible' would stay hit-testable (and paintable) inside
      // a CLOSED parent layer — an invisible button eating clicks. Inheriting
      // keeps nested layers (activity stack inside the activity layer) dead
      // whenever any ancestor layer is hidden.
      visibility: 'inherit',
      transition:
        `opacity ${z.inMs}ms ${z.ease} ${z.inDelayMs}ms, ` +
        `transform ${z.inMs}ms ${z.ease} ${z.inDelayMs}ms, ` +
        `filter ${z.inMs}ms ${z.ease} ${z.inDelayMs}ms, visibility 0s`,
    };
  }
  return {
    opacity: 0,
    transform: `scale(${hiddenAs === 'parent' ? z.parentScale : z.childScale})`,
    filter: `blur(${z.blurPx}px)`,
    visibility: 'hidden',
    transition:
      `opacity ${z.outMs}ms ${z.ease}, transform ${z.outMs}ms ${z.ease}, ` +
      `filter ${z.outMs}ms ${z.ease}, visibility 0s linear ${z.outMs}ms`,
  };
}

/**
 * Same tokens as per-frame Euler spring constants for rAF physics sims
 * (`v += (target - x) * k; v *= damp` at ~60fps), so hand-rolled sims share
 * the registry personality. Derivation: bounce → damping ratio ζ = 1 − b,
 * duration → settle time ⇒ ω ≈ 4/(ζ·T); then k = (ω/fps)², damp = 1 − 2ζω/fps.
 */
export function resolveSimSpring(
  sig: MotionSignature,
  tuning: MotionRoleTuning,
  fps = 60,
): { k: number; damp: number } {
  const T = Math.max(0.05, (sig.duration * tuning.speed) / 1000);
  const zeta = Math.max(0.05, 1 - clamp01(sig.bounce * tuning.bounce));
  const omega = 4 / (zeta * T);
  return {
    k: (omega / fps) ** 2,
    damp: Math.max(0, 1 - (2 * zeta * omega) / fps),
  };
}
