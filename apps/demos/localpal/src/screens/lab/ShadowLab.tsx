import { useState } from "react";
import { Squircle } from "../../components/Squircle";
import { FloatingSquircle } from "../../components/FloatingSquircle";
import { PointShadowDot } from "../../components/PointShadowDot";
import { useFloatShadowContext } from "../../components/FloatShadowProvider";
import { type FloatShadow, type PointShadow } from "../../theme/floatShadow";
import { color } from "../../theme/tokens";
import avatarMe from "../../assets/map/avatar-me.png";
import { Slider, panel, chip } from "./ui";

type NumKey = Exclude<keyof FloatShadow, "color">;
type PointNumKey = Exclude<keyof PointShadow, "color">;

const CONTROLS: Array<{
  key: NumKey;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  {
    key: "contactOpacity",
    label: "Contact opacity",
    min: 0,
    max: 0.6,
    step: 0.01,
  },
  {
    key: "contactBlur",
    label: "Contact blur (px)",
    min: 0,
    max: 24,
    step: 0.5,
  },
  {
    key: "contactWidthRatio",
    label: "Contact width ×",
    min: 0.4,
    max: 1.3,
    step: 0.01,
  },
  {
    key: "contactSquash",
    label: "Squash (scaleY)",
    min: 0.08,
    max: 0.7,
    step: 0.01,
  },
  {
    key: "contactOffset",
    label: "Float offset (px)",
    min: -6,
    max: 24,
    step: 0.5,
  },
  { key: "ambientNear", label: "Ambient near", min: 0, max: 0.4, step: 0.01 },
  { key: "ambientFar", label: "Ambient far", min: 0, max: 0.3, step: 0.01 },
];

// The tiny ground-point dot shown under selected pins (see PointShadowDot).
const POINT_CONTROLS: Array<{
  key: PointNumKey;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "opacity", label: "Point opacity", min: 0, max: 0.8, step: 0.01 },
  { key: "blur", label: "Point blur (px)", min: 0, max: 8, step: 0.25 },
  { key: "width", label: "Point width (px)", min: 4, max: 32, step: 0.5 },
  { key: "squash", label: "Point squash ×", min: 0.15, max: 1, step: 0.01 },
  { key: "offset", label: "Point offset (px)", min: -4, max: 20, step: 0.5 },
];

const BACKGROUNDS: Array<{ id: string; label: string; css: string }> = [
  { id: "map", label: "Map gray", css: color.mapLand },
  { id: "white", label: "White", css: "#ffffff" },
  { id: "water", label: "Water", css: "#a6d3f2" },
  { id: "dark", label: "Dark", css: "#1a1a22" },
];

const SHAPES = ["Avatar", "Indigo squircle", "White card"] as const;
type Shape = (typeof SHAPES)[number];

export function ShadowLab() {
  // Live config from the provider — edits here update the real selected venue
  // pin and the map avatar instantly (not just this preview).
  const {
    shadow: cfg,
    setShadow,
    point,
    setPoint,
    reset,
  } = useFloatShadowContext();
  const [size, setSize] = useState(58);
  const [squircleRadius, setSquircleRadius] = useState(16);
  const [bg, setBg] = useState(BACKGROUNDS[0]);
  const [shape, setShape] = useState<Shape>("Avatar");
  const [copied, setCopied] = useState(false);

  const set = (key: NumKey, v: number) =>
    setShadow({ [key]: v } as Partial<FloatShadow>);
  const setPt = (key: PointNumKey, v: number) =>
    setPoint({ [key]: v } as Partial<PointShadow>);

  const configText = `export const defaultFloatShadow: FloatShadow = {
  color: '${cfg.color}',
  contactOpacity: ${cfg.contactOpacity},
  contactBlur: ${cfg.contactBlur},
  contactWidthRatio: ${cfg.contactWidthRatio},
  contactSquash: ${cfg.contactSquash},
  contactOffset: ${cfg.contactOffset},
  ambientNear: ${cfg.ambientNear},
  ambientFar: ${cfg.ambientFar},
};

export const defaultPointShadow: PointShadow = {
  color: '${point.color}',
  opacity: ${point.opacity},
  blur: ${point.blur},
  width: ${point.width},
  squash: ${point.squash},
  offset: ${point.offset},
};`;

  const copy = () => {
    navigator.clipboard?.writeText(configText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const inner =
    shape === "Avatar" ? (
      <img
        src={avatarMe}
        width={size}
        height={size}
        alt=""
        style={{ display: "block" }}
      />
    ) : (
      <Squircle
        radius={squircleRadius}
        fill={shape === "Indigo squircle" ? color.brand : "#ffffff"}
        style={{ width: size, height: size }}
      />
    );

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
        <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>Floating shadow</h2>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#9aa0a8" }}>
          Applies live to the selected venue pin, focused peer pin + map avatar.
          Copy into <code>theme/floatShadow.ts</code> to persist.
        </p>

        {CONTROLS.map((c) => (
          <Slider
            key={c.key}
            label={c.label}
            value={cfg[c.key]}
            min={c.min}
            max={c.max}
            step={c.step}
            onChange={(v) => set(c.key, v)}
          />
        ))}

        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.08)",
            margin: "8px 0 16px",
          }}
        />
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#9aa0a8" }}>
          Ground-point dot (selected pins only)
        </p>
        {POINT_CONTROLS.map((c) => (
          <Slider
            key={c.key}
            label={c.label}
            value={point[c.key]}
            min={c.min}
            max={c.max}
            step={c.step}
            onChange={(v) => setPt(c.key, v)}
          />
        ))}

        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.08)",
            margin: "8px 0 16px",
          }}
        />
        <Slider
          label="Preview size (px)"
          value={size}
          min={32}
          max={160}
          step={1}
          onChange={setSize}
        />
        <Slider
          label="Squircle radius"
          value={squircleRadius}
          min={4}
          max={48}
          step={1}
          onChange={setSquircleRadius}
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

      {/* Preview + output */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SHAPES.map((s) => (
            <button
              key={s}
              onClick={() => setShape(s)}
              style={chip(shape === s)}
            >
              {s}
            </button>
          ))}
          <span style={{ width: 12 }} />
          {BACKGROUNDS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBg(b)}
              style={chip(bg.id === b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div
          style={{
            ...panel,
            padding: 0,
            overflow: "hidden",
            minHeight: 320,
            display: "grid",
            placeItems: "center",
            background: bg.css,
          }}
        >
          <div style={{ position: "relative" }}>
            <FloatingSquircle
              width={size}
              height={size}
              radius={squircleRadius}
              shadow={cfg}
            >
              {inner}
            </FloatingSquircle>
            {/* The ground-point dot as it appears under a selected pin. */}
            <PointShadowDot top={size + point.offset} />
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
