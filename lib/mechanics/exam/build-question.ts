import { shuffle } from "@/lib/questions";
import type { ExamConfig, ExamPoolSpec } from "./config";

export interface ExamQuestion {
  a: number;
  b: number;
  answer: number;
}

/** Genera la lista completa de preguntas del examen.
 *  Para "explicit" pool: muestrea con peso, evitando duplicados hasta
 *  agotar el pool.
 *  Para "multiplication" pool: divide en dos sub-pools (hard + easy)
 *  según `hardMinFactor` y muestrea cada uno con la proporción
 *  `hardPercent`. Sin tabla del 1 (o lo que esté en excludeFactors).
 */
export function buildExamQuestions(config: ExamConfig): ExamQuestion[] {
  const total = config.questionsCount;
  const pairs = sampleFromPool(config.pool, total);
  return pairs.map(([a, b]) => ({ a, b, answer: a * b }));
}

function sampleFromPool(
  pool: ExamPoolSpec,
  total: number,
): Array<[number, number]> {
  if (pool.type === "explicit") {
    const items = pool.items.map((i) => ({ a: i.a, b: i.b, weight: i.weight ?? 1 }));
    return weightedSampleWithoutReplacement(items, total).map((i) => [i.a, i.b]);
  }

  // multiplication: split en hard / easy.
  const hardPool: Array<[number, number]> = [];
  const easyPool: Array<[number, number]> = [];
  const exclude = new Set(pool.excludeFactors ?? []);
  for (let a = 2; a <= 10; a++) {
    if (exclude.has(a)) continue;
    for (let b = 2; b <= 10; b++) {
      if (exclude.has(b)) continue;
      const isHard = a >= pool.hardMinFactor && b >= pool.hardMinFactor;
      (isHard ? hardPool : easyPool).push([a, b]);
    }
  }

  const hardCount = Math.round(total * pool.hardPercent);
  const easyCount = total - hardCount;
  const picked: Array<[number, number]> = [
    ...sampleWithoutReplacement(hardPool, hardCount),
    ...sampleWithoutReplacement(easyPool, easyCount),
  ];
  return shuffle(picked);
}

function sampleWithoutReplacement<T>(arr: T[], n: number): T[] {
  if (n >= arr.length) return shuffle(arr.slice());
  return shuffle(arr.slice()).slice(0, n);
}

function weightedSampleWithoutReplacement<T extends { weight: number }>(
  items: T[],
  n: number,
): T[] {
  const remaining = items.slice();
  const out: T[] = [];
  while (out.length < n && remaining.length > 0) {
    const total = remaining.reduce((s, x) => s + Math.max(x.weight, 0), 0);
    if (total <= 0) {
      // fallback uniforme
      const i = Math.floor(Math.random() * remaining.length);
      out.push(remaining.splice(i, 1)[0]);
      continue;
    }
    let r = Math.random() * total;
    for (let i = 0; i < remaining.length; i++) {
      r -= Math.max(remaining[i].weight, 0);
      if (r <= 0) {
        out.push(remaining.splice(i, 1)[0]);
        break;
      }
    }
  }
  return out;
}

/** Mapea correctas (0..total) → nota (1..10) redondeada. */
export function gradeForCorrect(correct: number, total: number): number {
  const raw = (correct / total) * 10;
  return Math.max(1, Math.round(raw));
}
