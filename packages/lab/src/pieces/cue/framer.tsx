"use client";

import { useId, useState } from "react";
import {
  BENCH_CSS,
  Choice,
  Colour,
  CopyValues,
  Group,
  btn,
  type Field,
} from "../../bench";
import { springEasing } from "../../spring";
import { MEDIUM } from "../../style";
import { createTuningStore } from "../../tuning-store";
import { SpringGraph } from "./graph";
import { HomeScreen } from "./home";

/**
 * The "Down" button off Julio's Framer site (extended-cues-365152.framer.app),
 * rebuilt to behave the same, for the Framer tab of /lab/cue. Read off
 * the live page on 2026-09-23:
 *
 * - At rest, a blue box (rgba(0, 94, 255, .9)) padded 6 x 8 round a
 *   white V, 24 x 23 — 40 x 35 in all. A label, "featured work", waits
 *   unseen in a point at the box's top.
 * - Under the pointer the V morphs into a 14 x 3 bar — Framer's hover
 *   state is a second drawing with the V's eight points laid out as a
 *   bar, and the points travel — the box pads to 16 x 8 so it thins to
 *   30 wide, and the label grows out of the box's top down to 26px below
 *   it: 28px Medium, white, on its own blue box padded 4 at the top and
 *   sides. All of it on one spring — about 1.5% over at 150ms, settled
 *   by 270 (a bounce of 0.2 and a swing of 180ms, cue.tsx's spring).
 * - Off it, the label is gone at once and the V springs back.
 *
 * Every number is a knob. The defaults began as the Framer ones, then
 * Julio's tuning, and since 2026-09-23 wear the contents index's style
 * (contents.tsx): the box an ink squircle, the label the index's blue
 * one, the two joined by the index's goo as they part. Three presets:
 * Contents and Framer (his tuning) swap the style and keep the
 * interaction; Original sets every number back to the Framer site's.
 * The drop can go below 0 to lift the label above the button. Kept in
 * this browser (portfolio.cue-framer) until Reset. Nothing on the site
 * reads it.
 *
 * The goo: the shapes — the box and the label's background — are drawn
 * once more in a layer under the real ones, that layer blurred and its
 * alpha ramped hard (the index's filter), so where the two shapes near
 * each other a neck of ink draws between them. The layer above carries
 * the V and the words unblurred, on no background. With the goo at 0
 * the under-layer is simply the shapes.
 */

type FramerTuning = {
  /** The box's colour and strength, the label's box's, and the V and
   *  the words. (The goo, on, ramps any strength to solid.) */
  color: string;
  alpha: number;
  labelColor: string;
  labelAlpha: number;
  fg: string;
  /** The boxes' corners, px, and their shape; the goo's blur, px — 0 is
   *  none, the index's is 2.5. */
  corner: number;
  shape: "sharp" | "round" | "squircle";
  goo: number;
  /** The V's box at rest and the bar's open, px (each drawing stretches
   *  to fit its box). */
  vW: number;
  vH: number;
  vOpenW: number;
  vOpenH: number;
  /** The box's padding round the V at rest and open, px. */
  padY: number;
  padX: number;
  openPadY: number;
  openPadX: number;
  /** The label: its words, size (px), cut, how far below the button's
   *  top it hangs (px; negative lifts it above), and its box's padding
   *  (px, up and down, and at the sides). */
  text: string;
  word: number;
  cutOf: "regular" | "medium";
  top: number;
  labelPadY: number;
  labelPadX: number;
  /** The spring: its swing (ms) and bounce. */
  period: number;
  bounce: number;
  /** Leaving: the label gone at once (Framer's), or springing back. */
  exit: "instant" | "spring";
  /** Off the screen's foot, vh. */
  foot: number;
};

/** The two styles, as the keys a preset sets: Framer's own, and the
 *  contents index's. */
const STYLE_KEYS = [
  "color",
  "alpha",
  "labelColor",
  "labelAlpha",
  "corner",
  "shape",
  "goo",
  "word",
  "labelPadY",
  "labelPadX",
  "top",
] as const;
type Style = Pick<FramerTuning, (typeof STYLE_KEYS)[number]>;

/** Julio's tuning of the Framer original (2026-09-23): the blue box,
 *  sharp, no goo, the label 22px above. */
