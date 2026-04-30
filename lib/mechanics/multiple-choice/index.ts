import type { Mechanic } from "../types";
import { validateMCConfig, type MultipleChoiceConfig } from "./config";
import { MultipleChoiceRenderer } from "./Renderer";

export const multipleChoice: Mechanic<MultipleChoiceConfig> = {
  id: "multiple_choice",
  Renderer: MultipleChoiceRenderer,
  validateConfig: validateMCConfig,
};

export type { MultipleChoiceConfig, MCPoolSpec } from "./config";
export type { MCQuestion } from "./build-question";
