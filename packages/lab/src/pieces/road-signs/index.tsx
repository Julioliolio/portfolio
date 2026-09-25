"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { asset } from "../../asset";
import type { Field as BenchField, NumericKey } from "../../bench";
import { replayClass, useMotionTuning } from "../../motion";
import { PRINTS, PRINT_CSS, Print, printSize } from "../../prints";
import { INK, SETTLE_EASE } from "../../style";
import {
  SOUND_FIELDS,
  play,
  resetSoundTuning,
  setSoundTuning,
  useSoundTuning,
} from "../../sound";

/**
 * Road signs: the projects stack. Three photographed road signs, one per
 * project, stacked like a directional signpost. Hovering a sign lifts it
 * (bigger, tilted a few degrees — each sign has its own angle — nudged
 * out, longer shadow) while the other signs step back (smaller, each at
 * its own tilt, dimmed to ~50%) and the stack tucks together. Leaving the
 * stack settles everything to rest. Each sign is a link to its project
 * page.
 *
 * Hovering a sign also brings out its print (see ../../prints): the
 * column at the stage's right edge — the three prints, one under the
 * other, with the hovered one centred and the others peeking above and
 * below — slides in from off the screen's edge onto the mat (Julio,
 * 2026-09-25: "like sliding into the mat") and settles. Hovering another
 * sign steps the column to its print; so does a click on a peeking
 * print. The column is cyclic: the last print peeks above the first and
 * the first below the last (TRACK keeps clones for that). The pointer
 * can leave a sign for its print: an invisible wedge (see drawBridge)
 * fans out from the hot sign's middle to the column's left edge while a
 * print is up, so the pointer can cross the mat along any straight-ish
 * line between the two without the column going, and the wedge sits
 * under the signs and the prints so it never steals a hover from them.
 * Leaving all of it (the sign toward the column waits 240ms, elsewhere
 * 70ms; the column 140ms; the stage 100ms) slides the column back out.
 * The centred print's sign stays lifted meanwhile, and a click on the
 * centred print opens the project (the landing picks the print up into
 * the project window). See ColumnState / showProject / hideProject.
 * hideProject / animateRope.
 *
 * Motion is stop-motion, not tweened: every pose change is walked in a
 * handful of hard cuts on a beat (see Tuning.steps / fps), the
 * same cadence family the cartel's photo swaps use. The cut positions
 * come from sampling an overshooting ease at the step points, so a sign
 * jumps most of the way on the first cut, lands a touch past its pose,
 * and settles — the claymation "pose, overshoot, hold" read — rather than
 * gliding. A sign whose target changes mid-walk (pointer slides from one
 * sign to the next) restarts its walk from wherever it currently is, so
 * hot->cold and cold->hot are direct, not via rest.
 *
 * Each cut also carries a one-tick squeeze — the cartel's smear treatment
 * applied to a size change instead of a turn. The size jump a cut makes
 * is turned into an area-preserving squash: a sign that pops bigger lands
 * wide and short for that one tick, a sign that shrinks lands narrow and
 * tall, and the next cut re-forms it. The first cut carries most of the
 * change, so it carries most of the squeeze; the settle cuts barely
 * deform. The tick after the last cut clears it. Overshoot and squeeze
 * each have a growing and a shrinking value, picked per walk by whether
 * the sign's target scale is above or below where the walk started.
 *
 * Transforms don't move layout boxes, so the stack is re-laid on every
 * cut from the signs' current scales (see relayout): a shrunken sign's
 * neighbours close in on it, with the visible gap sliding from `gap` at
 * rest to `dimGap` between two shrunken signs.
 *
 * Idle nudge: while nothing is hovered, every few seconds one sign (in
 * turn) gets poked — shoved sideways with a slight twist, then swings
 * back past rest and settles. Same walk as a hover (the growing overshoot
 * both ways, since nothing changes size), but at its own frame rate: by
 * default 60fps, a smooth tween, where the hover keeps its hard cuts
 * (Tuning.nudgeFps / nudgeSteps; 24 turns the poke into the same cuts).
 * The poke carries its own squeeze — compression along the shove in
 * proportion to how fast it is moving, so it lands narrow and tall and
 * re-forms as it slows — the cartel's smear along the axis of motion.
 * Reads as a finger flicking the sign: a hint that it can be touched. Any
 * hover cancels it and the next nudge waits a full interval after the
 * pointer leaves; hidden tabs and prefers-reduced-motion get no nudges.
 *
 * One frame loop drives every walk, and runs only while something is
 * unsettled. Each walk banks the elapsed time and cuts at its own fps —
 * a 24fps hover walk every second or third frame, a 60fps poke every
 * frame — and a freshly (re)started walk cuts on the very next frame so
 * hover never feels late. prefers-reduced-motion collapses each walk to a
 * single cut with no tilt and no squeeze.
 *
 * Transforms are written imperatively per frame — React renders only for
 * hover changes and slider edits; the walk engine is a plain object owned
 * by the component (see Engine). No motion library: springs would fight
 * the stepped feel.
 *
 * Photos are served from apps/web/public/signs/ (regenerate with
 * scripts/prepare-signs.mjs) — height-normalized, natural widths, like a
 * real series of signs. The stack sits on the white studio wall so the
 * drop shadows read.
 */

type Sign = {
  slug: string;
  title: string;
  src: string;
  href: string;
  /** width / height, printed by prepare-signs.mjs — sizes the box before
   *  the photo decodes. */
  aspect: number;
};

/** The three signs, in the prints' order (PRINTS). */
const SIGNS: Sign[] = [
  {
    slug: "localpal",
    title: "LocalPal",
    src: asset("/signs/localpal.webp"),
    href: asset("/work/localpal"),
    aspect: 3.31,
  },
  {
    slug: "camper",
    title: "Camper",
    src: asset("/signs/camper.webp"),
    href: asset("/work/camper"),
    aspect: 3.563,
  },
  {
    slug: "convertr",
    title: "Convertr",
    src: asset("/signs/convertr.webp"),
    href: asset("/work/convertr"),
    aspect: 3.303,
  },
];

/** Room in the column past a print's width, px, for its tilt. */
const COLUMN_ROOM = 48;

type RoadSignsTuning = {
  /** Rendered sign height, px. Widths follow each photo's aspect. */
  height: number;
  /** Visible gap between two signs at rest, px. Also the layout gap. */
  gap: number;
  /**
   * Visible gap between two shrunken signs, px. Transforms don't move the
   * layout boxes, so a shrunken sign would leave its box's worth of air
   * around it; instead the stack is re-laid on every cut from each sign's
   * current scale, with each sign's share of the gap sliding from gap/2
   * (rest or bigger) to dimGap/2 (fully shrunk) — see relayout().
   */
  dimGap: number;
  /** Scale of the hovered sign. */
  hoverScale: number;
  /** Tilt of each sign while hovered, deg, keyed by slug. Negative =
   *  counter-clockwise. Per sign because each photo hangs a little
   *  differently — one angle does not read the same on all three. */
  hoverTilt: Record<string, number>;
  /** Horizontal push of the hovered sign, px. */
  hoverNudge: number;
  /** Scale of the other signs while one is hovered. */
  dimScale: number;
  /** Tilt of each sign while another is hovered, deg, keyed by slug.
   *  Positive = clockwise, opposite the hot sign. */
  dimTilt: Record<string, number>;
  /** Opacity of the other signs. */
  dimOpacity: number;
  /** The beat, cuts per second. */
  fps: number;
  /** Cuts per pose change. 1 = a single hard cut. */
  steps: number;
  /**
   * Overshoot of the cut positions — the back-ease constant sampled at the
   * step points. 0 = plain ease-out (no pass-through), ~1 = lands a few
   * percent past the pose on the second-to-last cut, 2+ = a visible bounce.
   * Separate values for a walk that grows the sign (rest->hot, cold->rest)
   * and one that shrinks it (rest->cold, hot->rest): a pop outward and a
   * step back don't want the same weight.
   */
  growOvershoot: number;
  shrinkOvershoot: number;
  /**
   * Squeeze per unit of size change in a cut: a cut that grows the sign by
   * 0.1 in scale squashes it 0.1 × squeeze wide/short for that tick
   * (area-preserving), shrinking does the opposite. 0 = none. Picked by
   * the walk's direction, like overshoot.
   */
  growSqueeze: number;
  shrinkSqueeze: number;
  /** Cast-shadow opacity. Offset and blur grow with the sign's scale. */
  shadow: number;
  /** Seconds between idle nudges (measured from the previous nudge's
   *  settle, or from the pointer leaving). 0 disables the nudge. */
  nudgeEvery: number;
  /** How far the poke shoves the sign sideways, px. Negative = left. */
  nudgePush: number;
  /** The twist the poke gives it, deg. Negative = counter-clockwise. */
  nudgeTilt: number;
  /** Compression along the shove per sign-height of travel per 16fps
   *  frame: moving 0.1 × height in a frame squashes it 0.1 × nudgeSqueeze
   *  narrower (and taller). 0 = none. */
  nudgeSqueeze: number;
  /** The poke's own cut rate. 60 = a smooth tween; 24 = the same hard
   *  cuts as the hover walk. Everything else keeps tuning.fps. */
  nudgeFps: number;
  /** Cuts per leg of the poke (out, and back). With nudgeFps this sets
   *  the leg's length: 20 at 60fps = a third of a second. */
  nudgeSteps: number;

  // ---- the prints' column and its timing (defaults are the site's values)
  /** Width of the column region right of the stack, px: the stage
   *  reaches this far past the stack, and the column sits at its far
   *  edge. On the landing it is what puts the stage's edge on the
   *  screen's, so the column can come in from off it. */
  cardSpan: number;
  /** The column's centre line, px below the stack's middle (negative =
   *  above). */
  cardY: number;
  /** A wide print's width, px; a tall one is TALL_SHARE of it. */
  printW: number;
  /** Air between the column and the stage's right edge, px. */
  columnRight: number;
  /** Air between a print and the ones peeking above and below it, px. */
  peekGap: number;
  /** The column's slide in from the edge, and back out, ms. */
  slideDuration: number;
  /** The column's step to the next print, ms. */
  moveDuration: number;
  /** ms the pointer must rest on a sign before its print shows. */
  showDelay: number;
  /** ms after leaving a sign (not toward its print) before hiding. */
  hideDelay: number;
  /** ms after leaving a sign toward the column before hiding — the
   *  grace for the pointer to reach it. */
  hideTowardCard: number;
  /** ms after leaving the column before hiding. */
  hideFromCard: number;
  /** ms after leaving the whole stage before hiding. */
  hideFromStage: number;
  /** The column's fade, s: out in place when a project opens, and back
   *  in when it closes. */
  fadeDuration: number;
  /** ms after a project closes before the column goes back out (unless
   *  the pointer is on the stage): the window's way back, so its box
   *  lands on the print before the print leaves. */
  returnDelay: number;
};

