"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { BOIL_SEEDS, BoilFilter } from "./boil";
import { Enter, keyframes, useMotionTuning, type MotionTuning } from "./motion";
import { getSoundTuning, play, useBed } from "./sound";
import { createTuningStore } from "./tuning-store";

/**
 * The greeting's words, and the pointer's wave through them.
 *
 * The landing says "Hola! I’m — [the sign] — A Product Designer Finding
 * Charm In The Unexpected" word by word (see apps/web .../landing). Each
 * word is a run of letters, each letter its own cell, so a letter can
 * move on its own while nothing reflows: the glyph never changes cut.
 *
 * The wave is the pointer's. Every letter on its line within `reach`
 * of it — across a gap between words, the near letters of both — stamps
 * in place, at a share falling off with distance,
 * with the site's stamp (motion.tsx, kind "stamp": in big and a little
 * tilted from up-left; pressed past size down-right; a hair over; rest,
 * on the motion tuning's cuts), kept to a share of the entrance's
 * amplitude — `lift` of its displacement, `grow` of its size change,
 * `swing` of its tilt — on the motion's clock scaled by `beat`, and
 * comes out of it tilted, with a hairline stroked around it. Once the
 * pointer has passed, the letter stamps back in two held cuts, `back`
 * of the stamp's length, to its plain self.
 *
 * A lit letter boils: while it is on or held its glyph wears a boil
 * filter (boil.tsx) whose noise cycles for as long as the speech is
 * under the pointer, so the tilted, hairlined letters wobble in place
 * the way the scroll cue's words do — the boil tuning's numbers, sized
 * to the speech's em. Four filters, their runs of seeds out of step,
 * dealt to the letters in turn (see BASE_CSS), so neighbours never bend
 * alike. Off the pointer every letter is plain.
 *
 * Every letter sounds as it stamps (sound.tsx, "letter"): the moment
 * its share goes from nothing to something it is struck. Which note is
 * the sound module's call — a melody that walks a pentatonic scale a
 * step at a time, the company harmonizing with it — so the same word
 * never plays the same way twice and nothing clashes. The main note is
 * the pointer's: as it comes onto a letter's
 * cell that letter is struck at full, whether or not the reach had
 * already lit it, and no two main notes come closer than the sound
 * tuning's gap. Every other letter that lights — the neighbours in the
 * reach, and the letters a fast sweep crosses inside the gap — is
 * company: the same note at the tuning's company level, by its share,
 * ringing shorter. A move that lights several strikes them nearest
 * first, a few ms apart, so it reads as a strum, not a chord. A letter
 * that stays lit is quiet; it sounds again as company only once the
 * reach has left it and come back, and as the main note only once the
 * pointer has.
 *
 * Every number of that is a `GreetingTuning` knob; /lab/greeting is
 * its bench, and the store is a tuning store like the motion one:
 * values are kept in this browser until Reset, and <GreetingStyles>
 * regenerates the stylesheet on every change, so the bench moves the
 * landing too. Lock a feel in by pasting the bench's values into
 * GREETING_DEFAULTS.
 */

/** The greeting, as said: the words before the sign, and the line after
 *  it, broken as the mockup breaks it. */
export const GREETING_HELLO: readonly (readonly string[])[] = [
  ["Hola!", "I’m"],
];
export const GREETING_LINE: readonly (readonly string[])[] = [
  ["A", "Product", "Designer"],
  ["Finding", "Charm", "In"],
  ["The", "Unexpected"],
];

export type GreetingTuning = {
  /** How far along its line from the pointer a letter stamps, em of the
   *  size, measured to the letter's cell — across the gaps between
   *  words, never to another line. */
  reach: number;
  /** A letter's share falls to this for every letter-width it is from
   *  the pointer. */
  falloff: number;
  /** The held pose's lean, deg (neighbours less, by their share). */
  tilt: number;
  /** How far each letter's own lean strays from `tilt`: 0 and every
   *  letter leans the same way by the same amount; 1 and each leans
   *  anywhere from `tilt` one way to `tilt` the other, set once per
   *  letter (see Word's `stray`). */
  scatter: number;
  /** The hairline stroked around a held letter, em of its size. */
  hair: number;
  /** The hover's clock: the stamp's length as a share of the motion
   *  tuning's beat, and the way back's as a share of the stamp. */
  beat: number;
  back: number;
  /** How much of the entrance stamp a letter under the pointer keeps:
   *  `lift` of its displacement, `grow` of its size change, `swing` of
   *  its tilt either way. */
  lift: number;
  grow: number;
  swing: number;
  /** How far above and below the glyph a letter's cell reaches, em:
   *  the hover catches a pointer that far off the line. */
  catch: number;
  /** The step a letter's share moves in, 0..1: coarser and the held
   *  letters change in fewer, bigger jumps as the pointer moves. */
  quantum: number;
};

