"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { BOIL_SEEDS, BoilFilter } from "./boil";
import { Enter, useMotionTuning, type MotionTuning } from "./motion";
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
 * on the motion tuning's clock and cuts), kept to `swing` of the
 * entrance's amplitude, and comes out of it tilted, with a hairline
 * stroked around it. Once the pointer has passed, the letter stamps
 * back in two held cuts of half the stamp's length to its plain self.
 *
 * A speech can ask for a highlight too (`highlight`; the bench does,
 * the landing does not): the lit letter's cell is painted the pale blue
 * of a text selection from the first cut, and since the lit cells
 * touch, the reach reads as one selection dragged across a few letters,
 * square while the glyphs inside it tilt.
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
   *  letter (see Letter's `way`). */
  scatter: number;
  /** The hairline stroked around a held letter, em of its size. */
  hair: number;
  /** How much of the entrance stamp's swing — displacement, tilt either
   *  way, size change — a letter under the pointer keeps. */
  swing: number;
  /** The highlight's colour and opacity, 0..1. */
  mark: string;
  markAlpha: number;
  /** How far the highlight reaches past each letter's cell, em: at the
   *  ends of a run it is the selection's own slack past the glyphs;
   *  between lit letters it only overlaps. */
  markPad: number;
};

// Julio's numbers off the bench, 2026-09-15: a big lean, spread a
// little per letter, that the neighbours nearly share; the highlight
// is the blue of a browser's text selection.
export const GREETING_DEFAULTS: Readonly<GreetingTuning> = Object.freeze({
  reach: 1.2,
  falloff: 0.93,
  tilt: 15,
  scatter: 0.5,
  hair: 0.02,
  swing: 0.3,
  mark: "#a9d1ff",
  markAlpha: 1,
  markPad: 0.04,
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

/** `#rrggbb` at an opacity, as rgba(). Anything else is passed through. */
function tint(hex: string, alpha: number) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const v = parseInt(m[1] as string, 16);
  return `rgba(${v >> 16}, ${(v >> 8) & 255}, ${v & 255}, ${n(alpha, 2)})`;
}

/** The static part: the cells, their reach and their states. */
const BASE_CSS = `
.greeting-line { display: block; }
.greeting-word { display: inline-block; }
.greeting-word + .greeting-word { margin-left: .26em; }
/* The word is the stacking context, so every letter's highlight (z -1)
   paints beneath every letter's glyph: a tilted glyph reaching into the
   next cell is never cut by that cell's highlight. */
.greeting-word-in { display: inline-block; isolation: isolate; }
/* Each letter is a cell around a glyph. The cell's hit area reaches
   above and below the glyph (padding the margin takes back), so a sweep
   along a line, or a little off it, catches every letter; the cell is
   what the highlight paints (its ::before, square, reaching --mark-pad
   past the cell's sides), and the glyph inside it is what stamps and
   tilts. A letter is on while its stamp plays, then held: the same
   pose, set statically, so the browser paints the tilted glyph in
   place instead of resampling a layer it keeps for the animation —
   which is what made held letters soft. The classes come from the
   letter's state, so nothing plays at mount; --dip is the letter's
   share of the stamp's amplitude and of the tilt — 1 under the pointer,
   less out toward the edge of the reach (see Speech) — and --way its own
   lean, as a share of the tilt, set once per letter so no two lean
   quite alike. */
.greeting-letter { position: relative; display: inline-block; padding: .16em 0; margin: -.16em 0; --dip: 1; }
.greeting-letter::before { content: ""; position: absolute; z-index: -1; inset: 0 calc(-1 * var(--mark-pad, 0em)); opacity: 0; }
.greeting-word-marked .greeting-letter-on::before, .greeting-word-marked .greeting-letter-held::before { opacity: 1; }
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
 * The generated part, from both tunings: the stamp's poses on the
 * motion tuning's clock, every displacement, tilt and size change at
 * `swing` and scaled by the letter's --dip; and the highlight's paint.
 * The hairline is the boil filter's (see BASE_CSS).
 */
function greetingCss(m: MotionTuning, g: GreetingTuning): string {
  const d = m.distance;
  const over = m.overshoot - 1;
  const sw = g.swing;
  const dip = (v: number, unit: string) => `calc(${n(v)}${unit} * var(--dip))`;
  const pose = (x: number, y: number, r: number, scale: number) =>
    `transform: translate(${dip(x * sw, "px")}, ${dip(y * sw, "px")}) rotate(calc(${n(r * sw)}deg * var(--dip) - ${n(g.tilt)}deg * var(--way, 1) * var(--dip))) scale(calc(1 + ${dip((scale - 1) * sw, "")}));`;
  const start = pose(-d * 0.17, -d * 0.25, -m.tilt * 0.3, 1 / m.startScale);
  const land = pose(d * 0.04, d * 0.06, m.tilt * 0.15, 1 - over * 0.6);
  const settle = pose(-d * 0.02, -d * 0.02, -m.tilt * 0.06, 1 + over * 0.25);
  const land2 = pose(0, 0, 0, 1 - over * 0.2);
  const rest = pose(0, 0, 0, 1);
  const c = Math.min(4, Math.max(1, Math.round(m.cuts)));
  const middle =
    c === 1
      ? []
      : c === 2
        ? [land]
        : c === 3
          ? [land, settle]
          : [land, settle, land2];
  const steps = [start, ...middle, rest];
  const total = steps.length - 1;
  const frames = steps
    .map((body, i) => `${n((i / total) * 100, 1)}% { ${body} }`)
    .join(" ");
  const stampMs = n(m.duration * 1000, 0);
  const backMs = n(m.duration * 500, 0);
  return `${BASE_CSS}
.greeting-letter-held .greeting-glyph { ${rest} }
.greeting-letter { --mark-pad: ${n(g.markPad)}em; }
.greeting-letter::before { background: ${tint(g.mark, g.markAlpha)}; }
.greeting-letter-on .greeting-glyph { animation-duration: ${stampMs}ms; }
.greeting-letter-off .greeting-glyph { animation-duration: ${backMs}ms; }
@keyframes greeting-letter-stamp { ${frames} }
@keyframes greeting-letter-back { 0% { transform: scale(calc(1 - ${dip(over * 0.5 * sw, "")})); } 50%, 100% { transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .greeting-letter-on .greeting-glyph, .greeting-letter-off .greeting-glyph { animation-duration: 1ms; }
}
`;
}

/** The speech's boil fields, by number: four filters, each a run of the
 *  seeds started a quarter round on from the last. */
const BOIL_FIELDS = [0, 1, 2, 3] as const;

/** ms the way back takes, for the tuning: the letter is at rest after. */
const greetingBackMs = (m: MotionTuning) => m.duration * 500;

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
 * back, staying in the off class until it is at rest.
 */
function Letter({
  ch,
  dip,
  way,
  cell,
}: {
  ch: string;
  dip: number;
  /** Its own lean, as a share of the tilt — see Word. */
  way: number;
  /** Where to hand its cell for the speech to measure. */
  cell: (el: HTMLSpanElement | null) => void;
}) {
  const [pose, setPose] = useState<"rest" | "on" | "held" | "off">("rest");
  // Derived during render: the reach arriving starts the stamp, its
  // leaving starts the way back.
  const [wasLit, setWasLit] = useState(dip > 0);
  if (dip > 0 !== wasLit) {
    setWasLit(dip > 0);
    setPose(dip > 0 ? "on" : pose === "on" || pose === "held" ? "off" : pose);
  }
  const back = greetingBackMs(useMotionTuning());
  useEffect(() => {
    if (pose !== "off") return;
    const t = window.setTimeout(() => setPose("rest"), back + 40);
    return () => window.clearTimeout(t);
  }, [pose, back]);
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
      style={{ "--dip": dip || 1, "--way": n(way) } as CSSProperties}
      ref={cell}
    >
      <span
        className="greeting-glyph"
        onAnimationEnd={(e) => {
          if (e.animationName === "greeting-letter-stamp")
            setPose((p) => (p === "on" ? "held" : p));
        }}
      >
        {ch}
      </span>
    </span>
  );
}

/**
 * One word, a run of letters, each with the share the speech gives it
 * (`dips`, from the word's first letter) and each handing its cell up
 * to be measured (`cell`, by the letter's number in the speech).
 */
function Word({
  text,
  first,
  dips,
  cell,
  highlight = false,
}: {
  text: string;
  /** The word's first letter's number in the speech. */
  first: number;
  dips: readonly number[];
  cell: (i: number, el: HTMLSpanElement | null) => void;
  /** Paint the lit letters' cells (see the highlight knobs). */
  highlight?: boolean;
}) {
  const { scatter } = useGreetingTuning();
  return (
    <span
      className={
        highlight ? "greeting-word-in greeting-word-marked" : "greeting-word-in"
      }
    >
      {Array.from(text).map((ch, i) => (
        <Letter
          key={i}
          ch={ch}
          dip={dips[first + i] ?? 0}
          way={1 - scatter + scatter * stray(ch, i)}
          cell={(el) => cell(first + i, el)}
        />
      ))}
    </span>
  );
}

/** A letter's own number in -1..1, fixed by what and where it is, so
 *  the same word always leans the same way and the server agrees. */
function stray(ch: string, i: number) {
  const seed = ((i + 1) * 9301 + (ch.codePointAt(0) ?? 0) * 49297) % 233280;
  return (seed / 233280) * 2 - 1;
}

/** A letter's share, 0..1, quantised so the pointer moving within one
 *  letter does not re-render the speech, and so held letters change in
 *  steps, not slides. */
const QUANTUM = 0.1;

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
  highlight = false,
  bed = true,
}: {
  lines: readonly (readonly string[])[];
  base: number;
  step: number;
  className?: string;
  /** Paint the lit letters' cells — off by default, on for the bench. */
  highlight?: boolean;
  /** Bring the bed while hovered. */
  bed?: boolean;
}) {
  const { reach, falloff, hair } = useGreetingTuning();
  const cells = useRef<(HTMLSpanElement | null)[]>([]);
  // The boil, sized to the speech's em (measured once shown, and again
  // on resize), cycling while the pointer is over the speech; the lit
  // letters wear it (see BASE_CSS).
  const root = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  // The bed's own hover: on with the pointer, off BED_LINGER after it.
  const [bedHover, setBedHover] = useState(false);
  const bedOff = useRef<number | null>(null);
  useEffect(() => {
    if (bedOff.current !== null) window.clearTimeout(bedOff.current);
    if (hovered) {
      bedOff.current = null;
      setBedHover(true);
      return;
    }
    bedOff.current = window.setTimeout(() => setBedHover(false), BED_LINGER);
    return () => {
      if (bedOff.current !== null) window.clearTimeout(bedOff.current);
    };
  }, [hovered]);
  useBed(bed && bedHover);
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
  const [dips, setDips] = useState<readonly number[]>([]);
  const cell = (i: number, el: HTMLSpanElement | null) => {
    cells.current[i] = el;
  };
  // Each letter's share as of the last move, for the strikes: a letter
  // is struck when its share rises from nothing.
  const lit = useRef<readonly number[]>([]);
  /** When the last main note struck, for the gap, and which letter it
   *  was: the pointer resting on it strikes it once. */
  const lastMain = useRef(-Infinity);
  const onLetter = useRef(-1);

  function wave(x: number, y: number, em: number) {
    const next: number[] = [];
    let any = false;
    // The letters lit on this move that were not on the last, with
    // their distance from the pointer.
    const struck: { i: number; d: number }[] = [];
    let under = -1;
    cells.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Along the line only: a letter is in reach when the pointer is
      // level with its cell, by how far it is along from the cell's
      // nearest side; 0 on it. Other lines are never reached.
      if (y < r.top || y > r.bottom) return;
      const d = Math.max(r.left - x, 0, x - r.right);
      if (d === 0) under = i;
      const dip =
        d > reach * em
          ? 0
          : Math.round(
              Math.ceil(falloff ** (d / r.width) / QUANTUM) * QUANTUM * 100,
            ) / 100;
      next[i] = Math.min(1, dip);
      if (dip > 0) {
        any = true;
        if (!(lit.current[i] ?? 0)) struck.push({ i, d });
      }
    });
    lit.current = any ? next : [];
    const { gap, company } = getSoundTuning();
    const now = performance.now();
    // The main note: the pointer has come onto a letter it was not on,
    // and the gap has passed. A letter it came onto inside the gap is
    // not counted as visited, so the pointer settling on it still
    // strikes it once the gap is up.
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
    for (const { i } of struck) {
      if (i === lead) continue;
      const level = company * (next[i] ?? 0);
      if (level <= 0) continue;
      play("letter", level, { delay: j++ * STRUM, soft: true });
    }
    setDips((prev) => {
      if (!any && prev.length === 0) return prev;
      const same =
        prev.length === next.length && prev.every((v, i) => v === next[i]);
      return same ? prev : any ? next : [];
    });
  }

  let i = 0;
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
        if (e.pointerType === "touch") return;
        // One size for the speech: every letter is set at it.
        const em = parseFloat(getComputedStyle(e.currentTarget).fontSize) || 16;
        wave(e.clientX, e.clientY, em);
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
          {line.map((word) => {
            const idx = i++;
            return (
              <Enter
                key={idx}
                as="span"
                kind="stamp"
                gate="mount"
                delay={base + idx * step}
                className="greeting-word"
              >
                <Word
                  text={word}
                  first={firstOf(lines, idx)}
                  dips={dips}
                  cell={cell}
                  highlight={highlight}
                />
              </Enter>
            );
          })}
        </span>
      ))}
    </span>
  );
}

/** The number, in the speech, of word `idx`'s first letter. */
function firstOf(lines: readonly (readonly string[])[], idx: number) {
  let word = 0;
  let letters = 0;
  for (const line of lines)
    for (const w of line) {
      if (word === idx) return letters;
      letters += Array.from(w).length;
      word++;
    }
  return letters;
}

/** Seconds between the strikes of letters lit by one move. */
const STRUM = 0.014;

/** ms the bed keeps going after the pointer has left a speech. */
const BED_LINGER = 1500;

/** Words in a speech, for a caller's timers. */
export const countWords = (lines: readonly (readonly string[])[]) =>
  lines.reduce((sum, line) => sum + line.length, 0);
