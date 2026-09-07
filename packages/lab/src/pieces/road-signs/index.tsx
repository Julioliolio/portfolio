"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useMotionTuning } from "../../motion";

/**
 * Road signs: the projects stack. Three photographed road signs, one per
 * project, stacked like a directional signpost. Hovering a sign lifts it
 * (bigger, tilted a few degrees — each sign has its own angle — nudged
 * out, longer shadow) while the other signs step back (smaller, each at
 * its own tilt, dimmed to ~50%) and the stack tucks together. Leaving the
 * stack settles everything to rest. Each sign is a link to its project
 * page.
 *
 * The rope and card mechanics are a copy of yichenxie.com's project list
 * (lifted from its script and stylesheet on 2026-09-06); the card's
 * design is Julio's mockup of 2026-09-06: no container, just the
 * project's media (a still or a video, never the live demo) with the
 * blurb and the tag pills beside it on the bare wall. Wide media gets the
 * copy in a row underneath (blurb left, pills right); tall media gets the
 * copy to its right, sat on the media's bottom edge. The card is pinned
 * to the stage's right edge and springs in by CSS (0.58s overshooting
 * curve from a slight offset, 0.965 scale and a 0.35° tilt) while a 2px
 * ink rope with a dot at each end fades in between the sign's edge and
 * the media's. The rope's droop is a
 * real spring (stiffness 118, damping 15.5) that sags from flat to 44px on
 * first reveal and is nudged ±8px by the pointer's height over the card.
 * The card is a link and stays up while the pointer travels to it
 * (leaving the sign toward the card — its right half — waits 240ms,
 * elsewhere 70ms; leaving the card 140ms; leaving the stage 100ms), and
 * its sign stays lifted meanwhile. An invisible wedge (see drawBridge)
 * fans out from the hot sign's middle to the card's left edge while the
 * card is up: the pointer can cross the wall along any straight-ish line
 * between the two without the card dropping, and the wedge sits under the
 * signs and the card so it never steals a hover from them. Hiding pulls
 * the sag back to flat and fades both out. See RopeState / showProject /
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
 * (Tuning.nudgeFps / nudgeSteps; 16 turns the poke into the same cuts).
 * The poke carries its own squeeze — compression along the shove in
 * proportion to how fast it is moving, so it lands narrow and tall and
 * re-forms as it slows — the cartel's smear along the axis of motion.
 * Reads as a finger flicking the sign: a hint that it can be touched. Any
 * hover cancels it and the next nudge waits a full interval after the
 * pointer leaves; hidden tabs and prefers-reduced-motion get no nudges.
 *
 * One frame loop drives every walk, and runs only while something is
 * unsettled. Each walk banks the elapsed time and cuts at its own fps —
 * a 16fps hover walk every fourth frame, a 60fps poke every frame — and a
 * freshly (re)started walk cuts on the very next frame so hover never
 * feels late. prefers-reduced-motion collapses each walk to a single cut
 * with no tilt and no squeeze.
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

/** The project card a sign's rope leads to: media plus a caption, no
 *  container. The media is a muted looping video (placeholder clips from
 *  apps/web/public/media/ until each project's own lands). */
type CardSpec = {
  /** wide: copy row underneath. tall (phone projects): copy to its
   *  right. */
  media: "wide" | "tall";
  /** The clip, under apps/web/public/. */
  src: string;
  /** The clip's width / height — the media box takes this shape rather
   *  than cropping. */
  aspect: number;
  blurb: string;
  tags: string[];
};

/** Placeholder clips, until each project has its own. */
const PLACEHOLDER_WIDE = {
  src: "/media/placeholder-wide.mp4",
  aspect: 1056 / 720,
};
const PLACEHOLDER_TALL = {
  src: "/media/placeholder-tall.mp4",
  aspect: 720 / 826,
};

type Sign = {
  slug: string;
  title: string;
  src: string;
  href: string;
  /** width / height, printed by prepare-signs.mjs — sizes the box before
   *  the photo decodes. */
  aspect: number;
  card: CardSpec;
};

const SIGNS: Sign[] = [
  {
    slug: "localpal",
    title: "LocalPal",
    src: "/signs/localpal.webp",
    href: "/work/localpal",
    aspect: 3.31,
    card: {
      media: "tall",
      ...PLACEHOLDER_TALL,
      blurb:
        "A phone-first companion for meeting people nearby — plans, venues and friends on one live map. Designed and built end-to-end.",
      tags: ["iOS", "Design System", "End-to-end"],
    },
  },
  {
    slug: "camper",
    title: "Camper",
    src: "/signs/camper.webp",
    href: "/work/camper",
    aspect: 3.563,
    card: {
      media: "wide",
      ...PLACEHOLDER_WIDE,
      blurb:
        "Placeholder: a trip planner for van travel — routes, stops and the weather in between. Media and copy to come.",
      tags: ["Concept", "Motion", "Web"],
    },
  },
  {
    slug: "convertr",
    title: "Convertr",
    src: "/signs/convertr.webp",
    href: "/work/convertr",
    aspect: 3.303,
    card: {
      media: "wide",
      ...PLACEHOLDER_WIDE,
      blurb:
        "A desktop file converter with a mocked conversion flow — drop files, pick a format, get results. Runs live inside the portfolio.",
      tags: ["Desktop", "Product Design", "Live demo"],
    },
  },
];

