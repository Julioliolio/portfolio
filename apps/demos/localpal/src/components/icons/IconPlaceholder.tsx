/**
 * Empty "user photo" avatar slot — a flat white squircle (Figma 1355:1464:
 * #FEFEFE fill, single soft ambient shadow, no bevel/tint) with the Apple
 * icon-template guides (crosshair, concentric circles, diagonals, tangent
 * grid) drawn on top in lavender, marking where a real photo will be dropped
 * in. Uses the exact same squircle shape + shadow as the filled state
 * (`avatar` role + `avatarPhotoShadow`), so swapping the guides for an <img>
 * is a true drop-in replacement with no visual shift.
 */
import type { CSSProperties } from "react";
import { Squircle } from "../Squircle";
import { FloatingSquircle } from "../FloatingSquircle";
import { useSquircle } from "../SquircleProvider";
import { color as tokens } from "../../theme/tokens";
import { avatarPhotoShadow } from "../../theme/floatShadow";

export function IconPlaceholder({
  size = 45,
  height,
  color = tokens.lavender,
  photo,
  stroke,
  strokeWidth = 4,
  float = false,
  style,
}: {
  size?: number;
  /** Tile height when the design's tile isn't square (the 40×42 arch tiles
   *  in avatar clusters / host rows). Defaults to `size`. */
  height?: number;
  color?: string;
  /** Profile photo src. When set, the guides are replaced by the photo,
   *  clipped to the same squircle — a true drop-in with no shape/shadow shift. */
  photo?: string;
  /** Outline hugging the squircle (clip keeps the inner half, so a width of
   *  4 reads as the design's 2px inside-stroke). */
  stroke?: string;
  strokeWidth?: number;
  /** Use the fuller floating-squircle treatment (live registry default: soft
   *  ambient + a squashed contact shadow on the floor) instead of the flat
   *  photo shadow. On for the own-user map avatar; off for peer photo tiles. */
  float?: boolean;
  style?: CSSProperties;
}) {
  const avatarSq = useSquircle("avatar");
  const h = height ?? size;
  // Apple icon-grid proportions (Ø 0.69 / 0.43 / 0.14 of the tile).
  const c = size / 2;
  const cy = h / 2;
  const rLg = Math.min(size, h) * 0.345;
  const rMd = Math.min(size, h) * 0.216;
  const rSm = Math.min(size, h) * 0.069;

  return (
    <FloatingSquircle
      width={size}
      height={h}
      radius={avatarSq.radius}
      smoothing={avatarSq.smoothing}
      shadow={float ? undefined : avatarPhotoShadow}
      style={style}
    >
      <Squircle
        role="avatar"
        fill={tokens.offWhite}
        stroke={stroke}
        strokeWidth={strokeWidth}
        style={{ width: size, height: h }}
      >
        {photo ? (
          <img
            src={photo}
            width={size}
            height={h}
            alt=""
            style={{ display: "block", objectFit: "cover" }}
          />
        ) : (
          <svg
            width={size}
            height={h}
            viewBox={`0 0 ${size} ${h}`}
            style={{ position: "absolute", inset: 0 }}
            aria-hidden
          >
            {/* fill="none": SVG circles default to a BLACK fill — the guides are
              strokes only (bare circles read as a dark disc otherwise). */}
            <g stroke={color} strokeWidth={0.8} opacity={0.6} fill="none">
              <circle cx={c} cy={cy} r={rLg} />
              <circle cx={c} cy={cy} r={rMd} />
              <circle cx={c} cy={cy} r={rSm} />
              {/* crosshair */}
              <line x1={c} y1={0} x2={c} y2={h} />
              <line x1={0} y1={cy} x2={size} y2={cy} />
              {/* diagonals */}
              <line x1={0} y1={0} x2={size} y2={h} />
              <line x1={size} y1={0} x2={0} y2={h} />
              {/* tangent grid at the outer-circle edges */}
              <line x1={c - rLg} y1={0} x2={c - rLg} y2={h} />
              <line x1={c + rLg} y1={0} x2={c + rLg} y2={h} />
              <line x1={0} y1={cy - rLg} x2={size} y2={cy - rLg} />
              <line x1={0} y1={cy + rLg} x2={size} y2={cy + rLg} />
            </g>
          </svg>
        )}
      </Squircle>
    </FloatingSquircle>
  );
}
