/**
 * ToyMap — the onboarding stage set. A paper city: pale land carved by
 * chunky white streets, a sky-blue river clipping the top-right corner,
 * mint parks along the right edge. Deliberately fake — decoration and
 * playground for the profile-sticker collage, NOT the real map. Only the
 * final exit dives through it into the real MapLibre city beneath.
 *
 * The city is the Figma artwork (assets/onboarding/toy-city-map.svg, fully
 * vectorized — crisp at any zoom, exit dive included), placed exactly as in
 * the "Frame 269" mock via theme/onboardingStage.ts `stageArt`.
 *
 * Motion is all wall-clock CSS (throttle-safe): each step nudges the stage
 * to its pose (theme/onboardingStage.ts), and `exiting` plays the
 * zoom-through — the toy world accelerates past the camera and fades,
 * revealing the real map already flying its landing dolly.
 */
import { layerZoom } from '../../theme/motion';
import {
  stagePalette,
  stageArt,
  stagePoses,
  stagePoseMs,
  stageExit,
} from '../../theme/onboardingStage';
import type { StepId } from './OnboardingFlow';
import toyCityMap from '../../assets/onboarding/toy-city-map.svg';

const P = stagePalette;

export function ToyMap({ step, exiting }: { step: StepId; exiting: boolean }) {
  const pose = stagePoses[step];
  const stageTransform = exiting
    ? `scale(${stageExit.scale})`
    : `translate(${pose.x}px, ${pose.y}px) scale(${pose.scale})`;

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: P.land,
        opacity: exiting ? 0 : 1,
        transition: exiting ? `opacity ${stageExit.ms}ms ${stageExit.ease}` : undefined,
        pointerEvents: 'none',
      }}
    >
      {/* pose layer — zooms/nudges about the screen center */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: stageTransform,
          transition: exiting
            ? `transform ${stageExit.ms}ms ${stageExit.ease}`
            : `transform ${stagePoseMs}ms ${layerZoom.ease}`,
          willChange: 'transform',
        }}
      >
        {/* the artwork, at native size, in its exact mock placement */}
        <img
          src={toyCityMap}
          alt=""
          width={stageArt.width}
          height={stageArt.height}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            maxWidth: 'none',
            transform: `translate(${stageArt.x}px, ${stageArt.y}px) rotate(${stageArt.rotate}deg)`,
            transformOrigin: '0 0',
          }}
        />
      </div>

      {/* Vignette — fixed to the screen (not the stage): a soft light wash
          behind the title and footer zones so ink text always reads. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            `linear-gradient(180deg, rgba(${P.vignette},0.85) 0%, rgba(${P.vignette},0) 32%, ` +
            `rgba(${P.vignette},0) 60%, rgba(${P.vignette},0.8) 100%)`,
        }}
      />
    </div>
  );
}
