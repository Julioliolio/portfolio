import type { Metadata } from "next";
import { CartelTrialStage } from "@/components/lab/CartelTrialStage";
import { LabBackdrop } from "@/components/lab/LabBackdrop";

export const metadata: Metadata = { title: "Cartel — trial" };

/** Layout trial: the sign alone, centered and smaller than on its lab page. */
export default function CartelTrialPage() {
  return (
    <main className="grid min-h-screen w-full content-center justify-items-center p-8">
      {/* The white studio wall, at the body level regardless of the site
          theme so dark can't show on overscroll or first paint. */}
      <style>{`body { background: #fff; }`}</style>
      <CartelTrialStage />
      <LabBackdrop pageKey="cartel-trial" />
    </main>
  );
}
