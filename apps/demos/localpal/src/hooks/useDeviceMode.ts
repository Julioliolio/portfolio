import { useCallback, useEffect, useState } from 'react';

export type DeviceMode = 'mobile' | 'desktop';

/**
 * Auto-detects whether the visitor is on a phone or a desktop so the public
 * entry can render the prototype full-screen (mobile) or inside the phone
 * frame (desktop). Detection = a coarse pointer (touch) AND a narrow viewport;
 * both must hold, so a touch laptop or a narrow-but-mouse window still reads as
 * desktop. Re-evaluates live on resize / pointer changes.
 *
 * `setOverride` lets the UI force a mode (the "view as phone / desktop" toggle);
 * an explicit override always wins over detection until cleared with `null`.
 */
const MOBILE_MAX_WIDTH = 520;

function detect(): DeviceMode {
  if (typeof window === 'undefined') return 'desktop';
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.innerWidth <= MOBILE_MAX_WIDTH;
  return coarse && narrow ? 'mobile' : 'desktop';
}

export function useDeviceMode(): {
  mode: DeviceMode;
  detected: DeviceMode;
  override: DeviceMode | null;
  setOverride: (mode: DeviceMode | null) => void;
} {
  const [detected, setDetected] = useState<DeviceMode>(detect);
  const [override, setOverride] = useState<DeviceMode | null>(null);

  useEffect(() => {
    const update = () => setDetected(detect());
    const mq = window.matchMedia('(pointer: coarse)');
    window.addEventListener('resize', update);
    mq.addEventListener('change', update);
    return () => {
      window.removeEventListener('resize', update);
      mq.removeEventListener('change', update);
    };
  }, []);

  const set = useCallback((m: DeviceMode | null) => setOverride(m), []);

  return { mode: override ?? detected, detected, override, setOverride: set };
}
