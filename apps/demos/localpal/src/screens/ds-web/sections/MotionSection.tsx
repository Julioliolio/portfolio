import { useState } from 'react';
import { motion } from 'framer-motion';
import { Squircle } from '../../../components/Squircle';
import { SearchGlyph } from '../../../components/icons/SearchGlyph';
import { color } from '../../../theme/tokens';
import { useMotion, useMotionExtras, usePressFeedback } from '../../../components/MotionProvider';
import { defaultMotionRoles, defaultSignature } from '../../../theme/motion';
import { copy } from '../copy';

const T = copy.movimiento.tiles;

/**
 * Movimiento. Una sola firma de resorte para todo (theme/motion.ts): 250 ms,
 * rebote 0.23. Cada papel es un multiplicador de velocidad y rebote sobre esa
 * firma. Todas las demos usan useMotion(papel) real — tócalas.
 */

export function MotionSection() {
  const sig = defaultSignature;
  const c = copy.movimiento;

  return (
    <section id="movimiento" className="dsw-section dsw-onlight">
      <header className="dsw-section-head">
        <p className="dsw-eyebrow">{c.eyebrow}</p>
        <h2 className="dsw-section-title">{c.title}</h2>
        <p className="dsw-section-lede">{c.lede}</p>
      </header>

      {/* Firma */}
      <div className="dsw-motion-sig">
        <div className="dsw-motion-sig-figure">
          <span className="dsw-motion-sig-k">{c.sigLabel}</span>
          <span className="dsw-motion-sig-v">
            {sig.duration}
            <em>ms</em>
          </span>
          <span className="dsw-motion-sig-v">
            {sig.bounce}
            <em>rebote</em>
          </span>
        </div>
        <p className="dsw-motion-sig-note">{c.sigNote}</p>
      </div>

      {/* Papeles */}
      <div className="dsw-motion-grid">
        <PressDemo />
        <SnapDemo />
        <MorphDemo />
        <EntranceDemo />
        <PopDemo />
        <AmbientDemo />
        <FloatDemo />
        <InformDemo />
      </div>
    </section>
  );
}

function Tile({
  role,
  title,
  hint,
  children,
  onClick,
}: {
  role: keyof typeof defaultMotionRoles;
  title: string;
  hint: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const t = defaultMotionRoles[role];
  return (
    <article className="dsw-motion-tile" onClick={onClick}>
      <div className="dsw-motion-stage">{children}</div>
      <div className="dsw-motion-tile-meta">
        <span className="dsw-motion-tile-title">{title}</span>
        <span className="dsw-motion-tile-spec">
          ×{t.speed} vel · ×{t.bounce} reb
        </span>
        <span className="dsw-motion-tile-hint">{hint}</span>
      </div>
    </article>
  );
}

function Block({ style }: { style?: React.CSSProperties }) {
  return (
    <Squircle role="button" fill={color.brand} style={{ width: 56, height: 56, ...style }} />
  );
}

function PressDemo() {
  const press = usePressFeedback();
  return (
    <Tile role="press" title={T.press.title} hint={T.press.hint}>
      <motion.div {...press} style={{ cursor: 'pointer' }}>
        <Block />
      </motion.div>
    </Tile>
  );
}

function SnapDemo() {
  const snap = useMotion('snap');
  const [on, setOn] = useState(false);
  return (
    <Tile role="snap" title={T.snap.title} hint={T.snap.hint} onClick={() => setOn((v) => !v)}>
      <div className="dsw-motion-track">
        <motion.div animate={{ x: on ? 92 : 0 }} transition={snap}>
          <Block />
        </motion.div>
      </div>
    </Tile>
  );
}

function MorphDemo() {
  const morph = useMotion('morph');
  const [big, setBig] = useState(false);
  return (
    <Tile role="morph" title={T.morph.title} hint={T.morph.hint} onClick={() => setBig((v) => !v)}>
      <motion.div animate={{ width: big ? 128 : 56, height: 56 }} transition={morph}>
        <Squircle role="button" fill={color.brand} style={{ width: '100%', height: '100%' }} />
      </motion.div>
    </Tile>
  );
}

function EntranceDemo() {
  const entrance = useMotion('entrance');
  const [k, setK] = useState(0);
  return (
    <Tile role="entrance" title={T.entrance.title} hint={T.entrance.hint} onClick={() => setK((v) => v + 1)}>
      <motion.div
        key={k}
        initial={{ opacity: 0, scale: 0.4, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={entrance}
      >
        <Block />
      </motion.div>
    </Tile>
  );
}

function PopDemo() {
  const pop = useMotion('pop');
  const [k, setK] = useState(0);
  return (
    <Tile role="pop" title={T.pop.title} hint={T.pop.hint} onClick={() => setK((v) => v + 1)}>
      <motion.div key={k} initial={{ scale: 1.35 }} animate={{ scale: 1 }} transition={pop}>
        <Squircle role="control" fill={color.brand} style={{ width: 56, height: 56, borderRadius: 999 }} />
      </motion.div>
    </Tile>
  );
}

function AmbientDemo() {
  const { ambientEvery } = useMotionExtras();
  return (
    <Tile role="ambient" title={T.ambient.title} hint={T.ambient.hint.replace('{n}', String(ambientEvery))}>
      <SearchGlyph size={52} color={color.brand} />
    </Tile>
  );
}

function FloatDemo() {
  const float = useMotion('float');
  return (
    <Tile role="float" title={T.float.title} hint={T.float.hint}>
      <motion.div
        animate={{ y: [-9, 9] }}
        transition={{ ...float, repeat: Infinity, repeatType: 'reverse' }}
      >
        <Block />
      </motion.div>
    </Tile>
  );
}

function InformDemo() {
  const inform = useMotion('inform');
  const [k, setK] = useState(0);
  return (
    <Tile role="inform" title={T.inform.title} hint={T.inform.hint} onClick={() => setK((v) => v + 1)}>
      <div className="dsw-motion-progress">
        <motion.div
          key={k}
          className="dsw-motion-progress-fill"
          initial={{ width: '4%' }}
          animate={{ width: '100%' }}
          transition={inform}
        />
      </div>
    </Tile>
  );
}