// Julio's numbers off the bench, 2026-09-17: a big lean, spread a
// little per letter, shared in full by every neighbour out to the edge
// of a wider reach (wider again on 2026-09-18: 1.4 to 2); a bigger jump
// in and more of the stamp's tilt either way; a thicker hairline.
const GREETING_DEFAULTS: Readonly<GreetingTuning> = Object.freeze({
  reach: 2,
  falloff: 1,
  tilt: 15,
  scatter: 0.6,
  hair: 0.03,
  beat: 1,
  back: 0.5,
  lift: 0.5,
  grow: 0.3,
  swing: 0.49,
  catch: 0.12,
  quantum: 0.1,
});

// ------------------------------------------------------------- the store

const store = createTuningStore("greeting-tuning", GREETING_DEFAULTS);

/** Lays `patch` over the current values and tells every subscriber. */
export const setGreetingTuning = store.set;
export const resetGreetingTuning = store.reset;
/** The live tuning, re-rendering the caller on every change. */
export const useGreetingTuning = store.useTuning;

// -------------------------------------------------------- the stylesheet

const n = (v: number, d = 3) => Number(v.toFixed(d)).toString();

/** The static part: the cells, their reach and their states. */
const BASE_CSS = `
.greeting-line { display: block; }
.greeting-word { display: inline-block; }
.greeting-word + .greeting-word { margin-left: .26em; }
.greeting-word-in { display: inline-block; }
/* Each letter is a cell around a glyph. The cell's hit area reaches
   above and below the glyph (padding the margin takes back, by the
   tuning's catch), so a sweep along a line, or a little off it, catches
   every letter; the glyph inside it is what stamps and tilts. A letter
   is on while its stamp plays, then held: the same
   pose, set statically, so the browser paints the tilted glyph in
   place instead of resampling a layer it keeps for the animation —
   which is what made held letters soft. The classes come from the
   letter's state, so nothing plays at mount; --dip is the letter's
   share of the stamp's amplitude and of the tilt — 1 under the pointer,
   less out toward the edge of the reach (see Speech) — and --stray its
   own number in -1..1, set once per letter, that the tuning's scatter
   turns into --way, its lean as a share of the tilt, so no two lean
   quite alike. */
.greeting-letter { position: relative; display: inline-block; --dip: 1; }
.greeting-glyph { display: inline-block; transform-origin: 50% 50%; animation-fill-mode: both; animation-timing-function: steps(1, end); }
/* The boil, and with it the hairline: a lit letter's cell wears one of
   the speech's four filters (--boil-1 to --boil-4, set on the speech),
   dealt round by the letter's place in its word. The cell, not the
   glyph: the glyph inside is already tilted when the cell is drawn, so
   the shove resamples it once, and the filter draws the hairline as a
   thickening of the drawn glyph — a text-stroke would sit on the path
   while the fill sits on a subpixel grid, and the two would part along
   an edge (see BoilFilter). */
.greeting-letter:nth-child(4n+1) { --boil-filter: var(--boil-1); }
.greeting-letter:nth-child(4n+2) { --boil-filter: var(--boil-2); }
.greeting-letter:nth-child(4n+3) { --boil-filter: var(--boil-3); }
.greeting-letter:nth-child(4n) { --boil-filter: var(--boil-4); }
.greeting-letter-on, .greeting-letter-held { filter: var(--boil-filter, none); }
.greeting-letter-on .greeting-glyph { animation-name: greeting-letter-stamp; }
.greeting-letter-off .greeting-glyph { animation-name: greeting-letter-back; }
@media (prefers-reduced-motion: reduce) {
  .greeting-glyph { animation-delay: 0ms; animation-duration: 1ms; }
}
`;

