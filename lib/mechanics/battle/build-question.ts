import { makeOptions } from "@/lib/questions";
import type { BattleConfig } from "./config";
import type { MCPoolSpec } from "../multiple-choice/config";

export interface BattleQuestion {
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
    for (const it of pool.items) push(it.a, it.b, it.weight ?? 1);
    return out;
  }
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

/**
 * Genera la próxima pregunta de batalla, evitando los pares en
 * `recentExclude` para no repetir preguntas inmediatas.
 */
export function buildNextBattleQuestion(
  config: BattleConfig,
  recentExclude: Array<[number, number]>,
): BattleQuestion {
  const pool = materializePool(config.pool);
  if (pool.length === 0) {
    throw new Error("battle pool materialized to empty");
  }
  const blocked = new Set(recentExclude.map(([a, b]) => `${a},${b}`));
  const fresh = pool.filter((p) => !blocked.has(`${p.a},${p.b}`));
  const candidates = fresh.length > 0 ? fresh : pool;
  const pick = weightedPick(candidates);
  const answer = pick.a * pick.b;
  return {
    a: pick.a,
    b: pick.b,
    answer,
    options: makeOptions(answer, config.optionsCount ?? 4),
  };
}