// Hand-tuned by Julio on the bench (2026-09-05): a 1.2x pop against a
// deep 0.8x step back, walked in seven cuts on a 24fps beat; light squeeze
// both ways; the cold signs fan outward (top tilts left, bottom right)
// while each hot sign hangs at its own angle.
const ROAD_SIGNS_DEFAULTS: Readonly<RoadSignsTuning> = Object.freeze({
  height: 64,
  gap: 12,
  dimGap: 8,
  hoverScale: 1.2,
  hoverTilt: Object.freeze({ localpal: 3, camper: -1.5, convertr: 2.5 }),
  hoverNudge: 6,
  dimScale: 0.8,
  dimTilt: Object.freeze({ localpal: -2, camper: 0, convertr: 2 }),
  dimOpacity: 0.48,
  fps: 24,
  steps: 7,
  growOvershoot: 1,
  shrinkOvershoot: 1.2,
  growSqueeze: 0.4,
  shrinkSqueeze: 0.6,
  shadow: 0.19,
  nudgeEvery: 3.5,
  nudgePush: 16,
  nudgeTilt: 1.25,
  nudgeSqueeze: 0,
  nudgeFps: 60,
  nudgeSteps: 24,
  cardSpan: 900,
  cardY: 0,
  printW: 640,
  columnRight: 24,
  peekGap: 28,
  slideDuration: 520,
  moveDuration: 460,
  showDelay: 50,
  hideDelay: 70,
  hideTowardCard: 240,
  hideFromCard: 140,
  hideFromStage: 100,
  fadeDuration: 0.18,
  returnDelay: 800,
});

type Pose = { scale: number; tilt: number; opacity: number; x: number };
const REST: Pose = { scale: 1, tilt: 0, opacity: 1, x: 0 };

type Role = "rest" | "hot" | "cold" | "nudge";

function poseFor(
  role: Role,
  slug: string,
  t: RoadSignsTuning,
  reduced: boolean,
): Pose {
  if (role === "hot") {
    return {
      scale: t.hoverScale,
      tilt: reduced ? 0 : (t.hoverTilt[slug] ?? 0),
      opacity: 1,
      x: reduced ? 0 : t.hoverNudge,
    };
  }
  if (role === "cold") {
    return {
      scale: t.dimScale,
      tilt: reduced ? 0 : (t.dimTilt[slug] ?? 0),
      opacity: t.dimOpacity,
      x: 0,
    };
  }
  if (role === "nudge") {
    return { scale: 1, tilt: t.nudgeTilt, opacity: 1, x: t.nudgePush };
  }
  return REST;
}

function samePose(a: Pose, b: Pose): boolean {
  return (
    a.scale === b.scale &&
    a.tilt === b.tilt &&
    a.opacity === b.opacity &&
    a.x === b.x
  );
}

function lerpPose(a: Pose, b: Pose, e: number): Pose {
  return {
    scale: a.scale + (b.scale - a.scale) * e,
    tilt: a.tilt + (b.tilt - a.tilt) * e,
    // Opacity never overshoots — past 1 is invisible, below the dim reads
    // as a flicker.
    opacity: a.opacity + (b.opacity - a.opacity) * Math.min(1, Math.max(0, e)),
    x: a.x + (b.x - a.x) * e,
  };
}

/** Back-out ease: lands past 1 on the way in when c > 0, exactly 1 at p=1. */
function backOut(p: number, c: number): number {
  const q = p - 1;
  return 1 + (c + 1) * q * q * q + c * q * q;
}

// ---------------------------------------------------------- the column

type ColumnDom = {
  /** The safe wedge's own svg (under the signs) and its polygon. */
  bridgeSvg: SVGSVGElement;
  bridge: SVGPolygonElement;
  /** The column at the stage's right edge, and the track in it that
   *  moves to centre a print. */
  column: HTMLDivElement;
  track: HTMLDivElement;
};

/**
 * The track's prints: the three, with two clones before and two after,
 * so whatever is centred has a neighbour peeking above and below — the
 * last above the first, the first below the last. FIRST..LAST are the
 * prints themselves; a step that lands on a clone jumps, unseen, to the
 * original (see showProject's settle).
 */
const TRACK = Array.from(
  { length: PRINTS.length + 4 },
  (_, i) => PRINTS[(i + PRINTS.length - 2) % PRINTS.length]!,
);
const FIRST = 2;
const LAST = FIRST + PRINTS.length - 1;
const canonical = (slug: string) =>
  FIRST + PRINTS.findIndex((p) => p.slug === slug);

/**
 * The column machine. Prints are shown and hidden by toggling classes
 * the stylesheet transitions (the column's slide, the track's step);
 * the wedge is redrawn from layout whenever the hot sign walks (see
 * tick), and the timers are the site's grace periods.
 */
type ColumnState = {
  dom: Partial<ColumnDom>;
  /** The track's prints, by index into TRACK. */
  items: (HTMLAnchorElement | undefined)[];
  /** The track index centred, or on its way to the centre. */
  index: number;
  /** The last step has settled (and any clone was swapped out). */
  settled: boolean;
  stage: HTMLDivElement | null;
  /** Where the stack sits in the stage, so sign edges can be placed. */
  stackAt: { x: number; y: number };
  /** Project whose print is up (or on its way out while closing). */
  active: string | null;
  closing: boolean;
  hideTimer: number | null;
  showTimer: number | null;
  settleTimer: number | null;
  /** Tells React which print is up, so its sign stays lifted. */
  onActive: (slug: string | null) => void;
};

function createColumn(): ColumnState {
  return {
    dom: {},
    items: [],
    index: FIRST,
    settled: true,
    stage: null,
    stackAt: { x: 0, y: 0 },
    active: null,
    closing: false,
    hideTimer: null,
    showTimer: null,
    settleTimer: null,
    onActive: () => {},
  };
}

/** The stack's padding around its signs, off the sign height. */
const stackPad = (H: number) => ({ padX: H * 0.6, padY: H * 0.2 });

/** A sign's current centre and half extents in stage space: its layout
 *  box plus the walk's transform (scale, squeeze, nudge, re-tuck). */
type SignGeom = {
  cx: number;
  cy: number;
  halfW: number;
  halfH: number;
  tilt: number;
};

function signGeom(e: Engine, slug: string): SignGeom | null {
  const i = SIGNS.findIndex((s) => s.slug === slug);
  const sign = SIGNS[i];
  if (!sign) return null;
  const t = e.tuning;
  const H = t.height;
  const { padX, padY } = stackPad(H);
  const bw = H * sign.aspect;
  const w = e.walks.get(slug);
  const pose = w?.cur ?? REST;
  const q = 1 + (w?.squash ?? 0);
  return {
    cx: e.column.stackAt.x + padX + bw / 2 + pose.x,
    cy: e.column.stackAt.y + padY + i * (H + t.gap) + H / 2 + (w?.y ?? 0),
    halfW: (bw / 2) * pose.scale * q,
    halfH: (H / 2) * (pose.scale / q),
    tilt: pose.tilt,
  };
}

function cancelHide(e: Engine) {
  if (e.column.hideTimer !== null) window.clearTimeout(e.column.hideTimer);
  e.column.hideTimer = null;
}

