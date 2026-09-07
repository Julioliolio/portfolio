"use client";

/**
 * Animation convention: import `m` from this module — never `motion` from
 * "motion/react". With LazyMotion in `strict` mode the full motion runtime
 * stays out of the bundle; only the `domAnimation` feature set is used, and
 * it is fetched as its own chunk (motion-features.ts) when the provider
 * mounts.
 *
 * Mount <MotionProvider> at the closest ancestor of the `m` elements that
 * need it — a page, a section, a lab piece — not in the root layout. Even
 * without features, importing `m`/LazyMotion pulls ~40KB (gzip) of Motion
 * core into whatever chunk holds the provider, and in the root layout that
 * was every page's first load. Today nothing outside the lazy lab pieces
 * uses `m`, so no page carries it. scripts/check-budget.mjs will flag the
 * regression if it comes back.
 */
import { LazyMotion } from "motion/react";
import type { ReactNode } from "react";

export { m, AnimatePresence } from "motion/react";

const loadFeatures = () =>
  import("./motion-features").then((mod) => mod.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
