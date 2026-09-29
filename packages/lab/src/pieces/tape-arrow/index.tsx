"use client";

import { useState } from "react";
import {
  BENCH_CSS,
  Choice,
  Colour,
  CopyValues,
  Group,
  btn,
  type Field,
} from "../../bench";
import {
  TapeArrow,
  TapeStyles,
  resetTapeTuning,
  setTapeTuning,
  useTapeTuning,
  type TapeTuning,
} from "../../tape";
import { SpringGraph } from "../cue/graph";

/**
 * The tape arrow bench: the landing's scroll cue as paper tape
 * (tape.tsx) on the mat itself — at its size at the foot of a stand-in
 * first screen and, turned round, at the head of a stand-in second; and
 * blown up three times over, to judge the peel, its shadow on the
 * words, and the tape's own edge. Hover any of them to peel it, or hold
 * them all peeled while you drag.
 *
 * The knobs float at the bottom right: the tape (its size, its place,
 * the mat through it), the stuck shadow, the peel (how big, how far
 * the tip comes up, the twist, the end that stays down), the cast
 * shadow, the words, the animation (held cuts or the spring, drawn as
 * a curve whose peak you drag), the idle and the entrance. Sliders
 * write the tape store and the stylesheet regenerates on every change,
 * so what you set here is what the landing does — in this browser,
 * until Reset. "Copy values" exports them for TAPE_DEFAULTS in
 * packages/lab/src/tape.tsx.
 */

const TAPE: Field<TapeTuning>[] = [
  {
    key: "size",
    label: "Size",
    min: 4,
    max: 24,
    step: 0.1,
    unit: "vh",
    hint: "the tape's height on the landing",
  },
  {
    key: "minPx",
    label: "Least",
    min: 24,
    max: 120,
    step: 1,
    unit: "px",
    hint: "it never goes under this on a short window",
  },
  {
    key: "foot",
    label: "Foot",
    min: -6,
    max: 20,
    step: 0.25,
    unit: "vh",
    hint: "its far end off the screen's foot (and the up one off its head)",
  },
  {
    key: "stuck",
    label: "Stuck",
    min: 0.4,
    max: 1,
    step: 0.01,
    hint: "the tape's opacity while stuck — the mat through the paper",
  },
];

const REST: Field<TapeTuning>[] = [
  { key: "restY", label: "Down", min: 0, max: 6, step: 0.1, unit: "u" },
  { key: "restBlur", label: "Blur", min: 0, max: 8, step: 0.1, unit: "u" },
  { key: "restAlpha", label: "Dark", min: 0, max: 1, step: 0.01 },
];

const PEEL: Field<TapeTuning>[] = [
  {
    key: "step",
    label: "Step back",
    min: -60,
    max: 60,
    step: 0.5,
    unit: "u",
    hint: "how far the tape steps back along its way (a minus steps it on), making room for the words",
  },
  {
    key: "lift",
    label: "Lift",
    min: 1,
    max: 1.6,
    step: 0.01,
    unit: "×",
    hint: "how big the tape grows, coming toward the camera",
  },
  {
    key: "tilt",
    label: "Tip up",
    min: 0,
    max: 50,
    step: 0.5,
    unit: "°",
    hint: "how far the tip comes up, about the end that stays down",
  },
  {
    key: "turn",
    label: "Twist",
    min: -20,
    max: 20,
    step: 0.5,
    unit: "°",
  },
  {
    key: "pivot",
    label: "Hinge",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    hint: "where along the tape the end that stays down is — 0 the far end, 100 the tip",
  },
];

const CAST: Field<TapeTuning>[] = [
  { key: "castX", label: "Across", min: -20, max: 20, step: 0.5, unit: "u" },
  { key: "castY", label: "Down", min: -20, max: 30, step: 0.5, unit: "u" },
  { key: "castBlur", label: "Blur", min: 0, max: 20, step: 0.5, unit: "u" },
  { key: "castAlpha", label: "Dark", min: 0, max: 1, step: 0.01 },
];

