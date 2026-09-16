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
import { CUE_VH, Cue, CueStyles } from "../../cue";
import { GREETING_LINE, GreetingStyles, Speech } from "../../greeting";
import { useMotionTuning } from "../../motion";

/**
 * The boil bench: one set of knobs for every boil on the site. Both
 * things that boil are on the wall — the scroll cue, big, whose words
 * pop in and boil under the pointer; and the hero's line, whose lit
 * letters boil under it. Sliders write the boil store, which both read
 * live, so what you set here is what the home page does — in this
 * browser, until Reset. "Copy values" exports them for BOIL_DEFAULTS in
 * packages/lab/src/boil.tsx. The pops and stamps are the motion
 * tuning's: /lab/motion.
 */

/** The cue's height here, vh — the landing's, several times over. */
const CUE_SIZE = CUE_VH * 5;

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
    key: "boilWait",
    label: "Wait",
    min: 0,
    max: 800,
    step: 10,
    unit: "ms",
    hint: "after the cue's words have popped, before their boil starts",
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
.boil-cue { position: relative; height: ${CUE_SIZE * 2.2}vh; }
`;

export default function BoilBench() {
  const values = useBoilTuning();
  const motion = useMotionTuning();
  const [run, setRun] = useState(0);
  return (
    <div style={{ display: "grid", gap: 20, width: "min(720px, 100%)" }}>
      <style>{BENCH_CSS + STAGE_CSS}</style>
      <CueStyles />
      <GreetingStyles />

      <div
        style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 13 }}
      >
        <button type="button" style={btn} onClick={() => setRun((r) => r + 1)}>
          ▶ Say it again
        </button>
        <span style={{ fontFamily: mono, fontSize: 12, opacity: 0.7 }}>
          hover the words and the cue
        </span>
      </div>

      <div className="boil-wall" key={run}>
        <Speech
          lines={GREETING_LINE}
          base={motion.lead}
          step={motion.stagger}
          className="boil-words"
        />
        <div className="boil-cue">
          <Cue
            dir="down"
            shown
            delay={motion.lead + 3 * motion.stagger}
            size={CUE_SIZE}
            label="The scroll cue"
            text={["View", "projects"]}
            onClick={() => {}}
          />
        </div>
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
