/**
 * Small monochrome line-glyphs used by the search-by-text sheet (filter chips
 * + event-card leading icons). Kept as inline SVG — not baked Figma PNGs — so
 * they stay crisp at any size (see CLAUDE.md "No baked Figma raster for UI
 * chrome"). One flat stroke colour, driven by the caller.
 */

export type GlyphKey = 'cocktail' | 'music' | 'climb' | 'fork' | 'coffee' | 'search';

export function Glyph({
  name,
  size = 16,
  color = '#a59fff',
  strokeWidth = 1.8,
  style,
}: {
  name: GlyphKey;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style,
    'aria-hidden': true,
  };

  switch (name) {
    case 'cocktail':
      return (
        <svg {...common}>
          <path d="M4 5h16l-8 8-8-8Z" />
          <path d="M12 13v6" />
          <path d="M8 21h8" />
          <circle cx="16.5" cy="7" r="0.6" fill={color} stroke="none" />
        </svg>
      );
    case 'music':
      return (
        <svg {...common}>
          <path d="M9 18V5l11-2v11" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="17.5" cy="16" r="2.5" />
        </svg>
      );
    case 'climb':
      // simple active figure (running / bouldering)
      return (
        <svg {...common}>
          <circle cx="14" cy="5.5" r="2" />
          <path d="M13 9l-3 3 2 2 1 5" />
          <path d="M12 12l4 1 3-2" />
          <path d="M10 12l-3 1-1 4" />
        </svg>
      );
    case 'fork':
      return (
        <svg {...common}>
          <path d="M7 3v6a2 2 0 0 0 4 0V3" />
          <path d="M9 9v12" />
          <path d="M16 3c-1.5 0-2.5 1.8-2.5 4.5S14.5 12 16 12v9" />
        </svg>
      );
    case 'coffee':
      return (
        <svg {...common}>
          <path d="M4 9h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
          <path d="M17 10h2a2.5 2.5 0 0 1 0 5h-2" />
          <path d="M8 3v2M11 3v2" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5L20 20" />
        </svg>
      );
  }
}

// (The old gradient PlaceholderAvatar lived here — replaced by
// icons/IconPlaceholder, the icon-template guides that mark missing glyphs.)