const FRAMER_STYLE: Style = {
  color: "#0075ff",
  alpha: 0.87,
  labelColor: "#0075ff",
  labelAlpha: 0.87,
  corner: 0,
  shape: "sharp",
  goo: 0,
  word: 22,
  labelPadY: 2,
  labelPadX: 4,
  top: -26,
};

/** The contents index's: ink #2b2722 box, the label on the index's
 *  blue, both squircles with the index's small, near-square corners
 *  (0.3em of 16px = 4.8px — Julio's ask, 2026-09-23, off a frame of
 *  the index), the label the index's
 *  row (40 tall, 1.4em = 22 at the sides), held off the box by the
 *  index's half-em gap, the index's 2.5px goo between them. */
const CONTENTS_STYLE: Style = {
  color: "#2b2722",
  alpha: 1,
  labelColor: "#2f6df6",
  labelAlpha: 1,
  corner: 4.8,
  shape: "squircle",
  goo: 2.5,
  word: 16,
  labelPadY: 10.4,
  labelPadX: 22.4,
  top: -48,
};

/** The button exactly as the Framer site has it — every number read off
 *  the live page (see the top of this file): Framer's blue at .9, sharp,
 *  no goo, the 24 x 23 V in a 6 x 8 box, 16 x 8 open, "featured work"
 *  at 28px Medium hanging 26px below on 4px of padding, the 180ms /
 *  0.2 spring, the label gone at once — and the foot lifted to 9vh so
 *  the hanging label fits the screen. */
const ORIGINAL: Partial<FramerTuning> = {
  color: "#005eff",
  alpha: 0.9,
  labelColor: "#005eff",
  labelAlpha: 0.9,
  fg: "#ffffff",
  corner: 0,
  shape: "sharp",
  goo: 0,
  vW: 24,
  vH: 23,
  vOpenW: 14,
  vOpenH: 3,
  padY: 6,
  padX: 8,
  openPadY: 16,
  openPadX: 8,
  text: "featured work",
  word: 28,
  cutOf: "medium",
  top: 26,
  labelPadY: 2,
  labelPadX: 4,
  period: 180,
  bounce: 0.2,
  exit: "instant",
  foot: 9,
};

/** Whether the tuning wears `preset` exactly, key for key. */
function isPreset(t: FramerTuning, preset: Partial<FramerTuning>) {
  return (Object.keys(preset) as (keyof FramerTuning)[]).every(
    (k) => t[k] === preset[k],
  );
}

// Julio's interaction (2026-09-23), in the contents index's style; the
// V's box the index's row, 40 square, shut and open alike.
const FRAMER_DEFAULTS: Readonly<FramerTuning> = Object.freeze({
  ...CONTENTS_STYLE,
  fg: "#ffffff",
  vW: 14,
  vH: 14,
  vOpenW: 9.5,
  vOpenH: 3,
  padY: 13,
  padX: 13,
  openPadY: 18.5,
  openPadX: 15.25,
  text: "see projects",
  cutOf: "medium",
  period: 240,
  bounce: 0.42,
  exit: "instant",
  foot: 3.5,
});

const store = createTuningStore("portfolio.cue-framer", FRAMER_DEFAULTS);
const setFramer = store.set;
const useFramerTuning = store.useTuning;

const n = (v: number, d = 3) => Number(v.toFixed(d)).toString();

/** The V off the Framer file, in its own 24 x 22.667 box, and the bar
 *  its hover state draws instead, in a 14 x 2.5 box — the same eight
 *  points, point for point, so one morphs into the other. */
const V_PTS: [number, number][] = [
  [14.49, 22.667],
  [9.455, 22.667],
  [0, 0],
  [4.476, 0],
  [11.916, 19.047],
  [12.028, 19.047],
  [19.524, 0],
  [24, 0],
];
const BAR_PTS: [number, number][] = [
  [7.367, 2.5],
  [3.591, 2.5],
  [0, 2.5],
  [0, 0],
  [5.5, 0],
  [5.5, 0],
  [14, 0],
  [14, 2.5],
];

/** A drawing's points stretched from its own box to w x h px, as a
 *  CSS path() for the `d` property. */
function pathIn(
  pts: [number, number][],
  box: [number, number],
  w: number,
  h: number,
) {
  const [bw, bh] = box;
  const d = pts
    .map(
      ([x, y], i) => `${i ? "L" : "M"} ${n((x * w) / bw)} ${n((y * h) / bh)}`,
    )
    .join(" ");
  return `path("${d} Z")`;
}

