/**
 * Person outline — the glyph inside the white tile on the create-plan "last
 * check" card (Figma 1431:5010). Inline SVG per CLAUDE.md (no baked raster),
 * one flat stroke colour driven by the caller.
 */
export function PersonIcon({ size = 18, color = '#3121FF', strokeWidth = 1.8 }: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ display: 'block' }}
    >
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </svg>
  );
}
