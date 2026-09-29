"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { asset } from "./asset";
import { brandShadow, getBrandTuning } from "./brand";
import {
  GLOW_DEFAULTS,
  GLOW_MASK,
  cartelGlow,
  cartelShadow,
} from "./cartel-look";
import { SIGN_INSET, SIGN_SHARE, type Rect } from "./hello";
import { createTuningStore } from "./tuning-store";

/**
 * The sign's travel: the hello screen's tall lightbox leaving for the
 * upper-left corner, where it becomes the brand plate (pieces/brand-sign)
 * as the page scrolls down to the projects — and coming back the same
 * way on the way up. It follows the scroll (Julio's try of 2026-09-28,
 * kept over the held cuts and the smooth glide, which played it): the
 * sign rides with the page until its top meets the top of the screen,
 * then a pinned copy takes over — its top held there, its bottom still
 * going up with the page, so the page squashes it — until it is the
 * plate's height, then slides into the corner, the photo cutting to the
 * plate a share of the way into the slide (`swap`), inside the
 * movement.
 *
 * The way is measured in scroll: it starts as the sign's top reaches
 * the line it pins at (`pin`, vh down from the top) and is done by
 * `end` of the scroll left until the second screen has landed (1: as
 * it lands — the snap never leaves it half way), the first `squash` of
 * that spent squashing, the rest sliding; `lag` has the layer trail the
 * scroll, softened — and, trailing on the way back, the layer rides
 * down with the page once the scroll has passed the pin line again,
 * still un-squashing, so it hands back to the sign where the sign is,
 * not where it was pinned. All of it is WAAPI keyframes on a fixed
 * layer, scrubbed by the scroll position, both ways. The layer drives
 * itself from the two boxes the page gives it (`from` in page
 * coordinates, `to` on the screen) and tells the page which phase it is
 * in (`onPhase`): before, the sign is the page's; during, the layer's;
 * after, the plate's. /lab/sign-travel is the bench.
 *
 * Reduced motion: no layer — the sign scrolls away with the page and
 * the plate is simply there once the way is done.
 */

/** The two photos the layer shows: the plate, and the cartel's own
 *  front photo for the squash. The front's canvas keeps a margin round
 *  the sign (SIGN_INSET), taken back in FRONT_FIT so the sign itself
 *  fills the box. */
const PLATE_SRC = asset("/brand/front.webp");
const FRONT_SRC = asset("/cartel/julio/front.webp");
const FRONT_FIT: CSSProperties = (() => {
  const { w, h } = SIGN_SHARE;
  return {
    width: `${(100 / w).toFixed(3)}%`,
    height: `${(100 / h).toFixed(3)}%`,
    left: `${(-100 * (SIGN_INSET.left / w)).toFixed(3)}%`,
    top: `${(-100 * (SIGN_INSET.top / h)).toFixed(3)}%`,
  };
})();

export type TravelTuning = {
  /** The line the sign pins at, vh down from the top; the share of the
   *  scroll left (to the second screen landing) by which the way is
   *  done; the share of the way spent squashing, the rest sliding; how
   *  much of the way to the plate's width it widens as it squashes (0
   *  keeps the sign's, 1 lands on the plate's); where in the slide the
   *  photo cuts to the plate, as a share of it; and how much the layer
   *  trails the scroll (0 locked to it). */
  pin: number;
  end: number;
  squash: number;
  widen: number;
  swap: number;
  lag: number;
};

// Julio's slider values (2026-09-28): trailing the scroll, done three
// quarters of the way to the second screen.
const TRAVEL_DEFAULTS: Readonly<TravelTuning> = Object.freeze({
  pin: 0,
  end: 0.75,
  squash: 0.5,
  widen: 1,
  swap: 0.35,
  lag: 0.6,
});

const store = createTuningStore("sign-travel-tuning", TRAVEL_DEFAULTS);
export const setTravelTuning = store.set;
export const resetTravelTuning = store.reset;
export const useTravelTuning = store.useTuning;

const n = (v: number) => Number(v.toFixed(2));

/** Which of the three the sign is: the page's, the layer's, or the
 *  plate's. */
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
 * The keyframes of the squash, offsets by scroll distance: `from` is
 * the sign's box with its top on the page (page coordinates), `to` the
 * plate's on the screen. The first `squash` of the way squashes the
 * sign against the pin line, the rest slides it to the corner.
 */
function scrollFrames(from: Rect, to: Rect, pin: number, t: TravelTuning) {
  const s = Math.min(0.95, Math.max(0.05, t.squash));
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
  const cut = (before: number, after: number): Keyframe[] => [
    { offset: 0, easing: "steps(1, end)", opacity: before },
    { offset: swapAt, easing: "steps(1, end)", opacity: after },
    { offset: 1, easing: "steps(1, end)", opacity: after },
  ];
  // The shadows: the sign's own on its turn wrapper while the photo is
  // up (the cartel's, so the hand-off matches, scaled with the squash),
  // the plate's on the box from the cut.
  const plateShadow = brandShadow(`${n(to.h)}px`, getBrandTuning());
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
  return { box, front: cut(1, 0), plate: cut(0, 1), boxShadow, signShadow };
}

const reduced = () =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

const CSS = `
.sign-travel { position: fixed; left: 0; top: 0; z-index: 96; visibility: hidden; pointer-events: none; transform-origin: 50% 50%; will-change: transform; }
.sign-travel.is-on { visibility: visible; }
.sign-travel img { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; user-select: none; }
`;

