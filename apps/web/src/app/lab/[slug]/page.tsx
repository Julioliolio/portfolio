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

  const white = piece.background === "white";

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-2xl content-center justify-items-center gap-6 p-8">
      {/* Pieces that ask for the white studio wall get it at the body level
          (color too, so headings inherit something readable), overriding
          the site theme so dark can't show on overscroll. */}
      {white && <style>{`body { background: #fff; color: #171717; }`}</style>}
      <h1 className="text-xl font-semibold">{piece.title}</h1>
      <LabStage slug={slug} />
      <LabBackdrop pageKey={slug} />
    </main>
  );
}
