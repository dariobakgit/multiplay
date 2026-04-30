import { makeOptions, shuffle } from "@/lib/questions";
import type { MultipleChoiceConfig, MCPoolSpec } from "./config";

export interface MCQuestion {
  a: number;
  b: number;
  answer: number;
  options: number[];
}

interface PoolItem {
  a: number;
  b: number;
  weight: number;
}

/** Materializa el pool a una lista plana con peso default 1. */
function materializePool(pool: MCPoolSpec): PoolItem[] {
  const seen = new Set<string>();
  const out: PoolItem[] = [];
  const push = (a: number, b: number, weight = 1) => {
    const k = `${a},${b}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ a, b, weight });
  };

  if (pool.type === "explicit") {
    for (const item of pool.items) push(item.a, item.b, item.weight ?? 1);
    return out;
  }

  // multiplication: producto cruzado tables × factors, opcionalmente con
  // sus conmutativos.
  const factors = pool.factors ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const exclude = new Set(pool.excludeFactors ?? []);
  for (const t of pool.tables) {
    if (exclude.has(t)) continue;
    for (const f of factors) {
      if (exclude.has(f)) continue;
      push(t, f);
      if (pool.includeCommutative) push(f, t);
    }
  }
  return out;
}

/** Pick ponderado random de un array de items con pesos. */
function weightedPick<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, x) => s + Math.max(x.weight, 0), 0);
  if (total <= 0) return items[Math.floor(Math.random() * items.length)];
  let r = Math.random() * total;
  for (const x of items) {
    r -= Math.max(x.weight, 0);
    if (r <= 0) return x;
  }
  return items[items.length - 1];
}

/** Genera la próxima pregunta dada la historia reciente.
 *  Filtra items que aparecen en las últimas `recentWindow` preguntas
 *  para minimizar repeticiones. Si todo el pool está "ventaneado", usa
 *  el pool entero.
 */
export function buildNextMCQuestion(
  config: MultipleChoiceConfig,
  history: MCQuestion[],
): MCQuestion {
  const pool = materializePool(config.pool);
  if (pool.length === 0) {
    throw new Error("multiple_choice pool materialized to empty");
  }
  const window = Math.max(0, Math.min(config.recentWindow, pool.length - 1));
  const recent = new Set(
    history.slice(-window).map((q) => `${q.a},${q.b}`),
  );
  const fresh = pool.filter((p) => !recent.has(`${p.a},${p.b}`));
  const candidates = fresh.length > 0 ? fresh : pool;
  const pick = weightedPick(candidates);
  const answer = pick.a * pick.b;
  return {
    a: pick.a,
    b: pick.b,
    answer,
    options: makeOptions(answer, config.optionsCount),
  };
}

/** Construye toda la lista de preguntas del nivel de una sola pasada. */
export function buildMCQuestions(config: MultipleChoiceConfig): MCQuestion[] {
  const out: MCQuestion[] = [];
  for (let i = 0; i < config.questionsCount; i++) {
    out.push(buildNextMCQuestion(config, out));
  }
  // Defensive shuffle of the final list — already varied by the picker
  // but extra entropy doesn't hurt.
  return shuffle(out);
}
