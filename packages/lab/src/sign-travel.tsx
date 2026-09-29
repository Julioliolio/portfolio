"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type Ref,
} from "react";
import { asset } from "./asset";
import { BRAND_ASPECT, brandShadow, getBrandTuning } from "./brand";
import {
  GLOW_DEFAULTS,
  GLOW_MASK,
  cartelGlow,
  cartelShadow,
} from "./cartel-look";
import { SIGN_INSET, SIGN_SHARE, type Rect } from "./hello";
import { springEasing } from "./spring";
import { createTuningStore } from "./tuning-store";

/**
 * The sign's travel: the hello screen's tall lightbox leaving for the
 * upper-left corner, where it becomes the brand plate (pieces/brand-sign)
 * as the page scrolls down to the projects — and coming back the same
 * way, backwards, on the way up. Three ways (`mode`): held cuts,
 * smooth, or on the scroll — the site's. Held cuts, the first: the
 * site's stop motion, seven held poses, cut at the walker's twelve a second, nothing
 * eased. The sign is deformed by hand, frame by frame, after the
 * animator's rules — anticipation, squash and stretch, an arc, follow-
 * through — and the landing squash is the swap: its silhouette is
 * already the plate's, so the cut to the plate hides in it.
 *
 *   cut  frame    pose                                     box
 *   0    sink     anticipation: squashed, sunk, leaning    by the sign
 *                 away from the corner
 *   1    launch   stretched, leaning toward the corner,    by the sign
 *                 its foot dragging
 *   2    smear    the streak along the arc                 by the sign
 *   3    smear    shorter, nearer the corner               by the sign
 *   4    land     the wide squash at the corner, past the  by the plate
 *                 slot — the plate's own proportions
 *   5    plate    a hair narrow and tall: the settle       the plate's
 *   6    plate    rest — then it is the plate itself       the plate's
 *
 * The frames carry the deformation only (apps/web/public/sign-travel,
 * from scripts/prepare-sign-travel.mjs; each on its own canvas, since
 * the shapes have nothing in common). Where each cut is and how big are
 * the box's: its centre goes from the sign's to the plate's along a
 * path bowed upward (the arc), its height is a share of the sign's for
 * the tall poses and of the plate's for the wide ones, and its width
 * follows the frame's aspect — so the same frames serve any viewport.
 * The smear is drawn left-to-right and turned along the path. All of
 * it is WAAPI keyframes on a fixed layer, held with steps(1), the way
 * back the same keyframes reversed (the window's move does this). The
 * shares, the arc, the lean and the beat are the knobs; /lab/sign-travel
 * is the bench. Reduced motion, when played: no travel, the two just
 * swap.
 *
 * Or smooth (Julio, 2026-09-28: held cuts read as choppy with this few
 * frames): the box glides through the
 * same poses on the site's spring (spring.ts) — its place, size, lean
 * and shadow all interpolated, the spring's bounce carrying it past
 * the plate and back — while the frames still cut hard from pose to
 * pose, never fade: a cut is hidden inside a big movement, so the
 * poses are placed where the box is moving most. The path rises first
 * (`rise`: the share of the way spent going straight up, the way it
 * reads on a portrait screen, where the corner is almost straight up
 * from the sign) and then goes across, so the cut from the tall sign
 * to the wide one lands in the fast part of the way.
 *
 * Or on the scroll (`mode: "scroll"`, the site's since Julio's try of
 * 2026-09-28): the
 * sign rides with the page until its top meets the top of the screen,
 * then a pinned copy takes over — its top held there, its bottom
 * still going up with the page, so the page squashes it — until it is
 * the plate's height, then slides into the corner, the photo cutting
 * to the plate a share of the way into the slide (`swap`), inside the
 * movement. The way is measured in scroll: it starts as the sign's
 * top reaches the line it pins at (`pin`, vh down from the top) and
 * is done by `end` of the scroll left until the second screen has
 * landed (1: as it lands — the snap never leaves it half way), the
 * first `squash` of that spent squashing, the rest sliding; `lag` has
 * the layer trail the scroll, softened — and, trailing on the way
 * back, the layer rides down with the page once the scroll has passed
 * the pin line again, still un-squashing, so it hands back to the sign
 * where the sign is, not where it was pinned. All of it follows the scroll, both ways:
 * the same keyframes, scrubbed by the scroll position instead of
 * played. The layer drives itself from the two boxes the page gives it
 * (`from` in page coordinates, `to` on the screen) and tells the page
 * which phase it is in (`onPhase`): before, the sign is the page's;
 * during, the layer's; after, the plate's.
 */

