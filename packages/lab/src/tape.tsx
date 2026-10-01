"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { asset } from "./asset";
import { Enter } from "./motion";
import { play } from "./sound";
import { springEasing } from "./spring";
import { MEDIUM, SETTLE_EASE } from "./style";
import { createTuningStore } from "./tuning-store";
import { UNDER_WINDOW } from "./under-window";

/**
 * The landing's scroll cue as a strip of paper tape: torn, folded into
 * an arrow and stuck to the mat at the foot of the first screen — and,
 * turned round, at the head of the second (Julio's reference,
 * 2026-09-29: the tape arrow with "see projects" under it). It is stuck
 * flat: the mat shows through it a little (`stuck`) and it casts no
 * more than a contact shadow. Under the pointer it peels off toward
 * the camera — it grows (`lift`), its tip comes up first (`tilt`, about
 * the end that stays down, `pivot`), it twists a hair (`turn`) — and
 * its shadow leaves it and falls, soft and wide, on the mat and on the
 * words that appear with it (textDown, textUp): the
 * tape is over the words, and its shadow on them, as in the reference.
 * Leaving sticks it back down and the words go. While it waits it
 * nudges along its way like the parens cue did (`idle`). It taps as it
 * peels and, softer, as it sticks back; the click's knock is the
 * caller's.
 *
 * One number drives the peel: --tape-p, 0 stuck and 1 peeled, which
 * the transform, the shadow and the tape's opacity are all written in
 * terms of. In held cuts it snaps through three poses (past, short,
 * rest); smooth, it rides the site's spring, past 1 and back, so the
 * tape overshoots its lift and settles. The image is one WebP
 * (scripts/prepare-tape.mjs) pointing down; the up cue turns it round
 * and its shadow's offsets with it.
 *
 * The numbers are a `TapeTuning`; /lab/tape-arrow is its bench and the
 * stylesheet is regenerated from the live values — what is set there is
 * what the landing does, in that browser, until Reset. Lock a feel in
 * by pasting the bench's values into TAPE_DEFAULTS.
 */

export type TapeTuning = {
  /** The tape's height on the landing, vh, never under minPx. */
  size: number;
  minPx: number;
  /** How far off the screen's foot (or head) its far end sits, vh. */
  foot: number;
  /** The tape's opacity while stuck — the mat through the paper. Peeled
   *  it is opaque. */
  stuck: number;

  /** Stuck: the contact shadow, in u (hundredths of the height) — how
   *  far down, how soft, how dark. */
  restY: number;
  restBlur: number;
  restAlpha: number;

  /** Peeled: how far it steps back along its way, u — making room for
   *  the words under its tip; how big it grows (1.2 is a fifth); how
   *  far its tip comes up (deg, about the end that stays down); the
   *  twist (deg); and where the end that stays down is along the tape
   *  (%; 0 the far end, 100 the tip). */
  step: number;
  lift: number;
  tilt: number;
  turn: number;
  pivot: number;
  /** Peeled: the cast shadow, u — across, down, its softness, its
   *  darkness. */
  castX: number;
  castY: number;
  castBlur: number;
  castAlpha: number;

  /** The words: what they say, for each cue; their size, u; their
   *  letter-spacing, em; their cut; how they come — the site's pop in
   *  held cuts, a fade and rise, or a fade — how long that takes, ms,
   *  and how long after the peel starts, ms. */
  textDown: string;
  textUp: string;
  /** Where each arrow's words sit: above it or below it — past its
   *  tail or past its tip, whichever way it points. */
  wordsDown: "above" | "below";
  wordsUp: "above" | "below";
  word: number;
  /** The words' colour (#rrggbb) and how opaque they are, 0 to 1 —
   *  the mat shows through them below 1. */
  wordColor: string;
  wordAlpha: number;
  /** How far each arrow's near end, once stepped back, reaches into
   *  its words, u (past the tip, the lift's growth adds a little); a
   *  minus is a gap. */
  overlapDown: number;
  overlapUp: number;
  tracking: number;
  cutOf: "regular" | "medium";
  wordMotion: "pop" | "rise" | "fade";
  wordMs: number;
  wordWait: number;

  /** The peel: in held cuts, or smooth on the spring. `cut` is the
   *  three cuts together, or the spring's period and the stick-back's
   *  ease; `bounce` the spring's (smooth only). */
  motion: "cuts" | "smooth";
  cut: number;
  bounce: number;

  /** What the tape does while it waits: nothing, a nudge along its way
   *  (a quick dip and back, then a long hold) or a bob. Held or eased
   *  as `motion` is. `nudge` is the period, s; `dip` how far, u. */
  idle: "off" | "nudge" | "bob";
  nudge: number;
  dip: number;

  /** How it arrives: the site's entrances (motion.tsx). */
  entrance: "drop" | "stamp" | "pop" | "slide";
};

