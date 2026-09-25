"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { Enter, MOTION_DEFAULTS } from "./motion";
import { playLater } from "./play-later";
import { springEasing } from "./spring";
import { BLUE, INK, MEDIUM, SETTLE_EASE } from "./style";
import { createTuningStore } from "./tuning-store";

/**
 * A page's contents as a text selection — Overview, Research,
 * Development… a list of words in the ink, on the paper, with the
 * chapters read so far selected the way a drag selects lines: a flat
 * blue box hugging each word's line, the words white inside it. It is
 * the language of Julio's Framer site (extended-cues-365152.framer.app),
 * where everything that moves looks like text being selected, brought
 * to the project window's rail (2026-09-23; the goo column it replaces
 * lives on as the bench's other column, pieces/contents/goo.tsx).
 *
 * A chapter is selected as a drag would select it: the blue sweeps
 * across it from its left edge and stops at the last letter, the
 * letters turning white as it passes; let go, it collapses back to the
 * left. Each row's blue is as wide as its own word, so a run of them is
 * ragged, and each box reaches a little past its line (`overlap`), so
 * the run overlaps, each box over the one above, the blue a little
 * see-through (`alpha`) so the overlaps show — both as on that site.
 *
 * What the blue means is a knob: `range`, the selection runs from the
 * first chapter down to the one being read — reading extends it a line
 * at a time, each line sweeping `stagger` ms after the one above, and
 * shrinking runs back up in the same steps; `line`, only the chapter
 * being read is selected, and it moves down the list as the page is
 * read. Pointing at a row selects that row on its own, over whatever
 * is read, and tilts it a little — by a lean drawn at random each
 * time, up to `tilt`, either way, so no two hovers sit alike; leaving
 * lets it go, straight. The read selection never moves for the pointer.
 * A click glides the page to the chapter, eased in and out.
 *
 * Moves are on the site's spring by Julio's choice (the contents are
 * the one place on the site that tweens rather than cuts): the arrival
 * bounces, the way back is the same spring with no bounce, so a blue
 * that has gone doesn't swing back in as a sliver before it settles.
 *
 * `pinned` is the list in the flow of a page (a phone, where the window
 * has no rail): the words, selecting nothing.
 *
 * `ContentsTuning` is the set of knobs; /lab/contents is its bench, and
 * <Contents> regenerates its stylesheet on every change.
 *
 * It sounds twice, in the site's own voices (sound.tsx, the `contents`
 * place, tuned on /lab/sound): the cardboard tap as a row under the
 * pointer takes the blue, and the knock of a click that goes somewhere
 * as the glide starts. Reading is silent. The sounds are fetched on
 * demand (play-later.ts), so nothing of the synth lands in a work
 * page's first load.
 */

export type ContentsStop = {
  /** The id of the element the stop stands for, and jumps to. */
  id: string;
  label: string;
};

export type ContentsTuning = {
  /** The type, px. The ems below are its. */
  size: number;
  /** What the blue is: read so far, or the line being read. */
  blue: "range" | "line";
  /** The ink block behind the column: none (words on the paper) or on. */
  bar: "off" | "on";
  /** A row's height, em: the line box the selection fills. */
  line: number;
  /** The room beside the words, em: the selection's reach past them. */
  side: number;
  /** In a range, the ms between one line's sweep and the next's. */
  stagger: number;
  /** How far a row's blue reaches past its line, em, up and down: the
   *  boxes of neighbouring rows overlap by twice this, the lower one on
   *  top. */
  overlap: number;
  /** How far the row under the pointer may tilt, degrees: each hover
   *  takes its own lean, between two fifths of this and all of it, to
   *  either side. */
  tilt: number;
  /** The blue's strength, 0 to 1: under 1, the overlaps and the words
   *  behind show through. */
  alpha: number;
  /** A sweep, ms — on the spring, its swing — and how the column moves:
   *  on the site's ease, or on the spring the scroll cue's sketches
   *  move on (spring.ts), `bounce` how far it runs past. */
  swap: number;
  motion: "ease" | "spring";
  bounce: number;
  /** The ink and the blue — "" is the site's blue (or the page's tint). */
  ink: string;
  tint: string;
};

// Julio's values off the bench (2026-09-23): the pane's own store the
// day the selection replaced the goo column.
const CONTENTS_DEFAULTS: Readonly<ContentsTuning> = Object.freeze({
  size: 18,
  blue: "range",
  bar: "off",
  line: 1.5,
  side: 0.25,
  stagger: 120,
  overlap: 0.15,
  tilt: 2,
  alpha: 0.85,
  swap: 180,
  motion: "spring",
  bounce: 0.39,
  ink: INK,
  tint: "",
});

