/**
 * Venue map pin that morphs into the labeled "lozenge" when its venue is
 * selected (Figma 1277:3461): the blue tile grows into an icon + name pill,
 * gains the floating contact shadow, and idles with a gentle hover-bob.
 *
 * Same per-frame squircle technique as the BottomBar morph: geometry is
 * composed from a progress value `e` (pin ⇄ lozenge, `morph` role) and the
 * superellipse clip-path is regenerated every frame, lerping between the
 * `pin` and `lozenge` registry roles.
 *
 * The float is the whole lozenge translating on `y` — a continuous sine wave
 * (the `float` role resolves to a reversed ease-in-out tween, looped forever)
 * while the floor shadow counter-scales: higher float, smaller shadow. Shadow
 * shape/blur comes from the shared floatShadow theme config.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { getSvgPath } from "figma-squircle";
import { Squircle } from "./Squircle";
import { useSquircle } from "./SquircleProvider";
import { useMotion } from "./MotionProvider";
import { useFloatShadow, usePointShadow } from "./FloatShadowProvider";
import { PointShadowDot } from "./PointShadowDot";
import { color, font } from "../theme/tokens";

// Expanded lozenge metrics, transcribed from Figma (126×64 for "Rita's";
// width hugs the measured label so longer names fit).
const EXP = { h: 64, padL: 19, icon: 34, gap: 12, padR: 22 };
const ICON_RATIO = 0.55; // collapsed glyph ratio, same as VenuePin
const BOB = 3.5; // px bob amplitude (peak-to-peak = 7)

// Activity marker — transcribed 1:1 from Figma node 1377:1011 ("Ellipse 44",
// 1277:3538): a filled dot with a blue ring sitting just off the pin's top-right
// corner, no extra outline. Every value is a ratio of the 32.0015-wide Figma pin
// so the badge scales with `size`.
const ACTIVITY = {
  diameter: 9.68173 / 32.0015, // outer Ø ÷ pin width  → 0.3025
  stroke: 2 / 32.0015, //          ring thickness ÷ pin width → 0.0625
  cx: 29.75086 / 32.0015, //       ring centre X ÷ pin width  → 0.9297
  cy: 2.63086 / 31.001, //         ring centre Y ÷ pin height → 0.0849
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function MorphVenuePin({
  icon,
  name,
  size = 40,
  selected,
  hasActivity = false,
}: {
  icon: string;
  name: string;
  size?: number;
  selected: boolean;
  /** Show the top-right ring marking a venue that hosts activities. */
  hasActivity?: boolean;
}) {
  const pin = useSquircle("pin");
  const loz = useSquircle("lozenge");
  const morph = useMotion("morph");
  const float = useMotion("float");

  // The label is always in the DOM (opacity-hidden when collapsed), so we can
  // measure it directly and size the lozenge to hug any venue name. Observed
  // (not read once): the Marker portal isn't attached yet on mount (width 0),
  // and the width changes again when the webfont swaps in.
  const labelRef = useRef<HTMLSpanElement>(null);
  const [labelW, setLabelW] = useState(40);
  useLayoutEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    const update = () => el.offsetWidth > 0 && setLabelW(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [name]);
  const expW = EXP.padL + EXP.icon + EXP.gap + labelW + EXP.padR;

  // e: pin ⇄ lozenge progress.
  const e = useMotionValue(0);
  useEffect(() => {
    const c = animate(e, selected ? 1 : 0, morph);
    return () => c.stop();
  }, [selected, e, morph]);

  const w = useTransform(e, (t) => lerp(size, expW, t));
  const h = useTransform(e, (t) => lerp(size, EXP.h, t));
  const radius = useTransform(e, (t) => lerp(pin.radius, loz.radius, t));
  const smooth = useTransform(e, (t) => lerp(pin.smoothing, loz.smoothing, t));
  const clipPath = useTransform(
    [w, h, radius, smooth],
    ([ww, hh, r, s]) =>
      `path('${getSvgPath({ width: ww as number, height: hh as number, cornerRadius: r as number, cornerSmoothing: s as number })}')`,
  );

  // Glyph: centered in the tile → parked left in the lozenge, with the Figma
  // -4° playful tilt easing in as it grows.
  const iconLeft = useTransform([e, w], ([t, ww]) =>
    lerp((ww as number) / 2, EXP.padL + EXP.icon / 2, t as number),
  );
  const iconTop = useTransform(h, (hh) => hh / 2);
  const iconH = useTransform(e, (t) => lerp(size * ICON_RATIO, EXP.icon, t));
  const iconRotate = useTransform(e, (t) => lerp(0, -4, t));
  const labelOpacity = useTransform(e, [0.55, 1], [0, 1]);
  // Activity ring fades off the moment the tile starts morphing into the lozenge.
  const badgeOpacity = useTransform(e, [0, 0.3], [1, 0]);

  // Idle float — runs only while selected; a continuous sine wave (the `float`
  // role is a reversed ease-in-out tween), the shadow breathing against it.
  const bob = useMotionValue(0);
  useEffect(() => {
    if (!selected) {
      bob.set(0);
      return;
    }
    bob.set(-BOB);
    const c = animate(bob, BOB, {
      ...float,
      repeat: Infinity,
      repeatType: "reverse",
    });
    return () => {
      c.stop();
      bob.set(0);
    };
  }, [selected, bob, float]);

  const fs = useFloatShadow();
  const ps = usePointShadow();
  const shadowW = useTransform(w, (ww) => ww * fs.contactWidthRatio);
  const shadowTop = useTransform(
    [h, shadowW],
    ([hh, sw]) => (hh as number) + fs.contactOffset - (sw as number) / 2,
  );
  const shadowScaleX = useTransform(bob, [-BOB, BOB], [0.94, 1.04]);
  const shadowOpacity = useTransform(e, [0.4, 1], [0, 1]);
  const pointTop = useTransform(h, (hh) => hh + ps.offset);

  return (
    <motion.div style={{ position: "relative", width: w, height: h }}>
      {/* Contact shadow: the lozenge silhouette squashed onto the floor (same
          construction as FloatingSquircle, but motion-driven so it can fade in
          with the morph and counter-scale with the bob). */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: shadowTop,
          width: shadowW,
          height: shadowW,
          x: "-50%",
          scaleY: fs.contactSquash,
          scaleX: shadowScaleX,
          filter: `blur(${fs.contactBlur}px)`,
          opacity: shadowOpacity,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <Squircle
          radius={loz.radius * fs.contactWidthRatio}
          smoothing={loz.smoothing}
          fill={`rgba(${fs.color},${fs.contactOpacity})`}
          style={{ width: "100%", height: "100%" }}
        />
      </motion.div>

      {/* Ground-point dot: pins the exact spot inside the diffuse pool while
          the lozenge floats — fades in with the pool, breathes with the bob. */}
      <PointShadowDot
        top={pointTop}
        opacity={shadowOpacity}
        scaleX={shadowScaleX}
      />

      {/* The morphing tile itself — bobs as a whole while selected. */}
      <motion.div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: w,
          height: h,
          clipPath,
          background: color.brand,
          y: bob,
          zIndex: 1,
        }}
      >
        <motion.div
          style={{
            position: "absolute",
            left: iconLeft,
            top: iconTop,
            x: "-50%",
            y: "-50%",
            rotate: iconRotate,
          }}
        >
          <motion.img
            src={icon}
            alt=""
            style={{ height: iconH, width: "auto", display: "block" }}
          />
        </motion.div>
        <motion.span
          ref={labelRef}
          style={{
            position: "absolute",
            left: EXP.padL + EXP.icon + EXP.gap,
            top: "50%",
            y: "-50%",
            opacity: labelOpacity,
            color: color.onBrand,
            // Markers portal into the maplibre container, outside the app's
            // font cascade — set the family explicitly.
            fontFamily: font.family,
            fontSize: 16,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </motion.span>
      </motion.div>

      {/* Activity marker (Figma 1377:1011): a #FEFEFE dot with a blue ring, off
          the pin's top-right corner. Only venues that host activities get one;
          it rides away as the tile morphs open. */}
      {hasActivity && (
        <motion.div
          aria-hidden
          style={{
            position: "absolute",
            left: size * ACTIVITY.cx,
            top: size * ACTIVITY.cy,
            x: "-50%",
            y: "-50%",
            width: size * ACTIVITY.diameter,
            height: size * ACTIVITY.diameter,
            boxSizing: "border-box",
            borderRadius: "50%",
            background: color.onBrand,
            border: `${size * ACTIVITY.stroke}px solid ${color.brand}`,
            opacity: badgeOpacity,
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      )}
    </motion.div>
  );
}
