"use client";

import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { asset } from "../../asset";
import {
  BENCH_CSS,
  Choice,
  CopyAll,
  Expr,
  Group,
  btn,
  type Field,
  type Literal,
} from "../../bench";
import type { Place, Places } from "../road-signs";
import { PRINTS, printPreview } from "../../prints";
import { SpringGraph } from "../../spring-graph";
import {
  SIGNS_OPEN,
  WINDOW_LAYOUT,
  signsTuning,
  useSignsBeside,
  useViewport,
} from "../../signs-layout";
import { SOUND_FIELDS, setSoundTuning, useSoundTuning } from "../../sound";
import { BLUE, INK, MEDIUM } from "../../style";
import { ProjectWindow, type WindowPreview } from "../../window";
import {
  paperCss,
  resetWindowTuning,
  setWindowTuning,
  useWindowTuning,
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
 * paper (plain, or a crease; its ground and shadows are /lab/sheet's,
 * read from the same store), the window's clocks and box,
 * the column's sizes and clocks (laid over the site's, which
 * follow the viewport), and the sounds. The window's knobs write the
 * window store (what the home page reads, in this browser, until
 * Reset); the column's are this page's own. One "Copy values" takes
 * the lot — the window, the column's sizes and places as the site's
 * shares of this window, the springs, the sounds — each under a note
 * of where it goes.
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
  cardY: number;
  springPeriod: number;
  springBounce: number;
  turnPeriod: number;
  turnBounce: number;
  liftRise: number;
  liftGrow: number;
  liftMs: number;
  places: Places;
};

const COLUMN: Field<ColumnKnobs>[] = [
  {
    key: "printW",
    label: "Print",
    min: 320,
    max: 1200,
    step: 10,
    unit: "px",
    hint: "A wide print's width; a tall one is a share of it (57.9vw on the site)",
  },
  {
    key: "columnRight",
    label: "Right air",
    min: 0,
    max: 160,
    step: 2,
    unit: "px",
    hint: "between the column and the screen's edge (0 on the site)",
  },
  {
    key: "cardY",
    label: "Up / down",
    min: -500,
    max: 200,
    step: 2,
    unit: "px",
    hint: "the column's centre line, from the stack's middle (-26.1vh on the site)",
  },
  {
    key: "springPeriod",
    label: "Swing",
    min: 150,
    max: 1200,
    step: 10,
    unit: "ms",
    hint: "a move is a spring: one swing; it settles a little after",
  },
  {
    key: "springBounce",
    label: "Bounce",
    min: 0,
    max: 0.8,
    step: 0.02,
    hint: "0 settles without passing its spot; more swings back further",
  },
  {
    key: "turnPeriod",
    label: "Turn swing",
    min: 150,
    max: 1200,
    step: 10,
    unit: "ms",
    hint: "the turn on the way has its own spring: one swing",
  },
  {
    key: "turnBounce",
    label: "Turn bounce",
    min: 0,
    max: 0.8,
    step: 0.02,
    hint: "how far the turn overshoots the lean",
  },
  {
    key: "liftRise",
    label: "Lift rise",
    min: 0,
    max: 24,
    step: 1,
    unit: "px",
    hint: "the front print under the pointer rises this far",
  },
  {
    key: "liftGrow",
    label: "Lift grow",
    min: 1,
    max: 1.08,
    step: 0.005,
    hint: "and grows to this scale",
  },
  {
    key: "liftMs",
    label: "Lift time",
    min: 60,
    max: 600,
    step: 10,
    unit: "ms",
    hint: "the lift's ease, up and back down",
  },
];

/** Which arrangement is on the mat while the sheets are placed. */
type Show = "pointer" | "pile" | "localpal" | "camper" | "convertr";

/** The places as signsTuning() writes them: each px as a share of the
 *  window it was placed at. */
function placeShares(places: Places, vw: number, vh: number): Literal {
  const one = (at: Place) => ({
    x: new Expr(`${+(at.x / vw).toFixed(3)} * vw`),
    y: new Expr(`${+(at.y / vh).toFixed(3)} * vh`),
    tilt: at.tilt,
  });
  const each = (set: Record<string, Place>) =>
    Object.fromEntries(Object.entries(set).map(([k, at]) => [k, one(at)]));
  return {
    pile: each(places.pile),
    hover: Object.fromEntries(
      Object.entries(places.hover).map(([k, set]) => [k, each(set)]),
    ),
  };
}

