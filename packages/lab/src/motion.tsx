"use client";

import {
  Children,
  cloneElement,
  createElement,
  isValidElement,
  useCallback,
  useEffect,
  useSyncExternalStore,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";

/**
 * The stop-motion system, in one place.
 *
 * The feel (studied on arjunr.dev, 2026-09-06): things appear in hard
 * cuts, never eased. A handful of held poses about a tenth of a second
 * apart — start far off, land past the mark, settle a hair short, rest —
 * with a squash on the landing and opacity that snaps. Siblings land one
 * after another on a stagger.
 *
 * Everything that appears with that punch reads this module:
 *
 *   - `MotionTuning` is the set of knobs (beat, distance, overshoot…),
 *     a mutable store like cursor-tuning. `/lab/motion` is its bench.
 *   - `motionCss()` turns the tuning into the stylesheet: the shared
 *     keyframes (sm-drop, sm-stamp, sm-pop, …), the `.sm-*` classes, the
 *     hover/press responses. <MotionStyles> keeps that stylesheet in the
 *     document and re-renders it on every change, so a slider on the
 *     bench moves every entrance on the site at once — the road signs
 *     and the cartel included, since their entrances use the same
 *     keyframes and read the stagger from the same store.
 *   - <Enter> / <Stagger> put an entrance on any element.
 *
 * Bench values are kept in localStorage so they hold while you walk the
 * site; Reset clears them. Lock a feel in by pasting into MOTION_DEFAULTS.
 */

export type MotionTuning = {
  /** Length of a drop's run, s. Other kinds scale off it (a pop is
   *  shorter, an unfold longer). With `cuts` this is the beat. */
  duration: number;
  /** Held poses per entrance after the start pose: 2 = start, land,
   *  rest; 3 adds a settle; 4 adds a second, smaller landing. */
  cuts: number;
  /** How far off an element starts, px (a drop's height, a slide's
   *  reach). Lands scale with it. */
  distance: number;
  /** Scale in the start pose for things that grow in (0.82 = small).
   *  Stamps come in at 1 / this. */
  startScale: number;
  /** Scale on the landing cut — past rest. 1.08 = eight percent big. */
  overshoot: number;
  /** Scale on the settle cut — a hair short of rest. */
  settle: number;
  /** Squash on the landing: wide and short by this much, area kept.
   *  The settle cut carries a third of it the other way. */
  squash: number;
  /** Tilt in the start pose, deg. Landing counter-tilts a fraction. */
  tilt: number;
  /** ms between one sibling's first cut and the next's. */
  stagger: number;
  /** ms before the first sibling moves. */
  lead: number;
  /** Hover lift, px, in `hoverCuts` cuts over `hoverMs`. */
  hoverLift: number;
  hoverCuts: number;
  hoverMs: number;
};

// Arjun's numbers, rounded to ours: three cuts in 0.38s (~8 a second),
// a 48px drop, lands 8% big and 7% squashed, 90ms between siblings.
export const MOTION_DEFAULTS: Readonly<MotionTuning> = Object.freeze({
  duration: 0.38,
  cuts: 3,
  distance: 48,
  startScale: 0.82,
  overshoot: 1.08,
  settle: 0.98,
  squash: 0.07,
  tilt: 7,
  stagger: 90,
  lead: 60,
  hoverLift: 3,
  hoverCuts: 2,
  hoverMs: 160,
});

// ------------------------------------------------------------- the store

const STORAGE_KEY = "motion-tuning";

let current: MotionTuning = { ...MOTION_DEFAULTS };
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

export function getMotionTuning(): MotionTuning {
  return current;
}

/** Lays `patch` over the current values and tells every subscriber. */
export function setMotionTuning(patch: Partial<MotionTuning>) {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Storage may be unavailable (private mode, sandboxed frame) — the
    // values still apply for this page.
  }
  emit();
}

export function resetMotionTuning() {
  current = { ...MOTION_DEFAULTS };
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // see setMotionTuning
  }
  emit();
}

export function subscribeMotion(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Bench values saved on this browser, if any. Called once by
 *  <MotionStyles> after hydration so the server and first client render
 *  agree on the defaults. */
function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<MotionTuning>;
    const next: MotionTuning = { ...MOTION_DEFAULTS };
    for (const key of Object.keys(MOTION_DEFAULTS) as (keyof MotionTuning)[]) {
      const v = parsed[key];
      if (typeof v === "number" && Number.isFinite(v)) next[key] = v;
    }
    current = next;
    emit();
  } catch {
    // A bad value in storage is ignored; the defaults stand.
  }
}

