import { registry } from "@portfolio/lab/registry";
import { notFound } from "next/navigation";
import { LabBackdrop } from "@/components/lab/LabBackdrop";
import { LabStage } from "@/components/lab/LabStage";

export function generateStaticParams() {
  return registry.map((piece) => ({ slug: piece.slug }));
}

export const dynamicParams = false;

export default async function LabPiecePage({
  params,
}: PageProps<"/lab/[slug]">) {
  const { slug } = await params;
  const piece = registry.find((entry) => entry.slug === slug);
  if (!piece) notFound();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-2xl content-center justify-items-center gap-6 p-8">
      {/* The wall is the mat (root layout); the title reads white on it.
          A piece that paints its own wall covers this. */}
      <style>{`body { color: #fff; }`}</style>
      <h1 className="text-xl font-semibold">{piece.title}</h1>
      <LabStage slug={slug} />
      <LabBackdrop pageKey={slug} />
    </main>
  );
}
