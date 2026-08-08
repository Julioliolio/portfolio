/**
 * "Are you sure?" confirmation — an iOS action-sheet PATTERN (slides up from the
 * bottom, dims everything behind it, a separate Cancel below the affirmative
 * action) styled ON-BRAND rather than in system chrome: white grouped card +
 * brand-blue primary, PP Neue Montreal.
 *
 * Reused for every commit-worthy action (joining a peer plan, creating a plan…):
 * the caller passes a `config` describing the prompt + what to do on confirm.
 * It's a transient modal, not a navigation sheet — so it deliberately layers
 * over whatever card is open; cancelling or tapping the dimmed backdrop just
 * closes it and leaves that card untouched.
 *
 * Sits a touch narrower than the sheets it covers so its edges don't line up
 * with the card edges behind it. Registry-driven per CLAUDE.md: `sheet`/`cta`
 * squircle roles, `morph` motion, shared press squish — no literal radii/springs.
 */
import { AnimatePresence, motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { Squircle } from './Squircle';
import { useMotion, usePressFeedback } from './MotionProvider';
import { color } from '../theme/tokens';

export type ConfirmConfig = {
  /** Prompt, e.g. "Join this plan?" */
  title: string;
  /** Optional context line under the title, e.g. the plan's name. */
  subtitle?: string;
  /** Affirmative button label, e.g. "Join plan". */
  confirmLabel: string;
  /** Ran when the affirmative button is tapped (the sheet closes after). */
  onConfirm: () => void;
};

const buttonReset: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  width: '100%',
};

export function ConfirmSheet({
  config,
  onClose,
}: {
  /** The active confirmation, or null when closed. */
  config: ConfirmConfig | null;
  /** Cancel button / backdrop tap — dismiss without confirming. */
  onClose: () => void;
}) {
  const morph = useMotion('morph');
  const press = usePressFeedback();

  return (
    <AnimatePresence>
      {config && (
        <motion.div
          key="confirm"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 30, // above the CtaRow (21) and dismiss-scrim (15)
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          {/* Dimmed backdrop — tapping it cancels, iOS-style. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={morph}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }}
          />

          {/* The action sheet — slides up as one group + a detached Cancel.
              Inset from the 361-wide sheets below so its edges don't coincide
              with theirs. */}
          <motion.div
            // Travel the sheet's full height PLUS the 64px bottom gap so it
            // clears the screen entirely — a bare 110% leaves its top edge
            // peeking at the bottom until React unmounts it (a visible linger).
            initial={{ y: 'calc(100% + 64px)' }}
            animate={{ y: 0 }}
            exit={{ y: 'calc(100% + 64px)' }}
            transition={morph}
            style={{
              position: 'relative',
              width: 329,
              // Inset from the 361-wide / 48-from-bottom sheets on all sides
              // (~16px) so no edge — sides or bottom — lines up with the card
              // behind it.
              marginBottom: 64,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {/* Grouped card: prompt + affirmative action */}
            <Squircle
              role="sheet"
              fill={color.offWhite}
              style={{
                padding: '20px 16px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  textAlign: 'center',
                  padding: '0 8px',
                }}
              >
                <span style={{ color: color.ink, fontSize: 20, fontWeight: 600, lineHeight: '24px' }}>
                  {config.title}
                </span>
                {config.subtitle && (
                  <span style={{ color: color.muted, fontSize: 14, fontWeight: 400, lineHeight: '18px' }}>
                    {config.subtitle}
                  </span>
                )}
              </div>

              <motion.button
                {...press}
                onClick={() => {
                  config.onConfirm();
                  onClose();
                }}
                style={buttonReset}
              >
                <Squircle
                  role="cta"
                  fill={color.brand}
                  style={{ width: '100%', height: 56, display: 'grid', placeItems: 'center' }}
                >
                  <span style={{ color: color.onBrand, fontSize: 20, fontWeight: 600 }}>
                    {config.confirmLabel}
                  </span>
                </Squircle>
              </motion.button>
            </Squircle>

            {/* Detached Cancel */}
            <motion.button {...press} onClick={onClose} style={buttonReset}>
              <Squircle
                role="cta"
                fill={color.offWhite}
                style={{ width: '100%', height: 56, display: 'grid', placeItems: 'center' }}
              >
                <span style={{ color: color.brand, fontSize: 20, fontWeight: 600 }}>Cancel</span>
              </Squircle>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
