/**
 * App-wide "are you sure?" confirmations. Mount one <ConfirmProvider> inside the
 * phone screen (see PhoneFrame) and any descendant can pop a confirmation with
 * the useConfirm() hook — no per-call state plumbing:
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: 'Join this plan?', confirmLabel: 'Join plan' })) {
 *     // user tapped the affirmative
 *   }
 *
 * The promise resolves true on the affirmative action, false on Cancel / backdrop
 * tap. The single ConfirmSheet it renders lives at the phone-screen level, so it
 * layers over whatever card is open regardless of who triggered it.
 */
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ConfirmSheet, type ConfirmConfig } from "./ConfirmSheet";

/** What a caller passes to confirm() — the prompt, minus the resolution wiring. */
export type ConfirmOptions = Omit<ConfirmConfig, "onConfirm">;

const ConfirmContext = createContext<
  (opts: ConfirmOptions) => Promise<boolean>
>(() => Promise.resolve(false));
/** Whether a confirmation sheet is currently open — so overlays anchored to a
 *  card (e.g. tour coach bubbles) can step aside instead of floating over it. */
const ConfirmOpenContext = createContext(false);

/** Returns `confirm(opts) => Promise<boolean>` (true = confirmed, false = dismissed). */
export function useConfirm() {
  return useContext(ConfirmContext);
}

/** True while an "are you sure?" sheet is on screen. */
export function useConfirmOpen() {
  return useContext(ConfirmOpenContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfirmConfig | null>(null);
  // Resolver of the in-flight confirm() promise; nulled once settled so a later
  // close() can't resolve it twice.
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const settle = useCallback((v: boolean) => {
    resolveRef.current?.(v);
    resolveRef.current = null;
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        // A confirmation already open resolves false before the new one opens.
        settle(false);
        resolveRef.current = resolve;
        setConfig({ ...opts, onConfirm: () => settle(true) });
      }),
    [settle],
  );

  const close = useCallback(() => {
    setConfig(null);
    settle(false); // no-op if the affirmative already settled it to true
  }, [settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      <ConfirmOpenContext.Provider value={config !== null}>
        {children}
        <ConfirmSheet config={config} onClose={close} />
      </ConfirmOpenContext.Provider>
    </ConfirmContext.Provider>
  );
}
