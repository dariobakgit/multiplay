import type { MCPoolSpec } from "../multiple-choice/config";

export interface BattleConfig {
  /** Mismo shape que multiple_choice (explicit con peso o generador
   *  multiplication). */
  pool: MCPoolSpec;
  questionTimeMs: number;
  feedbackMs: number;
  winPosition: number;
  losePosition: number;
  /** Default 4 — cantidad de opciones por pregunta. */
  optionsCount?: 4 | 6 | 8;
  /** Override visual del nombre del enemigo. */
  enemyName?: string;
}

export function validateBattleConfig(raw: unknown): BattleConfig {
  if (!raw || typeof raw !== "object") {
    throw new Error("battle config must be an object");
  }
  const c = raw as Partial<BattleConfig>;
  if (!c.pool || typeof c.pool !== "object" || !("type" in c.pool)) {
    throw new Error("battle.pool is required");
  }
  if (typeof c.questionTimeMs !== "number" || c.questionTimeMs < 1000) {
    throw new Error("battle.questionTimeMs must be ≥ 1000");
  }
  if (typeof c.feedbackMs !== "number" || c.feedbackMs < 100) {
    throw new Error("battle.feedbackMs must be ≥ 100");
  }
  if (typeof c.winPosition !== "number" || c.winPosition <= 0) {
    throw new Error("battle.winPosition must be > 0");
  }
  if (typeof c.losePosition !== "number" || c.losePosition >= 0) {
    throw new Error("battle.losePosition must be < 0");
  }
  return c as BattleConfig;
}
