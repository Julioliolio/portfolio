"use client";

/**
 * Animation convention: import `m` from this module — never `motion` from
 * "motion/react". With LazyMotion in `strict` mode the full ~34KB motion
 * runtime stays out of the bundle; only the ~5KB `domAnimation` feature set
 * ships, loaded once from the root layout.
 */
import { LazyMotion, domAnimation } from "motion/react";
import type { ReactNode } from "react";

export { m, AnimatePresence } from "motion/react";

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
