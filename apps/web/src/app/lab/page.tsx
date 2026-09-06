import { registry } from "@portfolio/lab/registry";
import Link from "next/link";

export default function LabIndexPage() {
  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Lab</h1>
      <ul className="grid gap-4">
        {registry.map((piece) => (
          <li key={piece.slug}>
            <Link className="underline" href={`/lab/${piece.slug}`}>
              {piece.title}
            </Link>
            {piece.description && <p>{piece.description}</p>}
          </li>
        ))}
        {/* Layout trials live outside the registry — they're page-level
            arrangements of a piece, not pieces themselves. */}
        <li>
          <Link className="underline" href="/lab/cartel-trial">
            Cartel — trial
          </Link>
          <p>The sign alone on a white wall, with its cast shadow.</p>
        </li>
        <li>
          <Link className="underline" href="/lab/card-trial">
            Project card — trial
          </Link>
          <p>Five directions for the card the road-sign rope leads to.</p>
        </li>
        <li>
          <Link className="underline" href="/lab/stop-motion-trial">
            Stop motion — trial
          </Link>
          <p>
            Hard-cut entrances, and every piece switchable between its current
            beat and the sparse one.
          </p>
        </li>
      </ul>
    </main>
  );
}
