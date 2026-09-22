"use client";

import { useEffect, useRef, useState } from "react";
import { Enter } from "./motion";
import { play } from "./sound";

/**
 * The landing's scroll cue: Julio's glyph — his arrow between a pair of
 * parens — at the foot of the first screen and, its arrow flipped, the
 * head of the second. It nudges its arrow while it waits; under the
 * pointer the parens jump apart in held cuts and the words ("View
 * projects", "Back up") pop into the room after the arrow, on one line
 * with it and near enough its height and weight, with the site's pop
 * entrance, and hold; leaving shuts them the same way. Open or shut,
 * the whole of it sits on the middle of
 * the screen: the near paren and the arrow step one way as the far
 * paren steps the other. The parens tap as they part (the site's hover
 * sound, see sound.tsx) and tap softer as they shut; the click's knock is the caller's. See the
 * CSS below for every beat.
 *
 * The cue's numbers are the constants below.
 */

/** The glyph's height on the landing, vh — a quiet mark at the foot of
 *  the screen rather than a button, its words the size of a caption. */
export const CUE_VH = 2.5;
/** The glyph's height never falls under this, px, so the words stay
 *  readable on a short window. */
const CUE_MIN_PX = 16;
/** ms the shut's tap waits for the pointer to come back (see `close`). */
const CLOSE_TAP_MS = 40;

/** The glyph at rest, in its own units: a paren, a gap, the arrow's
 *  box (the arrow is 13.5 x 27 in the middle of it), a gap, a paren. */
const GLYPH_H = 38;
const PAREN_W = 14;
const ARROW_W = 14;
const REST_GAP = 6;
const GLYPH_W = 2 * (PAREN_W + REST_GAP) + ARROW_W;
/** The parens' line: the arrow's shaft, with the hairline it is drawn
 *  with. */
const PAREN_STROKE = 4;

/** The words' size, units: capitals of 0.7em = 24, a touch under the
 *  arrow's 27. */
const WORD = 34;
/** A hairline drawn around the words. The site's Medium has stems of
 *  0.09em = 3.1 units at WORD; this brings them to 3.6, a touch under
 *  the arrow's shaft and the parens' line (4) — text matched stem for
 *  stem to a line looks heavier than the line. */
const WORD_STROKE = 0.5;
/** The air around the words, units: between them and the arrow's box,
 *  and between them and their paren. */
const WORD_GAP = 8;
const WORD_PAD = 8;
/** How far past the glyph's edges the pointer counts as on it, in glyph
 *  units — about a fifth of the glyph's width each side — and never
 *  under HIT_MIN_PX, so the small mark still catches the pointer and
 *  makes a tap target. */
const HIT = 12;
const HIT_MIN_PX = 14;
/** The exit's two cuts, ms — the slot stays mounted this long after the
 *  cue is told to go (see .cue-exit). */
const CUE_EXIT_MS = 240;
/** The open's and the close's three cuts, ms (see .cue-open, .cue-close). */
const CUE_CLOSE_MS = 300;

