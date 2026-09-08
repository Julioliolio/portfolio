"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Per-page background switcher for lab pages: a few studio-wall presets
 * plus a free color picker, docked bottom-right. The choice is applied as
 * inline styles on <body> — overriding both the site theme and the
 * server-rendered default-background <style> tag a piece may ship — and
 * persisted per page in localStorage. "Default" clears the override and
 * falls back to whatever the page renders without it.
 *
 * Text color follows the background's luminance so headings and controls
 * stay readable on any wall.
 *
 * The stored choice is read through useSyncExternalStore: the server and
 * the hydrating render see no override, the stored value lands right
 * after, and `choose` notifies so the swatches follow.
 */

const SWATCHES = ["#ffffff", "#f3efe9", "#b8b2a7", "#565248", "#171717"];

function textFor(bg: string): string {
  const hex = bg.replace("#", "");
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map(
    (i) => parseInt(hex.slice(i, i + 2), 16) / 255,
  );
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5 ? "#171717" : "#ededed";
}

const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function LabBackdrop({ pageKey }: { pageKey: string }) {
  const storageKey = `lab-bg:${pageKey}`;
  // null = no override (page default).
  const bg = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(storageKey),
    () => null,
  );

  useEffect(() => {
    const body = document.body;
    if (bg) {
      body.style.background = bg;
      body.style.color = textFor(bg);
    } else {
      body.style.background = "";
      body.style.color = "";
    }
    return () => {
      body.style.background = "";
      body.style.color = "";
    };
  }, [bg]);

  function choose(next: string | null) {
    if (next) localStorage.setItem(storageKey, next);
    else localStorage.removeItem(storageKey);
    for (const fn of listeners) fn();
  }

  return (
    <div
      // Bottom-center: pieces park tuning panels bottom-right and the site
      // mark sits bottom-left.
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-current/20 bg-current/5 px-3 py-2 backdrop-blur"
      role="group"
      aria-label="Page background"
    >
      <button
        type="button"
        onClick={() => choose(null)}
        aria-label="Default background"
        title="Default"
        className="size-5 rounded-full border border-current/40"
        style={{
          // Diagonal split reads as "auto/theme" without needing a label.
          background: "linear-gradient(135deg, #fff 50%, #171717 50%)",
          outline: bg === null ? "2px solid currentColor" : "none",
          outlineOffset: 2,
        }}
      />
      {SWATCHES.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => choose(color)}
          aria-label={`Background ${color}`}
          title={color}
          className="size-5 rounded-full border border-current/40"
          style={{
            background: color,
            outline: bg === color ? "2px solid currentColor" : "none",
            outlineOffset: 2,
          }}
        />
      ))}
      <input
        type="color"
        // Feeds the picker the current wall so it opens from there rather
        // than from black.
        value={bg ?? "#808080"}
        onChange={(e) => choose(e.target.value)}
        aria-label="Custom background color"
        title="Custom…"
        className="size-6 cursor-pointer rounded-full border border-current/40 bg-transparent"
      />
    </div>
  );
}
