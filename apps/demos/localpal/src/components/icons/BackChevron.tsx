/**
 * Back chevron — the chunky three-wedge arrow from Figma node 1373:1086 (the
 * small square beside the activity card's main CTA). Extracted from the SVG
 * export (background rects stripped) and inlined per CLAUDE.md — no baked
 * raster, scales crisp, takes any color. Figma renders it at 13.66 × 19.36.
 */
export function BackChevron({
  height = 19.36,
  color = '#3121FF',
}: {
  height?: number;
  color?: string;
}) {
  return (
    <svg
      width={(height * 14) / 20}
      height={height}
      viewBox="0 0 14 20"
      fill="none"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path d="M3.60037 11.587V7.76617L-8.7738e-05 7.76617V11.587L3.60037 11.587Z" fill={color} />
      <path d="M1.90508 8.34262L0.00192928 11.5861L11.7594 19.3555L13.6626 16.112L1.90508 8.34262Z" fill={color} />
      <path d="M13.6614 3.24344L11.7582 -1.05952e-07L0.000713348 7.7694L1.90387 11.0128L13.6614 3.24344Z" fill={color} />
    </svg>
  );
}
