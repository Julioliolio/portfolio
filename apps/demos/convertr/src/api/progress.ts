import { appState, setAppState } from '../state/app';
import { jobs } from './mock-jobs';
import { getActiveConversion } from './convert';

/**
 * Demo: replaces the server's SSE progress stream with a staged local
 * simulation. Same signatures and appState side effects as the real client.
 */

let timer: number | null = null;

function stagesFor(format: string): string[] {
  if (format === 'gif') return ['Analyzing video…', 'Building color palette…', 'Encoding GIF…'];
  if (format === 'mp3') return ['Extracting audio…', 'Encoding MP3…'];
  return ['Analyzing video…', 'Encoding video…', 'Finalizing…'];
}

export function listenProgress(
  jobId: string,
  onComplete: (resultUrl: string, filename: string, outputSize: number | null) => void,
  onError?: () => void,
): void {
  stopProgress();

  const job = jobs.get(jobId);
  const active = getActiveConversion();
  if (!job || !active) {
    setAppState('converting', false);
    onError?.();
    return;
  }

  const stages = stagesFor(active.outputFormat);
  const DURATION_MS = 3200;
  const started = performance.now();

  timer = window.setInterval(() => {
    const t = Math.min(1, (performance.now() - started) / DURATION_MS);
    // Ease-out so the bar sprints early and settles, like a real encode.
    const progress = Math.round(100 * (1 - Math.pow(1 - t, 2)));
    const stage = stages[Math.min(stages.length - 1, Math.floor(t * stages.length))]!;

    if (progress !== appState.progress) setAppState('progress', progress);
    if (stage !== appState.progressMsg) setAppState('progressMsg', stage);

    if (t >= 1) {
      stopProgress();
      if (appState.progress !== 100) setAppState('progress', 100);
      // Demo: the "converted" media is the source clip. The UI treats the
      // result as opaque bytes at a URL, so the flow stays identical.
      const base = job.name.replace(/\.[^.]+$/, '') || 'output';
      onComplete(job.objectUrl, `${base}.${active.outputFormat}`, active.outputSize);
    }
  }, 100);
}

export function stopProgress(): void {
  if (timer != null) {
    clearInterval(timer);
    timer = null;
  }
}
