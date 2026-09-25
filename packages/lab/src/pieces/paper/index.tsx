"use client";

import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { asset } from "../../asset";
import {
  BENCH_CSS,
  Choice,
  CopyValues,
  Group,
  btn,
  type Field,
} from "../../bench";
import { printPreview } from "../../prints";
import {
  SIGNS_OPEN,
  WINDOW_LAYOUT,
  signsTuning,
  useViewport,
} from "../../signs-layout";
import { SOUND_FIELDS, setSoundTuning, useSoundTuning } from "../../sound";
import { BLUE, INK, MEDIUM, PAPER_BASE } from "../../style";
import { ProjectWindow, type WindowPreview } from "../../window";
import {
  moveMs,
  resetWindowTuning,
  setWindowTuning,
  useWindowTuning,
  windowEase,
  type WindowTuning,
} from "../../window-tuning";

/**
 * The paper bench: the landing's projects screen, whole, on a lab page
 * — the road signs bottom-left at the site's sizes, the prints' column
 * they bring out, and the sheet a print is picked up into — with every
 * paper knob floating over it. Hover a sign: the column slides in from
 * the edge; hover another, or click a peeking print: it steps; click
 * the centred print: it lifts into the sheet; Esc, Home or the empty
 * mat: it goes back. Exactly the home page's flow, minus the URL.
 *
 * The knobs: which move (the lift, or Convertr's grow), the sheet's
 * paper (plain, or a crease), the page's look on it (clean, the grain
 * laid over once, the whole page multiplied in — Julio wanted to see
 * both printed looks against clean, 2026-09-25), the window's clocks
 * and box, the column's sizes and clocks (laid over the site's, which
 * follow the viewport), and the sounds. The window's knobs write the
 * window store (what the home page reads, in this browser, until
 * Reset); the column's are this page's own until "Copy values" — paste
 * them into signsTuning() in packages/lab/src/signs-layout.ts, as
 * shares of the viewport.
 *
 * The page is taller than the screen on purpose: scroll it to see the
 * mat repeat, and that the seam does not show.
 */

const RoadSigns = lazy(() => import("../road-signs"));

/** The column's knobs laid over the site's values: absolute px here,
 *  shares of the viewport on the site. */
type ColumnKnobs = {
  printW: number;
  columnRight: number;
  peekGap: number;
  cardY: number;
  slideDuration: number;
  moveDuration: number;
};

const COLUMN: Field<ColumnKnobs>[] = [
  {
    key: "printW",
    label: "Print",
    min: 320,
    max: 1200,
    step: 10,
    unit: "px",
    hint: "A wide print's width; a tall one is a share of it (62vw on the site)",
  },
  {
    key: "columnRight",
    label: "Right air",
    min: 0,
    max: 160,
    step: 2,
    unit: "px",
    hint: "between the column and the screen's edge (2.6vw on the site)",
  },
  {
    key: "peekGap",
    label: "Peek gap",
    min: 0,
    max: 120,
    step: 2,
    unit: "px",
    hint: "between the centred print and the ones peeking (3.5vh on the site)",
  },
  {
    key: "cardY",
    label: "Up / down",
    min: -500,
    max: 200,
    step: 2,
    unit: "px",
    hint: "the column's centre line, from the stack's middle (-26.6vh on the site)",
  },
  {
    key: "slideDuration",
    label: "Slide",
    min: 100,
    max: 1200,
    step: 10,
    unit: "ms",
    hint: "the column's slide in from the edge, and back out",
  },
  {
    key: "moveDuration",
    label: "Step",
    min: 100,
    max: 1200,
    step: 10,
    unit: "ms",
    hint: "the column's step to the next print",
  },
];

const LIFT: Field<WindowTuning>[] = [
  {
    key: "lift",
    label: "Lift",
    min: 150,
    max: 1200,
    step: 10,
    unit: "ms",
    hint: "the pick-up, and the way back",
  },
  {
    key: "reveal",
    label: "Reveal",
    min: 0,
    max: 1200,
    step: 10,
    unit: "ms",
    hint: "the page printing in once the sheet has landed",
  },
  {
    key: "fade",
    label: "Fade",
    min: 0,
    max: 800,
    step: 10,
    unit: "ms",
    hint: "the page out before the way back; the column's fade",
  },
  {
    key: "duration",
    label: "Axis",
    min: 100,
    max: 900,
    step: 10,
    unit: "ms",
    hint: "grow only: one axis's move",
  },
  {
    key: "lag",
    label: "Lag",
    min: 0,
    max: 900,
    step: 10,
    unit: "ms",
    hint: "grow only: the second axis's wait",
  },
];

