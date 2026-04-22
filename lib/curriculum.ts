export type LevelKind = "learn" | "mix";

export interface Level {
  id: number;
  day: 1 | 2 | 3;
  /** i18n key + vars for the level title. */
  titleKey: string;
  titleVars?: Record<string, string | number>;
  /** i18n key + vars for the subtitle. */
  subtitleKey: string;
  subtitleVars?: Record<string, string | number>;
  tables: number[];
  /** Optional — restrict factors (b in a×b) for "learn" levels (e.g. [1..5]) */
  factors?: number[];
  kind: LevelKind;
  questions: number;
  minScore: number;
  emoji: string;
}

const Q_COUNT = 14;
const MIN_PASS = 12;

const TABLE_EMOJI: Record<number, string> = {
  1: "🌱",
  2: "🐣",
  3: "🐝",
  4: "🍀",
  5: "⭐",
  6: "🎲",
  7: "🐉",
  8: "🐙",
  9: "🦁",
  10: "💯",
};

function dayForTable(t: number): 1 | 2 | 3 {
  if (t <= 4) return 1;
  if (t <= 7) return 2;
  return 3;
}

function buildLevels(): Level[] {
  const out: Level[] = [];
  let id = 0;

  for (let t = 1; t <= 10; t++) {
    const day = dayForTable(t);
    const emoji = TABLE_EMOJI[t];
    const tablesLearned = Array.from({ length: t }, (_, i) => i + 1);
    // From table 4 onward, drop the trivial table of 1.
    const mixTables =
      t >= 4 ? tablesLearned.filter((x) => x !== 1) : tablesLearned;
    const mixStart = t >= 4 ? 2 : 1;

    // Learn part 1
    out.push({
      id: ++id,
      day,
      emoji,
      titleKey: "leveltitle.learn_p1",
      titleVars: { table: t },
      subtitleKey: "levelsub.learn_p1",
      subtitleVars: { table: t },
      tables: [t],
      factors: [1, 2, 3, 4, 5],
      kind: "learn",
      questions: Q_COUNT,
      minScore: MIN_PASS,
    });

    // Learn part 2
    out.push({
      id: ++id,
      day,
      emoji,
      titleKey: "leveltitle.learn_p2",
      titleVars: { table: t },
      subtitleKey: "levelsub.learn_p2",
      subtitleVars: { table: t },
      tables: [t],
      factors: [6, 7, 8, 9, 10],
      kind: "learn",
      questions: Q_COUNT,
      minScore: MIN_PASS,
    });

    // Mix A
    out.push({
      id: ++id,
      day,
      emoji: "🔀",
      titleKey: "leveltitle.mix_a",
      titleVars: { table: t },
      subtitleKey:
        t === 1 ? "levelsub.mix_single" : "levelsub.mix_range",
      subtitleVars: t === 1 ? {} : { start: mixStart, end: t },
      tables: mixTables,
      kind: "mix",
      questions: Q_COUNT,
      minScore: MIN_PASS,
    });

    // Mix B
    out.push({
      id: ++id,
      day,
      emoji: "🎯",
      titleKey: "leveltitle.mix_b",
      titleVars: { table: t },
      subtitleKey: "levelsub.mix_repeat",
      tables: mixTables,
      kind: "mix",
      questions: Q_COUNT,
      minScore: MIN_PASS,
    });
  }

  // Final challenge — no table of 1.
  out.push({
    id: ++id,
    day: 3,
    emoji: "👑",
    titleKey: "leveltitle.final",
    subtitleKey: "levelsub.final",
    tables: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    kind: "mix",
    questions: Q_COUNT,
    minScore: MIN_PASS,
  });

  return out;
}

export const LEVELS: Level[] = buildLevels();
export const TOTAL_LEVELS = LEVELS.length;

export function getLevel(id: number): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function levelsByDay(day: 1 | 2 | 3): Level[] {
  return LEVELS.filter((l) => l.day === day);
}

/** First "learn" level for a given table (part 1). */
export function findLearnLevelFor(table: number): Level | undefined {
  return LEVELS.find(
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
