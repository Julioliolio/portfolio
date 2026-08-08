import { Squircle } from '../../../components/Squircle';
import { color } from '../../../theme/tokens';
import { copy } from '../copy';

/**
 * Color. Los valores salen de theme/tokens.ts (fuente de verdad); los nombres,
 * notas y descripciones viven en copy.ts (copy.color). Las muestras son
 * <Squircle>s reales.
 */

type Swatch = {
  name: string;
  value: string;
  use: string;
  alpha?: boolean;
  outline?: boolean;
};

export function ColorSection() {
  const c = copy.color;
  return (
    <section id="color" className="dsw-section dsw-onlight">
      <header className="dsw-section-head">
        <p className="dsw-eyebrow">{c.eyebrow}</p>
        <h2 className="dsw-section-title">{c.title}</h2>
        <p className="dsw-section-lede">{c.lede}</p>
      </header>

      {c.groups.map((g) => (
        <div key={g.title} className="dsw-swatch-group">
          <div className="dsw-swatch-group-head">
            <h3 className="dsw-swatch-group-title">{g.title}</h3>
            <p className="dsw-swatch-group-note">{g.note}</p>
          </div>
          <div className="dsw-swatch-grid">
            {g.swatches.map((s) => (
              <SwatchCard key={s.name} s={s} tag={c.onIndigoTag} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function SwatchCard({ s, tag }: { s: Swatch; tag: string }) {
  return (
    <div className="dsw-swatch">
      <Squircle
        role="card"
        fill={s.alpha ? color.brand : s.value}
        stroke={s.outline ? 'rgba(0,29,51,0.12)' : undefined}
        className="dsw-swatch-chip"
      >
        {s.alpha && (
          <>
            <span className="dsw-swatch-onbrand-tag">{tag}</span>
            <div className="dsw-swatch-sample" style={{ background: s.value }} aria-hidden />
          </>
        )}
      </Squircle>
      <div className="dsw-swatch-meta">
        <span className="dsw-swatch-name">{s.name}</span>
        <span className="dsw-swatch-hex">{s.value}</span>
      </div>
      <p className="dsw-swatch-use">{s.use}</p>
    </div>
  );
}
