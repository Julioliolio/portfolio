"use client";

import { useState } from "react";
import {
  CLAY_CURSOR_DEFAULTS,
  clayCursorTuning,
  type ClayCursorTuning,
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
];

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

export default function ClayCursorTuner() {
  const [values, setValues] = useState<ClayCursorTuning>({
    ...clayCursorTuning,
  });
  const [copied, setCopied] = useState(false);

  function set(key: keyof ClayCursorTuning, value: number) {
    clayCursorTuning[key] = value;
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    Object.assign(clayCursorTuning, CLAY_CURSOR_DEFAULTS);
    setValues({ ...CLAY_CURSOR_DEFAULTS });
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
