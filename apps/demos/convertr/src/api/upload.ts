import { jobs, newJobId } from "./mock-jobs";

export interface ServerMeta {
  duration: number;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
}

export interface UploadResult {
  jobId: string;
  meta: ServerMeta;
  inputFormat: string;
}

/** Probe duration/dimensions client-side (the server used ffprobe). */
function probeMedia(
  file: File,
  objectUrl: string,
): Promise<{ duration: number; width: number; height: number }> {
  const isGif =
    file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
  if (isGif) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () =>
        resolve({
          duration: 3,
          width: img.naturalWidth || 1280,
          height: img.naturalHeight || 720,
        });
      img.onerror = () => resolve({ duration: 3, width: 1280, height: 720 });
      img.src = objectUrl;
    });
  }
  return new Promise((resolve) => {
    const vid = document.createElement("video");
    vid.preload = "metadata";
    let done = false;
    const finish = (meta: {
      duration: number;
      width: number;
      height: number;
    }) => {
      if (done) return;
      done = true;
      resolve(meta);
    };
    const timer = setTimeout(
      () => finish({ duration: 5, width: 1280, height: 720 }),
      2000,
    );
    vid.onloadedmetadata = () => {
      clearTimeout(timer);
      finish({
        duration:
          Number.isFinite(vid.duration) && vid.duration > 0 ? vid.duration : 5,
        width: vid.videoWidth || 1280,
        height: vid.videoHeight || 720,
      });
    };
    vid.onerror = () => {
      clearTimeout(timer);
      finish({ duration: 5, width: 1280, height: 720 });
    };
    vid.src = objectUrl;
  });
}

// Demo: no bytes leave the browser. We still animate a short upload ramp so
// the paced loading bar in IdleView behaves like the real app.
export function uploadFileWithProgress(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadResult | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const started = performance.now();
    const RAMP_MS = 600;

    const tick = () => {
      const pct = Math.min(
        100,
        ((performance.now() - started) / RAMP_MS) * 100,
      );
      onProgress?.(pct);
      if (pct < 100) {
        requestAnimationFrame(tick);
        return;
      }
      probeMedia(file, objectUrl).then((meta) => {
        const jobId = newJobId();
        jobs.set(jobId, {
          file,
          objectUrl,
          name: file.name,
          sizeBytes: file.size,
          duration: meta.duration,
          width: meta.width,
          height: meta.height,
        });
        const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
        resolve({
          jobId,
          meta: {
            ...meta,
            fps: 30,
            bitrate:
              meta.duration > 0
                ? Math.round((file.size * 8) / meta.duration)
                : 0,
          },
          inputFormat: ext,
        });
      });
    };
    requestAnimationFrame(tick);
  });
}
