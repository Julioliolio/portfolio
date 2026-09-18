"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BOIL_SEEDS, BoilFilter, useBoilTuning } from "./boil";
import { Enter, useMotionTuning } from "./motion";
import { play } from "./sound";

/**
 * The landing's scroll cue: Julio's glyph — an open ring with an arrow
 * through it — at the foot of the first screen and, flipped, the head
 * of the second. It nudges its arrow while it waits; under the pointer
 * the ring opens above the arrow in held cuts and the words ("View
 * projects", "Back up") pop into the room with the site's pop entrance,
 * settle, and then boil — their outlines wobbling through held frames
 * for as long as the ring is open; leaving closes it the same
 * way. The pointer rests on the arrow, so the site's cursor never
 * covers the words. The ring taps as it opens (the site's hover sound,
 * see sound.tsx) and taps softer as it shuts; the click's knock is the
 * caller's. See the CSS below for every beat.
 *
 * The boil's numbers are the boil tuning (boil.tsx), shared with the
 * hero's words; /lab/boil is its bench, and the cue reads it live. The
 * rest of the cue's numbers are the constants below.
 */

/** The glyph's height on the landing, vh. */
export const CUE_VH = 6;
/** ms the shut's tap waits for the pointer to come back (see `close`). */
const CLOSE_TAP_MS = 40;

/** The words' size, units per line. */
const WORD = 20;
/** A hairline drawn around the words. The site's Medium has stems of
 *  0.09em = 1.8 units at WORD; this brings them to 2.3, which reads as
 *  the ring's weight — text matched stem for stem to a line looks
 *  heavier than the line (tried 2.8 on 2026-09-15: too thick; 2.1: a
 *  touch light). */
const WORD_STROKE = 0.5;
/** Two lines of WORD with 8 units of air above and below: the room the
 *  words need without the arcs crowding them. */
const ROOM = 2 * WORD + 16;
/** How far past the glyph's edges the pointer counts as on it, in glyph
 *  units — about a third of the ring's width each side. */
const HIT = 12;
/** Where the top arc ends, in viewBox y: the arrow's head. */
const TOP_END = 16.2;
/** How far the top arc lifts: the room sits on the arrow's head, the
 *  arrow staying put beneath it — the pointer rests on the arrow, and
 *  the site's cursor hangs down from its fingertip, so the words above
 *  are never under the hand. */
const OPEN = ROOM;
/** The exit's two cuts, ms — the slot stays mounted this long after the
 *  cue is told to go (see .cue-exit). */
const CUE_EXIT_MS = 240;
/** The open's and the close's three cuts, ms (see .cue-open, .cue-close). */
const CUE_CLOSE_MS = 300;

