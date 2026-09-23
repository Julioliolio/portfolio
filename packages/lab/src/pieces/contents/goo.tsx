"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
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
 * The goo column: the contents index as it stood on the site from
 * 2026-09-22 to 2026-09-23, kept as the bench's other column. Stops in
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
 * shared with the site's column. Nothing on the site reads this.
 */

export type GooTuning = {
  /** Which column the bench shows: the site's, or this. */
  column: "site" | "goo";
  /** A row's height, em, and the room beside the words. */
  row: number;
  side: number;
  /** The squircles' corners, em, and their shape. */
  corner: number;
  shape: "squircle" | "round";
  /** What holds the blue off its neighbours, each side, em. */
  gap: number;
  /** The goo's blur, px: how far two shapes reach for each other. */
  blur: number;
  /** The neighbours' slide, ms. */
  slide: number;
};

const GOO_DEFAULTS: Readonly<GooTuning> = Object.freeze({
  column: "site",
  row: 2.2,
  side: 1.4,
  corner: 0.2,
  shape: "squircle",
  gap: 0.5,
  blur: 3,
  slide: 0,
});

const store = createTuningStore("contents-goo", GOO_DEFAULTS);
export const setGooTuning = store.set;
export const resetGooTuning = store.reset;
export const useGooTuning = store.useTuning;

const n = (v: number, d = 3) => Number(v.toFixed(d)).toString();

/**
 * The rows and, under them, their shapes are two columns of the same
 * blocks, so the shapes follow the rows through every transition. The
 * row being read is held off from the others by the gap. Each block
 * carries its ink squircle and, over it, its blue one, off until the
 * block is the one being read; leaving, the blue fades faster than the
 * ink grows back, so the ink is seen inside it for a moment, and on the
 * spring the way back has no bounce. An ink squircle reaches a corner's
 * worth into any flush neighbour, so a run of them is one straight-sided
 * bar rather than a string of beads.
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
.cg { position: relative; display: block; width: max-content; max-width: 100%; color: #fff; font-family: ${MEDIUM}; font-weight: 500; font-size: ${n(t.size)}px; line-height: 1; letter-spacing: -.01em; }
.cg ol, .cg-goo { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.cg ol { position: relative; }
.cg-goo { position: absolute; inset: 0; pointer-events: none; }
.cg li, .cg-goo i { display: block; flex: none; height: ${n(g.row)}em; transition: margin ${slide}; }
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
.cg a { display: flex; align-items: center; height: 100%; padding: 0 ${n(g.side)}em; white-space: nowrap; color: #fff; text-decoration: none; outline: none; }
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
        <div className="cg-goo" style={{ filter: `url(#${goo})` }}>
          {stops.map((s, i) => (
            <i key={s.id} className={i === here ? "is-here" : undefined} />
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
