"use client";

import { useState } from "react";
import {
  BENCH_CSS,
  CopyValues,
  Group,
  btn,
  mono,
  type Field,
} from "../../bench";
import {
  GREETING_HELLO,
  GREETING_LINE,
  GreetingStyles,
  Speech,
  countWords,
} from "../../greeting";
import { useMotionTuning } from "../../motion";
import {
  SOUND_FIELDS,
  SoundToggle,
  play,
  resetSoundTuning,
  setSoundTuning,
  useSoundTuning,
  type SoundName,
  type SoundTuning,
} from "../../sound";

/**
 * The sound bench. The greeting's words at hero size to hover — every
 * letter a felt-piano note as it stamps, the bed coming in under the
 * hover — with the bed switchable, so the letters can be heard with it
 * and without. The sliders
 * write the sound store, live: what is set here is what the home page
 * does in this browser, until Reset. "Copy values" exports them for
 * SOUND_DEFAULTS in packages/lab/src/sound.tsx.
 *
 * The bed is the hover's everywhere (see Speech); the switch here
 * only says whether this page's speeches bring it. Nothing sounds
 * before the first click — the browser's rule.
 */

const PREVIEWS: SoundName[] = ["cut", "tap", "knock", "slide", "letter"];

const NOTES: Field<SoundTuning>[] = SOUND_FIELDS.filter((f) =>
  ["letter", "ring", "gap", "company", "whimsy", "room"].includes(f.key),
);
const BED: Field<SoundTuning>[] = SOUND_FIELDS.filter((f) =>
  ["bed", "pace"].includes(f.key),
);
const SIGN: Field<SoundTuning>[] = SOUND_FIELDS.filter((f) =>
  ["master", "pitch", "cut", "tap", "knock", "slide"].includes(f.key),
);

const PREVIEW_CSS = `
.sb-wall { display: grid; justify-items: center; gap: .3em; padding: 40px 24px; background: #faf9f6; color: #171717; border: 1px solid rgba(23, 23, 23, .1); font-size: clamp(34px, 6vw, 60px); line-height: 1.1; letter-spacing: -.02em; }
.sb-words { text-align: center; white-space: nowrap; }
.sb-switch[aria-pressed="true"] { background: #171717; color: #fff; border-color: #171717; }
.sb-mute { display: inline-flex; align-items: center; gap: 6px; }
.sb-mute svg { width: 18px; height: 18px; }
.sb-mute[aria-pressed="true"] { opacity: .5; }
`;

export default function SoundBench() {
  const values = useSoundTuning();
  const motion = useMotionTuning();
  const [run, setRun] = useState(0);
  const [bed, setBed] = useState(true);

  const afterHello =
    motion.lead + countWords(GREETING_HELLO) * motion.stagger + 200;

  return (
    <div style={{ display: "grid", gap: 20, width: "min(720px, 100%)" }}>
      <GreetingStyles />
      <style>{BENCH_CSS + PREVIEW_CSS}</style>

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
          className="sb-switch"
          style={btn}
          aria-pressed={bed}
          onClick={() => setBed((b) => !b)}
        >
          {bed ? "Bed on hover" : "Bed off"}
        </button>
        <button type="button" style={btn} onClick={() => setRun((r) => r + 1)}>
          ▶ Say it again
        </button>
        <SoundToggle className="sb-mute" style={btn} />
        <span style={{ fontFamily: mono, fontSize: 12, opacity: 0.7 }}>
          hover the letters · click anywhere first
        </span>
      </div>

      <div className="sb-wall" key={run}>
        <Speech
          lines={GREETING_HELLO}
          base={motion.lead}
          step={motion.stagger}
          className="sb-words"
          bed={bed}
        />
        <Speech
          lines={GREETING_LINE}
          base={afterHello}
          step={motion.stagger}
          className="sb-words"
          bed={bed}
        />
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PREVIEWS.map((name) => (
          <button
            key={name}
            type="button"
            style={btn}
            onClick={() => play(name)}
          >
            ▶ {name}
          </button>
        ))}
      </div>

      <Group
        title="The letters"
        fields={NOTES}
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
        title="The sign, and everything"
        fields={SIGN}
        values={values}
        set={setSoundTuning}
      />

      <div
        style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}
      >
        <button type="button" style={btn} onClick={resetSoundTuning}>
          Reset
        </button>
        <CopyValues values={values} />
      </div>
      <p style={{ margin: 0, fontSize: 12, opacity: 0.6, lineHeight: 1.5 }}>
        These values apply to every page&apos;s sound in this browser until
        Reset. The bed switch is this page&apos;s only: the landing always
        brings the bed with the hover. Lock a feel in by pasting the values into
        SOUND_DEFAULTS in packages/lab/src/sound.tsx.
      </p>
    </div>
  );
}