function cancelShow(e: Engine) {
  if (e.column.showTimer !== null) window.clearTimeout(e.column.showTimer);
  e.column.showTimer = null;
}

/** Runs `done` once the column's move has settled (at once under
 *  reduced motion); a new move replaces a pending settle. */
function armSettle(e: Engine, ms: number, done: () => void) {
  const r = e.column;
  if (r.settleTimer !== null) window.clearTimeout(r.settleTimer);
  r.settleTimer = window.setTimeout(
    () => {
      r.settleTimer = null;
      done();
    },
    e.reduced ? 0 : ms,
  );
}

/**
 * Writes the safe wedge: a quad from the hot sign's vertical midline
 * (its full height plus a little slack, so a tilted sign's corners are
 * inside it) to the column's left edge, the height of the centred print,
 * overlapping the column by a few px so there is no seam. Anything
 * inside it counts as "still on the way to the print". Drawn from
 * layout — where the print is once the track has stepped — so it is
 * right during the slide with no redraw per frame. It is drawn under the
 * signs and the column, so wherever they overlap it, they win the hover.
 */
function drawBridge(e: Engine) {
  const r = e.column;
  const { bridge, column, track } = r.dom;
  if (!bridge || !column || !track || r.active === null) return;
  const g = signGeom(e, r.active);
  const el = r.items[r.index];
  if (!g || !el) return;
  const slack = g.halfH * 0.35;
  const sx = g.cx;
  const top = g.cy - g.halfH - slack;
  const bottom = g.cy + g.halfH + slack;
  const ex = column.offsetLeft + 8;
  const half = el.offsetHeight / 2;
  const ct = track.offsetTop - half;
  const cb = track.offsetTop + half;
  bridge.setAttribute(
    "points",
    `${sx.toFixed(1)},${top.toFixed(1)} ${sx.toFixed(1)},${bottom.toFixed(1)} ${ex.toFixed(1)},${cb.toFixed(1)} ${ex.toFixed(1)},${ct.toFixed(1)}`,
  );
}

/** Moves the track so the print at `k` sits on the column's centre line
 *  (the track's own top): eased by the stylesheet, or at once. */
function placeTrack(r: ColumnState, k: number, eased: boolean) {
  const track = r.dom.track;
  const el = r.items[k];
  if (!track || !el) return;
  const y = el.offsetTop + el.offsetHeight / 2;
  if (!eased) track.style.transition = "none";
  track.style.transform = `translateY(${(-y).toFixed(1)}px)`;
  if (!eased) {
    void track.offsetHeight;
    track.style.transition = "";
  }
}

/** Makes a print the one that is up — reachable, the pointer's "open",
 *  its clip running only while it is up (autoplay would also let the
 *  browser pause it as "offscreen" while hidden) — or takes it down. */
function setPrintUp(el: HTMLElement | undefined, up: boolean) {
  if (!el) return;
  el.classList.toggle("is-active", up);
  el.setAttribute("aria-hidden", String(!up));
  el.tabIndex = up ? 0 : -1;
  if (up) el.setAttribute("data-cursor-label", "open");
  else el.removeAttribute("data-cursor-label");
  const video = el.querySelector("video");
  if (up) video?.play().catch(() => {});
  else video?.pause();
}

/** The peeking prints tell the cursor what a click does. */
function labelPeeks(r: ColumnState) {
  r.items.forEach((el, i) => {
    if (!el || i === r.index) return;
    if (i === r.index - 1) el.setAttribute("data-cursor-label", "previous");
    else if (i === r.index + 1) el.setAttribute("data-cursor-label", "next");
    else el.removeAttribute("data-cursor-label");
  });
}

function showProject(e: Engine, slug: string) {
  const r = e.column;
  const t = e.tuning;
  cancelHide(e);
  const { column, track, bridgeSvg } = r.dom;
  if (!column || !track) return;
  const firstReveal = r.active === null || r.closing;
  const changed = r.active !== slug;
  if (!changed && !firstReveal) return;
  // Where to go: the same print stays where it is (a hover while it
  // was leaving); another goes to the neighbour when it is next door,
  // so the column steps one the way the peek promised, else to its own
  // place — the column comes in already centred on it.
  let k = changed ? canonical(slug) : r.index;
  if (changed && !firstReveal) {
    for (const j of [r.index - 1, r.index + 1]) {
      if (TRACK[j]?.slug === slug) k = j;
    }
  }
  if (r.index !== k) setPrintUp(r.items[r.index], false);
  // Paper over the mat.
  play("slide", 1, { at: "card" });
  r.active = slug;
  r.closing = false;
  r.settled = false;
  r.index = k;
  placeTrack(r, k, !firstReveal);
  column.classList.add("is-in");
  column.classList.remove("is-off");
  setPrintUp(r.items[k], true);
  labelPeeks(r);
  bridgeSvg?.classList.add("is-live");
  drawBridge(e);
  armSettle(e, firstReveal ? t.slideDuration : t.moveDuration, () => {
    r.settled = true;
    if (r.index < FIRST || r.index > LAST) {
      // Landed on a clone: the original takes over in place, its clip
      // where the clone's was — the view is the same to the pixel.
      const from = r.items[r.index];
      const to = canonical(slug);
      const at = from?.querySelector("video")?.currentTime ?? 0;
      setPrintUp(from, false);
      r.index = to;
      placeTrack(r, to, false);
      const el = r.items[to];
      const video = el?.querySelector("video");
      if (video) video.currentTime = at;
      setPrintUp(el, true);
      labelPeeks(r);
    }
  });
  r.onActive(slug);
}

/**
 * Takes the column away: a slide back out past the edge (the pointer
 * has left), or a fade in place (a project opened — the print stays
 * where it is, still marked up, so the window's box can shrink back
 * onto it; see restoreProject).
 */
function hideProject(e: Engine, how: "slide" | "fade" = "slide") {
  const r = e.column;
  const t = e.tuning;
  cancelHide(e);
  if (r.active === null) return;
  const { column, bridgeSvg } = r.dom;
  bridgeSvg?.classList.remove("is-live");
  if (how === "slide") {
    play("slideOut", 1, { at: "card" });
    setPrintUp(r.items[r.index], false);
    column?.classList.remove("is-in");
  } else {
    r.items[r.index]?.querySelector("video")?.pause();
    column?.classList.add("is-off");
  }
  r.closing = true;
  armSettle(
    e,
    how === "slide" ? t.slideDuration : t.fadeDuration * 1000,
    () => {
      r.active = null;
      r.closing = false;
    },
  );
  r.onActive(null);
}

/** A project has closed: its print comes back in place (the window's box
 *  shrinks onto it), and goes out again after the window's way back
 *  unless the pointer is on the stage. */
function restoreProject(e: Engine, slug: string) {
  const r = e.column;
  showProject(e, slug);
  if (!r.stage?.matches(":hover")) scheduleHide(e, e.tuning.returnDelay);
}

function scheduleHide(e: Engine, ms: number) {
  cancelHide(e);
  e.column.hideTimer = window.setTimeout(() => {
    e.column.hideTimer = null;
    hideProject(e);
  }, ms);
}

/** Shows after a grace, and only if the pointer is still on the sign. */
function scheduleShow(e: Engine, slug: string, ms: number) {
  cancelShow(e);
  cancelHide(e);
  e.column.showTimer = window.setTimeout(() => {
    e.column.showTimer = null;
    const el = e.walks.get(slug)?.el;
    if (el?.matches(":hover")) showProject(e, slug);
  }, ms);
}

function columnCleanup(e: Engine) {
  cancelHide(e);
  cancelShow(e);
  if (e.column.settleTimer !== null) window.clearTimeout(e.column.settleTimer);
  e.column.settleTimer = null;
}

/**
 * Stage geometry from the tuning: the stack's box at the stage's left,
 * the column region to its right (the column sits at the stage's right
 * edge), and a stage tall enough for the stack and the tallest print.
 * Pure, so the component and the engine agree.
 */
function geometry(t: RoadSignsTuning) {
  const H = t.height;
  const { padX, padY } = stackPad(H);
  const maxSignW = Math.max(...SIGNS.map((s) => H * s.aspect));
  const signsH = SIGNS.length * H + (SIGNS.length - 1) * t.gap;
  const stackW = maxSignW + 2 * padX;
  const stackH = signsH + 2 * padY;
  // The column is a wide print plus room for its tilt; the tallest
  // print sets the height (an estimate — the band grows with its blurb;
  // the stage only needs to be roomy enough, the column measures itself).
  const cardW = t.printW + COLUMN_ROOM;
  const cardH = Math.max(...PRINTS.map((p) => printSize(p, t.printW).h));
  const room = 48;
  // The reach sets the stage's width (on the site, out to the screen's
  // edge); a column wider than the reach is allowed to overlap the
  // stack's room rather than push the stage past the screen.
  const stageW = Math.max(stackW + t.cardSpan, cardW + room);
  const ay = stackH / 2 + t.cardY;
  const minY = Math.min(0, ay - cardH / 2 - room);
  const maxY = Math.max(stackH, ay + cardH / 2 + room);
  return {
    stage: { w: stageW, h: maxY - minY },
    stackAt: { x: 0, y: -minY },
    /** The signs at rest — the stack's box without its padding. */
    signs: { w: maxSignW, h: signsH },
    cardTop: ay - minY,
    padX,
    padY,
  };
}

