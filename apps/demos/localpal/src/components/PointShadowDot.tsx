/**
 * The tiny ground-point shadow — a small, barely-blurred dark ellipse marking
 * the spot a floating pin sits over. Purely additive next to the diffuse
 * contact pool: where the pool says "something hovers here", the dot pins the
 * exact point to the ground. Config lives in `theme/floatShadow.ts`
 * (`defaultPointShadow`, Lab → Shadows).
 *
 * `top` is the ellipse's CENTER y (pass pin-bottom + offset; motion values
 * welcome so it can track a morphing tile). `opacity` / `scaleX` are optional
 * motion values for fading in with a selection morph and breathing against a
 * hover-bob, like the contact pool does.
 */
import { motion, type MotionValue } from 'framer-motion';
import { usePointShadow } from './FloatShadowProvider';

export function PointShadowDot({
  top,
  opacity,
  scaleX,
}: {
  top: number | MotionValue<number>;
  opacity?: number | MotionValue<number>;
  scaleX?: number | MotionValue<number>;
}) {
  const ps = usePointShadow();
  return (
    <motion.div
      aria-hidden
      style={{
        position: 'absolute',
        left: '50%',
        top,
        x: '-50%',
        y: '-50%',
        width: ps.width,
        height: ps.width * ps.squash,
        scaleX,
        borderRadius: '50%',
        background: `rgba(${ps.color},${ps.opacity})`,
        filter: `blur(${ps.blur}px)`,
        opacity,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