/** A place's numbers, editable: x, y (px off the front spot) and the
 *  lean. */
function PlaceRow({
  label,
  at,
  set,
}: {
  label: string;
  at: Place;
  set: (at: Place) => void;
}) {
  const field = (key: keyof Place, unit: string) => (
    <label className="pb-place-field">
      <input
        type="number"
        className="bench-text"
        value={at[key]}
        step={key === "tilt" ? 0.5 : 1}
        onChange={(e) => set({ ...at, [key]: Number(e.target.value) })}
      />
      <span>{unit}</span>
    </label>
  );
  return (
    <div className="bench-row is-wide">
      <span>{label}</span>
      <div className="pb-place">
        {field("x", "x")}
        {field("y", "y")}
        {field("tilt", "°")}
      </div>
    </div>
  );
}

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
    key: "hairline",
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
.pb-place { display: flex; gap: 4px; }
.pb-place-field { display: flex; align-items: center; gap: 3px; min-width: 0; }
.pb-place-field input { width: 4.2em; padding: 3px 4px; }
.pb-place-field span { font-size: 10px; opacity: .6; }
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

const roundPlace = (at: Place): Place => ({
  x: Math.round(at.x),
  y: Math.round(at.y),
  tilt: at.tilt,
});
const roundSet = (set: Record<string, Place>) =>
  Object.fromEntries(Object.entries(set).map(([k, at]) => [k, roundPlace(at)]));
const roundPlaces = (p: Places): Places => ({
  pile: roundSet(p.pile),
  hover: Object.fromEntries(
    Object.entries(p.hover).map(([k, set]) => [k, roundSet(set)]),
  ),
});

