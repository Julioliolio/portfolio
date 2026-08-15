import { useState } from "react";
import { Squircle } from "../../components/Squircle";
import { VenuePin } from "../../components/VenuePin";
import { useSquircleContext } from "../../components/SquircleProvider";
import { usePinSizeContext } from "../../components/PinSizeProvider";
import { useMapDensityContext } from "../../components/MapDensityProvider";
import { SQUIRCLE_ROLES, type SquircleRole } from "../../theme/squircles";
import { color } from "../../theme/tokens";
import { figmaIcons } from "../../components/icons/figmaIcons";
import { Slider, panel, chip } from "./ui";

// Representative preview boxes per role.
const PREVIEW: Record<SquircleRole, { w: number; h: number }[]> = {
  button: [
    { w: 150, h: 62 },
    { w: 62, h: 62 },
  ],
  control: [{ w: 48, h: 48 }],
  sheet: [{ w: 220, h: 150 }],
  field: [{ w: 220, h: 44 }],
  card: [{ w: 220, h: 72 }],
  chip: [{ w: 96, h: 34 }],
  avatar: [{ w: 64, h: 64 }],
  pin: [{ w: 40, h: 40 }],
  lozenge: [{ w: 126, h: 64 }],
  photo: [
    { w: 86, h: 125 },
    { w: 86, h: 60 },
  ],
  badge: [{ w: 90, h: 50 }],
  cta: [
    { w: 120, h: 64 },
    { w: 64, h: 64 },
  ],
  planCard: [{ w: 220, h: 124 }],
  slider: [{ w: 200, h: 50 }],
  sliderKnob: [{ w: 38, h: 38 }],
  plate: [{ w: 220, h: 74 }],
  stepDot: [
    { w: 24, h: 8 },
    { w: 8, h: 8 },
  ],
  profileAvatar: [{ w: 120, h: 120 }],
  statCard: [
    { w: 182, h: 126 },
    { w: 125, h: 126 },
  ],
  qrCard: [{ w: 200, h: 204 }],
  miniButton: [{ w: 24, h: 24 }],
  tooltip: [{ w: 230, h: 54 }],
  banner: [{ w: 220, h: 68 }],
  bubble: [
    { w: 180, h: 44 },
    { w: 120, h: 44 },
  ],
  onbCard: [{ w: 220, h: 130 }],
};

