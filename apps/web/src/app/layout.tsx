import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClayCursorMount } from "@/components/cursor/ClayCursorMount";
import { asset } from "@portfolio/lab/asset";
import { MotionStyles } from "@portfolio/lab/motion";
import "./globals.css";

// PP Neue Montreal (Pangram Pangram, licensed) is the site's typeface, with
// its Mono cut for code and labels. Static cuts as woff2 — see
// src/fonts/README.md for where they come from and how to regenerate.
//
// next/font preloads every cut in a family on every page, so the family is
// split by how the cuts are used. Regular (body) and SemiBold (headings)
// are the only cuts on the first-load path — every preloaded cut is bytes
// ahead of the largest paint on a throttled connection. Medium, Bold and
// Italic sit in a second family that is not preloaded and is only fetched
// when a page actually sets that weight or style: globals.css maps
// <b>/<strong>/<i>/<em> onto it, and the pieces name it (MEDIUM in
// @portfolio/lab/style). Mono is lab-only and likewise fetched on demand.
const neueMontreal = localFont({
  src: [
    {
      path: "../fonts/PPNeueMontreal-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/PPNeueMontreal-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-neue-montreal",
  display: "swap",
});

const neueMontrealExtra = localFont({
  src: [
    {
      path: "../fonts/PPNeueMontreal-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../fonts/PPNeueMontreal-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/PPNeueMontreal-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-neue-montreal-extra",
  display: "swap",
  preload: false,
});

const neueMontrealMono = localFont({
  src: [
    {
      path: "../fonts/PPNeueMontrealMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/PPNeueMontrealMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-neue-montreal-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Julio Romero — Portfolio",
  description: "Design engineering portfolio",
};

// The wall, on every page: Julio's cutting mat (scripts/prepare-paper.mjs),
// as wide as the viewport and tiling downward with the page. The file
// tiles without a seam, so a page of any height is covered; the mat's
// own green paints first, before the file is in. Three widths, picked by
// viewport width so a big monitor is not upscaling the small one.
const MAT = `
html { background: #48a27b url(${asset("/mat/mat-1600.webp")}) top center / 100% auto repeat-y; }
@media (min-width: 1601px) { html { background-image: url(${asset("/mat/mat-2400.webp")}); } }
@media (min-width: 2401px) { html { background-image: url(${asset("/mat/mat-3200.webp")}); } }
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${neueMontreal.variable} ${neueMontrealExtra.variable} ${neueMontrealMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <style>{MAT}</style>
        {/* Nothing animation-related mounts here on purpose: anything in the
            root layout is on every page's first load. Pieces that need the
            Motion runtime wrap themselves; scripts/check-budget.mjs flags a
            regression. */}
        {children}
        {/* The stop-motion stylesheet, generated from the motion tuning
            (packages/lab/src/motion.tsx); /lab/motion is its bench. */}
        <MotionStyles />
        <ClayCursorMount />
      </body>
    </html>
  );
}
