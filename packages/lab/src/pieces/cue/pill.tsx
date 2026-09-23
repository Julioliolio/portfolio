"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BENCH_CSS,
  Choice,
  Colour,
  CopyValues,
  Group,
  btn,
  type Field,
} from "../../bench";
import { play } from "../../sound";
import { springEasing } from "../../spring";
import { MEDIUM, SETTLE_EASE } from "../../style";
import { createTuningStore } from "../../tuning-store";
import { SpringGraph } from "./graph";
import { HomeScreen } from "./home";

/**
 * A sketch for the scroll cue, played with here and nowhere else: the
 * arrow alone in a squircle of the ink, and under the pointer the
 * squircle turning blue and opening sideways for the words — "view
 * projects" — on a spring or in held cuts. Every part of it is a knob:
 * the pill's size, corner and shape, its colours at rest and open, the
 * arrow, the words, the opening and the idle.
 *
 * It is the Pill tab of /lab/cue (index.tsx). Nothing on the site reads
 * it. The values are kept in this browser
 * (portfolio.cue-pill) until Reset; "Copy values" puts them on the
 * clipboard.
 */

type PillTuning = {
  /** The pill, px: its height, its width at rest (the arrow centred in
   *  it, no side room), and the room at its ends once open. */
  height: number;
  restWidth: number;
  side: number;
  /** Its corners, px, and their shape. */
  corner: number;
  shape: "squircle" | "round";
  /** How much bigger it gets while open. */
  grow: number;
  /** Off the screen's foot, vh (the at-size wall). */
  foot: number;

  /** Colours: the pill at rest, the pill open, the arrow and the words. */
  rest: string;
  hover: string;
  fg: string;

  /** The arrow, solid: its height (px), its shaft's thickness (px), and
   *  its head's length and width, shares of its height. */
  arrow: number;
  line: number;
  head: number;
  headWidth: number;

  /** The words: what they say, their size (px), cut, tracking (em), and
   *  the air between them and the arrow (px). */
  text: string;
  word: number;
  cutOf: "regular" | "medium";
  tracking: number;
  gap: number;

  /** The opening: held cuts or a spring; its length (ms: the cuts
   *  together, or the spring's swing and the close); the spring's
   *  bounce; the cuts' first pose past open and second short of it, as
   *  shares of the words' width. */
  motion: "cuts" | "smooth";
  cut: number;
  bounce: number;
  spread: number;
  back: number;

  /** The arrow while it waits: still, a nudge or a bob; how often (s)
   *  and how far (px). */
  idle: "off" | "nudge" | "bob";
  every: number;
  depth: number;
};

// Julio's picks off the bench (2026-09-23), the arrow drawn after his
// reference: a square-ended shaft and a flat triangle of a head, about
// twice as wide as it is long (headWidth read off the picture).
// Since later that day, in the contents index's look (contents.tsx): its
// ink and blue, its 40px row, its 1.4em sides, its 0.3em near-square
// corners, its 16px Medium — a square of the index with the arrow in it.
const PILL_DEFAULTS: Readonly<PillTuning> = Object.freeze({
  height: 40,
  restWidth: 40,
  side: 22.4,
  corner: 4.8,
  shape: "squircle",
  grow: 0.94,
  foot: 3.5,
  rest: "#2b2722",
  hover: "#2f6df6",
  fg: "#ffffff",
  arrow: 10,
  line: 1.6,
  head: 0.28,
  headWidth: 0.64,
  text: "view projects",
  word: 16,
  cutOf: "medium",
  tracking: 0,
  gap: 6,
  motion: "smooth",
  cut: 210,
  bounce: 0.3,
  spread: 0.12,
  back: 0.05,
  idle: "nudge",
  every: 2,
  depth: 2,
});

const store = createTuningStore("portfolio.cue-pill", PILL_DEFAULTS);
const setPill = store.set;
const usePillTuning = store.useTuning;

const n = (v: number, d = 3) => Number(v.toFixed(d)).toString();

