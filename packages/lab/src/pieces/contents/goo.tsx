"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import {
  BEAT,
  glideTo,
  timing,
  useContentsTuning,
  useReadingPosition,
  type ContentsStop,
  type ContentsTuning,
} from "../../contents";
import { Enter, MOTION_DEFAULTS } from "../../motion";
import { playLater } from "../../play-later";
import { BLUE, INK, MEDIUM } from "../../style";
import { createTuningStore } from "../../tuning-store";

/**
 * The goo column: the site's contents index (2026-09-22 to -23, and
 * again since 2026-09-29, when it took the rail back from the text
 * selection in contents.tsx, which stays on the bench). Stops in
 * white Medium type, each on a tall squircle of the ink, the one being
 * read on a squircle of the blue pushed apart from its neighbours —
 * @drawsgood's gooey pill nav (are.na/block/35111734) stood on end. The
 * squircles are one layer under an SVG goo filter (a blur and a hard
 * alpha ramp), so the flush ones fuse into one bar, and when the blue
 * moves the gap closes and opens with a neck of ink between neighbours;
 * on the stop the blue leaves, the ink grows back inside it as it
 * fades. Pointing at a stop takes the blue there for a look; leaving
 * the column sends it back to where the page is read.
 *
 * The shapes lay themselves out: the goo layer is a column of blocks of
 * the rows' own height and margins, so it follows the rows through
 * every transition with nothing measured.
 *
 * `GooTuning` is its own set of knobs (contents-goo); the type, the
 * colours, the sweep's speed and the spring are the contents tuning's,
 * with the selection column. The work pages (CaseStudy.tsx) read it
 * through @portfolio/lab/contents-goo.
 */

export type GooTuning = {
  /** Which column the bench shows: the selection ("site", its key
   *  from when that was the site's), or this. */
  column: "site" | "goo";
  /** A row's height, em, and the room beside the words. */
  row: number;
  side: number;
  /** The room above and below the words, em: the side's, top and
   *  bottom — each row grows by twice this. */
  pad: number;
  /** The room at the ink bar's two ends, em, over what the rows give:
   *  the top of a run's first row and the foot of its last, so the bar
   *  can stand as far off the words above and below as beside them
   *  (`matchEnds`) without the rows inside it spreading. */
  ends: number;
  /** The squircles' corners, em, and their shape. */
  corner: number;
  shape: "squircle" | "round";
  /** What holds the blue off its neighbours, each side, em. */
  gap: number;
  /** The goo's blur, px: how far two shapes reach for each other. */
  blur: number;
  /** The neighbours' slide, ms. */
  slide: number;
  /** The column's drop shadow on the mat, em of the type: its offset,
   *  its blur, and its darkness (0 is none). It falls the way the brand
   *  plate's does, down and to the right. */
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowAlpha: number;
  /** What the bench's page stands on: the site's mat, or plain paper. */
  ground: "mat" | "paper";
};

// Julio's values off the bench (2026-09-29), shadow and all.
const GOO_DEFAULTS: Readonly<GooTuning> = Object.freeze({
  column: "goo",
  row: 2.2,
  side: 1.4,
  pad: 0,
  ends: 0.45,
  corner: 0.65,
  shape: "squircle",
  gap: 0.5,
  blur: 5,
  slide: 210,
  shadowX: 0.23,
  shadowY: 0.37,
  shadowBlur: 0.1,
  shadowAlpha: 0.34,
  ground: "mat",
});

const store = createTuningStore("contents-goo", GOO_DEFAULTS);
export const setGooTuning = store.set;
export const resetGooTuning = store.reset;
export const useGooTuning = store.useTuning;

const n = (v: number, d = 3) => Number(v.toFixed(d)).toString();

/** The smallest the type is fitted down to, px; a stop still too long
 *  for its room at this size goes onto a second line. */
const FLOOR = 14;

/** Neue Montreal Medium, em, measured in the browser: from a row's
 *  middle to the top of its capitals (0.715 tall, their tops 0.745
 *  under a 2.2em row's top), and the room a capital's side bearing
 *  leaves before the first letter. */
const CAP_HALF = 0.355;
const BEARING = 0.07;

/** The ends that stand the bar as far off the capitals above and below
 *  as the side stands it off the first letter: at 2.2em rows and a
 *  1.4em side, 0.725em, on the knob's step 0.7. */
export function matchEnds(g: GooTuning) {
  const across = g.side + BEARING;
  const down = (g.row + 2 * g.pad) / 2 - CAP_HALF;
  return Math.max(0, Math.round((across - down) * 20) / 20);
}