const CUE_CSS = `
/* The scroll cue's slot on each screen. The pop entrance plays on the
   element inside it, the flip and the open inside that, the exit on the
   slot itself — each on its own element so no transform fights another.
   --u is one unit of the glyph's 37 x 59 viewBox, so the words are laid
   out and weighted in the glyph's own units. --cue-size is the glyph's
   height (CUE_VH on the landing; a bench sets its own); --boil-wait is
   the tuning's and --boil-filter the cue's own boil, all set on the
   slot by <Cue>. */
.cue { --cue-size: ${CUE_VH}vh; --u: calc(var(--cue-size) / 59); position: absolute; left: 50%; height: var(--cue-size); aspect-ratio: 37 / 59; transform: translateX(-50%); }
.cue.is-down { bottom: 3.5vh; }
.cue.is-up { top: 3.5vh; }
.cue-pop { width: 100%; height: 100%; }
/* Leaving: two held poses — half gone and a step along its arrow, then
   gone. Plays while the cue is still mounted. */
.cue-exit { animation: cue-exit ${CUE_EXIT_MS}ms steps(1, end) both; }
@keyframes cue-exit { 0% { opacity: 1; transform: translateX(-50%); } 50% { opacity: .5; transform: translate(-50%, var(--cue-way, 6px)); } 100% { opacity: 0; transform: translate(-50%, calc(var(--cue-way, 6px) * 2)); } }
.cue.is-up { --cue-way: -6px; }
.cue-glyph { position: relative; display: block; width: 100%; height: 100%; padding: 0; background: none; border: 0; color: #2562ff; }
/* The hit area: HIT units of the glyph's own past every edge, unseen, so
   the pointer opens it before it is quite on the ring. Part of the
   button, so it opens, holds and clicks like the ring itself. */
.cue-glyph::before { content: ""; position: absolute; inset: calc(var(--u) * -${HIT}); }
/* The up cue is the down cue flipped, so the arrow's nudge and the
   ring's open both follow its arrow; the words sit outside the flip. */
.cue-glyph svg { display: block; width: 100%; height: 100%; overflow: visible; transform: var(--flip, none); }
.is-up .cue-glyph svg { --flip: scale(-1); }
/* The idle nudge: every 3s the arrow alone dips a step along its way
   and snaps back, in held poses; the ring holds still. */
.cue-arrow { animation: cue-nudge 3s steps(1, end) infinite; }
@keyframes cue-nudge { 0%, 84% { transform: none; } 87.5% { transform: translateY(2px); } 91% { transform: translateY(3.5px); } 94% { transform: translateY(1px); } 100% { transform: none; } }
/* Hover opens the ring, in held cuts 100ms apart. Opening, three: the
   top arc jumps up ${OPEN} units (overshoot, undershoot, rest) to make
   the room above the arrow, the words pop into it with the site's own
   pop entrance (sm-pop, from @portfolio/lab/motion: big, a hair small,
   rest — on its beat, a cut behind the arc), and the arrow takes the
   jolt — a step down its way, a step back past its place, rest. Closing, three: the arrow dips again with the
   words still there and the arc held; then the words are gone and the
   arc is shut past closed; then at rest. Nothing fades: each pose is
   there or not. The classes come from the cue's state so nothing plays
   at mount; the idle nudge gives way to the jolts. */
.cue-open .cue-ring-top { animation: cue-ring-open ${CUE_CLOSE_MS}ms steps(1, end) both; }
.cue-open .cue-arrow { animation: cue-arrow-open ${CUE_CLOSE_MS}ms steps(1, end) both; }
/* Once the words have popped and settled — a boil-wait after the pop —
   they boil: the label puts on the cue's boil filter (boil.tsx), whose
   noise then cycles for as long as the ring is open, the way a
   claymation hold never quite sits still. */
.cue-open .cue-label { animation: sm-pop calc(var(--sm-duration) * .8) steps(1, end) both, cue-boil-on 1ms steps(1, end) forwards calc(var(--sm-duration) * .8 + var(--boil-wait)); }
@keyframes cue-boil-on { 0%, 100% { filter: var(--boil-filter); } }
.cue-close .cue-ring-top { animation: cue-ring-close ${CUE_CLOSE_MS}ms steps(1, end) both; }
.cue-close .cue-arrow { animation: cue-arrow-close ${CUE_CLOSE_MS}ms steps(1, end) both; }
.cue-close .cue-label { animation: cue-words-close ${CUE_CLOSE_MS}ms steps(1, end) both; }
@keyframes cue-ring-open { 0% { transform: translateY(${-(OPEN + 5)}px); } 33.3% { transform: translateY(${-(OPEN - 2)}px); } 66.7%, 100% { transform: translateY(${-OPEN}px); } }
@keyframes cue-arrow-open { 0% { transform: translateY(3px); } 33.3% { transform: translateY(-1px); } 66.7%, 100% { transform: none; } }
@keyframes cue-ring-close { 0% { transform: translateY(${-OPEN}px); } 33.3% { transform: translateY(2px); } 66.7%, 100% { transform: translateY(0); } }
@keyframes cue-arrow-close { 0% { transform: translateY(2px); } 33.3%, 100% { transform: none; } }
@keyframes cue-words-close { 0% { opacity: 1; } 33.3%, 100% { opacity: 0; } }
/* The words: two lines, ${WORD} units each, in the room the top arc
   makes above the arrow (whose head is ${59 - TOP_END} units up from the
   foot). Set in the site's Medium with a hairline around every letter
   (WORD_STROKE), so they carry the ring's weight. On the up cue the
   room opens downward, so they hang from the top. They are part of the
   button: the pointer can climb onto them and the ring stays open. They
   are centred with the translate property, not transform, so the pop's
   scale composes with it. */
.cue-label { position: absolute; left: 50%; width: max-content; height: calc(var(--u) * ${ROOM}); display: grid; place-items: center; translate: -50% 0; opacity: 0; font-size: calc(var(--u) * ${WORD}); line-height: 1; letter-spacing: -.01em; text-align: center; -webkit-text-stroke: calc(var(--u) * ${WORD_STROKE}) currentColor; }
.is-down .cue-label { bottom: calc(var(--u) * ${59 - TOP_END}); }
.is-up .cue-label { top: calc(var(--u) * ${59 - TOP_END}); }
.cue-glyph:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; border-radius: 999px; }
@media (prefers-reduced-motion: reduce) {
  .cue-arrow { animation: none; }
  .cue-exit, .cue-open *, .cue-close * { animation-duration: 1ms; }
  .cue-open .cue-label { animation: sm-pop 1ms steps(1, end) both; }
}
`;

