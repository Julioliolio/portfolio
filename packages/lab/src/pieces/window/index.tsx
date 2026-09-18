"use client";

import { useState } from "react";
import { BENCH_CSS, CopyValues, Group, btn, type Field } from "../../bench";
import {
  ProjectWindow,
  resetWindowTuning,
  setWindowTuning,
  useWindowTuning,
  type WindowTuning,
} from "../../window";

/**
 * The project window's bench: the window over a stand-in for the
 * landing, with the knobs floating beside it — the beat and poses of
 * the open, the card's size, radius and shadow, the backdrop's darkness
 * and blur. Open, close and expand it from the panel or its own
 * controls; the three pills switch between three stand-in pages, so the
 * swap can be watched too. Sliders write the window store and the
 * window regenerates its stylesheet on every change, so what you set
 * here is what the home page does — in this browser, until Reset.
 * "Copy values" exports them for WINDOW_DEFAULTS in
 * packages/lab/src/window.tsx.
 */

const MOTION: Field<WindowTuning>[] = [
  {
    key: "beat",
    label: "Beat",
    min: 40,
    max: 240,
    step: 5,
    unit: "ms",
    hint: "ms between held poses",
  },
  {
    key: "cuts",
    label: "Cuts",
    min: 2,
    max: 4,
    step: 1,
    hint: "held poses after the start: land, settle, a second landing",
  },
  {
    key: "distance",
    label: "Rise",
    min: 0,
    max: 160,
    step: 2,
    unit: "px",
    hint: "how far below its place the window starts",
  },
  {
    key: "startScale",
    label: "Start scale",
    min: 0.7,
    max: 1,
    step: 0.01,
  },
  {
    key: "overshoot",
    label: "Overshoot",
    min: 1,
    max: 1.12,
    step: 0.005,
    hint: "scale on the landing, past rest",
  },
  {
    key: "squash",
    label: "Squash",
    min: 0,
    max: 0.12,
    step: 0.005,
    hint: "wide and short on the landing",
  },
];

const CARD: Field<WindowTuning>[] = [
  { key: "width", label: "Width", min: 600, max: 1600, step: 10, unit: "px" },
  { key: "height", label: "Height", min: 50, max: 100, step: 1, unit: "vh" },
  { key: "radius", label: "Radius", min: 0, max: 48, step: 1, unit: "px" },
  { key: "shadow", label: "Shadow", min: 0, max: 0.8, step: 0.02 },
];

const BEHIND: Field<WindowTuning>[] = [
  { key: "dim", label: "Dim", min: 0, max: 0.9, step: 0.02 },
  { key: "blur", label: "Blur", min: 0, max: 24, step: 1, unit: "px" },
];

const TABS = [
  { slug: "one", title: "First project", href: "#one" },
  { slug: "two", title: "Second", href: "#two" },
  { slug: "three", title: "Third project", href: "#three" },
];

const CSS = `
${BENCH_CSS}
.wb-wall { position: fixed; inset: 0; background: #faf9f6; }
/* A stand-in for the landing's projects screen: three sign-sized
   blocks bottom-left and a card-sized one beside them. */
.wb-sign { position: absolute; left: 7vw; height: 8.8vh; background: #dcd8d0; border-radius: 6px; }
.wb-card { position: absolute; right: 11vw; bottom: 30vh; width: 44vw; aspect-ratio: 640 / 300; background: #e6e2da; border-radius: 4px; }
.wb-panel { position: fixed; right: 16px; bottom: 16px; z-index: 90; display: grid; gap: 10px; width: 320px; max-height: calc(100vh - 32px); overflow-y: auto; padding: 12px 14px 14px; border-radius: 14px; border: 1px solid rgba(128, 128, 128, 0.4); background: rgba(250, 249, 246, 0.92); color: #171717; font-size: 12px; backdrop-filter: blur(10px); }
.wb-panel .bench-row { grid-template-columns: 6rem 1fr 4rem; }
.wb-buttons { display: flex; flex-wrap: wrap; gap: 6px; }
/* The stand-in page inside the window. */
.wb-page { padding: 72px clamp(20px, 4cqw, 56px) 20vh; max-width: 800px; margin: 0 auto; color: #2b2722; }
.wb-page h1 { margin: 0 0 12px; font-size: 40px; line-height: 1.05; letter-spacing: -.03em; }
.wb-page p { margin: 0 0 18px; font-size: 15px; line-height: 1.5; color: #57514a; max-width: 560px; }
.wb-page .wb-box { aspect-ratio: 16 / 9; margin: 24px 0; border-radius: 12px; background: #ecebe8; }
`;

/** Three pages that look different enough to see the swap. */
const PAGES: Record<string, { title: string; boxes: number }> = {
  one: { title: "A first project, standing in.", boxes: 3 },
  two: { title: "The second one.", boxes: 1 },
  three: { title: "A third, longer than the others.", boxes: 5 },
};

export default function WindowBench() {
  const t = useWindowTuning();
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState("one");
  const page = PAGES[active] ?? PAGES.one!;

  return (
    <>
      <style>{CSS}</style>
      <div className="wb-wall" aria-hidden="true">
        <div className="wb-sign" style={{ bottom: "31vh", width: "24vw" }} />
        <div className="wb-sign" style={{ bottom: "20.5vh", width: "20vw" }} />
        <div className="wb-sign" style={{ bottom: "10vh", width: "28vw" }} />
        <div className="wb-card" />
      </div>

      <ProjectWindow
        tabs={TABS}
        active={active}
        shown={open}
        label={TABS.find((x) => x.slug === active)?.title ?? ""}
        onSelect={setActive}
        onClose={() => setOpen(false)}
      >
        <div className="wb-page" key={active}>
          <h1>{page.title}</h1>
          <p>
            Text at the reading measure, the way a case study sets it. The
            window is the chrome; the page inside is whatever the caller
            renders, keyed on the open project so a switch plays its entrances
            again.
          </p>
          {Array.from({ length: page.boxes }, (_, i) => (
            <div key={i}>
              <div className="wb-box" />
              <p>
                More of the page, so there is something to scroll and the
                controls have a hero to sit over.
              </p>
            </div>
          ))}
        </div>
      </ProjectWindow>

      <div className="wb-panel">
        <div className="wb-buttons">
          <button type="button" style={btn} onClick={() => setOpen((o) => !o)}>
            {open ? "Close" : "Open"}
          </button>
          <button
            type="button"
            style={btn}
            onClick={() => {
              setOpen(false);
              window.setTimeout(() => setOpen(true), 2 * t.beat + 80);
            }}
          >
            Replay
          </button>
          <button type="button" style={btn} onClick={resetWindowTuning}>
            Reset
          </button>
          <CopyValues values={t} />
        </div>
        <Group
          title="The open"
          fields={MOTION}
          values={t}
          set={setWindowTuning}
        />
        <Group
          title="The card"
          fields={CARD}
          values={t}
          set={setWindowTuning}
        />
        <Group
          title="Behind"
          fields={BEHIND}
          values={t}
          set={setWindowTuning}
        />
      </div>
    </>
  );
}
