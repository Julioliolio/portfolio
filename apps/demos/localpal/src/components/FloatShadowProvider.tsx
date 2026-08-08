import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  defaultFloatShadow,
  defaultPointShadow,
  type FloatShadow,
  type PointShadow,
} from '../theme/floatShadow';

type Ctx = {
  shadow: FloatShadow;
  setShadow: (patch: Partial<FloatShadow>) => void;
  point: PointShadow;
  setPoint: (patch: Partial<PointShadow>) => void;
  reset: () => void;
};

const FloatShadowCtx = createContext<Ctx>({
  shadow: defaultFloatShadow,
  setShadow: () => {},
  point: defaultPointShadow,
  setPoint: () => {},
  reset: () => {},
});

/**
 * Wrap the app so the "floating squircle" contact/ambient shadow and the tiny
 * ground-point shadow are live-tunable (by the Lab) everywhere they're used
 * from the default — the selected venue pin (MorphVenuePin), the focused peer
 * pin and the map avatar (FloatingSquircle). Surfaces that pass an explicit
 * `shadow` override (e.g. peer pins' avatarPhotoShadow) still win.
 */
export function FloatShadowProvider({ children }: { children: ReactNode }) {
  const [shadow, setShadowState] = useState<FloatShadow>(defaultFloatShadow);
  const [point, setPointState] = useState<PointShadow>(defaultPointShadow);
  const setShadow = (patch: Partial<FloatShadow>) => setShadowState((s) => ({ ...s, ...patch }));
  const setPoint = (patch: Partial<PointShadow>) => setPointState((s) => ({ ...s, ...patch }));
  const reset = () => {
    setShadowState(defaultFloatShadow);
    setPointState(defaultPointShadow);
  };
  return (
    <FloatShadowCtx.Provider value={{ shadow, setShadow, point, setPoint, reset }}>
      {children}
    </FloatShadowCtx.Provider>
  );
}

export function useFloatShadowContext() {
  return useContext(FloatShadowCtx);
}

/** Read the current live float-shadow config. */
export function useFloatShadow(): FloatShadow {
  return useContext(FloatShadowCtx).shadow;
}

/** Read the current live ground-point shadow config. */
export function usePointShadow(): PointShadow {
  return useContext(FloatShadowCtx).point;
}