/** Julio's scroll glyph: an open ring with an arrow through it, in its
 *  three parts so the top arc can lift off and the arrow can nudge and
 *  give way on their own. */
const TOP_ARC =
  "M18.7979 0.258789C18.3768 0.258816 17.6836 0.229711 17.1074 0.277344C16.5582 0.322764 15.8077 0.362025 15.248 0.455078C11.0247 1.1576 6.67651 3.33307 3.83984 6.63086C1.69198 9.12784 0.962362 11.4231 0.388672 14.5527L0.368165 14.6318L0.367188 14.6348C0.247787 15.132 0.261362 15.4619 0.25586 15.9551L0.25293 16.2002L0.498047 16.208C1.05582 16.2257 2.03907 16.2404 2.60742 16.1914L2.60742 16.1924L3.2334 16.1914L3.46484 16.1914L3.48242 15.9609C4.0596 8.57521 11.2778 4.16755 18.1328 4.25488C25.1281 4.34406 31.8308 8.61166 32.5361 15.9678L32.5576 16.1914L32.7822 16.1943C33.6637 16.2038 34.5453 16.2073 35.4268 16.2061L35.6699 16.2061L35.6768 15.9629C35.7061 14.9351 35.5023 14.0175 35.3232 13.0811C33.9802 6.05836 27.313 1.56597 20.7588 0.457031C20.4284 0.401131 20.0995 0.372594 19.7793 0.347656C19.456 0.322482 19.1437 0.301219 18.8301 0.260742L18.8145 0.258789L18.7979 0.258789Z";
