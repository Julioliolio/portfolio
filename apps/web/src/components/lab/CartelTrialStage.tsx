"use client";

import { loadPiece } from "@portfolio/lab/loaders";
import { Suspense, lazy, type ComponentType } from "react";

// Loaded through the lab loaders like LabStage — pieces are never imported
// directly. The cast adds the height prop Cartel accepts but the generic
// piece module type doesn't carry.
const Cartel = lazy(
  () =>
    loadPiece("cartel") as Promise<{
      default: ComponentType<{ height?: string; controls?: boolean }>;
    }>,
);

/** A smaller, centered Cartel for layout trials. */
export function CartelTrialStage() {
  return (
    <Suspense fallback={<p className="animate-pulse">Loading piece…</p>}>
      <Cartel height="min(45vh, 380px)" controls={false} />
    </Suspense>
  );
}