/**
 * The generated part, from both tunings: the stamp's poses — the
 * motion tuning's "stamp" (see motion.tsx's poses), on its clock scaled
 * by `beat` and at its cuts — every displacement at `lift`, tilt at
 * `swing` and size change at `grow`, all scaled by the letter's --dip;
 * each letter's lean from its --stray and `scatter`; and the cell's
 * reach off the line. The hairline is the boil filter's (see BASE_CSS).
 */
function greetingCss(m: MotionTuning, g: GreetingTuning): string {
  const d = m.distance;
  const over = m.overshoot - 1;
  const { lift, grow, swing: sw } = g;
  const dip = (v: number, unit: string) => `calc(${n(v)}${unit} * var(--dip))`;
  const pose = (x: number, y: number, r: number, scale: number) =>
    `transform: translate(${dip(x * lift, "px")}, ${dip(y * lift, "px")}) rotate(calc(${n(r * sw)}deg * var(--dip) - ${n(g.tilt)}deg * var(--way) * var(--dip))) scale(calc(1 + ${dip((scale - 1) * grow, "")}));`;
  const rest = pose(0, 0, 0, 1);
  const stamp = [
    pose(-d * 0.17, -d * 0.25, -m.tilt * 0.3, 1 / m.startScale),
    pose(d * 0.04, d * 0.06, m.tilt * 0.15, 1 - over * 0.6),
    pose(-d * 0.02, -d * 0.02, -m.tilt * 0.06, 1 + over * 0.25),
    pose(0, 0, 0, 1 - over * 0.2),
    rest,
  ];
  const stampMs = m.duration * 1000 * g.beat;
  return `${BASE_CSS}
.greeting-letter { --way: calc(${n(1 - g.scatter)} + ${n(g.scatter)} * var(--stray, 0)); padding: ${n(g.catch)}em 0; margin: -${n(g.catch)}em 0; }
.greeting-letter-held .greeting-glyph { ${rest} }
.greeting-letter-on .greeting-glyph { animation-duration: ${n(stampMs, 0)}ms; }
.greeting-letter-off .greeting-glyph { animation-duration: ${n(stampMs * g.back, 0)}ms; }
${keyframes("greeting-letter-stamp", stamp, m.cuts)}
@keyframes greeting-letter-back { 0% { transform: scale(calc(1 - ${dip(over * 0.5 * grow, "")})); } 50%, 100% { transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .greeting-letter-on .greeting-glyph, .greeting-letter-off .greeting-glyph { animation-duration: 1ms; }
}
`;
}

/**
 * Keeps the greeting's stylesheet in the document, regenerated on every
 * change of either tuning. Mount once wherever the words are shown;
 * stored bench values land right after hydration.
 */
export function GreetingStyles() {
  const m = useMotionTuning();
  const g = useGreetingTuning();
  return <style data-greeting="">{greetingCss(m, g)}</style>;
}

// ------------------------------------------------------------- the words

/**
 * One letter. Within the pointer's reach (`dip` > 0, its share of the
 * stamp) it stamps and holds; once the reach has moved off it stamps
 * back, staying in the off class until the way back has played.
 */
