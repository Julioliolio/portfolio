/**
 * postMessage contract between the portfolio (DemoShell) and embedded demo
 * apps. Demos are served same-origin under /demos/<name>/, so both sides can
 * verify `origin` strictly.
 */

export const DEMO_READY = "portfolio:demo-ready" as const;

export type DemoReadyMessage = {
  type: typeof DEMO_READY;
  demo: string;
};

/** Called by a demo app once it has rendered its first meaningful frame. */
export function announceReady(demo: string): void {
  if (window.parent !== window) {
    window.parent.postMessage(
      { type: DEMO_READY, demo } satisfies DemoReadyMessage,
      window.location.origin,
    );
  }
}

/** Used by DemoShell to filter incoming messages. */
export function isDemoReady(
  event: MessageEvent,
  demo?: string,
): event is MessageEvent<DemoReadyMessage> {
  return (
    event.origin === window.location.origin &&
    typeof event.data === "object" &&
    event.data !== null &&
    (event.data as DemoReadyMessage).type === DEMO_READY &&
    (demo === undefined || (event.data as DemoReadyMessage).demo === demo)
  );
}
