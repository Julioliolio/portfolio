/**
 * Demo-only in-memory job store. The desktop/server version of Convertr runs
 * FFmpeg behind these endpoints; the web demo keeps the exact same api/
 * signatures but resolves everything locally so the full user flow (upload →
 * settings → estimate → convert → result) works with zero backend.
 */

export interface MockJob {
  file: File | null;
  objectUrl: string;
  name: string;
  sizeBytes: number;
  duration: number; // seconds
  width: number;
  height: number;
}

export const jobs = new Map<string, MockJob>();

export function newJobId(): string {
  return `demo-${Math.random().toString(36).slice(2, 10)}`;
}
