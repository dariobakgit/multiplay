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
  // Build the full pool of unique (a, b) pairs valid for this level.
  const pool: Array<[number, number]> = [];
  if (level.kind === "learn") {
    const t = level.tables[0];
    const factors = level.factors ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    for (const b of factors) pool.push([t, b]);
  } else {
    for (const t of level.tables) {
      for (let b = 1; b <= 10; b++) pool.push([t, b]);
    }
  }

  // Pick questions by exhausting a shuffled pool before reusing any pair.
  // Guarantees no repeats while pool size > picked count, and minimizes
  // repeats otherwise (each pair appears ⌈questions/pool⌉ times max).
  const picked: Array<[number, number]> = [];
  while (picked.length < level.questions) {
    const pass = shuffle(pool);
    // Avoid the boundary between passes producing the same question twice
    // in a row (e.g., last of pass N == first of pass N+1).
    if (picked.length > 0 && pass.length > 1) {
      const last = picked[picked.length - 1];
      if (pass[0][0] === last[0] && pass[0][1] === last[1]) {
        const swapWith = 1 + Math.floor(Math.random() * (pass.length - 1));
        [pass[0], pass[swapWith]] = [pass[swapWith], pass[0]];
      }
    }
    for (const pair of pass) {
      picked.push(pair);
      if (picked.length >= level.questions) break;
    }
  }

  const optionsCount = optionsCountForLevel(level.id);
  return picked.map(([a, b]) => {
    const answer = a * b;
    return { a, b, answer, options: makeOptions(answer, optionsCount) };
  });
}
