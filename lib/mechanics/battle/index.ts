import type { Mechanic } from "../types";
import { validateBattleConfig, type BattleConfig } from "./config";
import { BattleRenderer } from "./Renderer";

export const battle: Mechanic<BattleConfig> = {
  id: "battle",
  Renderer: BattleRenderer,
  validateConfig: validateBattleConfig,
};

export type { BattleConfig } from "./config";
export type { BattleQuestion } from "./build-question";
