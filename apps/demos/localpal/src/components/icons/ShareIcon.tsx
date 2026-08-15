/**
 * Share-network glyph — three nodes and two links, the right button on the
 * create-plan success card (Figma 1431:5278). Inline SVG per CLAUDE.md.
 */
export function ShareIcon({
  size = 22,
  color = "#3121FF",
  strokeWidth = 1.8,
}: {
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
      aria-hidden
      style={{ display: "block" }}
    >
      <circle cx="6" cy="12" r="2.6" fill={color} stroke="none" />
      <circle cx="17.5" cy="5.5" r="2.6" fill={color} stroke="none" />
      <circle cx="17.5" cy="18.5" r="2.6" fill={color} stroke="none" />
      <path d="M8.3 10.7l6.9-3.9M8.3 13.3l6.9 3.9" />
    </svg>
  );
}
