"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  CLAY_CURSOR_DEFAULTS,
  clayCursorOverride,
  clayCursorTuning,
  type ClayCursorTuning,
  type ClayCursorVariant,
} from "../../cursor-tuning";

/**
 * Slider bench for the site-wide clay cursor. Writes straight into the
 * `clayCursorTuning` singleton, which the cursor reads every frame — every
 * change is felt immediately, on this very pointer. Values live until
 * reload; "Copy values" exports them for pasting into
 * CLAY_CURSOR_DEFAULTS (packages/lab/src/cursor-tuning.ts).
 */

type Field = {
  key: keyof ClayCursorTuning;
  label: string;
  min: number;
  max: number;
  step: number;
  hint?: string;
};

const FIELDS: Field[] = [
  { key: "size", label: "Size (px)", min: 24, max: 96, step: 1 },
  {
    key: "pointerScale",
    label: "Hand size",
    min: 0.8,
    max: 1.5,
    step: 0.01,
    hint: "hand height as a multiple of the arrow's — dial until the swap has no size pop",
  },
  {
    key: "swapMs",
    label: "Swap fade (ms)",
    min: 0,
    max: 1500,
    step: 10,
    hint: "arrow<->hand crossfade length — 0 is a hard cut; push it up to watch the swap in slow motion",
  },
  {
    key: "swapSquish",
    label: "Swap squish",
    min: 0,
    max: 1,
    step: 0.05,
    hint: "pinch-in at the midpoint of the swap — 0 is a pure crossfade, 1 collapses to the tip",
  },
  {
    key: "tiltPerVx",
    label: "Lean per velocity",
    min: 0,
    max: 0.01,
    step: 0.0005,
    hint: "deg per px/s — how much it leans while moving",
  },
  { key: "maxTilt", label: "Max lean (deg)", min: 0, max: 15, step: 0.5 },
  {
    key: "tiltStiffness",
    label: "Lean stiffness",
    min: 60,
    max: 600,
    step: 10,
    hint: "lower = slower, heavier ramp in and out",
  },
  {
    key: "tiltDamping",
    label: "Lean damping",
    min: 5,
    max: 60,
    step: 1,
    hint: "near critical (zeta 1) = eases back, no bounce",
  },
  {
    key: "velocitySmoothing",
    label: "Velocity smoothing",
    min: 4,
    max: 30,
    step: 1,
    hint: "lower = softer, heavier onset",
  },
  { key: "pressScale", label: "Press squish", min: 0.7, max: 1, step: 0.01 },
  { key: "scaleStiffness", label: "Squish stiffness", min: 100, max: 900, step: 10 },
  { key: "scaleDamping", label: "Squish damping", min: 5, max: 60, step: 1 },
  {
    key: "boilFps",
    label: "Boil rate (fps)",
    min: 0,
    max: 24,
    step: 1,
    hint: "stop-motion frame cycling — 0 holds a single frame",
  },
  {
    key: "stepFps",
    label: "Body beat (fps)",
    min: 0,
    max: 30,
    step: 1,
    hint: "stop-motion cuts for the lean and squish — 0 draws every frame; the tip always tracks the pointer",
  },
];

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

type Shape = ClayCursorVariant | "auto";
const SHAPES: { value: Shape; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "arrow", label: "Arrow" },
  { value: "pointer", label: "Hand" },
];

const btn = (active = false): CSSProperties => ({
  font: "inherit",
  color: "inherit",
  background: active ? "#3a3a3a" : "#222",
  border: `1px solid ${active ? "#888" : "#555"}`,
  borderRadius: 8,
  padding: "6px 14px",
});

