"use client";

import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { spring, springEasing } from "./spring";
import { BLUE } from "./style";

/**
 * A spring to look at and to pull: the curve of one of the site's
 * springs (see spring.ts) — where it is against time, the mark it
 * settles on, the ms it takes — drawn small enough for a bench panel.
 * Drag on it: across for the period (the swing's length), up for the
 * bounce (how far past the mark it goes). Play runs a dot along the
 * bar below it on the very easing the site uses (linear()), so what
 * the graph says can be felt.
 */

const W = 280;
const H = 96;
const PAD = { l: 6, r: 6, t: 10, b: 6 };
/** The graph shows this much room above the mark, in units of the
 *  move: a bounce of 0.8 overshoots by about a third. */
const HEADROOM = 0.5;

const PERIOD = { min: 150, max: 1400 };
const BOUNCE = { min: 0, max: 0.8 };
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

export function SpringGraph({
  label,
  period,
  bounce,
  onChange,
  accent = BLUE,
}: {
  label: string;
  period: number;
  bounce: number;
  onChange: (next: { period: number; bounce: number }) => void;
  /** The curve's colour; the rest is the panel's own ink. */
  accent?: string;
}) {
  const { at, settle } = spring(period, bounce);
  const { easing } = springEasing(period, bounce);
  const x = (ms: number) => PAD.l + (ms / settle) * (W - PAD.l - PAD.r);
  const y = (v: number) =>
    PAD.t + (1 + HEADROOM - v) * ((H - PAD.t - PAD.b) / (1 + HEADROOM));
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const ms = (settle * i) / 120;
    pts.push(`${x(ms).toFixed(1)},${y(at(ms)).toFixed(1)}`);
  }
  // The furthest past the mark, and when.
  let peak = 1;
  let peakAt = settle;
  for (let ms = 0; ms <= settle; ms += 4) {
    const v = at(ms);
    if (v > peak) {
      peak = v;
      peakAt = ms;
    }
  }

  // The drag: the values as they were when it started, and the pointer.
  function onDown(ev: ReactPointerEvent<SVGSVGElement>) {
    if (ev.button !== 0) return;
    ev.preventDefault();
    const start = { x: ev.clientX, y: ev.clientY, period, bounce };
    const move = (m: PointerEvent) => {
      const dx = m.clientX - start.x;
      const dy = m.clientY - start.y;
      onChange({
        period:
          Math.round(
            clamp(start.period + dx * 4, PERIOD.min, PERIOD.max) / 10,
          ) * 10,
        bounce:
          Math.round(
            clamp(start.bounce - dy * 0.005, BOUNCE.min, BOUNCE.max) * 50,
          ) / 50,
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  // Play: the dot goes to the other end on the spring's own easing.
  const [end, setEnd] = useState(false);

  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 8,
          fontSize: 12,
        }}
      >
        <span>{label}</span>
        <span
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 11,
            opacity: 0.75,
          }}
        >
          {period}ms · {bounce} · settles {settle}ms
          {peak > 1.005 ? ` · +${Math.round((peak - 1) * 100)}%` : ""}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{
          display: "block",
          height: "auto",
          borderRadius: 8,
          background: "rgba(128, 128, 128, .08)",
          border: "1px solid rgba(128, 128, 128, .3)",
          cursor: "move",
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerDown={onDown}
        aria-label={`${label}: drag across for the period, up for the bounce`}
      >
        {/* The mark, the floor, the peak. */}
        <line
          x1={PAD.l}
          x2={W - PAD.r}
          y1={y(1)}
          y2={y(1)}
          stroke="currentColor"
          strokeOpacity={0.45}
          strokeDasharray="3 3"
        />
        <line
          x1={PAD.l}
          x2={W - PAD.r}
          y1={y(0)}
          y2={y(0)}
          stroke="currentColor"
          strokeOpacity={0.2}
        />
        {peak > 1.005 && (
          <line
            x1={x(peakAt)}
            x2={x(peakAt)}
            y1={y(1)}
            y2={y(peak)}
            stroke={accent}
            strokeOpacity={0.5}
          />
        )}
        {/* One period, ticked, so the swing can be read. */}
        {period < settle && (
          <line
            x1={x(period)}
            x2={x(period)}
            y1={y(0) - 4}
            y2={y(0) + 4}
            stroke="currentColor"
            strokeOpacity={0.5}
          />
        )}
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke={accent}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {/* The bar: the dot runs on the site's easing when played. */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={() => setEnd((e) => !e)}
          style={{
            font: "inherit",
            fontSize: 11,
            color: "inherit",
            background: "rgba(128, 128, 128, .12)",
            border: "1px solid rgba(128, 128, 128, .35)",
            borderRadius: 6,
            padding: "2px 8px",
            cursor: "pointer",
          }}
        >
          Play
        </button>
        <div
          style={{
            position: "relative",
            flex: 1,
            height: 14,
            borderRadius: 7,
            background: "rgba(128, 128, 128, .12)",
            containerType: "inline-size",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 2,
              left: 2,
              width: 10,
              height: 10,
              borderRadius: 5,
              background: accent,
              // To the bar's far end (its width less the dot's own).
              translate: end ? "calc(100cqw - 14px) 0" : "0 0",
              transition: `translate ${settle}ms ${easing}`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
