"use client";

import { loaders } from "@portfolio/lab/loaders";
import type { LabPieceModule, LabSlug } from "@portfolio/lab/registry";
import { Suspense, lazy } from "react";

// Created once at module scope so components stay stable across renders.
// lazy() is free until first render — no piece code loads until it's shown.
// The stage renders every piece prop-less, so the loaders' differing prop
// types are widened to the plain module shape here.
const lazyPieces = new Map(
  (Object.keys(loaders) as LabSlug[]).map((slug) => [
    slug,
    lazy(loaders[slug] as () => Promise<LabPieceModule>),
  ]),
);

/** Resolves a lab piece by slug and renders it lazily. */
export function LabStage({ slug }: { slug: string }) {
  const Piece = lazyPieces.get(slug as LabSlug);

  if (!Piece) {
    return <p>Unknown lab piece: {slug}</p>;
  }

  return (
    <Suspense fallback={<p className="animate-pulse">Loading piece…</p>}>
      {/* eslint-disable-next-line react-hooks/static-components -- Piece comes from a module-scope Map; the rule can't see it's stable */}
      <Piece />
    </Suspense>
  );
}
