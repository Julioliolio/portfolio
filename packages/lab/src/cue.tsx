"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Enter } from "./motion";
import { play } from "./sound";
import { springEasing } from "./spring";
import { INK, MEDIUM, SETTLE_EASE } from "./style";
import { createTuningStore } from "./tuning-store";

/**
 * The landing's scroll cue: Julio's glyph — his arrow between a pair of
 * parens — at the foot of the first screen and, its arrow flipped, the
 * head of the second. It nudges its arrow while it waits; under the
 * pointer the parens jump apart in held cuts and the words ("Browse
 * projects", "Back up") pop into the room after the arrow, on one line
 * with it, with the site's pop entrance, and hold; leaving shuts them
 * the same way. Parens, arrow and words are all one weight: the body
 * copy's stem (the tuning's line). Open or shut, the whole of it sits on
 * the middle of the screen: the near paren and the arrow step one way
 * as the far paren steps the other. The parens tap as they part (the
 * site's hover sound, see sound.tsx) and tap softer as they shut; the
 * click's knock is the caller's. See the CSS below for every beat.
 *
 * The cue's numbers are a `CueTuning`; /lab/cue is its bench, and the
 * stylesheet is regenerated from the live values, so what is set there
 * is what the landing does — in that browser, until Reset. Lock a feel
 * in by pasting the bench's values into CUE_DEFAULTS.
 */

export type CueTuning = {
  /** The glyph's height on the landing, vh. */
  size: number;
  /** The least the glyph's height goes to, px, on a short window. */
  minPx: number;
  /** How far off the screen's foot (or head) it sits, vh. */
  foot: number;

  /** The weight. The one line the parens and the arrow are drawn with,
   *  glyph units (the glyph is GLYPH_H = 38 tall); 2.72 is the body
   *  copy's stem at a word of 34 — Neue Montreal Regular's l is 0.08em. */
  line: number;
  /** The words' cut: the body copy's Regular or the site's Medium. */
  cutOf: "regular" | "medium";
  /** A hairline drawn round every letter of the words, units — 0 is the
   *  cut as it is; more thickens it past what the cut alone gives. */
  wordStroke: number;
  /** The ink's strength, 0 to 1: the whole cue, parens, arrow and words. */
  ink: number;

  /** A paren's width, units. */
  parenW: number;
  /** The air between the parens and the arrow while shut, units. */
  restGap: number;
  /** The words' size, units. */
  word: number;
  /** The air before the words (after the arrow) and after them (before
   *  the far paren), units. */
  wordGap: number;
  wordPad: number;
  /** The words' letter-spacing, em. */
  tracking: number;

  /** How the parens part: in held cuts (the site's stop motion) or
   *  smooth — the room opening on a spring, the words fading in. */
  motion: "cuts" | "smooth";
  /** The open and the close, ms: the three cuts together; or, smooth,
   *  the spring's period (how long one swing takes — it settles a little
   *  after) and the close's ease. */
  cut: number;
  /** Smooth only — the spring's bounce, 0 to 0.8: 0 settles without
   *  passing its place, more runs the far paren past it and back. */
  bounce: number;
  /** Cuts only — the open's first cut: how far past its place each side
   *  jumps, units; its second: how far short of it. */
  spread: number;
  back: number;

  /** What the arrow does while it waits: nothing, a nudge (a quick dip
   *  and back, then a long hold), or a bob (down and up, all the time).
   *  Held or smooth as `motion` is. */
  idle: "off" | "nudge" | "bob";
  /** The idle's period, s, and how deep it goes, the arrow's units. */
  nudge: number;
  dip: number;
};

// Julio's picks off /lab/cue, 2026-09-23.
const CUE_DEFAULTS: Readonly<CueTuning> = Object.freeze({
  size: 2.5,
  minPx: 16,
  foot: 3.5,
  line: 3.26,
  cutOf: "medium",
  wordStroke: 0.3,
  ink: 1,
  parenW: 14,
  restGap: 1.5,
  word: 27,
  wordGap: 11.5,
  wordPad: 8,
  tracking: 0.03,
  motion: "smooth",
  cut: 210,
  bounce: 0.3,
  spread: 3,
  back: 2,
  idle: "nudge",
  nudge: 2,
  dip: 4,
});

const store = createTuningStore("portfolio.cue", CUE_DEFAULTS);
export const setCueTuning = store.set;
export const resetCueTuning = store.reset;
export const useCueTuning = store.useTuning;

/** ms the shut's tap waits for the pointer to come back (see `close`). */
const CLOSE_TAP_MS = 40;
/** The glyph's height in its own units, and the arrow's box in it (the
 *  arrow is 13.5 x 27 in the middle of it). */
