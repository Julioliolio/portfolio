/**
 * What the project window picks up: a print's clip, where it is and
 * what it plays (window.tsx grows its box out of it). On its own so the
 * prints can measure one without bringing the window along — the
 * window is a chunk of its own, loaded as a project opens.
 */

/** A rectangle on the screen, in px. */
export type WindowRect = { x: number; y: number; w: number; h: number };

/** The print the box grows out of and shrinks back into: its clip,
 *  where it is on the mat and what it plays. */
export type WindowPreview = {
  rect: WindowRect;
  /** The clip's src; the box plays it, muted, while it moves. */
  src: string;
  /** Where the clip was, s: the box's copy starts there, so the frame
   *  never jumps. */
  time?: number;
  /** That frame, as a data URL: shown until the box's copy has it. */
  poster?: string;
  /** When `time` was read, performance.now() ms: anything that picks
   *  the clip up later adds what has played since (see clipTimeNow). */
  at?: number;
  /** The print's own video: on the way out the box hands its progress
   *  back, so the print carries on from there. */
  video?: HTMLVideoElement;
  /** A print's lean on the mat, degrees: the box starts turned by it and
   *  straightens as it lifts. 0 for a clip with no frame. */
  tilt?: number;
  /** A print's frame round its picture, px — the paper above, right of,
   *  below (the band) and left of the clip. The box starts as the whole
   *  print with the clip inset by this, and the inset closes as it
   *  grows. All 0 for a bare clip. */
  inset?: { top: number; right: number; bottom: number; left: number };
};

/** Where a clip that kept playing since `preview` was taken is now, s. */
export function clipTimeNow(preview: WindowPreview): number {
  const since = preview.at ? (performance.now() - preview.at) / 1000 : 0;
  return (preview.time ?? 0) + since;
}

/**
 * A print's clip as the window wants it: its rect on the mat (the
 * caller's, which may have to undo a transform), the file, the frame
 * it is on, and a snapshot of that frame so the box shows the very
 * same picture from its first paint while its own copy seeks there.
 */
export function clipPreview(
  video: HTMLVideoElement,
  rect: WindowRect,
  extra: Pick<WindowPreview, "tilt" | "inset"> = {},
): WindowPreview {
  let poster: string | undefined;
  if (video.videoWidth > 0 && video.readyState >= 2) {
    try {
      const c = document.createElement("canvas");
      c.width = video.videoWidth;
      c.height = video.videoHeight;
      c.getContext("2d")?.drawImage(video, 0, 0);
      poster = c.toDataURL("image/jpeg", 0.85);
    } catch {
      poster = undefined;
    }
  }
  return {
    rect,
    src: video.currentSrc || video.src,
    time: video.currentTime,
    poster,
    at: performance.now(),
    video,
    ...extra,
  };
}