export default function PaperBench() {
  const t = useWindowTuning();
  const sound = useSoundTuning();
  const { w, h, measured } = useViewport();
  const site = signsTuning(w, h);
  const [knobs, setKnobs] = useState<ColumnKnobs | null>(null);
  const column: ColumnKnobs = knobs ?? {
    printW: Math.round(site.printW),
    columnRight: Math.round(site.columnRight),
    cardY: Math.round(site.cardY),
    springPeriod: 250,
    springBounce: 0.1,
    turnPeriod: 370,
    turnBounce: 0.34,
    liftRise: 6,
    liftGrow: 1.015,
    liftMs: 220,
    places: roundPlaces(site.places),
  };
  const setColumn = (patch: Partial<ColumnKnobs>) =>
    setKnobs({ ...column, ...patch });
  const { places } = column;
  const setPlaces = (next: Places) => setColumn({ places: next });
  // Placing the sheets by hand: what is on the mat meanwhile, and
  // whether they can be dragged (see RoadSigns' placing).
  const [showing, setShowing] = useState<Show>("pointer");
  const [placing, setPlacing] = useState(false);
  const hold =
    showing === "pointer" ? undefined : showing === "pile" ? null : showing;

  // The landing's flow: the open project, and the print it grew from.
  const [open, setOpen] = useState<string | null>(null);
  const [knobsShown, setKnobsShown] = useState(true);
  // The signs beside the window, the landing's way: in, and back.
  const beside = useSignsBeside(open, t);
  // The window stays up for its way back, on the project it is putting
  // down (it unmounts itself once that has played).
  const shownSlug = beside.handed;
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
      <style>{paperCss(t)}</style>
      <div className="pb-tail" aria-hidden />

      <div
        ref={stack}
        className={beside.opened ? "pb-signs is-open" : "pb-signs"}
        onClick={onSignsClick}
        style={beside.style}
      >
        {measured && (
          <Suspense fallback={null}>
            <RoadSigns
              controls={false}
              frame="signs"
              tuning={{
                ...site,
                ...column,
                returnDelay: beside.returnDelay,
              }}
              selected={beside.selected}
              handed={beside.handed}
              hold={beside.over ? undefined : hold}
              placing={placing && !beside.over}
              onTune={(patch) => {
                if (patch.places) setPlaces(patch.places);
              }}
            />
          </Suspense>
        )}
      </div>

      {shownSlug !== null && (
        <ProjectWindow
          active={shownSlug}
          shown={open !== null}
          from={from}
          label={shownSlug}
          layout={WINDOW_LAYOUT}
          onClose={close}
        >
          <div className="pb-page" key={shownSlug}>
            <h1>{shownSlug.charAt(0).toUpperCase() + shownSlug.slice(1)}</h1>
            <p>
              A stand-in for the case study, printed on the sheet: the title in
              the blue, a run of reading text at the measure, and the three
              kinds of thing a page shows — a photo, a film, a live demo — so
              the pick-up can be judged with a page on the sheet.
            </p>
            <p>
              The paper is tuned on its own bench, /lab/sheet; this page reads
              the same knobs, so what is set there is what a print is picked up
              into here.
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
              More of the page, so there is something to scroll: the paper
              scrolls with the page, one long sheet.
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
          <CopyAll
            header={`/lab/paper at a ${w}x${h} window`}
            sections={() => [
              {
                name: "window",
                into: "WINDOW_DEFAULTS, packages/lab/src/window-tuning.ts",
                values: t,
              },
              {
                name: "signs",
                into: "signsTuning(), packages/lab/src/signs-layout.ts (shares of this window)",
                values: {
                  printW: new Expr(`${+(column.printW / w).toFixed(3)} * vw`),
                  columnRight: new Expr(
                    `${+(column.columnRight / w).toFixed(3)} * vw`,
                  ),
                  cardY: new Expr(`${+(column.cardY / h).toFixed(3)} * vh`),
                  places: placeShares(places, w, h),
                },
              },
              {
                name: "springs",
                into: "ROAD_SIGNS_DEFAULTS, packages/lab/src/pieces/road-signs/index.tsx",
                values: {
                  springPeriod: column.springPeriod,
                  springBounce: column.springBounce,
                  turnPeriod: column.turnPeriod,
                  turnBounce: column.turnBounce,
                  liftRise: column.liftRise,
                  liftGrow: column.liftGrow,
                  liftMs: column.liftMs,
                },
              },
              {
                name: "sound",
                into: "SOUND_DEFAULTS, packages/lab/src/sound.tsx",
                values: sound,
              },
            ]}
          />
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
        <div className="bench-group">
          <div className="bench-title">The springs</div>
          <span style={{ opacity: 0.6, fontSize: 11 }}>
            Drag a curve: across for the swing, up for the bounce. Play runs a
            dot on the same easing the sheets move on.
          </span>
          <SpringGraph
            label="Move"
            period={column.springPeriod}
            bounce={column.springBounce}
            onChange={({ period, bounce }) =>
              setColumn({ springPeriod: period, springBounce: bounce })
            }
          />
          <SpringGraph
            label="Turn"
            period={column.turnPeriod}
            bounce={column.turnBounce}
            onChange={({ period, bounce }) =>
              setColumn({ turnPeriod: period, turnBounce: bounce })
            }
          />
        </div>
        <div className="bench-group">
          <div className="bench-title">The places</div>
          <Choice
            label="Edit"
            value={showing}
            options={[
              { value: "pointer", label: "Live" },
              { value: "pile", label: "Pile" },
              ...PRINTS.map((p) => ({ value: p.slug as Show, label: p.title })),
            ]}
            pick={(v) => {
              setShowing(v);
              setPlacing(v !== "pointer");
            }}
          />
          <span style={{ opacity: 0.6, fontSize: 11 }}>
            Pick the pile, or a sign&rsquo;s hover, and drag its sheets where
            you want them, the front one too; alt-drag leans one. Each hover has
            its own layout. Live gives the pointer back. The numbers are px off
            the front spot at this window; Copy values turns them into the
            site&rsquo;s shares.
          </span>
          {showing === "pointer"
            ? null
            : PRINTS.map((p) => {
                const set =
                  showing === "pile"
                    ? places.pile
                    : (places.hover[showing] ?? {});
                const at = set[p.slug] ?? { x: 0, y: 0, tilt: p.tilt };
                return (
                  <PlaceRow
                    key={p.slug}
                    label={p.slug === showing ? `${p.title} (front)` : p.title}
                    at={at}
                    set={(next) =>
                      setPlaces(
                        showing === "pile"
                          ? {
                              ...places,
                              pile: { ...places.pile, [p.slug]: next },
                            }
                          : {
                              ...places,
                              hover: {
                                ...places.hover,
                                [showing]: { ...set, [p.slug]: next },
                              },
                            },
                      )
                    }
                  />
                );
              })}
        </div>
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
