import { motion } from "framer-motion";
import { Squircle } from "../../../components/Squircle";
import { VenuePin } from "../../../components/VenuePin";
import { PeerPin } from "../../../components/PeerPin";
import { SearchGlyph } from "../../../components/icons/SearchGlyph";
import { Glyph } from "../../../components/icons/Glyph";
import { CrossIcon } from "../../../components/icons/CrossIcon";
import { CheckIcon } from "../../../components/icons/CheckIcon";
import { BookmarkIcon } from "../../../components/icons/BookmarkIcon";
import { ShareIcon } from "../../../components/icons/ShareIcon";
import { PersonIcon } from "../../../components/icons/PersonIcon";
import { figmaIcons } from "../../../components/icons/figmaIcons";
import activityCluster from "../../../assets/ds-web/activity-cluster.svg";
import { color } from "../../../theme/tokens";
import { CATEGORIES } from "../../../theme/categories";
import { usePressFeedback } from "../../../components/MotionProvider";
import { copy } from "../copy";

const CC = copy.componentes;
const K = CC.cards;

/**
 * Componentes. Piezas reales de la app — no capturas. Cada ejemplo se arma con
 * los papeles de squircle y los íconos reales del prototipo. Las superficies
 * blancas se muestran sobre índigo (como viven en las hojas); las piezas de
 * marca, sobre claro.
 */

export function ComponentsSection() {
  return (
    <section id="componentes" className="dsw-section dsw-onlight">
      <header className="dsw-section-head">
        <p className="dsw-eyebrow">{CC.eyebrow}</p>
        <h2 className="dsw-section-title">{CC.title}</h2>
        <p className="dsw-section-lede">{CC.lede}</p>
      </header>

      <Group title={CC.groups.botones.title} note={CC.groups.botones.note}>
        <SearchButtonDemo />
        <CtaButtonDemo />
        <ControlButtonDemo />
        <MiniButtonDemo />
      </Group>

      <Group
        title={CC.groups.superficies.title}
        note={CC.groups.superficies.note}
      >
        <VenuePinDemo />
        <PeerPinDemo />
        <PlanCardDemo />
        <BadgeDemo />
        <StatCardDemo />
      </Group>

      <Group title={CC.groups.chips.title} note={CC.groups.chips.note}>
        <ChipsDemo />
        <FieldDemo />
      </Group>

      <Group title={CC.groups.iconos.title} note={CC.groups.iconos.note}>
        <ActivityGlyphsDemo />
        <SearchGlyphDemo />
        <UtilityIconsDemo />
      </Group>
    </section>
  );
}

function Group({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dsw-comp-group">
      <div className="dsw-swatch-group-head">
        <h3 className="dsw-swatch-group-title">{title}</h3>
        <p className="dsw-swatch-group-note">{note}</p>
      </div>
      <div className="dsw-comp-grid">{children}</div>
    </div>
  );
}

function Card({
  title,
  hint,
  dark,
  wide,
  children,
}: {
  title: string;
  hint: string;
  dark?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className={"dsw-comp-card" + (wide ? " is-wide" : "")}>
      <div className={"dsw-comp-stage" + (dark ? " is-dark" : "")}>
        {children}
      </div>
      <div className="dsw-comp-meta">
        <span className="dsw-comp-title">{title}</span>
        <span className="dsw-comp-hint">{hint}</span>
      </div>
    </article>
  );
}

/* Press wrapper so every button demo squishes on tap, like the app. */
function Press({ children }: { children: React.ReactNode }) {
  const press = usePressFeedback();
  return (
    <motion.div
      {...press}
      style={{ cursor: "pointer", display: "inline-flex" }}
    >
      {children}
    </motion.div>
  );
}

/* --------------------------------------------------------------- Botones --- */

function SearchButtonDemo() {
  return (
    <Card title={K.search.title} hint={K.search.hint}>
      <Press>
        <Squircle
          role="button"
          fill={color.brand}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 22px",
          }}
        >
          <SearchGlyph size={22} color={color.onBrand} ambient={false} />
          <span style={{ color: color.onBrand, fontWeight: 500, fontSize: 16 }}>
            {K.search.sample}
          </span>
        </Squircle>
      </Press>
    </Card>
  );
}

function CtaButtonDemo() {
  return (
    <Card title={K.cta.title} hint={K.cta.hint} dark>
      <Press>
        <Squircle
          role="cta"
          fill={color.white}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px 30px",
          }}
        >
          <span style={{ color: color.brand, fontWeight: 600, fontSize: 17 }}>
            {K.cta.sample}
          </span>
        </Squircle>
      </Press>
    </Card>
  );
}