function rgba(hex: string, a: number) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const [r, g, b] = m.slice(1).map((c) => parseInt(c, 16));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function framerCss(t: FramerTuning, gooId: string) {
  const { easing, settle } = springEasing(t.period, t.bounce);
  const go = `${n(settle, 0)}ms ${easing}`;
  const box = rgba(t.color, t.alpha);
  const label = rgba(t.labelColor, t.labelAlpha);
  const corners =
    t.shape === "sharp"
      ? ""
      : ` border-radius: ${n(t.corner)}px; corner-shape: ${t.shape};`;
  // The label at rest: a point at the button's top, centred — the size
  // Framer leaves it (its type at 1px).
  const point = 0.034;
  return `
.fr { position: absolute; left: 50%; bottom: ${n(t.foot)}vh; transform: translateX(-50%); }
.fr-link { position: relative; display: block; padding: 0; border: 0; background: none; color: ${t.fg}; font: inherit; cursor: pointer; }
.fr-link:focus-visible { outline: 2px solid ${box}; outline-offset: 3px; }
/* Two layers laid out alike: the shapes underneath (through the goo
   when there is one), the V and the words on top. */
.fr-layer { display: flex; flex-direction: column; align-items: center; padding: 0; transition: padding ${go}; }
.is-open .fr-layer { padding: 0 ${n(t.openPadX)}px; }
.fr-ink { position: relative; }
.fr-shapes { position: absolute; inset: 0; pointer-events: none;${t.goo > 0 ? ` filter: url(#${gooId});` : ""} }
.fr-box { position: relative; z-index: 1; display: flex; padding: ${n(t.padY)}px ${n(t.padX)}px;${corners} transition: padding ${go}; }
.is-open .fr-box { padding: ${n(t.openPadY)}px ${n(t.openPadX)}px; }
.fr-shapes .fr-box { background: ${box}; }
/* The V: its box resizes and its eight points travel from the V to the
   bar, both on the spring, drawn in the box's own px. */
.fr-v { display: block; flex: none; overflow: visible; width: ${n(t.vW)}px; height: ${n(t.vH)}px; transition: width ${go}, height ${go}; }
.is-open .fr-v { width: ${n(t.vOpenW)}px; height: ${n(t.vOpenH)}px; }
.fr-v path { d: ${pathIn(V_PTS, [24, 22.667], t.vW, t.vH)}; fill: currentColor; transition: d ${go}; }
.is-open .fr-v path { d: ${pathIn(BAR_PTS, [14, 2.5], t.vOpenW, t.vOpenH)}; }
.fr-shapes .fr-v path { fill: none; }
.fr-label { position: absolute; z-index: 1; top: ${n(t.top)}px; left: 50%; padding: ${n(t.labelPadY)}px ${n(t.labelPadX)}px;${corners} color: ${t.fg}; white-space: pre; font-size: ${n(t.word)}px; line-height: 1.2;${t.cutOf === "medium" ? ` font-family: ${MEDIUM}; font-weight: 500;` : ""} pointer-events: none; transform-origin: 50% 0; transform: translate(-50%, ${n(-t.top)}px) scale(${point}); visibility: hidden; ${
    t.exit === "instant"
      ? "transition: none;"
      : `transition: transform ${go}, visibility 0s linear ${n(settle, 0)}ms;`
  } }
.fr-shapes .fr-label { background: ${label}; color: transparent; }
.is-open .fr-label { transform: translate(-50%, 0) scale(1); visibility: visible; transition: transform ${go}, visibility 0s; }
@media (prefers-reduced-motion: reduce) {
  .fr-layer, .fr-box, .fr-v, .fr-v path, .fr-label { transition: none !important; }
}
`;
}

function FramerButton({ t, hold }: { t: FramerTuning; hold: boolean }) {
  const [over, setOver] = useState(false);
  const open = hold || over;
  const layer = (
    <>
      <span className="fr-label">{t.text}</span>
      <span className="fr-box">
        <svg className="fr-v" aria-hidden="true">
          <path />
        </svg>
      </span>
    </>
  );
  return (
    <button
      type="button"
      className={open ? "fr-link is-open" : "fr-link"}
      aria-label="Scroll to the featured work"
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") setOver(true);
      }}
      onPointerLeave={() => setOver(false)}
      onFocus={(e) => {
        if (e.currentTarget.matches(":focus-visible")) setOver(true);
      }}
      onBlur={() => setOver(false)}
    >
      <span className="fr-layer fr-shapes" aria-hidden="true">
        {layer}
      </span>
      <span className="fr-layer fr-ink">{layer}</span>
    </button>
  );
}

const V_FIELDS: Field<FramerTuning>[] = [
  { key: "vW", label: "Rest W", min: 4, max: 60, step: 0.5, unit: "px" },
  { key: "vH", label: "Rest H", min: 1, max: 60, step: 0.5, unit: "px" },
  { key: "vOpenW", label: "Open W", min: 1, max: 60, step: 0.5, unit: "px" },
  { key: "vOpenH", label: "Open H", min: 1, max: 60, step: 0.5, unit: "px" },
];

const BOX: Field<FramerTuning>[] = [
  { key: "padY", label: "Rest Y", min: 0, max: 40, step: 0.5, unit: "px" },
  { key: "padX", label: "Rest X", min: 0, max: 40, step: 0.5, unit: "px" },
  { key: "openPadY", label: "Open Y", min: 0, max: 40, step: 0.5, unit: "px" },
  { key: "openPadX", label: "Open X", min: 0, max: 40, step: 0.5, unit: "px" },
];

const STYLE: Field<FramerTuning>[] = [
  {
    key: "corner",
    label: "Corner",
    min: 0,
    max: 40,
    step: 0.1,
    unit: "px",
    hint: "the boxes' corners; near-square at 5, a capsule past half the height",
  },
  {
    key: "goo",
    label: "Goo",
    min: 0,
    max: 10,
    step: 0.1,
    unit: "px",
    hint: "the blur that joins the two boxes as they part; 0 is none, the index's 2.5. On, it makes any strength solid",
  },
  {
    key: "alpha",
    label: "Box",
    min: 0.2,
    max: 1,
    step: 0.01,
    hint: "the box's strength",
  },
  {
    key: "labelAlpha",
    label: "Label",
    min: 0.2,
    max: 1,
    step: 0.01,
    hint: "the label's box's strength",
  },
];

const LABEL: Field<FramerTuning>[] = [
  { key: "word", label: "Size", min: 8, max: 48, step: 0.5, unit: "px" },
  {
    key: "top",
    label: "Drop",
    min: -80,
    max: 80,
    step: 0.5,
    unit: "px",
    hint: "how far below the button's top the label hangs; below 0 it rises above",
  },
  { key: "labelPadY", label: "Pad Y", min: 0, max: 24, step: 0.1, unit: "px" },
  { key: "labelPadX", label: "Pad X", min: 0, max: 40, step: 0.1, unit: "px" },
];

const PLACE: Field<FramerTuning>[] = [
  {
    key: "foot",
    label: "Foot",
    min: 0,
    max: 30,
    step: 0.25,
    unit: "vh",
    hint: "off the screen's foot — the label hangs below, so it needs room",
  },
];

const CSS = `
${BENCH_CSS}
.frb-stage { position: fixed; inset: 0; z-index: 1; overflow-y: auto; background: #faf9f6; color: #171717; }
.frb-page { display: grid; gap: 28px; max-width: 1120px; margin: 0 auto; padding: max(6vh, 64px) clamp(20px, 4vw, 56px) 40vh; }
@media (min-width: 760px) { .frb-page { padding-right: 368px; } }
.frb-label { margin: 0 0 8px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; opacity: .55; }
.frb-wall { position: relative; overflow: hidden; border: 1px solid rgba(23, 23, 23, .1); border-radius: 12px; background: #faf9f6; }
.frb-screen { height: 40vh; }
.frb-close { height: max(52vh, 320px); }
.frb-close .fr { bottom: auto; top: 38%; zoom: 2; }
.bench-panel { --bench-label: 5rem; }
.bench-panel .bench-row { gap: 10px; }
.frb-hold { display: flex; align-items: center; gap: 8px; }
`;

/** The Framer tab: the button on stand-in walls or the home page, and
 *  its knobs. */
export function FramerBench({ home }: { home: boolean }) {
  const t = useFramerTuning();
  const [hold, setHold] = useState(false);
  const gooId = useId();

  return (
    <div className="frb-stage">
      <style>{CSS + framerCss(t, gooId)}</style>
      {/* The goo: the contents index's filter — a blur and a hard alpha
          ramp, so two blurred shapes that touch fuse. */}
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        style={{ position: "absolute" }}
      >
        <filter id={gooId} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={t.goo} result="b" />
          <feColorMatrix
            in="b"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
          />
        </filter>
      </svg>

      <div className="bench-panel">
        <div className="bench-buttons">
          <button type="button" style={btn} onClick={store.reset}>
            Reset
          </button>
          <CopyValues values={t} />
        </div>
        <label className="frb-hold">
          <input
            type="checkbox"
            checked={hold}
            onChange={(e) => setHold(e.target.checked)}
          />
          Hold open
        </label>

        <div className="bench-group">
          <div className="bench-title">The style</div>
          <div className="bench-row is-wide">
            <span>Preset</span>
            <div className="bench-choice">
              <button
                type="button"
                aria-pressed={isPreset(t, CONTENTS_STYLE)}
                onClick={() => setFramer(CONTENTS_STYLE)}
              >
                Contents
              </button>
              <button
                type="button"
                aria-pressed={isPreset(t, FRAMER_STYLE)}
                onClick={() => setFramer(FRAMER_STYLE)}
              >
                Framer
              </button>
              <button
                type="button"
                aria-pressed={isPreset(t, ORIGINAL)}
                onClick={() => setFramer(ORIGINAL)}
              >
                Original
              </button>
            </div>
          </div>
          <Choice
            label="Corners"
            value={t.shape}
            options={[
              { value: "sharp", label: "Sharp" },
              { value: "round", label: "Round" },
              { value: "squircle", label: "Squircle" },
            ]}
            pick={(shape) => setFramer({ shape })}
          />
          <Group title="" fields={STYLE} values={t} set={setFramer} />
        </div>

        <div className="bench-group">
          <div className="bench-title">The spring</div>
          <SpringGraph
            period={t.period}
            bounce={t.bounce}
            onChange={({ bounce, period }) => setFramer({ bounce, period })}
          />
          <Group
            title=""
            fields={[
              {
                key: "period",
                label: "Swing",
                min: 60,
                max: 1200,
                step: 5,
                unit: "ms",
              },
              { key: "bounce", label: "Bounce", min: 0, max: 0.8, step: 0.01 },
            ]}
            values={t}
            set={setFramer}
          />
          <Choice
            label="Leaving"
            value={t.exit}
            options={[
              { value: "instant", label: "Label gone" },
              { value: "spring", label: "Springs back" },
            ]}
            pick={(exit) => setFramer({ exit })}
          />
        </div>

        <Group title="The V" fields={V_FIELDS} values={t} set={setFramer} />
        <Group title="The box" fields={BOX} values={t} set={setFramer} />

        <div className="bench-group">
          <Group title="The label" fields={LABEL} values={t} set={setFramer} />
          <label className="bench-row is-wide">
            <span>Text</span>
            <input
              className="bench-text"
              value={t.text}
              onChange={(e) => setFramer({ text: e.target.value })}
            />
          </label>
          <Choice
            label="Cut"
            value={t.cutOf}
            options={[
              { value: "regular", label: "Regular" },
              { value: "medium", label: "Medium" },
            ]}
            pick={(cutOf) => setFramer({ cutOf })}
          />
        </div>

        <div className="bench-group">
          <div className="bench-title">The colours</div>
          <Colour
            label="Box"
            value={t.color}
            pick={(color) => setFramer({ color })}
          />
          <Colour
            label="Label"
            value={t.labelColor}
            pick={(labelColor) => setFramer({ labelColor })}
          />
          <Colour
            label="V, words"
            value={t.fg}
            pick={(fg) => setFramer({ fg })}
          />
        </div>

        <Group title="The place" fields={PLACE} values={t} set={setFramer} />
      </div>

      {home ? (
        <HomeScreen>
          {() => (
            <div className="fr">
              <FramerButton t={t} hold={hold} />
            </div>
          )}
        </HomeScreen>
      ) : (
        <div className="frb-page">
          <section>
            <p className="frb-label">At size — the foot of the first screen</p>
            <div className="frb-wall frb-screen">
              <div className="fr">
                <FramerButton t={t} hold={hold} />
              </div>
            </div>
          </section>
          <section>
            <p className="frb-label">Up close — 2×</p>
            <div className="frb-wall frb-close">
              <div className="fr">
                <FramerButton t={t} hold={hold} />
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