/** The pill's stylesheet for a tuning. */
function pillCss(t: PillTuning) {
  const smooth = t.motion === "smooth";
  const { easing, settle } = springEasing(t.cut, t.bounce);
  const ms = n(t.cut, 0);
  const idleTiming = smooth ? "ease-in-out" : "steps(1, end)";
  const d = (k: number) => `translateY(${n(t.depth * k)}px)`;
  const idleFrames =
    t.idle === "nudge"
      ? `0%, 84% { transform: none; } 87.5% { transform: ${d(0.57)}; } 91% { transform: ${d(1)}; } 94% { transform: ${d(0.29)}; } 100% { transform: none; }`
      : `0%, 100% { transform: none; } 25% { transform: ${d(0.5)}; } 50% { transform: ${d(1)}; } 75% { transform: ${d(0.5)}; }`;
  return `
@property --cp-p { syntax: "<number>"; inherits: false; initial-value: 0; }
.cp { position: absolute; left: 50%; bottom: ${n(t.foot)}vh; transform: translateX(-50%); }
.cp-pill { position: relative; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; height: ${n(t.height)}px; min-width: ${n(t.restWidth)}px; padding: 0; border: 0; border-radius: ${n(t.corner)}px; corner-shape: ${t.shape}; background: ${t.rest}; color: ${t.fg}; font: inherit; cursor: pointer; }
.cp-pill.is-open { background: ${t.hover}; padding: 0 ${n(t.side)}px; transform: scale(${n(t.grow)}); }
.cp-pill:focus-visible { outline: 2px solid ${t.hover}; outline-offset: 3px; }
.cp-arrow { display: block; flex: none; width: ${n(t.arrow)}px; height: ${n(t.arrow)}px; overflow: visible; }
${t.idle === "off" ? "" : `.cp-arrow { animation: cp-idle ${n(t.every)}s ${idleTiming} infinite; }\n@keyframes cp-idle { ${idleFrames} }`}
.cp-clip { --cp-p: 0; display: block; flex: none; width: calc(var(--cp-p) * var(--cp-w, 0px)); overflow-x: clip; }
.is-open .cp-clip { --cp-p: 1; }
.cp-words { display: block; width: max-content; padding-left: ${n(t.gap)}px; opacity: 0; white-space: nowrap; font-size: ${n(t.word)}px; line-height: 1; letter-spacing: ${n(t.tracking)}em;${t.cutOf === "medium" ? ` font-family: ${MEDIUM}; font-weight: 500;` : ""} }
.is-open .cp-words { opacity: 1; }
${
  smooth
    ? `.cp-pill { transition: background-color ${ms}ms ${SETTLE_EASE}, padding ${ms}ms ${SETTLE_EASE}, transform ${ms}ms ${SETTLE_EASE}; }
.cp-pill.is-open { transition: background-color ${ms}ms ${SETTLE_EASE}, padding ${n(settle, 0)}ms ${easing}, transform ${n(settle, 0)}ms ${easing}; }
.cp-clip { transition: --cp-p ${ms}ms ${SETTLE_EASE}; }
.is-open .cp-clip { transition: --cp-p ${n(settle, 0)}ms ${easing}; }
.is-open .cp-words { animation: cp-words-in ${ms}ms ${SETTLE_EASE} both; }
.is-closing .cp-words { animation: cp-words-out ${n(t.cut * 0.5, 0)}ms ease-out both; }
.is-open .cp-arrow { animation: cp-jolt ${ms}ms ${SETTLE_EASE} both; }
@keyframes cp-words-in { 0% { opacity: 0; transform: translateY(3px); } 100% { opacity: 1; transform: none; } }
@keyframes cp-words-out { 0% { opacity: 1; } 100% { opacity: 0; } }
@keyframes cp-jolt { 0% { transform: none; } 35% { transform: translateY(2px); } 100% { transform: none; } }`
    : `.is-open .cp-clip { animation: cp-open ${ms}ms steps(1, end) both; }
.is-closing .cp-clip { animation: cp-close ${ms}ms steps(1, end) both; }
.is-open .cp-words { animation: sm-pop calc(var(--sm-duration) * .8) steps(1, end) both; }
.is-closing .cp-words { animation: cp-words-cut ${ms}ms steps(1, end) both; }
.is-open .cp-arrow { animation: cp-jolt ${ms}ms steps(1, end) both; }
@keyframes cp-open { 0% { --cp-p: ${n(1 + t.spread)}; } 33.3% { --cp-p: ${n(1 - t.back)}; } 66.7%, 100% { --cp-p: 1; } }
@keyframes cp-close { 0% { --cp-p: 1; } 33.3% { --cp-p: .35; } 66.7%, 100% { --cp-p: 0; } }
@keyframes cp-words-cut { 0% { opacity: 1; } 33.3%, 100% { opacity: 0; } }
@keyframes cp-jolt { 0% { transform: translateY(2px); } 33.3% { transform: translateY(-1px); } 66.7%, 100% { transform: none; } }`
}
@media (prefers-reduced-motion: reduce) {
  .cp-arrow { animation: none !important; }
  .cp-pill, .cp-clip { transition: none !important; }
}
`;
}