export function SquircleLab() {
  const { styles, setStyle, reset } = useSquircleContext();
  const {
    size: pinSize,
    setSize: setPinSize,
    reset: resetPinSize,
    focusRadius,
    setFocusRadius,
    resetFocusRadius,
    centerFocusScale,
    setCenterFocusScale,
    resetCenterFocusScale,
    centerFocusZone,
    setCenterFocusZone,
    resetCenterFocusZone,
  } = usePinSizeContext();
  const {
    density,
    set: setDensity,
    reset: resetDensity,
  } = useMapDensityContext();
  const [copied, setCopied] = useState<SquircleRole | null>(null);

  const roleLine = (role: SquircleRole) =>
    `${role}: { radius: ${styles[role].radius}, smoothing: ${styles[role].smoothing} },`;

  const copyRole = (role: SquircleRole) => {
    navigator.clipboard?.writeText(roleLine(role));
    setCopied(role);
    setTimeout(() => setCopied((c) => (c === role ? null : c)), 1200);
  };

  const configText =
    `export const defaultSquircles: Record<SquircleRole, SquircleStyle> = {\n` +
    SQUIRCLE_ROLES.map(({ role }) => `  ${roleLine(role)}`).join("\n") +
    `\n};`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        color: "#fff",
        width: "min(920px, 92vw)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <p style={{ margin: 0, fontSize: 12, color: "#9aa0a8" }}>
          Each role drives every squircle of that kind across the prototype.
          Changes apply live — check the Map screen. Copy into{" "}
          <code>theme/squircles.ts</code> to persist.
        </p>
        <button onClick={reset} style={chip(false)}>
          Reset all
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {SQUIRCLE_ROLES.map(({ role, label, hint }) => {
          const s = styles[role];
          return (
            <div
              key={role}
              style={{
                ...panel,
                display: "grid",
                gridTemplateColumns: "1fr 150px",
                gap: 16,
                alignItems: "center",
              }}
            >
              {/* controls */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9aa0a8",
                        marginBottom: 12,
                      }}
                    >
                      {hint}
                    </div>
                  </div>
                  <button
                    onClick={() => copyRole(role)}
                    style={{
                      ...chip(copied === role),
                      fontSize: 11,
                      padding: "5px 10px",
                    }}
                  >
                    {copied === role ? "Copied ✓" : "Copy"}
                  </button>
                </div>
                <Slider
                  label="Radius"
                  value={s.radius}
                  min={2}
                  max={64}
                  step={1}
                  onChange={(v) => setStyle(role, { radius: v })}
                />
                <Slider
                  label="Smoothing"
                  value={s.smoothing}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setStyle(role, { smoothing: v })}
                />
              </div>
              {/* preview */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {PREVIEW[role].map((box, i) => (
                  <Squircle
                    key={i}
                    role={role}
                    fill={color.brand}
                    style={{ width: box.w, height: box.h }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          ...panel,
          display: "grid",
          gridTemplateColumns: "1fr 150px",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Map pin size</div>
              <div style={{ fontSize: 11, color: "#9aa0a8", marginBottom: 12 }}>
                Tile size shared by every pin on the Map screen (venue + peer
                pins alike).
              </div>
            </div>
            <button
              onClick={resetPinSize}
              style={{ ...chip(false), fontSize: 11, padding: "5px 10px" }}
            >
              Reset
            </button>
          </div>
          <Slider
            label="Size (px)"
            value={pinSize}
            min={24}
            max={72}
            step={1}
            onChange={setPinSize}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <VenuePin size={pinSize} icon={figmaIcons.cocktail} />
        </div>
      </div>

      <div
        style={{
          ...panel,
          display: "grid",
          gridTemplateColumns: "1fr 150px",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                Pin focus radius
              </div>
              <div style={{ fontSize: 11, color: "#9aa0a8", marginBottom: 12 }}>
                Tapping a pin flies in until ~this radius (metres, pin → nearest
                screen edge) fills the map, isolating it. Tap a pin on the Map
                screen to feel it.
              </div>
            </div>
            <button
              onClick={resetFocusRadius}
              style={{ ...chip(false), fontSize: 11, padding: "5px 10px" }}
            >
              Reset
            </button>
          </div>
          <Slider
            label="Radius (m)"
            value={focusRadius}
            min={20}
            max={500}
            step={5}
            onChange={setFocusRadius}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 34,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {focusRadius}
            <span style={{ fontSize: 14, color: "#9aa0a8", fontWeight: 500 }}>
              {" "}
              m
            </span>
          </span>
        </div>
      </div>

      <div
        style={{
          ...panel,
          display: "grid",
          gridTemplateColumns: "1fr 150px",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Center focus</div>
              <div style={{ fontSize: 11, color: "#9aa0a8", marginBottom: 12 }}>
                Snap-Map style: while you pan the Map, the full pin nearest the
                viewport center grows a touch and holds while centered. Scale =
                how much bigger; Zone = catch radius as a fraction of the
                shorter screen side (pan through empty map to feel it).
              </div>
            </div>
            <button
              onClick={() => {
                resetCenterFocusScale();
                resetCenterFocusZone();
              }}
              style={{ ...chip(false), fontSize: 11, padding: "5px 10px" }}
            >
              Reset
            </button>
          </div>
          <Slider
            label="Scale (×)"
            value={centerFocusScale}
            min={1}
            max={1.6}
            step={0.01}
            onChange={setCenterFocusScale}
          />
          <Slider
            label="Zone (frac)"
            value={centerFocusZone}
            min={0.05}
            max={0.5}
            step={0.01}
            onChange={setCenterFocusZone}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 34,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {centerFocusScale.toFixed(2)}
            <span style={{ fontSize: 14, color: "#9aa0a8", fontWeight: 500 }}>
              {" "}
              ×
            </span>
          </span>
        </div>
      </div>

      <div
        style={{
          ...panel,
          display: "grid",
          gridTemplateColumns: "1fr 150px",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Map density</div>
              <div style={{ fontSize: 11, color: "#9aa0a8", marginBottom: 12 }}>
                Bump-style zoom tiers: below Far zoom the tiles hide behind the
                place crest, and the quiet dots linger until Dots fade (set it ≥
                Far zoom for the old all-at-once exit, or below 11 so they never
                fade). Between Far and Near zoom the budget is GRADUATED: nearly
                every pin keeps its tile at the Near edge (your district stays
                mapped), thinning by priority down to Budget floor right before
                the crest; the rest are dots. Past Near zoom every pin shows.
                Own scale = how much bigger YOUR plans render. Paste into{" "}
                <code>theme/mapClusters.ts</code> (defaultMapDensity) to
                persist.
              </div>
            </div>
            <button
              onClick={resetDensity}
              style={{ ...chip(false), fontSize: 11, padding: "5px 10px" }}
            >
              Reset
            </button>
          </div>
          <Slider
            label="Far zoom"
            value={density.farZoom}
            min={10.5}
            max={14.5}
            step={0.1}
            onChange={(v) => setDensity({ farZoom: v })}
          />
          <Slider
            label="Dots fade"
            value={density.dotsZoom}
            min={10.5}
            max={14.5}
            step={0.1}
            onChange={(v) => setDensity({ dotsZoom: v })}
          />
          <Slider
            label="Near zoom"
            value={density.nearZoom}
            min={12.5}
            max={17}
            step={0.1}
            onChange={(v) => setDensity({ nearZoom: v })}
          />
          <Slider
            label="Budget floor"
            value={density.tileBudget}
            min={3}
            max={16}
            step={1}
            onChange={(v) => setDensity({ tileBudget: v })}
          />
          <Slider
            label="Dot opacity"
            value={density.dotOpacity}
            min={0.15}
            max={1}
            step={0.05}
            onChange={(v) => setDensity({ dotOpacity: v })}
          />
          <Slider
            label="Own scale (×)"
            value={density.ownPinScale}
            min={1}
            max={1.5}
            step={0.05}
            onChange={(v) => setDensity({ ownPinScale: v })}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 34,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {density.tileBudget}
            <span style={{ fontSize: 14, color: "#9aa0a8", fontWeight: 500 }}>
              {" "}
              tiles
            </span>
          </span>
        </div>
      </div>

      <div style={panel}>
        <div style={{ fontSize: 13, color: "#cfd2d8", marginBottom: 8 }}>
          Config
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
  );
}