const SHEET: Field<WindowTuning>[] = [
  {
    key: "margin",
    label: "Margin",
    min: 0,
    max: 80,
    step: 1,
    unit: "px",
    hint: "the mat above, right of and below the sheet",
  },
  {
    key: "edge",
    label: "Hairline",
    min: 0,
    max: 0.6,
    step: 0.02,
    hint: "the sheet's edge",
  },
  {
    key: "overhang",
    label: "Overhang",
    min: 0,
    max: 10,
    step: 0.1,
    unit: "vh",
    hint: "how far the open sign reaches over the sheet",
  },
];

const SOUNDS = SOUND_FIELDS.filter((f) =>
  ["master", "slide", "lift", "knock", "card", "click"].includes(f.key),
);

const CSS = `
${BENCH_CSS}
/* The landing's places (Landing.tsx): the signs bottom-left, stepped
   back into the corner while a project is open, on the window's clock. */
.pb-signs { position: fixed; left: 7.2vw; bottom: 9.5vh; z-index: 90; transform-origin: 0 100%; transition: transform var(--signs-move, 420ms) var(--signs-ease, ease) var(--signs-wait, 0ms); }
.pb-signs.is-open { transform: ${SIGNS_OPEN}; }
.pb-panel { top: 16px; bottom: auto; }
/* The knobs stand over the column's side of the screen: this puts them
   away to see it whole. */
.pb-panel.is-hidden { display: none; }
.pb-knobs { position: fixed; top: 16px; right: 16px; z-index: 91; }
/* A stand-in for the case study, in its type's spirit: a title, a run
   of text, a photo waiting for itself, a film, a demo's dark box. */
.pb-page { padding: 8vh clamp(24px, 6cqw, 96px) 20vh; color: ${INK}; }
.pb-page h1 { margin: 0 0 .3em; font-family: ${MEDIUM}; font-weight: 500; font-size: clamp(64px, 12cqw, 168px); line-height: .86; letter-spacing: -.055em; color: ${BLUE}; }
.pb-page p { margin: 0 0 1em; max-width: 34em; font-size: clamp(17px, 1.6cqw, 22px); line-height: 1.4; }
.pb-page p + p { text-indent: 2em; margin-top: -1em; }
.pb-ph { display: grid; place-items: center; aspect-ratio: 16 / 9; margin: 2em 0; background: #ecebe8; outline: 1px dashed rgba(43, 39, 34, .28); outline-offset: -1px; color: #77716a; font-size: 14px; }
.pb-film { display: block; width: 100%; aspect-ratio: 16 / 9; margin: 2em 0; background: #000; object-fit: cover; }
.pb-demo { display: grid; place-items: center; aspect-ratio: 16 / 10; margin: 2em 0; background: #1b1b1f; color: #fff; font-size: 14px; }
.pb-tail { height: 140vh; }
`;

const FILM = asset("/media/camper.mp4");

