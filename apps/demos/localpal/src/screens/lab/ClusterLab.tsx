import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { PeerPin } from "../../components/PeerPin";
import { AvatarCluster } from "../../components/AvatarCluster";
import { useAvatarClusterContext } from "../../components/AvatarClusterProvider";
import { color } from "../../theme/tokens";
import { Slider, panel, chip } from "./ui";

/**
 * Lab → Cluster: place the avatar-cluster tiles BY HAND. Drag tiles in the
 * zoomed board (arrow keys nudge the selected one); fine-tune size/tilt with
 * the sliders. Edits apply live to every cluster on the activity cards.
 * Copy the config into theme/avatarCluster.ts to persist.
 */

const SLOT_NAMES = ["Back", "Middle", "Front"] as const;

const round = (v: number) => Math.round(v * 100) / 100;

export function ClusterLab() {
  const { cluster: cfg, setBox, setSlot, reset } = useAvatarClusterContext();
  const [selected, setSelected] = useState(1);
  const [zoom, setZoom] = useState(4);
  const [copied, setCopied] = useState(false);

  // Drag state: pointer start + the slot's starting center.
  const drag = useRef<{
    i: number;
    px: number;
    py: number;
    sx: number;
    sy: number;
  } | null>(null);

  const onTileDown = (i: number) => (e: ReactPointerEvent) => {
    e.preventDefault();
    setSelected(i);
    const s = cfg.slots[i];
    drag.current = { i, px: e.clientX, py: e.clientY, sx: s.x, sy: s.y };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onTileMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setSlot(d.i, {
      x: round(d.sx + (e.clientX - d.px) / zoom),
      y: round(d.sy + (e.clientY - d.py) / zoom),
    });
  };
  const onTileUp = () => {
    drag.current = null;
  };
  const onBoardKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 1 : 0.25;
    const s = cfg.slots[selected];
    if (e.key === "ArrowLeft") setSlot(selected, { x: round(s.x - step) });
    else if (e.key === "ArrowRight")
      setSlot(selected, { x: round(s.x + step) });
    else if (e.key === "ArrowUp") setSlot(selected, { y: round(s.y - step) });
    else if (e.key === "ArrowDown") setSlot(selected, { y: round(s.y + step) });
    else return;
    e.preventDefault();
  };

  const configText = `export const defaultAvatarCluster: AvatarClusterConfig = {
  boxW: ${cfg.boxW},
  boxH: ${cfg.boxH},
  slots: [
${cfg.slots.map((s) => `    { x: ${s.x}, y: ${s.y}, w: ${s.w}, h: ${s.h}, rot: ${s.rot} },`).join("\n")}
  ],
};`;

  const copy = () => {
    navigator.clipboard?.writeText(configText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const sel = cfg.slots[selected];
  // The board leaves generous margin around the layout box so tiles can be
  // dragged past its edges (the design's front tile overhangs it already).
  const MARGIN = 24;
  const boardW = (cfg.boxW + MARGIN * 2) * zoom;
  const boardH = (cfg.boxH + MARGIN * 2) * zoom;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gap: 24,
        color: "#fff",
      }}
    >
      {/* Controls */}
      <div style={panel}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>Avatar cluster</h2>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#9aa0a8" }}>
          Drag tiles on the board (arrows nudge, ⇧ for 1px). Applies live to the
          activity cards. Copy into <code>theme/avatarCluster.ts</code> to
          persist.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {SLOT_NAMES.map((n, i) => (
            <button
              key={n}
              onClick={() => setSelected(i)}
              style={chip(selected === i)}
            >
              {n}
            </button>
          ))}
        </div>

        <Slider
          label="Center x"
          value={sel.x}
          min={-10}
          max={cfg.boxW + 20}
          step={0.05}
          onChange={(v) => setSlot(selected, { x: v })}
        />
        <Slider
          label="Center y"
          value={sel.y}
          min={-10}
          max={cfg.boxH + 20}
          step={0.05}
          onChange={(v) => setSlot(selected, { y: v })}
        />
        <Slider
          label="Width"
          value={sel.w}
          min={24}
          max={64}
          step={0.5}
          onChange={(v) => setSlot(selected, { w: v })}
        />
        <Slider
          label="Height"
          value={sel.h}
          min={24}
          max={64}
          step={0.5}
          onChange={(v) => setSlot(selected, { h: v })}
        />
        <Slider
          label="Tilt (deg)"
          value={sel.rot}
          min={-30}
          max={30}
          step={0.5}
          onChange={(v) => setSlot(selected, { rot: v })}
        />

        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.08)",
            margin: "8px 0 16px",
          }}
        />
        <Slider
          label="Layout box width"
          value={cfg.boxW}
          min={60}
          max={160}
          step={0.5}
          onChange={(v) => setBox({ boxW: v })}
        />
        <Slider
          label="Layout box height"
          value={cfg.boxH}
          min={36}
          max={80}
          step={0.5}
          onChange={(v) => setBox({ boxH: v })}
        />
        <Slider
          label="Board zoom"
          value={zoom}
          min={2}
          max={7}
          step={0.5}
          onChange={setZoom}
        />

        <button
          onClick={reset}
          style={{
            ...chip(false),
            width: "100%",
            marginTop: 8,
            padding: "10px 12px",
          }}
        >
          Reset to default
        </button>
      </div>

      {/* Board + live row + output */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          tabIndex={0}
          onKeyDown={onBoardKey}
          style={{
            ...panel,
            padding: 0,
            overflow: "hidden",
            display: "grid",
            placeItems: "center",
            background: color.brand,
            outline: "none",
          }}
        >
          <div
            style={{
              position: "relative",
              width: boardW,
              height: boardH,
              margin: "24px 0",
            }}
          >
            {/* layout-box outline, for reference */}
            <div
              style={{
                position: "absolute",
                left: MARGIN * zoom,
                top: MARGIN * zoom,
                width: cfg.boxW * zoom,
                height: cfg.boxH * zoom,
                border: "1px dashed rgba(255,255,255,0.35)",
                pointerEvents: "none",
              }}
            />
            {cfg.slots.map((s, i) => (
              <div
                key={i}
                onPointerDown={onTileDown(i)}
                onPointerMove={onTileMove}
                onPointerUp={onTileUp}
                style={{
                  position: "absolute",
                  left: (MARGIN + s.x - s.w / 2) * zoom,
                  top: (MARGIN + s.y - s.h / 2) * zoom,
                  transform: `rotate(${s.rot}deg)`,
                  cursor: "grab",
                  touchAction: "none",
                  outline:
                    selected === i
                      ? `${Math.max(2, zoom / 2)}px solid rgba(255,255,255,0.6)`
                      : "none",
                  outlineOffset: 2,
                }}
              >
                <PeerPin
                  size={s.w * zoom}
                  height={s.h * zoom}
                  style={{ pointerEvents: "none" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* The real row at 1:1, exactly as the cards render it */}
        <div
          style={{
            ...panel,
            background: color.brand,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AvatarCluster />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span
              style={{ color: color.onBrand, fontSize: 16, fontWeight: 500 }}
            >
              Giulia, Martin
            </span>
            <span
              style={{ color: color.lavender, fontSize: 12, fontWeight: 500 }}
            >
              and +5 others are going
            </span>
          </div>
        </div>

        <div style={panel}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 13, color: "#cfd2d8" }}>Config</span>
            <button onClick={copy} style={chip(true)}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <pre
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.5,
              color: "#d7dae0",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              whiteSpace: "pre-wrap",
            }}
          >
            {configText}
          </pre>
        </div>
      </div>
    </div>
  );
}