/** The arrow, solid, after Julio's reference: a square-ended shaft
 *  `line` px thick down the middle of a box `size` px square, and a
 *  flat triangle of a head `head` of the height long and `headWidth`
 *  of it wide, its point at the foot. */
function Arrow({
  size,
  line,
  head,
  headWidth,
}: {
  size: number;
  line: number;
  head: number;
  headWidth: number;
}) {
  const c = size / 2;
  const hl = head * size;
  const hw = (headWidth * size) / 2;
  const s = line / 2;
  const neck = size - hl;
  return (
    <svg
      className="cp-arrow"
      viewBox={`0 0 ${n(size)} ${n(size)}`}
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d={`M${n(c - s)} 0H${n(c + s)}V${n(neck)}H${n(c + hw)}L${n(c)} ${n(size)}L${n(c - hw)} ${n(neck)}H${n(c - s)}Z`}
      />
    </svg>
  );
}

/** The pill: shut, open under the pointer (or focus, or `hold`), or on
 *  its way shut for one `cut`. */
function Pill({ t, hold }: { t: PillTuning; hold: boolean }) {
  const [state, setState] = useState<"closed" | "open" | "closing">("closed");
  const clip = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = clip.current;
    const words = el?.firstElementChild as HTMLElement | null;
    if (!el || !words) return;
    const measure = () =>
      el.style.setProperty("--cp-w", `${words.offsetWidth}px`);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(words);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (state !== "closing") return;
    const timer = window.setTimeout(
      () => setState((s) => (s === "closing" ? "closed" : s)),
      t.cut,
    );
    return () => window.clearTimeout(timer);
  }, [state, t.cut]);
  const open = () => {
    setState((s) => {
      if (s !== "open") play("tap", 1, { at: "cue" });
      return "open";
    });
  };
  const close = () => setState((s) => (s === "open" ? "closing" : s));
  const shown = hold ? "open" : state;
  return (
    <button
      type="button"
      className={[
        "cp-pill",
        shown === "open" && "is-open",
        shown === "closing" && "is-closing",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Scroll to the projects"
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") open();
      }}
      onPointerLeave={close}
      onFocus={(e) => {
        if (e.currentTarget.matches(":focus-visible")) open();
      }}
      onBlur={close}
    >
      <Arrow
        size={t.arrow}
        line={t.line}
        head={t.head}
        headWidth={t.headWidth}
      />
      <span className="cp-clip" ref={clip}>
        <span className="cp-words">{t.text}</span>
      </span>
    </button>
  );
}

