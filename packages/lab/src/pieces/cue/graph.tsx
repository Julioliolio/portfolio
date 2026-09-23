"use client";

import { useRef, type PointerEvent } from "react";
import { spring } from "../../spring";

/**
 * A spring's curve for a bench — how far along it is (up) against time
 * (across), the dashed line where it rests, the blue tick where it has
 * settled — with a dot on its peak to drag: up and down is how far past
 * its place it runs (the bounce), across is when it gets there (the
 * swing). The spring is spring.ts's. Shared by the tabs of /lab/cue and
 * by /lab/contents.
 */

const GRAPH_CSS = `
.qb-graph { display: grid; gap: 4px; }
.qb-graph svg { display: block; width: 100%; height: auto; border-radius: 8px; background: rgba(23, 23, 23, .04); cursor: crosshair; touch-action: none; user-select: none; }
.qb-grid { stroke: rgba(23, 23, 23, .08); stroke-width: 1; }
.qb-rest { stroke: rgba(23, 23, 23, .35); stroke-width: 1; stroke-dasharray: 3 3; }
.qb-settle { stroke: #2f6df6; stroke-width: 1.5; }
.qb-curve { fill: none; stroke: #171717; stroke-width: 1.75; stroke-linejoin: round; }
.qb-handle { fill: #2f6df6; stroke: #faf9f6; stroke-width: 2; cursor: grab; }
.qb-tick { font-size: 8px; fill: rgba(23, 23, 23, .45); }
.qb-graph-note { font-size: 11px; opacity: .65; }
`;

/** The graph's box and scales: time across (0 to GRAPH_MS), the room's
 *  opening up (0 shut, 1 open, up to GRAPH_TOP). */
const GW = 292;
const GH = 150;
const PAD = 10;
const GRAPH_MS = 1600;
const GRAPH_TOP = 1.6;
const GRAPH_BOTTOM = -0.08;
const gx = (ms: number) => PAD + (ms / GRAPH_MS) * (GW - 2 * PAD);
const gy = (v: number) =>
  PAD + ((GRAPH_TOP - v) / (GRAPH_TOP - GRAPH_BOTTOM)) * (GH - 2 * PAD);

/** Where the handle sits: on the curve's first peak; with no bounce, at
 *  half the period on the line of rest. */
function peakOf(period: number, bounce: number) {
  const z = 1 - bounce;
  if (bounce < 0.01) return { ms: period / 2, v: 1 };
  const ms = period / (2 * Math.sqrt(1 - z * z));
  return { ms, v: 1 + Math.exp((-z * Math.PI) / Math.sqrt(1 - z * z)) };
}

/**
 * The smooth open's spring, drawn: how open the room is (up) against
 * time (across), the dashed line where it rests, the tick where it has
 * settled. Drag the dot on the peak: up and down is how far past its
 * place it runs (the bounce), across is when it gets there (the swing).
 */
export function SpringGraph({
  period,
  bounce,
  onChange,
}: {
  period: number;
  bounce: number;
  /** Called with the new bounce and period (ms) as the peak is dragged. */
  onChange: (next: { bounce: number; period: number }) => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const { at, settle } = spring(period, bounce);
  const peak = peakOf(period, bounce);
  let d = "";
  for (let ms = 0; ms <= GRAPH_MS; ms += 10)
    d += `${ms ? "L" : "M"}${gx(ms).toFixed(1)} ${gy(at(ms)).toFixed(1)}`;

  function drag(e: PointerEvent<SVGSVGElement>) {
    if (!(e.buttons & 1) || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * GW;
    const y = ((e.clientY - r.top) / r.height) * GH;
    const ms = Math.max(
      30,
      Math.min(GRAPH_MS / 2, ((x - PAD) / (GW - 2 * PAD)) * GRAPH_MS),
    );
    const v =
      GRAPH_TOP - ((y - PAD) / (GH - 2 * PAD)) * (GRAPH_TOP - GRAPH_BOTTOM);
    // How far past 1 the peak is → the damping ratio → the bounce.
    const over = Math.min(0.55, Math.max(0, v - 1));
    let next = 0;
    if (over > 0.002) {
      const l = Math.log(over);
      next = Math.min(0.8, 1 - -l / Math.sqrt(Math.PI ** 2 + l * l));
    }
    // When the peak is → the period.
    const z = 1 - next;
    const p = next < 0.01 ? ms * 2 : ms * 2 * Math.sqrt(1 - z * z);
    onChange({
      bounce: Math.round(next * 100) / 100,
      period: Math.round(Math.min(1200, Math.max(90, p)) / 5) * 5,
    });
  }

  return (
    <div className="qb-graph">
      <style>{GRAPH_CSS}</style>
      <svg
        ref={svg}
        viewBox={`0 0 ${GW} ${GH}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag(e);
        }}
        onPointerMove={drag}
      >
        {[0, 400, 800, 1200, 1600].map((ms) => (
          <g key={ms}>
            <line
              x1={gx(ms)}
              x2={gx(ms)}
              y1={PAD}
              y2={GH - PAD}
              className="qb-grid"
            />
            <text x={gx(ms) + 3} y={GH - PAD - 3} className="qb-tick">
              {ms}
            </text>
          </g>
        ))}
        <line
          x1={PAD}
          x2={GW - PAD}
          y1={gy(0)}
          y2={gy(0)}
          className="qb-grid"
        />
        <line
          x1={PAD}
          x2={GW - PAD}
          y1={gy(1)}
          y2={gy(1)}
          className="qb-rest"
        />
        <line
          x1={gx(settle)}
          x2={gx(settle)}
          y1={gy(1) - 6}
          y2={gy(1) + 6}
          className="qb-settle"
        />
        <path d={d} className="qb-curve" />
        <circle
          cx={gx(Math.min(peak.ms, GRAPH_MS))}
          cy={gy(peak.v)}
          r={6}
          className="qb-handle"
        />
      </svg>
      <div className="qb-graph-note">
        bounce {bounce.toFixed(2)} · swing {period}ms · settles{" "}
        {Math.round(settle)}ms
      </div>
    </div>
  );
}
