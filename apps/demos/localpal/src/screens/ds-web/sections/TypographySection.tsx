import { text } from '../../../theme/tokens';
import { copy } from '../copy';

/**
 * Tipografía. Tamaños/pesos salen de theme/tokens.ts; los textos (lede,
 * pangrama, etiquetas de la escala) viven en copy.ts (copy.tipografia).
 */
export function TypographySection() {
  const c = copy.tipografia;
  return (
    <section id="tipografia" className="dsw-section dsw-onlight">
      <header className="dsw-section-head">
        <p className="dsw-eyebrow">{c.eyebrow}</p>
        <h2 className="dsw-section-title">{c.title}</h2>
        <p className="dsw-section-lede">{c.lede}</p>
      </header>

      {/* Specimen */}
      <div className="dsw-type-specimen">
        <div className="dsw-type-aa" aria-hidden>Aa</div>
        <div className="dsw-type-pangram">{c.pangram}</div>
      </div>

      {/* Pesos */}
      <div className="dsw-type-weights">
        {c.weights.map((w) => (
          <div key={w.w} className="dsw-type-weight">
            <span className="dsw-type-weight-sample" style={{ fontWeight: w.w }}>
              Ag
            </span>
            <span className="dsw-type-weight-name">{w.name}</span>
            <span className="dsw-type-weight-num">{w.w}</span>
          </div>
        ))}
      </div>

      {/* Escala */}
      <div className="dsw-type-scale">
        {c.scale.map(({ key, label, use }) => {
          const t = text[key];
          return (
            <div key={key} className="dsw-type-row">
              <div className="dsw-type-row-meta">
                <span className="dsw-type-row-label">{label}</span>
                <span className="dsw-type-row-spec">
                  {t.size}/{t.line} · {t.weight}
                </span>
                <span className="dsw-type-row-use">{use}</span>
              </div>
              <div
                className="dsw-type-row-sample"
                style={{ fontSize: t.size, lineHeight: `${t.line}px`, fontWeight: t.weight }}
              >
                {c.sample}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
