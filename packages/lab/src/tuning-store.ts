"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * A set of live knobs with a bench behind it: the motion, greeting,
 * hello and sound tunings are all one of these.
 *
 * The store is a mutable object every subscriber reads through `use()`.
 * `set()` lays a patch over it, keeps the result in localStorage under
 * `key`, and tells every subscriber; `reset()` clears both. Stored
 * values are read once, in an effect after hydration, so the server and
 * the first client render agree on the defaults; a stored value is only
 * taken when it has the default's type and, for a number, is finite.
 */
export type TuningStore<T> = {
  get: () => T;
  set: (patch: Partial<T>) => void;
  reset: () => void;
  subscribe: (fn: () => void) => () => void;
  /** Reads the values saved on this browser, once. `useTuning()` does this
   *  itself; call it from a hook that reads the store another way. */
  load: () => void;
  /** The live values, re-rendering the caller on every change. */
  useTuning: () => T;
};

export function createTuningStore<T extends Record<string, number | string>>(
  key: string,
  defaults: Readonly<T>,
): TuningStore<T> {
  let current: T = { ...defaults };
  const listeners = new Set<() => void>();
  let loaded = false;

  function emit() {
    for (const fn of listeners) fn();
  }

  function subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }

  function set(patch: Partial<T>) {
    current = { ...current, ...patch };
    try {
      localStorage.setItem(key, JSON.stringify(current));
    } catch {
      // Storage may be unavailable (private mode, sandboxed frame) — the
      // values still apply for this page.
    }
    emit();
  }

  function reset() {
    current = { ...defaults };
    try {
      localStorage.removeItem(key);
    } catch {
      // see set
    }
    emit();
  }

  function load() {
    if (loaded) return;
    loaded = true;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<T>;
      const next: T = { ...defaults };
      for (const k of Object.keys(defaults) as (keyof T)[]) {
        const v = parsed[k];
        if (typeof v !== typeof defaults[k]) continue;
        if (typeof v === "number" && !Number.isFinite(v)) continue;
        next[k] = v as T[keyof T];
      }
      current = next;
      emit();
    } catch {
      // A bad value in storage is ignored; the defaults stand.
    }
  }

  function useTuning(): T {
    useEffect(load, []);
    return useSyncExternalStore(
      subscribe,
      () => current,
      () => defaults,
    );
  }

  return { get: () => current, set, reset, subscribe, load, useTuning };
}
