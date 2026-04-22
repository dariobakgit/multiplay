"use client";

/**
 * Per-user streak tracking in localStorage.
 * - current: resets on wrong answer, persists across levels.
 * - best: high-water mark of current, only grows.
 */

function keys(userId: string) {
  return {
    current: `multiply-streak-${userId}`,
    best: `multiply-streak-best-${userId}`,
  };
}

function readNum(key: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(key);
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function loadCurrentStreak(userId: string): number {
  return readNum(keys(userId).current);
}

export function loadBestStreak(userId: string): number {
  return readNum(keys(userId).best);
}

/** Save current streak and bump best if surpassed. Returns the best after saving. */
export function saveStreak(userId: string, current: number): number {
  if (typeof window === "undefined") return 0;
  const k = keys(userId);
  window.localStorage.setItem(k.current, String(current));
  const best = readNum(k.best);
  if (current > best) {
    window.localStorage.setItem(k.best, String(current));
    return current;
  }
  return best;
}
