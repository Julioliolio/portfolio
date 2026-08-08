"use client";

import { isDemoReady } from "@portfolio/demo-protocol";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DeviceFrame, type DeviceVariant } from "./DeviceFrame";

type ShellState = "idle" | "loading" | "ready";

/**
 * Embeds a demo app (static build served same-origin at /demos/<demo>/) in a
 * lazily-loaded iframe.
 *
 * - idle: poster/skeleton; loading starts on click, or automatically when the
 *   shell nears the viewport if `autoload` is set.
 * - loading: iframe mounts hidden underneath; we wait for the demo's
 *   DEMO_READY postMessage (with a timeout fallback for demos that don't
 *   emit it).
 * - ready: iframe revealed.
 *
 * NOTE: src must point at the explicit index.html — Next's public/ serving
 * does not resolve directory indexes consistently across dev/start/Vercel.
 */
export function DemoShell({
  demo,
  title,
  variant,
  autoload = false,
  poster,
}: {
  demo: string;
  title: string;
  variant: DeviceVariant;
  autoload?: boolean;
  poster?: ReactNode;
}) {
  const [state, setState] = useState<ShellState>("idle");
  const rootRef = useRef<HTMLDivElement>(null);

  // Autoload when the shell approaches the viewport.
  useEffect(() => {
    if (!autoload || state !== "idle") return;
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setState("loading");
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [autoload, state]);

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
            {poster ?? (
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
            )}
          </div>
        )}
        {state !== "idle" && (
          <iframe
            src={`/demos/${demo}/index.html`}
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
