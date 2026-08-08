/**
 * Stickers — the pieces of your profile that assemble on the ToyMap cluster
 * as you answer.
 *
 *  - GlyphSticker: an interest pick — the SAME bare blue glyphs the peer
 *    profiles wear top-right (tag-cocktail / tag-runner + the pin icon set),
 *    no background tile, just a white sticker halo + a little shadow.
 *  - ProfileBadge: you — the EXACT profile-page construction: the
 *    placeholder-grid avatar (IconPlaceholder, no sticker framing, always
 *    the placeholder — never a real photo) with the boxed name plates
 *    painting over its bottom edge (first name brand, last name muted).
 *
 * PERF: the idle bobs are CSS keyframes (`lp-onb-bob`, declared by
 * OnboardingFlow), NOT framer loops — they run on the compositor with zero
 * main-thread work. Critically, each bob lives on the SAME element as the
 * sticker's filter stack, so the filtered result rasterizes once and then
 * just gets composited; a bob on a child would re-render every filter pass
 * every frame. Entrances (`pop`/`entrance` roles) are finite framer springs.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { useMotion } from '../MotionProvider';
import { useFloatShadow } from '../FloatShadowProvider';
import { useScramble } from '../useScramble';
import { figmaIcons } from '../icons/figmaIcons';
import { IconPlaceholder } from '../icons/IconPlaceholder';
import { color } from '../../theme/tokens';
import { CLUSTER } from '../../theme/onboardingStage';
import tagCocktail from '../../assets/profile/tag-cocktail.svg';
import tagRunner from '../../assets/profile/tag-runner.svg';

/** Sticker art per INTEREST_GLYPH key — peer-profile tag glyphs where they
 *  exist, the matching pin icons for the rest (all blue-bodied SVGs). */
const STICKER_ART: Record<string, string> = {
  cocktail: tagCocktail,
  chipSports: tagRunner,
  music: figmaIcons.music,
  utensils: figmaIcons.utensils,
  coffee: figmaIcons.coffee,
  museum: figmaIcons.museum,
};

/** White sticker halo (4 orthogonal silhouette copies — enough at this size)
 *  + a little shadow. Kept lean: every pass re-renders the whole silhouette. */
function useStickerFilter() {
  const s = useFloatShadow();
  const o = 2.5;
  return (
    `drop-shadow(${o}px 0 0 ${color.white}) drop-shadow(-${o}px 0 0 ${color.white}) ` +
    `drop-shadow(0 ${o}px 0 ${color.white}) drop-shadow(0 -${o}px 0 ${color.white}) ` +
    `drop-shadow(0 4px 8px rgba(${s.color},0.28))`
  );
}

/** The shared compositor bob (keyframes declared once by OnboardingFlow). */
function useBobAnimation(phase = 0) {
  const float = useMotion('float');
  const dur = ((float as { duration?: number }).duration ?? 1) * 2;
  return {
    animation: `lp-onb-bob ${dur}s ease-in-out infinite`,
    animationDelay: `${-phase * dur}s`,
    willChange: 'transform',
  } as const;
}

/** An interest pick, slapped onto the cluster. */
export function GlyphSticker({ icon, rot = 0 }: { icon: string; rot?: number }) {
  const pop = useMotion('pop');
  const filter = useStickerFilter();
  const bob = useBobAnimation(Math.abs(rot) / 12);
  const src = STICKER_ART[icon];

  return (
    <motion.div
      initial={{ scale: 0, rotate: rot * 4, opacity: 0 }}
      animate={{ scale: 1, rotate: rot, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.18 } }}
      transition={pop}
      style={{ willChange: 'transform' }}
    >
      <div style={{ filter, ...bob }}>
        {src && (
          <img src={src} alt="" style={{ height: CLUSTER.stickerSize, width: 'auto', display: 'block' }} />
        )}
      </div>
    </motion.div>
  );
}

/** You, building up mid-playground: the profile page's own avatar + boxed
 *  name plates (ProfileFlow header construction), assembled live. */
export function ProfileBadge({
  name,
  lastName,
  hasAvatar,
}: {
  name: string;
  lastName: string;
  hasAvatar: boolean;
}) {
  const entrance = useMotion('entrance');
  const pop = useMotion('pop');
  const snap = useMotion('snap');
  const bob = useBobAnimation(0.5);
  const snapMs = ((snap as { duration?: number }).duration ?? 0.3) * 1000;
  const label = useScramble(name, snapMs);
  const lastLabel = useScramble(lastName, snapMs);
  const { size, overlap } = CLUSTER.avatar;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.18 } }}
      transition={entrance}
      style={{ willChange: 'transform' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ...bob }}>
        <AnimatePresence>
          {hasAvatar && (
            <motion.div
              key="avatar"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0, transition: { duration: 0.18 } }}
              transition={pop}
            >
              <IconPlaceholder size={size} />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Boxed name plates, painting over the avatar's bottom edge — the
            profile-header construction, centered so long names grow evenly
            to both sides. Last-name plate only exists once one is typed. */}
        <motion.div
          initial={false}
          animate={{ y: hasAvatar ? -overlap : 0 }}
          transition={snap}
          style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <div style={{ background: color.offWhite, padding: 4, zIndex: 2 }}>
            <span style={{ color: color.brand, fontSize: 24, fontWeight: 500, lineHeight: '26px', whiteSpace: 'nowrap' }}>
              {label}
            </span>
          </div>
          {lastName !== '' && (
            <div style={{ marginTop: -8, background: color.offWhite, padding: 4, opacity: 0.9, zIndex: 1 }}>
              <span style={{ color: color.muted, fontSize: 24, fontWeight: 400, lineHeight: '26px', opacity: 0.6, whiteSpace: 'nowrap' }}>
                {lastLabel}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