const store = createTuningStore("contents-tuning", CONTENTS_DEFAULTS);

/** Lays `patch` over the current values and tells every subscriber. */
export const setContentsTuning = store.set;
export const resetContentsTuning = store.reset;
/** The live tuning, re-rendering the caller on every change. */
export const useContentsTuning = store.useTuning;

const n = (v: number, d = 3) => Number(v.toFixed(d)).toString();

/** How often the scroll is read, ms. */
export const BEAT = 100;
/** A jump's glide, ms: the shortest, the longest, and how much longer
 *  per screenful travelled. */
const GLIDE_MIN = 450;
const GLIDE_MAX = 1100;
const GLIDE_PER_SCREEN = 180;
/** The reading line, px past a section's own scroll margin (where a
 *  jump lands it): so the stop a jump lands on is the one being read,
 *  whatever margin the page gives its sections. */
const SLACK = 8;

/** A move's timing: `ms` on the site's ease, or on the spring — as long
 *  as the spring takes to settle, on its own curve. */
export function timing(t: ContentsTuning, ms: number, bounce = t.bounce) {
  if (t.motion !== "spring") return `${n(ms, 0)}ms ${SETTLE_EASE}`;
  const { easing, settle } = springEasing(ms, bounce);
  return `${n(settle, 0)}ms ${easing}`;
}

/**
 * The whole stylesheet for a tuning. The notes are here rather than in
 * the CSS, where they would ship to every work page:
 *
 * - Each row carries its words in the ink and, over them, the same
 *   words in white on the blue, clipped to nothing from the right;
 *   selected, the clip opens across the row, so the blue and the white
 *   letters arrive together, left to right. `--d` is a row's turn in a
 *   range's sweep, `--lean` the hovered row's tilt.
 * - The rows stack in order, so a row's box lies over the one above's;
 *   the tilted row comes to the top of both its neighbours.
 * - The arrival (`.is-on`, `.is-tilt`) is on the tuning's spring; the
 *   base rules, which the way back falls to, are the same spring with
 *   no bounce.
 */
function contentsCss(t: ContentsTuning): string {
  const sweep = timing(t, t.swap);
  const back = timing(t, t.swap, 0);
  const ink = t.ink || INK;
  const tint = t.tint || BLUE;
  const blue =
    t.alpha < 1
      ? `color-mix(in srgb, ${tint} ${n(t.alpha * 100, 1)}%, transparent)`
      : tint;
  const onBar = t.bar === "on";
  return `
.ct { position: relative; display: block; width: max-content; max-width: 100%; color: ${onBar ? "#fff" : `var(--ct-ink, ${ink})`}; font-family: ${MEDIUM}; font-weight: 500; font-size: ${n(t.size)}px; line-height: 1; letter-spacing: -.01em; }
.ct ol { position: relative; display: flex; flex-direction: column; align-items: stretch; margin: 0; padding: 0; list-style: none; ${onBar ? `background: ${ink};` : ""} }
.ct li { position: relative; display: flex; }
.ct li.is-tilt { z-index: 1; }
.ct a { position: relative; display: flex; align-items: center; width: max-content; height: ${n(t.line)}em; padding: 0 ${n(t.side)}em; white-space: nowrap; color: inherit; text-decoration: none; outline: none; transition: transform ${back}; }
.ct li.is-tilt a { transform: rotate(var(--lean, 0deg)); transition: transform ${sweep}; }
.ct a:focus-visible { text-decoration: underline; text-underline-offset: .2em; }
.ct-hi { position: absolute; inset: -${n(t.overlap)}em 0; display: flex; align-items: center; padding: 0 ${n(t.side)}em; background: ${blue}; color: #fff; clip-path: inset(0 100% 0 0); transition: clip-path ${back} var(--d, 0ms); }
.is-on .ct-hi { clip-path: inset(0 0 0 0); transition: clip-path ${sweep} var(--d, 0ms); }
@media (prefers-reduced-motion: reduce) { .ct a, .ct-hi { transition: none !important; } }
`;
}

