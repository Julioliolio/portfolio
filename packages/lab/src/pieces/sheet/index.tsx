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
import { WINDOW_LAYOUT } from "../../signs-layout";
import { STAND_IN_CSS, StandIn } from "../../stand-in";
import { TypeStyles } from "../../type";
import { ProjectWindow } from "../../window";
import {
  WINDOW_DEFAULTS,
  paperCss,
  setWindowTuning,
  useWindowTuning,
  type LiftCorner,
  type WindowTuning,
} from "../../window-tuning";

/**
 * The sheet bench: the sheet on the mat at the site's size, as a page
 * of its own (the window's page mode, no entrance), with a stand-in
 * case study on it, and every paper knob floating over it — the place
 * to tweak the paper (Julio, 2026-09-26).
 *
 * The paper: the ground, how much of the scan shows on it, which scan;
 * the sheet's lean on the mat, its size and the margin round it; its
 * cut — how far the edges wander from straight, in how many swells,
 * how rough, which seed, the corners; the edge's hairline, lip, light
 * and shade; which way the shadows are thrown, the contact and the
 * soft shadow; the light across the sheet and its edges curling down;
 * which corner is off the mat and by how much. The knobs write the
 * window store, what the home page and every project page read in
 * this browser until Reset; Reset and "Copy values" cover the paper's
 * knobs alone — the window's clocks are /lab/window's — and the copy
 * is the object to paste over the paper's part of WINDOW_DEFAULTS in
 * window-tuning.ts.
 *
 * The knobs are parked over the rail, where the mat is bare, so the
 * sheet's right and bottom edges, its shadows and its lifted corner
 * stay in view while they are turned.
 */

const GROUND: Field<WindowTuning>[] = [
  {
    key: "grain",
    label: "Grain",
    min: 0,
    max: 1,
    step: 0.01,
    hint: "how much of the scan shows on the ground: 0 bare, 1 the scan itself",
  },
];

const SHEET: Field<WindowTuning>[] = [
  {
    key: "tilt",
    label: "Lean",
    min: -3,
    max: 3,
    step: 0.05,
    unit: "°",
    hint: "the sheet's lean on the mat; the lift ends on it",
  },
  {
    key: "sheetW",
    label: "Width",
    min: 0.5,
    max: 1,
    step: 0.01,
    hint: "of the room right of the rail, inside the margin",
  },
  {
    key: "sheetH",
    label: "Height",
    min: 0.5,
    max: 1,
    step: 0.01,
    hint: "of the room inside the margins; centred top to bottom",
  },
  {
    key: "sheetX",
    label: "Across",
    min: -30,
    max: 30,
    step: 0.1,
    unit: "vw",
    hint: "the sheet moved left or right of its place, the rail's edge",
  },
  {
    key: "sheetY",
    label: "Down",
    min: -30,
    max: 30,
    step: 0.1,
    unit: "vh",
    hint: "the sheet moved up or down from its place, centred top to bottom",
  },
  {
    key: "margin",
    label: "Margin",
    min: 0,
    max: 80,
    step: 1,
    unit: "px",
    hint: "the mat above, right of and below the sheet",
  },
];

const CUT: Field<WindowTuning>[] = [
  {
    key: "wobble",
    label: "Wobble",
    min: 0,
    max: 10,
    step: 0.1,
    unit: "px",
    hint: "how far an edge wanders in from straight",
  },
  {
    key: "waves",
    label: "Waves",
    min: 1,
    max: 8,
    step: 0.5,
    hint: "swells of the wander along each edge",
  },
  {
    key: "rough",
    label: "Rough",
    min: 0,
    max: 3,
    step: 0.05,
    unit: "px",
    hint: "jitter point to point: the deckle of a worn edge",
  },
  {
    key: "seed",
    label: "Seed",
    min: 1,
    max: 99,
    step: 1,
    hint: "which wander; the same seed cuts the same edge",
  },
  {
    key: "corner",
    label: "Corner",
    min: 0,
    max: 16,
    step: 0.5,
    unit: "px",
    hint: "the corners softened",
  },
];

const EDGE: Field<WindowTuning>[] = [
  { key: "hairline", label: "Hairline", min: 0, max: 0.6, step: 0.01 },
  {
    key: "lip",
    label: "Lip",
    min: 0,
    max: 0.6,
    step: 0.01,
    hint: "the sheet's thickness along its bottom edge",
  },
  {
    key: "cutLight",
    label: "Edge light",
    min: 0,
    max: 1,
    step: 0.02,
    hint: "the cut edge lit along the top and the left",
  },
  {
    key: "edgeShade",
    label: "Edge shade",
    min: 0,
    max: 0.5,
    step: 0.01,
    hint: "the cut edge shaded along the bottom and the right",
  },
];

const CAST: Field<WindowTuning>[] = [
  {
    key: "shadowAngle",
    label: "Cast",
    min: -60,
    max: 60,
    step: 1,
    unit: "°",
    hint: "which way the shadows are thrown: 0 straight down, left of it or right, each by its own drop",
  },
];

const CONTACT: Field<WindowTuning>[] = [
  { key: "contactY", label: "Drop", min: 0, max: 6, step: 0.5, unit: "px" },
  { key: "contactBlur", label: "Blur", min: 0, max: 12, step: 0.5, unit: "px" },
  { key: "contactAlpha", label: "Dark", min: 0, max: 0.6, step: 0.01 },
];

