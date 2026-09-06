import type { Metadata } from "next";
import localFont from "next/font/local";
import { MotionProvider } from "@/lib/motion";
import { ClayCursor } from "@/components/cursor/ClayCursor";
import { MotionStyles } from "@portfolio/lab/motion";
import "./globals.css";

// PP Neue Montreal (Pangram Pangram, licensed) is the site's typeface, with
// its Mono cut for code and labels. Static cuts as woff2 — see
// src/fonts/README.md for where they come from and how to regenerate.
const neueMontreal = localFont({
  src: [
    {
      path: "../fonts/PPNeueMontreal-Regular.woff2",
      weight: "400",
      style: "normal",
    },
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
      path: "../fonts/PPNeueMontreal-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/PPNeueMontreal-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-neue-montreal",
  display: "swap",
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
});

export const metadata: Metadata = {
  title: "Julio Romero — Portfolio",
  description: "Design engineering portfolio",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${neueMontreal.variable} ${neueMontrealMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <MotionProvider>{children}</MotionProvider>
        {/* The stop-motion stylesheet, generated from the motion tuning
            (packages/lab/src/motion.tsx); /lab/motion is its bench. */}
        <MotionStyles />
        <ClayCursor />
      </body>
    </html>
  );
}
