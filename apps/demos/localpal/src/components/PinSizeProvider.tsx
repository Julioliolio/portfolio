import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  defaultPinSize,
  defaultFocusRadiusM,
  defaultCenterFocusScale,
  defaultCenterFocusZone,
} from '../theme/mapPins';

type Ctx = {
  size: number;
  setSize: (v: number) => void;
  reset: () => void;
  focusRadius: number;
  setFocusRadius: (v: number) => void;
  resetFocusRadius: () => void;
  centerFocusScale: number;
  setCenterFocusScale: (v: number) => void;
  resetCenterFocusScale: () => void;
  centerFocusZone: number;
  setCenterFocusZone: (v: number) => void;
  resetCenterFocusZone: () => void;
};

const PinSizeCtx = createContext<Ctx>({
  size: defaultPinSize,
  setSize: () => {},
  reset: () => {},
  focusRadius: defaultFocusRadiusM,
  setFocusRadius: () => {},
  resetFocusRadius: () => {},
  centerFocusScale: defaultCenterFocusScale,
  setCenterFocusScale: () => {},
  resetCenterFocusScale: () => {},
  centerFocusZone: defaultCenterFocusZone,
  setCenterFocusZone: () => {},
  resetCenterFocusZone: () => {},
});

/** Wrap the app so map-pin knobs (tile size, focus radius, center-focus) are live-tunable everywhere. */
export function PinSizeProvider({ children }: { children: ReactNode }) {
  const [size, setSize] = useState(defaultPinSize);
  const [focusRadius, setFocusRadius] = useState(defaultFocusRadiusM);
  const [centerFocusScale, setCenterFocusScale] = useState(defaultCenterFocusScale);
  const [centerFocusZone, setCenterFocusZone] = useState(defaultCenterFocusZone);
  const reset = () => setSize(defaultPinSize);
  const resetFocusRadius = () => setFocusRadius(defaultFocusRadiusM);
  const resetCenterFocusScale = () => setCenterFocusScale(defaultCenterFocusScale);
  const resetCenterFocusZone = () => setCenterFocusZone(defaultCenterFocusZone);
  return (
    <PinSizeCtx.Provider
      value={{
        size,
        setSize,
        reset,
        focusRadius,
        setFocusRadius,
        resetFocusRadius,
        centerFocusScale,
        setCenterFocusScale,
        resetCenterFocusScale,
        centerFocusZone,
        setCenterFocusZone,
        resetCenterFocusZone,
      }}
    >
      {children}
    </PinSizeCtx.Provider>
  );
}

export function usePinSizeContext() {
  return useContext(PinSizeCtx);
}

/** Read the current map pin tile size. */
export function usePinSize(): number {
  return useContext(PinSizeCtx).size;
}

/** Read the current pin-focus radius, in metres. */
export function useFocusRadius(): number {
  return useContext(PinSizeCtx).focusRadius;
}

/** Read the subtle scale applied to the pin nearest the viewport center. */
export function useCenterFocusScale(): number {
  return useContext(PinSizeCtx).centerFocusScale;
}

/** Read the central catch radius (fraction of the shorter viewport side). */
export function useCenterFocusZone(): number {
  return useContext(PinSizeCtx).centerFocusZone;
}