type FrameKey = "sink" | "launch" | "smear" | "land" | "plate" | "front";

/** The frames and their aspects (w / h, printed by
 *  scripts/prepare-sign-travel.mjs). */
const FRAMES: Record<FrameKey, { src: string; aspect: number }> = {
  sink: { src: asset("/sign-travel/sink.webp"), aspect: 0.697 },
  launch: { src: asset("/sign-travel/launch.webp"), aspect: 0.466 },
  smear: { src: asset("/sign-travel/smear.webp"), aspect: 2.228 },
  land: { src: asset("/sign-travel/land.webp"), aspect: 2.399 },
  plate: { src: asset("/brand/front.webp"), aspect: BRAND_ASPECT },
  // The cartel's own front photo, for the squash on the scroll. Its
  // canvas keeps a margin round the sign (SIGN_INSET), taken back in
  // FRONT_FIT so the sign itself fills the box.
  front: { src: asset("/cartel/julio/front.webp"), aspect: 929 / 1600 },
};
const FRONT_FIT: CSSProperties = (() => {
  const { w, h } = SIGN_SHARE;
  return {
    width: `${(100 / w).toFixed(3)}%`,
    height: `${(100 / h).toFixed(3)}%`,
    left: `${(-100 * (SIGN_INSET.left / w)).toFixed(3)}%`,
    top: `${(-100 * (SIGN_INSET.top / h)).toFixed(3)}%`,
  };
})();
const FRAME_KEYS = Object.keys(FRAMES) as FrameKey[];

export type TravelTuning = {
  /** "cuts": held poses on the beat. "smooth": the box glides through
   *  the poses on the spring below. "scroll": the squash on the
   *  scroll, see above. */
  mode: "cuts" | "smooth" | "scroll";
  /** Scroll mode: the line the sign pins at, vh down from the top;
   *  the share of the scroll left (to the second screen landing) by
   *  which the way is done; the share of the way spent squashing, the
   *  rest sliding; how much of the way to the plate's width it widens
   *  as it squashes (0 keeps the sign's, 1 lands on the plate's);
   *  where in the slide the photo cuts to the plate, as a share of it;
   *  and how much the layer trails the scroll (0 locked to it). */
  pin: number;
  end: number;
  squash: number;
  widen: number;
  swap: number;
  lag: number;
  /** Cuts a second (cuts mode). */
  fps: number;
  /** Smooth mode: the spring's period, ms, and its bounce (0 none, 1
   *  wild). */
  period: number;
  bounce: number;
  /** The share of the way spent going straight up before going
   *  across (0: one straight line to the corner). */
  rise: number;
  /** How far the path bows upward at its middle, as a share of the
   *  distance. */
  arc: number;
  /** The lean at the launch, deg, toward the corner; the sink leans a
   *  third of it the other way. */
  lean: number;
  /** Each tall pose's height as a share of the sign's. */
  sink: number;
  launch: number;
  smear1: number;
  smear2: number;
  /** The landing's height as a share of the plate's — bigger: the
   *  overshoot is in the size, since past the slot is off the screen. */
  land: number;
  /** Where along the path each middle cut is, 0 the sign, 1 the
   *  plate; past 1 is past the slot. */
  at1: number;
  at2: number;
  at3: number;
  at4: number;
};

const TRAVEL_DEFAULTS: Readonly<TravelTuning> = Object.freeze({
  // Julio's slider values (2026-09-28): the squash on the scroll,
  // trailing it, done three quarters of the way to the second screen.
  mode: "scroll",
  pin: 0,
  end: 0.75,
  squash: 0.5,
  widen: 1,
  swap: 0.35,
  lag: 0.6,
  fps: 12, // the cartel's walker's beat
  period: 520,
  bounce: 0.2,
  rise: 0.5,
  arc: 0,
  lean: 12,
  sink: 0.88,
  launch: 1.3,
  smear1: 0.55,
  smear2: 0.32,
  land: 1.25,
  at1: 0.1,
  at2: 0.35,
  at3: 0.6,
  at4: 0.8,
});

