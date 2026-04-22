export interface ExamQuestion {
  a: number;
  b: number;
  answer: number;
}

const TOTAL = 20;
const HARD_COUNT = 14; // ≥70% with both factors ≥ 4

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Builds a 20-question exam:
 *  - No factor can be 1 (no table of 1).
 *  - At least 70% (14 of 20) have BOTH factors ≥ 4. The rest can include
 *    factors 2 or 3, but never 1.
 *  - No repeated pairs.
 */
export function buildExam(): ExamQuestion[] {
  const hardPool: Array<[number, number]> = [];
  for (let a = 4; a <= 10; a++) {
    for (let b = 4; b <= 10; b++) hardPool.push([a, b]);
  }
  // 7×7 = 49 unique pairs — plenty for 14.

  const easyPool: Array<[number, number]> = [];
  for (let a = 2; a <= 10; a++) {
    for (let b = 2; b <= 10; b++) {
      if (a < 4 || b < 4) easyPool.push([a, b]);
    }
  }
  // 81 - 49 = 32 unique pairs — plenty for 6.

  const picked: Array<[number, number]> = [
    ...shuffle(hardPool).slice(0, HARD_COUNT),
    ...shuffle(easyPool).slice(0, TOTAL - HARD_COUNT),
  ];

  return shuffle(picked).map(([a, b]) => ({ a, b, answer: a * b }));
}

/** Maps correct-count (0-20) to a 1-10 grade, rounded to an integer. */
export function gradeForScore(correct: number, total = TOTAL): number {
  const raw = (correct / total) * 10;
  return Math.max(1, Math.round(raw));
}

export const EXAM_TOTAL = TOTAL;
