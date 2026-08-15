import { copy } from "../copy";

/**
 * Principios — las tres reglas que sostienen todo lo demás. El texto vive en
 * copy.ts (copy.principios).
 */
export function PrinciplesSection() {
  const c = copy.principios;
  // `lede` es opcional: si lo añades a copy.principios, aparece; si no, se omite.
  const lede = (c as { lede?: string }).lede;
  return (
    <section id="principios" className="dsw-section">
      <header className="dsw-section-head">
        <p className="dsw-eyebrow">{c.eyebrow}</p>
        <h2 className="dsw-section-title">{c.title}</h2>
        {lede && <p className="dsw-section-lede">{lede}</p>}
      </header>

      <div className="dsw-principles">
        {c.items.map((p) => (
          <article key={p.n} className="dsw-principle">
            <span className="dsw-principle-n">{p.n}</span>
            <h3 className="dsw-principle-title">{p.title}</h3>
            <p className="dsw-principle-body">{p.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
