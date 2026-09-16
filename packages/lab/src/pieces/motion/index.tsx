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
  ENTER_KINDS,
  Enter,
  Stagger,
  resetMotionTuning,
  setMotionTuning,
  useMotionTuning,
  type MotionTuning,
} from "../../motion";

/**
 * The stop-motion bench. Sliders write the motion store; <MotionStyles>
 * in the root layout regenerates the stylesheet on every change, so what
 * you set here moves every entrance on the site — the road signs, the
 * cartel, every <Enter> — not just the preview below. Values are kept in
 * this browser until Reset; "Copy values" exports them for
 * MOTION_DEFAULTS in packages/lab/src/motion.tsx.
 */

const BEAT: Field<MotionTuning>[] = [
  {
    key: "duration",
    label: "Run",
    min: 0.15,
    max: 1,
    step: 0.01,
    unit: "s",
    hint: "how long a drop takes from first pose to rest; a pop is shorter, an unfold longer",
  },
  {
    key: "cuts",
    label: "Cuts",
    min: 1,
    max: 4,
    step: 1,
    hint: "held poses after the start: 1 is a single jump to rest, 2 adds the landing, 3 the settle, 4 a second small landing",
  },
  {
    key: "stagger",
    label: "Stagger",
    min: 0,
    max: 300,
    step: 5,
    unit: "ms",
    hint: "gap between one sibling's first cut and the next's — Arjun's site uses 70 to 140",
  },
  {
    key: "lead",
    label: "Lead",
    min: 0,
    max: 600,
    step: 10,
    unit: "ms",
    hint: "wait before the first sibling moves",
  },
];

const PUNCH: Field<MotionTuning>[] = [
  {
    key: "distance",
    label: "Distance",
    min: 0,
    max: 160,
    step: 2,
    unit: "px",
    hint: "how far off things start — a drop's height, a slide's reach",
  },
  {
    key: "startScale",
    label: "Start size",
    min: 0.3,
    max: 1,
    step: 0.01,
    unit: "×",
    hint: "size in the first pose for things that grow in; a stamp comes in at one over this",
  },
  {
    key: "overshoot",
    label: "Overshoot",
    min: 1,
    max: 1.4,
    step: 0.01,
    unit: "×",
    hint: "size on the landing cut, past rest",
  },
  {
    key: "settle",
    label: "Settle",
    min: 0.85,
    max: 1,
    step: 0.005,
    unit: "×",
    hint: "size on the settle cut, a hair short of rest",
  },
  {
    key: "squash",
    label: "Squash",
    min: 0,
    max: 0.25,
    step: 0.005,
    hint: "wide-and-short on the landing, area kept; the settle carries a third of it the other way",
  },
  {
    key: "tilt",
    label: "Tilt",
    min: 0,
    max: 25,
    step: 0.5,
    unit: "°",
    hint: "lean in the first pose; landings counter-tilt a fraction of it",
  },
];

const RESPONSE: Field<MotionTuning>[] = [
  {
    key: "hoverLift",
    label: "Hover lift",
    min: 0,
    max: 12,
    step: 0.5,
    unit: "px",
  },
  {
    key: "hoverCuts",
    label: "Lift cuts",
    min: 1,
    max: 4,
    step: 1,
    hint: "the lift jumps in this many cuts, and back down the same way",
  },
  {
    key: "hoverMs",
    label: "Lift time",
    min: 40,
    max: 400,
    step: 10,
    unit: "ms",
  },
];