/** The live tuning, re-rendering the caller on every change. */
export function useMotionTuning(): MotionTuning {
  return useSyncExternalStore(
    subscribeMotion,
    getMotionTuning,
    () => MOTION_DEFAULTS,
  );
}

// -------------------------------------------------------- the stylesheet

export type EnterKind =
  | "drop"
  | "stamp"
  | "pop"
  | "slide"
  | "unfold"
  | "tape"
  | "rule";

export const ENTER_KINDS: readonly EnterKind[] = [
  "drop",
  "stamp",
  "pop",
  "slide",
  "unfold",
  "tape",
  "rule",
] as const;

/** Run length of each kind, as a multiple of `duration`. */
const KIND_LENGTH: Record<EnterKind, number> = {
  drop: 1,
  stamp: 1,
  pop: 0.8,
  slide: 0.75,
  unfold: 1.15,
  tape: 0.8,
  rule: 0.85,
};

const n = (v: number, d = 2) => Number(v.toFixed(d)).toString();

/** A landing squash as a scale(): wide and short by `q`, area kept. */
function squashed(scale: number, q: number) {
  return `scale(${n(scale * (1 + q), 3)}, ${n(scale * (1 - q), 3)})`;
}

/**
 * The poses of one kind: start, land, settle, a second smaller landing,
 * and rest. `cuts` picks how many of the middle ones are used.
 */
function poses(kind: EnterKind, t: MotionTuning): string[] {
  const d = t.distance;
  const q = t.squash;
  const over = t.overshoot - 1; // the overshoot as a fraction
  const under = 1 - t.settle;
  const land2 = 1 + over * 0.35;
  const rest = "opacity: 1; transform: none;";
  switch (kind) {
    case "drop":
      return [
        `opacity: 0; transform: translate(${n(-d * 0.12)}px, ${n(-d)}px) rotate(${n(-t.tilt)}deg) scale(${n(t.startScale)});`,
        `opacity: 1; transform: translate(${n(d * 0.04)}px, ${n(d * 0.1)}px) rotate(${n(t.tilt * 0.3)}deg) ${squashed(t.overshoot, q)};`,
        `opacity: 1; transform: translate(${n(-d * 0.02)}px, ${n(-d * 0.04)}px) rotate(${n(-t.tilt * 0.1)}deg) ${squashed(t.settle, -q / 3)};`,
        `opacity: 1; transform: translateY(${n(d * 0.02)}px) ${squashed(land2, q / 3)};`,
        rest,
      ];
    case "stamp":
      return [
        `opacity: 0; transform: translate(${n(-d * 0.17)}px, ${n(-d * 0.25)}px) rotate(${n(-t.tilt * 0.3)}deg) scale(${n(1 / t.startScale, 3)});`,
        `opacity: 1; transform: translate(${n(d * 0.04)}px, ${n(d * 0.06)}px) rotate(${n(t.tilt * 0.15)}deg) scale(${n(1 - over * 0.6, 3)});`,
        `opacity: 1; transform: translate(${n(-d * 0.02)}px, ${n(-d * 0.02)}px) rotate(${n(-t.tilt * 0.06)}deg) scale(${n(1 + over * 0.25, 3)});`,
        `opacity: 1; transform: scale(${n(1 - over * 0.2, 3)});`,
        rest,
      ];
    case "pop":
      return [
        `opacity: 0; transform: scale(0.2) rotate(${n(-t.tilt)}deg);`,
        `opacity: 1; transform: scale(${n(1 + over * 2.75, 3)}) rotate(${n(t.tilt * 0.4)}deg);`,
        `opacity: 1; transform: scale(${n(t.settle, 3)}) rotate(${n(-t.tilt * 0.15)}deg);`,
        `opacity: 1; transform: scale(${n(1 + over * 0.9, 3)});`,
        rest,
      ];
    case "slide":
      return [
        `opacity: 0; transform: translate(${n(-d * 0.33)}px, ${n(d * 0.08)}px) scale(${n(Math.min(1, t.startScale + 0.12), 3)});`,
        `opacity: 1; transform: translate(${n(d * 0.06)}px, ${n(-d * 0.04)}px) scale(${n(1 + over * 0.4, 3)});`,
        `opacity: 1; transform: translate(${n(-d * 0.02)}px, 0) scale(${n(1 - under * 0.5, 3)});`,
        `opacity: 1; transform: translate(${n(d * 0.01)}px, 0);`,
        rest,
      ];
    case "unfold":
      return [
        `opacity: 0; transform: perspective(900px) rotateX(68deg) scale(${n(t.startScale + 0.1, 3)}, ${n(t.startScale * 0.55, 3)});`,
        `opacity: 1; transform: perspective(900px) rotateX(${n(-over * 125)}deg) scale(${n(1 + over * 0.25, 3)}, ${n(1 + over * 0.12, 3)});`,
        `opacity: 1; transform: perspective(900px) rotateX(${n(under * 150)}deg) scaleX(${n(1 - under * 0.5, 3)});`,
        `opacity: 1; transform: perspective(900px) rotateX(${n(-over * 40)}deg);`,
        `opacity: 1; transform: perspective(900px) rotateX(0deg) scale(1);`,
      ];
    case "tape":
      return [
        `opacity: 0; transform: translate(${n(-d * 0.5)}px, ${n(-d * 0.42)}px) rotate(${n(-t.tilt * 3)}deg) scale(${n(1 / t.startScale + 0.08, 3)});`,
        `opacity: 1; transform: translate(${n(d * 0.04)}px, ${n(d * 0.06)}px) rotate(-3deg) scale(${n(1 - over * 0.75, 3)});`,
        `opacity: 1; transform: translate(0, ${n(-d * 0.02)}px) rotate(-7deg) scale(${n(1 + over * 0.2, 3)});`,
        `opacity: 1; transform: rotate(-5.5deg);`,
        `opacity: 1; transform: rotate(-6deg);`,
      ];
    case "rule":
      return [
        `opacity: 0; transform: scaleX(0);`,
        `opacity: 1; transform: scaleX(${n(1 + over * 3, 3)});`,
        `opacity: 1; transform: scaleX(${n(t.settle, 3)});`,
        `opacity: 1; transform: scaleX(${n(1 + over * 0.5, 3)});`,
        `opacity: 1; transform: scaleX(1);`,
      ];
  }
}

