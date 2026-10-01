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

export const DEMO_VISIBILITY = "portfolio:demo-visibility" as const;

export type DemoVisibilityMessage = {
  type: typeof DEMO_VISIBILITY;
  visible: boolean;
};

/**
 * Called by DemoShell when its demo scrolls out of sight or back. A
 * same-origin demo runs on the page's own main thread, so what it plays
 * while nobody sees it is paid for by the page around it.
 */
export function setDemoVisibility(
  frame: HTMLIFrameElement,
  visible: boolean,
): void {
  frame.contentWindow?.postMessage(
    { type: DEMO_VISIBILITY, visible } satisfies DemoVisibilityMessage,
    window.location.origin,
  );
}

/** Called by a demo app to hear when it is out of sight or back; returns
 *  the way to stop listening. */
export function onDemoVisibility(
  listen: (visible: boolean) => void,
): () => void {
  const onMessage = (event: MessageEvent) => {
    if (
      event.origin === window.location.origin &&
      event.source === window.parent &&
      typeof event.data === "object" &&
      event.data !== null &&
      (event.data as DemoVisibilityMessage).type === DEMO_VISIBILITY
    )
      listen(Boolean((event.data as DemoVisibilityMessage).visible));
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

/**
 * Called once by a demo app at start: out of sight on the portfolio's
 * page, it holds still the way a browser holds a background tab.
 * Embedded, a demo shares the page's main thread, so whatever it plays
 * is paid for by the page scrolling past it (2026-10-01: Convertr ran
 * four animation-frame loops and a video, unseen, through every frame
 * of the sheet's scroll).
 *
 * - Its videos pause — the ones playing, and any that start while it is
 *   away — and carry on when it is back.
 * - Its animation frames are parked: a callback asked for while it is
 *   away waits, and runs on the first frame back, as after a tab switch.
 * - Its CSS animations pause where they are (LocalPal's idle bobs).
 *
 * Does nothing outside an iframe.
 */
export function holdWhileHidden(): void {
  if (window.parent === window) return;
  let hidden = false;
  const still = document.createElement("style");
  still.textContent =
    "*, *::before, *::after { animation-play-state: paused !important; }";

  const held = new Set<HTMLVideoElement>();
  const hold = (v: HTMLVideoElement) => {
    if (v.paused) return;
    held.add(v);
    v.pause();
  };
  document.addEventListener(
    "play",
    (e) => {
      if (hidden && e.target instanceof HTMLVideoElement) hold(e.target);
    },
    true,
  );

  // Parked frames get ids of their own, below zero, so a cancel can tell
  // them from the browser's.
  const request = window.requestAnimationFrame.bind(window);
  const cancel = window.cancelAnimationFrame.bind(window);
  const parked = new Map<number, FrameRequestCallback>();
  let nextParked = -1;
  window.requestAnimationFrame = (callback) => {
    if (!hidden) return request(callback);
    const id = nextParked--;
    parked.set(id, callback);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    if (!parked.delete(id)) cancel(id);
  };

  onDemoVisibility((visible) => {
    hidden = !visible;
    if (hidden) {
      document.querySelectorAll("video").forEach(hold);
      document.head.append(still);
      return;
    }
    still.remove();
    held.forEach((v) => {
      if (v.isConnected) void v.play().catch(() => {});
    });
    held.clear();
    const waiting = [...parked.values()];
    parked.clear();
    if (waiting.length)
      request((t) => waiting.forEach((callback) => callback(t)));
  });
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
