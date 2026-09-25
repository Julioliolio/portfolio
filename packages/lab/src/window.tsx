"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { asset } from "./asset";
import { loadSounds, playLater } from "./play-later";
import {
  BLUE,
  INK,
  MEDIUM,
  PAPER_BASE,
  PAPER_TILE,
  PAPER_TILE_SIZE,
  PRINT_SHADOW,
} from "./style";
import {
  LIFT_EASE,
  WINDOW_EASE,
  moveMs,
  useWindowTuning,
  windowEase,
  type WindowTuning,
} from "./window-tuning";

/**
 * The project window: a case study opened beside the signs rather than
 * navigated to. The wall's left strip stays — the rail — and turns into
 * the way home plus the open page's table of contents, while the
 * project takes the rest of the screen as one big box: a sheet of
 * paper (Julio's scan, `sheet`), square, set in from the mat's top,
 * right and bottom by a margin so the mat shows around it. The whole
 * case study lives inside it — printed on it, in one of three looks
 * (`media`) — and scrolls there.
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
 * The rail holds "Home" and a slot the page inside fills with its
 * contents (`useWindowRail()`); `foot` keeps both clear of whatever the
 * caller parks at the rail's bottom. The empty rail, the margins, Home,
 * Esc and the caller's own close all shut it. On a phone there is no
 * rail and no margin: the box is edge to edge and the slot is never
 * filled.
 *
 * `WindowTuning` (window-tuning.ts, shared with the landing so the
 * signs move on the same clock) is the set of knobs; /lab/window is
 * its bench, and <ProjectWindow> regenerates its stylesheet on every
 * change. The window is only the chrome: the page inside is the
 * caller's (`children`), which can find the box's scroller through
 * `useWindowScroller()` for anything scroll-driven.
 */

// -------------------------------------------------------- the stylesheet

/** The rail's resting text: white, a little back, on the mat. */
const FAINT = "rgba(255, 255, 255, .72)";
/** From this viewport width there is a rail and a margin; under it the
 *  box is the whole screen. */
const RAIL_FROM = 701;
/** The hover card's hairline round its clip: the box starts with it
 *  (grow). */
const CLIP_EDGE = `inset 0 0 0 1px ${BLUE}`;
/** The sheet in the air, mid-lift: a wide soft shadow, the same three
 *  layers as the print's and the sheet's at rest. */
const LIFT_SHADOW =
  "0 0 0 1px rgba(43, 39, 34, .08), 0 14px 28px rgba(0, 0, 0, .14), 0 64px 120px rgba(0, 0, 0, .3)";
/** The sheet's shadow at rest on the mat, for a hairline strength. */
const sheetShadow = (edge: number) =>
  `0 0 0 1px rgba(43, 39, 34, ${n(edge)}), 0 2px 6px rgba(0, 0, 0, .08), 0 24px 60px rgba(0, 0, 0, .18)`;
/** The box's own inset for the clip: none. */
const CLIP_FULL = { left: "0px", top: "0px", width: "100%", height: "100%" };

const n = (v: number, d = 3) => Number(v.toFixed(d)).toString();

/**
 * The whole stylesheet for a tuning. The notes are here rather than in
 * the CSS, where they would ship to every page with the window:
 *
 * - The window: the whole screen, nothing painted; only what is in the
 *   rail takes the pointer, and the rest of it is the way out.
 * - The box: at its place (--pw-x/y/w/h), clipped to its corners, the
 *   sheet of paper (its scan, covering it; the print's tile is the
 *   same paper at the same scale, so the pick-up keeps its grain). The
 *   move animates its edges, lean and shadow from the print's, by
 *   script (see move()), so nothing here moves it. Its hairline is in
 *   its shadow, which the move animates from the print's.
 * - The scroller: sized to the box's landed size, not the box, so the
 *   page lays out once, at full size, while the box grows round it.
 *   Nothing behind the page but the paper (transparent), so the page
 *   is printed on the sheet. Hidden until the box has landed, then
 *   dissolved in over `reveal` as the clip dissolves out (it would
 *   show through otherwise); out again on the quick `fade`. No
 *   scrollbar (Julio, 2026-09-22); it still scrolls.
 * - The looks (`media`): the grain over everything is a layer of the
 *   paper's tile laid over the scroller, multiplied in, that comes with
 *   the page; the whole page multiplied is the scroller itself blended
 *   into the box.
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
 *   reaches a little over it (the signs sit above the window).
 * - The rail's things fade in with the page and out with it, on the
 *   same fade; nothing pops.
 * - Home: the way back to the projects, in the page's own type.
 * - A page of its own (/work/<slug>): the box is simply there.
 * - Leaving: the page and the rail fade out, then the box shrinks
 *   (script). Plays while the window is still mounted.
 */
