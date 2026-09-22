"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { Enter, MOTION_DEFAULTS } from "./motion";
import { createTuningStore } from "./tuning-store";

/**
 * A page's contents as a column of stops — Overview, Research,
 * Development… in white Medium type, each on a tall squircle of the ink
 * — with the stop being read on a squircle of the blue, pushed apart
 * from its neighbours. It is the pill nav @drawsgood posted
 * (are.na/block/35111734, 158 frames read 2026-09-22) stood on end for
 * the project window's rail: there the items sit in a row, the black
 * ones flush so they read as one bar, the hovered one blue and held off
 * from the rest by a wide gap; here the stops stack, and the blue holds
 * the chapter being read.
 *
 * It moves as that one does — sticky. The squircles are one layer
 * under an SVG goo filter (a blur and a hard alpha ramp), so the flush
 * ones fuse into one bar, and when the blue moves the gap closes and
 * opens with a neck of ink drawing between neighbours; on the stop the
 * blue leaves, the ink grows back inside it as it fades. Eased, not cut
 * — the contents are the one place on the site that tweens, by Julio's
 * choice. Pointing at a stop takes the blue there for a look; leaving
 * the column sends it back to where the page is read.
 *
 * The shapes lay themselves out: the goo layer is a column of blocks of
 * the rows' own height and margins, so it follows the rows through
 * every transition with nothing measured. `pinned` is the column in the
 * flow of a page (a phone, where the window has no rail): one bar,
 * following nothing.
 *
 * `ContentsTuning` is the set of knobs — the rows' proportions, the gap,
 * the goo, the two speeds; /lab/contents is its bench, and <Contents>
 * regenerates its stylesheet on every change.
 */

export type ContentsStop = {
  /** The id of the element the stop stands for, and jumps to. */
  id: string;
  label: string;
};

export type ContentsTuning = {
  /** The type, px. Everything below is in its em. */
  size: number;
  /** A row's height. */
  row: number;
  /** The room beside the words. */
  side: number;
  /** The squircles' corners. */
  corner: number;
  /** What holds the blue off its neighbours, each side. */
  gap: number;
  /** The goo's blur, px: how far two shapes reach for each other. */
  blur: number;
  /** The neighbours' slide, ms. */
  slide: number;
  /** The blue's arrival and the ink's return, ms. */
  swap: number;
};

// The reference's proportions, tuned by Julio on the bench
// (2026-09-22): a tighter gap, less goo, quicker moves.
const CONTENTS_DEFAULTS: Readonly<ContentsTuning> = Object.freeze({
  size: 16,
  row: 2.5,
  side: 1.4,
  corner: 1.1,
  gap: 0.5,
  blur: 2.5,
  slide: 250,
  swap: 250,
});

const store = createTuningStore("contents-tuning", CONTENTS_DEFAULTS);

/** Lays `patch` over the current values and tells every subscriber. */
export const setContentsTuning = store.set;
export const resetContentsTuning = store.reset;
/** The live tuning, re-rendering the caller on every change. */
export const useContentsTuning = store.useTuning;

const MEDIUM = `var(--font-neue-montreal-extra), var(--font-neue-montreal), "Helvetica Neue", Arial, sans-serif`;
const INK = "#2b2722";
const TINT = "var(--ct-tint, #2f6df6)";
const EASE = "cubic-bezier(.22, 1, .36, 1)";

const n = (v: number, d = 3) => Number(v.toFixed(d)).toString();

/** How often the scroll is read, ms. */
const BEAT = 100;
/** A jump's glide, ms: the shortest, the longest, and how much longer
 *  per screenful travelled. */
const GLIDE_MIN = 450;
const GLIDE_MAX = 1100;
const GLIDE_PER_SCREEN = 180;
/** The reading line, px past a section's own scroll margin (where a
 *  jump lands it): so the stop a jump lands on is the one being read,
 *  whatever margin the page gives its sections. */
const SLACK = 8;

/**
 * The whole stylesheet for a tuning. The notes are here rather than in
 * the CSS, where they would ship to every work page:
 *
 * - The rows and, under them, their shapes are two columns of the same
 *   blocks, so the shapes follow the rows through every transition. The
 *   row being read is held off from the others by the gap.
 * - Each block carries its ink squircle and, over it, its blue one, off
 *   until the block is the one being read. Leaving, the blue fades
 *   faster than the ink grows back, so the ink is seen inside it for a
 *   moment. An ink squircle reaches a corner's worth into any flush
 *   neighbour, so a run of them is one straight-sided bar rather than a
 *   string of beads; the reach eases in and out with the gap.
 */
