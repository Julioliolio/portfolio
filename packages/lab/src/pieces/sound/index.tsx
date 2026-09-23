"use client";

import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import {
  BENCH_CSS,
  CopyValues,
  Group,
  btn,
  mono,
  type Field,
} from "../../bench";
import { Cue, CueStyles } from "../../cue";
import {
  GREETING_HELLO,
  GREETING_LINE,
  GreetingStyles,
  Speech,
  afterHello,
  countWords,
} from "../../greeting";
import { loaders } from "../../loaders";
import { useMotionTuning } from "../../motion";
import {
  SOUND_FIELDS,
  SoundToggle,
  play,
  resetSoundTuning,
  setSoundTuning,
  useSoundTuning,
  type SoundTuning,
} from "../../sound";

/**
 * The sound bench: every component that sounds, live on the page, with
 * the knobs for its own sound right under it — the greeting's words
 * (the letters' piano, the bed under the hover, the taps as the words
 * land), the scroll cue, the cartel and the road signs — and at the
 * foot the voices themselves (the tick, the tap, the knock, the slide)
 * and the level of everything. The sliders write the sound store,
 * live: what is set here is what the home page does in this browser,
 * until Reset. "Copy values" exports them for SOUND_DEFAULTS in
 * packages/lab/src/sound.tsx.
 *
 * Each component's knobs are its places' levels (sound.tsx, `Place`):
 * the voice a place plays is shared — the cue's tap is the sign's tap
 * — and shaped once, at the foot. Nothing sounds before the first
 * click — the browser's rule. The pieces come through the lab loaders
 * like everywhere else.
 */

const Cartel = lazy(loaders.cartel);
const RoadSigns = lazy(loaders["road-signs"]);

const pick = (keys: (keyof SoundTuning)[]): Field<SoundTuning>[] =>
  SOUND_FIELDS.filter((f) => keys.includes(f.key));

const LETTERS = pick(["letter", "ring", "gap", "company", "whimsy", "room"]);
const BED = pick(["bed", "pace"]);
const WORDS = pick(["word"]);
const CUE = pick(["cue", "click"]);
const CARTEL = pick(["walk", "spin"]);
const SIGNS = pick(["sign", "card", "click"]);
const VOICES = pick(["cut", "tap", "knock", "slide"]);
const EVERYTHING = pick(["master", "pitch"]);

/** The cue's height on the bench, vh. */
const CUE_SIZE = 7;

const PREVIEW_CSS = `
.sb-section { display: grid; gap: 14px; padding-top: 22px; border-top: 1px solid rgba(23, 23, 23, .12); }
.sb-section:first-of-type { padding-top: 0; border-top: 0; }
.sb-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; }
.sb-head h2 { margin: 0; font-size: 15px; font-weight: 600; }
.sb-head p { margin: 0; font-size: 12px; opacity: .65; line-height: 1.5; }
.sb-wall { position: relative; display: grid; justify-items: center; align-items: center; background: #faf9f6; color: #171717; border: 1px solid rgba(23, 23, 23, .1); overflow: visible; }
.sb-wall-words { gap: .3em; padding: 40px 24px; font-size: clamp(30px, 5vw, 52px); line-height: 1.1; letter-spacing: -.02em; }
.sb-words { text-align: center; white-space: nowrap; }
.sb-wall-cue { height: calc(${CUE_SIZE}vh + 7vh); }
.sb-wall-cartel { padding: 28px 24px; }
.sb-wall-signs { padding: 32px 24px; justify-items: start; }
.sb-switch[aria-pressed="true"] { background: #171717; color: #fff; border-color: #171717; }
.sb-mute { display: inline-flex; align-items: center; gap: 6px; }
.sb-mute svg { width: 18px; height: 18px; }
.sb-mute[aria-pressed="true"] { opacity: .5; }
.sb-note { margin: 0; font-size: 12px; opacity: .6; line-height: 1.5; }
`;

/** A component and its knobs: a heading, a line on what to do, the
 *  piece on its wall, then the sliders. */
function Section({
  title,
  what,
  children,
}: {
  title: string;
  what: string;
  children: ReactNode;
}) {
  return (
    <section className="sb-section">
      <div className="sb-head">
        <h2>{title}</h2>
        <p>{what}</p>
      </div>
      {children}
    </section>
  );
}