// Julio's values off /lab/tape-arrow (2026-09-29, second pass): both
// arrows' words above them.
const TAPE_DEFAULTS: Readonly<TapeTuning> = Object.freeze({
  size: 5.4,
  minPx: 40,
  foot: 2.4,
  stuck: 1,
  restY: 3.8,
  restBlur: 2.7,
  restAlpha: 0.38,
  step: 35.5,
  lift: 1.3,
  tilt: 0,
  turn: 2,
  pivot: 50,
  castX: 0.5,
  castY: 15.5,
  castBlur: 2.5,
  castAlpha: 0.31,
  textDown: "view work",
  textUp: "back up",
  wordsDown: "above",
  wordsUp: "above",
  word: 48,
  wordColor: "#eef1f1",
  wordAlpha: 1,
  overlapDown: -37.5,
  overlapUp: 2.5,
  tracking: -0.02,
  cutOf: "medium",
  wordMotion: "rise",
  wordMs: 220,
  wordWait: 40,
  motion: "smooth",
  cut: 190,
  bounce: 0.48,
  idle: "nudge",
  nudge: 3,
  dip: 10.5,
  entrance: "slide",
});

const store = createTuningStore("portfolio.tape", TAPE_DEFAULTS);
export const setTapeTuning = store.set;
export const resetTapeTuning = store.reset;
export const useTapeTuning = store.useTuning;

/** The tape's width over its height, printed by scripts/prepare-tape.mjs
 *  — sizes the slot before the photo decodes. */
const TAPE_ASPECT = 0.835;
const TAPE = asset("/tape/arrow.webp");

/** ms the stick-back's tap waits for the pointer to come back. */
const CLOSE_TAP_MS = 40;
/** How far past the tape's edges the pointer counts as on it, u, and
 *  never under HIT_MIN_PX. */
const HIT = 10;
const HIT_MIN_PX = 14;
/** The exit's two cuts, ms — the slot stays mounted this long after the
 *  tape is told to go. */
const TAPE_EXIT_MS = 240;

const n = (v: number, d = 3) => Number(v.toFixed(d)).toString();

/** A #rrggbb colour at `alpha`, as rgba() — the words' opacity goes in
 *  their colour, so their fade in and out still runs 0 to 1 on top. A
 *  colour that is not #rrggbb is taken as it is. */
function tint(hex: string, alpha: number) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const [r, g, b] = m.slice(1).map((c) => parseInt(c, 16));
  return `rgba(${r}, ${g}, ${b}, ${n(Math.min(1, Math.max(0, alpha)))})`;
}

/** A value between its stuck and peeled ends at --tape-p. */
const between = (rest: number, peeled: number) =>
  `calc(${n(rest)} + var(--tape-p) * ${n(peeled - rest)})`;

