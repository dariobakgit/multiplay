import { MATH_LEVELS } from "./curriculum-math";
import { LANGUAGE_LEVELS } from "./curriculum-language";
import type { Level, MathLevel } from "./level-types";
import type { Track } from "./tracks";

export {
  Q_COUNT,
  MIN_PASS,
  type Level,
  type LevelKind,
  type MathLevel,
  type LanguageLevel,
  type LanguageTopic,
  type LanguageQuestionType,
} from "./level-types";

const REGISTRY: Record<Track, Level[]> = {
  math: MATH_LEVELS,
  language: LANGUAGE_LEVELS,
};

export function levelsFor(track: Track): Level[] {
  return REGISTRY[track];
}

export function totalLevels(track: Track): number {
  return REGISTRY[track].length;
}

export function getLevel(track: Track, id: number): Level | undefined {
  return REGISTRY[track].find((l) => l.id === id);
}

export function levelsByDay(track: Track, day: 1 | 2 | 3): Level[] {
  return REGISTRY[track].filter((l) => l.day === day);
}

/** First "learn" level for a given math table (part 1). Math only. */
export function findLearnLevelFor(table: number): MathLevel | undefined {
  return MATH_LEVELS.find(
    (l) =>
      l.kind === "learn" && l.tables[0] === table && (l.factors?.[0] ?? 1) === 1,
  );
}

type TFn = (key: string, vars?: Record<string, string | number>) => string;

export function formatLevelTitle(level: Level, t: TFn): string {
  return t(level.titleKey, level.titleVars);
}

export function formatLevelSubtitle(level: Level, t: TFn): string {
  return t(level.subtitleKey, level.subtitleVars);
}
