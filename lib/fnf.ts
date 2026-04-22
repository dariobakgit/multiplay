import { makeOptions, shuffle } from "./questions";

export interface FnfQuestion {
  a: number;
  b: number;
  answer: number;
  options: number[];
}

const HARD_POOL: Array<[number, number]> = (() => {
  const out: Array<[number, number]> = [];
  for (let a = 4; a <= 10; a++)
    for (let b = 4; b <= 10; b++) out.push([a, b]);
  return out;
})();

const EASY_POOL: Array<[number, number]> = (() => {
  const out: Array<[number, number]> = [];
  for (let a = 2; a <= 10; a++)
    for (let b = 2; b <= 10; b++) if (a < 4 || b < 4) out.push([a, b]);
  return out;
})();

/**
 * Generates a single FNF round question.
 * 70% of the time uses "hard" pairs (both factors ≥ 4); otherwise
 * an "easy" pair with at least one factor in {2,3}. Never table of 1.
 */
export function buildFnfQuestion(): FnfQuestion {
  const pool = Math.random() < 0.7 ? HARD_POOL : EASY_POOL;
  const [a, b] = pool[Math.floor(Math.random() * pool.length)];
  const answer = a * b;
  return { a, b, answer, options: makeOptions(answer, 4) };
}

// Re-export shuffle for convenience in clients if needed
export { shuffle };

export const FNF_WIN_POSITION = 10;
export const FNF_LOSE_POSITION = -10;
export const FNF_QUESTION_TIME_MS = 5000;
export const FNF_FEEDBACK_MS = 600;
