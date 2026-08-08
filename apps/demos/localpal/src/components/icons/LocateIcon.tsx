/**
 * Locate / recenter crosshair — the glyph inside the white round map control
 * that pans the camera back to the user's blue dot. Exact vector from Figma
 * (TFM node 1505:970 / Group 146), rebuilt inline per CLAUDE.md (no baked
 * raster): a rounded-square centre, a superellipse ring, and four N/E/S/W
 * ticks. One flat colour driven by the caller. Replaces the old 22px
 * locate-glyph.png, which pixelated on retina.
 */
export function LocateIcon({ size = 22, color = '#3121FF' }: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 21"
      fill="none"
      aria-hidden
      style={{ display: 'block' }}
    >
      {/* centre — rounded square */}
      <path
        d="M9.08154 9.95923C9.08154 9.187 9.24706 9.02148 10.0193 9.02148H10.9683C11.7406 9.02148 11.9061 9.187 11.9061 9.95923V10.9083C11.9061 11.6805 11.7406 11.846 10.9683 11.846H10.0193C9.24706 11.846 9.08154 11.6805 9.08154 10.9083V9.95923Z"
        fill={color}
      />
      {/* N/E/S/W ticks */}
      <path d="M5.88047 10.5698H0" stroke={color} strokeWidth="2.5" />
      <path d="M21.0133 10.5698H15.1328" stroke={color} strokeWidth="2.5" />
      <path d="M10.4937 20.7511L10.4937 14.8706" stroke={color} strokeWidth="2.5" />
      <path d="M10.4937 5.88047L10.4937 0" stroke={color} strokeWidth="2.5" />
      {/* ring */}
      <path
        d="M10.5281 2.90967C12.559 2.90967 14.4188 3.28383 15.7546 4.32373C17.0291 5.31587 18.0515 7.09408 18.0515 10.4331C18.0515 13.7794 17.0441 15.5565 15.781 16.5454C14.4573 17.5818 12.6006 17.9565 10.5281 17.9565C8.45581 17.9565 6.5998 17.5816 5.27612 16.5454C4.01301 15.5565 3.00464 13.7795 3.00464 10.4331C3.00466 7.09418 4.02707 5.31589 5.30151 4.32373C6.63735 3.28384 8.49717 2.90968 10.5281 2.90967Z"
        stroke={color}
        strokeWidth="2.5"
      />
    </svg>
  );
}
