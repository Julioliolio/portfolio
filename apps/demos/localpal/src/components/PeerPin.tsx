/**
 * Peer pin — the photo tile marking plans proposed by peers, with the activity
 * badge on its top-right corner (vs. VenuePin, the solid-blue venue tile).
 * Used identically on the map and in the search-list rows, just resized.
 * Because both spots render THIS component, tuning its squircle (the `avatar`
 * registry role) or its shadow (`avatarPhotoShadow`) updates every instance.
 *
 * It's the empty guides slot (Figma 1355:1464) with an optional activity badge
 * overlapping the top-right corner. Pass `photo` to drop a real image into the
 * same squircle — the guides are a placeholder for that.
 */
import type { CSSProperties } from "react";
import { IconPlaceholder } from "./icons/IconPlaceholder";

// Badge geometry, measured from the Figma list row at a 45px tile and kept as
// ratios so it scales with any `size` (badge ≈ 20px at left 30.9 / top -6.5).
const BADGE_SIZE = 20 / 45;
const BADGE_LEFT = 30.9 / 45;
const BADGE_TOP = -6.5 / 45;
const BADGE_ROTATE = 6; // deg — the playful tilt from the design

export function PeerPin({
  size = 45,
  height,
  badge,
  photo,
  stroke,
  strokeWidth,
  style,
}: {
  size?: number;
  /** Tile height for the non-square arch tiles (e.g. 40×42); defaults to `size`. */
  height?: number;
  /** Activity glyph src shown in the top-right corner. Omit for no badge. */
  badge?: string;
  /** Profile photo src; the guides placeholder shows when absent. */
  photo?: string;
  /** Outline hugging the squircle (venue-hosted avatars, cluster gaps). */
  stroke?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: height ?? size,
        flexShrink: 0,
        ...style,
      }}
    >
      <IconPlaceholder
        size={size}
        height={height}
        photo={photo}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {badge && (
        <img
          src={badge}
          alt=""
          width={size * BADGE_SIZE}
          height={size * BADGE_SIZE}
          style={{
            position: "absolute",
            left: size * BADGE_LEFT,
            top: size * BADGE_TOP,
            transform: `rotate(${BADGE_ROTATE}deg)`,
            display: "block",
            // FloatingSquircle's content layer sits at z-index 1 (above its own
            // floor shadow) — the badge must beat that explicitly.
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
}