const tapeCss = (t: TapeTuning) => {
  const shadow = `drop-shadow(calc(var(--sx) * var(--u) * ${between(0, t.castX)}) calc(var(--sx) * var(--u) * ${between(t.restY, t.castY)}) calc(var(--u) * ${between(t.restBlur, t.castBlur)}) rgba(0, 0, 0, ${between(t.restAlpha, t.castAlpha)}))`;
  return `
/* The slot on each screen: the tape's box, centred, its far end off
   the screen's foot (or head). --u is a hundredth of its height, so
   everything else is in the tape's own units. The pop entrance plays
   on the element inside it, the peel inside that, the exit on the slot
   itself — each on its own element so no transform fights another. */
.tape { --tape-size: max(${n(t.size)}vh, ${n(t.minPx)}px); --u: calc(var(--tape-size) / 100); --flip: 1; --sx: 1; position: absolute; left: 50%; width: calc(var(--tape-size) * ${TAPE_ASPECT}); height: var(--tape-size); transform: translateX(-50%); }
.tape.is-down { bottom: ${n(t.foot)}vh; }
.tape.is-up { top: ${n(t.foot)}vh; --flip: -1; --sx: -1; }
.tape-pop { height: 100%; }
/* Leaving: two held poses — half gone and a step along its way, then
   gone. Plays while the tape is still mounted. */
.tape-exit { animation: tape-exit ${TAPE_EXIT_MS}ms steps(1, end) both; }
@keyframes tape-exit { 0% { opacity: 1; transform: translateX(-50%); } 50% { opacity: .5; transform: translate(-50%, calc(var(--flip) * 6px)); } 100% { opacity: 0; transform: translate(-50%, calc(var(--flip) * 12px)); } }
/* The peel's one number: 0 stuck, 1 peeled. Inherited, so the tape's
   image reads it for its shadow and its opacity. */
@property --tape-p { syntax: "<number>"; inherits: true; initial-value: 0; }
.tape-hit { --tape-p: 0; position: relative; display: block; width: 100%; height: 100%; padding: 0; background: none; border: 0; color: var(--tape-ink, #fff); }
/* The hit area: HIT units past every edge, unseen. */
.tape-hit::before { content: ""; position: absolute; inset: calc(-1 * max(var(--u) * ${HIT}, ${HIT_MIN_PX}px)); }
.tape-hit:focus-visible { outline: 2px solid currentColor; outline-offset: 6px; border-radius: 6px; }
/* The words, above or below each arrow — past its tail or past its
   tip — centred on the tape, their near edge where that end will be
   once stepped back, less the overlap. Painted before the tape, so
   the tape and its shadow are over them. */
.tape-words { position: absolute; left: 50%; transform: translateX(-50%); pointer-events: none; color: ${tint(t.wordColor, t.wordAlpha)}; white-space: nowrap; font-size: calc(var(--u) * ${n(t.word)}); line-height: 1; letter-spacing: ${n(t.tracking)}em;${t.cutOf === "medium" ? ` font-family: ${MEDIUM}; font-weight: 500;` : ""} }
/* The words' own element takes the entrance and the exit, so the
   pop's transform never fights the centring. */
.tape-word { display: block; opacity: 0; }
${wordsPlace(".is-down", t.wordsDown === "below", t.overlapDown, t)}
${wordsPlace(".is-up", t.wordsUp === "above", t.overlapUp, t)}
/* The peel: the tape steps back along its way, and about the end that
   stays down its tip comes up toward the camera as it grows and
   twists — all by --tape-p. */
.tape-lift { display: block; width: 100%; height: 100%; transform: translateY(calc(var(--flip) * var(--tape-p) * var(--u) * ${n(-t.step)})) perspective(calc(var(--tape-size) * 5)) rotateX(calc(var(--flip) * var(--tape-p) * ${n(t.tilt)}deg)) rotate(calc(var(--tape-p) * ${n(t.turn)}deg)) scale(calc(1 + var(--tape-p) * ${n(t.lift - 1)})); }
.is-down .tape-lift { transform-origin: 50% ${n(t.pivot)}%; }
.is-up .tape-lift { transform-origin: 50% ${n(100 - t.pivot)}%; }
.tape-idle { display: block; height: 100%; }
${idleCss(t)}
/* The tape itself: the mat through it while stuck, opaque once off;
   its shadow from a contact line to a cast, offsets turned with the up
   cue's image (--sx). */
.tape-img { display: block; width: 100%; height: 100%; user-select: none; opacity: ${between(t.stuck, 1)}; filter: ${shadow}; }
.is-up .tape-img { transform: rotate(180deg); }
.tape-open .tape-idle, .tape-close .tape-idle { animation: none; }
/* Under a project window it holds; one in the window (an opening's)
   carries on. */
html.${UNDER_WINDOW} .tape-idle:not(.pw .tape-idle) { animation-play-state: paused; }
${t.motion === "cuts" ? cutsCss(t) : smoothCss(t)}
${wordsCss(t)}
@media (prefers-reduced-motion: reduce) {
  .tape-open .tape-word, .tape-close .tape-word { animation-duration: 1ms; }
  .tape-idle { animation: none; }
  .tape-hit { transition: none !important; }
  .tape-exit, .tape-open, .tape-close, .tape-open *, .tape-close * { animation-duration: 1ms; }
}
`;
};

/** Where one cue's words go: past its tip (`tip`) or past its tail,
 *  its near end `overlap` units into them. Down and up are mirrors:
 *  the same rule with top and bottom swapped. */
