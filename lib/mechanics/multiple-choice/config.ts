export type MCOptionsCount = 4 | 6 | 8;

/** Pool de preguntas: lista explícita o generador procedural. */
export type MCPoolSpec =
  | {
      type: "explicit";
      items: Array<{ a: number; b: number; weight?: number }>;
    }
  | {
      type: "multiplication";
      tables: number[];
      factors?: number[]; // default [1..10]
      includeCommutative?: boolean;
      excludeFactors?: number[]; // ej [1] para "sin tabla del 1"
    };

export interface MultipleChoiceConfig {
  questionsCount: number;
  minScore: number;
  optionsCount: MCOptionsCount;
  recentWindow: number;
  pool: MCPoolSpec;
}

/** Valida un config crudo (jsonb desde DB). Lanza si el shape no es válido. */
export function validateMCConfig(raw: unknown): MultipleChoiceConfig {
  if (!raw || typeof raw !== "object") {
    throw new Error("multiple_choice config must be an object");
  }
  const c = raw as Partial<MultipleChoiceConfig>;
  const num = (k: keyof MultipleChoiceConfig, min: number, max: number) => {
    const v = c[k];
    if (typeof v !== "number" || v < min || v > max) {
      throw new Error(`multiple_choice.${String(k)} must be a number in [${min}, ${max}]`);
    }
    return v;
  };
  const questionsCount = num("questionsCount", 1, 200);
  const minScore = num("minScore", 0, questionsCount);
  const optionsCount = c.optionsCount;
  if (optionsCount !== 4 && optionsCount !== 6 && optionsCount !== 8) {
    throw new Error("multiple_choice.optionsCount must be 4 | 6 | 8");
  }
  const recentWindow = num("recentWindow", 0, 50);
  const pool = c.pool;
  if (!pool || typeof pool !== "object" || !("type" in pool)) {
    throw new Error("multiple_choice.pool is required");
  }
  if (pool.type === "explicit") {
    if (!Array.isArray(pool.items) || pool.items.length === 0) {
      throw new Error("multiple_choice.pool.items must be a non-empty array");
    }
  } else if (pool.type === "multiplication") {
    if (!Array.isArray(pool.tables) || pool.tables.length === 0) {
      throw new Error("multiple_choice.pool.tables must be non-empty");
    }
  } else {
    throw new Error(`multiple_choice.pool.type unknown: ${(pool as { type: string }).type}`);
  }
  return { questionsCount, minScore, optionsCount, recentWindow, pool };
}