const PILL: Field<PillTuning>[] = [
  { key: "height", label: "Height", min: 14, max: 64, step: 0.5, unit: "px" },
  {
    key: "restWidth",
    label: "Rest width",
    min: 14,
    max: 160,
    step: 1,
    unit: "px",
    hint: "the pill's width with the arrow alone",
  },
  {
    key: "side",
    label: "Side",
    min: 0,
    max: 32,
    step: 0.5,
    unit: "px",
    hint: "the room at the pill's ends while open",
  },
  {
    key: "corner",
    label: "Corner",
    min: 0,
    max: 32,
    step: 0.5,
    unit: "px",
    hint: "half the height is a capsule",
  },
  {
    key: "grow",
    label: "Grow",
    min: 0.9,
    max: 1.3,
    step: 0.01,
    hint: "the pill's scale while open, on the spring",
  },
  { key: "foot", label: "Foot", min: 0, max: 20, step: 0.25, unit: "vh" },
];

const ARROW: Field<PillTuning>[] = [
  { key: "arrow", label: "Size", min: 6, max: 32, step: 0.5, unit: "px" },
  {
    key: "line",
    label: "Shaft",
    min: 0.5,
    max: 6,
    step: 0.05,
    unit: "px",
    hint: "the shaft's thickness",
  },
  {
    key: "head",
    label: "Head",
    min: 0.1,
    max: 0.6,
    step: 0.01,
    hint: "the head's length, a share of the arrow's height",
  },
  {
    key: "headWidth",
    label: "Head width",
    min: 0.2,
    max: 1,
    step: 0.01,
    hint: "the head's width, a share of the arrow's height",
  },
];

const WORDS: Field<PillTuning>[] = [
  { key: "word", label: "Size", min: 8, max: 24, step: 0.5, unit: "px" },
  {
    key: "tracking",
    label: "Tracking",
    min: -0.08,
    max: 0.12,
    step: 0.005,
    unit: "em",
  },
  {
    key: "gap",
    label: "Gap",
    min: 0,
    max: 24,
    step: 0.5,
    unit: "px",
    hint: "between the arrow and the words",
  },
];

const LENGTH: Field<PillTuning> = {
  key: "cut",
  label: "Length",
  min: 90,
  max: 1200,
  step: 15,
  unit: "ms",
  hint: "cuts: the three held cuts together; smooth: the spring's swing, and the close",
};

const SPRING: Field<PillTuning>[] = [
  LENGTH,
  { key: "bounce", label: "Bounce", min: 0, max: 0.8, step: 0.01 },
];

const CUTS: Field<PillTuning>[] = [
  LENGTH,
  {
    key: "spread",
    label: "Spread",
    min: 0,
    max: 0.5,
    step: 0.01,
    hint: "the first cut: how far past open, a share of the words' width",
  },
  {
    key: "back",
    label: "Back",
    min: 0,
    max: 0.3,
    step: 0.01,
    hint: "the second cut: how far short of open",
  },
];

const IDLE: Field<PillTuning>[] = [
  { key: "every", label: "Every", min: 0.5, max: 10, step: 0.25, unit: "s" },
  { key: "depth", label: "Depth", min: 0, max: 8, step: 0.25, unit: "px" },
];

const CSS = `
${BENCH_CSS}
.cpb-stage { position: fixed; inset: 0; z-index: 1; overflow-y: auto; background: #faf9f6; color: #171717; }
.cpb-page { display: grid; gap: 28px; max-width: 1120px; margin: 0 auto; padding: max(6vh, 64px) clamp(20px, 4vw, 56px) 40vh; }
@media (min-width: 760px) { .cpb-page { padding-right: 368px; } }
.cpb-label { margin: 0 0 8px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; opacity: .55; }
.cpb-wall { position: relative; overflow: hidden; border: 1px solid rgba(23, 23, 23, .1); border-radius: 12px; background: #faf9f6; }
.cpb-screen { height: 34vh; }
.cpb-close { display: grid; place-items: center; height: max(40vh, 240px); }
.cpb-close .cp { position: static; transform: none; zoom: 3; }
.bench-panel { --bench-label: 5rem; }
.bench-panel .bench-row { gap: 10px; }
.cpb-hold { display: flex; align-items: center; gap: 8px; }
`;

