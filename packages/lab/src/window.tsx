"use client";

import {
  Suspense,
  createContext,
  lazy,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { loaders } from "./loaders";
import { loadSounds, playLater } from "./play-later";
import { BLUE } from "./style";
import {
  FADE_EASE,
  LIFT_EASE,
  REVEAL_EASE,
  WINDOW_EASE,
  moveMs,
  paperCurl,
  paperLight,
  paperShadow,
  paperSheet,
  paperVeil,
  reverseEase,
  thrown,
  useWindowTuning,
  windowEase,
  type WindowTuning,
} from "./window-tuning";

/**
 * The project window: a case study opened beside the signs rather than
 * navigated to. The wall's left strip stays — the rail — and turns into
 * the way home plus the open page's table of contents, while the
 * project takes the rest of the screen as one big box: a sheet of
 * white paper with Julio's scan as its texture (`sheet`, `ground`,
 * `grain`), set in from the mat's top, right and bottom by a
 * margin so the mat shows around it, lying on the mat under its
 * shadows with one corner a little off it. The whole case study lives
 * inside it and scrolls there — through the sheet, which scrolls with
 * it. (The type is left alone: the ink looks are parked in ink.tsx,
 * and only /lab/sheet puts them on.)
 * The signs stay where they are in the rail, over the box's edge, and
 * are the switcher; the window knows nothing about them — the caller
 * keeps them above it (a z-index past the window's 80) and tells the
 * window how wide the rail is.
 *
 * The box IS the print, picked up: the caller hands it the print
 * (`from`, see clipPreview(): where it is on the mat, its lean, the
 * frame round its picture, what it plays, the frame it is on and a
 * snapshot of that frame), the box starts as that print to the pixel —
 * the same paper, the clip inset by the same frame, turned by the same
 * lean, under the same shadow — and in one eased move (`lift`) grows to
 * its place while the lean straightens, the frame closes round the
 * clip and the shadow lifts and settles (Julio, 2026-09-25: "picked up
 * and brought close"); once it has landed the page prints in over the
 * clip. Closing runs it backwards: the page fades, the box shrinks and
 * leans back onto the print, and it is gone. (`move: "grow"` keeps the
 * earlier way, Convertr's bounding box: one axis, then the other, on
 * Convertr's curve.) Without a print to come from (a Back that
 * reopens, a page of its own) the box is simply there, or fades. Big
 * surfaces ease; they don't cut.
 *
 * The rail holds a slot the page inside fills with its contents
 * (`useWindowRail()`), under the brand plate's foot (--brand-foot, from
 * brand.tsx: the plate is the site's home mark, fixed in
 * the corner — the landing's own while the window is over the landing,
 * the window's, a link to `closeHref`, when it is a page of its own);
 * `foot` keeps the slot clear of whatever the caller parks at the
 * rail's bottom. The empty rail, the margins, Esc and the caller's own
 * close all shut it. On a phone there is no rail and no margin: the
 * box is edge to edge and the slot is never filled.
 *
 * `WindowTuning` (window-tuning.ts, shared with the landing so the
 * signs move on the same clock) is the set of knobs; /lab/paper,
 * /lab/sheet and /lab/window are its benches, and <ProjectWindow> regenerates its stylesheet on every
 * change. The window is only the chrome: the page inside is the
 * caller's (`children`), which can find the box's scroller through
 * `useWindowScroller()` for anything scroll-driven.
 */

// -------------------------------------------------------- the stylesheet

/** From this viewport width there is a rail and a margin; under it the
 *  box is the whole screen. */
const RAIL_FROM = 701;
/** A hairline round the clip: the box starts with it on the grow. */
const CLIP_EDGE = `inset 0 0 0 1px ${BLUE}`;
/** The sheet in the air, mid-lift: a wide soft shadow, the same six
 *  layers in the same order as the paper's at rest (paperShadow(), the
 *  print's and the sheet's alike), so the move interpolates layer by
 *  layer: hairline,
 *  contact, soft, lip, then the cut edge's light and shade (inset,
 *  last). In the air there is no lip and no lit edge. */
const LIFT_SHADOW =
  "0 0 0 1px rgba(43, 39, 34, .08), 0 14px 28px rgba(0, 0, 0, .14), 0 64px 120px rgba(0, 0, 0, .3), 0 0 0 0 rgba(0, 0, 0, 0), inset 0 0 0 0 rgba(0, 0, 0, 0), inset 0 0 0 0 rgba(0, 0, 0, 0)";
/** The box's own inset for the clip: none. */
const CLIP_FULL = { left: "0px", top: "0px", width: "100%", height: "100%" };

const n = (v: number, d = 3) => Number(v.toFixed(d)).toString();

/** The corners as positions: where the lifted corner is, and the one
 *  across from it, that the lift's shadow is thrown away from. */
const CORNER = {
  br: { at: "100% 100%", dx: 1, dy: 1 },
  bl: { at: "0% 100%", dx: -1, dy: 1 },
  tr: { at: "100% 0%", dx: 1, dy: -1 },
  tl: { at: "0% 0%", dx: -1, dy: -1 },
} as const;

/** Room round the box for the lifted corner's shadow, px. */
const LIFT_ROOM = 80;

/** A small deterministic random, so a seed always cuts the same edge. */
function random(seed: number) {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** How far apart the cut's points are along an edge, px. */
const CUT_STEP = 8;

/**
 * The sheet's outline for a box of w × h px: a rectangle with its
 * corners rounded by `corner`, each edge wandering in from the straight
 * line by up to twice `wobble` — a slow wander of `waves` swells, two
 * sines out of step so it never repeats — with `rough` px of jitter
 * point to point, both tapering to nothing at the corners so the arcs
 * join. Inward only: nothing can be drawn outside the box. Straight
 * edges (no wobble, no rough) still get the path, for the corners and
 * the edge. As an SVG path in px, for clip-path and the edge's SVG.
 */
function sheetPath(w: number, h: number, t: WindowTuning): string {
  const r = Math.max(0, Math.min(t.corner, w / 4, h / 4));
  const rnd = random(Math.round(t.seed));
  const d: string[] = [];
  const pt = (x: number, y: number) => `${n(x, 1)} ${n(y, 1)}`;
  // One edge from (x0, y0) to (x1, y1), its inward normal (nx, ny).
  const edge = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    nx: number,
    ny: number,
  ) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.round(len / CUT_STEP));
    const p1 = rnd() * Math.PI * 2;
    const p2 = rnd() * Math.PI * 2;
    for (let i = 1; i < steps; i++) {
      const u = i / steps;
      const taper = Math.min(1, u * 6, (1 - u) * 6);
      const slow =
        0.5 +
        0.5 *
          (0.65 * Math.sin(Math.PI * 2 * t.waves * u + p1) +
            0.35 * Math.sin(Math.PI * 2 * t.waves * 1.73 * u + p2));
      const off = taper * (2 * t.wobble * slow + t.rough * (rnd() * 2 - 1));
      d.push(
        `L${pt(x0 + (x1 - x0) * u + nx * off, y0 + (y1 - y0) * u + ny * off)}`,
      );
    }
    d.push(`L${pt(x1, y1)}`);
  };
  const arc = (x: number, y: number) =>
    `A${n(r, 1)} ${n(r, 1)} 0 0 1 ${pt(x, y)}`;
  d.push(`M${pt(r, 0)}`);
  edge(r, 0, w - r, 0, 0, 1);
  if (r > 0) d.push(arc(w, r));
  edge(w, r, w, h - r, -1, 0);
  if (r > 0) d.push(arc(w - r, h));
  edge(w - r, h, r, h, 0, -1);
  if (r > 0) d.push(arc(0, h - r));
  edge(0, h - r, 0, r, 1, 0);
  if (r > 0) d.push(arc(r, 0));
  d.push("Z");
  return d.join("");
}

