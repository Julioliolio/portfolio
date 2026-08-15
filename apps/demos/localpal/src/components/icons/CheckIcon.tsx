/**
 * Check glyph — the RSVP confirmation tick (Figma 1384:2769 knob check and the
 * 13px "on their way" badges, 1384:2784). Inline SVG per CLAUDE.md (no baked
 * raster): crisp at any size, takes any color.
 */
export function CheckIcon({
  size = 13,
  color = "#FEFEFE",
  strokeWidth = 2.6,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      style={{ display: "block" }}
    >
      <path
        d="M2.4 7.6 5.5 10.6 11.6 3.6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