const CUE_CSS = `
/* The scroll cue's slot on each screen. The pop entrance plays on the
   element inside it, the parting inside that, the exit on the slot
   itself — each on its own element so no transform fights another.
   --u is one unit of the glyph's ${GLYPH_W} x ${GLYPH_H} box, so the words are laid
   out and weighted in the glyph's own units. --cue-size is the glyph's
   height (CUE_VH on the landing, never under CUE_MIN_PX; a bench sets
   its own), set on the slot by <Cue>. */
.cue { --cue-size: max(${CUE_VH}vh, ${CUE_MIN_PX}px); --u: calc(var(--cue-size) / ${GLYPH_H}); position: absolute; left: 50%; width: max-content; height: var(--cue-size); transform: translateX(-50%); }
.cue.is-down { bottom: 3.5vh; }
.cue.is-up { top: 3.5vh; }
.cue-pop { height: 100%; }
/* Leaving: two held poses — half gone and a step along its arrow, then
   gone. Plays while the cue is still mounted. */
.cue-exit { animation: cue-exit ${CUE_EXIT_MS}ms steps(1, end) both; }
@keyframes cue-exit { 0% { opacity: 1; transform: translateX(-50%); } 50% { opacity: .5; transform: translate(-50%, var(--cue-way, 6px)); } 100% { opacity: 0; transform: translate(-50%, calc(var(--cue-way, 6px) * 2)); } }
.cue.is-up { --cue-way: -6px; }
/* The glyph is a row — paren, arrow, the words' room, paren — as wide
   as what is in it, and the slot is centred on its own middle. So when
   the room opens the row grows both ways from the middle of the screen,
   as far as the words need, and nothing is measured. */
/* Set in the page's ink, the greeting's words' own. */
.cue-glyph { position: relative; display: flex; align-items: center; height: 100%; padding: 0; background: none; border: 0; color: #171717; }
/* The hit area: HIT units of the glyph's own past every edge, unseen, so
   the pointer parts it before it is quite on the glyph. Part of the
   button, so it opens, holds and clicks like the glyph itself. */
.cue-glyph::before { content: ""; position: absolute; inset: calc(-1 * max(var(--u) * ${HIT}, ${HIT_MIN_PX}px)); }
.cue-glyph svg { display: block; flex: none; height: 100%; overflow: visible; }
/* The arrow. The up cue's is the down cue's flipped, so
   its nudge and its jolts follow its way. */
.cue-arrow-box { width: calc(var(--u) * ${ARROW_W}); margin-left: calc(var(--u) * ${REST_GAP}); transform: var(--flip, none); }
.is-up .cue-arrow-box { --flip: scaleY(-1); }
/* The idle nudge: every 3s the arrow alone dips a step along its way
   and snaps back, in held poses; the parens hold still. Its steps, and
   the jolts' below, are px inside the arrow's viewBox — the glyph's own
   units — so a small glyph moves as little as it is. */
.cue-arrow { animation: cue-nudge 3s steps(1, end) infinite; }
@keyframes cue-nudge { 0%, 84% { transform: none; } 87.5% { transform: translateY(2px); } 91% { transform: translateY(3.5px); } 94% { transform: translateY(1px); } 100% { transform: none; } }
.cue-paren { width: calc(var(--u) * ${PAREN_W}); }
/* The near side — the paren before the arrow, and the arrow — and the
   far paren each step along their --way in the open's and the close's
   cuts. */
.cue-near { --way: -1; display: flex; flex: none; height: 100%; }
.cue-far { --way: 1; }
/* The words' room, between the arrow and the far paren: the rest gap
   wide while shut, the words lying unseen across it, and as wide as the
   words and their air (${WORD_GAP} units before, ${WORD_PAD} after) while open. */
.cue-room { display: flex; flex: none; align-items: center; width: calc(var(--u) * ${REST_GAP}); min-width: 0; }
.cue-open .cue-room { width: auto; }
/* Hover parts the parens, in held cuts 100ms apart. Opening, three:
   the room is there at once and each side jumps out to its place (5
   units past it, 2 short of it, rest), the words pop into it with
   the site's own pop entrance (sm-pop, from @portfolio/lab/motion: big,
   a hair small, rest), and the arrow takes the jolt — a step down its
   way, a step back past its place, rest. Closing, three: the arrow dips
   again with the words still there and the parens held; then the words
   are gone and the parens are shut past closed; then at rest. Nothing
   fades: each pose is there or not. The classes come from the cue's
   state so nothing plays at mount; the idle nudge gives way to the
   jolts. */
.cue-open .cue-near, .cue-open .cue-far { animation: cue-side-open ${CUE_CLOSE_MS}ms steps(1, end) both; }
.cue-open .cue-arrow { animation: cue-arrow-open ${CUE_CLOSE_MS}ms steps(1, end) both; }
/* The words pop in and then hold still. */
.cue-open .cue-label { animation: sm-pop calc(var(--sm-duration) * .8) steps(1, end) both; }
.cue-close .cue-near, .cue-close .cue-far { animation: cue-side-close ${CUE_CLOSE_MS}ms steps(1, end) both; }
.cue-close .cue-room { animation: cue-room-close ${CUE_CLOSE_MS}ms steps(1, end) both; }
.cue-close .cue-arrow { animation: cue-arrow-close ${CUE_CLOSE_MS}ms steps(1, end) both; }
.cue-close .cue-label { animation: cue-words-close ${CUE_CLOSE_MS}ms steps(1, end) both; }
@keyframes cue-side-open { 0% { transform: translateX(calc(var(--way) * var(--u) * 5)); } 33.3% { transform: translateX(calc(var(--way) * var(--u) * -2)); } 66.7%, 100% { transform: none; } }
@keyframes cue-arrow-open { 0% { transform: translateY(3px); } 33.3% { transform: translateY(-1px); } 66.7%, 100% { transform: none; } }
@keyframes cue-side-close { 0% { transform: none; } 33.3% { transform: translateX(calc(var(--way) * var(--u) * -2)); } 66.7%, 100% { transform: none; } }
@keyframes cue-room-close { 0% { width: auto; } 33.3%, 100% { width: calc(var(--u) * ${REST_GAP}); } }
@keyframes cue-arrow-close { 0% { transform: translateY(2px); } 33.3%, 100% { transform: none; } }
@keyframes cue-words-close { 0% { opacity: 1; } 33.3%, 100% { opacity: 0; } }
/* The words: one line, ${WORD} units, level with the arrow. Set in the
   site's Medium with a hairline around every letter (WORD_STROKE), so
   they carry the parens' weight. */
.cue-label { flex: none; margin: 0 calc(var(--u) * ${WORD_PAD}) 0 calc(var(--u) * ${WORD_GAP}); opacity: 0; pointer-events: none; white-space: nowrap; font-size: calc(var(--u) * ${WORD}); line-height: 1; letter-spacing: -.01em; -webkit-text-stroke: calc(var(--u) * ${WORD_STROKE}) currentColor; }
.cue-glyph:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; border-radius: 999px; }
@media (prefers-reduced-motion: reduce) {
  .cue-arrow { animation: none; }
  .cue-exit, .cue-open *, .cue-close * { animation-duration: 1ms; }
  .cue-open .cue-label { animation: sm-pop 1ms steps(1, end) both; }
}
`;

