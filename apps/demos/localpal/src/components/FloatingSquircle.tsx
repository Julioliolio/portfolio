import type { CSSProperties, ReactNode } from "react";
import { Squircle } from "./Squircle";
import { useFloatShadow } from "./FloatShadowProvider";
import { type FloatShadow } from "../theme/floatShadow";
import {
  smoothing as defaultSmoothing,
  radius as radiusTokens,
} from "../theme/tokens";

/**
 * The "floating squircle" effect (Figma nodes 1277:3603 / 1320:948):
 *  - a subtle even AMBIENT shadow all around the squircle, and
 *  - a CONTACT shadow that is the squircle's own silhouette, squashed
 *    vertically and blurred, as if it casts its shape onto the floor.
 *
 * Pass `radius`/`smoothing` matching the content so the floor shadow has the
 * same corners. Pass a partial `shadow` to override the tuned defaults — this
 * is what the Lab screen drives live.
 */
export function FloatingSquircle({
  width,
  height,
  radius = radiusTokens.avatar,
  smoothing = defaultSmoothing,
  children,
  shadow,
  style,
}: {
  width: number;
  height: number;
  radius?: number;
  smoothing?: number;
  children: ReactNode;
  shadow?: Partial<FloatShadow>;
  style?: CSSProperties;
}) {
  // Base comes from the live registry (Lab-tunable); an explicit `shadow` prop
  // still overrides per-field (e.g. peer pins' avatarPhotoShadow).
  const s = { ...useFloatShadow(), ...shadow };
  const shadowW = width * s.contactWidthRatio;
  const shadowRadius = radius * s.contactWidthRatio;

  return (
    <div style={{ position: "relative", width, height, ...style }}>
      {/* Contact shadow: the squircle silhouette, squashed onto the floor.
          A square copy is scaled vertically; the squircle (z-index 1) covers
          its top half so only the floor band shows below. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: height + s.contactOffset - shadowW / 2,
          width: shadowW,
          height: shadowW,
          transform: `translateX(-50%) scaleY(${s.contactSquash})`,
          transformOrigin: "center",
          filter: `blur(${s.contactBlur}px)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <Squircle
          radius={shadowRadius}
          smoothing={smoothing}
          fill={`rgba(${s.color},${s.contactOpacity})`}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* Squircle content with a soft, even all-around ambient shadow. */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          filter: `drop-shadow(0 1px 2px rgba(${s.color},${s.ambientNear})) drop-shadow(0 0 2px rgba(${s.color},${s.ambientFar}))`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
