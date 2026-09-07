"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

// The cursor's code and its frames are only fetched once the page has
// hydrated, and only where a fine pointer exists — touch devices never see
// the cursor and should not pay for it. ssr: false keeps the frame <img>s
// out of the server HTML so nothing about the cursor is on the first-load
// critical path.
const ClayCursor = dynamic(
  () => import("./ClayCursor").then((mod) => mod.ClayCursor),
  { ssr: false },
);

const FINE_POINTER = "(pointer: fine)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(FINE_POINTER);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(FINE_POINTER).matches;
}

function getServerSnapshot() {
  return false;
}

/** Mounts the site-wide clay cursor on fine-pointer devices, after hydration. */
export function ClayCursorMount() {
  const finePointer = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return finePointer ? <ClayCursor /> : null;
}
