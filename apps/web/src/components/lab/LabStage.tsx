"use client";

import { registry } from "@portfolio/lab/registry";
import { Suspense, lazy } from "react";

// Created once at module scope so components stay stable across renders.
// lazy() is free until first render — no piece code loads until it's shown.
const lazyPieces = new Map(
  registry.map((piece) => [piece.slug, lazy(piece.load)]),
);

/** Resolves a lab piece from the registry and renders it lazily. */
export function LabStage({ slug }: { slug: string }) {
  const Piece = lazyPieces.get(slug);

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