function Letter({
  ch,
  dip,
  stray,
}: {
  ch: string;
  dip: number;
  /** Its own number in -1..1, for its lean — see Word. */
  stray: number;
}) {
  const [pose, setPose] = useState<"rest" | "on" | "held" | "off">("rest");
  // Derived during render: the reach arriving starts the stamp, its
  // leaving starts the way back.
  const [wasLit, setWasLit] = useState(dip > 0);
  if (dip > 0 !== wasLit) {
    setWasLit(dip > 0);
    setPose(dip > 0 ? "on" : pose === "on" || pose === "held" ? "off" : pose);
  }
  return (
    <span
      className={[
        "greeting-letter",
        pose === "on" && "greeting-letter-on",
        pose === "held" && "greeting-letter-held",
        pose === "off" && "greeting-letter-off",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--dip": dip || 1, "--stray": n(stray) } as CSSProperties}
    >
      <span
        className="greeting-glyph"
        onAnimationEnd={(e) => {
          if (e.animationName === "greeting-letter-stamp")
            setPose((p) => (p === "on" ? "held" : p));
          if (e.animationName === "greeting-letter-back")
            setPose((p) => (p === "off" ? "rest" : p));
        }}
      >
        {ch}
      </span>
    </span>
  );
}

/** A letter's own number in -1..1, fixed by what and where it is, so
 *  the same word always leans the same way and the server agrees. */
function stray(ch: string, i: number) {
  const seed = ((i + 1) * 9301 + (ch.codePointAt(0) ?? 0) * 49297) % 233280;
  return (seed / 233280) * 2 - 1;
}

/**
 * One word, a run of letters, each with the share the speech gives it
 * (`dips`, from the word's first letter's number in the speech).
 */
function Word({
  text,
  first,
  dips,
}: {
  text: string;
  first: number;
  dips: readonly number[];
}) {
  return (
    <span className="greeting-word-in">
      {Array.from(text).map((ch, i) => (
        <Letter
          key={i}
          ch={ch}
          dip={dips[first + i] ?? 0}
          stray={stray(ch, i)}
        />
      ))}
    </span>
  );
}

/** The speech's boil fields, by number: four filters, each a run of the
 *  seeds started a quarter round on from the last. */
const BOIL_FIELDS = [0, 1, 2, 3] as const;

/** Seconds between the strikes of letters lit by one move. */
const STRUM = 0.014;

/** ms the bed keeps going after the pointer has left a speech. */
const BED_LINGER = 1500;

/**
 * Lines of words said one after another: word i stamps in `base + i *
 * step` ms after mount, the count running on across the lines. Re-mount
 * (a changed key) to say it again. `className` is the caller's layout.
 *
 * The speech is where the pointer's reach is measured: on every move
 * over it, each letter's cell is read and the letter given its share —
 * full when the pointer is on the cell, falling by `falloff` for every
 * letter-width of distance along the line to the cell's nearest side,
 * nothing past `reach` em. Along the line only: letters on other lines
 * are out of reach however near. Measured to the cell, not the word, so
 * a pointer in the gap between two words lights the near letters of
 * both. Touch has no hover, so a tap does nothing.
 *
 * The bed (sound.tsx) is the hover's too: it plays while the pointer
 * is over the speech and stops when it leaves, after a linger long
 * enough to cross the gap to the next speech — on the landing, over
 * the sign — without a restart. `bed` false keeps the hover silent of
 * it (the bench, to compare).
 */
export function Speech({
  lines,
  base,
  step,
  className,
  bed = true,
}: {
  lines: readonly (readonly string[])[];
  base: number;
  step: number;
  className?: string;
  /** Bring the bed while hovered. */
  bed?: boolean;
}) {
  const { reach, falloff, hair, quantum } = useGreetingTuning();
  const root = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  // The bed's own hover: on with the pointer, off BED_LINGER after it.
  const [bedHover, setBedHover] = useState(false);
  useEffect(() => {
    if (hovered) {
      setBedHover(true);
      return;
    }
    const t = window.setTimeout(() => setBedHover(false), BED_LINGER);
    return () => window.clearTimeout(t);
  }, [hovered]);
  useBed(bed && bedHover);
  // The speech's em — one size, every letter is set at it — measured
  // once shown and again on resize: the boil is sized to it, and the
  // reach is in it.
  const [em, setEm] = useState(16);
  const boilId = useId();
  useEffect(() => {
    const read = () => {
      if (root.current)
        setEm(parseFloat(getComputedStyle(root.current).fontSize) || 16);
    };
    read();
    addEventListener("resize", read);
    return () => removeEventListener("resize", read);
  }, []);
  // Each letter's share, by its number in the speech: `dips` for the
  // letters, `lit` the same as of the last move, for the strikes —
  // empty before the first move and after a leave.
  const [dips, setDips] = useState<readonly number[]>([]);
  const lit = useRef<readonly number[]>([]);
  /** When the last main note struck, for the gap, and which letter it
   *  was: the pointer resting on it strikes it once. */
  const lastMain = useRef(-Infinity);
  const onLetter = useRef(-1);

  function wave(speech: HTMLSpanElement, x: number, y: number) {
    // The shares. A letter's is quantised to `quantum`, so the pointer
    // moving within one letter does not re-render the speech, and so
    // held letters change in steps, not slides. Along the line only: a
    // letter is in reach when the pointer is level with its cell, by
    // how far it is along from the cell's nearest side; 0 on it.
    const prev = lit.current;
    const next: number[] = [];
    // The letters lit on this move that were not on the last, with
    // their distance from the pointer.
    const struck: { i: number; d: number; dip: number }[] = [];
    let under = -1;
    speech.querySelectorAll(".greeting-letter").forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (y < r.top || y > r.bottom) {
        next[i] = 0;
        return;
      }
      const d = Math.max(r.left - x, 0, x - r.right);
      if (d === 0) under = i;
      const dip =
        d > reach * em
          ? 0
          : Math.min(
              1,
              Math.round(
                Math.ceil(falloff ** (d / r.width) / quantum) * quantum * 100,
              ) / 100,
            );
      next[i] = dip;
      if (dip > 0 && !prev[i]) struck.push({ i, d, dip });
    });
    lit.current = next;

    // The strikes. The main note: the pointer has come onto a letter it
    // was not on, and the gap has passed. A letter it came onto inside
    // the gap is not counted as visited, so the pointer settling on it
    // still strikes it once the gap is up.
    const { gap, company } = getSoundTuning();
    const now = performance.now();
    let lead = -1;
    if (under >= 0 && under !== onLetter.current) {
      if (now - lastMain.current >= gap) {
        lead = under;
        lastMain.current = now;
        onLetter.current = under;
      }
    } else if (under < 0) {
      onLetter.current = -1;
    }
    if (lead >= 0) play("letter", 1);
    // The company: everything newly lit that is not the main note,
    // nearest first.
    struck.sort((a, b) => a.d - b.d);
    let j = lead >= 0 ? 1 : 0;
    for (const { i, dip } of struck) {
      if (i === lead) continue;
      const level = company * dip;
      if (level <= 0) continue;
      play("letter", level, { delay: j++ * STRUM, soft: true });
    }

    if (next.some((v, i) => v !== (prev[i] ?? 0))) setDips(next);
  }

  let word = 0;
  let letter = 0;
  return (
    <span
      ref={root}
      className={className}
      style={
        Object.fromEntries(
          BOIL_FIELDS.map((k) => [`--boil-${k + 1}`, `url(#${boilId}-${k})`]),
        ) as CSSProperties
      }
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") setHovered(true);
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== "touch")
          wave(e.currentTarget, e.clientX, e.clientY);
      }}
      onPointerLeave={() => {
        setDips([]);
        setHovered(false);
        lit.current = [];
        onLetter.current = -1;
      }}
    >
      <svg
        width={0}
        height={0}
        aria-hidden="true"
        style={{ position: "absolute" }}
      >
        {BOIL_FIELDS.map((k) => (
          <BoilFilter
            key={k}
            id={`${boilId}-${k}`}
            em={em}
            seeds={[...BOIL_SEEDS.slice(k * 4), ...BOIL_SEEDS.slice(0, k * 4)]}
            on={hovered}
            hair={hair * em}
          />
        ))}
      </svg>
      {lines.map((line, l) => (
        <span key={l} className="greeting-line">
          {line.map((text) => {
            const idx = word++;
            const first = letter;
            letter += Array.from(text).length;
            return (
              <Enter
                key={idx}
                as="span"
                kind="stamp"
                gate="mount"
                delay={base + idx * step}
                className="greeting-word"
              >
                <Word text={text} first={first} dips={dips} />
              </Enter>
            );
          })}
        </span>
      ))}
    </span>
  );
}

/** Words in a speech, for a caller's timers. */
export const countWords = (lines: readonly (readonly string[])[]) =>
  lines.reduce((sum, line) => sum + line.length, 0);

/** When the benches start the line: the hello's words on the stagger,
 *  and a beat of 200ms. */
export const afterHello = (m: MotionTuning) =>
  m.lead + countWords(GREETING_HELLO) * m.stagger + 200;
