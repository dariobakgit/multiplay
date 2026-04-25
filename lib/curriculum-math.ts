import {
  MIN_PASS,
  Q_COUNT,
  type MathLevel,
} from "./level-types";

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

function buildLevels(): MathLevel[] {
  const out: MathLevel[] = [];
  let id = 0;

  for (let t = 1; t <= 10; t++) {
    const day = dayForTable(t);
    const emoji = TABLE_EMOJI[t];
    const tablesLearned = Array.from({ length: t }, (_, i) => i + 1);
    // From table 4 onward, drop the trivial table of 1.
    const mixTables =
      t >= 4 ? tablesLearned.filter((x) => x !== 1) : tablesLearned;
    const mixStart = t >= 4 ? 2 : 1;

    out.push({
      id: ++id,
      track: "math",
      theme: "tables",
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
      showIntro: true,
    });

    out.push({
      id: ++id,
      track: "math",
      theme: "tables",
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
      showIntro: true,
    });

    out.push({
      id: ++id,
      track: "math",
      theme: "tables",
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
      showIntro: true,
    });

    out.push({
      id: ++id,
      track: "math",
      theme: "tables",
      day,
      emoji: "🎯",
      titleKey: "leveltitle.mix_b",
      titleVars: { table: t },
      subtitleKey: "levelsub.mix_repeat",
      tables: mixTables,
      kind: "mix",
      questions: Q_COUNT,
      minScore: MIN_PASS,
      showIntro: true,
    });
  }

  out.push({
    id: ++id,
    track: "math",
    theme: "tables",
    day: 3,
    emoji: "👑",
    titleKey: "leveltitle.final",
    subtitleKey: "levelsub.final",
    tables: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    kind: "mix",
    questions: Q_COUNT,
    minScore: MIN_PASS,
    showIntro: true,
  });

  return out;
}

export const MATH_LEVELS: MathLevel[] = buildLevels();