/**
 * The layer the travel shows on: the plate and the sign's stand-in
 * stacked in one fixed box, out of sight until the scroll takes the
 * sign. Mount it once, above everything. It reads the tuning live, so
 * a bench change is in the next scroll.
 */
export function TravelLayer({
  from,
  to,
  onPhase,
  sign,
}: {
  /** The sign's box in page coordinates (its viewport box plus the
   *  scroll), and the plate's on the screen — asked for again whenever
   *  the layer measures. */
  from: () => Rect | null;
  to: () => Rect | null;
  /** Which of the three the sign is now. */
  onPhase: (phase: TravelPhase, was: TravelPhase | null) => void;
  /** The sign as it is right now — the photo it shows and the turn it
   *  has (the cartel's data-cartel-src, and the transform on its
   *  data-cartel-stack) — so the layer squashes that photo, turned the
   *  same way, and the hand-off is seamless. Asked on every step. */
  sign?: () => { src: string; transform: string } | null | undefined;
}) {
  const layer = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLImageElement>(null);
  const front = useRef<HTMLDivElement>(null);
  const turn = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const glow = useRef<HTMLImageElement>(null);
  const t = useTravelTuning();

  // The callers' latest, for the scroll's handlers.
  const fromRef = useRef(from);
  const toRef = useRef(to);
  const onPhaseRef = useRef(onPhase);
  const signRef = useRef(sign);
  useEffect(() => {
    fromRef.current = from;
    toRef.current = to;
    onPhaseRef.current = onPhase;
    signRef.current = sign;
  });

  // Decoded ahead, so the first scroll never waits on them.
  useEffect(() => {
    for (const img of [plate.current, photo.current])
      void img?.decode().catch(() => {});
  }, []);

  useEffect(() => {
    const el = layer.current;
    if (!el) return;
    // The stand-in follows the sign: its photo (swapped only when it
    // changes; the cartel has the same file decoded, so it is at hand),
    // and its turn, written to the turn wrapper as the cartel writes
    // its own.
    const followPhoto = () => {
      const now = signRef.current?.();
      if (!now) return;
      if (photo.current && photo.current.getAttribute("src") !== now.src) {
        photo.current.setAttribute("src", now.src);
        glow.current?.setAttribute("src", now.src);
      }
      if (turn.current && turn.current.style.transform !== now.transform)
        turn.current.style.transform = now.transform;
    };
    let rects: { from: Rect; to: Rect } | null = null;
    let running: Animation[] = [];
    let phase: TravelPhase | null = null;
    let raf: number | null = null;
    // The share of the way the layer shows, trailing the scroll's by
    // `lag` a frame at a time.
    let shown: number | null = null;
    const lag = Math.min(0.95, Math.max(0, t.lag));
    // The squash's keyframes for the boxes as measured, paused and
    // scrubbed by a share of the way.
    const hold = (share: number) => {
      if (!rects) return;
      const { pin } = scrollWay(rects.from, t);
      const frames = scrollFrames(rects.from, rects.to, pin, t);
      const options: KeyframeAnimationOptions = {
        duration: 1000,
        easing: "linear",
        fill: "both",
      };
      running = [
        el.animate(frames.box, options),
        el.animate(frames.boxShadow, options),
      ];
      if (turn.current)
        running.push(turn.current.animate(frames.signShadow, options));
      if (front.current)
        running.push(front.current.animate(frames.front, options));
      if (plate.current)
        running.push(plate.current.animate(frames.plate, options));
      for (const a of running) {
        a.pause();
        a.currentTime = share * 1000;
      }
      el.classList.add("is-on");
    };
    const off = () => {
      clearHide();
      running.forEach((a) => a.cancel());
      running = [];
      el.classList.remove("is-on");
      el.style.transform = "";
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
      const f = fromRef.current();
      const g = toRef.current();
      rects = f && g ? { from: f, to: g } : null;
      // A hand-off still going keeps its pose until it is done.
      if (hideId == null) off();
    };
    const say = (p: TravelPhase) => {
      if (p === phase) return;
      const was = phase;
      phase = p;
      onPhaseRef.current(p, was);
    };
    const show = (share: number) => {
      if (share <= 0 || (reduced() && share < 1)) {
        say("before");
        offSoon();
      } else if (share >= 1) {
        say("after");
        offSoon();
      } else {
        clearHide();
        followPhoto();
        if (running.length === 0) hold(share);
        else for (const a of running) a.currentTime = share * 1000;
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
  }, [t]);

  return (
    <div ref={layer} className="sign-travel" aria-hidden="true">
      <style>{CSS}</style>
      {/* eslint-disable @next/next/no-img-element -- pre-sized WebP photos cut by opacity; the Next optimizer adds nothing and would break decode-ahead */}
      <img
        ref={plate}
        src={PLATE_SRC}
        alt=""
        draggable={false}
        decoding="async"
        fetchPriority="low"
      />
      {/* The stand-in for the sign itself: the sign's own photo on its
          canvas, turned as the sign is (the cartel's perspective and its
          stack's transform, followPhoto), under its shadow, with its
          glow — so up to the hand-off it is the sign. */}
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
            ref={photo}
            src={FRONT_SRC}
            alt=""
            draggable={false}
            decoding="async"
            fetchPriority="low"
            style={{ opacity: 1 }}
          />
          {GLOW_DEFAULTS.strength > 0 && (
            <img
              ref={glow}
              src={FRONT_SRC}
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
