"use client";

import { useState, type CSSProperties } from "react";

/**
 * The chrome the light benches share (/lab/motion, /lab/greeting,
 * /lab/hello): a titled group of slider rows over a tuning store, the
 * button style, and the Copy-values button. A bench puts BENCH_CSS in
 * its own stylesheet and may override the row classes there — the hello
 * bench's floating panel sets them narrower. The pieces' own dark panels
 * (cartel, road signs) are their own.
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

export const mono =
  "var(--font-neue-montreal-mono), ui-monospace, Menlo, monospace";

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
`;

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