/** How far the shadow reaches past the shapes on the right, em. */
const reach = (g: GooTuning) =>
  g.shadowAlpha > 0 ? Math.max(0, g.shadowX) + 2 * g.shadowBlur : 0;

/** The shadow, after the goo: it falls from the fused shape, not from
 *  each squircle under it. */
function gooFilter(id: string, g: GooTuning) {
  const goo = `url(#${id})`;
  if (g.shadowAlpha <= 0) return goo;
  return `${goo} drop-shadow(${n(g.shadowX)}em ${n(g.shadowY)}em ${n(g.shadowBlur)}em rgba(0, 0, 0, ${n(g.shadowAlpha)}))`;
}

/**
 * The rows and, under them, their shapes are two columns of the same
 * blocks, so the shapes follow the rows through every transition. The
 * row being read is held off from the others by the gap. Each block
 * carries its ink squircle and, over it, its blue one, off until the
 * block is the one being read; leaving, the blue fades faster than the
 * ink grows back, so the ink is seen inside it for a moment, and on the
 * spring the way back has no bounce. An ink squircle reaches a corner's
 * worth into any flush neighbour, so a run of them is one straight-sided
 * bar rather than a string of beads. A run's first and last rows take
 * the ends' room on their outer side, so the bar's top and foot stand
 * off the words without the rows between them spreading.
 *
 * A row is as tall as its words: one line at the row's height, or,
 * where a stop has no room on one line, two. The shapes hold the same
 * words, unseen, so they grow with it.
 */
function gooCss(t: ContentsTuning, g: GooTuning): string {
  const slide = timing(t, g.slide);
  const swap = timing(t, t.swap);
  const back = timing(t, t.swap, 0);
  const ink = t.ink || INK;
  const tint = t.tint || BLUE;
  const corners = `border-radius: ${n(g.corner)}em; corner-shape: ${g.shape};`;
  // Arriving, the blue grows from small: .7, or, on the spring, from a
  // point the way the cue's label does.
  const from = t.motion === "spring" ? 0.15 : 0.7;
  return `
.cg { position: relative; display: block; width: max-content; max-width: calc(100% - ${n(reach(g))}em); color: #fff; font-family: ${MEDIUM}; font-weight: 500; font-size: var(--cg-size, ${n(t.size)}px); line-height: 1; letter-spacing: -.01em; }
.cg.is-measuring { max-width: none; }
.cg.is-measuring a, .cg.is-measuring .cg-goo span { white-space: nowrap; }
.cg ol, .cg-goo { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.cg ol { position: relative; }
.cg-goo { position: absolute; inset: 0; pointer-events: none; }
.cg li, .cg-goo i { display: block; flex: none; transition: margin ${slide}, padding ${slide}; }
.cg li:first-child:not(.is-here), .cg li.is-here + li, .cg-goo i:first-child:not(.is-here), .cg-goo i.is-here + i { padding-top: ${n(g.ends)}em; }
.cg li:last-child:not(.is-here), .cg li:has(+ li.is-here), .cg-goo i:last-child:not(.is-here), .cg-goo i:has(+ i.is-here) { padding-bottom: ${n(g.ends)}em; }
.cg li.is-here, .cg-goo i.is-here { margin: ${n(g.gap)}em 0; }
.cg-goo i { position: relative; }
.cg-goo i::before, .cg-goo i::after { content: ""; position: absolute; inset: 0; ${corners} transition: transform ${back}, opacity ${n(t.swap / 2, 0)}ms; }
.cg-goo i::before { background: ${ink}; transition: transform ${back}, top ${slide}, bottom ${slide}; }
.cg-goo i.is-here::before { transition: transform ${swap}, top ${slide}, bottom ${slide}; }
.cg-goo i.is-here::after { transition: transform ${swap}, opacity ${n(t.swap / 2, 0)}ms; }
.cg-goo i:not(:first-child):not(.is-here):not(.is-here + i)::before { top: -${n(g.corner)}em; }
.cg-goo i:not(.is-here):has(+ i:not(.is-here))::before { bottom: -${n(g.corner)}em; }
.cg-goo i::after { background: ${tint}; transform: scale(${from}); opacity: 0; }
.cg-goo i.is-here::before { transform: scale(.82); }
.cg-goo i.is-here::after { transform: none; opacity: 1; }
.cg a, .cg-goo span { display: flex; align-items: center; box-sizing: border-box; min-height: ${n(g.row + 2 * g.pad)}em; padding: ${n(0.35 + g.pad)}em ${n(g.side)}em; line-height: 1.05; text-wrap: balance; }
.cg-goo span { position: relative; visibility: hidden; }
.cg a { color: #fff; text-decoration: none; outline: none; }
.cg a:focus-visible { text-decoration: underline; text-underline-offset: .2em; }
@media (prefers-reduced-motion: reduce) { .cg li, .cg-goo i, .cg-goo i::before, .cg-goo i::after { transition: none !important; } }
`;
}

