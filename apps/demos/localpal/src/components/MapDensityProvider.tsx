import { createContext, useContext, useState, type ReactNode } from "react";
import { defaultMapDensity, type MapDensityConfig } from "../theme/mapClusters";

type Ctx = {
  density: MapDensityConfig;
  set: (patch: Partial<MapDensityConfig>) => void;
  reset: () => void;
};

const MapDensityCtx = createContext<Ctx>({
  density: defaultMapDensity,
  set: () => {},
  reset: () => {},
});

/**
 * Wrap the app so the map's zoom-tier density curation (theme/mapClusters.ts
 * `defaultMapDensity`) is live-tunable from Lab → Squircles → "Map density":
 * tier thresholds, tile budget, dot opacity and own-pin scale all apply live
 * to the Map screen.
 */
export function MapDensityProvider({ children }: { children: ReactNode }) {
  const [density, setDensity] = useState<MapDensityConfig>(defaultMapDensity);
  const set = (patch: Partial<MapDensityConfig>) =>
    setDensity((d) => ({ ...d, ...patch }));
  const reset = () => setDensity(defaultMapDensity);
  return (
    <MapDensityCtx.Provider value={{ density, set, reset }}>
      {children}
    </MapDensityCtx.Provider>
  );
}

export function useMapDensityContext() {
  return useContext(MapDensityCtx);
}

/** Read the current live density config. */
export function useMapDensity(): MapDensityConfig {
  return useContext(MapDensityCtx).density;
}
