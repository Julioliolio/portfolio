/**
 * A peer pin on the map that grows to its focused tile and idles with the same
 * gentle hover-bob as the selected venue lozenge (see MorphVenuePin) — a
 * ground-point shadow breathing against it. Only the map renders this; the
 * search-list rows render PeerPin directly (no bob there). Grow + bob feel come
 * from the `morph` and `float` registry roles, never inline springs.
 */
import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { PeerPin } from "./PeerPin";
import { PointShadowDot } from "./PointShadowDot";
import { usePointShadow } from "./FloatShadowProvider";
import { useMotion } from "./MotionProvider";

const BOB = 3.5; // px bob amplitude (peak-to-peak = 7), matching the venue lozenge

export function MapPeerPin({
  size,
  focusSize,
  selected,
  badge,
  stroke,
  strokeWidth,
}: {
  size: number;
  /** Grown tile size when this pin is focused under its open card. */
  focusSize: number;
  selected: boolean;
  badge?: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  const morph = useMotion("morph");
  const float = useMotion("float");
  const ps = usePointShadow();

  // Idle float — runs only while selected; a continuous sine wave (the `float`
  // role is a reversed ease-in-out tween), same construction as MorphVenuePin.
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

  // Shadow breathes against the bob: higher float, wider (softer) contact.
  const shadowScaleX = useTransform(bob, [-BOB, BOB], [0.94, 1.04]);

  return (
    <>
      {/* Inner element so the focus-grow morphs on its own clock, not the
          staggered entrance's; bobs as a whole while selected. */}
      <motion.div
        // Positioned + above the shadow wrapper so the ground dot always paints
        // BEHIND the tile — otherwise the absolute shadow (later in DOM) sits in
        // front of the non-positioned pin, most visibly at the top of the bob.
        style={{ y: bob, position: "relative", zIndex: 1 }}
        animate={{ scale: selected ? focusSize / size : 1 }}
        transition={morph}
      >
        <PeerPin
          size={size}
          badge={badge}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </motion.div>
      {/* Ground-point dot under the focused (grown) tile — the tile scales from
          center, so its bottom edge lands at (size + focusSize)/2 in this
          size-tall box. Fades in with the focus, breathes with the bob. */}
      <motion.div
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        initial={false}
        animate={{ opacity: selected ? 1 : 0 }}
        transition={morph}
      >
        <PointShadowDot
          top={(size + focusSize) / 2 + ps.offset}
          scaleX={shadowScaleX}
        />
      </motion.div>
    </>
  );
}
