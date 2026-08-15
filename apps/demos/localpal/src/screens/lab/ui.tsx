import type { CSSProperties } from "react";
import { color } from "../../theme/tokens";

export const panel: CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: 20,
};

export const chip = (active: boolean): CSSProperties => ({
  padding: "6px 12px",
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 600,
  color: active ? "#fff" : "#aeb2ba",
  background: active ? color.brand : "rgba(255,255,255,0.08)",
});

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          marginBottom: 4,
        }}
      >
        <span style={{ color: "#cfd2d8" }}>{label}</span>
        <span style={{ color: "#fff", fontVariantNumeric: "tabular-nums" }}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: color.brand }}
      />
    </label>
  );
}