export function Contents({
  stops,
  scroller,
  pinned = false,
}: {
  stops: ContentsStop[];
  /** What scrolls the page: an element, or null for the window. */
  scroller: HTMLElement | null;
  /** In the flow of a page: the words, selecting nothing. */
  pinned?: boolean;
}) {
  const at = useReadingPosition(
    stops.map((s) => s.id),
    scroller,
    !pinned,
  );
  const t = useContentsTuning();
  // The stop the pointer (or focus) is on, if any, and the lean it
  // drew as it landed.
  const [hover, setHover] = useState<number | null>(null);
  const [lean, setLean] = useState(0);
  function point(i: number) {
    setHover(i);
    setLean(
      (Math.random() < 0.5 ? -1 : 1) * t.tilt * (0.4 + 0.6 * Math.random()),
    );
  }
  // The stop a click is gliding to: the selection waits there while the
  // page travels past the stops between — and is let go when the glide
  // lands (or the reader takes the scroll back).
  const [going, setGoing] = useState<number | null>(null);
  const glide = useRef<() => void>(null);
  useEffect(() => () => glide.current?.(), []);

  function jump(e: MouseEvent<HTMLAnchorElement>, id: string, i: number) {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    playLater("knock", 1, "contents");
    // A glide already under way lets go first, so its landing doesn't
    // undo this one's hold.
    glide.current?.();
    setGoing(i);
    glide.current = glideTo(el, scroller, () => {
      glide.current = null;
      // Let go a beat after landing: the reading position is read on
      // that beat, and the selection should pass straight to it.
      window.setTimeout(() => setGoing((g) => (g === i ? null : g)), 2 * BEAT);
    });
    // A pointer's click leaves its focus behind, which would hold the
    // row after the pointer has gone.
    if (e.detail > 0) e.currentTarget.blur();
  }

  // The selection's end: where a click is going, else where the page is
  // read; nowhere when pinned. The pointer doesn't move it — the row
  // under the pointer is selected on its own, over whatever is read.
  const end = pinned ? -1 : (going ?? at);
  const here = pinned ? -1 : (hover ?? end);

  // Where the end was on the last render: a range that grows sweeps its
  // new lines in turn from the top, one that shrinks lets go from the
  // bottom up.
  const prev = useRef(end);
  const from = prev.current;
  useEffect(() => {
    prev.current = end;
  }, [end]);
  const delay = (i: number) => {
    if (t.blue !== "range" || from === end || i === hover) return 0;
    if (end > from && i > from && i <= end) return (i - from - 1) * t.stagger;
    if (end < from && i > end && i <= from) return (from - i) * t.stagger;
    return 0;
  };
  const on = (i: number) =>
    i === hover || (t.blue === "range" ? i <= end : i === end);

  // The tap belongs to the blue moving under the pointer, not to the
  // pointer arriving: none when the pointer lands on a row already
  // selected, none while reading.
  const was = useRef(here);
  useEffect(() => {
    const before = was.current;
    was.current = here;
    if (before !== here && hover !== null && hover === here)
      playLater("tap", 0.5, "contents");
  }, [here, hover]);

  return (
    <Enter
      kind="drop"
      gate={pinned ? "view" : "mount"}
      delay={MOTION_DEFAULTS.lead}
    >
      <nav
        className={pinned ? "ct is-pinned" : "ct"}
        aria-label="Contents"
        onPointerLeave={() => setHover(null)}
      >
        <style>{contentsCss(t)}</style>
        <ol>
          {stops.map((s, i) => {
            const read = !pinned && i === at;
            const d = delay(i);
            const cls = [on(i) && "is-on", i === hover && "is-tilt"]
              .filter(Boolean)
              .join(" ");
            const style: Record<string, string> = {};
            if (d) style["--d"] = `${d}ms`;
            if (i === hover) style["--lean"] = `${n(lean, 2)}deg`;
            return (
              <li
                key={s.id}
                className={cls || undefined}
                style={
                  Object.keys(style).length
                    ? (style as CSSProperties)
                    : undefined
                }
                onPointerEnter={() => point(i)}
              >
                <a
                  href={`#${s.id}`}
                  aria-current={read ? "location" : undefined}
                  onFocus={() => point(i)}
                  onBlur={() => setHover((h) => (h === i ? null : h))}
                  onClick={(e) => jump(e, s.id, i)}
                >
                  {s.label}
                  <span className="ct-hi" aria-hidden="true">
                    {s.label}
                  </span>
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
export function glideTo(
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
 * Where the reader is: the index of the stop being read.
 *
 * The reading line sits just past where a jump lands each section (its
 * own scroll margin, under the view's top edge) — so a stop is current
 * from the moment it is arrived at. A line fixed there would never
 * reach a last stop shorter than the view, so over the page's last
 * screenful of scroll it sweeps down to the view's foot.
 */
export function useReadingPosition(
  ids: string[],
  scroller: HTMLElement | null,
  live: boolean,
): number {
  const [at, setAt] = useState(0);
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
      setAt(index);
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