// Per-sign walk state, mutated per frame outside React.
type Walk = {
  el: HTMLAnchorElement;
  from: Pose;
  target: Pose;
  cur: Pose;
  k: number; // cuts taken toward target
  n: number; // cuts in this walk
  /** This walk's cut rate. Hover walks use tuning.fps; a poke uses
   *  tuning.nudgeFps, which at 60 is a smooth tween. */
  fps: number;
  /** Time banked toward the next cut, ms. Primed to a full step at
   *  retarget so the first cut lands on the very next frame. */
  acc: number;
  /** This tick's squeeze: signed, + = wide and short. Lives one tick. */
  squash: number;
  /** Vertical offset from the layout box, px — set by relayout() so the
   *  stack tucks together as signs shrink. */
  y: number;
  /** Whether this walk grows or shrinks the sign — picks which overshoot
   *  and squeeze apply. Fixed at retarget from the scale delta; a walk
   *  that only changes tilt/opacity counts as growing. */
  grow: boolean;
  /** This walk is a poke (either leg of the idle nudge): its sideways
   *  travel squeezes it along the shove. Hover pushes don't. */
  poke: boolean;
};

function settled(w: Walk): boolean {
  return w.k >= w.n && w.squash === 0;
}

function apply(w: Walk, t: RoadSignsTuning) {
  const { scale, tilt, opacity, x } = w.cur;
  const s = w.el.style;
  // Area-preserving: what the width gains the height gives up, so the
  // squeeze reads as the same lump of clay pushed out of shape.
  const q = 1 + w.squash;
  s.transform = `translate(${x}px, ${w.y}px) rotate(${tilt}deg) scale(${
    scale * q
  }, ${scale / q})`;
  s.opacity = `${opacity}`;
  // The shadow is a filter, so its silhouette is the photo's alpha. A
  // lifted sign is further from the wall: longer, softer shadow.
  const lift = Math.max(0, 1 + (scale - 1) * 4);
  s.filter = `drop-shadow(${3 * lift}px ${4 * lift}px ${2 * lift}px rgba(0, 0, 0, ${t.shadow}))`;
}

/**
 * Re-stacks the signs from their current scales and writes every sign's
 * transform. The layout boxes are fixed (height × gap, in SIGNS order);
 * the visual stack uses each sign's scaled height and a gap whose two
 * halves come from the neighbours — a sign contributes gap/2 at rest or
 * bigger and dimGap/2 when fully shrunk, sliding between the two with its
 * scale. The visual stack is centred on the layout stack, and each sign's
 * offset is the difference between its visual and layout centres. All
 * signs at rest gives zero offsets, so the stack sits exactly where the
 * DOM put it.
 */
function relayout(walks: Map<string, Walk>, t: RoadSignsTuning) {
  const ordered = SIGNS.map((s) => walks.get(s.slug)).filter(
    (w): w is Walk => w !== undefined,
  );
  if (ordered.length === 0) return;
  const H = t.height;
  const span = 1 - t.dimScale;
  const share = (scale: number) => {
    const shrunk = span <= 0 ? 0 : Math.min(1, Math.max(0, (1 - scale) / span));
    return (t.gap + (t.dimGap - t.gap) * shrunk) / 2;
  };

  const layoutTotal = ordered.length * H + (ordered.length - 1) * t.gap;
  const centres: number[] = [];
  let cursor = 0;
  ordered.forEach((w, i) => {
    const h = H * w.cur.scale;
    if (i > 0) cursor += share(ordered[i - 1]!.cur.scale) + share(w.cur.scale);
    centres.push(cursor + h / 2);
    cursor += h;
  });
  const shift = (layoutTotal - cursor) / 2;
  ordered.forEach((w, i) => {
    const layoutCentre = i * (H + t.gap) + H / 2;
    w.y = centres[i]! + shift - layoutCentre;
    apply(w, t);
  });
}

/**
 * The walk engine: everything that moves between React renders. One per
 * component instance, created once and mutated in place. React feeds it
 * `active` and `tuning` (in an effect) and calls retarget(); the frame
 * loop, the nudge timer and the bench's "nudge now" button drive it
 * directly.
 */
type Engine = {
  walks: Map<string, Walk>;
  tuning: RoadSignsTuning;
  reduced: boolean;
  /** Hovered or pinned sign — the hot one. null = nothing hovered. */
  active: string | null;
  /** The frame loop (requestAnimationFrame id) — runs only while some
   *  walk is unsettled. Each walk cuts at its own fps off this clock. */
  frame: number | null;
  last: number;
  nudge: {
    /** Sign currently nudging, and which leg of the nudge it is on. */
    slug: string | null;
    phase: "out" | "back" | null;
    /** Next sign to nudge, index into SIGNS. */
    idx: number;
    timer: number | null;
    /** The timer fired while a walk was still going: play the nudge as
     *  soon as the stack settles (checked per frame). */
    pending: boolean;
  };
  column: ColumnState;
};

function createEngine(tuning: RoadSignsTuning): Engine {
  return {
    walks: new Map(),
    tuning,
    reduced: false,
    active: null,
    frame: null,
    last: 0,
    nudge: { slug: null, phase: null, idx: 0, timer: null, pending: false },
    column: createColumn(),
  };
}

function roleFor(e: Engine, slug: string): Role {
  if (e.active !== null) return e.active === slug ? "hot" : "cold";
  if (e.nudge.slug === slug && e.nudge.phase === "out") return "nudge";
  return "rest";
}

/** Points every walk at its current role's pose. Returns whether any
 *  walk was (re)started. Doesn't touch the frame loop. */
function aim(e: Engine): boolean {
  const t = e.tuning;
  let retargeted = false;
  for (const [slug, w] of e.walks) {
    const target = poseFor(roleFor(e, slug), slug, t, e.reduced);
    if (samePose(target, w.target)) continue;
    w.from = w.cur;
    w.target = target;
    w.grow = target.scale >= w.cur.scale;
    w.poke = e.nudge.slug === slug && e.nudge.phase !== null;
    w.fps = w.poke ? t.nudgeFps : t.fps;
    w.acc = 1000 / w.fps; // first cut on the next frame
    w.k = 0;
    w.n = e.reduced
      ? 1
      : Math.max(1, Math.round(w.poke ? t.nudgeSteps : t.steps));
    retargeted = true;
  }
  return retargeted;
}

function stopFrames(e: Engine) {
  if (e.frame !== null) {
    window.cancelAnimationFrame(e.frame);
    e.frame = null;
  }
}

/** Keeps the frame loop alive while anything is unsettled. Each frame
 *  banks the elapsed time into every walk and lets it cut as many times
 *  as its own fps allows — a 24fps walk cuts every second or third
 *  frame, a 60fps poke every frame. Returns true when the loop was started fresh. */
function ensureFrames(e: Engine): boolean {
  if (e.frame !== null) return false;
  e.last = performance.now();
  const loop = (now: number) => {
    e.frame = null;
    // Tab-switch and long-frame jumps are clamped so a walk never skips
    // straight to its end.
    const dt = Math.min(100, now - e.last);
    e.last = now;
    if (tick(e, dt)) e.frame = window.requestAnimationFrame(loop);
  };
  e.frame = window.requestAnimationFrame(loop);
  return true;
}

/** One cut of a walk. */
function cut(w: Walk, e: Engine) {
  const t = e.tuning;
  w.k += 1;
  const p = w.k / w.n;
  // The final cut lands exactly on the pose; intermediate cuts sample
  // the overshooting ease so the sign passes its mark and settles.
  const overshoot = w.grow ? t.growOvershoot : t.shrinkOvershoot;
  const squeeze = w.grow ? t.growSqueeze : t.shrinkSqueeze;
  const eased = w.k === w.n ? 1 : backOut(p, overshoot);
  const prevScale = w.cur.scale;
  const prevX = w.cur.x;
  w.cur = lerpPose(w.from, w.target, eased);
  // Squeeze from this cut's size jump alone, so the first (biggest)
  // cut deforms most and the settle cuts barely do.
  w.squash = e.reduced ? 0 : (w.cur.scale - prevScale) * squeeze;
  // A poke compresses the sign along its travel, whichever way it went
  // (negative squash = narrow and tall), on top of any size squeeze.
  // Scaled by the walk's fps so the same slider value reads the same
  // whether the poke is cut at 16fps or tweened at 60: it is a per-16fps
  // -frame velocity, not a per-cut distance.
  if (w.poke && !e.reduced) {
    w.squash -=
      (Math.abs(w.cur.x - prevX) / Math.max(1, t.height)) *
      t.nudgeSqueeze *
      (w.fps / 16);
  }
}

