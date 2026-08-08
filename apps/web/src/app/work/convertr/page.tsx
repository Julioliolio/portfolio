import { DemoShell } from "@/components/demo/DemoShell";

export default function ConvertrWorkPage() {
  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Convertr</h1>
      <DemoShell demo="convertr" title="Convertr" variant="desktop" autoload />
    </main>
  );
}
