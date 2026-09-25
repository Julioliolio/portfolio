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
      {/* Scroll-snap lives on the root: the viewport is the scroller, and
          each screen is a snap point. The wall is the mat, from the root
          layout; the words on it are white. */}
      <style>{`
        html { scroll-snap-type: y mandatory; }
        body { color: #fff; }
      `}</style>
      <Landing />
    </main>
  );
}
