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
 * The project window's bench: the sheet over a stand-in for the
 * landing's projects screen, with the knobs floating over it — the
 * slide's length and start, the rail's width, the hairline on the
 * sheet's edge. Open and close it from the panel, Home or the empty
 * rail; the three stand-in signs switch between three stand-in pages
 * (the open one closes), so the swap can be watched too. The rail's
 * contents are the page's own (a case study portals them in), so here
 * it only has Home.
 * Sliders write the window store and the window regenerates its
 * stylesheet on every change, so what you set here is what the home
 * page does — in this browser, until Reset. "Copy values" exports them
 * for WINDOW_DEFAULTS in packages/lab/src/window.tsx. (On the site the
 * rail's width follows the signs — sheetLayout.ts — not the slider.)
 */

const MOTION: Field<WindowTuning>[] = [
  {
    key: "duration",
    label: "Duration",
    min: 120,
    max: 900,
    step: 10,
    unit: "ms",
    hint: "the slide in; the slide out takes 0.7 of it",
  },
  {
    key: "distance",
    label: "From",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    hint: "how far right of its place the sheet starts, of its width",
  },
];

const SHEET: Field<WindowTuning>[] = [
  { key: "rail", label: "Rail", min: 12, max: 45, step: 0.5, unit: "vw" },
  { key: "edge", label: "Hairline", min: 0, max: 0.6, step: 0.02 },
];

/** The stand-in signs: the landing's places, over the window. */
const SIGNS = [
  { slug: "one", title: "First project", bottom: "31vh", width: "19vw" },
  { slug: "two", title: "Second", bottom: "20.5vh", width: "21vw" },
  { slug: "three", title: "Third project", bottom: "10vh", width: "18vw" },
];

const CSS = `
${BENCH_CSS}
.wb-wall { position: fixed; inset: 0; background: #faf9f6; }
/* A stand-in for the landing's projects screen: three sign-sized
   blocks bottom-left, over the window; the open one grown. */
.wb-sign { position: fixed; z-index: 85; left: 7vw; height: 8.8vh; padding: 0; border: 0; background: #dcd8d0; border-radius: 6px; transform-origin: 50% 50%; }
.wb-sign[aria-pressed="true"] { background: #2f6df6; transform: scale(1.2) rotate(-1.5deg); }
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
      <div className="wb-wall" aria-hidden="true" />
      {SIGNS.map((sign) => (
        <button
          key={sign.slug}
          type="button"
          className="wb-sign"
          aria-label={sign.title}
          aria-pressed={open && sign.slug === active}
          style={{ bottom: sign.bottom, width: sign.width }}
          onClick={() => {
            if (open && sign.slug === active) setOpen(false);
            else {
              setActive(sign.slug);
              setOpen(true);
            }
          }}
        />
      ))}

      <ProjectWindow
        active={active}
        shown={open}
        label={SIGNS.find((x) => x.slug === active)?.title ?? ""}
        layout={{ inset: "7vw", foot: "45vh" }}
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
              window.setTimeout(() => setOpen(true), 0.7 * t.duration + 80);
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
          title="The slide"
          fields={MOTION}
          values={t}
          set={setWindowTuning}
        />
        <Group
          title="The sheet"
          fields={SHEET}
          values={t}
          set={setWindowTuning}
        />
      </div>
    </>
  );
}
