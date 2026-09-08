"use client";

import { loaders } from "@portfolio/lab/loaders";
import { Suspense, lazy } from "react";

// Loaded through the lab loaders like LabStage — pieces are never imported
// directly.
const Cartel = lazy(loaders.cartel);

/** A smaller, centered Cartel for layout trials. */
export function CartelTrialStage() {
  return (
    <Suspense fallback={<p className="animate-pulse">Loading piece…</p>}>
      <Cartel height="min(45vh, 380px)" controls={false} />
    </Suspense>
  );
}
