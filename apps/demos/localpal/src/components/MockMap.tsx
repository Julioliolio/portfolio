import { useMemo } from 'react';
import { color } from '../theme/tokens';

/**
 * A procedural, vector "map" that mimics the LocalPal Figma background:
 * warm land, a diagonal street grid, subtle building blocks, a park, and a
 * curving river on the right. Everything is SVG, so pins/streets can be
 * animated, panned, or recolored — unlike the flattened raster in Figma.
 *
 * The whole grid is drawn on an oversized canvas and rotated a few degrees
 * so the streets run on a slight diagonal, matching the design.
 */

type Props = {
  width?: number;
  height?: number;
  /** Diagonal rotation of the street grid, in degrees. */
  angle?: number;
};

export function MockMap({ width = 393, height = 852, angle = -11 }: Props) {
  // Oversize the drawing so rotation never exposes empty corners.
  const pad = Math.round(Math.max(width, height) * 0.6);
  const W = width + pad * 2;
  const H = height + pad * 2;

  const { avenues, streets, blocks } = useMemo(() => {
    // Vertical avenues (thick) + minor streets between them.
    const avenues: number[] = [];
    const streets: number[] = [];
    for (let x = -pad; x < W + pad; x += 92) avenues.push(x);
    for (let x = -pad + 46; x < W + pad; x += 92) streets.push(x);

    // Horizontal cross-streets.
    const rows: number[] = [];
    for (let y = -pad; y < H + pad; y += 116) rows.push(y);

    // Building blocks: soft rectangles tucked inside each grid cell.
    const blocks: Array<{ x: number; y: number; w: number; h: number }> = [];
    let seed = 7;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let xi = 0; xi < avenues.length - 1; xi++) {
      for (let yi = 0; yi < rows.length - 1; yi++) {
        if (rnd() < 0.42) continue; // leave gaps
        const cx = avenues[xi] + 12;
        const cy = rows[yi] + 12;
        blocks.push({
          x: cx,
          y: cy,
          w: 92 - 24 - rnd() * 20,
          h: 116 - 24 - rnd() * 30,
        });
      }
    }
    return { avenues, streets, rows, blocks };
  }, [W, H, pad]);

  const rows = useMemo(() => {
    const r: number[] = [];
    for (let y = -pad; y < H + pad; y += 116) r.push(y);
    return r;
  }, [H, pad]);

  // River: a wavy vertical ribbon down the right third.
  // Left bank ~x=262 in the Figma frame.
  const rx = width * 0.668;
  const river = `
    M ${rx - 10} -20
    C ${rx + 40} ${height * 0.18}, ${rx - 30} ${height * 0.32}, ${rx + 20} ${height * 0.48}
    C ${rx + 55} ${height * 0.62}, ${rx + 5} ${height * 0.78}, ${rx + 45} ${height + 20}
    L ${width + 120} ${height + 20}
    L ${width + 120} -20 Z
  `;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block' }}
      aria-hidden
    >
      {/* Land */}
      <rect x={0} y={0} width={width} height={height} fill={color.mapLand} />

      {/* Rotated street world */}
      <g transform={`translate(${-pad} ${-pad}) rotate(${angle} ${W / 2} ${H / 2})`}>
        {/* Building blocks */}
        {blocks.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={6}
            fill="#E4DFD5"
          />
        ))}

        {/* Minor streets */}
        {streets.map((x, i) => (
          <line
            key={`s${i}`}
            x1={x}
            y1={-pad}
            x2={x}
            y2={H + pad}
            stroke={color.mapRoad}
            strokeWidth={5}
          />
        ))}
        {/* Avenues */}
        {avenues.map((x, i) => (
          <line
            key={`a${i}`}
            x1={x}
            y1={-pad}
            x2={x}
            y2={H + pad}
            stroke={color.mapRoad}
            strokeWidth={11}
          />
        ))}
        {/* Cross-streets */}
        {rows.map((y, i) => (
          <line
            key={`r${i}`}
            x1={-pad}
            y1={y}
            x2={W + pad}
            y2={y}
            stroke={color.mapRoad}
            strokeWidth={i % 2 === 0 ? 11 : 5}
          />
        ))}
      </g>

      {/* Park — exact rect from the Figma frame (node 1277:3515) */}
      <rect
        x={67.65}
        y={392.77}
        width={121.68}
        height={84.65}
        rx={14}
        fill={color.mapPark}
      />

      {/* River on top */}
      <path d={river} fill={color.mapWater} />
    </svg>
  );
}