/** Advances every walk by `dt` ms. Returns whether anything is still
 *  moving (the frame loop keeps going while it is). */
function tick(e: Engine, dt: number): boolean {
  const t = e.tuning;
  let walking = false;
  for (const w of e.walks.values()) {
    w.acc += dt;
    const step = 1000 / w.fps;
    if (w.k >= w.n) {
      // Settled, but the last cut's squeeze is still showing: the next
      // beat clears it (the one-tick echo, like the cartel's smear).
      if (w.squash !== 0) {
        if (w.acc >= step) {
          w.squash = 0;
          w.acc = 0;
        } else {
          walking = true;
        }
      }
      continue;
    }
    while (w.acc >= step && w.k < w.n) {
      w.acc -= step;
      cut(w, e);
    }
    if (w.k >= w.n) w.acc = 0; // the clear tick waits a full step
    walking = true;
  }
  // One pass writes every sign: a cut on one sign moves its neighbours
  // (the stack re-tucks), so they are always drawn together.
  relayout(e.walks, t);
  // The wedge starts at the hot sign's edge, so it is redrawn while the
  // sign walks.
  drawBridge(e);

  // Nudge legs: out, then back, then wait for the next one.
  const g = e.nudge;
  if (g.slug !== null && g.phase !== null) {
    const w = e.walks.get(g.slug);
    if (!w || settled(w)) {
      if (g.phase === "out") {
        g.phase = "back";
        if (aim(e)) walking = true;
      } else {
        g.slug = null;
        g.phase = null;
        scheduleNudge(e);
      }
    }
  }

  // A nudge that was due while the stack was still moving plays now.
  if (!walking && g.pending) {
    g.pending = false;
    startNudge(e);
    return e.frame !== null;
  }
  return walking;
}

/** Aims and makes sure the frame loop is running. A freshly started loop
 *  cuts on its first frame, so hover never waits; a walk restarted while
 *  the loop runs cuts on the next frame too (its bank is primed). */
function retarget(e: Engine) {
  if (aim(e)) {
    if (ensureFrames(e)) tick(e, 0);
  } else if (e.frame === null) {
    // Nothing to walk: shadow / gap / height sliders still need a repaint
    // of the settled stack (and the wedge, if a print is up).
    relayout(e.walks, e.tuning);
    drawBridge(e);
  }
}

function clearNudgeTimer(e: Engine) {
  if (e.nudge.timer !== null) {
    window.clearTimeout(e.nudge.timer);
    e.nudge.timer = null;
  }
}

/** Arms the next nudge a full interval out (or `delayMs`). Replaces any
 *  pending one, so a slider drag or a hover-leave restarts the wait. */
function scheduleNudge(e: Engine, delayMs = e.tuning.nudgeEvery * 1000) {
  clearNudgeTimer(e);
  if (e.tuning.nudgeEvery <= 0) return;
  e.nudge.timer = window.setTimeout(() => {
    e.nudge.timer = null;
    startNudge(e);
  }, delayMs);
}

/** Plays a nudge on the next sign in turn, if the stack is idle: nothing
 *  hovered, everything settled, tab visible, motion allowed. When it
 *  can't right now it either waits for the stack to settle or, if a hover
 *  is in charge, stands down — the hover's release re-arms it. */
function startNudge(e: Engine) {
  if (e.active !== null || e.reduced || e.tuning.nudgeEvery <= 0) return;
  if (document.visibilityState !== "visible") return;
  if (e.nudge.phase !== null) return;
  for (const w of e.walks.values()) {
    if (!settled(w)) {
      e.nudge.pending = true;
      return;
    }
  }
  const sign = SIGNS[e.nudge.idx % SIGNS.length];
  if (!sign) return;
  e.nudge.idx += 1;
  e.nudge.slug = sign.slug;
  e.nudge.phase = "out";
  retarget(e);
}

/** Drops a nudge in progress (its sign is re-aimed by whatever role now
 *  applies) and any pending one. */
function cancelNudge(e: Engine) {
  clearNudgeTimer(e);
  e.nudge.slug = null;
  e.nudge.phase = null;
  e.nudge.pending = false;
}

