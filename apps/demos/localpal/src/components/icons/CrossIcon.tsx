/**
 * THE cross/plus glyph for the whole prototype — the chunky 4-wedge star cross
 * from Figma node 1353:1434. Inline SVG (no baked raster, per CLAUDE.md) so it
 * renders crisp at any size: pass `size` + `color`. Set `plus` to rotate it 45°
 * wherever an additive (+) affordance is needed.
 */
import type { CSSProperties } from "react";

export function CrossIcon({
  size = 12,
  color = "#A59FFF",
  plus = false,
  style,
}: {
  size?: number;
  color?: string;
  plus?: boolean;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 23.675 23.675"
      fill="none"
      aria-hidden
      style={{
        display: "block",
        transform: plus ? "rotate(45deg)" : undefined,
        ...style,
      }}
    >
      <path
        d="M3.964 0 11.847 8.231 9.885 9.879 8.232 11.847 0 3.964Z"
        fill={color}
      />
      <path
        d="M23.675 19.71 15.444 11.827 13.796 13.789 11.827 15.442 19.71 23.674Z"
        fill={color}
      />
      <path
        d="M0 19.71 8.231 11.827 9.879 13.789 11.847 15.442 3.964 23.674Z"
        fill={color}
      />
      <path
        d="M19.71 0 11.827 8.231 13.79 9.879 15.443 11.847 23.675 3.964Z"
        fill={color}
      />
      <circle cx="11.847" cy="11.811" r="3.562" fill={color} />
    </svg>
  );
}