const GLYPH_H = 38;
const ARROW_W = 14;
/** How far past the glyph's edges the pointer counts as on it, in glyph
 *  units — about a fifth of the glyph's width each side — and never
 *  under HIT_MIN_PX, so the small mark still catches the pointer and
 *  makes a tap target. */
const HIT = 12;
const HIT_MIN_PX = 14;
/** The exit's two cuts, ms — the slot stays mounted this long after the
 *  cue is told to go (see .cue-exit). */
const CUE_EXIT_MS = 240;

const n = (v: number, d = 3) => Number(v.toFixed(d)).toString();

/** The ink as rgb, for the tuning's strength to go on. */
const INK_RGB = INK.slice(1)
  .match(/../g)!
  .map((c) => parseInt(c, 16))
  .join(", ");

const cueCss = (t: CueTuning) => `
/* The scroll cue's slot on each screen. The pop entrance plays on the
   element inside it, the parting inside that, the exit on the slot
   itself — each on its own element so no transform fights another.
   --u is one unit of the glyph's height (${GLYPH_H} of them), so the
   words are laid out in the glyph's own units. --cue-size is the
   glyph's height (the tuning's size, never under its minPx; a caller
   may pass its own). */
.cue { --cue-size: max(${n(t.size)}vh, ${n(t.minPx)}px); --u: calc(var(--cue-size) / ${GLYPH_H}); position: absolute; left: 50%; width: max-content; height: var(--cue-size); transform: translateX(-50%); }
.cue.is-down { bottom: ${n(t.foot)}vh; }
.cue.is-up { top: ${n(t.foot)}vh; }
.cue-pop { height: 100%; }
/* Leaving: two held poses — half gone and a step along its arrow, then
   gone. Plays while the cue is still mounted. */
.cue-exit { animation: cue-exit ${CUE_EXIT_MS}ms steps(1, end) both; }
@keyframes cue-exit { 0% { opacity: 1; transform: translateX(-50%); } 50% { opacity: .5; transform: translate(-50%, var(--cue-way, 6px)); } 100% { opacity: 0; transform: translate(-50%, calc(var(--cue-way, 6px) * 2)); } }
.cue.is-up { --cue-way: -6px; }
/* The glyph is a row — paren, arrow, the words' room, paren — as wide
   as what is in it, and the slot is centred on its own middle. So when
   the room opens the row grows both ways from the middle of the screen,
   as far as the words need, and nothing is measured. Set in the site's
   ink at the tuning's strength. */
.cue-glyph { position: relative; display: flex; align-items: center; height: 100%; padding: 0; background: none; border: 0; color: rgba(${INK_RGB}, ${n(t.ink)}); }
/* The hit area: HIT units of the glyph's own past every edge, unseen, so
   the pointer parts it before it is quite on the glyph. Part of the
   button, so it opens, holds and clicks like the glyph itself. */
.cue-glyph::before { content: ""; position: absolute; inset: calc(-1 * max(var(--u) * ${HIT}, ${HIT_MIN_PX}px)); }
.cue-glyph svg { display: block; flex: none; height: 100%; overflow: visible; }
/* The arrow. The up cue's is the down cue's flipped, so
   its idle and its jolts follow its way. */
.cue-arrow-box { width: calc(var(--u) * ${ARROW_W}); margin-left: calc(var(--u) * ${n(t.restGap)}); transform: var(--flip, none); }
.is-up .cue-arrow-box { --flip: scaleY(-1); }
${idleCss(t)}
.cue-paren { width: calc(var(--u) * ${n(t.parenW)}); }
/* The near side — the paren before the arrow, and the arrow — and the
   far paren each step along their --way in the open's and the close's
   cuts. */
.cue-near { --way: -1; display: flex; flex: none; height: 100%; }
.cue-far { --way: 1; }
/* The words' room, between the arrow and the far paren: at least the
   rest gap wide, and inside it a clip as wide as the words and their
   air (--cue-w, measured by <Cue>) times --cue-p — 0 shut, 1 open. The
   cuts snap --cue-p; the smooth mode springs it, past 1 and back, so
   the far paren runs past its place and settles. The words sit still
   in the clip, uncovered as it grows, never squeezed. */
@property --cue-p { syntax: "<number>"; inherits: false; initial-value: 0; }
.cue-room { display: flex; flex: none; align-items: center; min-width: calc(var(--u) * ${n(t.restGap)}); }
.cue-clip { --cue-p: 0; display: block; flex: none; width: calc(var(--cue-p) * var(--cue-w, 0px)); overflow-x: clip; }
.cue-open .cue-clip { --cue-p: 1; }
/* The words: one line, level with the arrow, in the tuning's cut, with
   its hairline if it has one. */
.cue-label { display: block; width: max-content; padding: 0 calc(var(--u) * ${n(t.wordPad)}) 0 calc(var(--u) * ${n(t.wordGap)}); opacity: 0; pointer-events: none; white-space: nowrap; font-size: calc(var(--u) * ${n(t.word)}); line-height: 1; letter-spacing: ${n(t.tracking)}em;${t.cutOf === "medium" ? ` font-family: ${MEDIUM}; font-weight: 500;` : ""}${t.wordStroke > 0 ? ` -webkit-text-stroke: calc(var(--u) * ${n(t.wordStroke)}) currentColor;` : ""} }
${t.motion === "cuts" ? cutsCss(t) : smoothCss(t)}
.cue-glyph:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; border-radius: 999px; }
@media (prefers-reduced-motion: reduce) {
  .cue-arrow { animation: none; }
  .cue-clip { transition: none !important; }
  .cue-exit, .cue-open *, .cue-close * { animation-duration: 1ms; }
}
`;

