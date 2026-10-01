"use client";

import { isDemoReady, setDemoVisibility } from "@portfolio/demo-protocol";
import { asset } from "@portfolio/lab/asset";
import { useEffect, useRef, useState } from "react";
import { DeviceFrame, type DeviceVariant } from "./DeviceFrame";

type ShellState = "idle" | "loading" | "ready";

/** ms the page must be still, near the shell, before a demo autoloads. */
const AUTOLOAD_REST = 300;

/**
 * Embeds a demo app (static build served same-origin at /demos/<demo>/) in a
 * lazily-loaded iframe.
 *
 * - idle: the title and a play button; loading starts on click, or
 *   automatically when the shell nears the viewport if `autoload` is set.
 * - loading: iframe mounts hidden underneath; we wait for the demo's
 *   DEMO_READY postMessage (with a timeout fallback for demos that don't
 *   emit it).
 * - ready: iframe revealed.
 *
 * Out of sight, the demo is told so (setDemoVisibility) and holds what it
 * plays: a same-origin demo runs on this page's main thread, so a video
 * and a canvas drawing it every frame are paid for by the page scrolling
 * past them (2026-10-01).
 *
 * `root` is the scroller the shell sits in (the project window's), for
 * both watches: an observer's margin reaches only past its own root, so
 * one on the viewport sees nothing early inside a scroller that clips.
 *
 * src points at the explicit index.html rather than the directory, so the
 * iframe URL resolves the same under `next dev` and the static export.
 */
export function DemoShell({
  demo,
  title,
  variant,
  autoload = false,
  query = "",
  root = null,
}: {
  demo: string;
  title: string;
  variant: DeviceVariant;
  autoload?: boolean;
  /** Optional query string passed to the demo, e.g. "?embed". */
  query?: string;
  root?: HTMLElement | null;
}) {
  const [state, setState] = useState<ShellState>("idle");
  const rootRef = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  // Autoload when the shell approaches the viewport and the page has come
  // to rest: the demo starts up on this page's main thread (LocalPal's, a
  // React app and a map, ~250 ms on a laptop, 2026-10-01), which would
  // stall a scroll on its way past.
  useEffect(() => {
    if (!autoload || state !== "idle") return;
    const node = rootRef.current;
    if (!node) return;
    const scroller: HTMLElement | Window = root ?? window;
    let near = false;
    let rest = 0;
    const settle = () => {
      window.clearTimeout(rest);
      rest = window.setTimeout(() => {
        if (near) setState("loading");
      }, AUTOLOAD_REST);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        near = entries.some((entry) => entry.isIntersecting);
        if (near) settle();
      },
      { root, rootMargin: "200px" },
    );
    observer.observe(node);
    scroller.addEventListener("scroll", settle, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", settle);
      window.clearTimeout(rest);
    };
  }, [autoload, state, root]);

  // Tell the demo whether it can be seen — again once it is ready, in
  // case it wasn't listening yet when it loaded.
  useEffect(() => {
    const node = rootRef.current;
    if (state === "idle" || !node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const seen = entries.some((entry) => entry.isIntersecting);
        if (frame.current) setDemoVisibility(frame.current, seen);
      },
      { root },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [state, root]);

  // Wait for the demo's ready handshake once loading.
  useEffect(() => {
    if (state !== "loading") return;

    function onMessage(event: MessageEvent) {
      if (isDemoReady(event, demo)) {
        setState("ready");
      }
    }
    window.addEventListener("message", onMessage);

    // Fallback for demos that never announce readiness.
    const timeout = window.setTimeout(() => setState("ready"), 4000);

    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timeout);
    };
  }, [state, demo]);

  return (
    <div ref={rootRef} data-demo-shell={demo}>
      <DeviceFrame variant={variant}>
        {state !== "ready" && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p>{title}</p>
              {state === "idle" ? (
                <button
                  type="button"
                  onClick={() => setState("loading")}
                  className="mt-2 cursor-pointer rounded border px-4 py-2"
                >
                  Press play to try
                </button>
              ) : (
                <p className="mt-2 animate-pulse">Loading…</p>
              )}
            </div>
          </div>
        )}
        {state !== "idle" && (
          <iframe
            ref={frame}
            src={asset(`/demos/${demo}/index.html${query}`)}
            title={title}
            loading="lazy"
            className="absolute inset-0 size-full border-0"
            style={{ visibility: state === "ready" ? "visible" : "hidden" }}
          />
        )}
      </DeviceFrame>
    </div>
  );
}
