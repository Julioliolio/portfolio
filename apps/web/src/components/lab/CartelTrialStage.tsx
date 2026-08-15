"use client";

import { registry } from "@portfolio/lab/registry";
import { Suspense, lazy, type ComponentType } from "react";

// Loaded through the registry's load() like LabStage — pieces are never
// imported directly. The cast adds the height prop Cartel accepts but the
// generic registry type doesn't carry.
const Cartel = lazy(() => {
  const piece = registry.find((entry) => entry.slug === "cartel");
  if (!piece) throw new Error("cartel is not in the lab registry");
  return piece.load() as Promise<{
    default: ComponentType<{ height?: string; controls?: boolean }>;
  }>;
});

/** A smaller, centered Cartel for layout trials. */
export function CartelTrialStage() {
  return (
    <Suspense fallback={<p className="animate-pulse">Loading piece…</p>}>
      <Cartel height="min(45vh, 380px)" controls={false} />
    </Suspense>
  );
}