/* Hover parts the parens, in held cuts a third of `cut` apart. Opening,
   three: the room is there at once and each side jumps out to its place
   (spread units past it, back short of it, rest), the words pop into it
   with the site's own pop entrance (sm-pop, from @portfolio/lab/motion:
   big, a hair small, rest), and the arrow takes the jolt — a step down
   its way, a step back past its place, rest. Closing, three: the arrow
   dips again with the words still there and the parens held; then the
   words are gone and the parens are shut past closed; then at rest.
   Nothing fades: each pose is there or not. The classes come from the
   cue's state so nothing plays at mount; the idle gives way to the
   jolts. */
const cutsCss = (t: CueTuning) => {
  const ms = `${n(t.cut, 0)}ms steps(1, end) both`;
  return `
.cue-open .cue-near, .cue-open .cue-far { animation: cue-side-open ${ms}; }
.cue-open .cue-arrow { animation: cue-arrow-open ${ms}; }
.cue-open .cue-label { animation: sm-pop calc(var(--sm-duration) * .8) steps(1, end) both; }
.cue-close .cue-near, .cue-close .cue-far { animation: cue-side-close ${ms}; }
.cue-close .cue-clip { animation: cue-room-close ${ms}; }
.cue-close .cue-arrow { animation: cue-arrow-close ${ms}; }
.cue-close .cue-label { animation: cue-words-close ${ms}; }
@keyframes cue-side-open { 0% { transform: translateX(calc(var(--way) * var(--u) * ${n(t.spread)})); } 33.3% { transform: translateX(calc(var(--way) * var(--u) * -${n(t.back)})); } 66.7%, 100% { transform: none; } }
@keyframes cue-arrow-open { 0% { transform: translateY(3px); } 33.3% { transform: translateY(-1px); } 66.7%, 100% { transform: none; } }
@keyframes cue-side-close { 0% { transform: none; } 33.3% { transform: translateX(calc(var(--way) * var(--u) * -${n(t.back)})); } 66.7%, 100% { transform: none; } }
@keyframes cue-room-close { 0% { --cue-p: 1; } 33.3%, 100% { --cue-p: 0; } }
@keyframes cue-arrow-close { 0% { transform: translateY(2px); } 33.3%, 100% { transform: none; } }
@keyframes cue-words-close { 0% { opacity: 1; } 33.3%, 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .cue-open .cue-label { animation: sm-pop 1ms steps(1, end) both; } }`;
};

/* Smooth: the room opens on the spring — the far paren carried out past
   its place by the bounce and back — and shuts on the ease, the words
   fading and rising in as it opens and fading out first as it shuts;
   the arrow's jolt is eased. Spread and back are the cuts' and play no
   part. (A browser without linear() keeps the ease both ways.) */
const smoothCss = (t: CueTuning) => {
  const ms = n(t.cut, 0);
  const { easing, settle } = springEasing(t.cut, t.bounce);
  return `
.cue-clip { transition: --cue-p ${ms}ms ${SETTLE_EASE}; }
.cue-open .cue-clip { transition: --cue-p ${n(settle, 0)}ms ${SETTLE_EASE}; transition: --cue-p ${n(settle, 0)}ms ${easing}; }
.cue-open .cue-arrow { animation: cue-arrow-open ${ms}ms ${SETTLE_EASE} both; }
.cue-open .cue-label { animation: cue-words-in ${ms}ms ${SETTLE_EASE} both; }
.cue-close .cue-label { animation: cue-words-out ${n(t.cut * 0.5, 0)}ms ease-out both; }
@keyframes cue-arrow-open { 0% { transform: none; } 35% { transform: translateY(2.5px); } 100% { transform: none; } }
@keyframes cue-words-in { 0% { opacity: 0; transform: translateY(calc(var(--u) * 4)); } 100% { opacity: 1; transform: none; } }
@keyframes cue-words-out { 0% { opacity: 1; } 100% { opacity: 0; } }`;
};

