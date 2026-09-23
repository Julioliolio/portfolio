"use client";

import { useState } from "react";
import {
  BENCH_CSS,
  Choice,
  Colour,
  CopyValues,
  Group,
  btn,
  type Field,
} from "../../bench";
import { BLUE } from "../../style";
import { SpringGraph } from "../cue/graph";
import {
  Contents,
  resetContentsTuning,
  setContentsTuning,
  useContentsTuning,
  type ContentsStop,
  type ContentsTuning,
} from "../../contents";
import {
  SOUND_FIELDS,
  setSoundTuning,
  useSoundTuning,
  type SoundTuning,
} from "../../sound";
import {
  ContentsGoo,
  resetGooTuning,
  setGooTuning,
  useGooTuning,
  type GooTuning,
} from "./goo";

/**
 * The contents bench: the column (contents.tsx) in both its settings, on
 * a stand-in page that scrolls — the live one held at the left, the way
 * it stands in the project window's rail, and the pinned one in the
 * flow over the sections, the way a phone gets it. Scroll and the
 * selection runs down the column as the chapters are read; point at a
 * stop and it is selected for a look.
 *
 * The stops are LocalPal's chapters over grey blocks of uneven heights,
 * the last one short on purpose: it still has to become the current one.
 *
 * The knobs float at the bottom right. Sliders write the contents store
 * and the column regenerates its stylesheet on every change, so what
 * you set here is what the project pages do — in this browser, until
 * Reset. "Copy values" exports them for CONTENTS_DEFAULTS in
 * packages/lab/src/contents.tsx. The sound rows write the sound store
 * (/lab/sound), not this piece's.
 *
 * "Column" swaps in the goo column (goo.tsx), the index as it was
 * before the selection: its own knobs come up with it — the rows'
 * proportions, the gap that holds the blue apart, the goo's reach, the
 * neighbours' slide — and two presets, the site's old look and the
 * Framer button's. The type, the colours, the sweep and the spring are
 * shared by both columns.
 */

/** The keys a goo preset sets. */
const LOOK_KEYS = ["corner", "shape", "row", "side", "gap", "blur"] as const;
type Look = Pick<GooTuning, (typeof LOOK_KEYS)[number]>;

/** The site's, as it was. */
const SITE_LOOK: Look = {
  corner: 0.2,
  shape: "squircle",
  row: 2.2,
  side: 1.4,
  gap: 0.5,
  blur: 3,
};

/** The Framer original's (2026-09-23): words as if highlighted — sharp,
 *  the box tight round the words (the original's 4px at 1.2 line
 *  height), the rows close, no goo. */
const BUTTON_LOOK: Look = {
  corner: 0,
  shape: "squircle",
  row: 1.6,
  side: 0.3,
  gap: 0.2,
  blur: 0,
};

function isLook(g: GooTuning, look: Look) {
  return LOOK_KEYS.every((k) => g[k] === look[k]);
}

const SELECTION: Field<ContentsTuning>[] = [
  {
    key: "line",
    label: "Line",
    min: 1,
    max: 2,
    step: 0.05,
    unit: "em",
    hint: "a row's height: the line box the selection fills",
  },
  {
    key: "side",
    label: "Side",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "em",
    hint: "the selection's reach past the words",
  },
  {
    key: "stagger",
    label: "Stagger",
    min: 0,
    max: 300,
    step: 10,
    unit: "ms",
    hint: "in a range, between one line's sweep and the next's",
  },
  {
    key: "overlap",
    label: "Overlap",
    min: 0,
    max: 0.6,
    step: 0.05,
    unit: "em",
    hint: "how far each box reaches past its line, up and down",
  },
  {
    key: "tilt",
    label: "Tilt",
    min: 0,
    max: 6,
    step: 0.25,
    unit: "°",
    hint: "the most the row under the pointer leans; each hover draws its own, either way",
  },
  {
    key: "alpha",
    label: "Blue",
    min: 0.5,
    max: 1,
    step: 0.05,
    hint: "the blue's strength; under 1 the overlaps show",
  },
];

const GOO_ROWS: Field<GooTuning>[] = [
  {
    key: "row",
    label: "Row",
    min: 1.4,
    max: 3.5,
    step: 0.05,
    unit: "em",
    hint: "a row's height, in the type's em",
  },
  { key: "side", label: "Side", min: 0.4, max: 2.5, step: 0.05, unit: "em" },
  {
    key: "corner",
    label: "Corner",
    min: 0,
    max: 1.75,
    step: 0.05,
    unit: "em",
    hint: "the squircles' corners; half the row is a capsule",
  },
  {
    key: "gap",
    label: "Gap",
    min: 0,
    max: 2,
    step: 0.05,
    unit: "em",
    hint: "what holds the blue off its neighbours, each side",
  },
  {
    key: "blur",
    label: "Goo",
    min: 0,
    max: 14,
    step: 0.5,
    unit: "px",
    hint: "how far two shapes reach for each other",
  },
  {
    key: "slide",
    label: "Slide",
    min: 0,
    max: 1200,
    step: 10,
    unit: "ms",
    hint: "the neighbours' move",
  },
];

const MOVE: Field<ContentsTuning>[] = [
  { key: "size", label: "Type", min: 11, max: 24, step: 0.5, unit: "px" },
  {
    key: "swap",
    label: "Swap",
    min: 0,
    max: 1200,
    step: 10,
    unit: "ms",
    hint: "a sweep, the blue's arrival — on the spring, its swing",
  },
];

