export type ExamPoolSpec =
  | {
      type: "explicit";
      items: Array<{ a: number; b: number; weight?: number }>;
    }
  | {
      type: "multiplication";
      /** Porcentaje de preguntas "difíciles" (ambos factores ≥ hardMinFactor). */
      hardPercent: number;
      /** Umbral para considerar un factor "difícil". */
      hardMinFactor: number;
      excludeFactors?: number[];
    };

export interface ExamConfig {
  questionsCount: number;
  /** Nota mínima (1..10) para considerar pasado. */
  passGrade: number;
  pool: ExamPoolSpec;
}

export function validateExamConfig(raw: unknown): ExamConfig {
  if (!raw || typeof raw !== "object") {
    throw new Error("exam config must be an object");
  }
  const c = raw as Partial<ExamConfig>;
  if (typeof c.questionsCount !== "number" || c.questionsCount < 1 || c.questionsCount > 200) {
    throw new Error("exam.questionsCount must be 1..200");
  }
  if (typeof c.passGrade !== "number" || c.passGrade < 1 || c.passGrade > 10) {
    throw new Error("exam.passGrade must be 1..10");
  }
  const pool = c.pool;
  if (!pool || typeof pool !== "object" || !("type" in pool)) {
    throw new Error("exam.pool is required");
  }
  if (pool.type === "explicit") {
    if (!Array.isArray(pool.items) || pool.items.length === 0) {
      throw new Error("exam.pool.items must be a non-empty array");
    }
  } else if (pool.type === "multiplication") {
    if (typeof pool.hardPercent !== "number" || pool.hardPercent < 0 || pool.hardPercent > 1) {
      throw new Error("exam.pool.hardPercent must be 0..1");
    }
    if (typeof pool.hardMinFactor !== "number" || pool.hardMinFactor < 2) {
      throw new Error("exam.pool.hardMinFactor must be ≥ 2");
    }
  } else {
    throw new Error(`exam.pool.type unknown`);
  }
  return c as ExamConfig;
}
