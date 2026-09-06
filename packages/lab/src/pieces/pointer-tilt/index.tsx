"use client";

import { useEffect, useRef } from "react";
import {
  LazyMotion,
  domAnimation,
  m,
  useAnimationFrame,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

/**
 * Pointer-tracking baseline piece: maps pointer position within the card to a
 * spring-smoothed 3D tilt. The same mapping pattern (pointer position →
 * motion value → transform) drives things like frame-sequence hover
 * components.
 *
 * `stepFps` turns the glide into stop motion: the springs still run every
 * frame, but the tilt that is drawn only catches up on the beat, so the
 * card jumps between held poses (and, since the spring overshoots, lands
 * past its mark and settles back). 0 draws every frame.
 */
export default function PointerTilt({
  stepFps = 0,
}: {
  /** Stop-motion beat, cuts per second. 0 = smooth. */
  stepFps?: number;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  // What is drawn: the springs themselves at stepFps 0, else a sample of
  // them taken on the beat.
  const shownX = useMotionValue(0.5);
  const shownY = useMotionValue(0.5);
  const fpsRef = useRef(stepFps);
  const acc = useRef(0);
  useEffect(() => {
    fpsRef.current = stepFps;
  }, [stepFps]);
  useAnimationFrame((_, delta) => {
    const fps = fpsRef.current;
    if (fps <= 0) {
      acc.current = 0;
      shownX.set(springX.get());
      shownY.set(springY.get());
      return;
    }
    acc.current += delta;
    const hold = 1000 / fps;
    if (acc.current >= hold) {
      acc.current %= hold;
      shownX.set(springX.get());
      shownY.set(springY.get());
    }
  });

  const rotateX = useTransform(shownY, [0, 1], [12, -12]);
  const rotateY = useTransform(shownX, [0, 1], [-12, 12]);

  function onPointerMove(event: React.PointerEvent) {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    x.set((event.clientX - bounds.left) / bounds.width);
    y.set((event.clientY - bounds.top) / bounds.height);
  }

  function onPointerLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <div style={{ perspective: 800 }}>
        <m.div
          ref={ref}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          style={{
            rotateX,
            rotateY,
            width: 280,
            height: 180,
            borderRadius: 16,
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(135deg, #1a1a22, #2d2d3a)",
            color: "#fff",
            userSelect: "none",
            willChange: "transform",
          }}
        >
          pointer tilt
        </m.div>
      </div>
    </LazyMotion>
  );
}