export function ContentsGoo({
  stops,
  scroller,
  pinned = false,
}: {
  stops: ContentsStop[];
  scroller: HTMLElement | null;
  /** In the flow of a page: one capsule, following nothing. */
  pinned?: boolean;
}) {
  const at = useReadingPosition(
    stops.map((s) => s.id),
    scroller,
    !pinned,
  );
  const goo = useId();
  const t = useContentsTuning();
  const g = useGooTuning();
  const [hover, setHover] = useState<number | null>(null);
  const [going, setGoing] = useState<number | null>(null);
  const glide = useRef<() => void>(null);

  // The type, fitted to the room the column stands in (the rail is as
  // wide as the screen is tall): the tuning's size where the widest
  // stop fits on one line with its shadow, less where it doesn't, down
  // to the floor.
  const nav = useRef<HTMLElement>(null);
  const labels = stops.map((s) => s.label).join("|");
  useLayoutEffect(() => {
    const el = nav.current;
    const room = el?.parentElement;
    if (!el || !room) return;
    // Measured at the size it has, the words on one line, and scaled:
    // the width goes with the type. Setting the size to measure would
    // restart every transition in em (the gap's slide) each time. And
    // only when the room's width changes — its height moves with the
    // gap on every frame of a slide.
    let wide = -1;
    const fit = (force = false) => {
      const w = room.clientWidth;
      if (!force && w === wide) return;
      wide = w;
      const now = parseFloat(getComputedStyle(el).fontSize);
      el.classList.add("is-measuring");
      const one = el.offsetWidth / now + reach(g);
      el.classList.remove("is-measuring");
      // A pixel spare, or rounding can still break a line.
      const size = Math.min(t.size, (w - 1) / one);
      el.style.setProperty("--cg-size", `${n(Math.max(FLOOR, size), 2)}px`);
    };
    fit(true);
    const ro = new ResizeObserver(() => fit());
    ro.observe(room);
    document.fonts?.ready.then(() => fit(true));
    return () => ro.disconnect();
  }, [t.size, g, labels]);
  useEffect(() => () => glide.current?.(), []);

  function jump(e: MouseEvent<HTMLAnchorElement>, id: string, i: number) {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    playLater("knock", 1, "contents");
    glide.current?.();
    setGoing(i);
    glide.current = glideTo(el, scroller, () => {
      glide.current = null;
      window.setTimeout(() => setGoing((g) => (g === i ? null : g)), 2 * BEAT);
    });
    if (e.detail > 0) e.currentTarget.blur();
  }

  // The stop that is blue: the one under the pointer, else the one a
  // click is going to, else the one being read; none when pinned.
  const here = pinned ? -1 : (hover ?? going ?? at);

  const was = useRef(here);
  useEffect(() => {
    const from = was.current;
    was.current = here;
    if (from !== here && hover !== null && hover === here)
      playLater("tap", 0.5, "contents");
  }, [here, hover]);

  return (
    <Enter
      kind="drop"
      gate={pinned ? "view" : "mount"}
      delay={MOTION_DEFAULTS.lead}
    >
      <nav
        ref={nav}
        className={pinned ? "cg is-pinned" : "cg"}
        aria-label="Contents"
        onPointerLeave={() => setHover(null)}
      >
        <style>{gooCss(t, g)}</style>
        <svg
          width="0"
          height="0"
          aria-hidden="true"
          style={{ position: "absolute" }}
        >
          <filter id={goo} x="-25%" y="-15%" width="150%" height="130%">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={g.blur}
              result="b"
            />
            <feColorMatrix
              in="b"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
            />
          </filter>
        </svg>
        <div className="cg-goo" style={{ filter: gooFilter(goo, g) }}>
          {stops.map((s, i) => (
            <i key={s.id} className={i === here ? "is-here" : undefined}>
              <span>{s.label}</span>
            </i>
          ))}
        </div>
        <ol>
          {stops.map((s, i) => {
            const read = !pinned && i === at;
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