const store = createTuningStore("sign-travel-tuning", TRAVEL_DEFAULTS);
export const setTravelTuning = store.set;
export const resetTravelTuning = store.reset;
const getTravelTuning = store.get;
export const useTravelTuning = store.useTuning;

/** One held pose: which frame, where the box is, and its transform. */
type Cut = { frame: FrameKey; rect: Rect; transform: string };

const n = (v: number) => Number(v.toFixed(2));

/**
 * The cuts of a travel from the sign's box to the plate's, for a
 * tuning. Pure, so the bench can draw them.
 */
function travelCuts(from: Rect, to: Rect, t: TravelTuning): Cut[] {
  const c0 = { x: from.x + from.w / 2, y: from.y + from.h / 2 };
  const c1 = { x: to.x + to.w / 2, y: to.y + to.h / 2 };
  const dx = c1.x - c0.x;
  const dy = c1.y - c0.y;
  const dist = Math.hypot(dx, dy);
  // Toward the corner: the way the path goes across.
  const across = dx < 0 ? -1 : 1;
  const rise = Math.min(0.95, Math.max(0, t.rise));
  // Up first for `rise` of the way, then across; bowed upward by the
  // arc, at its most in the middle.
  const at = (s: number) => {
    const up = rise > 0 ? Math.min(1, s / rise) : 1;
    const over = rise > 0 ? Math.max(0, (s - rise) / (1 - rise)) : s;
    return {
      x: c0.x + dx * over,
      y: c0.y + dy * up - t.arc * dist * Math.sin(Math.PI * Math.min(1, s)),
    };
  };
  // The way's angle at a point, folded into (-90, 90]: the smear lies
  // along the way without turning upside down.
  const angleAt = (s: number) => {
    const a = at(Math.max(0, s - 0.02));
    const b = at(s + 0.02);
    let angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    if (angle > 90) angle -= 180;
    if (angle <= -90) angle += 180;
    return angle;
  };
  const box = (
    frame: FrameKey,
    centre: { x: number; y: number },
    h: number,
  ): Rect => {
    const w = h * FRAMES[frame].aspect;
    return { x: n(centre.x - w / 2), y: n(centre.y - h / 2), w: n(w), h: n(h) };
  };
  return [
    {
      frame: "sink",
      rect: box("sink", at(0), from.h * t.sink),
      transform: `rotate(${n((-t.lean * across) / 3)}deg)`,
    },
    {
      frame: "launch",
      rect: box("launch", at(t.at1), from.h * t.launch),
      transform: `rotate(${n(t.lean * across)}deg)`,
    },
    {
      frame: "smear",
      rect: box("smear", at(t.at2), from.h * t.smear1),
      transform: `rotate(${n(angleAt(t.at2))}deg)`,
    },
    {
      frame: "smear",
      rect: box("smear", at(t.at3), from.h * t.smear2),
      transform: `rotate(${n(angleAt(t.at3))}deg)`,
    },
    {
      frame: "land",
      rect: box("land", at(t.at4), to.h * t.land),
      transform: "none",
    },
    {
      frame: "plate",
      rect: box("plate", at(1), to.h),
      transform: "scale(0.97, 1.03)",
    },
    { frame: "plate", rect: box("plate", at(1), to.h), transform: "none" },
  ];
}

/** Which of the three the sign is, on the scroll: the page's, the
 *  layer's, or the plate's. */
export type TravelPhase = "before" | "during" | "after";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * The way on the scroll, in scroll px: it starts as the sign's top
 * (`from`, page coordinates) reaches the pin line, and is `end` of
 * the scroll left from there to the second screen's landing (one
 * screen's height, the first screen being one screen tall).
 */
function scrollWay(from: Rect, t: TravelTuning) {
  const pin = (Math.max(0, t.pin) / 100) * window.innerHeight;
  const start = from.y - pin;
  const left = Math.max(1, window.innerHeight - start);
  const distance = Math.max(1, left * Math.min(1, Math.max(0.05, t.end)));
  return { pin, start, distance };
}

