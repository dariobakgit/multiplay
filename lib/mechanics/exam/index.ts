import type { Mechanic } from "../types";
import { validateExamConfig, type ExamConfig } from "./config";
import { ExamRenderer } from "./Renderer";

export const exam: Mechanic<ExamConfig> = {
  id: "exam",
  Renderer: ExamRenderer,
  validateConfig: validateExamConfig,
};

export type { ExamConfig, ExamPoolSpec } from "./config";
export type { ExamQuestion } from "./build-question";
export { gradeForCorrect } from "./build-question";
