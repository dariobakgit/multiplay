import { TRACKS, type Track } from "./tracks";
import { THEMES_BY_TRACK, type ThemeSlug } from "./themes";

export interface LevelResult {
  score: number;
  total: number;
  passed: boolean;
  at: number;
}

type PerLevel<T> = Record<number, T>;
type PerTheme<T> = Record<ThemeSlug, PerLevel<T>>;
type PerTrack<T> = Record<Track, PerTheme<T>>;

export interface Progress {
  results: PerTrack<LevelResult>;
  stars: PerTrack<number>;
}

export const EMPTY_PROGRESS: Progress = emptyProgress();

export function emptyProgress(): Progress {
  const results = {} as PerTrack<LevelResult>;
  const stars = {} as PerTrack<number>;
  for (const t of TRACKS) {
    const rByTheme = {} as PerTheme<LevelResult>;
    const sByTheme = {} as PerTheme<number>;
    for (const th of THEMES_BY_TRACK[t]) {
      rByTheme[th.slug] = {};
      sByTheme[th.slug] = {};
    }
    results[t] = rByTheme;
    stars[t] = sByTheme;
  }
  return { results, stars };
}

export function ensureBucket(
  p: Progress,
  track: Track,
  theme: ThemeSlug,
): void {
  if (!p.results[track][theme]) p.results[track][theme] = {};
  if (!p.stars[track][theme]) p.stars[track][theme] = {};
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
  theme: ThemeSlug,
  levelId: number,
  p: Progress,
): boolean {
  if (levelId === 1) return true;
  const prev = p.results[track]?.[theme]?.[levelId - 1];
  return !!prev?.passed;
}

/** True if the user has passed this level id in any (track, theme). */
export function hasPassedAnywhere(levelId: number, p: Progress): boolean {
  for (const t of TRACKS) {
    const themes = p.results[t] ?? {};
    for (const theme of Object.keys(themes)) {
      if (themes[theme][levelId]?.passed) return true;
    }
  }
  return false;
}

/** Levels passed in a single (track, theme). */
export function passedCountForTheme(
  track: Track,
  theme: ThemeSlug,
  p: Progress,
): number {
  const bucket = p.results[track]?.[theme] ?? {};
  return Object.values(bucket).filter((r) => r.passed).length;
}

/** Levels passed across all themes of a track. Used on the subject card. */
export function passedCountForTrack(track: Track, p: Progress): number {
  let n = 0;
  const themes = p.results[track] ?? {};
  for (const theme of Object.keys(themes)) {
    for (const r of Object.values(themes[theme])) {
      if (r.passed) n++;
    }
  }
  return n;
}

/** Distinct level ids passed across all (track, theme) — used for the
 * mascot library (mascot N unlocks if level N is passed anywhere). */
export function unlockedMascotCount(p: Progress): number {
  const ids = new Set<number>();
  for (const t of TRACKS) {
    const themes = p.results[t] ?? {};
    for (const theme of Object.keys(themes)) {
      for (const [id, r] of Object.entries(themes[theme])) {
        if (r.passed) ids.add(Number(id));
      }
    }
  }
  return ids.size;
}

export function overallPercent(
  track: Track,
  theme: ThemeSlug,
  p: Progress,
  total: number,
): number {
  if (total <= 0) return 0;
  return Math.round((passedCountForTheme(track, theme, p) / total) * 100);
}