/**
 * The keyframes of the squash on the scroll, offsets by scroll
 * distance: `from` is the sign's box with its top on the page (page
 * coordinates), `to` the plate's on the screen. The first `squash` of
 * the way squashes the sign against the pin line, the rest slides it
 * to the corner.
 */
function scrollFrames(from: Rect, to: Rect, t: TravelTuning) {
  const { pin } = scrollWay(from, t);
  const s = Math.min(0.95, Math.max(0.05, t.squash));
  const brand = getBrandTuning();
  const w1 = from.w + (to.w - from.w) * clamp01(t.widen);
  const pose = (offset: number, r: Rect): Keyframe => ({
    offset,
    easing: "linear",
    left: `${n(r.x)}px`,
    top: `${n(r.y)}px`,
    width: `${n(r.w)}px`,
    height: `${n(r.h)}px`,
  });
  const box: Keyframe[] = [
    pose(0, { x: from.x, y: pin, w: from.w, h: from.h }),
    pose(s, { x: from.x + (from.w - w1) / 2, y: pin, w: w1, h: to.h }),
    pose(1, to),
  ];
  // The cut to the plate, a share of the way into the slide.
  const swapAt = s + (1 - s) * clamp01(t.swap);
  const opacity = (key: FrameKey): Keyframe[] => {
    const front = key === "front" ? 1 : 0;
    const plate = key === "plate" ? 1 : 0;
    return [
      { offset: 0, easing: "steps(1, end)", opacity: front },
      { offset: swapAt, easing: "steps(1, end)", opacity: plate },
      { offset: 1, easing: "steps(1, end)", opacity: plate },
    ];
  };
  // The shadows: the sign's own on its turn wrapper while the photo is
  // up (the cartel's, so the hand-off matches, scaled with the squash),
  // the plate's on the box from the cut.
  const plateShadow = brandShadow(`${n(to.h)}px`, brand);
  const boxShadow: Keyframe[] = [
    { offset: 0, easing: "steps(1, end)", filter: "none" },
    { offset: swapAt, easing: "steps(1, end)", filter: plateShadow },
    { offset: 1, easing: "steps(1, end)", filter: plateShadow },
  ];
  // The cartel measures its shadow off its canvas, which keeps a margin
  // round the sign: the same share, off the canvas the box stands for.
  const canvas = (h: number) => `${n(h / SIGN_SHARE.h)}px`;
  const signShadow: Keyframe[] = [
    { offset: 0, easing: "linear", filter: cartelShadow(canvas(from.h)) },
    { offset: s, easing: "linear", filter: cartelShadow(canvas(to.h)) },
    { offset: 1, easing: "linear", filter: cartelShadow(canvas(to.h)) },
  ];
  return { box, opacity, boxShadow, signShadow };
}

const reduced = () =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

const CSS = `
.sign-travel { position: fixed; left: 0; top: 0; z-index: 96; visibility: hidden; pointer-events: none; transform-origin: 50% 50%; will-change: transform; }
.sign-travel.is-on { visibility: visible; }
.sign-travel img { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; user-select: none; }
`;

/** What the landing (and the bench) drive the layer by. */
export type TravelHandle = {
  /** Play the travel: down, from the sign's box to the plate's; up,
   *  the same backwards. Resolves once the last cut has held (at once
   *  in reduced mode); a travel already playing is cancelled. */
  play: (from: Rect, to: Rect, dir: "down" | "up") => Promise<void>;
  /** Hold one cut, for the bench's scrub. */
  seek: (from: Rect, to: Rect, cut: number) => void;
  /** Stop and hide — two frames on, so what the page puts in the
   *  layer's place is painted first. A new play stops it at once. */
  cancel: () => void;
  /** Decode the frames ahead of the first travel. */
  warm: () => void;
  /** Scroll mode is on: the layer drives itself from the scroll, the
   *  page's own travels stand down. */
  scrolls: () => boolean;
};

/**
 * The layer the travel plays on: the frames stacked in one fixed box,
 * out of sight until a play. Mount it once, above everything; drive it
 * by the handle. The cuts are read from the tuning at each play, so a
 * bench change is in the next one.
 */