/** The site's ink: card text. */
const INK = "#2b2722";
/** The rope and its dots — the accent blue from Julio's mockup rather than
 *  the site's ink. */
const ROPE = "#2f6df6";

export type RoadSignsTuning = {
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
  /** The poke's own cut rate. 60 = a smooth tween; 16 = the same hard
   *  cuts as the hover walk. Everything else keeps tuning.fps. */
  nudgeFps: number;
  /** Cuts per leg of the poke (out, and back). With nudgeFps this sets
   *  the leg's length: 20 at 60fps = a third of a second. */
  nudgeSteps: number;

  // ---- the card and the rope (defaults are the site's values)
  /** Width of the card region to the right of the stack, px. The card's
   *  right edge is pinned to the stage's right edge, so this sets how far
   *  the rope has to travel. */
  cardSpan: number;
  /** Card centre, px below the stack's middle (negative = above). */
  cardY: number;
  /** Width of a wide card, px: its media and the copy row under it. */
  cardWide: number;
  /** Width of a tall card's media, px; the copy column beside it is the
   *  same width again. */
  cardTall: number;
  /** Air between the sign's edge and the rope's first dot, and between
   *  the last dot and the card, px. Falls back to 8 when they'd touch. */
  ropeInset: number;
  /** The rope's resting droop, px, once the card is up. */
  sagRest: number;
  /** Spring on the droop: stiffness and damping, per second. */
  sagStiffness: number;
  sagDamping: number;
  /** How far the pointer's height over the card pulls the droop, ±px. */
  sagNudge: number;
  /** ms the pointer must rest on a sign before its card shows. */
  showDelay: number;
  /** ms after leaving a sign (not toward its card) before hiding. */
  hideDelay: number;
  /** ms after leaving a sign toward the card before hiding — the grace
   *  for the pointer to reach it. */
  hideTowardCard: number;
  /** ms after leaving the card before hiding. */
  hideFromCard: number;
  /** ms after leaving the whole stage before hiding. */
  hideFromStage: number;
  /** The card's CSS pop, s. */
  popDuration: number;
  /** The card's and rope's CSS fade, s. */
  fadeDuration: number;
  /**
   * Stop-motion beat for the rope's droop, cuts per second. 0 = the
   * smooth spring above. Above 0 the spring still runs, but the rope is
   * only redrawn on the beat, so it drops in a few held poses.
   */
  ropeFps: number;
  /**
   * Stop-motion beat for the card's pop, cuts per second. 0 = the site's
   * CSS overshoot curve. Above 0 the card stamps in through three hard
   * cuts (3 / cardFps seconds), and both card and rope snap rather than
   * fade.
   */
  cardFps: number;
};

