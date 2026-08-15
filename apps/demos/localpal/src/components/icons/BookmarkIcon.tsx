/**
 * Bookmark / save glyph for the venue sheet header (Figma 1348:947 → node
 * 1394:3954 outline, 1394:4281 filled). Inline SVG per CLAUDE.md (no baked
 * raster): crisp at any size, takes any color.
 *
 * Both states share the exact same outer silhouette (the ring path exported
 * from Figma) so toggling `filled` never shifts layout — `filled` just paints
 * the interior notch-rect on top, matching the two design variants precisely.
 */
export function BookmarkIcon({
  size = 18,
  color = "#FEFEFE",
  filled = false,
}: {
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  return (
    <svg
      width={size}
      height={(size * 22) / 18}
      viewBox="0 0 18 22"
      fill="none"
      aria-hidden
      style={{ display: "block" }}
    >
      {/* Outline ring — the bookmark border with the hollow interior. */}
      <path
        d="M17.9989 2.2011V0H0V2.2033V21.9989H2.24944L8.99888 14.3022H9.0045L15.7494 21.9989V22.0011H17.9989V2.2022H17.9978L17.9989 2.2011ZM10.1242 12.1H7.87472L2.25056 18.5933V2.2033H15.7506V18.5933L10.1242 12.0989V12.1Z"
        fill={color}
      />
      {/* Interior — fills the hollow when saved. */}
      {filled && (
        <path
          d="M2.25056 2.2033H15.7506V18.5933L9 12.1L2.25056 18.5933V2.2033Z"
          fill={color}
        />
      )}
    </svg>
  );
}
