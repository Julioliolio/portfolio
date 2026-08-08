import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-2xl content-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">portfolio — foundation</h1>
      <p>No UI yet. Proof pages:</p>
      <ul className="list-disc pl-6">
        <li>
          <Link className="underline" href="/work/sample">
            /work/sample
          </Link>{" "}
          — embedded demo pipeline
        </li>
        <li>
          <Link className="underline" href="/lab">
            /lab
          </Link>{" "}
          — microinteraction playground
        </li>
      </ul>
    </main>
  );
}
