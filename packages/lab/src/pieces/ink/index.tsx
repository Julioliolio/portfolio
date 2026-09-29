"use client";

import { asset } from "../../asset";
import {
  BENCH_CSS,
  Choice,
  Colour,
  CopyValues,
  Group,
  Knobs,
  btn,
  useWholeScreen,
  type Field,
} from "../../bench";
import {
  InkFilter,
  inkCss,
  inkFiltered,
  resetInkTuning,
  setInkTuning,
  useInkTuning,
  type InkTuning,
  type Toggle,
} from "../../ink";
import { WINDOW_LAYOUT } from "../../signs-layout";
import { STAND_IN_CSS, StandIn } from "../../stand-in";
import { TypeStyles } from "../../type";
import { ProjectWindow } from "../../window";
import { paperCss, useWindowTuning } from "../../window-tuning";

/**
 * The ink, parked (Julio, 2026-09-26: "hide it away in a lab page
 * named ink, I don't want to use it for now"): the case study's type
 * treated as printed on the sheet — the looks and what else on
 * the page is printed matter — on the sheet bench's stand-in, with
 * every knob. This page is the only place the ink is applied; the
 * site's window is paper alone. ink.tsx holds the looks and their own
 * store; the paper under them is the sheet's, from the window store,
 * tuned on /lab/sheet. "Copy values" gives the object to paste over
 * INK_DEFAULTS in ink.tsx. The knobs are parked over the rail, as on
 * /lab/sheet, so the sheet's far edges stay in view.
 */

const ON_OFF: { value: Toggle; label: string }[] = [
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
];

const DENSITY: Field<InkTuning>[] = [
  {
    key: "density",
    label: "Floor",
    min: 0,
    max: 1,
    step: 0.01,
    hint: "how much ink stays where the grain is thinnest: 0 the raw grain, 1 no effect",
  },
];

const BLEED: Field<InkTuning>[] = [
  {
    key: "bleed",
    label: "Shove",
    min: 0,
    max: 4,
    step: 0.05,
    unit: "px",
    hint: "how far the edges are pushed about",
  },
  {
    key: "roughness",
    label: "Fineness",
    min: 0.05,
    max: 1.5,
    step: 0.01,
    hint: "cycles of noise per px: high and the edges fray, low and the strokes bend",
  },
  {
    key: "spread",
    label: "Spread",
    min: 0,
    max: 1.5,
    step: 0.05,
    unit: "px",
    hint: "the ink fattened out first, as it spreads into fibres; 0 for none",
  },
];

const PRESSURE: Field<InkTuning>[] = [
  {
    key: "pressure",
    label: "Floor",
    min: 0,
    max: 1,
    step: 0.01,
    hint: "how much ink the lightest letter keeps: 0 bare paper, 1 no effect",
  },
  {
    key: "pressureScale",
    label: "Swell",
    min: 4,
    max: 120,
    step: 1,
    unit: "px",
    hint: "how wide a swell of pressure is: a letter, a word, a line",
  },
];

const SOAK: Field<InkTuning>[] = [
  {
    key: "soak",
    label: "Through",
    min: 0,
    max: 0.4,
    step: 0.01,
    hint: "on top of the multiply, how transparent a stroke is; 0 for solid ink",
  },
];

const RELIEF: Field<InkTuning>[] = [
  { key: "relief", label: "Depth", min: 0, max: 1.5, step: 0.05, unit: "px" },
  { key: "reliefLight", label: "Light", min: 0, max: 0.8, step: 0.01 },
  { key: "reliefShade", label: "Shade", min: 0, max: 0.4, step: 0.01 },
];

const CSS = `
${BENCH_CSS}
${STAND_IN_CSS}
/* Over the rail, under Home (top 3.5vh, a 24px line). */
.ik-knobs { left: 16px; right: auto; top: calc(3.5vh + 40px); bottom: auto; width: 300px; max-height: calc(100vh - 3.5vh - 56px); }
.ik-knobs .bench-title { margin-top: 10px; }
`;

export default function InkBench() {
  const t = useWindowTuning();
  const i = useInkTuning();
  const toggle = (key: keyof InkTuning) => (v: Toggle) =>
    setInkTuning({ [key]: v } as Partial<InkTuning>);
  useWholeScreen();

  return (
    <>
      <style>{CSS}</style>
      <style>{paperCss(t)}</style>
      <style>{inkCss(i)}</style>
      {inkFiltered(i) && <InkFilter t={i} />}
      <TypeStyles />

      <ProjectWindow
        mode="page"
        active="ink"
        shown
        label="Ink"
        layout={WINDOW_LAYOUT}
        closeHref={asset("/lab")}
      >
        <StandIn />
      </ProjectWindow>

      <Knobs
        className="ik-knobs"
        buttons={
          <>
            <button type="button" style={btn} onClick={resetInkTuning}>
              Reset
            </button>
            <CopyValues values={i} />
          </>
        }
      >
        <div className="bench-title">Printed</div>
        <Colour
          label="Ink"
          value={i.ink}
          pick={(ink) => setInkTuning({ ink })}
        />
        <Choice
          label="Type"
          value={i.inkText}
          options={ON_OFF}
          pick={toggle("inkText")}
        />
        <Choice
          label="Photos"
          value={i.inkPhotos}
          options={ON_OFF}
          pick={toggle("inkPhotos")}
        />
        <Choice
          label="Films"
          value={i.inkFilms}
          options={ON_OFF}
          pick={toggle("inkFilms")}
        />
        <Choice
          label="Demos"
          value={i.inkDemos}
          options={ON_OFF}
          pick={toggle("inkDemos")}
        />

        <div className="bench-title">Density</div>
        <Choice
          label="Density"
          value={i.inkDensity}
          options={ON_OFF}
          pick={toggle("inkDensity")}
        />
        <Group title="" fields={DENSITY} values={i} set={setInkTuning} />
        <div className="bench-title">Bleed</div>
        <Choice
          label="Bleed"
          value={i.inkBleed}
          options={ON_OFF}
          pick={toggle("inkBleed")}
        />
        <Group title="" fields={BLEED} values={i} set={setInkTuning} />
        <div className="bench-title">Pressure</div>
        <Choice
          label="Pressure"
          value={i.inkPressure}
          options={ON_OFF}
          pick={toggle("inkPressure")}
        />
        <Group title="" fields={PRESSURE} values={i} set={setInkTuning} />
        <div className="bench-title">Soak</div>
        <Choice
          label="Soak"
          value={i.inkSoak}
          options={ON_OFF}
          pick={toggle("inkSoak")}
        />
        <Group title="" fields={SOAK} values={i} set={setInkTuning} />
        <div className="bench-title">Relief</div>
        <Choice
          label="Relief"
          value={i.inkRelief}
          options={ON_OFF}
          pick={toggle("inkRelief")}
        />
        <Group title="" fields={RELIEF} values={i} set={setInkTuning} />
      </Knobs>
    </>
  );
}
