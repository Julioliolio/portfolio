"use client";

import { useState } from "react";
import {
  BENCH_CSS,
  CopyValues,
  Group,
  btn,
  mono,
  type Field,
} from "../../bench";
import {
  RansomNote,
  RansomStyles,
  hasScrap,
  hashSeed,
  resetRansomTuning,
  setRansomTuning,
  useRansomTuning,
  type RansomTuning,
} from "../../ransom";

/**
 * The ransom-note bench: type a note, re-roll its scraps, and tune how
 * messy it is. The note on the wall is the shared one (ransom.tsx), at
 * the store's values — sliders write the store, which it reads live, in
 * this browser, until Reset. "Copy values" exports them for
 * RANSOM_DEFAULTS in packages/lab/src/ransom.tsx.
 *
 * What is not here is somewhere else on purpose: the scraps' landing is
 * the motion tuning's (/lab/motion — beat, cuts, overshoot), and the rate
 * the resting paper boils at is the boil tuning's (/lab/boil). Sway here
 * is only how far.
 */

const FIRST = "stay weird";
/** The golden-ratio step, so each re-roll lands far from the last. */
const REROLL = 0x9e3779b1;

const CHAOS: Field<RansomTuning>[] = [
  {
    key: "tilt",
    label: "Tilt",
    min: 0,
    max: 22,
    step: 0.5,
    unit: "°",
    hint: "the most a scrap is turned, either way",
  },
  {
    key: "bounce",
    label: "Bounce",
    min: 0,
    max: 0.2,
    step: 0.005,
    hint: "the most it sits off the line, as a share of the line's height",
  },
];

const LAYOUT: Field<RansomTuning>[] = [
  {
    key: "scaleMix",
    label: "Scale mix",
    min: 0,
    max: 0.3,
    step: 0.01,
    hint: "the most a scrap is scaled, either way",
  },
  {
    key: "spacing",
    label: "Spacing",
    min: 0,
    max: 0.25,
    step: 0.01,
    hint: "the most extra room after a scrap, as a share of the line's height",
  },
  {
    key: "size",
    label: "Size",
    min: 40,
    max: 120,
    step: 1,
    unit: "px",
    hint: "the line's height; a line too long for the wall is set smaller",
  },
];

const LANDING: Field<RansomTuning>[] = [
  {
    key: "stagger",
    label: "Stagger",
    min: 0,
    max: 160,
    step: 5,
    unit: "ms",
    hint: "between one scrap's first cut and the next's; the cuts themselves are /lab/motion's",
  },
];

const POINTER: Field<RansomTuning>[] = [
  {
    key: "fps",
    label: "Frames",
    min: 4,
    max: 60,
    step: 1,
    unit: "/s",
    hint: "poses a second under the pointer: 12 is the site's held frames, 60 the reference's smooth",
  },
  {
    key: "radius",
    label: "Radius",
    min: 40,
    max: 320,
    step: 5,
    unit: "px",
    hint: "how near the pointer a scrap answers it",
  },
  {
    key: "push",
    label: "Pull",
    min: 0,
    max: 48,
    step: 1,
    unit: "px",
    hint: "how far a scrap is pulled toward the pointer, at full depth",
  },
  {
    key: "lift",
    label: "Lift",
    min: 0,
    max: 30,
    step: 1,
    unit: "px",
  },
  {
    key: "lean",
    label: "Lean",
    min: 0,
    max: 20,
    step: 0.5,
    unit: "°",
  },
  {
    key: "grow",
    label: "Grow",
    min: 0,
    max: 0.4,
    step: 0.01,
  },
];

const IDLE: Field<RansomTuning>[] = [
  {
    key: "sway",
    label: "Sway",
    min: 0,
    max: 3,
    step: 0.1,
    unit: "°",
    hint: "the resting boil: how far a scrap is re-posed off its angle, at /lab/boil's rate; 0 is taped down",
  },
];

const STAGE_CSS = `
.ransom-wall { display: grid; place-items: center; aspect-ratio: 1344 / 620; padding: 0 5%; overflow: hidden; background: #faf9f6; border: 1px solid rgba(23, 23, 23, .1); }
.ransom-text { font: inherit; font-size: 13px; color: inherit; background: none; border: 1px solid rgba(128, 128, 128, .45); border-radius: 8px; padding: 6px 10px; min-width: 0; flex: 1; resize: vertical; }
`;

export default function RansomNoteBench() {
  const values = useRansomTuning();
  const [text, setText] = useState(FIRST);
  const [rolls, setRolls] = useState(0);
  const missing = [...new Set(text.replace(/\s/g, ""))].filter(
    (ch) => !hasScrap(ch),
  );
  return (
    <div style={{ display: "grid", gap: 20, width: "min(720px, 100%)" }}>
      <style>{BENCH_CSS + STAGE_CSS}</style>
      <RansomStyles />

      <div
        style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 13 }}
      >
        <button
          type="button"
          style={btn}
          onClick={() => setRolls((r) => r + 1)}
        >
          ▶ Re-roll
        </button>
        <span style={{ fontFamily: mono, fontSize: 12, opacity: 0.7 }}>
          hover the note · click a scrap to swap it · drag one and let go
        </span>
      </div>

      <div className="ransom-wall">
        {/* Re-keyed by the roll, so a re-roll lands the note again; typing
            only re-lays it. */}
        <RansomNote
          key={rolls}
          text={text}
          seed={(hashSeed(FIRST) + rolls * REROLL) >>> 0}
          gate="mount"
        />
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "start" }}>
        <textarea
          className="ransom-text"
          rows={2}
          maxLength={80}
          value={text}
          placeholder="type a note"
          aria-label="The note's text"
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      {missing.length > 0 && (
        <div style={{ fontFamily: mono, fontSize: 12, opacity: 0.7 }}>
          no scraps for {missing.join(" ")} — set as gaps
        </div>
      )}

      <Group
        title="Chaos"
        fields={CHAOS}
        values={values}
        set={setRansomTuning}
      />
      <Group
        title="Layout"
        fields={LAYOUT}
        values={values}
        set={setRansomTuning}
      />
      <Group
        title="Landing"
        fields={LANDING}
        values={values}
        set={setRansomTuning}
      />
      <Group
        title="Pointer"
        fields={POINTER}
        values={values}
        set={setRansomTuning}
      />
      <Group title="Idle" fields={IDLE} values={values} set={setRansomTuning} />

      <div style={{ display: "flex", gap: 8 }}>
        <CopyValues values={values} />
        <button type="button" style={btn} onClick={resetRansomTuning}>
          Reset
        </button>
      </div>
    </div>
  );
}