export default function RoadSigns({
  controls = true,
  tuning: override,
  frame = "stage",
  replay = 0,
  selected = null,
}: {
  controls?: boolean;
  /**
   * The project that is open beside the stack (the landing's project
   * window), or null. Its sign holds the hot pose and the others the
   * cold one; a hover still takes the hot pose for itself, so the rest
   * can be looked over and clicked straight to. While one is open the
   * column stays put, faded, under the window — the box shrinks back
   * onto its print — and only the signs themselves take the pointer,
   * so the page can put the stack over the window's edge without the
   * stage covering it.
   */
  selected?: string | null;
  /**
   * What the piece's root box is sized to. "stage" (default): the whole
   * stage — the stack plus the room the card and rope need — for pages
   * that center the piece. "signs": just the signs at rest, with the
   * stage hanging off it (overflow visible), so a page can put the stack
   * on a wall by its own edges — the landing parks it bottom-left. The
   * column still sits at the stage's right edge either way.
   */
  frame?: "stage" | "signs";
  /**
   * Bump to play the mount entrance again in place. The entrance: the
   * signs drop in one after another in hard cuts — the site's shared
   * `sm-drop` keyframes (packages/lab/src/motion), staggered by the
   * motion tuning's lead and stagger, so /lab/motion tunes this too. The
   * walk engine keeps writing its transforms underneath; the animation
   * wins while it runs and releases on its last cut (fill backwards), so
   * a hover mid-entrance takes over the moment it ends. Each sign's drop
   * restarts from its first pose, on the same stagger, with the stack
   * otherwise untouched — no teardown, so a page that brings the signs
   * back into view replays them with no dead frames.
   */
  replay?: number;
  /**
   * Values laid over ROAD_SIGNS_DEFAULTS — for trial pages that want the
   * stack at a different feel without touching the defaults. Applied at
   * mount and again whenever the object's values change (a toggle), which
   * also resets any bench edits.
   */
  tuning?: Partial<RoadSignsTuning>;
}) {
  const motion = useMotionTuning();
  const [tuning, setTuning] = useState<RoadSignsTuning>({
    ...ROAD_SIGNS_DEFAULTS,
    ...override,
  });
  const overrideKey = JSON.stringify(override ?? null);
  useEffect(() => {
    if (override === undefined) return;
    setTuning({ ...ROAD_SIGNS_DEFAULTS, ...override });
    // The key stands in for the object so a fresh literal per render
    // doesn't re-apply every time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideKey]);
  const [hovered, setHovered] = useState<string | null>(null);
  const sound = useSoundTuning();
  // Bench-only: pin a sign hovered so its hot pose holds while the pointer
  // is over the sliders. null = the real pointer decides.
  const [pinned, setPinned] = useState<string | null>(null);
  // The project whose print is up. Its sign stays lifted while the
  // pointer is over the column, the way the site keeps the title
  // highlighted.
  const [cardActive, setCardActive] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const active = pinned ?? hovered ?? selected ?? cardActive;

  // The engine is state so it's created exactly once per instance; it is
  // mutated in place and never set again.
  const [engine] = useState(() => createEngine(tuning));

  useEffect(() => {
    engine.column.onActive = setCardActive;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    engine.reduced = mq.matches;
    const onChange = () => {
      engine.reduced = mq.matches;
      if (mq.matches) cancelNudge(engine);
    };
    mq.addEventListener("change", onChange);

    // Nudges stand down while the tab is hidden (frames pause there
    // anyway) and re-arm a full interval after it returns.
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (engine.active === null && engine.nudge.phase === null) {
          scheduleNudge(engine);
        }
      } else {
        clearNudgeTimer(engine);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mq.removeEventListener("change", onChange);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelNudge(engine);
      stopFrames(engine);
      columnCleanup(engine);
    };
  }, [engine]);

  // Feed React's view of the world to the engine and re-aim. A hover (or
  // pin) takes over from any nudge; releasing it re-arms the nudge timer a
  // full interval out, as does any slider change while idle.
  useEffect(() => {
    engine.tuning = tuning;
    engine.active = active;
    engine.column.stackAt = geometry(tuning).stackAt;
    if (active !== null) cancelNudge(engine);
    retarget(engine);
    if (active === null && engine.nudge.phase === null) scheduleNudge(engine);
  }, [engine, active, tuning]);

  // A replay restarts every sign's entrance in place, on the same
  // stagger (the delays are still on the elements).
  useEffect(() => {
    if (replay === 0) return;
    for (const w of engine.walks.values()) replayClass(w.el, "rs-sign-enter");
  }, [engine, replay]);

  // A project opening fades the column in place, and any on its way;
  // the project closing brings its print back for the window to land
  // on, and the ordinary timers take it from there.
  // The open project's prints are handed over (the box is the print):
  // set here, not through the Print's props — a re-render would write
  // the class list over the engine's own marks on the print.
  const wasSelected = useRef<string | null>(null);
  useEffect(() => {
    for (const [i, el] of engine.column.items.entries()) {
      el?.classList.toggle("is-handed", TRACK[i]?.slug === selected);
    }
    if (selected !== null) {
      cancelShow(engine);
      hideProject(engine, "fade");
    } else if (wasSelected.current !== null) {
      restoreProject(engine, wasSelected.current);
    }
    wasSelected.current = selected;
  }, [engine, selected]);

  // Bench pin: holds the print up too, no hover needed.
  useEffect(() => {
    if (pinned !== null) showProject(engine, pinned);
    else if (engine.column.active !== null) hideProject(engine);
  }, [engine, pinned]);

  const geo = geometry(tuning);

  function register(slug: string, el: HTMLAnchorElement | null) {
    const walks = engine.walks;
    if (!el) {
      // Ref callbacks are re-run on re-render; only a real unmount (the
      // anchor left the document) should drop the walk, or a slider drag
      // mid-walk would reset the sign to rest.
      const w = walks.get(slug);
      if (w && !w.el.isConnected) walks.delete(slug);
      return;
    }
    const existing = walks.get(slug);
    if (existing) {
      existing.el = el;
      return;
    }
    const w: Walk = {
      el,
      from: REST,
      target: REST,
      cur: REST,
      k: 1,
      n: 1,
      squash: 0,
      y: 0,
      grow: true,
      poke: false,
      fps: engine.tuning.fps,
      acc: 0,
    };
    walks.set(slug, w);
    apply(w, engine.tuning);
  }

  function registerColumn<K extends keyof ColumnDom>(
    key: K,
    el: ColumnDom[K] | null,
  ) {
    if (el) engine.column.dom[key] = el;
  }

  function registerPrint(index: number, el: HTMLAnchorElement | null) {
    if (el) engine.column.items[index] = el;
  }

  // A click on a peeking print steps the column to it; on the centred
  // print, once it has settled, it is the link it is (the landing opens
  // the project from it). A click mid-step is only a step.
  function onPrintClick(
    ev: ReactMouseEvent<HTMLAnchorElement>,
    index: number,
    slug: string,
  ) {
    play("knock", 1, { at: "click" });
    const r = engine.column;
    if (index === r.index && r.settled && r.active === slug) return;
    ev.preventDefault();
    showProject(engine, slug);
  }

  // The site's title handlers, on the signs. The sign's own lift is still
  // React's `hovered`; these drive the column.
  function onSignEnter(slug: string) {
    play("tap", 1, { at: "sign" });
    setHovered(slug);
    if (selected !== null) return;
    const r = engine.column;
    if (r.active === slug && !r.closing) {
      cancelHide(engine);
      return;
    }
    scheduleShow(engine, slug, engine.tuning.showDelay);
  }

  function onSignLeave(ev: ReactPointerEvent<HTMLAnchorElement>) {
    cancelShow(engine);
    const t = engine.tuning;
    // Leaving through the sign's right half counts as heading for the
    // column, whatever the angle: the tilted photo's real edge sits inside
    // its bounding box, so an exact right-edge test rarely fired. The
    // wedge (drawBridge) catches the pointer from here on.
    const rect = ev.currentTarget.getBoundingClientRect();
    const towardCard = ev.clientX >= rect.left + rect.width / 2;
    scheduleHide(engine, towardCard ? t.hideTowardCard : t.hideDelay);
  }

  function set(key: NumericKey<RoadSignsTuning>, value: number) {
    setTuning((prev) => ({ ...prev, [key]: value }));
  }

  function setTilt(key: "hoverTilt" | "dimTilt", slug: string, value: number) {
    setTuning((prev) => ({
      ...prev,
      [key]: { ...prev[key], [slug]: value },
    }));
  }

  function reset() {
    setTuning({
      ...ROAD_SIGNS_DEFAULTS,
      hoverTilt: { ...ROAD_SIGNS_DEFAULTS.hoverTilt },
      dimTilt: { ...ROAD_SIGNS_DEFAULTS.dimTilt },
    });
    setPinned(null);
  }

  async function copy() {
    const lines = Object.entries(tuning)
      .map(([k, v]) =>
        typeof v === "number"
          ? `  ${k}: ${v},`
          : `  ${k}: { ${Object.entries(v)
              .map(([s, d]) => `${s}: ${d}`)
              .join(", ")} },`,
      )
      .join("\n");
    await navigator.clipboard.writeText(`{\n${lines}\n}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const slider = (f: Field) => (
    <TuneSlider
      key={f.key}
      label={f.label}
      hint={f.hint}
      min={f.min}
      max={f.max}
      step={f.step}
      unit={f.unit}
      value={tuning[f.key]}
      onChange={(v) => set(f.key, v)}
    />
  );

  // The column's sizes and clocks, fed to the stylesheet.
  const stageVars = {
    "--rs-print-w": `${tuning.printW}px`,
    "--rs-col-w": `${tuning.printW + COLUMN_ROOM}px`,
    "--rs-col-right": `${tuning.columnRight}px`,
    "--rs-peek-gap": `${tuning.peekGap}px`,
    "--rs-slide": `${tuning.slideDuration}ms`,
    "--rs-move": `${tuning.moveDuration}ms`,
    "--rs-fade": `${tuning.fadeDuration}s`,
  } as CSSProperties;

  // frame="signs": the root is the signs' rest box and the stage is
  // offset inside it so the first sign's top-left corner lands on the
  // root's — the stack's padding and the column's room are hung outside,
  // overflow visible (the page clips the column's slide at its own
  // edge). frame="stage" clips it at the stage's.
  const signsBox = frame === "signs" ? geo.signs : null;

  const stage = (
    <div
      ref={(el) => {
        engine.column.stage = el;
      }}
      className={selected !== null ? "is-open" : undefined}
      onPointerLeave={() => scheduleHide(engine, tuning.hideFromStage)}
      style={{
        position: signsBox ? "absolute" : "relative",
        overflow: signsBox ? undefined : "clip",
        left: signsBox ? -(geo.stackAt.x + geo.padX) : undefined,
        top: signsBox ? -(geo.stackAt.y + geo.padY) : undefined,
        width: geo.stage.w,
        height: geo.stage.h,
        pointerEvents: selected !== null ? "none" : undefined,
        ...stageVars,
      }}
    >
      {/* The safe wedge between the hot sign and the column. First in
            the stage so it paints — and hit-tests — under the signs and
            the prints; only the polygon takes the pointer, and only while
            a print is up (is-live). Geometry is written by drawBridge. */}
      <svg
        ref={(el) => registerColumn("bridgeSvg", el)}
        className="rs-bridge"
        aria-hidden
      >
        <polygon
          ref={(el) => registerColumn("bridge", el)}
          onPointerEnter={() => cancelHide(engine)}
          onPointerLeave={() => scheduleHide(engine, tuning.hideFromCard)}
        />
      </svg>
      <div
        onPointerLeave={() => setHovered(null)}
        style={{
          position: "absolute",
          left: geo.stackAt.x,
          top: geo.stackAt.y,
          display: "grid",
          justifyItems: "start",
          gap: tuning.gap,
          // Room for the hot sign to grow and nudge without clipping
          // against the stage edge.
          padding: `${geo.padY}px ${geo.padX}px`,
        }}
      >
        {SIGNS.map((sign, i) => (
          <a
            key={sign.slug}
            ref={(el) => register(sign.slug, el)}
            href={sign.href}
            aria-label={sign.title}
            aria-current={selected === sign.slug ? "page" : undefined}
            // The clay cursor reads this: the open sign is its own close.
            data-cursor-label={selected === sign.slug ? "close" : undefined}
            className="rs-sign-enter"
            onPointerEnter={() => onSignEnter(sign.slug)}
            onPointerLeave={onSignLeave}
            onClick={() => play("knock", 1, { at: "click" })}
            onFocus={() => {
              play("tap", 1, { at: "sign" });
              setHovered(sign.slug);
              if (selected === null) showProject(engine, sign.slug);
            }}
            onBlur={() => {
              setHovered((h) => (h === sign.slug ? null : h));
              scheduleHide(engine, 120);
            }}
            style={{
              display: "block",
              position: "relative",
              pointerEvents: "auto",
              zIndex: active === sign.slug ? 1 : 0,
              height: tuning.height,
              width: tuning.height * sign.aspect,
              transformOrigin: "50% 50%",
              // Hard cuts only — the walk writes transform/opacity on the
              // beat and nothing may ease between them.
              transition: "none",
              outline: "none",
              // Stagger of the mount entrance (see rs-sign-enter).
              animationDelay: `${motion.lead + i * motion.stagger}ms`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized WebP with imperative transforms; the Next optimizer adds nothing here */}
            <img
              src={sign.src}
              alt=""
              draggable={false}
              decoding="async"
              // No preload hint: React would otherwise hoist a
              // <link rel=preload> for every sign into the page head, and
              // on the landing the stack is a screen below the cartel,
              // whose front frame is the largest paint. The boxes are
              // pre-sized and the walk never waits on the photos, so they
              // can come in behind the critical set.
              fetchPriority="low"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                userSelect: "none",
              }}
            />
          </a>
        ))}
      </div>

      {/* The prints' column: the track's seven (TRACK — the three and
            their clones), centred on the up one by showProject; the
            stylesheet slides the column in from the edge and steps the
            track. The pointer on it keeps it up. */}
      <div
        ref={(el) => registerColumn("column", el)}
        className="rs-prints"
        onPointerEnter={() => cancelHide(engine)}
        onPointerLeave={() => scheduleHide(engine, tuning.hideFromCard)}
      >
        <div
          ref={(el) => registerColumn("track", el)}
          className="rs-track"
          style={{ top: geo.cardTop }}
        >
          {TRACK.map((spec, i) => (
            <Print
              key={i}
              spec={spec}
              index={i}
              refCallback={(el) => registerPrint(i, el)}
              onClick={(ev) => onPrintClick(ev, i, spec.slug)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{PRINT_CSS + COLUMN_CSS}</style>
      {signsBox ? (
        <div
          style={{
            position: "relative",
            width: signsBox.w,
            height: signsBox.h,
          }}
        >
          {stage}
        </div>
      ) : (
        stage
      )}

      {controls && (
        <div
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            width: 300,
            maxHeight: "calc(100vh - 32px)",
            overflowY: "auto",
            padding: "10px 14px 12px",
            borderRadius: 14,
            border: "1px solid rgba(128, 128, 128, 0.4)",
            background: "rgba(20, 20, 24, 0.78)",
            color: "#fff",
            fontSize: 12,
            lineHeight: 1.35,
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Preview pin: hold a sign hovered so its pose stays on screen
              while the pointer is over the sliders. */}
          <div style={{ display: "grid", gap: 6, paddingBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontWeight: 600 }}>Preview</span>
              <span style={{ opacity: 0.55, fontSize: 11 }}>
                hold a sign hovered while you tune
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setPinned(null)}
                aria-pressed={pinned === null}
                style={chip(pinned === null)}
              >
                Pointer
              </button>
              {SIGNS.map((sign) => (
                <button
                  key={sign.slug}
                  type="button"
                  onClick={() => setPinned(sign.slug)}
                  aria-pressed={pinned === sign.slug}
                  style={chip(pinned === sign.slug)}
                >
                  {sign.title}
                </button>
              ))}
            </div>
          </div>

          <Section
            title="Hovered sign"
            summary="how the sign under the pointer lifts"
            defaultOpen
          >
            {HOT_FIELDS.map(slider)}
            {SIGNS.map((sign) => (
              <TuneSlider
                key={`tilt-${sign.slug}`}
                label={`Tilt · ${sign.title}`}
                hint={`${sign.title}'s angle while hovered. Left of 0 turns counter-clockwise.`}
                min={-12}
                max={12}
                step={0.5}
                unit="°"
                value={tuning.hoverTilt[sign.slug] ?? 0}
                onChange={(v) => setTilt("hoverTilt", sign.slug, v)}
              />
            ))}
          </Section>

          <Section
            title="Other signs"
            summary="how the rest step back while one is hovered"
          >
            {COLD_FIELDS.map(slider)}
            {SIGNS.map((sign) => (
              <TuneSlider
                key={`dim-tilt-${sign.slug}`}
                label={`Tilt · ${sign.title}`}
                hint={`${sign.title}'s angle while another sign is hovered. Right of 0 turns clockwise.`}
                min={-12}
                max={12}
                step={0.5}
                unit="°"
                value={tuning.dimTilt[sign.slug] ?? 0}
                onChange={(v) => setTilt("dimTilt", sign.slug, v)}
              />
            ))}
          </Section>

          <Section title="Motion" summary="the stop-motion beat and its punch">
            {MOTION_FIELDS.map(slider)}
          </Section>

          <Section title="Idle nudge" summary="a sign asks to be hovered">
            {NUDGE_FIELDS.map(slider)}
            <button
              type="button"
              onClick={() => {
                // Bench: play one now rather than waiting out the interval.
                // Only lands when the stack is idle, like a real one.
                clearNudgeTimer(engine);
                startNudge(engine);
              }}
              style={{ ...btn, justifySelf: "start" }}
            >
              ▶ Nudge now
            </button>
          </Section>

          <Section title="Layout & shadow" summary="sizes, spacing, the wall">
            {LAYOUT_FIELDS.map(slider)}
          </Section>

          <Section title="Prints" summary="the column: sizes and moves">
            {PRINT_FIELDS.map(slider)}
          </Section>

          <Section title="Timing" summary="the graces before it shows and goes">
            {TIMING_FIELDS.map(slider)}
          </Section>

          <Section title="Sound" summary="taps, slides, knocks, letters">
            {SOUND_FIELDS.map((f) => (
              <TuneSlider
                key={f.key}
                label={f.label}
                hint={f.hint}
                min={f.min}
                max={f.max}
                step={f.step}
                unit={f.unit}
                value={sound[f.key]}
                onChange={(v) => setSoundTuning({ [f.key]: v })}
              />
            ))}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(
                [
                  "cut",
                  "tap",
                  "knock",
                  "slide",
                  "slideOut",
                  "lift",
                  "liftBack",
                  "letter",
                ] as const
              ).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => play(name)}
                  style={btn}
                >
                  ▶ {name}
                </button>
              ))}
              <button type="button" onClick={resetSoundTuning} style={btn}>
                Reset sound
              </button>
            </div>
          </Section>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 8,
              paddingTop: 10,
              borderTop: "1px solid rgba(128, 128, 128, 0.25)",
            }}
          >
            <button type="button" onClick={reset} style={btn}>
              Reset
            </button>
            <button type="button" onClick={copy} style={btn}>
              {copied ? "Copied ✓" : "Copy values"}
            </button>
          </div>
          <p style={{ margin: "6px 0 0", opacity: 0.55, fontSize: 11 }}>
            Values last until reload. Lock a feel in by pasting them into
            ROAD_SIGNS_DEFAULTS in packages/lab/src/pieces/road-signs/index.tsx.
          </p>
        </div>
      )}
    </>
  );
}

