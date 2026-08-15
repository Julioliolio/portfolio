import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { color } from "../../theme/tokens";
import { Squircle } from "../../components/Squircle";
import { SearchGlyph } from "../../components/icons/SearchGlyph";
import { usePressFeedback } from "../../components/MotionProvider";
import { dsWebCss } from "./dsWebStyles";
import { copy } from "./copy";
import { PrinciplesSection } from "./sections/PrinciplesSection";
import { ColorSection } from "./sections/ColorSection";
import { TypographySection } from "./sections/TypographySection";
import { SquircleSection } from "./sections/SquircleSection";
import { MotionSection } from "./sections/MotionSection";
import { ComponentsSection } from "./sections/ComponentsSection";
import { SignatureSection } from "./sections/SignatureSection";

/**
 * LocalPal — el sistema de diseño, en la web.
 *
 * Un sitio a pantalla completa, independiente de resolución, que muestra el
 * sistema de diseño del prototipo construido CON ese mismo sistema: <Squircle>s
 * de verdad, el registro de movimiento en vivo, PP Neue Montreal, el índigo de
 * marca. Estructura tipo Uber Base, con un tono que no vende nada: solo enseña
 * lo que hicimos.
 */

// Columna vertebral de secciones. `light` marca las que van sobre fondo claro
// (el cromo fijo pasa a tinta ahí).
// Labels come from copy.chrome.rail; here we only own id / number / ground.
const SECTIONS = [
  { id: "overview", label: copy.chrome.rail.overview, num: "00", light: false },
  {
    id: "principios",
    label: copy.chrome.rail.principios,
    num: "01",
    light: false,
  },
  { id: "color", label: copy.chrome.rail.color, num: "02", light: true },
  {
    id: "tipografia",
    label: copy.chrome.rail.tipografia,
    num: "03",
    light: true,
  },
  {
    id: "squircles",
    label: copy.chrome.rail.squircles,
    num: "04",
    light: false,
  },
  {
    id: "movimiento",
    label: copy.chrome.rail.movimiento,
    num: "05",
    light: true,
  },
  {
    id: "componentes",
    label: copy.chrome.rail.componentes,
    num: "06",
    light: true,
  },
  { id: "sello", label: copy.chrome.rail.sello, num: "07", light: false },
] as const;

export function DesignSystemWeb({ onExit }: { onExit: () => void }) {
  const [active, setActive] = useState("overview");
  const isLight = SECTIONS.find((s) => s.id === active)?.light ?? false;

  // Detecta qué sección está a la vista para encender el riel.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, []);

  return (
    <div className={"dsw-root" + (isLight ? " is-light" : "")}>
      <style>{dsWebCss}</style>

      <a href="#overview" className="dsw-wordmark">
        {copy.chrome.wordmark}
        <span>®</span>
      </a>

      <nav className="dsw-rail" aria-label="Secciones">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={"dsw-rail-item" + (active === s.id ? " is-active" : "")}
          >
            <span className="dsw-rail-num">{s.num}</span>
            <span className="dsw-rail-label">{s.label}</span>
          </a>
        ))}
      </nav>

      <button className="dsw-exit" onClick={onExit}>
        {copy.chrome.exit} <span aria-hidden>↗</span>
      </button>

      <main className="dsw-main">
        <Hero />
        <PrinciplesSection />
        <ColorSection />
        <TypographySection />
        <SquircleSection />
        <MotionSection />
        <ComponentsSection />
        <SignatureSection />
        <Footer onExit={onExit} />
      </main>
    </div>
  );
}

/* --------------------------------------------------------------- Hero --- */

function Hero() {
  // Entrance is CSS keyframes, NOT framer/rAF: preview tabs throttle rAF and
  // freeze mount animations at opacity 0 (see the raf-throttled note in the
  // codebase). CSS settles by wall-clock and fill-mode leaves it visible.
  return (
    <section id="overview" className="dsw-hero">
      <div className="dsw-hero-grain" aria-hidden />

      <div className="dsw-hero-inner">
        <p
          className="dsw-eyebrow dsw-reveal"
          style={{ animationDelay: "0.05s" }}
        >
          {copy.hero.eyebrow}
        </p>

        <h1 className="dsw-hero-title">
          {copy.hero.titleLines.map((line, i) => (
            <Line key={i} delay={0.1 + i * 0.08}>
              {line}
              {/* la lupa se cuela al final de la 3ª línea */}
              {i === 2 && (
                <span className="dsw-hero-glyph" aria-hidden>
                  <SearchGlyph
                    size={"0.82em" as unknown as number}
                    color={color.onBrand}
                  />
                </span>
              )}
            </Line>
          ))}
        </h1>

        <p
          className="dsw-hero-lede dsw-reveal"
          style={{ animationDelay: "0.5s" }}
        >
          {copy.hero.tagline}
        </p>

        <div
          className="dsw-hero-meta dsw-reveal"
          style={{ animationDelay: "0.66s" }}
        >
          {copy.hero.meta.map((m) => (
            <Meta key={m.k} k={m.k} v={m.v} />
          ))}
        </div>
      </div>

      <a
        href="#principios"
        className="dsw-scrollcue"
        aria-label={`Ir a ${copy.hero.scrollCue}`}
      >
        <span>{copy.hero.scrollCue}</span>
        <span className="dsw-scrollcue-line" />
      </a>
    </section>
  );
}

function Line({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <span className="dsw-hero-line">
      <span
        className="dsw-hero-line-inner"
        style={{ animationDelay: `${delay}s` }}
      >
        {children}
      </span>
    </span>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="dsw-metaitem">
      <span className="dsw-metaitem-k">{k}</span>
      <span className="dsw-metaitem-v">{v}</span>
    </div>
  );
}

/* ------------------------------------------------------------- Footer --- */

function Footer({ onExit }: { onExit: () => void }) {
  const press = usePressFeedback();
  return (
    <footer className="dsw-footer">
      <Squircle role="planCard" fill={color.brand} className="dsw-footer-card">
        <p className="dsw-footer-kicker">{copy.footer.kicker}</p>
        <p className="dsw-footer-line">{copy.footer.line}</p>
        <motion.button {...press} className="dsw-footer-cta" onClick={onExit}>
          <span>{copy.footer.cta}</span>
          <span aria-hidden>↗</span>
        </motion.button>
      </Squircle>
      <p className="dsw-footer-fine">{copy.footer.fine}</p>
    </footer>
  );
}