function ControlButtonDemo() {
  return (
    <Card title={K.control.title} hint={K.control.hint}>
      <Press>
        <Squircle
          role="control"
          fill={color.brand}
          style={{
            width: 52,
            height: 52,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Glyph name="coffee" size={24} color={color.onBrand} />
        </Squircle>
      </Press>
    </Card>
  );
}

function MiniButtonDemo() {
  return (
    <Card title={K.mini.title} hint={K.mini.hint} dark>
      <Press>
        <Squircle
          role="miniButton"
          fill={color.white}
          style={{
            width: 32,
            height: 32,
            display: "grid",
            placeItems: "center",
          }}
        >
          <CrossIcon size={13} color={color.brand} />
        </Squircle>
      </Press>
    </Card>
  );
}

/* ----------------------------------------------------------- Superficies --- */

function VenuePinDemo() {
  return (
    <Card title={K.venuePin.title} hint={K.venuePin.hint}>
      <VenuePin size={60} icon={figmaIcons.cocktail} />
    </Card>
  );
}

function PeerPinDemo() {
  return (
    <Card title={K.peerPin.title} hint={K.peerPin.hint}>
      <PeerPin size={60} badge={figmaIcons.cocktail} />
    </Card>
  );
}

function PlanCardDemo() {
  return (
    <Card title={K.planCard.title} hint={K.planCard.hint} dark wide>
      <Squircle
        role="planCard"
        fill={color.white}
        style={{ width: 280, padding: 22 }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: color.ink,
            letterSpacing: "-0.01em",
          }}
        >
          {K.planCard.sampleTitle}
        </p>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 14,
            fontWeight: 500,
            color: color.muted,
          }}
        >
          {K.planCard.sampleMeta}
        </p>
      </Squircle>
    </Card>
  );
}

function BadgeDemo() {
  return (
    <Card title={K.badge.title} hint={K.badge.hint} dark>
      <Squircle
        role="badge"
        fill={color.white}
        style={{
          width: 90,
          height: 56,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: color.muted,
          }}
        >
          {K.badge.sampleTop}
        </span>
        <span style={{ fontSize: 17, fontWeight: 600, color: color.ink }}>
          {K.badge.sampleBottom}
        </span>
      </Squircle>
    </Card>
  );
}

function StatCardDemo() {
  return (
    <Card title={K.stat.title} hint={K.stat.hint} dark>
      <Squircle
        role="statCard"
        fill={color.white}
        style={{
          width: 120,
          height: 110,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: 600,
            color: color.ink,
            lineHeight: 1,
          }}
        >
          {K.stat.sampleNum}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: color.muted,
            marginTop: 6,
          }}
        >
          {K.stat.sampleLabel}
        </span>
      </Squircle>
    </Card>
  );
}

/* -------------------------------------------------------- Chips y campos --- */

function ChipsDemo() {
  return (
    <Card title={K.chips.title} hint={K.chips.hint} dark wide>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
        }}
      >
        {Object.values(CATEGORIES).map((c) => (
          <Squircle
            key={c.id}
            role="chip"
            fill={color.cardOnBrand}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 14px",
            }}
          >
            <Glyph name={c.glyph} size={16} color={color.lavender} />
            <span
              style={{ color: color.onBrand, fontSize: 14, fontWeight: 500 }}
            >
              {c.label}
            </span>
          </Squircle>
        ))}
      </div>
    </Card>
  );
}

function FieldDemo() {
  return (
    <Card title={K.field.title} hint={K.field.hint} dark wide>
      <Squircle
        role="field"
        fill={color.cardOnBrand}
        style={{
          width: 320,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 16px",
        }}
      >
        <SearchGlyph size={18} color={color.lavender} ambient={false} />
        <span style={{ color: color.lavender, fontSize: 15, fontWeight: 500 }}>
          {K.field.placeholder}
        </span>
      </Squircle>
    </Card>
  );
}

/* ----------------------------------------------------------------- Íconos --- */

function ActivityGlyphsDemo() {
  return (
    <Card title={K.glyphs.title} hint={K.glyphs.hint} dark wide>
      <img
        src={activityCluster}
        alt=""
        style={{ height: 132, width: "auto", display: "block" }}
      />
    </Card>
  );
}

function SearchGlyphDemo() {
  return (
    <Card title={K.lupa.title} hint={K.lupa.hint} dark>
      <SearchGlyph size={56} color={color.onBrand} />
    </Card>
  );
}

function UtilityIconsDemo() {
  return (
    <Card title={K.utils.title} hint={K.utils.hint} wide>
      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        <CrossIcon size={20} color={color.brand} plus />
        <CheckIcon size={20} color={color.brand} />
        <BookmarkIcon size={22} color={color.brand} />
        <ShareIcon size={22} color={color.brand} />
        <PersonIcon size={22} color={color.brand} />
      </div>
    </Card>
  );
}
