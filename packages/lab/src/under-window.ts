/**
 * On <html> while a project window is up over the page (window.tsx,
 * modal): what lies under the sheet holds its ambient motion — the tape's
 * idle, the cartel's bob and turn. Nobody sees it there, and it ran on
 * the main thread on every frame of the sheet's scroll (2026-10-01).
 */
export const UNDER_WINDOW = "pw-open";

/** A project window is up over the page. */
export const underWindow = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains(UNDER_WINDOW);
