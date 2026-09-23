"use client";

import { useEffect, useState } from "react";
import {
  BENCH_CSS,
  Choice,
  CopyValues,
  Group,
  btn,
  type Field,
} from "../../bench";
import {
  Cue,
  CueStyles,
  resetCueTuning,
  setCueTuning,
  useCueTuning,
  type CueTuning,
} from "../../cue";
import { SpringGraph } from "./graph";
import { FramerBench } from "./framer";
import { HomeScreen } from "./home";
import { PillBench } from "./pill";

/**
 * The cue bench: the landing's scroll cue (cue.tsx) on the landing's
 * cream — at its size at the foot of a stand-in first screen and, turned,
 * at the head of a stand-in second; and blown up three times over, to
 * judge the parens, the arrow and the words against each other. Hover
 * any of them to part the parens, or hold them all open while you drag.
 *
 * The knobs float at the bottom right, in five groups: the weight (the
 * parens' and the arrow's line, the words' cut, a hairline round the
 * letters, the ink's strength), the glyph, the words, the animation
 * (held cuts or smooth, and how long; smooth opens on a spring, drawn
 * as a curve whose peak you drag — up for more bounce, sideways for a
 * slower or quicker swing) and the idle (off, a nudge or a
 * bob; how often and how deep). Sliders write the cue store and
 * the stylesheet regenerates on every change, so what you set here is
 * what the landing does — in this browser, until Reset. "Copy values"
 * exports them for CUE_DEFAULTS in packages/lab/src/cue.tsx.
 */

const WEIGHT: Field<CueTuning>[] = [
  {
    key: "line",
    label: "Line",
    min: 0.5,
    max: 8,
    step: 0.02,
    unit: "u",
    hint: "the parens' and the arrow's line, in glyph units (38 tall); 2.72 is the body copy's stem at a word of 34",
  },
  {
    key: "wordStroke",
    label: "Hairline",
    min: 0,
    max: 2,
    step: 0.05,
    unit: "u",
    hint: "a line round every letter of the words — 0 is the cut as it is",
  },
  {
    key: "ink",
    label: "Ink",
    min: 0.2,
    max: 1,
    step: 0.01,
    hint: "the ink's strength over the whole cue",
  },
];

const GLYPH: Field<CueTuning>[] = [
  {
    key: "size",
    label: "Size",
    min: 1,
    max: 8,
    step: 0.05,
    unit: "vh",
    hint: "the glyph's height on the landing",
  },
  {
    key: "minPx",
    label: "Least",
    min: 8,
    max: 40,
    step: 1,
    unit: "px",
    hint: "the glyph never goes under this on a short window",
  },
  {
    key: "foot",
    label: "Foot",
    min: 0,
    max: 20,
    step: 0.25,
    unit: "vh",
    hint: "off the screen's foot (and the up cue off its head)",
  },
  {
    key: "parenW",
    label: "Paren",
    min: 4,
    max: 30,
    step: 0.5,
    unit: "u",
    hint: "a paren's width — narrower is straighter",
  },
  {
    key: "restGap",
    label: "Rest gap",
    min: 0,
    max: 20,
    step: 0.5,
    unit: "u",
    hint: "the air between the parens and the arrow while shut",
  },
];

const WORDS: Field<CueTuning>[] = [
  {
    key: "word",
    label: "Size",
    min: 16,
    max: 60,
    step: 0.5,
    unit: "u",
    hint: "the words' size, in glyph units; the arrow is 27",
  },
  {
    key: "wordGap",
    label: "Before",
    min: 0,
    max: 30,
    step: 0.5,
    unit: "u",
    hint: "the air between the arrow and the words",
  },
  {
    key: "wordPad",
    label: "After",
    min: 0,
    max: 30,
    step: 0.5,
    unit: "u",
    hint: "the air between the words and the far paren",
  },
  {
    key: "tracking",
    label: "Tracking",
    min: -0.08,
    max: 0.12,
    step: 0.005,
    unit: "em",
  },
];

const LENGTH: Field<CueTuning> = {
  key: "cut",
  label: "Length",
  min: 90,
  max: 1200,
  step: 15,
  unit: "ms",
  hint: "cuts: the three held cuts together; smooth: the spring's swing, and the close",
};

const CUTS: Field<CueTuning>[] = [
  LENGTH,
  {
    key: "spread",
    label: "Spread",
    min: 0,
    max: 20,
    step: 0.5,
    unit: "u",
    hint: "the open's first cut: how far past its place each side jumps",
  },
  {
    key: "back",
    label: "Back",
    min: 0,
    max: 10,
    step: 0.5,
    unit: "u",
    hint: "the second cut: how far short of its place",
  },
];