/**
 * The whole stylesheet for a tuning. The notes are here rather than in
 * the CSS, where they would ship to every page with the window:
 *
 * - The window: the whole screen, nothing painted; only what is in the
 *   rail takes the pointer, and the rest of it is the way out.
 * - The box: at its place (--pw-x/y/w/h), clipped to its corners, the
 *   sheet of paper: the ground, the scan over it as wide as the box
 *   and tiling downward (it is made seamless), and a veil of the
 *   ground over the scan as strong as the grain is weak — the paper's
 *   layers (window-tuning.ts), which the prints wear too, so the
 *   pick-up keeps its paper; a light on the lifted corner. The scroller lays the
 *   same paper stuck to its content, so the page scrolls through the
 *   sheet rather than over it. The move animates its edges, lean and shadow from
 *   the print's, by script (see move()), so nothing here moves it. Its
 *   hairline, contact shadow, soft shadow and lip are in its shadow,
 *   which the move animates from the print's. It isolates, so anything
 *   printed into it (a photo multiplied) blends with the paper and no
 *   further.
 * - The shape (`has-shape`, once the box has landed on a screen with
 *   a rail): the sheet as cut, not drawn — its outline a path in px
 *   (sheetPath()) the box, the under-sheet and the edge all follow.
 *   The box is clipped to it (which takes its box-shadow with it), so
 *   the shadows move to the under-sheet: the same rect, casting the
 *   contact, soft and lip shadows as drop-shadows of a child painted
 *   the ground's colour and clipped to the cut, so they follow the cut
 *   edge (a box-shadow follows the box). The clip is on the child and
 *   the filter on the parent on purpose: an element's filter is applied
 *   before its own clip-path, so a clip on the same element would take
 *   the shadow away with everything outside the cut — which is how the
 *   sheet lost its shadow (2026-09-26). The edge is an SVG of the same path inside the
 *   box: the hairline, and the cut edge's light shifted down-right
 *   (so only its top and left show inside the clip) and its shade
 *   shifted up-left (bottom and right). Never during the move — the
 *   path is in px of the landed box — and never on a phone.
 * - The lift: the corner not quite flat. A sibling under the box (the
 *   box clips its own children), the box's rect grown by LIFT_ROOM all
 *   round, masked to fade out from that corner; inside it, the box's
 *   rect shifted toward the corner casts the corner's shadow, thrown
 *   further and softer than the sheet's own. Nothing until the box has
 *   landed (the move doesn't carry it), gone before the way back.
 * - The scroller: sized to the box's landed size, not the box, so the
 *   page lays out once, at full size, while the box grows round it.
 *   Nothing behind the page but the paper (transparent), so the page
 *   is printed on the sheet. Hidden until the box has landed, then
 *   dissolved in over `reveal` as the clip dissolves out (it would
 *   show through otherwise); out again on the quick `fade`. No
 *   scrollbar (Julio, 2026-09-22); it still scrolls. No z-index of its
 *   own — it paints over the clip by order — so it is no stacking
 *   context and a blend on the page reaches the paper.
 * - The light: over the page, one layer soft-lit onto it — the light
 *   falling across the sheet from `lightAngle` (a touch brighter where
 *   it comes from, darker across), and the sheet's edges darkening
 *   as they curl down to the mat (`curl`). Static, the compositor's
 *   work; in with the page, out with it, so the lift is not lit twice.
 * - The page's entrances (type.tsx's <Reveal>, `.ty-in`) are held on
 *   their first frame until the box has landed, so the title and the
 *   intro rise as the page dissolves in rather than having played,
 *   unseen, under the clip.
 * - The clip: the print's video, filling the box (the lift starts it
 *   inset by the print's frame, by script); under the page once it is
 *   in. It softens, eases forward a touch and goes as the page covers
 *   it, so the two read as one move, not a swap — and comes back sharp
 *   on the page's fade out, so the box shrinks onto a clear print.
 * - The box's left edge: the rail, less the overhang — the open sign
 *   reaches a little over it (the signs sit above the window) — then
 *   moved by `sheetX` / `sheetY`; its size is measured from the
 *   unmoved place, so moving the sheet never resizes it.
 * - The rail's things fade in with the page and out with it, on the
 *   same fade; nothing pops.
 * - The way home is the brand plate, in the corner (see above).
 * - A page of its own (/work/<slug>): the box is simply there.
 * - Leaving: the way in, backwards (Julio, 2026-09-26). Everything the
 *   landing did runs in reverse, on its own clock and on its curve
 *   reversed (reverseEase): the page dissolves out over the reveal as
 *   the clip sharpens back in, the rail going in the reveal's last
 *   `fade`, as it came in over the first; then the cut is taken off
 *   and the box shrinks (script). Plays while the window is still
 *   mounted.
 */
