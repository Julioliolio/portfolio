import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useMotion } from "../MotionProvider";

/**
 * Search ⇄ cross with the glyph geometry itself interpolated point-by-point on
 * the `snap` spring — the icon physically bends from one shape into the other,
 * overshooting slightly before settling (no cross-fade). Two stroked subpaths:
 * the lens circle unfolds into the "\" stroke, the handle becomes the "/".
 *
 * Stroke-built, so the cross is a rounded ×, not the chunky wedge-star
 * <CrossIcon> — the morph needs point-compatible geometry. Use it only where
 * the glyph visibly transforms; static crosses stay <CrossIcon>.
 */

type Pt = [number, number];

const lerpPt = (a: Pt, b: Pt, t: number): Pt => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

const line = (a: Pt, b: Pt, n: number): Pt[] =>
  Array.from({ length: n }, (_, i) => lerpPt(a, b, i / (n - 1)));

const circle = (cx: number, cy: number, r: number, n: number): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i / (n - 1)) * Math.PI * 2; // full turn, start at top
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });

// 24×24 viewBox. Search: lens + handle. Cross: two diagonal strokes.
// Point counts are high enough that the lens reads as a true circle even
// blown up to capture-stage size (?capture) — at 25 points the facets show.
const N_RING = 61;
const N_LINE = 13;
const SEARCH: Pt[][] = [
  circle(10.5, 10.5, 6.75, N_RING),
  line([15.4, 15.4], [20.5, 20.5], N_LINE),
];
const CROSS: Pt[][] = [
  line([4.5, 4.5], [19.5, 19.5], N_RING),
  line([19.5, 4.5], [4.5, 19.5], N_LINE),
];

function buildD(t: number) {
  return SEARCH.map((sub, s) => {
    const pts = sub.map((p, i) => lerpPt(p, CROSS[s][i], t));
    return `M ${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ")}`;
  }).join(" ");
}

export function MorphSearchCross({
  toCross,
  size = 12,
  color = "#A59FFF",
  strokeWidth = 2.6,
}: {
  toCross: boolean;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const p = useMotionValue(toCross ? 1 : 0);
  const snap = useMotion("snap");
  useEffect(() => {
    const c = animate(p, toCross ? 1 : 0, snap);
    return () => c.stop();
  }, [toCross, p, snap]);
  const d = useTransform(p, buildD);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: "block", overflow: "visible" }}
    >
      <motion.path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
