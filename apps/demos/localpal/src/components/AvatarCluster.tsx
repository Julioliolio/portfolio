/**
 * Avatar cluster — three tilted, overlapping peer-pin tiles (Figma 1362:2244
 * / 1300:3944), used on the activity cards' "Going together" button and
 * who's-going rows. All tiles are the shared placeholder element (photos come
 * later). Layout comes from the live registry (theme/avatarCluster.ts,
 * tunable in Lab → Cluster — drag the tiles to place them by hand); the
 * config's slot order is back-to-front paint order.
 */
import { PeerPin } from "./PeerPin";
import { useAvatarCluster } from "./AvatarClusterProvider";

export function AvatarCluster({ size = 40 }: { size?: number }) {
  const { boxW, boxH, slots } = useAvatarCluster();
  const k = size / 40;
  return (
    <div
      style={{
        position: "relative",
        width: boxW * k,
        height: boxH * k,
        flexShrink: 0,
      }}
    >
      {slots.map((s, i) => (
        <PeerPin
          key={i}
          size={s.w * k}
          height={s.h * k}
          style={{
            position: "absolute",
            left: (s.x - s.w / 2) * k,
            top: (s.y - s.h / 2) * k,
            transform: `rotate(${s.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}
