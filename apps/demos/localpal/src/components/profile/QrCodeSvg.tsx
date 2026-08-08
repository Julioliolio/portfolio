/**
 * A REAL scannable QR code rendered as crisp SVG (no canvas, no raster):
 * `qrcode` encodes the text into a module matrix and we paint the dark
 * modules as one path in the brand blue — pointing a phone at the screen
 * opens the profile link. Resolution-independent, so it survives any zoom
 * (per the no-baked-raster rule).
 */
import { useMemo } from 'react';
import QRCode from 'qrcode';
import { color } from '../../theme/tokens';

export function QrCodeSvg({
  text,
  fill = color.brand,
  style,
}: {
  text: string;
  fill?: string;
  style?: React.CSSProperties;
}) {
  const { size, path } = useMemo(() => {
    const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const n = qr.modules.size;
    const data = qr.modules.data;
    let d = '';
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (data[y * n + x]) d += `M${x} ${y}h1v1h-1z`;
      }
    }
    return { size: n, path: d };
  }, [text]);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="crispEdges"
      style={{ display: 'block', ...style }}
      aria-label="Profile QR code"
    >
      <path d={path} fill={fill} />
    </svg>
  );
}