/** One @keyframes block: the start pose, `cuts` held poses, evenly
 *  spaced, the last one being rest. */
function keyframes(name: string, all: string[], cuts: number) {
  const c = Math.min(4, Math.max(1, Math.round(cuts)));
  const [start, land, settle, land2, rest] = all as [
    string,
    string,
    string,
    string,
    string,
  ];
  const middle =
    c === 1 ? [] : c === 2 ? [land] : c === 3 ? [land, settle] : [land, settle, land2];
  const steps = [start, ...middle, rest];
  const total = steps.length - 1;
  const body = steps
    .map((pose, i) => `  ${n((i / total) * 100, 1)}% { ${pose} }`)
    .join("\n");
  return `@keyframes ${name} {\n${body}\n}`;
}

/** The whole stylesheet for the current tuning. */
export function motionCss(t: MotionTuning): string {
  const kinds = ENTER_KINDS.map((kind) => {
    const dur = n(t.duration * KIND_LENGTH[kind], 3);
    return [
      `.sm-${kind} { animation-name: sm-${kind}; animation-duration: ${dur}s; }`,
      keyframes(`sm-${kind}`, poses(kind, t), t.cuts),
    ].join("\n");
  });
  const hoverCuts = Math.max(1, Math.round(t.hoverCuts));
  return `
/* stop-motion — generated by motionCss() from MotionTuning; edit on /lab/motion */
:root { --sm-duration: ${n(t.duration, 3)}s; --sm-stagger: ${n(t.stagger)}ms; --sm-lead: ${n(t.lead)}ms; }

/* The engine: hard cuts, held both sides, delayed by the stagger. */
.sm-enter { animation-timing-function: steps(1, end); animation-fill-mode: both; animation-delay: var(--sm-delay, 0ms); animation-iteration-count: 1; }
/* Mounted but not yet in view: invisible, nothing queued, so the entrance
   plays from its first pose the moment the gate opens. */
.sm-wait { opacity: 0; animation: none; }
.sm-unfold { transform-origin: 50% 0%; }
.sm-rule { transform-origin: 0% 50%; }

${kinds.join("\n")}

/* Responses: the lift jumps in cuts, the shake is held poses dying out,
   the press is one cut down and one back. */
.sm-hover-lift { transition: transform ${n(t.hoverMs)}ms steps(${hoverCuts}, end); }
.sm-hover-lift:hover { transform: translateY(${n(-t.hoverLift)}px); }
.sm-hover-shake:hover { animation: sm-shake 0.6s steps(1, end); }
@keyframes sm-shake {
  0% { transform: rotate(0deg); }
  16% { transform: rotate(${n(t.tilt * 0.2)}deg); }
  33% { transform: rotate(${n(-t.tilt * 0.23)}deg); }
  50% { transform: rotate(${n(t.tilt * 0.14)}deg); }
  68% { transform: rotate(${n(-t.tilt * 0.11)}deg); }
  84% { transform: rotate(${n(t.tilt * 0.06)}deg); }
  100% { transform: rotate(0deg); }
}
.sm-press:active { transform: scale(0.95); transition: transform 0.08s steps(1, end); }

/* Reduced motion: every entrance collapses to rest in one cut; the
   stagger is kept, shorter, so the order still reads. */
@media (prefers-reduced-motion: reduce) {
  .sm-enter { animation-duration: 1ms; animation-delay: calc(var(--sm-delay, 0ms) / 4); }
  .sm-hover-lift, .sm-press:active { transition: none; }
  .sm-hover-shake:hover { animation: none; }
}
`;
}

