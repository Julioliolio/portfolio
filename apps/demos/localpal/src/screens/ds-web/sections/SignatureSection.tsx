import { Squircle } from "../../../components/Squircle";
import { SearchGlyph } from "../../../components/icons/SearchGlyph";
import { color } from "../../../theme/tokens";
import floatingShadow from "../../../assets/ds-web/floating-shadow.svg";
import { copy } from "../copy";

const C = copy.sello;

/**
 * Sello — los gestos que hacen que la app se sienta suya. Donde la pieza es
 * autónoma, va en vivo (sombra flotante, lupa que orbita). Los gestos atados al
 * mapa se ilustran con una miniatura y se cuentan con palabras.
 */

export function SignatureSection() {
  return (
    <section id="sello" className="dsw-section">
      <header className="dsw-section-head">
        <p className="dsw-eyebrow">{C.eyebrow}</p>
        <h2 className="dsw-section-title">{C.title}</h2>
        <p className="dsw-section-lede">{C.lede}</p>
      </header>

      <div className="dsw-sig-grid">
        <FloatCard />
        <GlyphCard />
        <EdgeZoomCard />
        <ClusterCard />
        <MorphCard />
      </div>
    </section>
  );
}

function SigCard({
  title,
  body,
  live,
  light,
  children,
}: {
  title: string;
  body: string;
  live?: boolean;
  light?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className="dsw-sig-card">
      <div className={"dsw-sig-stage" + (light ? " is-light" : "")}>
        {children}
        <span className={"dsw-sig-tag" + (live ? " is-live" : "")}>
          {live ? C.tags.live : C.tags.concept}
        </span>
      </div>
      <h3 className="dsw-sig-title">{title}</h3>
      <p className="dsw-sig-body">{body}</p>
    </article>
  );
}

function FloatCard() {
  return (
    <SigCard title={C.cards.float.title} body={C.cards.float.body} light>
      <img
        src={floatingShadow}
        alt=""
        style={{ width: 190, height: "auto", display: "block" }}
      />
    </SigCard>
  );
}

function GlyphCard() {
  return (
    <SigCard title={C.cards.glyph.title} body={C.cards.glyph.body} live>
      <SearchGlyph size={72} color={color.onBrand} />
    </SigCard>
  );
}

function EdgeZoomCard() {
  return (
    <SigCard title={C.cards.edgeZoom.title} body={C.cards.edgeZoom.body}>
      <div className="dsw-sig-meniscus" aria-hidden />
    </SigCard>
  );
}

function ClusterCard() {
  return (
    <SigCard title={C.cards.cluster.title} body={C.cards.cluster.body} light>
      <div className="dsw-sig-cluster" aria-hidden>
        {[
          { rot: -9, x: -20, z: 1 },
          { rot: 8, x: 20, z: 2 },
          { rot: 5, x: 0, z: 3 },
        ].map((t, i) => (
          <Squircle
            key={i}
            role="pin"
            fill={color.brand}
            stroke={color.white}
            strokeWidth={2}
            style={{
              position: "absolute",
              width: 44,
              height: 44,
              transform: `translateX(${t.x}px) rotate(${t.rot}deg)`,
              zIndex: t.z,
            }}
          />
        ))}
      </div>
    </SigCard>
  );
}

function MorphCard() {
  return (
    <SigCard title={C.cards.morph.title} body={C.cards.morph.body}>
      <div className="dsw-sig-morph" aria-hidden>
        <Squircle
          role="button"
          fill={color.onBrand}
          style={{ width: 64, height: 40 }}
        />
        <span className="dsw-sig-morph-arrow">⇄</span>
        <Squircle
          role="sheet"
          fill={color.onBrand}
          style={{ width: 108, height: 64 }}
        />
      </div>
    </SigCard>
  );
}
