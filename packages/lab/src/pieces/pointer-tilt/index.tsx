"use client";

import { useRef } from "react";
import {
  LazyMotion,
  domAnimation,
  m,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

/**
 * Pointer-tracking baseline piece: maps pointer position within the card to a
 * spring-smoothed 3D tilt. The same mapping pattern (pointer position →
 * motion value → transform) drives things like frame-sequence hover
 * components.
 */
export default function PointerTilt() {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(springY, [0, 1], [12, -12]);
  const rotateY = useTransform(springX, [0, 1], [-12, 12]);

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
