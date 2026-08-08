import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  defaultSquircles,
  type SquircleRole,
  type SquircleStyle,
} from '../theme/squircles';

type Ctx = {
  styles: Record<SquircleRole, SquircleStyle>;
  setStyle: (role: SquircleRole, patch: Partial<SquircleStyle>) => void;
  reset: () => void;
};

const SquircleCtx = createContext<Ctx>({
  styles: defaultSquircles,
  setStyle: () => {},
  reset: () => {},
});

/** Wrap the app so squircle roles are live-tunable (by the Lab) everywhere. */
export function SquircleProvider({ children }: { children: ReactNode }) {
  const [styles, setStyles] = useState<Record<SquircleRole, SquircleStyle>>(defaultSquircles);
  const setStyle = (role: SquircleRole, patch: Partial<SquircleStyle>) =>
    setStyles((s) => ({ ...s, [role]: { ...s[role], ...patch } }));
  const reset = () => setStyles(defaultSquircles);
  return <SquircleCtx.Provider value={{ styles, setStyle, reset }}>{children}</SquircleCtx.Provider>;
}

export function useSquircleContext() {
  return useContext(SquircleCtx);
}

/** Read a single role's current style. */
export function useSquircle(role: SquircleRole): SquircleStyle {
  return useContext(SquircleCtx).styles[role];
}
