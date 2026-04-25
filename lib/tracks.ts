export const TRACKS = ["math", "language"] as const;
export type Track = (typeof TRACKS)[number];

export const DEFAULT_TRACK: Track = "math";

export function isTrack(value: string): value is Track {
  return (TRACKS as readonly string[]).includes(value);
}

export function trackFromParam(value: string | undefined | null): Track | null {
  if (!value) return null;
  return isTrack(value) ? value : null;
}