export function PillBench({ home }: { home: boolean }) {
  const t = usePillTuning();
  const [hold, setHold] = useState(false);

  return (
    <div className="cpb-stage">
      <style>{CSS + pillCss(t)}</style>

      <div className="bench-panel">
        <div className="bench-buttons">
          <button type="button" style={btn} onClick={store.reset}>
            Reset
          </button>
          <CopyValues values={t} />
        </div>
        <label className="cpb-hold">
          <input
            type="checkbox"
            checked={hold}
            onChange={(e) => setHold(e.target.checked)}
          />
          Hold open
        </label>

        <div className="bench-group">
          <Group title="The pill" fields={PILL} values={t} set={setPill} />
          <Choice
            label="Corners"
            value={t.shape}
            options={[
              { value: "squircle", label: "Squircle" },
              { value: "round", label: "Round" },
            ]}
            pick={(shape) => setPill({ shape })}
          />
        </div>

        <div className="bench-group">
          <div className="bench-title">The colours</div>
          <Colour
            label="At rest"
            value={t.rest}
            pick={(rest) => setPill({ rest })}
          />
          <Colour
            label="Open"
            value={t.hover}
            pick={(hover) => setPill({ hover })}
          />
          <Colour
            label="Arrow, words"
            value={t.fg}
            pick={(fg) => setPill({ fg })}
          />
        </div>

        <Group title="The arrow" fields={ARROW} values={t} set={setPill} />

        <div className="bench-group">
          <Group title="The words" fields={WORDS} values={t} set={setPill} />
          <label className="bench-row is-wide">
            <span>Text</span>
            <input
              className="bench-text"
              value={t.text}
              onChange={(e) => setPill({ text: e.target.value })}
            />
          </label>
          <Choice
            label="Cut"
            value={t.cutOf}
            options={[
              { value: "regular", label: "Regular" },
              { value: "medium", label: "Medium" },
            ]}
            pick={(cutOf) => setPill({ cutOf })}
          />
        </div>

        <div className="bench-group">
          <div className="bench-title">The animation</div>
          <Choice
            label="Motion"
            value={t.motion}
            options={[
              { value: "cuts", label: "Held cuts" },
              { value: "smooth", label: "Spring" },
            ]}
            pick={(motion) => setPill({ motion })}
          />
          {t.motion === "smooth" && (
            <SpringGraph
              period={t.cut}
              bounce={t.bounce}
              onChange={({ bounce, period }) =>
                setPill({ bounce, cut: period })
              }
            />
          )}
          <Group
            title=""
            fields={t.motion === "smooth" ? SPRING : CUTS}
            values={t}
            set={setPill}
          />
        </div>

        <div className="bench-group">
          <div className="bench-title">The idle</div>
          <Choice
            label="Arrow"
            value={t.idle}
            options={[
              { value: "off", label: "Still" },
              { value: "nudge", label: "Nudge" },
              { value: "bob", label: "Bob" },
            ]}
            pick={(idle) => setPill({ idle })}
          />
          <Group title="" fields={IDLE} values={t} set={setPill} />
        </div>
      </div>

      {home ? (
        <HomeScreen>
          {() => (
            <div className="cp">
              <Pill t={t} hold={hold} />
            </div>
          )}
        </HomeScreen>
      ) : (
        <div className="cpb-page">
          <section>
            <p className="cpb-label">At size — the foot of the first screen</p>
            <div className="cpb-wall cpb-screen">
              <div className="cp">
                <Pill t={t} hold={hold} />
              </div>
            </div>
          </section>
          <section>
            <p className="cpb-label">Up close — 3×</p>
            <div className="cpb-wall cpb-close">
              <div className="cp">
                <Pill t={t} hold={hold} />
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