function contentsCss(t: ContentsTuning): string {
  const slide = `${n(t.slide, 0)}ms ${EASE}`;
  const swap = `${n(t.swap, 0)}ms ${EASE}`;
  return `
.ct { position: relative; display: block; width: max-content; max-width: 100%; color: #fff; font-family: ${MEDIUM}; font-weight: 500; font-size: ${n(t.size)}px; line-height: 1; letter-spacing: -.01em; }
.ct ol, .ct-goo { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.ct ol { position: relative; }
.ct-goo { position: absolute; inset: 0; pointer-events: none; }
.ct li, .ct-goo i { display: block; flex: none; height: ${n(t.row)}em; transition: margin ${slide}; }
.ct li.is-here, .ct-goo i.is-here { margin: ${n(t.gap)}em 0; }
.ct-goo i { position: relative; }
.ct-goo i::before, .ct-goo i::after { content: ""; position: absolute; inset: 0; border-radius: ${n(t.corner)}em; corner-shape: squircle; transition: transform ${swap}, opacity ${n(t.swap / 2, 0)}ms; }
.ct-goo i::before { background: ${INK}; transition: transform ${swap}, top ${slide}, bottom ${slide}; }
.ct-goo i:not(:first-child):not(.is-here):not(.is-here + i)::before { top: -${n(t.corner)}em; }
.ct-goo i:not(.is-here):has(+ i:not(.is-here))::before { bottom: -${n(t.corner)}em; }
.ct-goo i::after { background: ${TINT}; transform: scale(.7); opacity: 0; }
.ct-goo i.is-here::before { transform: scale(.82); }
.ct-goo i.is-here::after { transform: none; opacity: 1; }
.ct a { display: flex; align-items: center; height: 100%; padding: 0 ${n(t.side)}em; white-space: nowrap; color: #fff; text-decoration: none; outline: none; }
.ct a:focus-visible { text-decoration: underline; text-underline-offset: .2em; }
@media (prefers-reduced-motion: reduce) { .ct li, .ct-goo i, .ct-goo i::before, .ct-goo i::after { transition: none !important; } }
`;
}

