import { TOTAL_LEVELS } from "./curriculum";

export interface LevelResult {
  score: number;
  total: number;
  passed: boolean;
  at: number;
}

export interface Progress {
  results: Record<number, LevelResult>;
  stars: Record<number, number>;
}

export const EMPTY_PROGRESS: Progress = { results: {}, stars: {} };

export function computeStars(score: number, total: number): number {
  const pct = score / total;
  if (pct >= 0.95) return 3;
  if (pct >= 0.85) return 2;
  if (pct >= 0.75) return 1;
  return 0;
}

export function isUnlocked(levelId: number, p: Progress): boolean {
  if (levelId === 1) return true;
  const prev = p.results[levelId - 1];
  return !!prev?.passed;
}

export function overallPercent(p: Progress): number {
  const passed = Object.values(p.results).filter((r) => r.passed).length;
  return Math.round((passed / TOTAL_LEVELS) * 100);
}