const ARROW =
  "M24.6436 36.0039C24.5367 35.9356 24.3904 35.9094 24.2744 35.8955C24.146 35.8801 23.9991 35.8747 23.8564 35.873C23.7129 35.8714 23.5662 35.8741 23.4395 35.876C23.3269 35.8776 23.2337 35.8776 23.165 35.876C23.1635 35.8756 23.1622 35.8752 23.1611 35.875C23.1411 35.8703 23.1202 35.8668 23.1016 35.8643C23.0637 35.8591 23.0167 35.8559 22.9658 35.8525C22.8632 35.8457 22.7264 35.8398 22.5684 35.8359C22.251 35.8281 21.8369 35.8249 21.417 35.8242C20.7942 35.8232 20.1476 35.8287 19.7832 35.8311C19.8276 34.8226 19.798 33.5895 19.7979 32.6211L19.7959 19.6816L19.7959 19.6807L19.7842 17.5029C19.784 17.3633 19.7899 17.206 19.7959 17.041C19.8018 16.8802 19.8072 16.7117 19.8008 16.5645L19.7939 16.4199L19.665 16.3535C19.6227 16.3317 19.5872 16.3133 19.5488 16.2979L19.5176 16.2031L19.4063 16.1602C19.3385 16.1343 19.2518 16.1236 19.1797 16.1172C19.0992 16.11 19.0028 16.1058 18.8984 16.1035C18.6894 16.099 18.4329 16.1016 18.1758 16.1055C17.9164 16.1093 17.6556 16.1148 17.4326 16.1152C17.2047 16.1157 17.0354 16.1114 16.9492 16.0996L16.9023 16.0928L16.8574 16.1035C16.8499 16.1053 16.8406 16.107 16.8174 16.1113C16.7982 16.1149 16.7708 16.1202 16.7422 16.1279C16.7008 16.1391 16.5791 16.1737 16.5078 16.2891L16.5068 16.29C16.482 16.3307 16.4743 16.3708 16.4736 16.374C16.4708 16.3871 16.4689 16.3994 16.4678 16.4082C16.4654 16.4266 16.4634 16.4475 16.4619 16.4687C16.4588 16.5122 16.4556 16.5711 16.4531 16.6426C16.4481 16.7866 16.4443 16.9917 16.4404 17.248C16.4326 17.7614 16.4269 18.487 16.4229 19.3564C16.4147 21.0955 16.4123 23.4145 16.4141 25.7744C16.4172 30.1231 16.4326 34.6129 16.4375 35.876L13.3652 35.874L13.3643 35.874C13.1662 35.8746 12.8206 35.8718 12.4893 35.875C12.161 35.8782 11.8168 35.8869 11.6133 35.917L11.4863 35.9365L11.4277 36.0508L11.4014 36.1016L11.3408 36.2187L11.4033 36.335C11.424 36.3734 11.4472 36.4171 11.4756 36.4561C11.5087 36.5016 11.5435 36.5348 11.5811 36.5664L11.584 36.5684L11.6035 36.584C13.6998 38.6797 15.7838 40.7886 17.8555 42.9092L18.0088 43.0664L18.1846 42.9346C18.555 42.6562 18.9294 42.2224 19.2256 41.9268C20.1146 41.0395 21.0005 40.1427 21.8857 39.2471C22.7693 38.3532 23.6532 37.4608 24.5391 36.5781C24.5567 36.5629 24.5707 36.5511 24.585 36.54C24.5967 36.531 24.6248 36.5096 24.6494 36.4844C24.723 36.4089 24.7431 36.3242 24.7549 36.2588L24.7842 36.0947L24.6436 36.0039Z";
const BOTTOM_ARC =
  "M35.5166 42.7813C34.5555 42.7399 33.7934 42.7663 32.873 42.7627L32.6553 42.7617L32.625 42.9785C32.5496 43.5233 32.4977 44.0834 32.3877 44.5879C31.6042 48.1763 29.1944 50.9171 26.1152 52.6475C23.0339 54.3789 19.2963 55.0892 15.8936 54.6201C13.197 54.2482 10.5346 53.2069 8.36426 51.5508C5.57058 49.4188 3.77222 46.5591 3.5459 43.0039L3.53125 42.7705L3.29688 42.7695L0.572266 42.7598L0.306641 42.7588L0.321289 43.0234C0.366245 43.849 0.496122 45.2659 0.759766 46.0879L0.760742 46.0879C1.8666 50.5905 4.30924 53.5841 8.20703 55.9336C12.4158 58.4706 17.6362 59.4568 22.4199 58.2158C26.9665 57.0362 31.4221 54.285 33.835 50.0908C34.9445 48.1622 35.7217 45.269 35.7559 43.0342L35.7598 42.791L35.5166 42.7813Z";

function Glyph() {
  return (
    <svg
      viewBox="0 0 37 59"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={0.5}
      aria-hidden="true"
    >
      <path className="cue-ring-top" d={TOP_ARC} />
      <path className="cue-arrow" d={ARROW} />
      <path className="cue-ring-bottom" d={BOTTOM_ARC} />
    </svg>
  );
}

