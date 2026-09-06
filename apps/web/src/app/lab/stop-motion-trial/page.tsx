import type { Metadata } from "next";
import { StopMotionTrial } from "@/components/lab/StopMotionTrial";
import { LabBackdrop } from "@/components/lab/LabBackdrop";

export const metadata: Metadata = { title: "Stop motion — trial" };

/**
 * The stop-motion trial: the hard-cut entrances (components/motion/Enter)
 * on a board up top, then every lab piece switchable between the beat it
 * ships with and the sparse one — 3 to 4 cuts at about 10 a second, the
 * punch of arjunr.dev's appear animations. Nothing here changes a piece's
 * defaults; the toggles pass overrides in.
 */
export default function StopMotionTrialPage() {
  return (
    <main className="mx-auto w-full max-w-6xl p-8">
      {/* The white studio wall, for the pieces that need it. */}
      <style>{`body { background: #fff; color: #171717; }`}</style>
      <StopMotionTrial />
      <LabBackdrop pageKey="stop-motion-trial" />
    </main>
  );
}