/* The idle, while the parens are shut: every `nudge` seconds the arrow
   alone dips `dip` along its way and comes back — quickly, then a long
   hold (nudge) — or goes down and up the whole period (bob). Held poses
   or eased, as the motion is. Its steps are px inside the arrow's
   viewBox — the glyph's own units — so a small glyph moves as little
   as it is. */
const idleCss = (t: CueTuning) => {
  if (t.idle === "off") return "";
  const timing = t.motion === "cuts" ? "steps(1, end)" : "ease-in-out";
  const d = (k: number) => `translateY(${n(t.dip * k)}px)`;
  const frames =
    t.idle === "nudge"
      ? `0%, 84% { transform: none; } 87.5% { transform: ${d(0.57)}; } 91% { transform: ${d(1)}; } 94% { transform: ${d(0.29)}; } 100% { transform: none; }`
      : `0%, 100% { transform: none; } 25% { transform: ${d(0.5)}; } 50% { transform: ${d(1)}; } 75% { transform: ${d(0.5)}; }`;
  return `.cue-arrow { animation: cue-idle ${n(t.nudge)}s ${timing} infinite; }
@keyframes cue-idle { ${frames} }`;
};

/** Julio's arrow as one line of the tuning's `line`: its shaft and the two arms of
 *  its head, on the geometry of his drawing (the shaft up the middle of
 *  x 18.12 from y 16.1, the head's arms out to x 12.4 and 23.84 at
 *  y 36.8, the tip at 42.3), in the middle of the ARROW_W x GLYPH_H
 *  box at ARROW_BOX. His filled drawing could not be made lighter, so
 *  it is drawn again as a stroke, the parens' own. */
const ARROW = "M18.12 16.1V40.6M12.4 36.8L18.12 42.3L23.84 36.8";
const ARROW_BOX = `${18.06 - ARROW_W / 2} ${29.58 - GLYPH_H / 2} ${ARROW_W} ${GLYPH_H}`;
/** The paren before the arrow: half an ellipse, the glyph's height and
 *  `w` wide to the outside of its line of `line`, open towards the
 *  arrow. The one after is its mirror. */
const parenPath = (w: number, line: number) =>
  `M${w} ${line / 2}A${w - line / 2} ${(GLYPH_H - line) / 2} 0 0 0 ${w} ${GLYPH_H - line / 2}`;

