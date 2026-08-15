import { jobs } from "./mock-jobs";

export interface EstimateParams {
  jobId: string;
  outputFormat: string;
  fps: number | string;
  width: number | string;
  dither: string;
  crf: number;
  codec: string;
  audio?: boolean;
  fastCut?: boolean;
  trimStart: number;
  trimEnd: number;
}

let cancelled = false;
let pending = 0;

/**
 * Demo: a plausible size heuristic instead of the server's FFmpeg dry-run.
 * Rough models tuned to look believable, not to be accurate.
 */
export async function fetchEstimate(
  params: EstimateParams,
): Promise<number | null> {
  cancelled = false;
  const token = ++pending;

  // Simulate the server round-trip the UI debounces against.
  await new Promise((r) => setTimeout(r, 250));
  if (cancelled || token !== pending) return null;

  return estimateBytesSync(params);
}

export function estimateBytesSync(params: EstimateParams): number {
  const job = jobs.get(params.jobId);
  const srcW = job?.width || 1280;
  const srcH = job?.height || 720;
  const duration = Math.max(
    0.1,
    (params.trimEnd || job?.duration || 5) - (params.trimStart || 0),
  );

  const outW =
    typeof params.width === "number" && params.width > 0 ? params.width : srcW;
  const outH = Math.round(outW * (srcH / srcW));
  const fps = typeof params.fps === "number" ? params.fps : 30;

  if (params.outputFormat === "mp3") {
    return Math.round((192_000 / 8) * duration); // 192 kbps CBR
  }
  if (params.outputFormat === "gif") {
    // ~0.35 bytes per rendered pixel after palette compression.
    const ditherFactor = params.dither === "none" ? 0.8 : 1;
    return Math.round(outW * outH * fps * duration * 0.35 * ditherFactor);
  }
  // Video: CRF-relative bitrate, halved every +6 CRF, scaled by area.
  const areaScale = (outW * outH) / (1920 * 1080);
  const baseBps = 4_000_000 * Math.pow(2, (23 - params.crf) / 6) * areaScale;
  const codecScale = params.codec === "h265" ? 0.6 : 1;
  const audioBps = params.audio === false ? 0 : 128_000;
  return Math.round(((baseBps * codecScale + audioBps) / 8) * duration);
}

export function cancelEstimate(): void {
  cancelled = true;
}