/** Julio's arrow, where his ring glyph had it: the middle of the
 *  ARROW_W x GLYPH_H box at ARROW_BOX. */
const ARROW =
  "M24.6436 36.0039C24.5367 35.9356 24.3904 35.9094 24.2744 35.8955C24.146 35.8801 23.9991 35.8747 23.8564 35.873C23.7129 35.8714 23.5662 35.8741 23.4395 35.876C23.3269 35.8776 23.2337 35.8776 23.165 35.876C23.1635 35.8756 23.1622 35.8752 23.1611 35.875C23.1411 35.8703 23.1202 35.8668 23.1016 35.8643C23.0637 35.8591 23.0167 35.8559 22.9658 35.8525C22.8632 35.8457 22.7264 35.8398 22.5684 35.8359C22.251 35.8281 21.8369 35.8249 21.417 35.8242C20.7942 35.8232 20.1476 35.8287 19.7832 35.8311C19.8276 34.8226 19.798 33.5895 19.7979 32.6211L19.7959 19.6816L19.7959 19.6807L19.7842 17.5029C19.784 17.3633 19.7899 17.206 19.7959 17.041C19.8018 16.8802 19.8072 16.7117 19.8008 16.5645L19.7939 16.4199L19.665 16.3535C19.6227 16.3317 19.5872 16.3133 19.5488 16.2979L19.5176 16.2031L19.4063 16.1602C19.3385 16.1343 19.2518 16.1236 19.1797 16.1172C19.0992 16.11 19.0028 16.1058 18.8984 16.1035C18.6894 16.099 18.4329 16.1016 18.1758 16.1055C17.9164 16.1093 17.6556 16.1148 17.4326 16.1152C17.2047 16.1157 17.0354 16.1114 16.9492 16.0996L16.9023 16.0928L16.8574 16.1035C16.8499 16.1053 16.8406 16.107 16.8174 16.1113C16.7982 16.1149 16.7708 16.1202 16.7422 16.1279C16.7008 16.1391 16.5791 16.1737 16.5078 16.2891L16.5068 16.29C16.482 16.3307 16.4743 16.3708 16.4736 16.374C16.4708 16.3871 16.4689 16.3994 16.4678 16.4082C16.4654 16.4266 16.4634 16.4475 16.4619 16.4687C16.4588 16.5122 16.4556 16.5711 16.4531 16.6426C16.4481 16.7866 16.4443 16.9917 16.4404 17.248C16.4326 17.7614 16.4269 18.487 16.4229 19.3564C16.4147 21.0955 16.4123 23.4145 16.4141 25.7744C16.4172 30.1231 16.4326 34.6129 16.4375 35.876L13.3652 35.874L13.3643 35.874C13.1662 35.8746 12.8206 35.8718 12.4893 35.875C12.161 35.8782 11.8168 35.8869 11.6133 35.917L11.4863 35.9365L11.4277 36.0508L11.4014 36.1016L11.3408 36.2187L11.4033 36.335C11.424 36.3734 11.4472 36.4171 11.4756 36.4561C11.5087 36.5016 11.5435 36.5348 11.5811 36.5664L11.584 36.5684L11.6035 36.584C13.6998 38.6797 15.7838 40.7886 17.8555 42.9092L18.0088 43.0664L18.1846 42.9346C18.555 42.6562 18.9294 42.2224 19.2256 41.9268C20.1146 41.0395 21.0005 40.1427 21.8857 39.2471C22.7693 38.3532 23.6532 37.4608 24.5391 36.5781C24.5567 36.5629 24.5707 36.5511 24.585 36.54C24.5967 36.531 24.6248 36.5096 24.6494 36.4844C24.723 36.4089 24.7431 36.3242 24.7549 36.2588L24.7842 36.0947L24.6436 36.0039Z";
