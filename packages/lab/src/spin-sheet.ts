/**
 * The signs' turn: the 360 flourish the hello sign (pieces/cartel) plays
 * on a click, and the brand plate (pieces/brand-sign) plays as it flips
 * to "Back" — one exposure sheet, so both turn on the same timing. The
 * sheet names its photos by the cartel's keys (front, spin-a, spin-b,
 * spin-c, left, right); each sign resolves them to its own.
 */

// The rotation angle where a transition spin trades faces: the spin-a stop
// — the sign's back — on the LAST lap, so multi-turn spins keep the
// outgoing text until the final pass behind.
export const FACE_SWAP_DEG = 160;

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
export type SpinParams = {
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
export const SPIN_DEFAULTS: SpinParams = {
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
export type TurnStop = { key: string; deg: number };
const TURN_STOPS: TurnStop[] = [
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
export function spinStops(turns: number): TurnStop[] {
  const stops: TurnStop[] = [{ key: "left", deg: -15 }];
  for (let t = 0; t < turns; t++) {
    for (const stop of TURN_STOPS) {
      stops.push({ key: stop.key, deg: stop.deg + t * 360 });
    }
  }
  stops.push({ key: "front", deg: turns * 360 });
  stops.push({ key: "right", deg: turns * 360 + 15 });
  return stops;
}

function stopForDeg(stops: TurnStop[], deg: number): string {
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

export function cubicBezierY(
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
export function jumpBezierY(
  [x1, y1, x2, y2]: [number, number, number, number],
  x: number,
): number {
  if (x <= 0 || x >= 1) return 0;
  const u = bezierSolveU(x1, x2, x);
  const inv = 1 - u;
  return 3 * inv * inv * u * y1 + 3 * inv * u * u * y2;
}

export type SpinExposure = {
  key: string; // base (julio) key; resolved per face at apply time
  squashX: number;
  jumpY: number; // vertical offset, % of container height (negative = up)
  stretchY: number; // scaleY delta: positive = stretch, negative = squash
  // Past the face-swap point (FACE_SWAP_DEG on the last lap): the exposure
  // shows the incoming face. Before it (holds, windup, early turn): the
  // outgoing face. Same-face spins never notice.
  pastSwap: boolean;
};

/** Off the ground, past rounding. */
export const isAirborne = (e: SpinExposure) => e.jumpY < -0.001;

// front hold · the turn sampled off the curve at fps ticks · front settle.
export function makeSpinSheet(p: SpinParams): SpinExposure[] {
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
    const airborne = isAirborne(exposure);
    exposure.stretchY = airborne ? travel : -travel - posture;
    prevY = exposure.jumpY;
  }
  return sheet;
}
