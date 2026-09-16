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
  GREETING_HELLO,
  GREETING_LINE,
  GreetingStyles,
  Speech,
  countWords,
  resetGreetingTuning,
  setGreetingTuning,
  useGreetingTuning,
  type GreetingTuning,
} from "../../greeting";
import { useMotionTuning } from "../../motion";

/**
 * The greeting bench. The words as the landing says them, big on the
 * wall, under the pointer; sliders write the greeting store, and
 * <GreetingStyles> regenerates the stylesheet on every change, so what
 * you set here is what the home page does — in this browser, until
 * Reset. "Copy values" exports them for GREETING_DEFAULTS in
 * packages/lab/src/greeting.tsx. The stamp's own clock and poses are
 * the motion tuning's: /lab/motion. The highlight is shown here only:
 * the landing's speeches do not ask for it.
 */

const HIGHLIGHT: Field<GreetingTuning>[] = [
  {
    key: "markAlpha",
    label: "Opacity",
    min: 0,
    max: 1,
    step: 0.01,
    hint: "how solid the highlight is over the wall",
  },
  {
    key: "markPad",
    label: "Slack",
    min: 0,
    max: 0.2,
    step: 0.005,
    unit: "em",
    hint: "how far the highlight reaches past the letters at the ends of a run",
  },
];

const POSE: Field<GreetingTuning>[] = [
  {
    key: "tilt",
    label: "Tilt",
    min: 0,
    max: 20,
    step: 0.5,
    unit: "°",
    hint: "the held letter's lean; neighbours lean less",
  },
  {
    key: "scatter",
    label: "Scatter",
    min: 0,
    max: 1,
    step: 0.01,
    hint: "how far each letter's own lean strays from the tilt — 0 all the same way, 1 anywhere from one way to the other",
  },
  {
    key: "hair",
    label: "Hairline",
    min: 0,
    max: 0.06,
    step: 0.001,
    unit: "em",
    hint: "the stroke around a held letter, in its own ink",
  },
  {
    key: "swing",
    label: "Swing",
    min: 0,
    max: 1,
    step: 0.01,
    unit: "×",
    hint: "how much of the entrance stamp's swing a letter keeps — its displacement, tilt and size change",
  },
];

const WAVE: Field<GreetingTuning>[] = [
  {
    key: "reach",
    label: "Reach",
    min: 0,
    max: 4,
    step: 0.1,
    unit: "em",
    hint: "how far along the line from the pointer a letter stamps, to the letter's cell — across the gaps between words, never to another line",
  },
  {
    key: "falloff",
    label: "Falloff",
    min: 0.1,
    max: 1,
    step: 0.01,
    unit: "×",
    hint: "a letter's share falls to this for every letter-width it is from the pointer",
  },
];

const PREVIEW_CSS = `
.gb-wall { display: grid; justify-items: center; gap: .3em; padding: 40px 24px; background: #faf9f6; color: #171717; border: 1px solid rgba(23, 23, 23, .1); font-size: clamp(34px, 6vw, 60px); line-height: 1.1; letter-spacing: -.02em; }
.gb-words { text-align: center; white-space: nowrap; }
`;

export default function GreetingBench() {
  const values = useGreetingTuning();
  const motion = useMotionTuning();
  const [run, setRun] = useState(0);

  const afterHello =
    motion.lead + countWords(GREETING_HELLO) * motion.stagger + 200;

  return (
    <div style={{ display: "grid", gap: 20, width: "min(720px, 100%)" }}>
      <GreetingStyles />
      <style>{BENCH_CSS + PREVIEW_CSS}</style>

      <div
        style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 13 }}
      >
        <button type="button" style={btn} onClick={() => setRun((r) => r + 1)}>
          ▶ Say it again
        </button>
        <span style={{ fontFamily: mono, fontSize: 12, opacity: 0.7 }}>
          hover the letters · the stamp&apos;s clock is /lab/motion&apos;s
        </span>
      </div>

      <div className="gb-wall" key={run}>
        <Speech
          lines={GREETING_HELLO}
          base={motion.lead}
          step={motion.stagger}
          className="gb-words"
          highlight
        />
        <Speech
          lines={GREETING_LINE}
          base={afterHello}
          step={motion.stagger}
          className="gb-words"
          highlight
        />
      </div>

      <Group
        title="Highlight (bench only)"
        fields={HIGHLIGHT}
        values={values}
        set={setGreetingTuning}
      />
      <label className="bench-row">
        <span>Colour</span>
        <input
          type="color"
          value={values.mark}
          onChange={(e) => setGreetingTuning({ mark: e.target.value })}
          style={{
            width: 48,
            height: 28,
            padding: 0,
            border: 0,
            background: "none",
          }}
        />
        <span className="bench-value">{values.mark}</span>
      </label>
      <Group
        title="Held pose"
        fields={POSE}
        values={values}
        set={setGreetingTuning}
      />
      <Group
        title="Wave"
        fields={WAVE}
        values={values}
        set={setGreetingTuning}
      />

      <div
        style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}
      >
        <button type="button" style={btn} onClick={resetGreetingTuning}>
          Reset
        </button>
        <CopyValues values={values} />
      </div>
      <p style={{ margin: 0, fontSize: 12, opacity: 0.6, lineHeight: 1.5 }}>
        These values apply to the home page&apos;s greeting in this browser
        until Reset. Lock a feel in by pasting them into GREETING_DEFAULTS in
        packages/lab/src/greeting.tsx.
      </p>
    </div>
  );
}