function Paren({
  side,
  w,
  line,
}: {
  side: "before" | "after";
  w: number;
  line: number;
}) {
  return (
    <svg
      className={side === "after" ? "cue-paren cue-far" : "cue-paren"}
      viewBox={`0 0 ${w} ${GLYPH_H}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={line}
      aria-hidden="true"
    >
      <path
        d={parenPath(w, line)}
        transform={side === "after" ? `translate(${w}) scale(-1 1)` : undefined}
      />
    </svg>
  );
}

function Arrow({ line }: { line: number }) {
  return (
    <svg
      className="cue-arrow-box"
      viewBox={ARROW_BOX}
      fill="none"
      stroke="currentColor"
      strokeWidth={line}
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path className="cue-arrow" d={ARROW} />
    </svg>
  );
}

/**
 * The scroll cue in its slot. Mounts with the site's pop entrance after
 * `delay`, nudges its arrow while it waits, parts its parens for
 * `text` under the pointer (or keyboard focus), and leaves in two held
 * cuts, staying mounted through them. A cue told to show again mid-exit
 * pops again from its first pose.
 */
export function Cue({
  dir,
  shown,
  delay,
  label,
  text,
  size,
  holdOpen = false,
  onClick,
}: {
  dir: "down" | "up";
  shown: boolean;
  /** ms before the pop's first cut, at each mount. */
  delay: number;
  label: string;
  /** The words the parted parens hold, after the arrow. */
  text: string;
  /** The glyph's height, vh (never under the tuning's minPx) — the
   *  tuning's size unless given; a bench may go bigger. */
  size?: number;
  /** Keeps the parens apart whatever the pointer does — a bench's
   *  "hold open", to tune the open pose. */
  holdOpen?: boolean;
  onClick: () => void;
}) {
  const t = useCueTuning();
  // Derived during render: a flip to hidden starts the exit; a flip to
  // shown re-keys the pop so it replays from the first pose.
  const [prevShown, setPrevShown] = useState(shown);
  const [leaving, setLeaving] = useState(false);
  const [shows, setShows] = useState(shown ? 1 : 0);
  // The parens: closed, open under the pointer, or on their way closed (the
  // close cuts play, then the classes come off). Touch has no hover, so
  // a tap only clicks. A cue that leaves is closed on the way out.
  const [parens, setParens] = useState<"closed" | "open" | "closing">("closed");
  if (shown !== prevShown) {
    setPrevShown(shown);
    setLeaving(!shown);
    if (shown) setShows((n) => n + 1);
    else setParens("closed");
  }
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setLeaving(false), CUE_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);
  useEffect(() => {
    if (parens !== "closing") return;
    // Only parens still closing are shut: the pointer can come back and
    // re-open it before this effect's cleanup clears the timer.
    const timer = window.setTimeout(
      () => setParens((r) => (r === "closing" ? "closed" : r)),
      t.cut,
    );
    return () => window.clearTimeout(timer);
  }, [parens, t.cut]);
  // The taps read the parens through a ref kept in step at once, not the
  // rendered state: a leave and a return inside one frame both fire
  // before React renders between them, and the return has to know the
  // parens shut. Nothing plays inside an updater.
  // The words' width with their air, measured and kept on the clip as
  // --cue-w, re-measured whenever it changes (the font arriving, the
  // tuning, the text): the room's open width, which the spring scales.
  const clipRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const clip = clipRef.current;
    const label = clip?.firstElementChild as HTMLElement | null;
    if (!clip || !label) return;
    const measure = () =>
      clip.style.setProperty("--cue-w", `${label.offsetWidth}px`);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(label);
    return () => ro.disconnect();
  }, [shows]);
  const parensRef = useRef(parens);
  useEffect(() => {
    parensRef.current = parens;
  }, [parens]);
  // The shut's tap waits CLOSE_TAP_MS: a pointer that skims the edge
  // and is back inside that is one open, not a shut and an open on top
  // of each other, and the open is the tap that must not be lost.
  const closeTap = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (closeTap.current !== null) window.clearTimeout(closeTap.current);
    },
    [],
  );
  const open = () => {
    if (closeTap.current !== null) {
      window.clearTimeout(closeTap.current);
      closeTap.current = null;
    }
    if (parensRef.current !== "open") play("tap", 1, { at: "cue" });
    parensRef.current = "open";
    setParens("open");
  };
  const close = () => {
    if (parensRef.current === "open") {
      parensRef.current = "closing";
      closeTap.current = window.setTimeout(() => {
        closeTap.current = null;
        play("tap", 0.5, { at: "cue" });
      }, CLOSE_TAP_MS);
    }
    setParens((r) => (r === "open" ? "closing" : r));
  };

  if (!shown && !leaving) return null;
  return (
    <div
      className={["cue", `is-${dir}`, shown ? "" : "cue-exit"]
        .filter(Boolean)
        .join(" ")}
      style={
        size === undefined
          ? undefined
          : ({
              "--cue-size": `max(${size}vh, ${t.minPx}px)`,
            } as CSSProperties)
      }
    >
      <Enter
        key={shows}
        kind="pop"
        gate="mount"
        delay={delay}
        className="cue-pop"
      >
        <button
          type="button"
          className={[
            "cue-glyph",
            "sm-press",
            (holdOpen || parens === "open") && "cue-open",
            !holdOpen && parens === "closing" && "cue-close",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label={label}
          onClick={onClick}
          onPointerEnter={(e) => {
            if (e.pointerType !== "touch") open();
          }}
          onPointerLeave={close}
          onFocus={(e) => {
            if (e.currentTarget.matches(":focus-visible")) open();
          }}
          onBlur={close}
          // On its way out it is no longer a stop on the way through the
          // page.
          tabIndex={shown ? 0 : -1}
        >
          <span className="cue-near">
            <Paren side="before" w={t.parenW} line={t.line} />
            <Arrow line={t.line} />
          </span>
          <span className="cue-room">
            <span className="cue-clip" ref={clipRef}>
              <span className="cue-label">{text}</span>
            </span>
          </span>
          <Paren side="after" w={t.parenW} line={t.line} />
        </button>
      </Enter>
    </div>
  );
}

/** The cue's stylesheet, once per page, regenerated from the live
 *  tuning. */
export function CueStyles() {
  const t = useCueTuning();
  return <style>{cueCss(t)}</style>;
}
