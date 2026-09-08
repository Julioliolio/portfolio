export interface BBoxTargets {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const DEFAULT_ASPECT = 16 / 9;

// The idle bbox occupies a moderate centered area. The W/H ratios are
// balanced so that as the idle aspect cycles (see IDLE_RATIOS in IdleView),
// both width AND height change — letting the existing top→bottom / left→right
// stagger in IdleView's guide-transition effect read clearly.
const IDLE_W_RATIO = 0.6;
const IDLE_H_RATIO = 0.65;

// The default centered box; mediaAspect lets the idle bbox cycle through
// common video shapes (passed in by IdleView for the spin-driven cycle).
export function calculateBBoxTargets(
  canvasW: number,
  canvasH: number,
  mediaAspect: number | null,
): BBoxTargets {
  if (canvasW <= 0 || canvasH <= 0) {
    return { x1: 0, y1: 0, x2: 0, y2: 0 };
  }
  const aspect = mediaAspect ?? DEFAULT_ASPECT;
  let bboxW = canvasW * IDLE_W_RATIO;
  let bboxH = canvasH * IDLE_H_RATIO;
  const currentAspect = bboxW / bboxH;
  if (currentAspect > aspect) {
    bboxW = bboxH * aspect;
  } else {
    bboxH = bboxW / aspect;
  }
  const x1 = (canvasW - bboxW) / 2;
  const y1 = (canvasH - bboxH) / 2;
  return { x1, y1, x2: x1 + bboxW, y2: y1 + bboxH };
}
