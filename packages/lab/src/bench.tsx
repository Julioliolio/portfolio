"use client";

import { useState, type CSSProperties } from "react";
import { MONO } from "./style";

/**
 * The chrome the light benches share (/lab/motion, /lab/greeting,
 * /lab/hello): a titled group of slider rows over a tuning store, the
 * button style, and the Copy-values button; and, for the benches that
 * float their knobs over a full-screen stage (/lab/window, /lab/contents,
 * /lab/cue), the panel itself (.bench-panel) with a row of buttons, a
 * choice between a few words (<Choice>) and a colour (<Colour>). A bench
 * puts BENCH_CSS in its own stylesheet and may override the row classes
 * there — the hello bench's floating panel sets them narrower, a
 * .bench-panel sets its label column with --bench-label. The pieces' own
 * dark panels (cartel, road signs) are their own.
 */

/** Keys of T that hold a number — what a slider row can drive. */
export type NumericKey<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

export type Field<T> = {
  key: NumericKey<T> & string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  hint?: string;
};

export const mono = MONO;

export const btn: CSSProperties = {
  font: "inherit",
  fontSize: 12,
  color: "inherit",
  background: "rgba(128, 128, 128, 0.12)",
  border: "1px solid rgba(128, 128, 128, 0.45)",
  borderRadius: 8,
  padding: "6px 14px",
};

export const BENCH_CSS = `
.bench-group { display: grid; gap: 8px; }
.bench-title { margin-top: 6px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; opacity: .6; }
.bench-row { display: grid; grid-template-columns: 7rem 1fr 5rem; align-items: center; gap: 12px; font-size: 13px; }
.bench-value { font-family: ${mono}; font-size: 12px; text-align: right; }
/* The floating panel, bottom right over the stage. A wide row has no
   value column: a choice, a colour, a text. */
.bench-panel { --bench-label: 6rem; position: fixed; right: 16px; bottom: 16px; z-index: 90; display: grid; gap: 10px; width: 320px; max-height: calc(100vh - 32px); overflow-y: auto; padding: 12px 14px 14px; border-radius: 14px; border: 1px solid rgba(128, 128, 128, 0.4); background: rgba(250, 249, 246, 0.92); color: #171717; font-size: 12px; backdrop-filter: blur(10px); }
.bench-panel .bench-row { grid-template-columns: var(--bench-label) minmax(0, 1fr) 4rem; }
.bench-panel .bench-row.is-wide { grid-template-columns: var(--bench-label) minmax(0, 1fr); }
.bench-panel input[type=range] { width: 100%; min-width: 0; }
.bench-buttons { display: flex; flex-wrap: wrap; gap: 6px; }
.bench-choice { display: flex; gap: 4px; }
.bench-choice button { flex: 1; padding: 4px 0; font: inherit; font-size: 11px; color: inherit; background: none; border: 1px solid rgba(128, 128, 128, .45); border-radius: 6px; }
.bench-choice button[aria-pressed="true"] { background: #171717; border-color: #171717; color: #faf9f6; }
.bench-colour { display: flex; align-items: center; gap: 8px; }
.bench-colour input { width: 32px; height: 22px; padding: 0; border: 1px solid rgba(128, 128, 128, .45); border-radius: 6px; background: none; }
.bench-colour code { font-size: 11px; opacity: .7; }
.bench-text { width: 100%; box-sizing: border-box; padding: 4px 6px; font: inherit; font-size: 12px; color: inherit; background: rgba(128, 128, 128, .08); border: 1px solid rgba(128, 128, 128, .45); border-radius: 6px; }
`;

/** A row of buttons for a knob that is one of a few words. */
export function Choice<V extends string>({
  label,
  value,
  options,
  pick,
}: {
  label: string;
  value: V;
  options: { value: V; label: string }[];
  pick: (v: V) => void;
}) {
  return (
    <div className="bench-row is-wide">
      <span>{label}</span>
      <div className="bench-choice">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => pick(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** A colour knob: the picker and its hex. */
export function Colour({
  label,
  value,
  pick,
}: {
  label: string;
  value: string;
  pick: (v: string) => void;
}) {
  return (
    <label className="bench-row is-wide">
      <span>{label}</span>
      <span className="bench-colour">
        <input
          type="color"
          value={value}
          onChange={(e) => pick(e.target.value)}
        />
        <code>{value}</code>
      </span>
    </label>
  );
}

/** A titled group of sliders, each writing its key into the store. */
export function Group<T>({
  title,
  fields,
  values,
  set,
}: {
  title: string;
  fields: Field<T>[];
  values: T;
  set: (patch: Partial<T>) => void;
}) {
  return (
    <div className="bench-group">
      <div className="bench-title">{title}</div>
      {fields.map(({ key, label, min, max, step, unit, hint }) => (
        <label key={key} title={hint} className="bench-row">
          <span>{label}</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={values[key] as number}
            onChange={(e) =>
              set({ [key]: Number(e.target.value) } as Partial<T>)
            }
          />
          <span className="bench-value">
            {values[key] as number}
            {unit ?? ""}
          </span>
        </label>
      ))}
    </div>
  );
}

/** Puts the values on the clipboard as an object literal, ready to
 *  paste over the store's DEFAULTS, and says so for a moment. */
export function CopyValues({
  values,
}: {
  values: Record<string, number | string>;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    const lines = Object.entries(values).map(
      ([k, v]) => `  ${k}: ${JSON.stringify(v)},`,
    );
    await navigator.clipboard.writeText(`{\n${lines.join("\n")}\n}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button type="button" style={btn} onClick={copy}>
      {copied ? "Copied ✓" : "Copy values"}
    </button>
  );
}