export function Contents({
  stops,
  scroller,
  pinned = false,
  tint,
  label = "Contents",
}: {
  stops: ContentsStop[];
  /** What scrolls the page: an element, or null for the window. */
  scroller: HTMLElement | null;
  /** In the flow of a page: one capsule, following nothing. */
  pinned?: boolean;
  /** The blue; the site's without one. */
  tint?: string;
  label?: string;
}) {
  const at = useReadingPosition(
    stops.map((s) => s.id),
    scroller,
    !pinned,
  );
  const goo = useId();
  const t = useContentsTuning();
  // The stop the pointer (or focus) is on, if any: the blue goes there
  // for as long as it stays.
  const [hover, setHover] = useState<number | null>(null);
  // The stop a click is gliding to: the blue waits there, as the hover
  // showed it, while the page travels past the stops between — and is
  // let go when the glide lands (or the reader takes the scroll back).
  const [going, setGoing] = useState<number | null>(null);
  const glide = useRef<() => void>(null);
  useEffect(() => () => glide.current?.(), []);

  function jump(e: MouseEvent<HTMLAnchorElement>, id: string, i: number) {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    // A glide already under way lets go first, so its landing doesn't
    // undo this one's hold.
    glide.current?.();
    setGoing(i);
    glide.current = glideTo(el, scroller, () => {
      glide.current = null;
      // Let go a beat after landing: the reading position is read on
      // that beat, and the blue should pass straight to it.
      window.setTimeout(() => setGoing((g) => (g === i ? null : g)), 2 * BEAT);
    });
    // A pointer's click leaves its focus behind, which would hold the
    // blue on the row after the pointer has gone. `going` holds it
    // meanwhile, so letting go of the hover changes nothing.
    if (e.detail > 0) e.currentTarget.blur();
  }

  // The stop that is blue: the one under the pointer, else the one a
  // click is going to, else the one being read; none when pinned.
  const here = pinned ? -1 : (hover ?? going ?? at.index);

  return (
    <Enter
      kind="drop"
      gate={pinned ? "view" : "mount"}
      delay={MOTION_DEFAULTS.lead}
    >
      <nav
        className={pinned ? "ct is-pinned" : "ct"}
        aria-label={label}
        style={tint ? ({ "--ct-tint": tint } as CSSProperties) : undefined}
        onPointerLeave={() => setHover(null)}
      >
        <style>{contentsCss(t)}</style>
        <svg
          width="0"
          height="0"
          aria-hidden="true"
          style={{ position: "absolute" }}
        >
          <filter id={goo} x="-25%" y="-15%" width="150%" height="130%">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={t.blur}
              result="b"
            />
            <feColorMatrix
              in="b"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
            />
          </filter>
        </svg>
        <div className="ct-goo" style={{ filter: `url(#${goo})` }}>
          {stops.map((s, i) => (
            <i key={s.id} className={i === here ? "is-here" : undefined} />
          ))}
        </div>
        <ol>
          {stops.map((s, i) => {
            const read = !pinned && i === at.index;
            return (
              <li key={s.id} className={i === here ? "is-here" : undefined}>
                <a
                  href={`#${s.id}`}
                  aria-current={read ? "location" : undefined}
                  onPointerEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover((h) => (h === i ? null : h))}
                  onClick={(e) => jump(e, s.id, i)}
                >
                  {s.label}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </Enter>
  );
}

/**
 * Scrolls whatever holds `el` — the window's sheet, not the page behind
 * it — until `el` sits at its scroll margin: eased in and out, so the
 * page gathers speed and settles rather than snapping there. Longer
 * trips take a little longer. A wheel, a touch or a key from the reader
 * lets go at once. Returns the way to stop it; `done` runs either way.
 */
function glideTo(
  el: HTMLElement,
  scroller: HTMLElement | null,
  done: () => void,
): () => void {
  const root = scroller ?? document.documentElement;
  const view = scroller ? scroller.clientHeight : window.innerHeight;
  const edge = scroller ? scroller.getBoundingClientRect().top : 0;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const from = root.scrollTop;
  const max = root.scrollHeight - view;
  const to = Math.max(
    0,
    Math.min(max, from + el.getBoundingClientRect().top - edge - margin),
  );
  const put = (y: number) =>
    scroller ? (scroller.scrollTop = y) : window.scrollTo(0, y);

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || Math.abs(to - from) < 2) {
    put(to);
    done();
    return () => {};
  }

  const ms = Math.min(
    GLIDE_MAX,
    GLIDE_MIN + (GLIDE_PER_SCREEN * Math.abs(to - from)) / view,
  );
  const target: HTMLElement | Window = scroller ?? window;
  let raf = 0;
  let start = 0;
  let over = false;
  const stop = () => {
    if (over) return;
    over = true;
    cancelAnimationFrame(raf);
    target.removeEventListener("wheel", stop);
    target.removeEventListener("touchstart", stop);
    window.removeEventListener("keydown", stop);
    done();
  };
  const step = (now: number) => {
    if (!start) start = now;
    const k = Math.min(1, (now - start) / ms);
    // easeInOutCubic: gathers speed, then settles.
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    put(from + (to - from) * e);
    if (k < 1) raf = requestAnimationFrame(step);
    else stop();
  };
  target.addEventListener("wheel", stop, { passive: true });
  target.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("keydown", stop);
  raf = requestAnimationFrame(step);
  return stop;
}

/**
 * Where the reader is: which stop.
 *
 * The reading line sits just past where a jump lands each section (its
 * own scroll margin, under the view's top edge) — so a stop is current
 * from the moment it is arrived at. A line fixed there would never reach a last stop shorter
 * than the view, so over the page's last screenful of scroll it sweeps
 * down to the view's foot.
 */
function useReadingPosition(
  ids: string[],
  scroller: HTMLElement | null,
  live: boolean,
) {
  const [at, setAt] = useState({ index: 0 });
  const key = ids.join("|");
  useEffect(() => {
    if (!live) return;
    const target: HTMLElement | Window = scroller ?? window;
    let timer = 0;
    const read = () => {
      timer = 0;
      const root = scroller ?? document.documentElement;
      const height = scroller ? scroller.clientHeight : window.innerHeight;
      const edge = scroller ? scroller.getBoundingClientRect().top : 0;
      const left = Math.max(0, root.scrollHeight - height - root.scrollTop);
      const sweep = Math.max(0, 1 - left / height);

      let index = 0;
      ids.forEach((id, k) => {
        const el = document.getElementById(id);
        if (!el) return;
        const lead =
          (parseFloat(getComputedStyle(el).scrollMarginTop) || 0) + SLACK;
        const line = edge + lead + (height - lead) * sweep;
        if (el.getBoundingClientRect().top <= line) index = k;
      });
      setAt((was) => (was.index === index ? was : { index }));
    };
    const onScroll = () => {
      if (!timer) timer = window.setTimeout(read, BEAT);
    };
    read();
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the ids as one key
  }, [key, scroller, live]);
  return at;
}
