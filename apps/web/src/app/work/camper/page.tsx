import type { Metadata } from "next";

export const metadata: Metadata = { title: "Camper" };

/** Placeholder until the Camper case study is ported — the road-sign stack
 *  links here so every sign has a destination. */
export default function CamperWorkPage() {
  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Camper</h1>
      <p>Case study coming soon.</p>
    </main>
  );
}
