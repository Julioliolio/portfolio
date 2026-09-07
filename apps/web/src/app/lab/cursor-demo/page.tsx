import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cursor — demo" };

/**
 * Recording stage for the clay cursor: a white wall with one button in
 * the middle and nothing else in frame — no heading, no backdrop swatches
 * — so a screen capture shows only the cursor's boil, its lean, and the
 * arrow-to-hand swap over the button.
 *
 * The button is a real <button> so the site cursor treats it as
 * interactive. Its own feedback is kept quiet (a light ink wash on hover,
 * a hard-cut press) so the cursor stays the subject.
 */
export default function CursorDemoPage() {
  return (
    <main className="grid min-h-screen w-full place-items-center">
      {/* The studio wall at the body level so nothing dark shows on
          overscroll or first paint, whatever the site theme. */}
      <style>{`
        body { background: #fff; color: #2b2722; }
        /* Keep the Next dev-tools badge out of the recording (dev only;
           the static export has none). */
        nextjs-portal { display: none; }
        .cursor-demo-button {
          font: 500 18px/1 var(--font-sans), "Helvetica Neue", Arial, sans-serif;
          letter-spacing: -0.01em;
          color: #2b2722;
          background: transparent;
          border: 1.5px solid #2b2722;
          border-radius: 999px;
          padding: 16px 30px;
          transition: background-color 0.12s steps(2, end), transform 0.1s steps(1, end);
        }
        .cursor-demo-button:hover { background: rgba(43, 39, 34, 0.07); }
        .cursor-demo-button:active { background: rgba(43, 39, 34, 0.14); transform: scale(0.97); }
        .cursor-demo-button:focus-visible { outline: 2px solid #2f6df6; outline-offset: 4px; }
        @media (prefers-reduced-motion: reduce) { .cursor-demo-button { transition: none; } }
      `}</style>
      <button type="button" className="cursor-demo-button">
        look at the cursor no the button
      </button>
    </main>
  );
}