export default function PaperBench() {
  const t = useWindowTuning();
  const sound = useSoundTuning();
  const { w, h, measured } = useViewport();
  const site = signsTuning(w, h);
  const [knobs, setKnobs] = useState<ColumnKnobs | null>(null);
  const column: ColumnKnobs = knobs ?? {
    printW: Math.round(site.printW),
    columnRight: Math.round(site.columnRight),
    peekGap: Math.round(site.peekGap),
    cardY: Math.round(site.cardY),
    slideDuration: 520,
    moveDuration: 460,
  };
  const setColumn = (patch: Partial<ColumnKnobs>) =>
    setKnobs({ ...column, ...patch });

  // The landing's flow: the open project, and the print it grew from.
  const [open, setOpen] = useState<string | null>(null);
  const [knobsShown, setKnobsShown] = useState(true);
  const stack = useRef<HTMLDivElement>(null);
  const [from, setFrom] = useState<WindowPreview | null>(null);
  function show(slug: string) {
    setFrom(printPreview(stack.current, slug));
    setOpen(slug);
  }
  function close() {
    setFrom((f) => (open ? (printPreview(stack.current, open) ?? f) : f));
    setOpen(null);
  }
  function onSignsClick(e: MouseEvent<HTMLElement>) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest("a[href]");
    const slug = a?.getAttribute("href")?.match(/\/work\/([^/?#]+)/)?.[1];
    if (!slug) return;
    e.preventDefault();
    if (slug === open) close();
    else show(slug);
  }
  // The lab page centres its piece; this one is the whole screen.
  useEffect(() => {
    const main = document.querySelector("main");
    const was = main?.style.display ?? "";
    if (main) main.style.display = "block";
    return () => {
      if (main) main.style.display = was;
    };
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="pb-tail" aria-hidden />

      <div
        ref={stack}
        className={open !== null ? "pb-signs is-open" : "pb-signs"}
        onClick={onSignsClick}
        style={
          {
            "--signs-move": `${moveMs(t)}ms`,
            "--signs-ease": windowEase(t),
            "--signs-wait": `${open === null ? t.fade : 0}ms`,
            "--rs-hand": `${t.fade}ms`,
          } as CSSProperties
        }
      >
        {measured && (
          <Suspense fallback={null}>
            <RoadSigns
              controls={false}
              frame="signs"
              tuning={{
                ...site,
                ...column,
                returnDelay: t.fade + moveMs(t),
              }}
              selected={open}
            />
          </Suspense>
        )}
      </div>

      {open !== null && (
        <ProjectWindow
          active={open}
          shown
          from={from}
          label={open}
          layout={WINDOW_LAYOUT}
          onClose={close}
        >
          <div className="pb-page" key={open}>
            <h1>{open.charAt(0).toUpperCase() + open.slice(1)}</h1>
            <p>
              A stand-in for the case study, printed on the sheet: the title in
              the blue, a run of reading text at the measure, and the three
              kinds of thing a page shows — a photo, a film, a live demo — so
              the looks can be compared where they differ.
            </p>
            <p>
              Clean is the page as printed on a white sheet, the type on the
              paper and the pictures crisp. Overlay lays the paper&rsquo;s grain
              over everything once, as one layer the page scrolls under.
              Multiply prints the whole page into the paper, every picture and
              all, blended again on every scroll.
            </p>
            <div className="pb-ph">Photo needed: a still from the film.</div>
            <p>
              The film keeps cutting between people who would never share a
              frame, and the one thing that stays constant, shot after shot, is
              what they are standing in.
            </p>
            <video
              className="pb-film"
              src={FILM}
              muted
              loop
              autoPlay
              playsInline
            />
            <div className="pb-demo">
              A demo&rsquo;s box: the iframe would be here.
            </div>
            <p>
              More of the page, so there is something to scroll: the grain
              should hold still under the words in overlay, and ride with them
              in multiply.
            </p>
          </div>
        </ProjectWindow>
      )}

      <div
        className={
          knobsShown ? "bench-panel pb-panel" : "bench-panel pb-panel is-hidden"
        }
      >
        <div className="bench-buttons">
          <button
            type="button"
            style={btn}
            onClick={() => setKnobsShown(false)}
          >
            Hide knobs
          </button>
          <button
            type="button"
            style={btn}
            onClick={() => (open ? close() : show("camper"))}
          >
            {open ? "Close" : "Open Camper"}
          </button>
          <button
            type="button"
            style={btn}
            onClick={() => {
              resetWindowTuning();
              setKnobs(null);
            }}
          >
            Reset
          </button>
          <CopyValues values={t} />
          <CopyValues values={column} />
        </div>
        <Choice
          label="Move"
          value={t.move}
          options={[
            { value: "lift", label: "Lift" },
            { value: "grow", label: "Grow" },
          ]}
          pick={(move) => setWindowTuning({ move })}
        />
        <Choice
          label="Sheet"
          value={t.sheet}
          options={[
            { value: "plain", label: "Plain" },
            { value: "crease-1", label: "Crease 1" },
            { value: "crease-2", label: "Crease 2" },
          ]}
          pick={(sheet) => setWindowTuning({ sheet })}
        />
        <Choice
          label="Look"
          value={t.media}
          options={[
            { value: "clean", label: "Clean" },
            { value: "overlay", label: "Overlay" },
            { value: "multiply", label: "Multiply" },
          ]}
          pick={(media) => setWindowTuning({ media })}
        />
        <Group
          title="The pick-up"
          fields={LIFT}
          values={t}
          set={setWindowTuning}
        />
        <Group
          title="The sheet"
          fields={SHEET}
          values={t}
          set={setWindowTuning}
        />
        <Group
          title="The column"
          fields={COLUMN}
          values={column}
          set={setColumn}
        />
        <Group
          title="Sound"
          fields={SOUNDS}
          values={sound}
          set={setSoundTuning}
        />
      </div>
      {!knobsShown && (
        <button
          type="button"
          className="pb-knobs"
          style={btn}
          onClick={() => setKnobsShown(true)}
        >
          Knobs
        </button>
      )}
    </>
  );
}
