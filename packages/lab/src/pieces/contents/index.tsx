"use client";

import { useState } from "react";
import { BENCH_CSS, CopyValues, Group, btn, type Field } from "../../bench";
import {
  Contents,
  resetContentsTuning,
  setContentsTuning,
  useContentsTuning,
  type ContentsStop,
  type ContentsTuning,
} from "../../contents";

/**
 * The contents bench: the column (contents.tsx) in both its settings, on
 * a stand-in page that scrolls — the live one held at the left, the way
 * it stands in the project window's rail, and the pinned one in the
 * flow over the sections, the way a phone gets it. Scroll and the blue
 * runs down the column to the chapter being read; point at another
 * stop and it goes there for a look.
 *
 * The stops are LocalPal's chapters over grey blocks of uneven heights,
 * the last one short on purpose: it still has to become the current one.
 *
 * The knobs float at the bottom right: the rows' proportions, the gap
 * that holds the blue apart, the goo's reach and the two speeds.
 * Sliders write the contents store and the column regenerates its
 * stylesheet on every change, so what you set here is what the project
 * pages do — in this browser, until Reset. "Copy values" exports them
 * for CONTENTS_DEFAULTS in packages/lab/src/contents.tsx.
 */

const ROWS: Field<ContentsTuning>[] = [
  { key: "size", label: "Type", min: 11, max: 24, step: 0.5, unit: "px" },
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
    min: 0.2,
    max: 1.75,
    step: 0.05,
    unit: "em",
    hint: "the squircles' corners; half the row is a capsule",
  },
];

const MOVE: Field<ContentsTuning>[] = [
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
  {
    key: "swap",
    label: "Swap",
    min: 0,
    max: 1200,
    step: 10,
    unit: "ms",
    hint: "the blue's arrival, the ink's return",
  },
];

const STOPS: (ContentsStop & { tall: number })[] = [
  { id: "cb-overview", label: "Overview", tall: 90 },
  { id: "cb-research", label: "Research", tall: 150 },
  { id: "cb-development", label: "Development", tall: 180 },
  { id: "cb-final", label: "Final screens", tall: 110 },
  { id: "cb-post", label: "Post mortem", tall: 40 },
];

const CSS = `
${BENCH_CSS}
.cb-panel { position: fixed; right: 16px; bottom: 16px; z-index: 90; display: grid; gap: 10px; width: 320px; max-height: calc(100vh - 32px); overflow-y: auto; padding: 12px 14px 14px; border-radius: 14px; border: 1px solid rgba(128, 128, 128, 0.4); background: rgba(250, 249, 246, 0.92); color: #171717; font-size: 12px; backdrop-filter: blur(10px); }
.cb-panel .bench-row { grid-template-columns: 6rem 1fr 4rem; }
.cb-buttons { display: flex; flex-wrap: wrap; gap: 6px; }
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

  return (
    <div className="cb-stage" ref={setScroller}>
      <style>{CSS}</style>
      <div className="cb-panel">
        <div className="cb-buttons">
          <button type="button" style={btn} onClick={resetContentsTuning}>
            Reset
          </button>
          <CopyValues values={t} />
        </div>
        <Group
          title="The rows"
          fields={ROWS}
          values={t}
          set={setContentsTuning}
        />
        <Group
          title="The move"
          fields={MOVE}
          values={t}
          set={setContentsTuning}
        />
      </div>
      <div className="cb-page">
        <aside className="cb-rail">
          {scroller && <Contents stops={STOPS} scroller={scroller} />}
        </aside>
        <main>
          <Contents stops={STOPS} scroller={scroller} pinned />
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
