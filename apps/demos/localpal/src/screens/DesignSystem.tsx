import { Squircle } from "../components/Squircle";
import { color, text, radius, space } from "../theme/tokens";

const swatches: Array<[string, string, "light" | "dark"]> = [
  ["brand", color.brand, "dark"],
  ["brandDeep", color.brandDeep, "dark"],
  ["lavender", color.lavender, "dark"],
  ["lavenderDim", color.lavenderDim, "dark"],
  ["ink", color.ink, "dark"],
  ["muted", color.muted, "dark"],
  ["mapLand", color.mapLand, "light"],
  ["mapWater", color.mapWater, "light"],
  ["mapPark", color.mapPark, "light"],
  ["offWhite", color.offWhite, "light"],
];

const scale: Array<[string, (typeof text)[keyof typeof text]]> = [
  ["display", text.display],
  ["h1", text.h1],
  ["h2", text.h2],
  ["bodyLg", text.bodyLg],
  ["body", text.body],
  ["caption", text.caption],
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: space.lg }}>
      <p
        style={{
          fontSize: text.caption.size,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: color.muted,
          margin: `0 0 ${space.sm}px`,
        }}
      >
        {title}
      </p>
      {children}
    </section>
  );
}

export function DesignSystem() {
  return (
    <div style={{ width: "100%", height: "100%", background: color.offWhite }}>
      <div
        style={{
          height: "100%",
          overflowY: "auto",
          padding: `72px ${space.lg}px ${space.xl}px`,
        }}
      >
        <h1
          style={{
            fontSize: text.display.size,
            lineHeight: `${text.display.line}px`,
            fontWeight: text.display.weight,
            margin: `0 0 ${space.lg}px`,
            color: color.ink,
          }}
        >
          LocalPal
          <br />
          Design System
        </h1>

        {/* COLOR */}
        <Section title="Color">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: space.xs,
            }}
          >
            {swatches.map(([name, hex, tone]) => (
              <Squircle
                key={name}
                radius={radius.chip}
                fill={hex}
                style={{
                  height: 64,
                  padding: space.sm,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  color: tone === "dark" ? "#fff" : color.ink,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600 }}>{name}</span>
                <span style={{ fontSize: 10, opacity: 0.8 }}>{hex}</span>
              </Squircle>
            ))}
          </div>
        </Section>

        {/* TYPE */}
        <Section title="Type — PP Neue Montreal">
          {scale.map(([name, t]) => (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: space.sm,
                marginBottom: space.xs,
              }}
            >
              <span
                style={{
                  fontSize: t.size,
                  lineHeight: `${t.line}px`,
                  fontWeight: t.weight,
                  color: color.ink,
                }}
              >
                Do something together
              </span>
              <span style={{ fontSize: 10, color: color.muted }}>
                {name} · {t.size}/{t.weight}
              </span>
            </div>
          ))}
        </Section>

        {/* SQUIRCLES */}
        <Section title="Squircles — superellipse, smoothing 0.6">
          <div style={{ display: "flex", gap: space.sm, alignItems: "center" }}>
            {[radius.chip, radius.card, radius.fab, radius.avatar].map(
              (r, i) => (
                <Squircle
                  key={i}
                  radius={r}
                  fill={color.brand}
                  style={{
                    width: 64,
                    height: 64,
                    display: "grid",
                    placeItems: "center",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  r{r}
                </Squircle>
              ),
            )}
          </div>
        </Section>

        {/* SAMPLE COMPONENTS */}
        <Section title="Components">
          {/* Chip */}
          <div
            style={{ display: "flex", gap: space.xs, marginBottom: space.sm }}
          >
            {["Drinks", "Sports", "Food"].map((c, i) => (
              <Squircle
                key={c}
                radius={radius.chip}
                fill={i === 0 ? color.brand : "transparent"}
                stroke={i === 0 ? undefined : color.muted}
                style={{
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: i === 0 ? "#fff" : color.ink,
                }}
              >
                {c}
              </Squircle>
            ))}
          </div>

          {/* List card (over-white variant) */}
          <Squircle
            radius={radius.card}
            fill="#fff"
            stroke="rgba(0,0,0,0.06)"
            style={{
              display: "flex",
              alignItems: "center",
              gap: space.sm,
              padding: space.sm,
              marginBottom: space.sm,
            }}
          >
            <Squircle
              radius={radius.avatar}
              fill={color.brand}
              style={{ width: 44, height: 44, flex: "0 0 auto" }}
            />
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: color.ink }}>
                Live Music Night at Rita's
              </div>
              <div style={{ fontSize: 12, color: color.muted, marginTop: 2 }}>
                20:30 · 0.5km
              </div>
            </div>
          </Squircle>

          {/* Primary FAB row */}
          <div style={{ display: "flex", gap: space.sm, alignItems: "center" }}>
            <Squircle
              radius={radius.pill}
              fill={color.brand}
              as="button"
              style={{
                flex: 1,
                height: 56,
                display: "grid",
                placeItems: "center",
                color: "#fff",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Search
            </Squircle>
            <Squircle
              radius={radius.fab}
              fill={color.brand}
              as="button"
              style={{ width: 56, height: 56 }}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}
