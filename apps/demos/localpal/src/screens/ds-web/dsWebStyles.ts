/**
 * Scoped styles for the Design System web. Kept as one injected <style> block
 * (the site is a self-contained screen) rather than a global stylesheet, so it
 * never leaks into the phone prototype. All values trace back to theme/tokens.
 */
export const dsWebCss = /* css */ `
.dsw-root {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--brand);
  color: var(--white);
  font-family: var(--font);
  --dsw-rail-w: 210px;
  --dsw-gutter: clamp(20px, 6vw, 120px);
  --dsw-mono: 'PP Neue Montreal', ui-monospace, 'SF Mono', Menlo, monospace;
  scroll-behavior: smooth;
  /* Fixed-chrome color, flipped by .is-light as the ground changes. */
  --dsw-chrome: var(--white);
  --dsw-chrome-dim: color-mix(in srgb, var(--white) 45%, transparent);
  --dsw-accent: var(--lavender);
  transition: none;
}
.dsw-root.is-light {
  --dsw-chrome: var(--ink);
  --dsw-chrome-dim: color-mix(in srgb, var(--ink) 40%, transparent);
  --dsw-accent: var(--brand);
}
.dsw-root *::selection { background: var(--lavender); color: var(--brand); }

/* ---- Wordmark ---- */
.dsw-wordmark {
  position: fixed;
  top: 28px;
  left: var(--dsw-gutter);
  z-index: 30;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--dsw-chrome);
  text-decoration: none;
  transition: color 300ms cubic-bezier(0.22, 1, 0.36, 1);
}
.dsw-wordmark span { font-size: 0.6em; vertical-align: super; opacity: 0.7; margin-left: 1px; }

/* ---- Section rail ---- */
.dsw-rail {
  position: fixed;
  top: 50%;
  left: var(--dsw-gutter);
  transform: translateY(-50%);
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dsw-rail-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 5px 0;
  text-decoration: none;
  color: var(--dsw-chrome-dim);
  transition: color 220ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}
.dsw-rail-item:hover { color: var(--dsw-chrome); transform: translateX(3px); }
.dsw-rail-item.is-active { color: var(--dsw-chrome); }
.dsw-rail-item.is-active .dsw-rail-label::after { width: 100%; }
.dsw-rail-item.is-soon { pointer-events: none; opacity: 0.5; }
.dsw-rail-num {
  font-size: 10px;
  font-family: var(--dsw-mono);
  opacity: 0.7;
  font-feature-settings: 'tnum';
}
.dsw-rail-label {
  position: relative;
  font-size: 14px;
  font-weight: 500;
}
.dsw-rail-label::after {
  content: '';
  position: absolute;
  left: 0; bottom: -2px;
  width: 0; height: 1.5px;
  background: currentColor;
  transition: width 260ms cubic-bezier(0.22, 1, 0.36, 1);
}
.dsw-rail-soon {
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.6;
  border: 1px solid currentColor;
  border-radius: 4px;
  padding: 1px 3px;
}

/* ---- Exit ---- */
.dsw-exit {
  position: fixed;
  top: 24px;
  right: var(--dsw-gutter);
  z-index: 30;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 15px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  color: var(--white);
  background: var(--brand);
  box-shadow: 0 2px 12px rgba(20, 16, 80, 0.28);
  transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1),
    background 300ms cubic-bezier(0.22, 1, 0.36, 1);
}
.dsw-root:not(.is-light) .dsw-exit { color: var(--brand); background: var(--white); }
.dsw-exit:hover { transform: translateY(-1px); }
.dsw-exit span { transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1); }
.dsw-exit:hover span { transform: translate(2px, -2px); }

/* ---- Layout ---- */
.dsw-main { position: relative; }
.dsw-section {
  padding: clamp(80px, 12vh, 160px) var(--dsw-gutter);
  padding-left: calc(var(--dsw-gutter) + var(--dsw-rail-w));
}
.dsw-section-head { max-width: 780px; margin-bottom: clamp(40px, 6vh, 80px); }
.dsw-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--lavender);
}
.dsw-eyebrow::before {
  content: '';
  width: 22px; height: 1px;
  background: var(--lavender);
}
.dsw-section-title {
  margin: 0;
  font-size: clamp(40px, 7vw, 92px);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 0.98;
}
.dsw-section-lede {
  margin: 24px 0 0;
  max-width: 620px;
  font-size: clamp(16px, 1.5vw, 19px);
  line-height: 1.5;
  font-weight: 450;
  color: color-mix(in srgb, currentColor 74%, transparent);
}

/* ---- Hero ---- */
.dsw-hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 120px var(--dsw-gutter) 80px;
  padding-left: calc(var(--dsw-gutter) + var(--dsw-rail-w));
  overflow: hidden;
}
.dsw-hero-grain {
  position: absolute;
  inset: -20% -20% auto auto;
  width: 60vw; height: 60vw;
  background: radial-gradient(circle at 70% 30%,
    color-mix(in srgb, var(--lavender) 40%, transparent), transparent 62%);
  filter: blur(20px);
  pointer-events: none;
}
.dsw-hero-inner { position: relative; max-width: 1000px; }

/* CSS entrance (not rAF) so throttled preview tabs still settle it visible. */
@keyframes dsw-reveal {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}
@keyframes dsw-reveal-line {
  from { opacity: 0; transform: translateY(0.34em); }
  to { opacity: 1; transform: none; }
}
.dsw-reveal { animation: dsw-reveal 0.72s cubic-bezier(0.22, 1, 0.36, 1) both; }
.dsw-hero-line-inner {
  display: inline-block;
  animation: dsw-reveal-line 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@media (prefers-reduced-motion: reduce) {
  .dsw-reveal, .dsw-hero-line-inner { animation: none; }
}
.dsw-hero-title {
  margin: 22px 0 0;
  font-size: clamp(44px, 8.5vw, 120px);
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 0.96;
}
.dsw-hero-line { display: block; overflow: hidden; }
.dsw-hero-line-inner { display: inline-block; }
.dsw-hero-glyph {
  display: inline-flex;
  align-items: center;
  vertical-align: -0.06em;
  margin-left: 0.18em;
}
.dsw-hero-lede {
  margin: 36px 0 0;
  max-width: 540px;
  font-size: clamp(16px, 1.6vw, 20px);
  line-height: 1.5;
  font-weight: 450;
  color: color-mix(in srgb, var(--white) 82%, transparent);
}
.dsw-hero-meta {
  margin-top: 48px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px 40px;
}
.dsw-metaitem { display: flex; flex-direction: column; gap: 4px; }
.dsw-metaitem-k {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lavender);
}
.dsw-metaitem-v {
  font-size: 15px;
  font-weight: 500;
  font-family: var(--dsw-mono);
}
.dsw-scrollcue {
  position: absolute;
  bottom: 34px;
  left: calc(var(--dsw-gutter) + var(--dsw-rail-w));
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--white) 60%, transparent);
}
.dsw-scrollcue-line {
  width: 60px; height: 1px;
  background: currentColor;
  transform-origin: left;
  animation: dsw-cue 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}
@keyframes dsw-cue {
  0%, 100% { transform: scaleX(0.3); opacity: 0.4; }
  50% { transform: scaleX(1); opacity: 1; }
}

/* ---- Light-ground sections ---- */
.dsw-onlight { background: var(--off-white); color: var(--ink); }
.dsw-onlight .dsw-eyebrow { color: var(--brand); }
.dsw-onlight .dsw-eyebrow::before { background: var(--brand); }
.dsw-swatch-group { margin-top: 56px; }
.dsw-swatch-group:first-of-type { margin-top: 0; }
.dsw-swatch-group-head {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 22px;
  padding-bottom: 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
}
.dsw-swatch-group-title { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
.dsw-swatch-group-note { margin: 0; font-size: 14px; color: var(--muted); font-weight: 450; }
.dsw-swatch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(184px, 1fr));
  gap: 18px;
}
.dsw-swatch { display: flex; flex-direction: column; gap: 12px; }
.dsw-swatch-chip {
  height: 132px;
  width: 100%;
  display: flex;
  align-items: flex-end;
  padding: 12px;
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}
.dsw-swatch:hover .dsw-swatch-chip { transform: translateY(-4px); }
.dsw-swatch-onbrand-tag {
  position: absolute;
  top: 12px;
  left: 14px;
  z-index: 1;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 500;
  color: var(--lavender);
}
/* inset sample framed by the indigo chip bed */
.dsw-swatch-sample {
  position: absolute;
  inset: 40px 16px 16px;
  border-radius: 9px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
}
.dsw-swatch-meta { display: flex; flex-direction: column; gap: 3px; }
.dsw-swatch-name { font-size: 15px; font-weight: 500; letter-spacing: -0.01em; }
.dsw-swatch-hex {
  font-size: 13px;
  font-family: var(--dsw-mono);
  color: var(--muted);
  text-transform: uppercase;
}
.dsw-swatch-use { font-size: 13px; line-height: 1.4; color: var(--muted); font-weight: 450; }

/* ---- Footer ---- */
.dsw-footer {
  padding: clamp(60px, 9vh, 120px) var(--dsw-gutter);
  padding-left: calc(var(--dsw-gutter) + var(--dsw-rail-w));
}
.dsw-footer-card { max-width: 620px; padding: 40px; }
.dsw-footer-kicker {
  margin: 0 0 14px;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lavender);
}
.dsw-footer-line { margin: 0; font-size: 22px; line-height: 1.35; font-weight: 500; letter-spacing: -0.01em; }
.dsw-footer-cta {
  margin-top: 28px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 15px 26px;
  border-radius: 999px;
  background: var(--white);
  color: var(--brand);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
  box-shadow: 0 8px 24px rgba(10, 6, 60, 0.28);
}
.dsw-footer-cta span:last-child { transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1); }
.dsw-footer-cta:hover span:last-child { transform: translate(2px, -2px); }
.dsw-footer-fine { margin: 28px 0 0; font-size: 13px; color: color-mix(in srgb, var(--white) 60%, transparent); }

/* ---- Principles ---- */
.dsw-principles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 28px;
}
.dsw-principle {
  padding: 32px 30px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--white) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--white) 12%, transparent);
}
.dsw-principle-n {
  font-family: var(--dsw-mono);
  font-size: 13px;
  color: var(--lavender);
}
.dsw-principle-title {
  margin: 18px 0 12px;
  font-size: 24px;
  line-height: 1.15;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.dsw-principle-body {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  font-weight: 450;
  color: color-mix(in srgb, var(--white) 76%, transparent);
}

/* ---- Typography ---- */
.dsw-type-specimen {
  display: flex;
  align-items: center;
  gap: clamp(24px, 5vw, 72px);
  padding-bottom: 48px;
  margin-bottom: 48px;
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
  flex-wrap: wrap;
}
.dsw-type-aa {
  font-size: clamp(120px, 20vw, 240px);
  line-height: 0.8;
  font-weight: 600;
  letter-spacing: -0.04em;
  color: var(--brand);
}
.dsw-type-pangram {
  flex: 1;
  min-width: 260px;
  font-size: clamp(24px, 3vw, 38px);
  line-height: 1.2;
  font-weight: 450;
  letter-spacing: -0.02em;
}
.dsw-type-weights {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 56px;
}
.dsw-type-weight {
  flex: 1;
  min-width: 130px;
  padding: 22px 24px;
  border-radius: 16px;
  background: var(--white);
  border: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dsw-type-weight-sample { font-size: 44px; line-height: 1; letter-spacing: -0.02em; }
.dsw-type-weight-name { margin-top: 8px; font-size: 14px; font-weight: 500; }
.dsw-type-weight-num { font-size: 13px; font-family: var(--dsw-mono); color: var(--muted); }
.dsw-type-scale { display: flex; flex-direction: column; }
.dsw-type-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 32px;
  align-items: baseline;
  padding: 24px 0;
  border-top: 1px solid color-mix(in srgb, var(--ink) 10%, transparent);
}
.dsw-type-row-meta { display: flex; flex-direction: column; gap: 3px; }
.dsw-type-row-label { font-size: 15px; font-weight: 500; }
.dsw-type-row-spec { font-size: 13px; font-family: var(--dsw-mono); color: var(--brand); }
.dsw-type-row-use { font-size: 13px; color: var(--muted); }
.dsw-type-row-sample { color: var(--ink); letter-spacing: -0.02em; overflow: hidden; }

/* ---- Squircles ---- */
.dsw-sq-feeler {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 48px;
  align-items: center;
  margin-bottom: 72px;
  padding: 40px;
  border-radius: 24px;
  background: color-mix(in srgb, var(--white) 7%, transparent);
  border: 1px solid color-mix(in srgb, var(--white) 12%, transparent);
}
.dsw-sq-stage { display: grid; place-items: center; min-height: 240px; }
.dsw-sq-demo {
  width: 220px;
  height: 220px;
  display: grid;
  place-items: center;
}
.dsw-sq-demo-num {
  font-family: var(--dsw-mono);
  font-size: 40px;
  font-weight: 500;
  color: var(--brand);
}
.dsw-sq-controls { display: flex; flex-direction: column; gap: 22px; }
.dsw-sq-note {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: color-mix(in srgb, var(--white) 66%, transparent);
}
.dsw-slider { display: flex; flex-direction: column; gap: 10px; }
.dsw-slider-head { display: flex; justify-content: space-between; align-items: baseline; }
.dsw-slider-label { font-size: 14px; font-weight: 500; }
.dsw-slider-value { font-size: 14px; font-family: var(--dsw-mono); color: var(--lavender); }
.dsw-slider-input {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--white) 22%, transparent);
  outline: none;
  cursor: pointer;
}
.dsw-slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px; height: 20px;
  border-radius: 999px;
  background: var(--white);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.dsw-slider-input::-moz-range-thumb {
  width: 20px; height: 20px; border: none;
  border-radius: 999px; background: var(--white);
}
.dsw-sq-roles-head {
  display: flex; align-items: baseline; gap: 14px;
  margin-bottom: 24px; padding-bottom: 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--white) 16%, transparent);
}
.dsw-sq-roles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;
}
.dsw-sq-role { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
.dsw-sq-role-stage {
  width: 100%; height: 96px;
  display: grid; place-items: center;
  border-radius: 14px;
  background: color-mix(in srgb, var(--white) 6%, transparent);
}
.dsw-sq-role-chip { width: 60px; height: 60px; }
.dsw-sq-role-label { font-size: 13px; font-weight: 500; }
.dsw-sq-role-spec { font-size: 11px; font-family: var(--dsw-mono); color: var(--lavender); }

/* ---- Motion ---- */
.dsw-motion-sig {
  display: flex; align-items: center; gap: 32px; flex-wrap: wrap;
  padding: 32px 36px; margin-bottom: 48px;
  border-radius: 22px; background: var(--white);
  border: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
}
.dsw-motion-sig-figure { display: flex; align-items: flex-end; gap: 28px; }
.dsw-motion-sig-k {
  font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--brand);
  align-self: center;
}
.dsw-motion-sig-v { font-size: 44px; font-weight: 600; letter-spacing: -0.02em; line-height: 1; }
.dsw-motion-sig-v em { font-style: normal; font-size: 14px; color: var(--muted); margin-left: 6px; font-weight: 500; }
.dsw-motion-sig-note { flex: 1; min-width: 220px; margin: 0; font-size: 15px; line-height: 1.5; color: var(--muted); }
.dsw-motion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 18px;
}
.dsw-motion-tile {
  padding: 0; border-radius: 18px; overflow: hidden;
  background: var(--white);
  border: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
  cursor: pointer;
  transition: transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms cubic-bezier(0.22,1,0.36,1);
}
.dsw-motion-tile:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(20,16,80,0.12); }
.dsw-motion-stage {
  height: 130px; display: grid; place-items: center;
  background: color-mix(in srgb, var(--brand) 6%, var(--off-white));
  overflow: hidden;
}
.dsw-motion-track { width: 148px; height: 56px; display: flex; align-items: center; }
.dsw-motion-progress { width: 140px; height: 8px; border-radius: 999px; background: color-mix(in srgb, var(--ink) 10%, transparent); overflow: hidden; }
.dsw-motion-progress-fill { height: 100%; background: var(--brand); border-radius: 999px; }
.dsw-motion-tile-meta { display: flex; flex-direction: column; gap: 4px; padding: 16px 18px 18px; }
.dsw-motion-tile-title { font-size: 15px; font-weight: 600; }
.dsw-motion-tile-spec { font-size: 12px; font-family: var(--dsw-mono); color: var(--brand); }
.dsw-motion-tile-hint { font-size: 13px; line-height: 1.4; color: var(--muted); }

/* ---- Components ---- */
.dsw-comp-group { margin-top: 56px; }
.dsw-comp-group:first-of-type { margin-top: 0; }
.dsw-comp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 20px;
}
.dsw-comp-card {
  border-radius: 20px; overflow: hidden;
  background: var(--white);
  border: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
}
.dsw-comp-card.is-wide { grid-column: span 2; }
.dsw-comp-stage {
  height: 180px; display: grid; place-items: center; padding: 20px;
  background: color-mix(in srgb, var(--brand) 5%, var(--off-white));
  overflow: hidden;
}
.dsw-comp-stage.is-dark { background: var(--brand); }
.dsw-comp-meta { display: flex; flex-direction: column; gap: 4px; padding: 16px 20px 20px; }
.dsw-comp-title { font-size: 15px; font-weight: 600; }
.dsw-comp-hint { font-size: 13px; line-height: 1.4; color: var(--muted); }
.dsw-comp-bubbles { position: relative; width: 100%; height: 100%; min-height: 150px; }
.dsw-comp-dayslider { position: relative; width: 100%; display: grid; place-items: center; transform: scale(0.9); }

/* ---- Signature ---- */
.dsw-sig-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
.dsw-sig-card { display: flex; flex-direction: column; }
.dsw-sig-stage {
  position: relative;
  height: 200px; border-radius: 20px;
  display: grid; place-items: center;
  background: color-mix(in srgb, var(--white) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--white) 12%, transparent);
  overflow: hidden;
  margin-bottom: 20px;
}
.dsw-sig-stage.is-light { background: var(--off-white); border-color: transparent; }
.dsw-sig-tag {
  position: absolute; top: 12px; right: 12px;
  font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 3px 8px; border-radius: 999px;
  color: color-mix(in srgb, var(--white) 60%, transparent);
  border: 1px solid color-mix(in srgb, var(--white) 24%, transparent);
}
.dsw-sig-stage.is-light .dsw-sig-tag { color: var(--muted); border-color: color-mix(in srgb, var(--ink) 18%, transparent); }
.dsw-sig-tag.is-live { color: var(--brand); border-color: var(--brand); }
.dsw-sig-stage.is-light .dsw-sig-tag.is-live { color: var(--brand); border-color: var(--brand); }
.dsw-sig-title { margin: 0 0 8px; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }
.dsw-sig-body { margin: 0; font-size: 14px; line-height: 1.55; font-weight: 450; color: color-mix(in srgb, var(--white) 74%, transparent); }
.dsw-sig-meniscus {
  position: absolute; left: -30px; top: 50%; transform: translateY(-50%);
  width: 80px; height: 150px;
  background: #000;
  border-radius: 0 60% 60% 0 / 0 50% 50% 0;
}
.dsw-sig-cluster { position: relative; width: 120px; height: 80px; display: grid; place-items: center; }
.dsw-sig-morph { display: flex; align-items: center; gap: 18px; }
.dsw-sig-morph-arrow { font-size: 22px; color: var(--lavender); }

/* ---- Responsive: fold the rail away on narrow screens ---- */
@media (max-width: 900px) {
  .dsw-root { --dsw-rail-w: 0px; }
  .dsw-rail { display: none; }
  .dsw-scrollcue { left: var(--dsw-gutter); }
  .dsw-sq-feeler { grid-template-columns: 1fr; gap: 32px; }
  .dsw-type-row { grid-template-columns: 1fr; gap: 8px; }
  .dsw-comp-card.is-wide { grid-column: span 1; }
}`;