const wordsPlace = (
  cue: string,
  tip: boolean,
  overlap: number,
  t: TapeTuning,
) => {
  const [near, far] =
    cue === ".is-down" ? ["top", "bottom"] : ["bottom", "top"];
  return tip
    ? `${cue} .tape-words { ${near}: calc(100% - var(--u) * ${n(t.step + overlap)}); }`
    : `${cue} .tape-words { ${far}: calc(100% + var(--u) * ${n(t.step - overlap)}); }`;
};

/* Held cuts, a third of `cut` apart. Peeling, three: past its lift
   (--tape-p over 1), a hair short, rest. Sticking back, three: a step
   down, pressed a hair into the mat (under 0), rest. Nothing fades:
   each pose is there or not. */
const cutsCss = (t: TapeTuning) => {
  const ms = `${n(t.cut, 0)}ms steps(1, end) both`;
  return `
.tape-open { animation: tape-peel ${ms}; }
.tape-close { animation: tape-stick ${ms}; }
@keyframes tape-peel { 0% { --tape-p: 1.35; } 33.3% { --tape-p: .88; } 66.7%, 100% { --tape-p: 1; } }
@keyframes tape-stick { 0% { --tape-p: .4; } 33.3% { --tape-p: -.08; } 66.7%, 100% { --tape-p: 0; } }`;
};

/* Smooth: the peel rides the spring — past its lift by the bounce and
   back — and sticks back on the ease. The peel's transition is written
   twice: the ease for a browser without linear(), the spring over it. */
const smoothCss = (t: TapeTuning) => {
  const ms = n(t.cut, 0);
  const { easing, settle } = springEasing(t.cut, t.bounce);
  return `
.tape-hit { transition: --tape-p ${ms}ms ${SETTLE_EASE}; }
.tape-open { --tape-p: 1; transition: --tape-p ${n(settle, 0)}ms ${SETTLE_EASE}; transition: --tape-p ${n(settle, 0)}ms ${easing}; }`;
};

/* The words, on their own clock: they come after wordWait — the site's
   pop in held cuts, or a fade and rise, or a fade alone — over wordMs,
   and go as the tape sticks back: gone in one cut after a pop, faded
   out in half their time otherwise. */
const wordsCss = (t: TapeTuning) => {
  const ms = n(t.wordMs, 0);
  const wait = `animation-delay: ${n(t.wordWait, 0)}ms;`;
  const come =
    t.wordMotion === "pop"
      ? `animation: sm-pop ${ms}ms steps(1, end) both; ${wait}`
      : t.wordMotion === "rise"
        ? `animation: tape-words-in ${ms}ms ${SETTLE_EASE} both; ${wait}`
        : `animation: tape-words-fade ${ms}ms ${SETTLE_EASE} both; ${wait}`;
  const go =
    t.wordMotion === "pop"
      ? `animation: tape-words-out 1ms steps(1, end) both;`
      : `animation: tape-words-out ${n(t.wordMs * 0.5, 0)}ms ease-out both;`;
  return `
.tape-open .tape-word { ${come} }
.tape-close .tape-word { ${go} }
@keyframes tape-words-in { 0% { opacity: 0; transform: translateY(calc(var(--flip) * var(--u) * -4)); } 100% { opacity: 1; transform: none; } }
@keyframes tape-words-fade { 0% { opacity: 0; } 100% { opacity: 1; } }
@keyframes tape-words-out { 0% { opacity: 1; } 100% { opacity: 0; } }`;
};

/* The idle, while stuck: every `nudge` seconds the tape dips `dip`
   along its way and comes back — quickly, then a long hold (nudge) —
   or goes down and up the whole period (bob). Held poses or eased, as
   the motion is. In the tape's units, so a small tape moves as little
   as it is. */
const idleCss = (t: TapeTuning) => {
  if (t.idle === "off") return "";
  const timing = t.motion === "cuts" ? "steps(1, end)" : "ease-in-out";
  const d = (k: number) =>
    `translateY(calc(var(--flip) * var(--u) * ${n(t.dip * k)}))`;
  const frames =
    t.idle === "nudge"
      ? `0%, 84% { transform: none; } 87.5% { transform: ${d(0.57)}; } 91% { transform: ${d(1)}; } 94% { transform: ${d(0.29)}; } 100% { transform: none; }`
      : `0%, 100% { transform: none; } 25% { transform: ${d(0.5)}; } 50% { transform: ${d(1)}; } 75% { transform: ${d(0.5)}; }`;
  return `.tape-idle { animation: tape-idle ${n(t.nudge)}s ${timing} infinite; }
@keyframes tape-idle { ${frames} }`;
};

