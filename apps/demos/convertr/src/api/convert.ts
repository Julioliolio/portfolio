import { appState, setAppState } from '../state/app';
import { jobs } from './mock-jobs';
import { estimateBytesSync } from './estimate';

/**
 * Demo: "conversion" is a staged simulation. We remember what was requested so
 * progress.ts can play the right script and report a coherent output size;
 * the result media is the source clip itself.
 */
export interface ActiveConversion {
  jobId: string;
  outputFormat: string;
  trimStart: number;
  trimEnd: number;
  outputSize: number;
}

let active: ActiveConversion | null = null;

export function getActiveConversion(): ActiveConversion | null {
  return active;
}

export async function startConversion(
  trimStart?: number,
  trimEnd?: number,
): Promise<string | null> {
  const jobId = appState.uploadJobId || appState.currentJobId;
  const job = jobId ? jobs.get(jobId) : undefined;
  if (!jobId || !job) return null;

  const widthPx = appState.outputFormat === 'gif' ? appState.width : appState.vidWidth;

  const outputSize = estimateBytesSync({
    jobId,
    outputFormat: appState.outputFormat,
    fps: Math.round(appState.fps),
    width: appState.outputFormat === 'mp3' ? 'original' : widthPx > 0 ? widthPx : 'original',
    dither: appState.dither,
    crf: appState.crf,
    codec: appState.codec,
    audio: appState.audio,
    fastCut: appState.fastCut,
    trimStart: trimStart ?? 0,
    trimEnd: trimEnd ?? job.duration,
  });

  active = {
    jobId,
    outputFormat: appState.outputFormat,
    trimStart: trimStart ?? 0,
    trimEnd: trimEnd ?? job.duration,
    outputSize,
  };

  setAppState('currentJobId', jobId);
  return jobId;
}
