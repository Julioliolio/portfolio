import { Landing } from "@/components/landing/Landing";

/**
 * The home page: the cartel on one screen, the road signs on the next,
 * snapped (see components/landing/Landing). The proof pages the
 * foundation linked from here still exist at their own URLs — /work/*
 * and /lab.
 */
export default function Home() {
  return (
    <main className="w-full">
      {/* The wall — the warm off-white of the mockup, set on the root so
          nothing dark shows on overscroll or first paint regardless of
          the site theme. Scroll-snap lives on the root too: the viewport
          is the scroller, and each screen is a snap point. */}
      <style>{`
        html { background: #faf9f6; scroll-snap-type: y mandatory; }
        body { background: #faf9f6; color: #171717; }
      `}</style>
      <Landing />
    </main>
  );
}