/**
 * The tape arrow in its slot. Mounts with the tuning's entrance after
 * `delay`, nudges while it waits, peels for `text` under the pointer
 * (or keyboard focus), and leaves in two held cuts, staying mounted
 * through them. Told to show again mid-exit it arrives again from its
 * first pose. The same props as the parens cue (cue.tsx) it replaced.
 */
export function TapeArrow({
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
  /** ms before the entrance's first cut, at each mount. */
  delay: number;
  label: string;
  /** The words — the tuning's for this way unless given. */
  text?: string;
  /** The tape's height, vh (never under the tuning's minPx) — the
   *  tuning's size unless given; a bench may go bigger. */
  size?: number;
  /** Keeps it peeled whatever the pointer does — a bench's "hold", to
   *  tune the peeled pose. */
  holdOpen?: boolean;
  onClick: () => void;
}) {
  const t = useTapeTuning();
  // Derived during render: a flip to hidden starts the exit; a flip to
  // shown re-keys the entrance so it replays from the first pose.
  const [prevShown, setPrevShown] = useState(shown);
  const [leaving, setLeaving] = useState(false);
  const [shows, setShows] = useState(shown ? 1 : 0);
  // Stuck, peeled under the pointer, or sticking back (the close plays,
  // then the classes come off). Touch has no hover, so a tap only
  // clicks. A tape that leaves is stuck on the way out.
  const [peel, setPeel] = useState<"stuck" | "open" | "closing">("stuck");
  if (shown !== prevShown) {
    setPrevShown(shown);
    setLeaving(!shown);
    if (shown) setShows((n) => n + 1);
    else setPeel("stuck");
  }
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setLeaving(false), TAPE_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);
  useEffect(() => {
    if (peel !== "closing") return;
    const timer = window.setTimeout(
      () => setPeel((r) => (r === "closing" ? "stuck" : r)),
      t.cut,
    );
    return () => window.clearTimeout(timer);
  }, [peel, t.cut]);
  // The taps read the state through a ref kept in step at once (a leave
  // and a return inside one frame both fire before React renders).
  const peelRef = useRef(peel);
  useEffect(() => {
    peelRef.current = peel;
  }, [peel]);
  // The stick-back's tap waits CLOSE_TAP_MS: a pointer that skims the
  // edge and is back inside that is one peel, not two taps on top of
  // each other, and the peel's tap is the one that must not be lost.
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
    if (peelRef.current !== "open") play("tap", 1, { at: "cue" });
    peelRef.current = "open";
    setPeel("open");
  };
  const close = () => {
    if (peelRef.current === "open") {
      peelRef.current = "closing";
      closeTap.current = window.setTimeout(() => {
        closeTap.current = null;
        play("tap", 0.5, { at: "cue" });
      }, CLOSE_TAP_MS);
    }
    setPeel((r) => (r === "open" ? "closing" : r));
  };

  if (!shown && !leaving) return null;
  return (
    <div
      className={["tape", `is-${dir}`, shown ? "" : "tape-exit"]
        .filter(Boolean)
        .join(" ")}
      style={
        size === undefined
          ? undefined
          : ({
              "--tape-size": `max(${size}vh, ${t.minPx}px)`,
            } as CSSProperties)
      }
    >
      <Enter
        key={shows}
        kind={t.entrance}
        gate="mount"
        delay={delay}
        className="tape-pop"
      >
        <button
          type="button"
          className={[
            "tape-hit",
            (holdOpen || peel === "open") && "tape-open",
            !holdOpen && peel === "closing" && "tape-close",
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
          <span className="tape-words" aria-hidden="true">
            <span className="tape-word">
              {text ?? (dir === "down" ? t.textDown : t.textUp)}
            </span>
          </span>
          <span className="tape-lift">
            <span className="tape-idle">
              {/* eslint-disable-next-line @next/next/no-img-element -- static pre-sized WebP; the Next optimizer adds nothing here */}
              <img
                className="tape-img"
                src={TAPE}
                alt=""
                draggable={false}
                decoding="async"
              />
            </span>
          </span>
        </button>
      </Enter>
    </div>
  );
}

/** The tape's stylesheet, once per page, regenerated from the live
 *  tuning. */
export function TapeStyles() {
  const t = useTapeTuning();
  return <style>{tapeCss(t)}</style>;
}
