"use client";

import { Suspense, lazy, useState } from "react";
import { BENCH_CSS, CopyValues, Group, btn, type Field } from "../../bench";
import {
  GREETING_HELLO,
  GREETING_LINE,
  GreetingStyles,
  Speech,
  afterHello,
} from "../../greeting";
import {
  HelloStyles,
  resetHelloTuning,
  setHelloTuning,
  useHelloTuning,
  type HelloTuning,
} from "../../hello";
import { useMotionTuning } from "../../motion";

/**
 * The hello screen's bench: the landing's first screen, full size, with
 * the layout knobs floating over it — where the sign sits and how big,
 * the row's place, the words' size. Sliders write the hello store and
 * <HelloStyles> regenerates the row's stylesheet on every change, so
 * what you set here is what the home page does — in this browser,
 * until Reset. "Copy values" exports them for HELLO_DEFAULTS in
 * packages/lab/src/hello.tsx.
 *
 * The sign is the real cartel, loaded here the way the landing loads
 * it, with its plain entrance rather than the landing's held one: the
 * bench is about where things sit, not the dialogue's order.
 */

const Cartel = lazy(() => import("../cartel"));

const SIGN: Field<HelloTuning>[] = [
  {
    key: "signHeight",
    label: "Height",
    min: 12,
    max: 60,
    step: 0.5,
    unit: "vh",
    hint: "the sign's height; its width follows the frames",
  },
  {
    key: "signX",
    label: "Across",
    min: -20,
    max: 20,
    step: 0.1,
    unit: "vw",
    hint: "the sign's shift from its slot, right; the words stay put",
  },
  {
    key: "signY",
    label: "Down",
    min: -20,
    max: 20,
    step: 0.1,
    unit: "vh",
    hint: "the sign's shift from its slot, down",
  },
];

const ROW: Field<HelloTuning>[] = [
  {
    key: "rowX",
    label: "Across",
    min: -20,
    max: 20,
    step: 0.1,
    unit: "vw",
    hint: "the whole row's shift from the screen's centre, right",
  },
  {
    key: "rowY",
    label: "Down",
    min: -30,
    max: 30,
    step: 0.1,
    unit: "vh",
    hint: "the whole row's shift from the screen's centre, down",
  },
  {
    key: "gap",
    label: "Gap",
    min: 0,
    max: 10,
    step: 0.1,
    unit: "vw",
    hint: "the breath between the words and the sign",
  },
];

const WORDS: Field<HelloTuning>[] = [
  {
    key: "wordSize",
    label: "Size",
    min: 3,
    max: 12,
    step: 0.1,
    unit: "vh",
    hint: "the words' size by the height",
  },
  {
    key: "wordCap",
    label: "Cap",
    min: 2,
    max: 10,
    step: 0.1,
    unit: "vw",
    hint: "the words' size is capped by the width too, so a squarer window still fits the row",
  },
  {
    key: "wordsTop",
    label: "Drop",
    min: -3,
    max: 6,
    step: 0.1,
    unit: "vh",
    hint: "the words' drop from the row's top, lining their caps up with the sign's top",
  },
];

/* The stage, the floating panel, and the panel's tighter take on the
   shared bench rows: it is 340px wide. */
const STAGE_CSS = `
.hb-stage { position: fixed; inset: 0; z-index: 1; display: grid; place-items: center; background: #faf9f6; color: #171717; overflow: hidden; }
.hb-panel { position: fixed; left: 16px; bottom: 16px; z-index: 2; display: grid; gap: 10px; width: min(340px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; padding: 14px 16px; background: rgba(255, 255, 255, .92); color: #171717; border: 1px solid rgba(23, 23, 23, .12); border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, .1); backdrop-filter: blur(8px); }
.hb-panel .bench-group { gap: 6px; }
.hb-panel .bench-title { margin-top: 4px; }
.hb-panel .bench-row { grid-template-columns: 4.5rem 1fr 4.5rem; gap: 10px; font-size: 12px; }
.hb-panel .bench-value { font-size: 11px; }
`;

export default function HelloBench() {
  const values = useHelloTuning();
  const motion = useMotionTuning();
  const [run, setRun] = useState(0);

  const lineAt = afterHello(motion);

  return (
    <>
      <style>{BENCH_CSS + STAGE_CSS}</style>
      <HelloStyles />
      <GreetingStyles />

      <div className="hb-stage">
        <div className="hello-row" key={run}>
          <Speech
            lines={GREETING_HELLO}
            base={motion.lead}
            step={motion.stagger}
            className="hello-words"
          />
          <div className="hello-sign">
            <Suspense fallback={null}>
              <Cartel
                height="100%"
                controls={false}
                radius="page"
                placeholder={false}
              />
            </Suspense>
          </div>
          <div className="hello-line-slot">
            <Speech
              lines={GREETING_LINE}
              base={lineAt}
              step={motion.stagger}
              className="hello-words"
            />
          </div>
        </div>
      </div>

      <div className="hb-panel">
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            fontSize: 12,
          }}
        >
          <strong>Hello screen</strong>
          <button
            type="button"
            style={btn}
            onClick={() => setRun((r) => r + 1)}
          >
            ▶ Say it again
          </button>
        </div>
        <Group
          title="Sign"
          fields={SIGN}
          values={values}
          set={setHelloTuning}
        />
        <Group title="Row" fields={ROW} values={values} set={setHelloTuning} />
        <Group
          title="Words"
          fields={WORDS}
          values={values}
          set={setHelloTuning}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
          }}
        >
          <button type="button" style={btn} onClick={resetHelloTuning}>
            Reset
          </button>
          <CopyValues values={values} />
        </div>
        <p style={{ margin: 0, fontSize: 11, opacity: 0.6, lineHeight: 1.5 }}>
          Applies to the home page in this browser until Reset. Lock it in by
          pasting into HELLO_DEFAULTS in packages/lab/src/hello.tsx.
        </p>
      </div>
    </>
  );
}
