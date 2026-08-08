/**
 * Route-map mode chrome (the tag card's special map). A floating brand pill
 * at the top of the screen — same family as the selected-venue lozenge
 * (Figma 1277:3461) — marks that you're NOT on the normal map: the tag's
 * glyph + "Pere's pub crawl", with a white × square beside it that zooms you
 * back to the profile. Everything else on the map is hidden while it's up.
 */
import { motion } from 'framer-motion';
import { Squircle } from '../Squircle';
import { useMotion, usePressFeedback } from '../MotionProvider';
import { CrossIcon } from '../icons/CrossIcon';
import { color, device } from '../../theme/tokens';
import { PEOPLE, personTag, type PersonId } from '../../data/people';

const H = 56;

export function RouteBanner({ personId, onClose }: { personId: PersonId; onClose: () => void }) {
  const entrance = useMotion('entrance');
  const press = usePressFeedback();
  const person = PEOPLE[personId];
  const tag = personTag(person);
  const label = person.isMe
    ? `Your ${tag.routeLabel}`
    : `${person.firstName}’s ${tag.routeLabel}`;

  return (
    <motion.div
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -90, opacity: 0 }}
      transition={entrance}
      style={{
        position: 'absolute',
        left: 0,
        top: 62,
        width: device.width,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        zIndex: 22,
        filter: 'drop-shadow(0 4px 10px rgba(0,29,51,0.22))',
      }}
    >
      <Squircle
        role="lozenge"
        fill={color.brand}
        style={{
          height: H,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 22px 0 18px',
        }}
      >
        <img
          src={tag.pillGlyph}
          alt=""
          style={{ height: 30, width: 'auto', display: 'block', transform: 'rotate(-4deg)' }}
        />
        <span style={{ color: color.onBrand, fontSize: 16, fontWeight: 500, whiteSpace: 'nowrap' }}>
          {label}
        </span>
      </Squircle>
      <motion.button
        {...press}
        aria-label="Leave route map"
        onClick={onClose}
        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <Squircle
          role="lozenge"
          fill={color.offWhite}
          style={{ width: H, height: H, display: 'grid', placeItems: 'center' }}
        >
          <CrossIcon size={16} color={color.brand} />
        </Squircle>
      </motion.button>
    </motion.div>
  );
}
