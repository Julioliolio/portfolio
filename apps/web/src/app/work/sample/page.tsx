import { DemoShell } from "@/components/demo/DemoShell";

export default function SampleWorkPage() {
  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Sample demo embed</h1>
      <DemoShell demo="sample" title="Sample demo" variant="desktop" autoload />
    </main>
  );
}
