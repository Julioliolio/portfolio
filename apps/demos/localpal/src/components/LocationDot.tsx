import { motion } from 'framer-motion';
import { useMotion } from './MotionProvider';
import { color } from '../theme/tokens';

/**
 * The user's "blue dot" location marker — a calm halo that pulses once each
 * time `pulseTick` bumps (the pulse element remounts via `key` to replay).
 * Rest = scale 1 / opacity 0.4; the burst times off the `float` idle role so
 * it stays on one motion feel. Lives in its own component so the map marker
 * (MapHome) and the capture stage (?capture=locate) share one construction.
 */
export function LocationDot({ pulseTick }: { pulseTick: number }) {
  const float = useMotion('float');
  return (
    <div style={{ position: 'relative', width: 68, height: 68 }}>
      <motion.div
        key={pulseTick}
        style={{
          position: 'absolute',
          // A smaller halo (40px) centered on the dot, not the full 68px box.
          left: '50%',
          top: '50%',
          width: 40,
          height: 40,
          marginLeft: -20,
          marginTop: -20,
          borderRadius: '50%',
          background: color.locationHalo,
        }}
        initial={{ scale: 1, opacity: 0.4 }}
        animate={
          pulseTick === 0
            ? { scale: 1, opacity: 0.4 }
            : { scale: [1, 1.4, 1], opacity: [0.4, 0.12, 0.4] }
        }
        transition={pulseTick === 0 ? undefined : { duration: float.duration! * 2.5, ease: float.ease }}
      />
      <div
        style={{
          position: 'absolute',
          left: 34 - 9,
          top: 34 - 9,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: color.locationDot,
          border: '3px solid #fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        }}
      />
    </div>
  );
}