/**
 * Keeps the generated stylesheet in the document. Mount once, in the
 * root layout. Server and first client render use the defaults; stored
 * bench values land in an effect right after.
 */
export function MotionStyles() {
  const t = useMotionTuning();
  useEffect(() => {
    loadStored();
  }, []);
  return <style data-motion="">{motionCss(t)}</style>;
}

// ----------------------------------------------------------- <Enter>

type EnterProps = {
  kind: EnterKind;
  /** Delay before the first cut, ms. Set by <Stagger> when inside one. */
  delay?: number;
  /** "view" (default) waits until the element is in the viewport;
   *  "mount" plays immediately. */
  gate?: "view" | "mount";
  /** Wrapper element. Defaults to a div. */
  as?: "div" | "span" | "li" | "section" | "article" | "header" | "p";
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/** Swaps the waiting class for the playing one. Done on the DOM node
 *  rather than through state: the gate opening is not a render concern,
 *  and this way the first pose paints on the very frame it is decided. */
function arm(el: HTMLElement, kind: EnterKind) {
  el.classList.remove("sm-wait");
  el.classList.add("sm-enter", `sm-${kind}`);
}

/**
 * One element with a stop-motion entrance, played once it scrolls into
 * view. Re-mount (a changed key) to replay from the first pose.
 *
 *   <Stagger>
 *     <Enter kind="stamp"><h2>Projects</h2></Enter>
 *     <Enter kind="slide"><p>…</p></Enter>
 *   </Stagger>
 */
export function Enter({
  kind,
  delay = 0,
  gate = "view",
  as = "div",
  className,
  style,
  children,
}: EnterProps) {
  // A ref callback owns the observer: attached when the node mounts, the
  // cleanup it returns runs when the node leaves.
  const attach = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      if (gate === "mount") {
        arm(el, kind);
        return;
      }
      // Already on screen at mount: play now, no observer round-trip.
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        arm(el, kind);
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            arm(el, kind);
            io.disconnect();
          }
        },
        { rootMargin: "0px 0px -10% 0px" },
      );
      io.observe(el);
      return () => io.disconnect();
    },
    [gate, kind],
  );

  // Rendered waiting; `attach` decides when it plays. `gate="mount"` also
  // renders playing so it is right without JS (static export, SSR).
  const initial = gate === "mount" ? `sm-enter sm-${kind}` : "sm-wait";
  const cls = [initial, className].filter(Boolean).join(" ");

  return createElement(
    as,
    {
      ref: attach,
      className: cls,
      style: { "--sm-delay": `${delay}ms`, ...style } as CSSProperties,
    },
    children,
  );
}

type StaggerProps = {
  /** ms between one child's first cut and the next's. Defaults to the
   *  tuning's stagger. */
  step?: number;
  /** ms before the first child moves. Defaults to the tuning's lead. */
  base?: number;
  children?: ReactNode;
};

/**
 * Gives each direct <Enter> child a delay of base + index * step. Children
 * that are not <Enter> pass through untouched but still count toward the
 * order, so a plain wrapper between two entrances keeps the rhythm.
 */
export function Stagger({ step, base, children }: StaggerProps) {
  const t = useMotionTuning();
  const s = step ?? t.stagger;
  const b = base ?? t.lead;
  let i = 0;
  const kids = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const idx = i++;
    if (child.type !== Enter) return child;
    const el = child as ReactElement<EnterProps>;
    return cloneElement(el, { delay: b + idx * s });
  });
  return <>{kids}</>;
}