export default function ClayCursorTuner() {
  const [values, setValues] = useState<ClayCursorTuning>({
    ...clayCursorTuning,
  });
  const [copied, setCopied] = useState(false);
  const [shape, setShapeState] = useState<Shape>("auto");
  const [playing, setPlaying] = useState(false);
  const playTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function set(key: keyof ClayCursorTuning, value: number) {
    clayCursorTuning[key] = value;
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function setShape(next: Shape) {
    clayCursorOverride.variant = next === "auto" ? null : next;
    setShapeState(next);
  }

  // Play the swap both ways without hunting for a link: pin the arrow,
  // fade to the hand, hold, fade back, then hand control back to whatever
  // shape was selected. Holds scale with the fade so slow-motion still
  // shows a settled pose between the two crossfades.
  function playSwap() {
    if (playing) return;
    setPlaying(true);
    const hold = clayCursorTuning.swapMs + 450;
    const end = 300 + hold * 2;
    const steps: [number, ClayCursorVariant | null][] = [
      [0, "arrow"],
      [300, "pointer"],
      [300 + hold, "arrow"],
      [end, shape === "auto" ? null : shape],
    ];
    playTimers.current = steps.map(([at, variant]) =>
      setTimeout(() => {
        clayCursorOverride.variant = variant;
        if (at === end) setPlaying(false);
      }, at),
    );
  }

  // Never leave the site cursor pinned once the bench unmounts.
  useEffect(
    () => () => {
      playTimers.current.forEach(clearTimeout);
      clayCursorOverride.variant = null;
    },
    [],
  );

  function reset() {
    Object.assign(clayCursorTuning, CLAY_CURSOR_DEFAULTS);
    setValues({ ...CLAY_CURSOR_DEFAULTS });
    playTimers.current.forEach(clearTimeout);
    setPlaying(false);
    setShape("auto");
  }

  async function copy() {
    const lines = Object.entries(values)
      .map(([k, v]) => `  ${k}: ${v},`)
      .join("\n");
    await navigator.clipboard.writeText(`{\n${lines}\n}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Damping ratio for the lean: < 1 bounces past upright, ~1 eases back
  // with no bounce (the card feel).
  const zeta = values.tiltDamping / (2 * Math.sqrt(values.tiltStiffness));

  return (
    <div style={{ display: "grid", gap: 20, width: "min(560px, 100%)" }}>
      <div
        style={{
          height: 140,
          borderRadius: 16,
          border: "1px dashed #444",
          display: "grid",
          placeItems: "center",
          color: "#888",
          fontSize: 14,
          userSelect: "none",
        }}
      >
        <span>
          swing the pointer around here — <a href="#tuner">hover a link</a> or{" "}
          <button
            type="button"
            style={{
              font: "inherit",
              color: "inherit",
              background: "#222",
              border: "1px solid #555",
              borderRadius: 8,
              padding: "2px 10px",
            }}
          >
            press me
          </button>
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "11rem 1fr",
          alignItems: "center",
          gap: 12,
          fontSize: 13,
        }}
      >
        <span title="pin the shape to inspect either state, or play the swap on demand">
          Shape
        </span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SHAPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setShape(value)}
              aria-pressed={shape === value}
              style={btn(shape === value)}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={playSwap}
            disabled={playing}
            style={{ ...btn(), opacity: playing ? 0.5 : 1, marginLeft: 8 }}
          >
            {playing ? "Playing…" : "▶ Play swap"}
          </button>
        </div>
      </div>

      <div id="tuner" style={{ display: "grid", gap: 10 }}>
        {FIELDS.map(({ key, label, min, max, step, hint }) => (
          <label
            key={key}
            title={hint}
            style={{
              display: "grid",
              gridTemplateColumns: "11rem 1fr 4.5rem",
              alignItems: "center",
              gap: 12,
              fontSize: 13,
            }}
          >
            <span>{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={values[key]}
              onChange={(e) => set(key, Number(e.target.value))}
            />
            <span style={{ fontFamily: mono, textAlign: "right" }}>
              {values[key]}
            </span>
          </label>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 13,
        }}
      >
        <button
          type="button"
          onClick={reset}
          style={{
            font: "inherit",
            color: "inherit",
            background: "#222",
            border: "1px solid #555",
            borderRadius: 8,
            padding: "6px 14px",
          }}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={copy}
          style={{
            font: "inherit",
            color: "inherit",
            background: "#222",
            border: "1px solid #555",
            borderRadius: 8,
            padding: "6px 14px",
          }}
        >
          {copied ? "Copied ✓" : "Copy values"}
        </button>
        <span style={{ fontFamily: mono, color: "#888", marginLeft: "auto" }}>
          ζ = {zeta.toFixed(2)} {zeta < 1 ? "(bounces)" : "(eases back)"}
        </span>
      </div>

      <p style={{ fontSize: 12, color: "#777", margin: 0 }}>
        Changes apply live to the site cursor and last until reload. Lock a
        feel in by copying the values into CLAY_CURSOR_DEFAULTS in
        packages/lab/src/cursor-tuning.ts.
      </p>
    </div>
  );
}