const SOFT: Field<WindowTuning>[] = [
  { key: "softY", label: "Drop", min: 0, max: 80, step: 1, unit: "px" },
  { key: "softBlur", label: "Blur", min: 0, max: 160, step: 2, unit: "px" },
  { key: "softAlpha", label: "Dark", min: 0, max: 0.6, step: 0.01 },
];

const LIGHT: Field<WindowTuning>[] = [
  {
    key: "lightAngle",
    label: "From",
    min: 0,
    max: 360,
    step: 5,
    unit: "°",
    hint: "where the light falls from, as a gradient angle: 180 is the top, 200 top-right",
  },
  {
    key: "light",
    label: "Light",
    min: 0,
    max: 0.4,
    step: 0.01,
    hint: "brighter toward it, darker away",
  },
  {
    key: "curl",
    label: "Curl",
    min: 0,
    max: 160,
    step: 2,
    unit: "px",
    hint: "how far in from the edges the sheet darkens as it curls down",
  },
  { key: "curlShade", label: "Curl shade", min: 0, max: 0.4, step: 0.01 },
];

const LIFT: Field<WindowTuning>[] = [
  {
    key: "liftAmount",
    label: "Off the mat",
    min: 0,
    max: 30,
    step: 0.5,
    unit: "px",
    hint: "how far the corner's shadow is thrown out",
  },
  { key: "liftBlur", label: "Blur", min: 0, max: 60, step: 1, unit: "px" },
  { key: "liftShade", label: "Dark", min: 0, max: 0.6, step: 0.01 },
  {
    key: "liftLight",
    label: "Light",
    min: 0,
    max: 0.6,
    step: 0.01,
    hint: "the light the lifted corner catches",
  },
];

/** The paper's knobs, in the bench's order: what this bench shows, and
 *  so what its Reset puts back and its copy gives. */
const PAPER_KEYS: (keyof WindowTuning)[] = [
  "ground",
  "sheet",
  ...[GROUND, SHEET, CUT, EDGE, CAST, CONTACT, SOFT, LIGHT].flatMap((g) =>
    g.map((f) => f.key),
  ),
  "liftCorner",
  ...LIFT.map((f) => f.key),
];

/** The paper's part of a tuning. */
const paperOf = (t: WindowTuning) =>
  Object.fromEntries(PAPER_KEYS.map((k) => [k, t[k]])) as Partial<WindowTuning>;

const resetPaper = () => setWindowTuning(paperOf(WINDOW_DEFAULTS));

const CSS = `
${BENCH_CSS}
${STAND_IN_CSS}
/* Over the rail, under Home (top 3.5vh, a 24px line). */
.sb-knobs { left: 16px; right: auto; top: calc(3.5vh + 40px); bottom: auto; width: 300px; max-height: calc(100vh - 3.5vh - 56px); }
.sb-knobs .bench-title { margin-top: 10px; }
`;

export default function SheetBench() {
  const t = useWindowTuning();
  useWholeScreen();

  return (
    <>
      <style>{CSS}</style>
      <style>{paperCss(t)}</style>
      <TypeStyles />

      <ProjectWindow
        mode="page"
        active="sheet"
        shown
        label="Sheet"
        layout={WINDOW_LAYOUT}
        closeHref={asset("/lab")}
      >
        <StandIn />
      </ProjectWindow>

      <Knobs
        className="sb-knobs"
        buttons={
          <>
            <button type="button" style={btn} onClick={resetPaper}>
              Reset
            </button>
            <CopyValues
              values={paperOf(t) as Record<string, number | string>}
            />
          </>
        }
      >
        <div className="bench-title">The paper</div>
        <Colour
          label="Ground"
          value={t.ground}
          pick={(ground) => setWindowTuning({ ground })}
        />
        <Choice
          label="Scan"
          value={t.sheet}
          options={[
            { value: "plain", label: "Plain" },
            { value: "crease-1", label: "Crease 1" },
            { value: "crease-2", label: "Crease 2" },
          ]}
          pick={(sheet) => setWindowTuning({ sheet })}
        />
        <Group title="" fields={GROUND} values={t} set={setWindowTuning} />
        <Group
          title="The sheet"
          fields={SHEET}
          values={t}
          set={setWindowTuning}
        />
        <Group title="The cut" fields={CUT} values={t} set={setWindowTuning} />
        <Group title="Edge" fields={EDGE} values={t} set={setWindowTuning} />
        <Group title="Shadows" fields={CAST} values={t} set={setWindowTuning} />
        <Group
          title="Contact shadow"
          fields={CONTACT}
          values={t}
          set={setWindowTuning}
        />
        <Group
          title="Soft shadow"
          fields={SOFT}
          values={t}
          set={setWindowTuning}
        />
        <Group title="Light" fields={LIGHT} values={t} set={setWindowTuning} />
        <div className="bench-title">Lifted corner</div>
        <Choice<LiftCorner>
          label="Corner"
          value={t.liftCorner}
          options={[
            { value: "none", label: "None" },
            { value: "br", label: "↘" },
            { value: "bl", label: "↙" },
            { value: "tr", label: "↗" },
            { value: "tl", label: "↖" },
          ]}
          pick={(liftCorner) => setWindowTuning({ liftCorner })}
        />
        <Group title="" fields={LIFT} values={t} set={setWindowTuning} />
      </Knobs>
    </>
  );
}
