"use client";

import {
  createElement,
  useCallback,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

/**
 * The project pages' type: one family, very few moves. The rules are
 * written out in docs/type-and-spacing.md — keep the two in step. After
 * the pages Julio pointed at (heckhouse.com's case studies, estrellagracia.com,
 * 418's cards, Roko Gabrilo's index): there are three sizes and no more —
 * the title, the reading size, the small size — one weight under the
 * title, and no rules, eyebrows, capitals or numbering. What tells a
 * heading from its text is ink against grey at the same size; what tells
 * a paragraph from the last is an indent; what tells a section from the
 * last is space. Everything else is where it sits on the grid.
 *
 * Space is one unit, --ty-u (about a line of the reading size), and every
 * gap is 1, 2, 4 or 8 of it (.ty-gap-*), so the page keeps one rhythm.
 *
 * A ground (.ty-ground) is a band with its own colours: the header is the
 * blue one, filling the first screen, and the page turns to paper under
 * it as you scroll; the way on at the foot is blue again. One blue for
 * the whole portfolio — the rope's. Projects no longer tint their type.
 *
 * It is a stylesheet and two small components, and no layout beyond the
 * twelve columns. Wrap the page in `.ty` (the container the sizes are
 * measured against — every clamp is in cqw, so the type is right in the
 * sheet and on a phone), then:
 *
 *   .ty-ground     a band; data-ground="blue" | "ink" turns it over
 *   .ty-grid       twelve columns, a unit apart
 *   .ty-title      the project's name: Medium, tight, the only big thing
 *   <FitTitle>     the same, fitted to the container's width
 *   .ty-read       the reading size; in it, .ty-dim is the grey and a
 *                  paragraph after a paragraph is indented, not spaced
 *   .ty-small      the small size: margin notes, facts, captions
 *   .ty-facts      label and value in two plain columns
 *   .ty-num        the one place the mono cut stays: numbers
 *   .ty-next       the way on, as big as a title
 *   <Reveal>       how a thing arrives: a fade and a few pixels' rise
 *   <BottomBlur>   the scroller's foot, going out of focus
 *
 * Nothing on a project page arrives in stop-motion cuts any more (Julio,
 * 2026-09-21: a page full of them was too heavy); that stays the
 * landing's. After estrellagracia.com/work: things fade up once, softly,
 * and the page blurs away progressively at the bottom edge.
 *
 * Medium is a family of its own (--font-neue-montreal-extra; see
 * globals.css in the web app): anything at 500 has to name it, or the
 * browser fakes the weight from Regular.
 */

const MEDIUM = `var(--font-neue-montreal-extra), var(--font-neue-montreal), "Helvetica Neue", Arial, sans-serif`;
const MONO = `var(--font-neue-montreal-mono), ui-monospace, Menlo, monospace`;
/** How far the title is pulled left, in em: a capital's side bearing. */
const BEARING = 0.04;
/** How far the last letter's ink stands past the measured line, in em:
 *  the tracking taken off after it, less its own side bearing. */
const OVERHANG = 0.035;
/** The bottom blur's layers: [blur in px, where its mask starts, where it
 *  is full], in % of the band from its top. They stack, so the foot is
 *  the sum. */
const BLUR = [
  [1, 0, 40],
  [2, 25, 65],
  [4, 50, 90],
  [6, 72, 100],
] as const;

/**
 * The type's stylesheet. The notes are here rather than in the CSS,
 * where they would ship to every project page:
 *
 * - The link reset is weightless (:where), so a link set in one of the
 *   classes keeps the class's colour.
 * - Grounds: a band carries its own colours, and the type on it follows.
 * - The title is pulled left by the capital's side bearing, so the ink
 *   starts on the margin the text starts on; the padding is room for the
 *   descenders the tight line height leaves hanging.
 * - The way on (.ty-next) is set as big as the title it leads to.
 * - Arriving: waiting is only invisible; in is one soft fade and rise.
 * - The foot of the scroller (.ty-blur): layers of blur, each masked to
 *   start lower than the last, so focus falls away instead of stopping
 *   at a line. Stuck to the bottom of whatever scrolls; it has no height
 *   of its own.
 */
export const TYPE_CSS = `
.ty { --ty-blue: #2f6df6; --ty-u: clamp(20px, 2.5cqw, 28px); --ty-fg: #2b2722; --ty-dim: #77716a; --ty-bg: #fff; container-type: inline-size; color: var(--ty-fg); background: var(--ty-bg); }
:where(.ty a) { color: inherit; text-decoration: none; }
:where(.ty p, .ty h1, .ty h2, .ty dl, .ty dd, .ty figure) { margin: 0; }

.ty-ground { padding: calc(2 * var(--ty-u)) calc(1.5 * var(--ty-u)); color: var(--ty-fg); background: var(--ty-bg); }
.ty-ground[data-ground="blue"] { --ty-bg: var(--ty-blue); --ty-fg: #fff; --ty-dim: rgba(255, 255, 255, .64); }
.ty-ground[data-ground="ink"] { --ty-bg: #171513; --ty-fg: #fff; --ty-dim: rgba(255, 255, 255, .56); }
.ty-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: var(--ty-u); }
.ty-gap-1 { margin-top: var(--ty-u); }
.ty-gap-2 { margin-top: calc(2 * var(--ty-u)); }
.ty-gap-4 { margin-top: calc(4 * var(--ty-u)); }
.ty-gap-8 { margin-top: calc(8 * var(--ty-u)); }

.ty-title { padding-bottom: .1em; text-indent: -${BEARING}em; font-family: ${MEDIUM}; font-weight: 500; font-size: clamp(64px, 12cqw, 168px); line-height: .86; letter-spacing: -.055em; }
.ty-title.is-fit { font-size: 20cqw; white-space: nowrap; }
.ty-title.is-fit > span { display: inline-block; text-indent: 0; }

.ty-read { font-size: clamp(19px, 2.1cqw, 23px); line-height: 1.22; letter-spacing: -.018em; text-wrap: pretty; }
.ty-read p + p { text-indent: 2.2em; }
.ty-read a { color: var(--ty-blue); }
.ty-ground[data-ground] .ty-read a { color: inherit; text-decoration: underline; text-underline-offset: .15em; text-decoration-thickness: 1px; }
.ty-dim { color: var(--ty-dim); }

.ty-small { font-size: 13px; line-height: 1.38; letter-spacing: -.003em; }
.ty-facts { display: grid; grid-template-columns: minmax(64px, 1fr) 3fr; column-gap: var(--ty-u); row-gap: .5em; }
.ty-facts dt { color: var(--ty-dim); }
.ty-num { font-family: ${MONO}; font-variant-numeric: tabular-nums; letter-spacing: 0; }

.ty-arrow { flex: none; width: .74em; height: .74em; overflow: visible; }
.ty-next { display: flex; align-items: baseline; gap: .12em; }
.ty-next .ty-arrow { align-self: center; width: .62em; height: .62em; transition: transform .16s steps(2, end); }
.ty-next:hover .ty-arrow { transform: translateX(.08em); }
@media (prefers-reduced-motion: reduce) { .ty-next .ty-arrow { transition: none; } }

.ty-wait { opacity: 0; }
.ty-in { animation: ty-in .8s cubic-bezier(.2, .65, .2, 1) var(--ty-delay, 0ms) both; }
@keyframes ty-in { from { opacity: 0; transform: translateY(12px); } }
@media (prefers-reduced-motion: reduce) { .ty-in { animation: none; } }

.ty-blur { position: sticky; bottom: 0; z-index: 5; height: 0; pointer-events: none; }
.ty-blur > i { position: absolute; left: 0; right: 0; bottom: 0; height: calc(4 * var(--ty-u)); }
${BLUR.map(
  ([px, from, to], i) =>
    `.ty-blur > i:nth-child(${i + 1}) { -webkit-backdrop-filter: blur(${px}px); backdrop-filter: blur(${px}px); -webkit-mask-image: linear-gradient(transparent ${from}%, #000 ${to}%); mask-image: linear-gradient(transparent ${from}%, #000 ${to}%); }`,
).join("\n")}
`;

/** The type's stylesheet, once per page. */
export function TypeStyles() {
  return <style>{TYPE_CSS}</style>;
}

type RevealProps = {
  /** ms before it starts: a beat between neighbours, no more. */
  delay?: number;
  /** "view" (default) waits until it scrolls in; "mount" plays at once,
   *  and is right without JS. */
  gate?: "view" | "mount";
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** Taken and ignored, so a page built on motion.tsx's <Enter> moves
   *  over by changing its import. */
  kind?: string;
};

/**
 * How a thing arrives on a project page: once, a fade and a small rise.
 * The same call as the stop-motion <Enter>, without the cuts.
 */
export function Reveal({
  delay = 0,
  gate = "view",
  as = "div",
  className,
  style,
  children,
}: RevealProps) {
  const attach = useCallback((el: HTMLElement | null) => {
    if (!el || !el.classList.contains("ty-wait")) return;
    const show = () => el.classList.replace("ty-wait", "ty-in");
    // Already on screen at mount: play now, no observer round-trip.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return void show();
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        show();
        io.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cls = [gate === "mount" ? "ty-in" : "ty-wait", className]
    .filter(Boolean)
    .join(" ");
  return createElement(
    as,
    {
      ref: attach,
      className: cls,
      style: { "--ty-delay": `${delay}ms`, ...style } as CSSProperties,
    },
    children,
  );
}

/** The progressive blur at the scroller's foot. Put it last in whatever
 *  scrolls (inside `.ty`, for the unit). */
export function BottomBlur() {
  return (
    <div className="ty-blur" aria-hidden="true">
      {BLUR.map((_, i) => (
        <i key={i} />
      ))}
    </div>
  );
}

const TURN = { up: -90, right: 0, down: 90, left: 180 } as const;

/** An arrow drawn at the text's size and weight — not a glyph, so it is
 *  the same on every machine. */
export function Arrow({ to = "right" }: { to?: keyof typeof TURN }) {
  return (
    <svg
      className="ty-arrow"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      style={{ rotate: `${TURN[to]}deg` }}
    >
      <path
        d="M6.5 1.5 11 6l-4.5 4.5M11 6H.5"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="square"
      />
    </svg>
  );
}

/** The most of the container's width a fitted title's size may take: a
 *  short name would otherwise be taller than the screen. */
const FIT_CAP = 0.34;

/**
 * The title fitted to its container's width, on one line: measured at a
 * known size, scaled to the width, and again whenever the width or the
 * font changes. Until it has measured it sits at the stylesheet's 20cqw.
 */
export function FitTitle({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  const el = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const h = el.current;
    const span = h?.firstElementChild as HTMLElement | null;
    if (!h || !span) return;
    const fit = () => {
      const width = h.clientWidth;
      if (!width) return;
      h.style.fontSize = "100px";
      // The ink starts a bearing left of the box and must end on its
      // right edge: width = size × (measured / 100 − bearing + overhang).
      const size = Math.min(
        width / (span.offsetWidth / 100 - BEARING + OVERHANG),
        width * FIT_CAP,
      );
      h.style.fontSize = `${size.toFixed(1)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(h);
    document.fonts.ready.then(fit);
    return () => ro.disconnect();
  }, [children]);
  return (
    <h1 ref={el} className="ty-title is-fit" style={style}>
      <span>{children}</span>
    </h1>
  );
}
