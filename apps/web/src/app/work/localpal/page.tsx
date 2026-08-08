import { DemoShell } from "@/components/demo/DemoShell";

export default function LocalpalWorkPage() {
  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">LocalPal</h1>
      <DemoShell
        demo="localpal"
        title="LocalPal"
        variant="phone"
        autoload
        query="?embed"
      />
    </main>
  );
}
