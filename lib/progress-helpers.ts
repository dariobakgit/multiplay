import { TRACKS, type Track } from "./tracks";

export interface LevelResult {
  score: number;
  total: number;
  passed: boolean;
  at: number;
}

type PerTrack<T> = Record<Track, Record<number, T>>;

export interface Progress {
  results: PerTrack<LevelResult>;
  stars: PerTrack<number>;
}

export const EMPTY_PROGRESS: Progress = emptyProgress();

export function emptyProgress(): Progress {
  return {
    results: TRACKS.reduce(
      (acc, t) => ({ ...acc, [t]: {} }),
      {} as PerTrack<LevelResult>,
    ),
    stars: TRACKS.reduce(
      (acc, t) => ({ ...acc, [t]: {} }),
      {} as PerTrack<number>,
    ),
  };
}

export function computeStars(score: number, total: number): number {
  const pct = score / total;
  if (pct >= 0.95) return 3;
  if (pct >= 0.85) return 2;
  if (pct >= 0.75) return 1;
  return 0;
}

export function isUnlocked(
  track: Track,
  levelId: number,
  p: Progress,
): boolean {
  if (levelId === 1) return true;
  const prev = p.results[track][levelId - 1];
  return !!prev?.passed;
}

/** True if the user has passed this level id in any track. Used by the
 * mascot library, where mascot N unlocks if you pass level N anywhere. */
export function hasPassedAnywhere(levelId: number, p: Progress): boolean {
  return TRACKS.some((t) => p.results[t][levelId]?.passed === true);
}

/** Total levels passed in a single track. */
export function passedCountFor(track: Track, p: Progress): number {
  return Object.values(p.results[track]).filter((r) => r.passed).length;
}

/** Levels passed across both tracks (deduped by id). */
export function unlockedMascotCount(p: Progress): number {
  const ids = new Set<number>();
  for (const t of TRACKS) {
    for (const [id, r] of Object.entries(p.results[t])) {
      if (r.passed) ids.add(Number(id));
    }
  }
  return ids.size;
}

export function overallPercent(track: Track, p: Progress, total: number): number {
  if (total <= 0) return 0;
  return Math.round((passedCountFor(track, p) / total) * 100);
}
