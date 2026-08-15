/**
 * Venue pin — the solid-blue map tile marking venues / organizations
 * (vs. PeerPin, the photo tile marking plans proposed by peers).
 *
 * Native rebuild of the baked Figma pin PNGs: a registry-driven squircle
 * (`pin` role, tunable in the Lab) with a centralized Figma SVG glyph
 * centered inside — so adding a new venue type is just switching the icon.
 * Flat by design: no shadow (unlike the peer pin's photo shadow).
 */
import type { CSSProperties } from "react";
import { Squircle } from "./Squircle";
import { color } from "../theme/tokens";

// Glyph height as a fraction of the tile (measured from the Figma pin:
// ~20px glyph on a 32px tile).
const ICON_RATIO = 0.55;

export function VenuePin({
  size = 40,
  icon,
  iconRatio = ICON_RATIO,
  style,
}: {
  size?: number;
  /** Glyph src (a figmaIcons SVG) — the only thing that changes per venue type. */
  icon: string;
  /** Override the glyph-to-tile ratio for glyphs with unusual proportions. */
  iconRatio?: number;
  style?: CSSProperties;
}) {
  return (
    <Squircle
      role="pin"
      fill={color.brand}
      style={{
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        ...style,
      }}
    >
      <img
        src={icon}
        alt=""
        style={{ height: size * iconRatio, width: "auto", display: "block" }}
      />
    </Squircle>
  );
}