const SPRING: Field<CueTuning>[] = [
  LENGTH,
  {
    key: "bounce",
    label: "Bounce",
    min: 0,
    max: 0.8,
    step: 0.01,
    hint: "0 settles without passing its place; more runs past it and back",
  },
];

const IDLE: Field<CueTuning>[] = [
  {
    key: "nudge",
    label: "Every",
    min: 0.5,
    max: 10,
    step: 0.25,
    unit: "s",
    hint: "the idle's period",
  },
  {
    key: "dip",
    label: "Depth",
    min: 0,
    max: 10,
    step: 0.25,
    unit: "u",
    hint: "how far along its way the arrow goes",
  },
];

/** The close-up's scale over the tuning's size. */
const ZOOM = 3;

const CSS = `
${BENCH_CSS}
.qb-stage { position: fixed; inset: 0; z-index: 1; overflow-y: auto; background: #faf9f6; color: #171717; }
.qb-page { display: grid; gap: 28px; max-width: 1120px; margin: 0 auto; padding: max(6vh, 64px) clamp(20px, 4vw, 56px) 40vh; }
@media (min-width: 760px) { .qb-page { padding-right: 368px; } }
.qb-label { margin: 0 0 8px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; opacity: .55; }
.qb-wall { position: relative; overflow: hidden; border: 1px solid rgba(23, 23, 23, .1); border-radius: 12px; background: #faf9f6; }
.qb-screen { height: 34vh; }
.qb-close { height: max(44vh, 260px); }
.qb-close .cue.is-down { bottom: calc(50% - var(--cue-size) / 2); }
.bench-panel { --bench-label: 5rem; }
.bench-panel .bench-row { gap: 10px; }
.qb-hold { display: flex; align-items: center; gap: 8px; font-size: 12px; }
`;