const PREVIEW_CSS = `
.mb-board { position: relative; display: grid; grid-template-columns: 150px 1fr; gap: 24px; align-items: start; padding: 24px; background: #f3efe9; color: #2b2722; border: 1px solid rgba(43, 39, 34, .12); }
.mb-polaroid { box-sizing: border-box; width: 150px; padding: 8px 8px 26px; background: #fff; box-shadow: 0 0 0 1px rgba(43, 39, 34, .2), 0 10px 18px rgba(0, 0, 0, .12); }
.mb-polaroid .pic { aspect-ratio: 1 / 1.1; background: linear-gradient(160deg, #e9e5de, #d6d0c6); }
.mb-h2 { margin: 0 0 6px; font-size: 22px; font-weight: 600; letter-spacing: -.02em; line-height: 1.05; }
.mb-rule { height: 2px; width: 100%; margin: 4px 0 10px; background: #2b2722; }
.mb-p { margin: 0 0 6px; font-size: 13px; line-height: 1.45; color: #57514a; }
.mb-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.mb-chip { display: inline-block; padding: 3px 8px; border: 1px solid #1f4fc2; color: #1f4fc2; font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; }
.mb-kinds { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
.mb-kinds .tile { display: grid; place-items: center; width: 78px; height: 52px; background: #fff; color: #2b2722; border: 1px solid rgba(43, 39, 34, .2); font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; }
`;

export default function MotionBench() {
  const values = useMotionTuning();
  const [run, setRun] = useState(0);

  const beat = values.cuts / values.duration;

  return (
    <div style={{ display: "grid", gap: 20, width: "min(720px, 100%)" }}>
      <style>{BENCH_CSS + PREVIEW_CSS}</style>

      <div
        style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 13 }}
      >
        <button type="button" style={btn} onClick={() => setRun((r) => r + 1)}>
          ▶ Replay
        </button>
        <span style={{ fontFamily: mono, fontSize: 12, opacity: 0.7 }}>
          {beat.toFixed(1)} cuts/s · a drop every{" "}
          {Math.round((values.duration / values.cuts) * 1000)}ms
        </span>
      </div>

      <div className="mb-board" key={run}>
        <Stagger>
          <Enter kind="drop">
            <div className="mb-polaroid sm-hover-lift">
              <div className="pic" />
            </div>
          </Enter>
          <Enter kind="stamp" as="header">
            <h2 className="mb-h2">Road signs</h2>
            <Enter
              kind="rule"
              className="mb-rule"
              delay={values.lead + values.stagger * 2}
            />
            <Stagger base={values.lead + values.stagger * 3}>
              <Enter kind="slide" as="p" className="mb-p">
                Three photographed road signs, stacked like a signpost.
              </Enter>
              <Enter kind="slide" as="p" className="mb-p">
                Every pose change is a handful of hard cuts on a beat.
              </Enter>
            </Stagger>
            <div className="mb-chips">
              <Stagger
                step={Math.round(values.stagger * 0.8)}
                base={values.lead + values.stagger * 6}
              >
                <Enter kind="pop" as="span" className="mb-chip sm-hover-shake">
                  iOS
                </Enter>
                <Enter kind="pop" as="span" className="mb-chip sm-hover-shake">
                  Design system
                </Enter>
                <Enter kind="pop" as="span" className="mb-chip sm-hover-shake">
                  End-to-end
                </Enter>
              </Stagger>
            </div>
          </Enter>
        </Stagger>
        <div className="mb-kinds" style={{ gridColumn: "1 / -1" }}>
          <Stagger base={values.lead + values.stagger * 8}>
            {ENTER_KINDS.map((kind) => (
              <Enter key={kind} kind={kind} className="tile">
                {kind}
              </Enter>
            ))}
          </Stagger>
        </div>
      </div>

      <Group title="Beat" fields={BEAT} values={values} set={setMotionTuning} />
      <Group
        title="Punch"
        fields={PUNCH}
        values={values}
        set={setMotionTuning}
      />
      <Group
        title="Responses"
        fields={RESPONSE}
        values={values}
        set={setMotionTuning}
      />

      <div
        style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}
      >
        <button type="button" style={btn} onClick={resetMotionTuning}>
          Reset
        </button>
        <CopyValues values={values} />
      </div>
      <p style={{ margin: 0, fontSize: 12, opacity: 0.6, lineHeight: 1.5 }}>
        These values apply on every page of the site in this browser (the road
        signs&apos; and cartel&apos;s entrances too) until Reset. Lock a feel in
        by pasting them into MOTION_DEFAULTS in packages/lab/src/motion.tsx.
      </p>
    </div>
  );
}
