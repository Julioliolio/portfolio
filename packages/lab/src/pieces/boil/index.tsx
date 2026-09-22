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
  resetBoilTuning,
  setBoilTuning,
  useBoilTuning,
  type BoilTuning,
} from "../../boil";
import { GREETING_LINE, GreetingStyles, Speech } from "../../greeting";
import { useMotionTuning } from "../../motion";

/**
 * The boil bench: the knobs for the site's boil. The hero's line is on
 * the wall, its lit letters boiling under the pointer. Sliders write the
 * boil store, which the line reads live, so what you set here is what
 * the home page does — in this browser, until Reset. "Copy values"
 * exports them for BOIL_DEFAULTS in packages/lab/src/boil.tsx. The
 * stamps are the motion tuning's: /lab/motion.
 */

const BOIL: Field<BoilTuning>[] = [
  {
    key: "boilFps",
    label: "Rate",
    min: 1,
    max: 12,
    step: 0.1,
    unit: "/s",
    hint: "boil frames a second; claymation holds boil at four to five",
  },
  {
    key: "boilShove",
    label: "Shove",
    min: 0,
    max: 8,
    step: 0.1,
    unit: "%",
    hint: "how far the outlines are pushed, as a share of the boil's span",
  },
  {
    key: "boilFloor",
    label: "Floor",
    min: 0,
    max: 8,
    step: 0.5,
    unit: "px",
    hint: "the least push, so small words still move — the cue's at the landing's size",
  },
  {
    key: "boilWave",
    label: "Wave",
    min: 0.5,
    max: 8,
    step: 0.1,
    hint: "swells of noise across the span: few bend whole strokes, many fray the edges",
  },
  {
    key: "boilGrain",
    label: "Grain",
    min: 1,
    max: 3,
    step: 1,
    hint: "octaves of finer noise over the swells",
  },
];

const STAGE_CSS = `
.boil-wall { display: grid; gap: 24px; padding: 32px 24px 0; background: #faf9f6; color: #171717; border: 1px solid rgba(23, 23, 23, .1); }
.boil-words { text-align: center; white-space: nowrap; font-size: clamp(34px, 6vw, 60px); line-height: 1.1; letter-spacing: -.02em; }
`;

export default function BoilBench() {
  const values = useBoilTuning();
  const motion = useMotionTuning();
  const [run, setRun] = useState(0);
  return (
    <div style={{ display: "grid", gap: 20, width: "min(720px, 100%)" }}>
      <style>{BENCH_CSS + STAGE_CSS}</style>
      <GreetingStyles />

      <div
        style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 13 }}
      >
        <button type="button" style={btn} onClick={() => setRun((r) => r + 1)}>
          ▶ Say it again
        </button>
        <span style={{ fontFamily: mono, fontSize: 12, opacity: 0.7 }}>
          hover the words
        </span>
      </div>

      <div className="boil-wall" key={run}>
        <Speech
          lines={GREETING_LINE}
          base={motion.lead}
          step={motion.stagger}
          className="boil-words"
        />
      </div>

      <Group title="Boil" fields={BOIL} values={values} set={setBoilTuning} />

      <div style={{ display: "flex", gap: 8 }}>
        <CopyValues values={values} />
        <button type="button" style={btn} onClick={resetBoilTuning}>
          Reset
        </button>
      </div>
    </div>
  );
}