export function TravelLayer({
  ref,
  from,
  to,
  onPhase,
  sign,
}: {
  ref: Ref<TravelHandle>;
  /** Scroll mode: the sign's box in page coordinates (its viewport
   *  box plus the scroll), and the plate's on the screen — asked for
   *  again whenever the layer measures. */
  from?: () => Rect | null;
  to?: () => Rect | null;
  /** Scroll mode: which of the three the sign is now. */
  onPhase?: (phase: TravelPhase, was: TravelPhase | null) => void;
  /** Scroll mode: the sign as it is right now — the photo it shows and
   *  the turn it has (the cartel's data-cartel-src and
   *  data-cartel-transform) — so the layer squashes that photo, turned
   *  the same way, and the hand-off is seamless. Asked on every step. */
  sign?: () => { src: string; transform: string } | null | undefined;
}) {
  const layer = useRef<HTMLDivElement>(null);
  const imgs = useRef(new Map<FrameKey, HTMLImageElement>());
  const running = useRef<Animation[]>([]);
  const t = useTravelTuning();
  const scrolls = t.mode === "scroll";

  useEffect(() => {
    const list = running;
    return () => list.current.forEach((a) => a.cancel());
  }, []);

  // Scroll mode: the layer follows the scroll. The sign's box is
  // measured while it is still the page's, so the hand-off is exact,
  // and again on a resize.
  const fromRef = useRef(from);
  const toRef = useRef(to);
  const onPhaseRef = useRef(onPhase);
  const signRef = useRef(sign);
  fromRef.current = from;
  toRef.current = to;
  onPhaseRef.current = onPhase;
  signRef.current = sign;
  // The stand-in follows the sign: its photo (swapped only when it
  // changes; the cartel has the same file decoded, so it is at hand),
  // and its turn, written to the turn wrapper as the cartel writes its
  // own.
  const turn = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);
  const glowImg = useRef<HTMLImageElement>(null);
  const followPhoto = () => {
    const now = signRef.current?.();
    if (!now) return;
    const img = imgs.current.get("front");
    if (img && img.getAttribute("src") !== now.src) {
      img.setAttribute("src", now.src);
      glowImg.current?.setAttribute("src", now.src);
    }
    if (turn.current && turn.current.style.transform !== now.transform)
      turn.current.style.transform = now.transform;
  };
  useEffect(() => {
    const el = layer.current;
    if (!scrolls || !el) return;
    let rects: { from: Rect; to: Rect } | null = null;
    let built = false;
    let phase: TravelPhase | null = null;
    let raf: number | null = null;
    // The share of the way the layer shows, trailing the scroll's by
    // `lag` a frame at a time.
    let shown: number | null = null;
    const lag = Math.min(0.95, Math.max(0, t.lag));
    // The squash's own keyframes, for a pair of boxes; paused, scrubbed
    // by a share of the way.
    const hold = (f: Rect, g: Rect, share: number) => {
      const frames = scrollFrames(f, g, t);
      running.current.forEach((a) => a.cancel());
      const options: KeyframeAnimationOptions = {
        duration: 1000,
        easing: "linear",
        fill: "both",
      };
      const list = [
        el.animate(frames.box, options),
        el.animate(frames.boxShadow, options),
      ];
      if (turn.current)
        list.push(turn.current.animate(frames.signShadow, options));
      for (const key of FRAME_KEYS) {
        // The front is its stand-in wrapper (see the markup).
        const target = key === "front" ? front.current : imgs.current.get(key);
        if (target) list.push(target.animate(frames.opacity(key), options));
      }
      for (const a of list) {
        a.pause();
        a.currentTime = Math.min(1, Math.max(0, share)) * 1000;
      }
      running.current = list;
      el.classList.add("is-on");
    };
    const off = () => {
      clearHide();
      running.current.forEach((a) => a.cancel());
      running.current = [];
      el.classList.remove("is-on");
      el.style.transform = "";
      built = false;
    };
    // The hand-off: the page is told first and the layer goes two
    // frames later, holding its last pose, so the sign (or the plate)
    // under it is painted before it goes — hidden at once, there was
    // a frame with neither, a flash.
    let hideId: number | null = null;
    function clearHide() {
      if (hideId != null) cancelAnimationFrame(hideId);
      hideId = null;
    }
    const offSoon = () => {
      // Nothing to hand off while the layer is already out of sight.
      if (hideId != null || !el.classList.contains("is-on")) return;
      // Still the sign's photo while it holds: the sign may step.
      hideId = requestAnimationFrame(() => {
        followPhoto();
        hideId = requestAnimationFrame(() => {
          followPhoto();
          hideId = null;
          off();
        });
      });
    };
    const measure = () => {
      const f = fromRef.current?.();
      const g = toRef.current?.();
      rects = f && g ? { from: f, to: g } : null;
      // A hand-off still going keeps its pose until it is done.
      if (hideId == null) off();
    };
    const say = (p: TravelPhase) => {
      if (p === phase) return;
      const was = phase;
      phase = p;
      onPhaseRef.current?.(p, was);
    };
    const show = (share: number) => {
      if (!rects) return;
      if (share <= 0) {
        say("before");
        offSoon();
      } else if (share >= 1) {
        say("after");
        offSoon();
      } else {
        clearHide();
        followPhoto();
        if (!built) {
          hold(rects.from, rects.to, share);
          built = true;
        } else {
          const at = share * 1000;
          for (const a of running.current) a.currentTime = at;
        }
        say("during");
      }
    };
    const drive = () => {
      raf = null;
      // While the sign is the page's, keep the measure fresh.
      if (phase !== "during" && phase !== "after") measure();
      if (!rects) return;
      const way = scrollWay(rects.from, t);
      const raw = (window.scrollY - way.start) / way.distance;
      const target = Math.min(1.001, Math.max(-0.001, raw));
      // Past the pin line on the way back, the sign's spot is below it
      // by this much: a trailing layer goes there with the page.
      const slack = raw < 0 ? -raw * way.distance : 0;
      // Trailing: a share of the gap closed each frame, until it is
      // closed; locked to the scroll otherwise.
      if (lag > 0 && shown != null && Math.abs(target - shown) > 0.0005) {
        shown += (target - shown) * (1 - lag);
        if (Math.abs(target - shown) <= 0.0005) shown = target;
        else ask();
      } else {
        shown = target;
      }
      show(shown);
      el.style.transform = slack > 0 ? `translateY(${n(slack)}px)` : "";
    };
    const ask = () => {
      if (raf == null) raf = requestAnimationFrame(drive);
    };
    const onResize = () => {
      measure();
      ask();
    };
    drive();
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", ask);
      window.removeEventListener("resize", onResize);
      off();
    };
  }, [scrolls, t]);

  useImperativeHandle(ref, () => {
    let hideId: number | null = null;
    const stop = () => {
      if (hideId != null) cancelAnimationFrame(hideId);
      hideId = null;
      running.current.forEach((a) => a.cancel());
      running.current = [];
      layer.current?.classList.remove("is-on");
    };
    // The hand-off after a play: the page shows the plate (or the
    // sign) on its next commit, so the layer holds its last pose two
    // frames before going — hidden at once, a frame with neither.
    const stopSoon = () => {
      if (hideId != null) return;
      hideId = requestAnimationFrame(() => {
        hideId = requestAnimationFrame(() => {
          hideId = null;
          stop();
        });
      });
    };
    // The keyframes of a travel: the box's place, size, transform and
    // shadow per cut, and each frame's opacity per cut, all held with
    // steps(1). Started paused; the caller sets them going.
    const build = (from: Rect, to: Rect) => {
      const el = layer.current;
      if (!el) return null;
      stop();
      const t = getTravelTuning();
      const brand = getBrandTuning();
      const cuts = travelCuts(from, to, t);
      const last = cuts.length - 1;
      const smooth = t.mode === "smooth";
      const tick = 1000 / Math.max(1, t.fps);
      const offset = (i: number) => i / last;
      // Held: each pose until the next. Smooth: the box glides between
      // them, and the spring paces the whole way.
      const easing = smooth ? "linear" : "steps(1, end)";
      const curve = smooth ? springEasing(t.period, t.bounce) : null;
      const duration = curve ? curve.settle : last * tick;
      const boxFrames: Keyframe[] = cuts.map((c, i) => ({
        offset: offset(i),
        easing,
        left: `${c.rect.x}px`,
        top: `${c.rect.y}px`,
        width: `${c.rect.w}px`,
        height: `${c.rect.h}px`,
        transform: c.transform,
        filter: brandShadow(`${c.rect.h}px`, brand),
      }));
      // A frame's opacity over the way: 1 while its pose is up. Always a
      // hard cut from pose to pose, smooth or held: the cut is hidden
      // inside the movement.
      const opacityFrames = (key: FrameKey): Keyframe[] =>
        cuts.map((c, i) => ({
          offset: offset(i),
          easing: "steps(1, end)",
          opacity: c.frame === key ? 1 : 0,
        }));
      const options = (
        direction: PlaybackDirection,
      ): KeyframeAnimationOptions => ({
        duration,
        easing: curve ? curve.easing : "linear",
        fill: "both",
        direction,
      });
      const make = (direction: PlaybackDirection) => {
        const list = [el.animate(boxFrames, options(direction))];
        for (const key of FRAME_KEYS) {
          const img = imgs.current.get(key);
          if (!img) continue;
          list.push(img.animate(opacityFrames(key), options(direction)));
        }
        for (const a of list) a.pause();
        running.current = list;
        el.classList.add("is-on");
        return list;
      };
      return { make, tick, smooth, duration };
    };
    return {
      play(from, to, dir) {
        if (reduced()) {
          stop();
          return Promise.resolve();
        }
        const built = build(from, to);
        if (!built) return Promise.resolve();
        const list = built.make(dir === "down" ? "normal" : "reverse");
        for (const a of list) a.play();
        const first = list[0];
        if (!first) return Promise.resolve();
        return first.finished.then(
          () => undefined,
          // Cancelled by the next play: nothing to do.
          () => undefined,
        );
      },
      seek(from, to, cut) {
        const built = build(from, to);
        if (!built) return;
        const list = built.make("normal");
        // Just inside the cut, so its pose is the one held (smooth: the
        // same share of the way, on the curve's own clock).
        const at = built.smooth
          ? (Math.min(cut, 6) / 6) * built.duration
          : Math.min(cut, 6) * built.tick + 1;
        for (const a of list) a.currentTime = at;
      },
      cancel: stopSoon,
      warm() {
        for (const img of imgs.current.values())
          void img.decode().catch(() => {});
      },
      scrolls: () => getTravelTuning().mode === "scroll",
    };
  }, []);

  return (
    <div ref={layer} className="sign-travel" aria-hidden="true">
      <style>{CSS}</style>
      {/* eslint-disable @next/next/no-img-element -- stacked pre-sized WebP frames cut by opacity; the Next optimizer adds nothing and would break decode-ahead */}
      {/* The drawn frames only for the played modes: on the scroll the
          way is the sign's photo and the plate, and the rest would be
          fetched and decoded for nothing. */}
      {FRAME_KEYS.filter(
        (key) => key !== "front" && (key === "plate" || !scrolls),
      ).map((key) => (
        <img
          key={key}
          ref={(el) => {
            if (el) imgs.current.set(key, el);
            else imgs.current.delete(key);
          }}
          src={FRAMES[key].src}
          alt=""
          draggable={false}
          decoding="async"
          fetchPriority="low"
        />
      ))}
      {/* The stand-in for the sign itself (scroll mode): the sign's own
          photo on its canvas, turned as the sign is (the cartel's
          perspective and its stack's transform, followPhoto), under its
          shadow, with its glow — so up to the hand-off it is the sign. */}
      <div
        ref={front}
        style={{
          position: "absolute",
          inset: 0,
          perspective: 900,
          opacity: 0,
        }}
      >
        <div
          ref={turn}
          style={{
            position: "absolute",
            ...FRONT_FIT,
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          <img
            ref={(el) => {
              if (el) imgs.current.set("front", el);
              else imgs.current.delete("front");
            }}
            src={FRAMES.front.src}
            alt=""
            draggable={false}
            decoding="async"
            fetchPriority="low"
            style={{ opacity: 1 }}
          />
          {GLOW_DEFAULTS.strength > 0 && (
            <img
              ref={glowImg}
              src={FRAMES.front.src}
              alt=""
              aria-hidden
              draggable={false}
              decoding="async"
              fetchPriority="low"
              style={{
                opacity: GLOW_DEFAULTS.strength,
                filter: cartelGlow("100%"),
                mixBlendMode: "screen",
                maskImage: GLOW_MASK,
                maskComposite: "intersect",
                WebkitMaskComposite: "source-in",
                zIndex: 3,
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      </div>
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}
