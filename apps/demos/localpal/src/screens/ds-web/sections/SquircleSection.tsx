import { useState } from "react";
import { Squircle } from "../../../components/Squircle";
import { color } from "../../../theme/tokens";
import { SQUIRCLE_ROLES, defaultSquircles } from "../../../theme/squircles";
import { copy } from "../copy";

/**
 * Squircles. Una superelipse recortada con figma-squircle, no un rectángulo
 * redondeado. El «feeler» deja tocar radio + suavizado en vivo; la rejilla
 * muestra los 21 papeles reales del registro (theme/squircles.ts).
 */

export function SquircleSection() {
  const [radius, setRadius] = useState(40);
  const [smoothing, setSmoothing] = useState(1);
  const c = copy.squircles;

  return (
    <section id="squircles" className="dsw-section">
      <header className="dsw-section-head">
        <p className="dsw-eyebrow">{c.eyebrow}</p>
        <h2 className="dsw-section-title">{c.title}</h2>
        <p className="dsw-section-lede">{c.lede}</p>
      </header>

      {/* Feeler interactivo */}
      <div className="dsw-sq-feeler">
        <div className="dsw-sq-stage">
          <Squircle
            radius={radius}
            smoothing={smoothing}
            fill={color.onBrand}
            className="dsw-sq-demo"
          >
            <span className="dsw-sq-demo-num">{radius}</span>
          </Squircle>
        </div>

        <div className="dsw-sq-controls">
          <Slider
            label={c.controls.radius}
            value={radius}
            min={0}
            max={110}
            step={1}
            suffix="px"
            onChange={setRadius}
          />
          <Slider
            label={c.controls.smoothing}
            value={smoothing}
            min={0}
            max={1}
            step={0.05}
            onChange={setSmoothing}
          />
          <p className="dsw-sq-note">{c.feelerNote}</p>
        </div>
      </div>

      {/* Rejilla de papeles */}
      <div className="dsw-sq-roles-head">
        <h3 className="dsw-swatch-group-title">{c.rolesTitle}</h3>
        <p className="dsw-swatch-group-note">{c.rolesNote}</p>
      </div>
      <div className="dsw-sq-roles">
        {SQUIRCLE_ROLES.map(({ role, label }) => {
          const s = defaultSquircles[role];
          return (
            <div key={role} className="dsw-sq-role">
              <div className="dsw-sq-role-stage">
                <Squircle
                  role={role}
                  fill={color.onBrand}
                  className="dsw-sq-role-chip"
                />
              </div>
              <span className="dsw-sq-role-label">{label}</span>
              <span className="dsw-sq-role-spec">
                r{s.radius} · s{s.smoothing}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="dsw-slider">
      <span className="dsw-slider-head">
        <span className="dsw-slider-label">{label}</span>
        <span className="dsw-slider-value">
          {value}
          {suffix ?? ""}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="dsw-slider-input"
      />
    </label>
  );
}