function windowCss(t: WindowTuning): string {
  const fade = n(t.fade, 0);
  const reveal = n(t.reveal, 0);
  // The way back is the way in reversed: the same clocks, the curves
  // turned end for end, and the rail, which came in over the reveal's
  // first `fade`, going in its last.
  const inEase = REVEAL_EASE;
  const outEase = reverseEase(REVEAL_EASE);
  const railOut = `${fade}ms ${reverseEase(FADE_EASE)} ${n(Math.max(0, t.reveal - t.fade), 0)}ms`;
  const corner = t.liftCorner === "none" ? null : CORNER[t.liftCorner];
  // The paper: the veil, the sheet tiling downward at the box's width,
  // the ground. The box shows it while the page is not yet in; the
  // page's scroller carries the same, stuck to its content, so the
  // page scrolls through the sheet (Julio, 2026-09-26) — at rest the
  // two are one, so the page's fade-in shows no change of paper.
  const sheet = paperSheet(t);
  const veil = paperVeil(t);
  // The shadows the cut sheet casts, thrown the tuning's way. A
  // drop-shadow's blur is the deviation itself where a box-shadow's is
  // twice it, hence the halves.
  const contact = thrown(t, t.contactY);
  const soft = thrown(t, t.softY);
  const paper = [
    veil,
    corner &&
      `radial-gradient(ellipse 45% 45% at ${corner.at}, rgba(255, 255, 255, ${n(t.liftLight)}), transparent)`,
    sheet,
    t.ground,
  ]
    .filter(Boolean)
    .join(", ");
  return `
.pw { --pw-rail: ${n(t.rail)}vw; --pw-inset: 24px; --pw-foot: 0px; --pw-margin: 0px; --pw-over: 0px; --pw-corner: 0px; --pw-x: 0px; --pw-y: 0px; --pw-w: 100vw; --pw-h: 100dvh; position: fixed; inset: 0; z-index: 80; }
.pw-box { position: absolute; left: var(--pw-x); top: var(--pw-y); width: var(--pw-w); height: var(--pw-h); overflow: hidden; isolation: isolate; border-radius: var(--pw-corner); background: ${paper}; box-shadow: ${paperShadow(t)}; transform: rotate(${n(t.tilt, 2)}deg); transform-origin: 50% 50%; }
.pw-box:focus { outline: none; }
.pw-under { display: none; position: absolute; left: var(--pw-x); top: var(--pw-y); width: var(--pw-w); height: var(--pw-h); pointer-events: none; transform: rotate(${n(t.tilt, 2)}deg); transform-origin: 50% 50%; filter: drop-shadow(${n(contact.x, 1)}px ${n(contact.y, 1)}px ${n(t.contactBlur / 2, 2)}px rgba(0, 0, 0, ${n(t.contactAlpha)})) drop-shadow(${n(soft.x, 1)}px ${n(soft.y, 1)}px ${n(t.softBlur / 2, 2)}px rgba(0, 0, 0, ${n(t.softAlpha)})) drop-shadow(0 1px 0 rgba(43, 39, 34, ${n(t.lip)})); }
.pw-under::before { content: ""; position: absolute; inset: 0; background: ${t.ground}; clip-path: var(--pw-shape); }
.pw.has-shape .pw-under { display: block; }
.pw.has-shape .pw-box { clip-path: var(--pw-shape); box-shadow: none; }
.pw-edge { display: none; position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; fill: none; stroke-linejoin: round; }
.pw.has-shape .pw-edge { display: block; }
.pw-edge-hair { stroke: rgba(43, 39, 34, ${n(t.hairline)}); stroke-width: 2; }
.pw-edge-light { stroke: rgba(255, 255, 255, ${n(t.cutLight)}); stroke-width: 1.4; transform: translate(.7px, .7px); }
.pw-edge-shade { stroke: rgba(0, 0, 0, ${n(t.edgeShade)}); stroke-width: 1.4; transform: translate(-.7px, -.7px); }
.pw-lift { display: none; }
${
  corner
    ? `@media (min-width: ${RAIL_FROM}px) { .pw-lift { display: block; } }
.pw-lift { position: absolute; left: calc(var(--pw-x) - ${LIFT_ROOM}px); top: calc(var(--pw-y) - ${LIFT_ROOM}px); width: calc(var(--pw-w) + ${2 * LIFT_ROOM}px); height: calc(var(--pw-h) + ${2 * LIFT_ROOM}px); pointer-events: none; -webkit-mask-image: radial-gradient(ellipse 60% 60% at ${corner.at}, #000, transparent); mask-image: radial-gradient(ellipse 60% 60% at ${corner.at}, #000, transparent); transform: rotate(${n(t.tilt, 2)}deg); transform-origin: 50% 50%; opacity: 0; transition: opacity ${fade}ms ease; }
.pw-lift::before { content: ""; position: absolute; inset: ${LIFT_ROOM}px; border-radius: var(--pw-corner); transform: translate(${n(corner.dx * t.liftAmount, 1)}px, ${n(corner.dy * t.liftAmount, 1)}px); box-shadow: 0 ${n(t.liftAmount / 2, 1)}px ${n(t.liftBlur, 1)}px rgba(0, 0, 0, ${n(t.liftShade)}); }
.pw.is-in .pw-lift { opacity: 1; transition: opacity ${reveal}ms ${inEase}; }
.pw.is-page .pw-lift { transition: none; }
.pw.is-leaving .pw-lift { opacity: 0; transition: opacity ${reveal}ms ${outEase}; }`
    : ""
}
.pw-scroll { position: absolute; top: 0; left: 0; width: var(--pw-w); height: var(--pw-h); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; background: ${veil}, ${sheet}, ${t.ground}; background-attachment: local; opacity: 0; transition: opacity ${fade}ms ease; }
.pw-scroll::-webkit-scrollbar { display: none; }
.pw.is-in .pw-scroll { opacity: 1; transition: opacity ${reveal}ms ${inEase}; }
.pw.is-page .pw-scroll { transition: none; }
.pw-light { position: absolute; inset: 0; pointer-events: none; border-radius: var(--pw-corner); background: ${paperLight(t)}; box-shadow: ${paperCurl(t)}; mix-blend-mode: soft-light; opacity: 0; transition: opacity ${fade}ms ease; }
.pw.is-in .pw-light { opacity: 1; transition: opacity ${reveal}ms ${inEase}; }
.pw.is-page .pw-light { transition: none; }
.pw.is-leaving .pw-light { opacity: 0; transition: opacity ${reveal}ms ${outEase}; }
.pw:not(.is-in) .pw-scroll .ty-in { animation-play-state: paused; }
.pw-clip { position: absolute; inset: 0; z-index: 0; display: block; width: 100%; height: 100%; object-fit: cover; background: #ecebe8; transition: filter ${fade}ms ease, transform ${fade}ms ease, opacity ${fade}ms ease; }
.pw.is-in .pw-clip { filter: blur(8px); transform: scale(1.03); opacity: 0; transition: filter ${reveal}ms ${inEase}, transform ${reveal}ms ${inEase}, opacity ${reveal}ms ${inEase}; }
.pw.is-leaving .pw-clip { filter: none; transform: none; opacity: 1; transition: filter ${reveal}ms ${outEase}, transform ${reveal}ms ${outEase}, opacity ${reveal}ms ${outEase}; }
.pw-rail { display: none; }
@media (min-width: ${RAIL_FROM}px) {
  .pw { --pw-margin: ${n(t.margin, 0)}px; --pw-over: ${n(t.overhang, 2)}vh; --pw-corner: ${n(t.corner, 0)}px; --pw-left: calc(var(--pw-rail) - var(--pw-over)); --pw-x: calc(var(--pw-left) + ${n(t.sheetX, 2)}vw); --pw-w: calc((100vw - var(--pw-left) - var(--pw-margin)) * ${n(t.sheetW)}); --pw-h: calc((100dvh - 2 * var(--pw-margin)) * ${n(t.sheetH)}); --pw-y: calc(var(--pw-margin) + (100dvh - 2 * var(--pw-margin)) * ${n((1 - t.sheetH) / 2)} + ${n(t.sheetY, 2)}vh); }
  .pw-rail { display: block; position: absolute; top: 0; bottom: 0; left: 0; width: var(--pw-rail); }
  .pw-rail-in { position: absolute; top: var(--brand-foot, 3.5vh); bottom: var(--pw-foot); left: var(--pw-inset); right: calc(20px + var(--pw-over)); display: flex; flex-direction: column; align-items: flex-start; gap: 22px; overflow-y: auto; scrollbar-width: none; pointer-events: none; opacity: 0; transition: opacity ${fade}ms ease; }
  .pw.is-in .pw-rail-in { opacity: 1; }
  .pw.is-page .pw-rail-in { transition: none; }
  .pw.is-leaving .pw-rail-in { opacity: 0; transition: opacity ${railOut}; }
  .pw-rail-in::-webkit-scrollbar { display: none; }
  .pw-rail-in > * { flex: none; max-width: 100%; pointer-events: auto; }
  /* The contents stand on the mat: white. */
  .pw-rail-slot { --ct-ink: #fff; }
  .pw-rail-slot:empty { display: none; }
}
.pw.is-leaving .pw-scroll { opacity: 0; transition: opacity ${reveal}ms ${outEase}; }
.pw.is-leaving .pw-rail-in { pointer-events: none; }
@media (prefers-reduced-motion: reduce) {
  .pw-scroll, .pw.is-in .pw-scroll, .pw.is-leaving .pw-scroll, .pw-rail-in, .pw-clip, .pw.is-in .pw-clip, .pw.is-leaving .pw-clip, .pw-lift, .pw.is-in .pw-lift, .pw.is-leaving .pw-lift, .pw-light, .pw.is-in .pw-light, .pw.is-leaving .pw-light, .pw.is-leaving .pw-rail-in { transition-duration: 1ms; transition-delay: 0ms; }
}
`;
}

// ------------------------------------------- the scroller and the rail

const ScrollerContext = createContext<HTMLElement | null>(null);
const RailContext = createContext<HTMLElement | null>(null);
const PreviewContext = createContext<WindowPreview | null>(null);

/** The clip the box grew out of, for the page inside: a page whose
 *  opening plays the same file (Camper's film) starts it at the clip's
 *  time, so the dissolve from one to the other shows no jump. Null
 *  when the box didn't grow out of a clip. */
export function useWindowPreview(): WindowPreview | null {
  return useContext(PreviewContext);
}

/** The box's scroller, for the page inside the window — the root for
 *  anything that watches the scroll. Null before the box mounts. */
export function useWindowScroller(): HTMLElement | null {
  return useContext(ScrollerContext);
}

/** The rail's slot, under Home: the page inside portals its contents
 *  into it. Null before the window mounts, and outside a window; on a
 *  phone it is there but never shown. */
export function useWindowRail(): HTMLElement | null {
  return useContext(RailContext);
}

// ---------------------------------------------------- the grow and shrink

/** A rectangle on the screen, in px. */
type WindowRect = { x: number; y: number; w: number; h: number };

/** The print the box grows out of and shrinks back into: its clip,
 *  where it is on the mat and what it plays. */
export type WindowPreview = {
  rect: WindowRect;
  /** The clip's src; the box plays it, muted, while it moves. */
  src: string;
  /** Where the clip was, s: the box's copy starts there, so the frame
   *  never jumps. */
  time?: number;
  /** That frame, as a data URL: shown until the box's copy has it. */
  poster?: string;
  /** When `time` was read, performance.now() ms: anything that picks
   *  the clip up later adds what has played since (see clipTimeNow). */
  at?: number;
  /** The print's own video: on the way out the box hands its progress
   *  back, so the print carries on from there. */
  video?: HTMLVideoElement;
  /** A print's lean on the mat, degrees: the box starts turned by it and
   *  straightens as it lifts. 0 for a clip with no frame. */
  tilt?: number;
  /** A print's frame round its picture, px — the paper above, right of,
   *  below (the band) and left of the clip. The box starts as the whole
   *  print with the clip inset by this, and the inset closes as it
   *  grows. All 0 for a bare clip. */
  inset?: { top: number; right: number; bottom: number; left: number };
};

/** Where a clip that kept playing since `preview` was taken is now, s. */
export function clipTimeNow(preview: WindowPreview): number {
  const since = preview.at ? (performance.now() - preview.at) / 1000 : 0;
  return (preview.time ?? 0) + since;
}

/**
 * A print's clip as the window wants it: its rect on the mat (the
 * caller's, which may have to undo a transform), the file, the frame
 * it is on, and a snapshot of that frame so the box shows the very
 * same picture from its first paint while its own copy seeks there.
 */
export function clipPreview(
  video: HTMLVideoElement,
  rect: WindowRect,
  extra: Pick<WindowPreview, "tilt" | "inset"> = {},
): WindowPreview {
  let poster: string | undefined;
  if (video.videoWidth > 0 && video.readyState >= 2) {
    try {
      const c = document.createElement("canvas");
      c.width = video.videoWidth;
      c.height = video.videoHeight;
      c.getContext("2d")?.drawImage(video, 0, 0);
      poster = c.toDataURL("image/jpeg", 0.85);
    } catch {
      poster = undefined;
    }
  }
  return {
    rect,
    src: video.currentSrc || video.src,
    time: video.currentTime,
    poster,
    at: performance.now(),
    video,
    ...extra,
  };
}

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const place = (el: HTMLElement): WindowRect => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};

/** A few animations run as one: the way to cancel them together. */
const together = (list: Animation[]) => () => list.forEach((a) => a.cancel());

/**
 * Moves the box between the print's rect and its own place: `to` the
 * box's place (the pick-up) or from it (the way back).
 *
 * The way back is the way in played backwards in time, not a move of
 * its own (Julio, 2026-09-26): the very same keyframes, curves and
 * delays, run with `direction: "reverse"` — so the curve is reversed
 * too, the overshoot the pick-up ends on is what the way back starts
 * with, and its wind-up is how it ends — and each axis starts when the
 * other one's reverse leaves it.
 *
 * The lift: the box starts as the print — its rect, its lean (a
 * rotation about the centre, which is what the caller measured), its
 * shadow, the clip inset by its frame — and everything goes to the
 * box's own in one move on the lift's curve: the edges, the lean to 0,
 * the shadow through the lifted one at mid-way, and the clip's inset
 * to none (a second animation, on the clip).
 *
 * The grow (Convertr's move): the box is landscape, so the width goes
 * first and the height follows after `lag`, each axis on Convertr's
 * curve for `duration` ms; backwards, the height goes first and the
 * width follows after `lag`. The hairline goes from the clip's blue to
 * the box's own with the width, and the corners with it.
 *
 * The box's place is read off its CSS before the animations lay over
 * it, so the keyframes follow whatever the tuning and the viewport say;
 * its skin is the paper's shadow (paperShadow), not the computed one,
 * which the cut takes away while it is on. Without a print the box
 * fades and settles instead. Returns the way to cancel it.
 */
function move(
  box: HTMLElement,
  clip: HTMLElement | null,
  from: WindowPreview | null,
  to: "open" | "shut",
  t: WindowTuning,
): () => void {
  const still = reduced();
  const lift = t.move === "lift";
  const dur = still ? 1 : lift ? t.lift : t.duration;
  const wait = still || lift ? 0 : t.lag;
  const open = to === "open";
  // In: held at the print through a delay, then the stylesheet has the
  // box. Back: held at the box's place through a delay, and at the
  // print once done, until the window goes.
  const timing = (easing: string, delay = 0): KeyframeAnimationOptions => ({
    duration: dur,
    delay,
    easing,
    fill: open ? "backwards" : "both",
    direction: open ? "normal" : "reverse",
  });
  if (!from) {
    const away = { opacity: 0, transform: "scale(.97)" };
    const at = { opacity: 1, transform: "none" };
    return together([
      box.animate([away, at], {
        ...timing(windowEase(t)),
        duration: dur + wait,
      }),
    ]);
  }
  const cs = getComputedStyle(box);
  const own = place(box);
  const r = from.rect;
  if (lift) {
    const inset = from.inset ?? { top: 0, right: 0, bottom: 0, left: 0 };
    const start: Keyframe = {
      left: `${r.x}px`,
      top: `${r.y}px`,
      width: `${r.w}px`,
      height: `${r.h}px`,
      transform: `rotate(${from.tilt ?? 0}deg)`,
      // The print is the same paper: its corners and its shadow.
      borderRadius: `${t.corner}px`,
      boxShadow: paperShadow(t),
    };
    const mid: Keyframe = { offset: 0.45, boxShadow: LIFT_SHADOW };
    const end: Keyframe = {
      left: `${own.x}px`,
      top: `${own.y}px`,
      width: `${own.w}px`,
      height: `${own.h}px`,
      transform: `rotate(${t.tilt}deg)`,
      borderRadius: cs.borderRadius,
      boxShadow: paperShadow(t),
    };
    const list = [box.animate([start, mid, end], timing(LIFT_EASE))];
    if (clip) {
      const framed: Keyframe = {
        left: `${inset.left}px`,
        top: `${inset.top}px`,
        width: `calc(100% - ${inset.left + inset.right}px)`,
        height: `calc(100% - ${inset.top + inset.bottom}px)`,
      };
      list.push(clip.animate([framed, CLIP_FULL], timing(LIFT_EASE)));
    }
    return together(list);
  }
  // Each axis as [at the clip, at the box's place]; the skin rides on
  // the width.
  const x: Keyframe[] = [
    {
      left: `${r.x}px`,
      width: `${r.w}px`,
      borderRadius: "0px",
      boxShadow: CLIP_EDGE,
    },
    {
      left: `${own.x}px`,
      width: `${own.w}px`,
      borderRadius: cs.borderRadius,
      boxShadow: paperShadow(t),
    },
  ];
  const y: Keyframe[] = [
    { top: `${r.y}px`, height: `${r.h}px` },
    { top: `${own.y}px`, height: `${own.h}px` },
  ];
  // In, the width at 0 and the height after `lag`; backwards, the
  // height at 0 and the width after `lag`.
  return together([
    box.animate(x, timing(WINDOW_EASE, open ? 0 : wait)),
    box.animate(y, timing(WINDOW_EASE, open ? wait : 0)),
  ]);
}

// --------------------------------------------------------- the component

/** Where the rail's things go, as CSS lengths — the caller's, since
 *  they follow what it keeps in the rail. */
export type WindowLayout = {
  /** The rail's width: where the box's left edge is. */
  rail?: string;
  /** The rail's content, from the screen's left edge. */
  inset?: string;
  /** Kept free at the rail's bottom. */
  foot?: string;
};

type ProjectWindowProps = {
  /** The open project's slug: a change starts the next page at its top. */
  active: string;
  /** Flip to false to close: the exit plays, then the window unmounts
   *  itself. */
  shown: boolean;
  /** "modal" (default): over the page, with the entrance; the empty
   *  rail asks to close — on the landing, a step back in the history,
   *  to the projects. "page": the window is the page — no entrance;
   *  the brand plate in the corner is a link to `closeHref`. */
  mode?: "modal" | "page";
  /** Modal mode: the clip the box grows out of on mount, and shrinks
   *  back into on close — read at close time, so the caller can keep
   *  it pointed at the open project's print. Null: fade instead. */
  from?: WindowPreview | null;
  /** For the dialog's name: the open project's title. */
  label: string;
  layout?: WindowLayout;
  /** Page mode: where the brand plate goes — home. */
  closeHref?: string;
  /** Modal mode: the window asks to close. */
  onClose?: () => void;
  children?: ReactNode;
};

/** The brand plate, the way home when the window is a page of its own
 *  (a piece, so through the loaders like everywhere else). */
const BrandSign = lazy(loaders["brand-sign"]);

/**
 * The box, the rail and the controls. The page inside is `children`;
 * on a switch it is up to the caller to render the next page (keyed, so
 * its entrances play) — the window scrolls back to the top. Focus goes
 * to the box on open and back where it was on close; the page behind
 * stops scrolling while the window is up.
 */

export function ProjectWindow({
  active,
  shown,
  mode = "modal",
  from = null,
  label,
  layout,
  closeHref,
  onClose,
  children,
}: ProjectWindowProps) {
  const t = useWindowTuning();
  const page = mode === "page";
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const [rail, setRail] = useState<HTMLElement | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const clip = useRef<HTMLVideoElement>(null);
  /** When the clip was paused under the page, performance.now() ms. */
  const pausedAt = useRef<number | null>(null);
  // What the caller says now: the box shrinks back into this. Kept in
  // the commit, ahead of every effect below that reads it.
  const latest = useRef(from);
  useLayoutEffect(() => {
    latest.current = from;
  });

  // Derived during render, the cue's way: a flip to hidden starts the
  // exit, which keeps the window mounted while it plays; a flip to
  // shown starts over — the box grows out of the clip of that moment
  // and the page waits for it to land.
  const [prevShown, setPrevShown] = useState(shown);
  const [leaving, setLeaving] = useState(false);
  /** The clip the box grew out of. */
  const [opened, setOpened] = useState(from);
  /** The box has landed: the page fades in over the clip. */
  const [landed, setLanded] = useState(page);
  /** The sheet's outline in px of the landed box, or none (moving, or
   *  a phone). */
  const [shape, setShape] = useState<string | null>(null);
  /** On the way back, the page is out and the box is shrinking: the
   *  cut is off, as it was before the box landed. */
  const [shrinking, setShrinking] = useState(false);
  if (shown !== prevShown) {
    setPrevShown(shown);
    setLeaving(!shown);
    setShrinking(false);
    if (shown) {
      setOpened(from);
      setLanded(page);
    }
  }

  const mounted = shown || leaving;
  const still = reduced();
  // The grow and the shrink take the same, the whole move.
  const grow = still ? 1 : moveMs(t);
  const reveal = still ? 1 : t.reveal;

  // The entrance, each time the box is put up: it grows out of the
  // clip, then the page comes in and the clip stops.
  useLayoutEffect(() => {
    const el = box.current;
    if (!mounted || page || !el) return;
    // Asked to play, not left to autoplay: React sets `muted` as a
    // property, which the autoplay policy doesn't always see.
    void clip.current?.play().catch(() => {});
    // Picked up: the paper's breath, with the move.
    if (latest.current) playLater("lift", 1, "card");
    const cancel = move(el, clip.current, latest.current, "open", t);
    const land = window.setTimeout(() => setLanded(true), grow);
    const hold = window.setTimeout(() => {
      clip.current?.pause();
      pausedAt.current = performance.now();
    }, grow + reveal);
    return () => {
      cancel();
      window.clearTimeout(land);
      window.clearTimeout(hold);
    };
    // Plays once per mount of the box; the tuning is read then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, page]);

  // The exit, the entrance backwards: the page dissolves out over the
  // clip on the reveal's clock (the stylesheet), then the cut comes off
  // and the box shrinks back onto the print on the move's, then the
  // window is gone. The clip carries on from where
  // the project got to — the page's own copy of the same film if it
  // has one (Camper, scrubbed or not), else as if it had never paused
  // — and hands that back to the print, so it carries on too.
  useEffect(() => {
    if (!leaving) return;
    const v = clip.current;
    if (v) {
      const same = [...(scroller?.querySelectorAll("video") ?? [])].find(
        (f) => f.currentSrc && f.currentSrc === v.currentSrc,
      );
      if (same) v.currentTime = same.currentTime;
      else if (v.paused && pausedAt.current !== null) {
        const since = (performance.now() - pausedAt.current) / 1000;
        const d = v.duration;
        v.currentTime =
          d > 0 && Number.isFinite(d)
            ? (v.currentTime + since) % d
            : v.currentTime + since;
      }
      pausedAt.current = null;
      void v.play().catch(() => {});
    }
    // Timed from the first frame of the way back, which is when the
    // stylesheet's dissolve starts too: a busy main thread as the close
    // lands (the history step) holds both alike, so the box never
    // starts to shrink under a page still dissolving.
    let go = 0;
    let done = 0;
    const start = requestAnimationFrame(() => {
      go = window.setTimeout(() => {
        // Set back down: the breath falls, the sheet lands.
        if (latest.current) playLater("liftBack", 1, "card");
        setShrinking(true);
      }, reveal);
      done = window.setTimeout(() => {
        const print = latest.current?.video;
        if (print && clip.current) print.currentTime = clip.current.currentTime;
        setLeaving(false);
        setShrinking(false);
      }, reveal + grow);
    });
    return () => {
      cancelAnimationFrame(start);
      window.clearTimeout(go);
      window.clearTimeout(done);
    };
    // The scroller is read at the start of the exit only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving, reveal, grow, t]);

  // The shrink, in the commit that takes the cut off and before that
  // frame is painted: the cut's path is in px of the landed box, and
  // the box's own shadow is back as it starts to move.
  useLayoutEffect(() => {
    const el = box.current;
    if (!shrinking || !el) return;
    return move(el, clip.current, latest.current, "shut", t);
    // One shrink per way back; the tuning is read as it starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shrinking]);

  // The sheet's cut: measured once landed — the layout size, which the
  // lean does not change — and again whenever that size changes (the
  // screen, the knobs, a lab page showing its piece late) or the knobs
  // do; gone once the way back reaches the shrink, so the box shrinks
  // with its own shadow, as it grew.
  // Not on a phone, where the box is the screen.
  useEffect(() => {
    const el = box.current;
    if (!landed || shrinking || !el) {
      setShape(null);
      return;
    }
    const cut = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setShape(
        w > 0 && h > 0 && window.innerWidth >= RAIL_FROM
          ? sheetPath(w, h, t)
          : null,
      );
    };
    const ro = new ResizeObserver(cut);
    ro.observe(el);
    window.addEventListener("resize", cut);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", cut);
    };
  }, [landed, shrinking, t]);

  // The page behind holds still, Esc closes, and focus is kept: on the
  // box while the window is up, back where it was after.
  useEffect(() => {
    if (!mounted || page) return;
    const root = document.documentElement;
    const was = root.style.overflow;
    root.style.overflow = "hidden";
    const before = document.activeElement as HTMLElement | null;
    box.current?.focus({ preventScroll: true });
    return () => {
      root.style.overflow = was;
      before?.focus?.({ preventScroll: true });
    };
  }, [mounted, page]);
  useEffect(() => {
    if (!shown || page) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, page, onClose]);

  // A switch starts the next page at its top.
  useEffect(() => {
    if (scroller) scroller.scrollTop = 0;
  }, [active, scroller]);
  // A page of its own (/work/<slug>) has no synth yet: fetched on mount,
  // so the first click plays from the cache.
  useEffect(() => {
    void loadSounds();
  }, []);

  if (!mounted) return null;

  // The cut as drawn this render: off from the commit the shrink
  // starts in (the effect that clears it runs a frame later).
  const cut = shrinking ? null : shape;

  const close = () => {
    playLater("knock", 1, "click");
    onClose?.();
  };
  const vars = {
    ...(layout?.rail && { "--pw-rail": layout.rail }),
    ...(layout?.inset && { "--pw-inset": layout.inset }),
    ...(layout?.foot && { "--pw-foot": layout.foot }),
    ...(cut && { "--pw-shape": `path("${cut}")` }),
  } as CSSProperties;
  // The margins are the rail's kind of empty: a click on them closes.
  const onEmpty = (e: MouseEvent) => {
    if (!page && e.target === e.currentTarget) close();
  };
  // The clip in the box: the one it grew out of, or, on the way out,
  // the open project's — the caller keeps `from` pointed at it.
  const preview = leaving ? (from ?? opened) : opened;

  return (
    <div
      className={[
        "pw",
        page && "is-page",
        landed && "is-in",
        leaving && "is-leaving",
        cut && "has-shape",
      ]
        .filter(Boolean)
        .join(" ")}
      style={vars}
      data-cursor-label={page ? undefined : "close"}
      onClick={onEmpty}
    >
      <style>{windowCss(t)}</style>
      {page && closeHref && (
        <Suspense fallback={null}>
          <BrandSign controls={false} href={closeHref} />
        </Suspense>
      )}
      <div
        className="pw-rail"
        data-cursor-label={page ? undefined : "close"}
        onClick={onEmpty}
      >
        <div className="pw-rail-in">
          <div ref={setRail} className="pw-rail-slot" />
        </div>
      </div>
      {/* The lifted corner's shadow, under the box; then the sheet's
          own shadows, cast by its cut outline once it has landed. */}
      <div className="pw-lift" aria-hidden />
      <div className="pw-under" aria-hidden />
      <div
        ref={box}
        className="pw-box"
        role="dialog"
        aria-label={label}
        tabIndex={-1}
        // No tag over the box: the window's own is for the empty wall.
        data-cursor-label=""
      >
        {preview && (
          <video
            key={preview.src}
            ref={(el) => {
              clip.current = el;
              // Picks up where the print's copy is now; set before the
              // file is in, which the browser keeps as the start.
              if (el && preview.time !== undefined && !el.dataset.started) {
                el.dataset.started = "1";
                el.currentTime = clipTimeNow(preview);
              }
            }}
            className="pw-clip"
            src={preview.src}
            poster={preview.poster}
            preload="auto"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          />
        )}
        <div ref={setScroller} className="pw-scroll">
          <ScrollerContext.Provider value={scroller}>
            <RailContext.Provider value={rail}>
              <PreviewContext.Provider value={page ? null : opened}>
                {children}
              </PreviewContext.Provider>
            </RailContext.Provider>
          </ScrollerContext.Provider>
        </div>
        {/* The light across the sheet, and its edges curling down. */}
        <div className="pw-light" aria-hidden />
        {cut && (
          <svg className="pw-edge" aria-hidden>
            <path className="pw-edge-hair" d={cut} />
            <path className="pw-edge-light" d={cut} />
            <path className="pw-edge-shade" d={cut} />
          </svg>
        )}
      </div>
    </div>
  );
}
