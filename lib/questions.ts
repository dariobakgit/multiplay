import type { Level } from "./curriculum";

export interface Question {
  a: number;
  b: number;
  answer: number;
  options: number[];
}

/**
 * Number of answer choices per question — grows with level.
 * +2 options every 4 levels, starting at 4, capped at 8.
 *   Lv 1-4: 4  · Lv 5-8: 6  · Lv 9+: 8
 */
export function optionsCountForLevel(levelId: number): number {
  return Math.min(8, 4 + 2 * Math.floor((levelId - 1) / 4));
}

export function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function makeOptions(answer: number, count: number): number[] {
  const opts = new Set<number>([answer]);
  const pool: number[] = [];
  // plausible distractors: nearby products
  for (let d = 1; d <= 12; d++) {
    pool.push(answer + d, answer - d, answer + d * 2, answer - d * 2);
  }
  const filtered = pool.filter((n) => n > 0 && n !== answer && n <= 120);
  const shuffled = shuffle(filtered);
  for (const n of shuffled) {
    if (opts.size >= count) break;
    opts.add(n);
  }
  while (opts.size < count) {
    const n = Math.max(1, Math.floor(Math.random() * 100));
    if (n !== answer) opts.add(n);
  }
  return shuffle(Array.from(opts));
}

export function buildQuestions(level: Level): Question[] {
  // Build the unique pool of (a, b) pairs valid for this level.
  const pool: Array<[number, number]> = [];
  const seen = new Set<string>();
  const addPair = (a: number, b: number) => {
    const key = `${a},${b}`;
    if (!seen.has(key)) {
      seen.add(key);
      pool.push([a, b]);
    }
  };

  if (level.kind === "learn") {
    const t = level.tables[0];
    const factors = level.factors ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    // Include both (t, b) and its commutative twin (b, t). Same result,
    // different look — almost doubles the pool for learn levels
    // (5 → ~9 pairs) and teaches that a × b = b × a.
    for (const b of factors) {
      addPair(t, b);
      addPair(b, t);
    }
  } else {
    for (const t of level.tables) {
      for (let b = 1; b <= 10; b++) addPair(t, b);
    }
  }

  // Greedy pick with a "recent window" so no pair repeats within the
  // last N picks unless the pool is smaller than the window.
  const recentWindow = Math.max(1, Math.min(pool.length - 1, 6));
  const picked: Array<[number, number]> = [];
  while (picked.length < level.questions) {
    const recent = new Set(
      picked.slice(-recentWindow).map(([a, b]) => `${a},${b}`),
    );
    const fresh = pool.filter(([a, b]) => !recent.has(`${a},${b}`));
    const source = fresh.length > 0 ? fresh : pool;
    const pick = source[Math.floor(Math.random() * source.length)];
    picked.push(pick);
  }

  const optionsCount = optionsCountForLevel(level.id);
  return picked.map(([a, b]) => {
    const answer = a * b;
    return { a, b, answer, options: makeOptions(answer, optionsCount) };
  });
}