const WORDS: Field<TapeTuning>[] = [
  {
    key: "word",
    label: "Size",
    min: 12,
    max: 70,
    step: 0.5,
    unit: "u",
    hint: "the words' size, in hundredths of the tape's height",
  },
  {
    key: "overlapDown",
    label: "In (down)",
    min: -40,
    max: 40,
    step: 0.5,
    unit: "u",
    hint: "how far the down arrow's end, stepped back, reaches into its words; a minus is a gap",
  },
  {
    key: "overlapUp",
    label: "In (up)",
    min: -40,
    max: 40,
    step: 0.5,
    unit: "u",
    hint: "how far the up arrow's end, stepped back, reaches into its words; a minus is a gap",
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

const WORD_INK: Field<TapeTuning>[] = [
  {
    key: "wordAlpha",
    label: "Opaque",
    min: 0,
    max: 1,
    step: 0.01,
    hint: "how opaque the words are — the mat shows through below 1",
  },
];

const WORD_CLOCK: Field<TapeTuning>[] = [
  {
    key: "wordMs",
    label: "Length",
    min: 40,
    max: 800,
    step: 10,
    unit: "ms",
    hint: "how long the words take to come; they go in half that",
  },
  {
    key: "wordWait",
    label: "After",
    min: 0,
    max: 400,
    step: 10,
    unit: "ms",
    hint: "how long after the peel starts the words appear",
  },
];

const LENGTH: Field<TapeTuning> = {
  key: "cut",
  label: "Length",
  min: 90,
  max: 1200,
  step: 10,
  unit: "ms",
  hint: "cuts: the three held cuts together; smooth: the spring's swing, and the stick-back",
};

const SPRING: Field<TapeTuning>[] = [
  LENGTH,
  {
    key: "bounce",
    label: "Bounce",
    min: 0,
    max: 0.8,
    step: 0.01,
    hint: "0 settles without passing its lift; more runs past it and back",
  },
];

const IDLE: Field<TapeTuning>[] = [
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
    max: 12,
    step: 0.25,
    unit: "u",
    hint: "how far along its way the tape goes",
  },
];

/** The close-up's scale over the tuning's size. */
const ZOOM = 3;

const CSS = `
${BENCH_CSS}
.tb-stage { position: fixed; inset: 0; z-index: 1; overflow-y: auto; color: #fff; }
/* The stage is the mat itself, see-through: the lab page's title under
   it would show, so it steps aside while this is up. */
main > h1 { display: none; }
.tb-page { display: grid; gap: 28px; max-width: 1120px; margin: 0 auto; padding: max(6vh, 64px) clamp(20px, 4vw, 56px) 40vh; }
@media (min-width: 760px) { .tb-page { padding-right: 368px; } }
.tb-label { margin: 0 0 8px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; opacity: .7; }
/* A stand-in screen: the mat itself, edged, clipped as the landing's
   screens are — so a peel that runs off the foot shows here too. */
.tb-wall { position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, .28); border-radius: 12px; }
.tb-screen { height: 40vh; }
.tb-close { height: max(60vh, 320px); }
.tb-close .tape.is-down { bottom: calc(50% - var(--tape-size) / 2); }
.bench-panel { --bench-label: 5rem; }
.bench-panel .bench-row { gap: 10px; }
.tb-hold { display: flex; align-items: center; gap: 8px; font-size: 12px; }
`;

/** Which side of its arrow a cue's words sit. */
const SIDES: { value: "above" | "below"; label: string }[] = [
  { value: "above", label: "Words above" },
  { value: "below", label: "Words below" },
];

export default function TapeArrowLab() {
  const t = useTapeTuning();
  const [held, setHeld] = useState(false);
  const [run, setRun] = useState(0);

  return (
    <div className="tb-stage">
      <style>{CSS}</style>
      <TapeStyles />

      <div className="bench-panel">
        <div className="bench-buttons">
          <button type="button" style={btn} onClick={resetTapeTuning}>
            Reset
          </button>
          <CopyValues values={t} />
          <button
            type="button"
            style={btn}
            onClick={() => setRun((r) => r + 1)}
          >
            ▶ Stick again
          </button>
        </div>
        <label className="tb-hold">
          <input
            type="checkbox"
            checked={held}
            onChange={(e) => setHeld(e.target.checked)}
          />
          Hold peeled
        </label>
        <Group title="The tape" fields={TAPE} values={t} set={setTapeTuning} />
        <Group
          title="Stuck — its shadow"
          fields={REST}
          values={t}
          set={setTapeTuning}
        />
        <Group title="The peel" fields={PEEL} values={t} set={setTapeTuning} />
        <Group
          title="Peeled — its shadow"
          fields={CAST}
          values={t}
          set={setTapeTuning}
        />
        <div className="bench-group">
          <div className="bench-title">The words</div>
          <label className="bench-row is-wide">
            <span>Down</span>
            <input
              className="bench-text"
              value={t.textDown}
              onChange={(e) => setTapeTuning({ textDown: e.target.value })}
            />
          </label>
          <label className="bench-row is-wide">
            <span>Up</span>
            <input
              className="bench-text"
              value={t.textUp}
              onChange={(e) => setTapeTuning({ textUp: e.target.value })}
            />
          </label>
          <Choice
            label="Down arrow"
            value={t.wordsDown}
            options={SIDES}
            pick={(wordsDown) => setTapeTuning({ wordsDown })}
          />
          <Choice
            label="Up arrow"
            value={t.wordsUp}
            options={SIDES}
            pick={(wordsUp) => setTapeTuning({ wordsUp })}
          />
          <Group title="" fields={WORDS} values={t} set={setTapeTuning} />
          <Colour
            label="Colour"
            value={t.wordColor}
            pick={(wordColor) => setTapeTuning({ wordColor })}
          />
          <Group title="" fields={WORD_INK} values={t} set={setTapeTuning} />
          <Choice
            label="Cut"
            value={t.cutOf}
            options={[
              { value: "regular", label: "Regular" },
              { value: "medium", label: "Medium" },
            ]}
            pick={(cutOf) => setTapeTuning({ cutOf })}
          />
          <Choice
            label="Come"
            value={t.wordMotion}
            options={[
              { value: "pop", label: "Pop" },
              { value: "rise", label: "Rise" },
              { value: "fade", label: "Fade" },
            ]}
            pick={(wordMotion) => setTapeTuning({ wordMotion })}
          />
          <Group title="" fields={WORD_CLOCK} values={t} set={setTapeTuning} />
        </div>
        <div className="bench-group">
          <div className="bench-title">The animation</div>
          <Choice
            label="Motion"
            value={t.motion}
            options={[
              { value: "cuts", label: "Held cuts" },
              { value: "smooth", label: "Smooth" },
            ]}
            pick={(motion) => setTapeTuning({ motion })}
          />
          {t.motion === "smooth" && (
            <SpringGraph
              period={t.cut}
              bounce={t.bounce}
              onChange={({ bounce, period }) =>
                setTapeTuning({ bounce, cut: period })
              }
            />
          )}
          <Group
            title=""
            fields={t.motion === "smooth" ? SPRING : [LENGTH]}
            values={t}
            set={setTapeTuning}
          />
        </div>
        <div className="bench-group">
          <div className="bench-title">The idle</div>
          <Choice
            label="Tape"
            value={t.idle}
            options={[
              { value: "off", label: "Still" },
              { value: "nudge", label: "Nudge" },
              { value: "bob", label: "Bob" },
            ]}
            pick={(idle) => setTapeTuning({ idle })}
          />
          <Group title="" fields={IDLE} values={t} set={setTapeTuning} />
        </div>
        <div className="bench-group">
          <div className="bench-title">The entrance</div>
          <Choice
            label="Arrives"
            value={t.entrance}
            options={[
              { value: "drop", label: "Drop" },
              { value: "stamp", label: "Stamp" },
              { value: "pop", label: "Pop" },
              { value: "slide", label: "Slide" },
            ]}
            pick={(entrance) => setTapeTuning({ entrance })}
          />
        </div>
      </div>

      <div className="tb-page" key={run}>
        <section>
          <p className="tb-label">At size — the foot of the first screen</p>
          <div className="tb-wall tb-screen">
            <TapeArrow
              dir="down"
              shown
              delay={120}
              holdOpen={held}
              label="Scroll to the projects"
              onClick={() => {}}
            />
          </div>
        </section>
        <section>
          <p className="tb-label">At size — the head of the second</p>
          <div className="tb-wall tb-screen">
            <TapeArrow
              dir="up"
              shown
              delay={120}
              holdOpen={held}
              label="Back up to the hello"
              onClick={() => {}}
            />
          </div>
        </section>
        <section>
          <p className="tb-label">Up close — {ZOOM}×</p>
          <div className="tb-wall tb-close">
            <TapeArrow
              dir="down"
              shown
              delay={120}
              size={t.size * ZOOM}
              holdOpen={held}
              label="Scroll to the projects"
              onClick={() => {}}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