const ARROW_BOX = `${18.06 - ARROW_W / 2} ${29.58 - GLYPH_H / 2} ${ARROW_W} ${GLYPH_H}`;
/** The paren before the arrow: half an ellipse, the glyph's height and
 *  PAREN_W wide to the outside of its line, open towards the arrow.
 *  The one after is its mirror. */
const PAREN = `M${PAREN_W} ${PAREN_STROKE / 2}A${PAREN_W - PAREN_STROKE / 2} ${(GLYPH_H - PAREN_STROKE) / 2} 0 0 0 ${PAREN_W} ${GLYPH_H - PAREN_STROKE / 2}`;

function Paren({ side }: { side: "before" | "after" }) {
  return (
    <svg
      className={side === "after" ? "cue-paren cue-far" : "cue-paren"}
      viewBox={`0 0 ${PAREN_W} ${GLYPH_H}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={PAREN_STROKE}
      aria-hidden="true"
    >
      <path
        d={PAREN}
        transform={
          side === "after" ? `translate(${PAREN_W}) scale(-1 1)` : undefined
        }
      />
    </svg>
  );
}

function Arrow() {
  return (
    <svg
      className="cue-arrow-box"
      viewBox={ARROW_BOX}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={0.5}
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
  size = CUE_VH,
  onClick,
}: {
  dir: "down" | "up";
  shown: boolean;
  /** ms before the pop's first cut, at each mount. */
  delay: number;
  label: string;
  /** The words the parted parens hold, after the arrow. */
  text: string;
  /** The glyph's height, vh (never under CUE_MIN_PX) — CUE_VH on the
   *  landing; the benches are big. */
  size?: number;
  onClick: () => void;
}) {
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
    const t = window.setTimeout(() => setLeaving(false), CUE_EXIT_MS);
    return () => window.clearTimeout(t);
  }, [leaving]);
  useEffect(() => {
    if (parens !== "closing") return;
    // Only parens still closing are shut: the pointer can come back and
    // re-open it before this effect's cleanup clears the timer.
    const t = window.setTimeout(
      () => setParens((r) => (r === "closing" ? "closed" : r)),
      CUE_CLOSE_MS,
    );
    return () => window.clearTimeout(t);
  }, [parens]);
  // The taps read the parens through a ref kept in step at once, not the
  // rendered state: a leave and a return inside one frame both fire
  // before React renders between them, and the return has to know the
  // parens shut. Nothing plays inside an updater.
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
        {
          "--cue-size": `max(${size}vh, ${CUE_MIN_PX}px)`,
        } as React.CSSProperties
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
            parens === "open" && "cue-open",
            parens === "closing" && "cue-close",
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
            <Paren side="before" />
            <Arrow />
          </span>
          <span className="cue-room">
            <span className="cue-label font-medium">{text}</span>
          </span>
          <Paren side="after" />
        </button>
      </Enter>
    </div>
  );
}

/** The cue's stylesheet, once per page. */
export function CueStyles() {
  return <style>{CUE_CSS}</style>;
}