const SPRING: Field<ContentsTuning>[] = [
  {
    key: "bounce",
    label: "Bounce",
    min: 0,
    max: 0.8,
    step: 0.01,
    hint: "how far the arrival runs past its place (the way back doesn't)",
  },
];

/** The column's own level, from the sound tuning's rows. */
const SOUND: Field<SoundTuning>[] = SOUND_FIELDS.filter(
  (f) => f.key === "contents" || f.key === "master",
);

const STOPS: (ContentsStop & { tall: number })[] = [
  { id: "cb-overview", label: "Overview", tall: 90 },
  { id: "cb-research", label: "Research", tall: 150 },
  { id: "cb-development", label: "Development", tall: 180 },
  { id: "cb-final", label: "Final screens", tall: 110 },
  { id: "cb-post", label: "Post mortem", tall: 40 },
];

const CSS = `
${BENCH_CSS}
.cb-stage { position: fixed; inset: 0; z-index: 1; overflow-y: auto; background: #faf9f6; }
.cb-page { display: grid; grid-template-columns: minmax(0, 1fr); gap: 40px; max-width: 1120px; margin: 0 auto; padding: 12vh clamp(20px, 4vw, 56px) 30vh; }
.cb-rail { display: none; }
@media (min-width: 701px) {
  .cb-page { grid-template-columns: 240px minmax(0, 1fr); }
  .cb-rail { display: block; position: sticky; top: 12vh; align-self: start; }
}
.cb-section { margin-top: 96px; scroll-margin-top: 24px; }
.cb-section h2 { margin: 0 0 18px; max-width: 620px; font-weight: 600; font-size: 24px; line-height: 1.2; letter-spacing: -.02em; color: #2b2722; }
.cb-block { border-radius: 12px; background: #ecebe8; }
`;

export default function ContentsBench() {
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const t = useContentsTuning();
  const g = useGooTuning();
  const sound = useSoundTuning();
  const Column = g.column === "goo" ? ContentsGoo : Contents;

  return (
    <div className="cb-stage" ref={setScroller}>
      <style>{CSS}</style>
      <div className="bench-panel">
        <div className="bench-buttons">
          <button
            type="button"
            style={btn}
            onClick={() => {
              resetContentsTuning();
              resetGooTuning();
            }}
          >
            Reset
          </button>
          <CopyValues values={t} />
        </div>
        <div className="bench-group">
          <div className="bench-title">The look</div>
          <Choice
            label="Column"
            value={g.column}
            options={[
              { value: "site", label: "The site's" },
              { value: "goo", label: "The goo's" },
            ]}
            pick={(column) => setGooTuning({ column })}
          />
          <Colour
            label="Blue"
            value={t.tint || BLUE}
            pick={(tint) => setContentsTuning({ tint })}
          />
        </div>
        {g.column === "goo" ? (
          <div className="bench-group">
            <div className="bench-title">The goo</div>
            <div className="bench-row is-wide">
              <span>Preset</span>
              <div className="bench-choice">
                <button
                  type="button"
                  aria-pressed={isLook(g, SITE_LOOK)}
                  onClick={() => setGooTuning(SITE_LOOK)}
                >
                  The site's
                </button>
                <button
                  type="button"
                  aria-pressed={isLook(g, BUTTON_LOOK)}
                  onClick={() => setGooTuning(BUTTON_LOOK)}
                >
                  The button's
                </button>
              </div>
            </div>
            <Choice
              label="Corners"
              value={g.shape}
              options={[
                { value: "squircle", label: "Squircle" },
                { value: "round", label: "Round" },
              ]}
              pick={(shape) => setGooTuning({ shape })}
            />
            <Group title="" fields={GOO_ROWS} values={g} set={setGooTuning} />
          </div>
        ) : (
          <div className="bench-group">
            <div className="bench-title">The selection</div>
            <Choice
              label="Blue is"
              value={t.blue}
              options={[
                { value: "range", label: "Read so far" },
                { value: "line", label: "The line read" },
              ]}
              pick={(blue) => setContentsTuning({ blue })}
            />
            <Choice
              label="Bar"
              value={t.bar}
              options={[
                { value: "off", label: "Off" },
                { value: "on", label: "On" },
              ]}
              pick={(bar) => setContentsTuning({ bar })}
            />
            <Group
              title=""
              fields={SELECTION}
              values={t}
              set={setContentsTuning}
            />
          </div>
        )}
        <div className="bench-group">
          <div className="bench-title">The move</div>
          <Choice
            label="Motion"
            value={t.motion}
            options={[
              { value: "ease", label: "Ease" },
              { value: "spring", label: "Spring" },
            ]}
            pick={(motion) => setContentsTuning({ motion })}
          />
          {t.motion === "spring" && (
            <>
              <SpringGraph
                period={t.swap}
                bounce={t.bounce}
                onChange={({ bounce, period }) =>
                  setContentsTuning({ bounce, swap: period })
                }
              />
              <Group
                title=""
                fields={SPRING}
                values={t}
                set={setContentsTuning}
              />
            </>
          )}
          <Group title="" fields={MOVE} values={t} set={setContentsTuning} />
        </div>
        <Group
          title="The sound"
          fields={SOUND}
          values={sound}
          set={setSoundTuning}
        />
      </div>
      <div className="cb-page">
        <aside className="cb-rail">
          {scroller && <Column stops={STOPS} scroller={scroller} />}
        </aside>
        <main>
          <Column stops={STOPS} scroller={scroller} pinned />
          {STOPS.map((r) => (
            <section className="cb-section" id={r.id} key={r.id}>
              <h2>{r.label}</h2>
              <div className="cb-block" style={{ height: `${r.tall}vh` }} />
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
