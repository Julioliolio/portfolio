import { createStore } from "solid-js/store";

export type OutputFormat =
  "gif" | "avi" | "mp4" | "mov" | "webm" | "mkv" | "mp3";

export interface AppState {
  outputFormat: OutputFormat;
  converting: boolean;
  currentJobId: string | null;
  progress: number;
  progressMsg: string;
  dither: string;
  codec: string;
  uploadJobId: string | null;
  uploadReady: boolean;
  // ── Input info (filled after upload) ────────────────────────────────────
  inputFormat: string | null; // e.g. "gif", "mp4", "avi"
  // ── Conversion parameters ───────────────────────────────────────────────
  fps: number;
  width: number; // GIF output width (px, 0 = original)
  vidWidth: number; // non-GIF output width (px, 0 = original)
  crf: number;
  audio: boolean; // keep audio track on non-GIF outputs
  fastCut: boolean; // stream-copy when input format === output format
}

const [appState, setAppState] = createStore<AppState>({
  outputFormat: "gif",
  converting: false,
  currentJobId: null,
  progress: 0,
  progressMsg: "",
  dither: "sierra2_4a",
  codec: "h264",
  uploadJobId: null,
  uploadReady: false,
  inputFormat: null,
  fps: 12,
  width: 640,
  vidWidth: 0, // 0 = original
  crf: 23,
  audio: true,
  fastCut: false, // off by default: stream-copy snaps cut points to the nearest
  // preceding keyframe, which silently extends the trim range —
  // for the "just crop a video" case the user expects an exact
  // cut. Toggle on for speed when an inexact cut is acceptable.
});

export { appState, setAppState };