// Hand-tuned by Julio on the bench (2026-09-05): a 1.2x pop against a
// deep 0.8x step back, walked in seven cuts on a 24fps beat; light squeeze
// both ways; the cold signs fan outward (top tilts left, bottom right)
// while each hot sign hangs at its own angle.
export const ROAD_SIGNS_DEFAULTS: Readonly<RoadSignsTuning> = Object.freeze({
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
  cardWide: 640,
  cardTall: 300,
  ropeInset: 24,
  sagRest: 44,
  sagStiffness: 118,
  sagDamping: 15.5,
  sagNudge: 8,
  showDelay: 50,
  hideDelay: 70,
  hideTowardCard: 240,
  hideFromCard: 140,
  hideFromStage: 100,
  popDuration: 0.58,
  fadeDuration: 0.18,
  ropeFps: 0,
  cardFps: 0,
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

// ------------------------------------------------------------ rope & card

type RopeDom = {
  svg: SVGSVGElement;
  path: SVGPathElement;
  start: SVGCircleElement;
  end: SVGCircleElement;
  /** The safe wedge's own svg (under the signs) and its polygon. */
  bridgeSvg: SVGSVGElement;
  bridge: SVGPolygonElement;
};

/**
 * The rope and card machine — the site's script, transplanted. Cards are
 * shown and hidden by toggling a class the injected stylesheet
 * transitions; the rope is redrawn every frame its sag spring is moving
 * (and every frame the hot sign walks, see tick), from live rects like
 * the original.
 */
type RopeState = {
  dom: Partial<RopeDom>;
  /** One card per project, keyed by slug. */
  cards: Map<string, HTMLAnchorElement>;
  stage: HTMLDivElement | null;
  /** Where the stack sits in the stage, so sign edges can be placed. */
  stackAt: { x: number; y: number };
  /** Project whose card is up (or on its way out while closing). */
  active: string | null;
  closing: boolean;
  /** The droop's spring: current, velocity, target (px). */
  sag: number;
  sagVelocity: number;
  sagTarget: number;
  /** The droop the rope is drawn with. Tracks `sag` every frame when
   *  ropeFps is 0; otherwise samples it on the beat (see animateRope). */
  sagShown: number;
  /** Seconds banked toward the next rope cut. */
  beatAcc: number;
  raf: number | null;
  last: number;
  hideTimer: number | null;
  showTimer: number | null;
  /** Tells React which card is up, so its sign stays lifted. */
  onActive: (slug: string | null) => void;
};

function createRope(): RopeState {
  return {
    dom: {},
    cards: new Map(),
    stage: null,
    stackAt: { x: 0, y: 0 },
    active: null,
    closing: false,
    sag: 0,
    sagVelocity: 0,
    sagTarget: 0,
    sagShown: 0,
    beatAcc: 0,
    raf: null,
    last: 0,
    hideTimer: null,
    showTimer: null,
    onActive: () => {},
  };
}

/** Where a sign's right edge currently is, in stage space: its layout box
 *  plus the walk's transform. The rope starts just off it. */
function signEdge(e: Engine, slug: string): { x: number; y: number } | null {
  const g = signGeom(e, slug);
  if (!g) return null;
  const rad = (g.tilt * Math.PI) / 180;
  return {
    x: g.cx + g.halfW * Math.cos(rad),
    y: g.cy + g.halfW * Math.sin(rad),
  };
}

/** A sign's current centre and half extents in stage space: its layout
 *  box plus the walk's transform (scale, squeeze, nudge, re-tuck). */
function signGeom(
  e: Engine,
  slug: string,
): { cx: number; cy: number; halfW: number; halfH: number; tilt: number } | null {
  const i = SIGNS.findIndex((s) => s.slug === slug);
  const sign = SIGNS[i];
  if (!sign) return null;
  const t = e.tuning;
  const H = t.height;
  const padX = H * 0.6;
  const padY = H * 0.2;
  const bw = H * sign.aspect;
  const w = e.walks.get(slug);
  const pose = w?.cur ?? REST;
  const q = 1 + (w?.squash ?? 0);
  return {
    cx: e.rope.stackAt.x + padX + bw / 2 + pose.x,
    cy: e.rope.stackAt.y + padY + i * (H + t.gap) + H / 2 + (w?.y ?? 0),
    halfW: (bw / 2) * pose.scale * q,
    halfH: (H / 2) * (pose.scale / q),
    tilt: pose.tilt,
  };
}

function cancelHide(e: Engine) {
  if (e.rope.hideTimer !== null) window.clearTimeout(e.rope.hideTimer);
  e.rope.hideTimer = null;
}

function cancelShow(e: Engine) {
  if (e.rope.showTimer !== null) window.clearTimeout(e.rope.showTimer);
  e.rope.showTimer = null;
}

/** The rope's ends: just off the sign's edge, and just short of the
 *  card's left edge at its vertical middle. Measured live, since the card
 *  is mid-transition while it pops. */
function ropePoints(e: Engine) {
  const r = e.rope;
  const t = e.tuning;
  if (!r.active || !r.stage) return null;
  const card = r.cards.get(r.active);
  const edge = signEdge(e, r.active);
  if (!card || !edge) return null;
  const sr = r.stage.getBoundingClientRect();
  const cr = card.getBoundingClientRect();
  let sx = edge.x + t.ropeInset;
  let ex = cr.left - sr.left - t.ropeInset;
  if (ex < sx + 30) {
    sx = edge.x + 8;
    ex = cr.left - sr.left - 8;
  }
  return { sx, sy: edge.y, ex, ey: cr.top - sr.top + cr.height * 0.5 };
}

/** Writes the rope: a cubic with handles at 34% and 69% of the way
 *  across, both dropped by the sag, and a dot on each end. */
function drawRope(e: Engine) {
  const { path, start, end } = e.rope.dom;
  if (!path || !start || !end) return;
  const p = ropePoints(e);
  if (!p) return;
  const sag = e.rope.sagShown;
  const dx = p.ex - p.sx;
  const c1x = p.sx + dx * 0.34;
  const c2x = p.sx + dx * 0.69;
  path.setAttribute(
    "d",
    `M ${p.sx.toFixed(2)} ${p.sy.toFixed(2)} C ${c1x.toFixed(2)} ${(p.sy + sag).toFixed(2)}, ${c2x.toFixed(2)} ${(p.ey + sag).toFixed(2)}, ${p.ex.toFixed(2)} ${p.ey.toFixed(2)}`,
  );
  start.setAttribute("cx", p.sx.toFixed(2));
  start.setAttribute("cy", p.sy.toFixed(2));
  end.setAttribute("cx", p.ex.toFixed(2));
  end.setAttribute("cy", p.ey.toFixed(2));
  drawBridge(e);
}

/**
 * Writes the safe wedge: a quad from the hot sign's vertical midline
 * (its full height plus a little slack, so a tilted sign's corners are
 * inside it) to the card's left edge, top to bottom, overlapping the card
 * by a few px so there is no seam. Anything inside it counts as "still on
 * the way to the card". It is drawn under the signs and the card, so
 * wherever they overlap it, they win the hover.
 */
function drawBridge(e: Engine) {
  const r = e.rope;
  const { bridge } = r.dom;
  if (!bridge || !r.active || !r.stage) return;
  const card = r.cards.get(r.active);
  const g = signGeom(e, r.active);
  if (!card || !g) return;
  const sr = r.stage.getBoundingClientRect();
  const cr = card.getBoundingClientRect();
  const slack = g.halfH * 0.35;
  const sx = g.cx;
  const top = g.cy - g.halfH - slack;
  const bottom = g.cy + g.halfH + slack;
  const ex = cr.left - sr.left + 8;
  const ct = cr.top - sr.top;
  const cb = cr.bottom - sr.top;
  bridge.setAttribute(
    "points",
    `${sx.toFixed(1)},${top.toFixed(1)} ${sx.toFixed(1)},${bottom.toFixed(1)} ${ex.toFixed(1)},${cb.toFixed(1)} ${ex.toFixed(1)},${ct.toFixed(1)}`,
  );
}

/** One frame of the sag spring. Runs until it settles; a settle while
 *  closing is what finally clears the active project. */
function animateRope(e: Engine, now: number) {
  const r = e.rope;
  const t = e.tuning;
  r.raf = null;
  const dt = Math.min(0.032, Math.max(0.001, (now - r.last) / 1000));
  r.last = now;
  if (e.reduced) {
    r.sag = r.closing ? 0 : r.sagTarget;
    r.sagVelocity = 0;
  } else {
    const acceleration =
      (r.sagTarget - r.sag) * t.sagStiffness - r.sagVelocity * t.sagDamping;
    r.sagVelocity += acceleration * dt;
    r.sag += r.sagVelocity * dt;
  }
  const settled =
    Math.abs(r.sagTarget - r.sag) < 0.08 && Math.abs(r.sagVelocity) < 0.08;
  // Stop-motion rope: the spring keeps integrating every frame, but the
  // drawn droop only catches up on the beat, so it drops in held poses.
  // The settle always lands the true value, so nothing hangs mid-cut.
  if (t.ropeFps <= 0 || e.reduced || settled) {
    r.sagShown = r.sag;
    r.beatAcc = 0;
  } else {
    r.beatAcc += dt;
    const hold = 1 / t.ropeFps;
    if (r.beatAcc >= hold) {
      r.beatAcc %= hold;
      r.sagShown = r.sag;
    }
  }
  drawRope(e);
  if (!settled) {
    r.raf = window.requestAnimationFrame((n) => animateRope(e, n));
  } else if (r.closing) {
    r.active = null;
    r.closing = false;
  }
}

function ensureRope(e: Engine) {
  if (e.rope.raf === null) {
    e.rope.last = performance.now();
    e.rope.raf = window.requestAnimationFrame((n) => animateRope(e, n));
  }
}

function showProject(e: Engine, slug: string) {
  const r = e.rope;
  cancelHide(e);
  const card = r.cards.get(slug);
  if (!card) return;
  const firstReveal = r.active === null || r.closing;
  if (r.active !== null && r.active !== slug) {
    const old = r.cards.get(r.active);
    old?.classList.remove("is-active");
    old?.setAttribute("aria-hidden", "true");
    if (old) old.tabIndex = -1;
    old?.querySelector("video")?.pause();
  }
  const changed = r.active !== slug;
  r.active = slug;
  card.classList.add("is-active");
  card.setAttribute("aria-hidden", "false");
  card.tabIndex = 0;
  // The clip runs only while its card is up (autoplay would also let the
  // browser pause it as "offscreen" while the card is hidden).
  card
    .querySelector("video")
    ?.play()
    .catch(() => {});
  r.closing = false;
  r.sagTarget = e.tuning.sagRest;
  if (changed && firstReveal) {
    r.sag = 0;
    r.sagVelocity = 0;
    r.sagShown = 0;
    r.beatAcc = 0;
  }
  r.dom.svg?.classList.add("is-visible");
  r.dom.bridgeSvg?.classList.add("is-live");
  drawRope(e);
  ensureRope(e);
  r.onActive(slug);
}

function hideProject(e: Engine) {
  const r = e.rope;
  cancelHide(e);
  if (r.active === null) return;
  const card = r.cards.get(r.active);
  card?.classList.remove("is-active");
  card?.setAttribute("aria-hidden", "true");
  if (card) card.tabIndex = -1;
  card?.querySelector("video")?.pause();
  r.dom.svg?.classList.remove("is-visible");
  r.dom.bridgeSvg?.classList.remove("is-live");
  r.sagTarget = 0;
  r.closing = true;
  ensureRope(e);
  r.onActive(null);
}

function scheduleHide(e: Engine, ms: number) {
  cancelHide(e);
  e.rope.hideTimer = window.setTimeout(() => {
    e.rope.hideTimer = null;
    hideProject(e);
  }, ms);
}

/** Shows after a grace, and only if the pointer is still on the sign. */
function scheduleShow(e: Engine, slug: string, ms: number) {
  cancelShow(e);
  cancelHide(e);
  e.rope.showTimer = window.setTimeout(() => {
    e.rope.showTimer = null;
    const el = e.walks.get(slug)?.el;
    if (el?.matches(":hover")) showProject(e, slug);
  }, ms);
}

/** The pointer's height over the card tugs the rope's droop a little. */
function nudgeSag(e: Engine, card: HTMLElement, clientY: number) {
  const t = e.tuning;
  const rect = card.getBoundingClientRect();
  const pull = (clientY - (rect.top + rect.height / 2)) * 0.06;
  e.rope.sagTarget =
    t.sagRest + Math.max(-t.sagNudge, Math.min(t.sagNudge, pull));
  ensureRope(e);
}

function ropeCleanup(e: Engine) {
  cancelHide(e);
  cancelShow(e);
  if (e.rope.raf !== null) window.cancelAnimationFrame(e.rope.raf);
  e.rope.raf = null;
}

/**
 * Stage geometry from the tuning: the stack's box at the stage's left,
 * the card region to its right (cards pin to the stage's right edge), and
 * a stage tall enough for the stack and the tallest card. Pure, so the
 * component and the engine agree.
 */
function geometry(t: RoadSignsTuning) {
  const H = t.height;
  const padX = H * 0.6;
  const padY = H * 0.2;
  const maxSignW = Math.max(...SIGNS.map((s) => H * s.aspect));
  const stackW = maxSignW + 2 * padX;
  const stackH = SIGNS.length * H + (SIGNS.length - 1) * t.gap + 2 * padY;
  // A tall card is media plus the same width of copy beside it.
  const cardW = Math.max(t.cardWide, t.cardTall * 2 + 26);
  // Wide: the media plus the copy row. Tall: the media. Each clip's own
  // shape sets the height, so take the tallest.
  const cardH = Math.max(
    ...SIGNS.map((s) =>
      s.card.media === "wide"
        ? t.cardWide / s.card.aspect + 100
        : t.cardTall / s.card.aspect,
    ),
  );
  const room = 48;
  const stageW = Math.max(stackW + t.cardSpan, stackW + cardW + room);
  const ay = stackH / 2 + t.cardY;
  const minY = Math.min(0, ay - cardH / 2 - room);
  const maxY = Math.max(stackH, ay + cardH / 2 + room);
  return {
    stage: { w: stageW, h: maxY - minY },
    stackAt: { x: 0, y: -minY },
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
  rope: RopeState;
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
    rope: createRope(),
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
 *  as its own fps allows — a 16fps walk cuts every fourth frame, a 60fps
 *  poke every frame. Returns true when the loop was started fresh. */
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
  // The rope starts at the hot sign's edge, so it is redrawn while the
  // sign walks.
  if (e.rope.active !== null) drawRope(e);

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

  if (!walking) {
    // A nudge that was due while the stack was still moving plays now.
    if (g.pending) {
      g.pending = false;
      startNudge(e);
      return e.frame !== null || walking;
    }
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
    // of the settled stack (and the card, if it is up).
    relayout(e.walks, e.tuning);
    drawRope(e);
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
  entrance = true,
}: {
  controls?: boolean;
  /**
   * Play the mount entrance: the signs drop in one after another in hard
   * cuts — the site's shared `sm-drop` keyframes (packages/lab/src/motion),
   * staggered by the motion tuning's lead and stagger, so /lab/motion
   * tunes this too. The walk engine keeps writing its transforms
   * underneath; the animation wins while it runs and releases on its last
   * cut (fill backwards), so a hover mid-entrance takes over the moment
   * it ends.
   */
  entrance?: boolean;
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
  // Bench-only: pin a sign hovered so its hot pose holds while the pointer
  // is over the sliders. null = the real pointer decides.
  const [pinned, setPinned] = useState<string | null>(null);
  // The project whose card is up. Its sign stays lifted while the pointer
  // is over the card, the way the site keeps the title highlighted.
  const [cardActive, setCardActive] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const active = pinned ?? hovered ?? cardActive;

  // The engine is state so it's created exactly once per instance; it is
  // mutated in place and never set again.
  const [engine] = useState(() => createEngine(tuning));

  useEffect(() => {
    engine.rope.onActive = setCardActive;
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
      ropeCleanup(engine);
    };
  }, [engine]);

  // Feed React's view of the world to the engine and re-aim. A hover (or
  // pin) takes over from any nudge; releasing it re-arms the nudge timer a
  // full interval out, as does any slider change while idle.
  useEffect(() => {
    engine.tuning = tuning;
    engine.active = active;
    engine.rope.stackAt = geometry(tuning).stackAt;
    if (active !== null) cancelNudge(engine);
    retarget(engine);
    if (active === null && engine.nudge.phase === null) scheduleNudge(engine);
  }, [engine, active, tuning]);

  // Bench pin: holds the card up too, no hover needed.
  useEffect(() => {
    if (pinned !== null) showProject(engine, pinned);
    else if (engine.rope.active !== null) hideProject(engine);
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

  function registerRope<K extends keyof RopeDom>(
    key: K,
    el: RopeDom[K] | null,
  ) {
    if (el) engine.rope.dom[key] = el;
  }

  function registerCard(slug: string, el: HTMLAnchorElement | null) {
    if (el) engine.rope.cards.set(slug, el);
  }

  // The site's title handlers, on the signs. The sign's own lift is still
  // React's `hovered`; these drive the card and rope.
  function onSignEnter(slug: string) {
    setHovered(slug);
    const r = engine.rope;
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
    // card, whatever the angle: the tilted photo's real edge sits inside
    // its bounding box, so an exact right-edge test rarely fired. The
    // wedge (drawBridge) catches the pointer from here on.
    const rect = ev.currentTarget.getBoundingClientRect();
    const towardCard = ev.clientX >= rect.left + rect.width / 2;
    scheduleHide(engine, towardCard ? t.hideTowardCard : t.hideDelay);
  }

  function set(key: NumericKey, value: number) {
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

  // The site's card widths and durations, fed to the stylesheet.
  const stageVars = {
    "--rs-wide": `${tuning.cardWide}px`,
    "--rs-tall": `${tuning.cardTall}px`,
    // In stop-motion the pop is three held poses on the beat and nothing
    // fades — the card and rope are there or not.
    "--rs-pop": `${tuning.cardFps > 0 ? 3 / tuning.cardFps : tuning.popDuration}s`,
    "--rs-fade": `${tuning.cardFps > 0 ? 0 : tuning.fadeDuration}s`,
  } as CSSProperties;

  return (
    <>
      <style>{CARD_CSS}</style>
      <div
        ref={(el) => {
          engine.rope.stage = el;
        }}
        className={tuning.cardFps > 0 ? "is-cut" : undefined}
        onPointerLeave={() => scheduleHide(engine, tuning.hideFromStage)}
        style={{
          position: "relative",
          width: geo.stage.w,
          height: geo.stage.h,
          ...stageVars,
        }}
      >
        {/* The safe wedge between the hot sign and its card. First in the
            stage so it paints — and hit-tests — under the signs and the
            card; only the polygon takes the pointer, and only while a
            card is up (is-live). Geometry is written by drawBridge. */}
        <svg
          ref={(el) => registerRope("bridgeSvg", el)}
          className="rs-bridge"
          aria-hidden
        >
          <polygon
            ref={(el) => registerRope("bridge", el)}
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
              className={entrance ? "rs-sign-enter" : undefined}
              onPointerEnter={() => onSignEnter(sign.slug)}
              onPointerLeave={onSignLeave}
              onFocus={() => {
                setHovered(sign.slug);
                showProject(engine, sign.slug);
              }}
              onBlur={() => {
                setHovered((h) => (h === sign.slug ? null : h));
                scheduleHide(engine, 120);
              }}
              style={{
                display: "block",
                position: "relative",
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

        {/* The rope. Geometry is written by drawRope; the fade is CSS. */}
        <svg
          ref={(el) => registerRope("svg", el)}
          className="rs-rope"
          aria-hidden
        >
          <path ref={(el) => registerRope("path", el)} />
          <circle ref={(el) => registerRope("start", el)} r={4} />
          <circle ref={(el) => registerRope("end", el)} r={4} />
        </svg>

        {/* One card per project, all mounted; showProject toggles
            is-active and the stylesheet does the pop. */}
        {SIGNS.map((sign) => (
          <a
            key={sign.slug}
            ref={(el) => registerCard(sign.slug, el)}
            className={`rs-card is-${sign.card.media}`}
            href={sign.href}
            aria-label={`Open ${sign.title}`}
            aria-hidden="true"
            tabIndex={-1}
            style={{ top: geo.cardTop }}
            onPointerEnter={() => cancelHide(engine)}
            onPointerLeave={() => scheduleHide(engine, tuning.hideFromCard)}
            onPointerMove={(ev) =>
              nudgeSag(engine, ev.currentTarget, ev.clientY)
            }
          >
            <CardPanel sign={sign} />
          </a>
        ))}
      </div>

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

          <Section title="Card" summary="where it sits and how big">
            {CARD_FIELDS.map(slider)}
          </Section>

          <Section
            title="Rope & timing"
            summary="the sag spring and the delays"
          >
            {ROPE_FIELDS.map(slider)}
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

/** Tuning keys the generic slider rows can drive (everything but the
 *  per-sign tilt maps). */
type NumericKey = {
  [K in keyof RoadSignsTuning]: RoadSignsTuning[K] extends number ? K : never;
}[keyof RoadSignsTuning];

type Field = {
  key: NumericKey;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  unit: string;
};

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

const CARD_FIELDS: Field[] = [
  {
    key: "cardSpan",
    label: "Reach",
    hint: "Width of the card region right of the stack. The card pins to its far edge, so this is how far the rope travels.",
    min: 400,
    max: 1200,
    step: 10,
    unit: "px",
  },
  {
    key: "cardY",
    label: "Up / down",
    hint: "The card's centre relative to the stack's middle. Left of 0 raises it. The site centres it.",
    min: -320,
    max: 320,
    step: 2,
    unit: "px",
  },
  {
    key: "cardWide",
    label: "Wide card",
    hint: "Width of a wide card: the media with the blurb and pills in a row underneath.",
    min: 480,
    max: 800,
    step: 5,
    unit: "px",
  },
  {
    key: "cardTall",
    label: "Tall media",
    hint: "Width of a tall card's media. The copy beside it gets the same width.",
    min: 200,
    max: 400,
    step: 5,
    unit: "px",
  },
  {
    key: "ropeInset",
    label: "Rope air",
    hint: "Space between the sign and the first dot, and between the last dot and the card. The site uses 24.",
    min: 0,
    max: 40,
    step: 1,
    unit: "px",
  },
];

const ROPE_FIELDS: Field[] = [
  {
    key: "sagRest",
    label: "Sag",
    hint: "How far the rope droops once the card is up. The site uses 44.",
    min: 0,
    max: 120,
    step: 1,
    unit: "px",
  },
  {
    key: "sagStiffness",
    label: "Spring",
    hint: "Stiffness of the droop's spring. The site uses 118.",
    min: 20,
    max: 300,
    step: 1,
    unit: "",
  },
  {
    key: "sagDamping",
    label: "Damping",
    hint: "Damping of the droop's spring. Lower bounces more. The site uses 15.5.",
    min: 2,
    max: 40,
    step: 0.5,
    unit: "",
  },
  {
    key: "sagNudge",
    label: "Pointer pull",
    hint: "How far the pointer's height over the card tugs the droop, either way. The site uses 8.",
    min: 0,
    max: 24,
    step: 1,
    unit: "px",
  },
  {
    key: "showDelay",
    label: "Show after",
    hint: "How long the pointer must rest on a sign before its card shows. The site uses 50.",
    min: 0,
    max: 300,
    step: 10,
    unit: "ms",
  },
  {
    key: "hideDelay",
    label: "Hide after",
    hint: "Delay after leaving a sign, not toward its card. The site uses 70.",
    min: 0,
    max: 500,
    step: 10,
    unit: "ms",
  },
  {
    key: "hideTowardCard",
    label: "Hide · toward card",
    hint: "Delay after leaving a sign to the right, toward the card. The site uses 240.",
    min: 0,
    max: 600,
    step: 10,
    unit: "ms",
  },
  {
    key: "hideFromCard",
    label: "Hide · off card",
    hint: "Delay after leaving the card. The site uses 140.",
    min: 0,
    max: 600,
    step: 10,
    unit: "ms",
  },
  {
    key: "hideFromStage",
    label: "Hide · off stage",
    hint: "Delay after leaving the whole stage. The site uses 100.",
    min: 0,
    max: 600,
    step: 10,
    unit: "ms",
  },
  {
    key: "popDuration",
    label: "Pop",
    hint: "The card's CSS pop, on the site's overshooting curve. The site uses 0.58.",
    min: 0.1,
    max: 1.5,
    step: 0.02,
    unit: "s",
  },
  {
    key: "fadeDuration",
    label: "Fade",
    hint: "The card's and rope's fade. The site uses 0.18.",
    min: 0.05,
    max: 0.6,
    step: 0.01,
    unit: "s",
  },
  {
    key: "ropeFps",
    label: "Rope beat",
    hint: "Cuts per second the rope's droop is drawn at. 0 = the smooth spring; ~10 = it drops in a few held poses.",
    min: 0,
    max: 30,
    step: 1,
    unit: "fps",
  },
  {
    key: "cardFps",
    label: "Card beat",
    hint: "Cuts per second for the card's pop. 0 = the site's overshoot curve; ~10 = a three-cut stamp, and nothing fades.",
    min: 0,
    max: 30,
    step: 1,
    unit: "fps",
  },
];

/**
 * The rope (the site's, verbatim) and the card: media plus copy on the
 * bare wall. Widths and durations come from the tuning via custom
 * properties. Ink #2b2722, body #57514a; the pills are the site's.
 */
const CARD_CSS = `
.rs-rope { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; color: ${ROPE}; opacity: 0; transition: opacity var(--rs-fade, .18s); pointer-events: none; z-index: 2; }
.rs-rope.is-visible { opacity: 1; }
.rs-rope path { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.rs-rope circle { fill: currentColor; }
/* The safe wedge: invisible, and only a pointer target while a card is
   up. No z-index — it paints in DOM order, under the signs. */
.rs-bridge { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.rs-bridge polygon { fill: transparent; pointer-events: none; }
.rs-bridge.is-live polygon { pointer-events: fill; }
.rs-card { position: absolute; right: 0; z-index: 3; display: flex; opacity: 0; visibility: hidden; pointer-events: none; transform: translateY(-46%) scale(.965) rotate(.35deg); transform-origin: 8% 50%; transition: opacity var(--rs-fade, .18s), visibility linear calc(var(--rs-fade, .18s) + .06s), transform var(--rs-pop, .58s) cubic-bezier(.16, 1.08, .28, 1); will-change: transform, opacity; color: ${INK}; text-decoration: none; font-family: inherit; }
.rs-card.is-active { opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(-50%) scale(1) rotate(0deg); transition-delay: 0s; }
.rs-card.is-wide { width: var(--rs-wide, 640px); flex-direction: column; gap: 26px; }
.rs-card.is-tall { flex-direction: row; align-items: flex-end; gap: 26px; }
/* The media: the clip edge to edge in the clip's own shape (aspect-ratio
   set inline per card). A hairline in the rope's blue keeps a white clip
   from reading as floating on the wall; light grey while it loads. No
   shadow. While the
   pointer is on the card it lifts 3% in two hard cuts from its left
   edge — the rope's end. */
.rs-media { position: relative; flex: 0 0 auto; overflow: hidden; background: #ecebe8; outline: 1px solid ${ROPE}; outline-offset: -1px; transform-origin: 0 50%; transition: transform .17s steps(2); }
.rs-card:hover .rs-media { transform: scale(1.03); }
.rs-media video { display: block; width: 100%; height: 100%; object-fit: cover; }
@media (prefers-reduced-motion: reduce) { .rs-media { transition: none; } }
.is-wide .rs-media { width: 100%; }
.is-tall .rs-media { width: var(--rs-tall, 300px); }
.rs-copy { min-width: 0; display: flex; }
.is-wide .rs-copy { flex-direction: row; justify-content: space-between; align-items: flex-start; gap: 24px; }
.is-tall .rs-copy { flex-direction: column; gap: 22px; width: var(--rs-tall, 300px); padding-bottom: 2px; }
.rs-desc { margin: 0; max-width: 340px; color: #57514a; font-weight: 400; font-size: 17px; line-height: 1.38; letter-spacing: -.012em; }
.rs-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.is-wide .rs-tags { flex: 0 0 auto; flex-wrap: nowrap; padding-top: 3px; }
.rs-tag { display: inline-flex; align-items: center; justify-content: center; min-height: 24px; padding: 4px 9px; border: 1px solid color-mix(in srgb, ${INK} 52%, transparent); border-radius: 999px; background: transparent; color: ${INK}; font-weight: 400; font-size: 11.5px; line-height: 1; letter-spacing: .01em; white-space: nowrap; }
/* The mount entrance, one sign after another (the delay is inline, per
   sign): the site's sm-drop keyframes and --sm-duration, generated from
   the motion tuning by <MotionStyles> in the root layout. Fill backwards,
   not both — once it ends the walk engine's inline transform must be what
   shows. */
.rs-sign-enter { animation: sm-drop var(--sm-duration, .38s) steps(1, end) backwards; }
@media (prefers-reduced-motion: reduce) { .rs-sign-enter { animation-duration: .01ms; animation-delay: 0ms !important; } }
/* Stop-motion (cardFps > 0): no transitions at all — the card and rope
   snap on and off — and the pop is a stamp in three hard cuts: arrives
   small and low, lands past its mark wide and short, settles a hair
   narrow, rests. */
.is-cut .rs-rope, .is-cut .rs-card { transition: none; }
.is-cut .rs-card.is-active { animation: rs-card-stamp var(--rs-pop, .3s) steps(1, end) both; }
@keyframes rs-card-stamp {
  0% { transform: translate(-14px, -44%) scale(.88) rotate(1.2deg); }
  34% { transform: translate(4px, -51%) scale(1.04, .97) rotate(-.5deg); }
  68% { transform: translate(-1px, -50%) scale(.985, 1.01) rotate(.2deg); }
  100% { transform: translate(0, -50%) scale(1) rotate(0deg); }
}
@media (prefers-reduced-motion: reduce) { .rs-card { transition-duration: .01ms; animation-duration: .01ms; } }
`;

/**
 * One project's card: the media block (a muted looping clip, sized to its
 * own aspect), then the copy — the blurb and the tag pills. The
 * stylesheet decides whether the copy sits under or beside the media.
 */
function CardPanel({ sign }: { sign: Sign }) {
  const c = sign.card;
  return (
    <>
      <div className="rs-media" style={{ aspectRatio: c.aspect }}>
        <video
          src={c.src}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
      </div>
      <div className="rs-copy">
        <p className="rs-desc">{c.blurb}</p>
        <div className="rs-tags">
          {c.tags.map((tag) => (
            <span key={tag} className="rs-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

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
