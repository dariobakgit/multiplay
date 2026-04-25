import { MATH_LEVELS } from "./curriculum-math";
import { LANGUAGE_LEVELS } from "./curriculum-language";
import type { Level, MathLevel } from "./level-types";
import type { Track } from "./tracks";
import type { ThemeSlug } from "./themes";

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

const REGISTRY: Record<Track, Record<ThemeSlug, Level[]>> = {
  math: {
    tables: MATH_LEVELS,
  },
  language: {
    "nouns-verbs": LANGUAGE_LEVELS,
  },
};

export function hasTheme(track: Track, theme: string): boolean {
  return REGISTRY[track][theme] !== undefined;
}

export function levelsFor(track: Track, theme: ThemeSlug): Level[] {
  return REGISTRY[track][theme] ?? [];
}

export function totalLevels(track: Track, theme: ThemeSlug): number {
  return REGISTRY[track][theme]?.length ?? 0;
}

export function getLevel(
  track: Track,
  theme: ThemeSlug,
  id: number,
): Level | undefined {
  return (REGISTRY[track][theme] ?? []).find((l) => l.id === id);
}

export function levelsByDay(
  track: Track,
  theme: ThemeSlug,
  day: 1 | 2 | 3,
): Level[] {
  return (REGISTRY[track][theme] ?? []).filter((l) => l.day === day);
}

/** First "learn" level for a given math table (part 1). Math/tables only. */
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
