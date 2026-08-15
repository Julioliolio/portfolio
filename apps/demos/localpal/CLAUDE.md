# LocalPal prototype — conventions

## Squircles & buttons must be registry-driven, never hard-coded

Every button and squircle-shaped surface must get its corner radius + smoothing
from the central registry, not from inline literals.

- Source of truth: `src/theme/squircles.ts` (`defaultSquircles`, one entry per role).
- Live store: `src/components/SquircleProvider.tsx` (`useSquircle(role)`), tunable
  from the **Lab → Squircles** tab.
- Usage: `<Squircle role="button">` etc. For non-`<Squircle>` surfaces (e.g. the
  morphing pill/sheet clip-path in `BottomBar`), read values via `useSquircle(role)`.
- When you add a new kind of button/surface, add a **new role** to
  `SQUIRCLE_ROLES` + `defaultSquircles` (it auto-appears in the Lab) and reference
  that role — do NOT pass literal `radius`/`smoothing`.

Current roles: `button` (search pill + calendar), `control` (round map buttons:
chat, locate), `sheet`, `field` (search input), `card`, `chip`, `avatar`.

### Squircle geometry note

A squircle needs a straight edge for corner-smoothing to show. If `radius >=` half
the element's shorter side it collapses to a full pill/circle and smoothing has no
effect. Keep radius below half the min dimension when a squircle look is wanted.

## Motion must be registry-driven — one personality, never inline springs

All animation feel comes from the central motion registry, never from inline
`stiffness`/`damping`/`duration`/`ease` literals.

- Source of truth: `src/theme/motion.ts` — ONE signature spring (perceptual
  `duration` + `bounce`); each role is a speed/bounce multiplier on it. Live
  store: `src/components/MotionProvider.tsx`, tunable from **Lab → Motion**.
- Usage: `useMotion(role)` → framer-motion `Transition`. `useMotionSim(role)` →
  per-frame `{k, damp}` for rAF physics sims (onboarding InterestBubbles).
  `usePressFeedback()` → spread onto a `motion.*` element for the shared touch
  squish. `useMotionExtras()` → `pressScale` / `entranceStagger` / `ambientEvery`.
- Roles: `press`, `snap` (click-into-place + glyph morphs), `morph` (surface
  reshaping), `entrance`, `pop` (bubble tap bump), `ambient` (idle flourish:
  SearchGlyph reflection spin), `inform` (progress/loading — also the mock-AI
  ThinkingTheater).
- The rule: **animate the interaction, not the information.** Things you touch
  or that change shape spring (fast commit, small overshoot, settle); `inform`
  is calm monotonic ease-out and must NEVER overshoot — a springy progress bar
  lies about state. New animated surface → reference a role, or add one to
  `MOTION_ROLES` + `defaultMotionRoles` (auto-appears in the Lab).
- Glyphs that visibly transform should morph geometry (`MorphSearchCross`)
  rather than cross-fade. Content-layer swaps inside morphing surfaces use the
  shared hierarchical zoom `layerZoomStyle(visible, 'parent' | 'child')` from
  `src/theme/motion.ts` — wall-clock CSS on purpose (rAF freezes in throttled
  tabs; see the note there). `'parent'` = a layer you zoomed through,
  `'child'` = a deeper view shrinking back into its origin.

## No baked Figma raster for UI chrome

Prefer real, resolution-independent elements (vector icons, styled `<Squircle>`,
real text/inputs) over exported PNGs, so nothing pixelates when zoomed. Extract
glyphs from Figma exports and rebuild the container as a `<Squircle>`.

## Other

- Tunable effect configs live in `src/theme/` and are editable live in the Lab
  (e.g. `floatShadow.ts`). Paste tuned values back into the theme file to persist.
- Font: PP Neue Montreal (`public/fonts`, `@font-face` in `index.css`).
