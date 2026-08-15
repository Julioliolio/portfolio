import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Transition } from "framer-motion";
import {
  defaultCameraEase,
  defaultMotionExtras,
  defaultMotionRoles,
  defaultSignature,
  resolveCameraEase,
  resolveSimSpring,
  resolveTransition,
  type CameraEaseConfig,
  type MotionExtras,
  type MotionRole,
  type MotionRoleTuning,
  type MotionSignature,
} from "../theme/motion";

type Ctx = {
  signature: MotionSignature;
  roles: Record<MotionRole, MotionRoleTuning>;
  extras: MotionExtras;
  cameraEase: CameraEaseConfig;
  setSignature: (patch: Partial<MotionSignature>) => void;
  setRole: (role: MotionRole, patch: Partial<MotionRoleTuning>) => void;
  setExtras: (patch: Partial<MotionExtras>) => void;
  setCameraEase: (patch: Partial<CameraEaseConfig>) => void;
  reset: () => void;
};

const MotionCtx = createContext<Ctx>({
  signature: defaultSignature,
  roles: defaultMotionRoles,
  extras: defaultMotionExtras,
  cameraEase: defaultCameraEase,
  setSignature: () => {},
  setRole: () => {},
  setExtras: () => {},
  setCameraEase: () => {},
  reset: () => {},
});

/** Wrap the app so motion roles are live-tunable (by the Lab) everywhere. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [signature, setSig] = useState<MotionSignature>(defaultSignature);
  const [roles, setRoles] =
    useState<Record<MotionRole, MotionRoleTuning>>(defaultMotionRoles);
  const [extras, setEx] = useState<MotionExtras>(defaultMotionExtras);
  const [cameraEase, setCam] = useState<CameraEaseConfig>(defaultCameraEase);

  const setSignature = (patch: Partial<MotionSignature>) =>
    setSig((s) => ({ ...s, ...patch }));
  const setRole = (role: MotionRole, patch: Partial<MotionRoleTuning>) =>
    setRoles((r) => ({ ...r, [role]: { ...r[role], ...patch } }));
  const setExtras = (patch: Partial<MotionExtras>) =>
    setEx((e) => ({ ...e, ...patch }));
  const setCameraEase = (patch: Partial<CameraEaseConfig>) =>
    setCam((c) => ({ ...c, ...patch }));
  const reset = () => {
    setSig(defaultSignature);
    setRoles(defaultMotionRoles);
    setEx(defaultMotionExtras);
    setCam(defaultCameraEase);
  };

  return (
    <MotionCtx.Provider
      value={{
        signature,
        roles,
        extras,
        cameraEase,
        setSignature,
        setRole,
        setExtras,
        setCameraEase,
        reset,
      }}
    >
      {children}
    </MotionCtx.Provider>
  );
}

export function useMotionContext() {
  return useContext(MotionCtx);
}

/** A role's live framer-motion Transition. Stable identity for effect deps. */
export function useMotion(role: MotionRole): Transition {
  const { signature, roles } = useContext(MotionCtx);
  const tuning = roles[role];
  return useMemo(
    () => resolveTransition(signature, role, tuning),
    [signature, role, tuning],
  );
}

/** A role's live per-frame spring constants, for rAF physics sims. */
export function useMotionSim(role: MotionRole): { k: number; damp: number } {
  const { signature, roles } = useContext(MotionCtx);
  const tuning = roles[role];
  return useMemo(
    () => resolveSimSpring(signature, tuning),
    [signature, tuning],
  );
}

/** The live MapLibre camera ease (duration + cubic-bezier curve). */
export function useCameraEase(): {
  durationMs: number;
  easing: (t: number) => number;
} {
  const { cameraEase } = useContext(MotionCtx);
  return useMemo(() => resolveCameraEase(cameraEase), [cameraEase]);
}

export function useMotionExtras(): MotionExtras {
  return useContext(MotionCtx).extras;
}

/**
 * Shared touch squish: spread onto any motion.* element —
 * `<motion.button {...usePressFeedback()} />`. Scale-down on press, springy
 * scale-back on release, from the `press` role + `pressScale` extra.
 */
export function usePressFeedback(overrides?: Record<string, unknown>) {
  const transition = useMotion("press");
  const { pressScale } = useMotionExtras();
  return { whileTap: { scale: pressScale, transition, ...overrides } };
}