/** A slider row over the tuning's numbers (everything but the per-sign
 *  tilt maps), each with its hint and unit. */
type Field = Required<BenchField<RoadSignsTuning>>;

const HOT_FIELDS: Field[] = [
  {
    key: "hoverScale",
    label: "Size",
    hint: "How much bigger the hovered sign gets. 1 = no change.",
    min: 1,
    max: 1.5,
    step: 0.01,
    unit: "×",
  },
  {
    key: "hoverNudge",
    label: "Push",
    hint: "Slides the hovered sign sideways. Right of 0 pushes it right.",
    min: -24,
    max: 24,
    step: 1,
    unit: "px",
  },
];

const COLD_FIELDS: Field[] = [
  {
    key: "dimScale",
    label: "Size",
    hint: "How much smaller the other signs get. 1 = no change.",
    min: 0.6,
    max: 1,
    step: 0.01,
    unit: "×",
  },
  {
    key: "dimOpacity",
    label: "Fade",
    hint: "How visible the other signs stay. 1 = fully visible.",
    min: 0.1,
    max: 1,
    step: 0.01,
    unit: "",
  },
];

const MOTION_FIELDS: Field[] = [
  {
    key: "fps",
    label: "Beat",
    hint: "Cuts per second for the signs. 12 is the stop-motion beat the cartel uses; 60 is a smooth tween.",
    min: 4,
    max: 60,
    step: 1,
    unit: "fps",
  },
  {
    key: "steps",
    label: "Cuts",
    hint: "How many hard cuts a change takes. 1 is a single jump; more is a longer walk.",
    min: 1,
    max: 8,
    step: 1,
    unit: "",
  },
  {
    key: "growOvershoot",
    label: "Overshoot · growing",
    hint: "How far a sign that is getting bigger passes its pose before settling. 0 never passes it; 2+ visibly bounces.",
    min: 0,
    max: 3,
    step: 0.1,
    unit: "",
  },
  {
    key: "shrinkOvershoot",
    label: "Overshoot · shrinking",
    hint: "Same, for a sign that is getting smaller.",
    min: 0,
    max: 3,
    step: 0.1,
    unit: "",
  },
  {
    key: "growSqueeze",
    label: "Squeeze · growing",
    hint: "The punch when a sign gets bigger: it lands wide and short for one cut. 0 = none.",
    min: 0,
    max: 3,
    step: 0.1,
    unit: "",
  },
  {
    key: "shrinkSqueeze",
    label: "Squeeze · shrinking",
    hint: "The punch when a sign gets smaller: it lands narrow and tall for one cut. 0 = none.",
    min: 0,
    max: 3,
    step: 0.1,
    unit: "",
  },
];

