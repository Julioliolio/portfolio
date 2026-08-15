import { createContext, useContext, useState, type ReactNode } from "react";
import {
  defaultAvatarCluster,
  type AvatarClusterConfig,
  type ClusterSlot,
} from "../theme/avatarCluster";

type Ctx = {
  cluster: AvatarClusterConfig;
  setBox: (patch: Partial<Pick<AvatarClusterConfig, "boxW" | "boxH">>) => void;
  setSlot: (index: number, patch: Partial<ClusterSlot>) => void;
  reset: () => void;
};

const AvatarClusterCtx = createContext<Ctx>({
  cluster: defaultAvatarCluster,
  setBox: () => {},
  setSlot: () => {},
  reset: () => {},
});

/**
 * Wrap the app so the avatar-cluster layout (theme/avatarCluster.ts) is
 * live-tunable from the Lab → Cluster tab: every cluster on the activity
 * cards re-lays-out as you drag tiles around.
 */
export function AvatarClusterProvider({ children }: { children: ReactNode }) {
  const [cluster, setCluster] =
    useState<AvatarClusterConfig>(defaultAvatarCluster);
  const setBox = (patch: Partial<Pick<AvatarClusterConfig, "boxW" | "boxH">>) =>
    setCluster((c) => ({ ...c, ...patch }));
  const setSlot = (index: number, patch: Partial<ClusterSlot>) =>
    setCluster((c) => ({
      ...c,
      slots: c.slots.map((s, i) =>
        i === index ? { ...s, ...patch } : s,
      ) as AvatarClusterConfig["slots"],
    }));
  const reset = () => setCluster(defaultAvatarCluster);
  return (
    <AvatarClusterCtx.Provider value={{ cluster, setBox, setSlot, reset }}>
      {children}
    </AvatarClusterCtx.Provider>
  );
}

export function useAvatarClusterContext() {
  return useContext(AvatarClusterCtx);
}

/** Read the current live cluster layout. */
export function useAvatarCluster(): AvatarClusterConfig {
  return useContext(AvatarClusterCtx).cluster;
}