/** The site's cue: the parens and the arrow, the words between them. */
function ParensBench({ home }: { home: boolean }) {
  const t = useCueTuning();
  const [held, setHeld] = useState(false);
  const [run, setRun] = useState(0);

  return (
    <div className="qb-stage">
      <style>{CSS}</style>
      <CueStyles />

      <div className="bench-panel">
        <div className="bench-buttons">
          <button type="button" style={btn} onClick={resetCueTuning}>
            Reset
          </button>
          <CopyValues values={t} />
          <button
            type="button"
            style={btn}
            onClick={() => setRun((r) => r + 1)}
          >
            ▶ Pop again
          </button>
        </div>
        <label className="qb-hold">
          <input
            type="checkbox"
            checked={held}
            onChange={(e) => setHeld(e.target.checked)}
          />
          Hold open
        </label>
        <div className="bench-group">
          <Group
            title="The weight"
            fields={WEIGHT}
            values={t}
            set={setCueTuning}
          />
          <Choice
            label="Words"
            value={t.cutOf}
            options={[
              { value: "regular", label: "Regular" },
              { value: "medium", label: "Medium" },
            ]}
            pick={(cutOf) => setCueTuning({ cutOf })}
          />
        </div>
        <Group title="The glyph" fields={GLYPH} values={t} set={setCueTuning} />
        <Group title="The words" fields={WORDS} values={t} set={setCueTuning} />
        <div className="bench-group">
          <div className="bench-title">The animation</div>
          <Choice
            label="Motion"
            value={t.motion}
            options={[
              { value: "cuts", label: "Held cuts" },
              { value: "smooth", label: "Smooth" },
            ]}
            pick={(motion) => setCueTuning({ motion })}
          />
          {t.motion === "smooth" && (
            <SpringGraph
              period={t.cut}
              bounce={t.bounce}
              onChange={({ bounce, period }) =>
                setCueTuning({ bounce, cut: period })
              }
            />
          )}
          <Group
            title=""
            fields={t.motion === "smooth" ? SPRING : CUTS}
            values={t}
            set={setCueTuning}
          />
        </div>
        <div className="bench-group">
          <div className="bench-title">The idle</div>
          <Choice
            label="Arrow"
            value={t.idle}
            options={[
              { value: "off", label: "Still" },
              { value: "nudge", label: "Nudge" },
              { value: "bob", label: "Bob" },
            ]}
            pick={(idle) => setCueTuning({ idle })}
          />
          <Group title="" fields={IDLE} values={t} set={setCueTuning} />
        </div>
      </div>

      {home ? (
        <HomeScreen>
          {(delay) => (
            <Cue
              dir="down"
              shown
              delay={delay}
              holdOpen={held}
              label="Scroll to the projects"
              text="Browse projects"
              onClick={() => {}}
            />
          )}
        </HomeScreen>
      ) : (
        <div className="qb-page" key={run}>
          <section>
            <p className="qb-label">At size — the foot of the first screen</p>
            <div className="qb-wall qb-screen">
              <Cue
                dir="down"
                shown
                delay={120}
                holdOpen={held}
                label="Scroll to the projects"
                text="Browse projects"
                onClick={() => {}}
              />
            </div>
          </section>
          <section>
            <p className="qb-label">At size — the head of the second</p>
            <div className="qb-wall qb-screen">
              <Cue
                dir="up"
                shown
                delay={120}
                holdOpen={held}
                label="Back up to the hello"
                text="Back up"
                onClick={() => {}}
              />
            </div>
          </section>
          <section>
            <p className="qb-label">Up close — {ZOOM}×</p>
            <div className="qb-wall qb-close">
              <Cue
                dir="down"
                shown
                delay={120}
                size={t.size * ZOOM}
                holdOpen={held}
                label="Scroll to the projects"
                text="Browse projects"
                onClick={() => {}}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

const TABS_CSS = `
.cue-tabs { position: fixed; top: 12px; left: 16px; z-index: 95; display: flex; gap: 2px; padding: 3px; border-radius: 10px; border: 1px solid rgba(128, 128, 128, .4); background: rgba(250, 249, 246, .92); backdrop-filter: blur(10px); font-size: 12px; }
.cue-tabs button { padding: 5px 12px; font: inherit; color: #171717; background: none; border: 0; border-radius: 7px; }
.cue-tabs button[aria-pressed="true"] { background: #171717; color: #faf9f6; }
.cue-tabs hr { align-self: stretch; width: 1px; margin: 3px 4px; border: 0; background: rgba(128, 128, 128, .4); }
`;

type Tab = "parens" | "pill" | "framer";
const TAB_KEY = "portfolio.cue-tab";
type View = "walls" | "home";
const VIEW_KEY = "portfolio.cue-view";

/** Reads a remembered choice, if it is one of `options`. */
function recall<T extends string>(key: string, options: readonly T[]) {
  try {
    const saved = localStorage.getItem(key);
    return options.find((o) => o === saved) ?? null;
  } catch {
    return null;
  }
}
function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // No storage: the choice lasts the visit.
  }
}

/**
 * /lab/cue: both cues on one page, a switch at the top left between them
 * — the site's parens (ParensBench, above) and the pill sketch
 * (PillBench, pill.tsx) and the button off his Framer site
 * (FramerBench, framer.tsx) — and beside it a second: Walls, the bench's
 * stand-in screens, or Homepage, the landing's first screen full size
 * with the cue at its foot (home.tsx). Each cue keeps its own knobs and
 * saved values; the page remembers both choices.
 */
export default function CueLab() {
  const [tab, setTab] = useState<Tab>("parens");
  const [view, setView] = useState<View>("walls");
  useEffect(() => {
    const t = recall(TAB_KEY, ["parens", "pill", "framer"] as const);
    if (t) setTab(t);
    const v = recall(VIEW_KEY, ["walls", "home"] as const);
    if (v) setView(v);
  }, []);
  const home = view === "home";
  // The knobs can step aside to see the screen whole.
  const [knobs, setKnobs] = useState(true);
  return (
    <>
      <style>
        {TABS_CSS + (knobs ? "" : ".bench-panel { display: none !important; }")}
      </style>
      <div className="cue-tabs" role="group" aria-label="Which cue, and where">
        {(
          [
            ["parens", "Parens"],
            ["pill", "Pill"],
            ["framer", "Framer"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => {
              setTab(value);
              remember(TAB_KEY, value);
            }}
          >
            {label}
          </button>
        ))}
        <hr />
        {(
          [
            ["walls", "Walls"],
            ["home", "Homepage"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={view === value}
            onClick={() => {
              setView(value);
              remember(VIEW_KEY, value);
            }}
          >
            {label}
          </button>
        ))}
        <hr />
        <button
          type="button"
          aria-pressed={!knobs}
          onClick={() => setKnobs((k) => !k)}
        >
          Hide knobs
        </button>
      </div>
      {tab === "parens" ? (
        <ParensBench home={home} />
      ) : tab === "pill" ? (
        <PillBench home={home} />
      ) : (
        <FramerBench home={home} />
      )}
    </>
  );
}