const NUDGE_FIELDS: Field[] = [
  {
    key: "nudgeEvery",
    label: "Every",
    hint: "Seconds between nudges while nothing is hovered. 0 turns them off.",
    min: 0,
    max: 10,
    step: 0.5,
    unit: "s",
  },
  {
    key: "nudgePush",
    label: "Shove",
    hint: "How far the poke pushes the sign sideways. Left of 0 pushes it left.",
    min: -24,
    max: 24,
    step: 1,
    unit: "px",
  },
  {
    key: "nudgeTilt",
    label: "Twist",
    hint: "The little turn the poke gives it. Left of 0 turns counter-clockwise.",
    min: -6,
    max: 6,
    step: 0.25,
    unit: "°",
  },
  {
    key: "nudgeSqueeze",
    label: "Squeeze",
    hint: "How much the sign compresses along the shove while it moves fast. 0 = none.",
    min: 0,
    max: 3,
    step: 0.1,
    unit: "",
  },
  {
    key: "nudgeFps",
    label: "Frame rate",
    hint: "The poke's own rate. 60 is a smooth tween; 16 is the same hard cuts as the hover; try 8 or 12 for chunkier.",
    min: 4,
    max: 60,
    step: 1,
    unit: "fps",
  },
  {
    key: "nudgeSteps",
    label: "Frames per leg",
    hint: "Frames for the shove out, and again for the swing back. With the frame rate this is the length: 20 at 60fps is a third of a second each way.",
    min: 2,
    max: 40,
    step: 1,
    unit: "",
  },
];

const LAYOUT_FIELDS: Field[] = [
  {
    key: "height",
    label: "Sign height",
    hint: "Height of every sign at rest. Widths follow the photos.",
    min: 32,
    max: 140,
    step: 1,
    unit: "px",
  },
  {
    key: "gap",
    label: "Gap",
    hint: "Space between signs at rest.",
    min: 0,
    max: 48,
    step: 1,
    unit: "px",
  },
  {
    key: "dimGap",
    label: "Gap · shrunk",
    hint: "Space between two shrunken signs. The stack tucks together as they shrink.",
    min: 0,
    max: 48,
    step: 1,
    unit: "px",
  },
  {
    key: "shadow",
    label: "Shadow",
    hint: "How dark the cast shadow is. It grows longer as a sign lifts.",
    min: 0,
    max: 0.6,
    step: 0.01,
    unit: "",
  },
];

const PRINT_FIELDS: Field[] = [
  {
    key: "printW",
    label: "Print",
    hint: "A wide print's width. A tall one is a share of it.",
    min: 280,
    max: 1100,
    step: 10,
    unit: "px",
  },
  {
    key: "cardSpan",
    label: "Reach",
    hint: "Width of the column region right of the stack. The column sits at its far edge; on the site this puts that edge on the screen's.",
    min: 400,
    max: 1400,
    step: 10,
    unit: "px",
  },
  {
    key: "columnRight",
    label: "Right air",
    hint: "Air between the column and the stage's right edge.",
    min: 0,
    max: 120,
    step: 2,
    unit: "px",
  },
  {
    key: "cardY",
    label: "Up / down",
    hint: "The column's centre line relative to the stack's middle. Left of 0 raises it. The site centres it on the screen.",
    min: -320,
    max: 320,
    step: 2,
    unit: "px",
  },
  {
    key: "peekGap",
    label: "Peek gap",
    hint: "Air between the centred print and the ones peeking above and below.",
    min: 0,
    max: 120,
    step: 2,
    unit: "px",
  },
  {
    key: "slideDuration",
    label: "Slide",
    hint: "The column's slide in from the edge, and back out.",
    min: 100,
    max: 1200,
    step: 10,
    unit: "ms",
  },
  {
    key: "moveDuration",
    label: "Step",
    hint: "The column's step to the next print.",
    min: 100,
    max: 1200,
    step: 10,
    unit: "ms",
  },
];

const TIMING_FIELDS: Field[] = [
  {
    key: "showDelay",
    label: "Show after",
    hint: "The pointer must rest on a sign this long before its print comes out.",
    min: 0,
    max: 400,
    step: 10,
    unit: "ms",
  },
  {
    key: "hideDelay",
    label: "Hide after",
    hint: "After leaving a sign, not toward the column.",
    min: 0,
    max: 600,
    step: 10,
    unit: "ms",
  },
  {
    key: "hideTowardCard",
    label: "Toward column",
    hint: "After leaving a sign toward the column: the grace to reach it.",
    min: 0,
    max: 800,
    step: 10,
    unit: "ms",
  },
  {
    key: "hideFromCard",
    label: "From column",
    hint: "After leaving the column.",
    min: 0,
    max: 600,
    step: 10,
    unit: "ms",
  },
  {
    key: "hideFromStage",
    label: "From stage",
    hint: "After leaving the whole stage.",
    min: 0,
    max: 600,
    step: 10,
    unit: "ms",
  },
  {
    key: "fadeDuration",
    label: "Fade",
    hint: "The column's fade out in place when a project opens, and back in when it closes.",
    min: 0,
    max: 1,
    step: 0.02,
    unit: "s",
  },
  {
    key: "returnDelay",
    label: "Return",
    hint: "After a project closes, how long its print stays before the column goes back out — the window's way back, on the site.",
    min: 0,
    max: 2000,
    step: 20,
    unit: "ms",
  },
];

/**
 * The wedge and the column. Sizes and clocks come from the tuning via
 * custom properties (stageVars); the prints' own stylesheet is
 * PRINT_CSS.
 */
const COLUMN_CSS = `
/* The safe wedge: invisible, and only a pointer target while a print is
   up. No z-index — it paints in DOM order, under the signs. */
.rs-bridge { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.rs-bridge polygon { fill: transparent; pointer-events: none; }
.rs-bridge.is-live polygon { pointer-events: fill; }
/* The column: parked past the stage's right edge, out of sight. is-in
   slides it onto the mat on the settle curve; going, it slides back out
   and only then hides. is-off fades it where it is (a project is open;
   the print stays for the window's box to come back to), on the
   window's fade where the page sets one (--rs-hand). */
.rs-prints { position: absolute; top: 0; bottom: 0; right: var(--rs-col-right, 0px); width: var(--rs-col-w, 700px); z-index: 3; visibility: hidden; pointer-events: none; transform: translateX(calc(100% + var(--rs-col-right, 0px) + 80px)); transition: transform var(--rs-slide, .5s) ${SETTLE_EASE}, visibility 0s linear var(--rs-slide, .5s), opacity var(--rs-hand, var(--rs-fade, .18s)) ease; }
.rs-prints.is-in { visibility: visible; pointer-events: auto; transform: none; transition-delay: 0s; }
.rs-prints.is-off { opacity: 0; pointer-events: none; }
/* The track: the prints one under the other, moved by placeTrack so the
   up one sits on the track's top edge — the column's centre line. */
.rs-track { position: absolute; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; gap: var(--rs-peek-gap, 28px); will-change: transform; transition: transform var(--rs-move, .45s) ${SETTLE_EASE}; }
/* The mount entrance, one sign after another (the delay is inline, per
   sign): the site's sm-drop keyframes and --sm-duration, generated from
   the motion tuning by <MotionStyles> in the root layout. Fill backwards,
   not both — once it ends the walk engine's inline transform must be what
   shows. */
.rs-sign-enter { animation: sm-drop var(--sm-duration, .38s) steps(1, end) backwards; }
@media (prefers-reduced-motion: reduce) {
  .rs-sign-enter { animation-duration: .01ms; animation-delay: 0ms !important; }
  .rs-prints, .rs-track { transition-duration: .01ms; }
}
`;

const btn: CSSProperties = {
  font: "inherit",
  color: "inherit",
  background: "#222",
  border: "1px solid #555",
  borderRadius: 8,
  padding: "5px 12px",
  cursor: "pointer",
};

const chip = (on: boolean): CSSProperties => ({
  font: "inherit",
  fontSize: 11,
  color: on ? "#fff" : "rgba(255, 255, 255, 0.75)",
  background: on ? "#5b7cfa" : "rgba(255, 255, 255, 0.08)",
  border: `1px solid ${on ? "#5b7cfa" : "rgba(255, 255, 255, 0.18)"}`,
  borderRadius: 999,
  padding: "3px 10px",
  cursor: "pointer",
});

// A collapsible group in the panel. Groups read as a short table of
// contents; open what's being tuned. Plain local state.
function Section({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderTop: "1px solid rgba(128, 128, 128, 0.25)" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          width: "100%",
          padding: "8px 0",
          border: "none",
          background: "transparent",
          color: "#fff",
          textAlign: "left",
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
            opacity: 0.7,
          }}
        >
          ▶
        </span>
        <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{title}</span>
        <span style={{ opacity: 0.5, fontSize: 11 }}>{summary}</span>
      </button>
      {open && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "2px 0 12px",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function TuneSlider({
  label,
  hint,
  min,
  max,
  step,
  unit,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 3 }}>
      <span
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span>{label}</span>
        <span
          style={{
            fontVariantNumeric: "tabular-nums",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: 6,
            padding: "1px 6px",
          }}
        >
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#5b7cfa", margin: 0 }}
      />
      <span style={{ opacity: 0.55, fontSize: 11 }}>{hint}</span>
    </label>
  );
}