/**
 * The scroll cue in its slot. Mounts with the site's pop entrance after
 * `delay`, nudges its arrow while it waits, opens its ring around
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
  /** The words the open ring holds, one line per string. */
  text: [string, string];
  /** The glyph's height, vh — CUE_VH on the landing; the bench is big. */
  size?: number;
  onClick: () => void;
}) {
  const tuning = useBoilTuning();
  const motion = useMotionTuning();
  const vh = useViewportHeight();
  const boilId = useId();
  // Derived during render: a flip to hidden starts the exit; a flip to
  // shown re-keys the pop so it replays from the first pose.
  const [prevShown, setPrevShown] = useState(shown);
  const [leaving, setLeaving] = useState(false);
  const [shows, setShows] = useState(shown ? 1 : 0);
  // The ring: closed, open under the pointer, or on its way closed (the
  // close cuts play, then the classes come off). Touch has no hover, so
  // a tap only clicks. A cue that leaves is closed on the way out.
  const [ring, setRing] = useState<"closed" | "open" | "closing">("closed");
  if (shown !== prevShown) {
    setPrevShown(shown);
    setLeaving(!shown);
    if (shown) setShows((n) => n + 1);
    else setRing("closed");
  }
  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => setLeaving(false), CUE_EXIT_MS);
    return () => window.clearTimeout(t);
  }, [leaving]);
  useEffect(() => {
    if (ring !== "closing") return;
    // Only a ring still closing is shut: the pointer can come back and
    // re-open it before this effect's cleanup clears the timer.
    const t = window.setTimeout(
      () => setRing((r) => (r === "closing" ? "closed" : r)),
      CUE_CLOSE_MS,
    );
    return () => window.clearTimeout(t);
  }, [ring]);
  // The taps read the ring through a ref kept in step at once, not the
  // rendered state: a leave and a return inside one frame both fire
  // before React renders between them, and the return has to know the
  // ring shut. Nothing plays inside an updater.
  const ringRef = useRef(ring);
  useEffect(() => {
    ringRef.current = ring;
  }, [ring]);
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
    if (ringRef.current !== "open") play("tap", 1, { at: "cue" });
    ringRef.current = "open";
    setRing("open");
  };
  const close = () => {
    if (ringRef.current === "open") {
      ringRef.current = "closing";
      closeTap.current = window.setTimeout(() => {
        closeTap.current = null;
        play("tap", 0.5, { at: "cue" });
      }, CLOSE_TAP_MS);
    }
    setRing((r) => (r === "open" ? "closing" : r));
  };

  if (!shown && !leaving) return null;
  return (
    <div
      className={["cue", `is-${dir}`, shown ? "" : "cue-exit"]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--cue-size": `${size}vh`,
          "--boil-wait": `${tuning.boilWait}ms`,
          "--boil-filter": `url(#${boilId})`,
        } as React.CSSProperties
      }
    >
      {/* The cue's boil, for its words at the glyph's unit: on once the
          ring is open and the words have popped and settled. */}
      <svg
        width={0}
        height={0}
        aria-hidden="true"
        style={{ position: "absolute" }}
      >
        <BoilFilter
          id={boilId}
          em={(WORD * (size / 100) * vh) / 59}
          seeds={BOIL_SEEDS}
          on={ring === "open"}
          delay={motion.duration * 800 + tuning.boilWait}
        />
      </svg>
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
            ring === "open" && "cue-open",
            ring === "closing" && "cue-close",
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
          <Glyph />
          <span className="cue-label font-medium" aria-hidden="true">
            {text[0]}
            <br />
            {text[1]}
          </span>
        </button>
      </Enter>
    </div>
  );
}

/** The cue's stylesheet, once per page. */
export function CueStyles() {
  return <style>{CUE_CSS}</style>;
}

/** The viewport's height, px, re-read on resize — the cue's size and so
 *  its boil's are a share of it; the landing's mockup frame (982) until
 *  measured. */
function useViewportHeight() {
  const [h, setH] = useState(982);
  useEffect(() => {
    const read = () => setH(innerHeight);
    read();
    addEventListener("resize", read);
    return () => removeEventListener("resize", read);
  }, []);
  return h;
}