export default function SoundBench() {
  const values = useSoundTuning();
  const motion = useMotionTuning();
  const [run, setRun] = useState(0);
  const [bed, setBed] = useState(true);

  // The words land as on the home page: a tap as each one arrives, on
  // the motion tuning's clock, every time they are said.
  const lineAt = afterHello(motion);
  useEffect(() => {
    const timers: number[] = [];
    const say = (words: number, base: number) => {
      for (let i = 0; i < words; i++) {
        timers.push(
          window.setTimeout(
            () => play("tap", 1, { at: "word" }),
            base + i * motion.stagger,
          ),
        );
      }
    };
    say(countWords(GREETING_HELLO), motion.lead);
    say(countWords(GREETING_LINE), lineAt);
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
    // Said again on `run` only; a bench change mid-sentence does not
    // restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  return (
    <div style={{ display: "grid", gap: 26, width: "min(720px, 100%)" }}>
      <GreetingStyles />
      <CueStyles />
      <style>{BENCH_CSS + PREVIEW_CSS}</style>

      <Section
        title="The greeting"
        what="Hover the letters for the piano and, under it, the bed. Say it again for the taps as the words land. Click anywhere first."
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            fontSize: 13,
          }}
        >
          <button
            type="button"
            style={btn}
            onClick={() => setRun((r) => r + 1)}
          >
            ▶ Say it again
          </button>
          <button
            type="button"
            className="sb-switch"
            style={btn}
            aria-pressed={bed}
            onClick={() => setBed((b) => !b)}
          >
            {bed ? "Bed on hover" : "Bed off"}
          </button>
        </div>
        <div className="sb-wall sb-wall-words" key={run}>
          <Speech
            lines={GREETING_HELLO}
            base={motion.lead}
            step={motion.stagger}
            className="sb-words"
            bed={bed}
          />
          <Speech
            lines={GREETING_LINE}
            base={lineAt}
            step={motion.stagger}
            className="sb-words"
            bed={bed}
          />
        </div>
        <Group
          title="The letters"
          fields={LETTERS}
          values={values}
          set={setSoundTuning}
        />
        <Group
          title="The bed"
          fields={BED}
          values={values}
          set={setSoundTuning}
        />
        <Group
          title="The words landing"
          fields={WORDS}
          values={values}
          set={setSoundTuning}
        />
      </Section>

      <Section
        title="The scroll cue"
        what="Hover the cue for its tap, leave for the softer one; click for the knock."
      >
        <div className="sb-wall sb-wall-cue">
          <Cue
            dir="down"
            shown
            delay={motion.lead}
            size={CUE_SIZE}
            label="View projects"
            text="Browse projects"
            onClick={() => play("knock", 1, { at: "click" })}
          />
        </div>
        <Group
          title="Its places"
          fields={CUE}
          values={values}
          set={setSoundTuning}
        />
      </Section>

      <Section
        title="The cartel"
        what="Move the pointer around the sign for the ticks of its walk; click it for the spin's knocks and ticks."
      >
        <div className="sb-wall sb-wall-cartel">
          <Suspense fallback={null}>
            <Cartel height="min(30vh, 260px)" controls={false} />
          </Suspense>
        </div>
        <Group
          title="Its places"
          fields={CARTEL}
          values={values}
          set={setSoundTuning}
        />
      </Section>

      <Section
        title="The road signs"
        what="Hover a sign for its tap and the card's slide out and back; a click knocks (and goes to the project)."
      >
        <div className="sb-wall sb-wall-signs">
          <Suspense fallback={null}>
            <RoadSigns controls={false} />
          </Suspense>
        </div>
        <Group
          title="Its places"
          fields={SIGNS}
          values={values}
          set={setSoundTuning}
        />
      </Section>

      <Section
        title="The voices, and everything"
        what="The sounds themselves, shared by every place that plays them, and the level of it all."
      >
        <Group
          title="The voices"
          fields={VOICES}
          values={values}
          set={setSoundTuning}
        />
        <Group
          title="Everything"
          fields={EVERYTHING}
          values={values}
          set={setSoundTuning}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 13,
          }}
        >
          <SoundToggle className="sb-mute" style={btn} />
          <button type="button" style={btn} onClick={resetSoundTuning}>
            Reset
          </button>
          <CopyValues values={values} />
          <span style={{ fontFamily: mono, fontSize: 12, opacity: 0.7 }}>
            the mute holds for the visit
          </span>
        </div>
        <p className="sb-note">
          These values apply to every page&apos;s sound in this browser until
          Reset. The bed switch is this page&apos;s only: the landing always
          brings the bed with the hover. Lock a feel in by pasting the values
          into SOUND_DEFAULTS in packages/lab/src/sound.tsx.
        </p>
      </Section>
    </div>
  );
}