function windowCss(t: WindowTuning): string {
  const fade = n(t.fade, 0);
  const reveal = n(t.reveal, 0);
  return `
.pw { --pw-rail: ${n(t.rail)}vw; --pw-inset: 24px; --pw-foot: 0px; --pw-margin: 0px; --pw-over: 0px; --pw-corner: 0px; --pw-x: 0px; --pw-y: 0px; --pw-w: 100vw; --pw-h: 100dvh; position: fixed; inset: 0; z-index: 80; }
.pw-box { position: absolute; left: var(--pw-x); top: var(--pw-y); width: var(--pw-w); height: var(--pw-h); overflow: hidden; border-radius: var(--pw-corner); background: ${PAPER_BASE} url(${asset(`/paper/${t.sheet}.webp`)}) center / cover; box-shadow: ${sheetShadow(t.edge)}; transform-origin: 50% 50%; }
.pw-box:focus { outline: none; }
.pw-scroll { position: absolute; top: 0; left: 0; z-index: 1; width: var(--pw-w); height: var(--pw-h); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; background: transparent; opacity: 0; transition: opacity ${fade}ms ease; }
.pw-scroll::-webkit-scrollbar { display: none; }
.pw.is-in .pw-scroll { opacity: 1; transition: opacity ${reveal}ms cubic-bezier(.4, 0, .2, 1); }
.pw.is-page .pw-scroll { transition: none; }
.pw.is-multiply .pw-scroll { mix-blend-mode: multiply; }
.pw-grain { position: absolute; inset: 0; z-index: 2; pointer-events: none; background: url(${asset(PAPER_TILE)}) 0 0 / ${PAPER_TILE_SIZE} repeat; mix-blend-mode: multiply; opacity: 0; transition: opacity ${fade}ms ease; }
.pw.is-in .pw-grain { opacity: 1; transition: opacity ${reveal}ms cubic-bezier(.4, 0, .2, 1); }
.pw.is-page .pw-grain { transition: none; }
.pw.is-leaving .pw-grain { opacity: 0; }
.pw:not(.is-in) .pw-scroll .ty-in { animation-play-state: paused; }
.pw-clip { position: absolute; inset: 0; z-index: 0; display: block; width: 100%; height: 100%; object-fit: cover; background: #ecebe8; transition: filter ${fade}ms ease, transform ${fade}ms ease, opacity ${fade}ms ease; }
.pw.is-in .pw-clip { filter: blur(8px); transform: scale(1.03); opacity: 0; transition: filter ${reveal}ms cubic-bezier(.4, 0, .2, 1), transform ${reveal}ms cubic-bezier(.4, 0, .2, 1), opacity ${reveal}ms cubic-bezier(.4, 0, .2, 1); }
.pw.is-leaving .pw-clip { filter: none; transform: none; opacity: 1; transition: filter ${fade}ms ease, transform ${fade}ms ease, opacity ${fade}ms ease; }
.pw-rail { display: none; }
@media (min-width: ${RAIL_FROM}px) {
  .pw { --pw-margin: ${n(t.margin, 0)}px; --pw-over: ${n(t.overhang, 2)}vh; --pw-corner: ${n(t.corner, 0)}px; --pw-x: calc(var(--pw-rail) - var(--pw-over)); --pw-y: var(--pw-margin); --pw-w: calc(100vw - var(--pw-x) - var(--pw-margin)); --pw-h: calc(100dvh - 2 * var(--pw-margin)); }
  .pw-rail { display: block; position: absolute; top: 0; bottom: 0; left: 0; width: var(--pw-rail); }
  .pw-rail-in { position: absolute; top: 3.5vh; bottom: var(--pw-foot); left: var(--pw-inset); right: calc(20px + var(--pw-over)); display: flex; flex-direction: column; align-items: flex-start; gap: 22px; overflow-y: auto; scrollbar-width: none; pointer-events: none; opacity: 0; transition: opacity ${fade}ms ease; }
  .pw.is-in .pw-rail-in { opacity: 1; }
  .pw.is-page .pw-rail-in { transition: none; }
  .pw.is-leaving .pw-rail-in { opacity: 0; }
  .pw-rail-in::-webkit-scrollbar { display: none; }
  .pw-rail-in > * { flex: none; max-width: 100%; pointer-events: auto; }
  /* The contents stand on the mat: white, like the rail's Home. */
  .pw-rail-slot { --ct-ink: #fff; }
  .pw-rail-slot:empty { display: none; }
}
.pw-home { display: inline-flex; align-items: center; gap: .5em; min-height: 24px; padding: 0; border: 0; background: none; color: ${FAINT}; font-family: ${MEDIUM}; font-weight: 500; font-size: 15px; line-height: 1; letter-spacing: -.01em; text-decoration: none; cursor: pointer; }
.pw-home:hover { color: #fff; }
.pw-home:focus-visible { outline: 2px solid ${BLUE}; outline-offset: 4px; }
.pw-home svg { display: block; width: .8em; height: .8em; }
.pw.is-leaving .pw-scroll { opacity: 0; }
.pw.is-leaving .pw-rail-in { pointer-events: none; }
@media (prefers-reduced-motion: reduce) {
  .pw-scroll, .pw.is-in .pw-scroll, .pw.is-leaving .pw-scroll, .pw-rail-in, .pw-clip, .pw.is-in .pw-clip, .pw.is-leaving .pw-clip, .pw-grain, .pw.is-in .pw-grain { transition-duration: 1ms; }
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

// ------------------------------------------------------------- the icons

const ARROW_LEFT = (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M7.5 1.5 3 6l4.5 4.5M3 6h8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    />
  </svg>
);

// ---------------------------------------------------- the grow and shrink

/** A rectangle on the screen, in px. */
type WindowRect = { x: number; y: number; w: number; h: number };

/** The clip the box grows out of and shrinks back into: the hover
 *  card's media, where it is on the wall and what it plays. */
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
  /** The card's own video: on the way out the box hands its progress
   *  back, so the next hover carries on from there. */
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
 * A card's clip as the window wants it: its rect on the wall (the
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
 * The lift: the box starts as the print — its rect, its lean (a
 * rotation about the centre, which is what the caller measured), its
 * shadow, the clip inset by its frame — and everything goes to the
 * box's own in one move on the lift's curve: the edges, the lean to 0,
 * the shadow through the lifted one at mid-way, and the clip's inset
 * to none (a second animation, on the clip). The way back is the same
 * frames reversed, a settle onto the print.
 *
 * The grow (Convertr's move): the box is landscape, so the width goes
 * first and the height follows after `lag`; the shrink is the mirror,
 * height first, at the same pace, so the signs' way back is the same
 * as their way out — each axis on Convertr's curve for `duration` ms.
 * The hairline goes from the clip's blue to the box's own with the
 * width, and the corners with it.
 *
 * The box's place is read off its CSS before the animations lay over
 * it, so the keyframes follow whatever the tuning and the viewport say.
 * Without a print the box fades and settles instead. Returns the way
 * to cancel it.
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
  const fill = open ? "backwards" : "forwards";
  if (!from) {
    const at = { opacity: 1, transform: "none" };
    const away = { opacity: 0, transform: "scale(.97)" };
    return together([
      box.animate(open ? [away, at] : [at, away], {
        duration: dur + wait,
        easing: windowEase(t),
        fill,
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
      borderRadius: "0px",
      boxShadow: PRINT_SHADOW,
    };
    const mid: Keyframe = { offset: 0.45, boxShadow: LIFT_SHADOW };
    const end: Keyframe = {
      left: `${own.x}px`,
      top: `${own.y}px`,
      width: `${own.w}px`,
      height: `${own.h}px`,
      transform: "rotate(0deg)",
      borderRadius: cs.borderRadius,
      boxShadow: cs.boxShadow,
    };
    const options: KeyframeAnimationOptions = {
      duration: dur,
      easing: LIFT_EASE,
      fill,
    };
    const list = [
      box.animate(open ? [start, mid, end] : [end, mid, start], options),
    ];
    if (clip) {
      const framed: Keyframe = {
        left: `${inset.left}px`,
        top: `${inset.top}px`,
        width: `calc(100% - ${inset.left + inset.right}px)`,
        height: `calc(100% - ${inset.top + inset.bottom}px)`,
      };
      list.push(
        clip.animate(open ? [framed, CLIP_FULL] : [CLIP_FULL, framed], options),
      );
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
      boxShadow: cs.boxShadow,
    },
  ];
  const y: Keyframe[] = [
    { top: `${r.y}px`, height: `${r.h}px` },
    { top: `${own.y}px`, height: `${own.h}px` },
  ];
  const run = (frames: Keyframe[], delay: number) =>
    box.animate(open ? frames : [...frames].reverse(), {
      duration: dur,
      delay,
      easing: WINDOW_EASE,
      fill,
    });
  return open
    ? together([run(x, 0), run(y, wait)])
    : together([run(y, 0), run(x, wait)]);
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
  /** "modal" (default): over the page, with the entrance; Home and the
   *  empty rail ask to close — on the landing, a step back in the
   *  history, to the projects. "page": the window is the page — no
   *  entrance; Home is a link to `closeHref`. */
  mode?: "modal" | "page";
  /** Modal mode: the clip the box grows out of on mount, and shrinks
   *  back into on close — read at close time, so the caller can keep
   *  it pointed at the open project's card. Null: fade instead. */
  from?: WindowPreview | null;
  /** For the dialog's name: the open project's title. */
  label: string;
  layout?: WindowLayout;
  /** Page mode: where Home goes — the projects. */
  closeHref?: string;
  /** Modal mode: the window asks to close. */
  onClose?: () => void;
  children?: ReactNode;
};

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
  // What the caller says now: the box shrinks back into this.
  const latest = useRef(from);
  latest.current = from;

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
  if (shown !== prevShown) {
    setPrevShown(shown);
    setLeaving(!shown);
    if (shown) {
      setOpened(from);
      setLanded(page);
    }
  }

  const mounted = shown || leaving;
  const still = reduced();
  // The grow and the shrink take the same, the whole move.
  const grow = still ? 1 : moveMs(t);
  const fade = still ? 1 : t.fade;
  const reveal = still ? 1 : t.reveal;

  // The entrance, each time the box is put up: it grows out of the
  // clip, then the page comes in and the clip stops.
  useLayoutEffect(() => {
    const el = box.current;
    if (!mounted || page || !el) return;
    // Asked to play, not left to autoplay: React sets `muted` as a
    // property, which the autoplay policy doesn't always see.
    void clip.current?.play().catch(() => {});
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

  // The exit: the page fades out over the clip, the box shrinks back
  // into it, then the window is gone. The clip carries on from where
  // the project got to — the page's own copy of the same film if it
  // has one (Camper, scrubbed or not), else as if it had never paused
  // — and hands that back to the card, so the next hover carries on
  // too.
  useEffect(() => {
    if (!leaving) return;
    const el = box.current;
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
    let cancel: (() => void) | undefined;
    const go = window.setTimeout(() => {
      if (el) cancel = move(el, clip.current, latest.current, "shut", t);
    }, fade);
    const done = window.setTimeout(() => {
      const card = latest.current?.video;
      if (card && clip.current) card.currentTime = clip.current.currentTime;
      setLeaving(false);
    }, fade + grow);
    return () => {
      cancel?.();
      window.clearTimeout(go);
      window.clearTimeout(done);
    };
    // The scroller is read at the start of the exit only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving, fade, grow, t]);

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

  const close = () => {
    playLater("knock", 1, "click");
    onClose?.();
  };
  const vars = {
    ...(layout?.rail && { "--pw-rail": layout.rail }),
    ...(layout?.inset && { "--pw-inset": layout.inset }),
    ...(layout?.foot && { "--pw-foot": layout.foot }),
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
        t.media === "multiply" && "is-multiply",
      ]
        .filter(Boolean)
        .join(" ")}
      style={vars}
      data-cursor-label={page ? undefined : "close"}
      onClick={onEmpty}
    >
      <style>{windowCss(t)}</style>
      <div
        className="pw-rail"
        data-cursor-label={page ? undefined : "close"}
        onClick={onEmpty}
      >
        <div className="pw-rail-in">
          {page && closeHref ? (
            <a href={closeHref} className="pw-home" data-cursor-label="home">
              {ARROW_LEFT}
              Home
            </a>
          ) : (
            <button
              type="button"
              className="pw-home"
              data-cursor-label="home"
              onClick={close}
            >
              {ARROW_LEFT}
              Home
            </button>
          )}
          <div ref={setRail} className="pw-rail-slot" />
        </div>
      </div>
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
              // Picks up where the card's copy is now; set before the
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
        {t.media === "overlay" && <div className="pw-grain" aria-hidden />}
      </div>
    </div>
  );
}
