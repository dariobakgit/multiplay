/**
 * Seeds the platform content: subject "math" + topic
 * "multiplication-tables" + its 43 levels (41 multiple_choice + 1 exam +
 * 1 battle), porting the data that today lives in lib/curriculum.ts.
 *
 * Idempotent — uses upsert keyed on (subject.slug) and
 * (topic.subject_id, topic.slug) and (topic_levels.topic_id, position).
 *
 * Usage: npm run seed:curriculum
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";

import { LEVELS } from "../lib/curriculum";
import { optionsCountForLevel } from "../lib/questions";

// Load .env.local
try {
  const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const [, key, rawVal] = m;
    if (process.env[key]) continue;
    process.env[key] = rawVal.replace(/^['"]|['"]$/g, "");
  }
} catch {
  // relies on real env
}

interface MCConfig {
  questionsCount: number;
  minScore: number;
  optionsCount: 4 | 6 | 8;
  recentWindow: number;
  pool: {
    type: "multiplication";
    tables: number[];
    factors?: number[];
    includeCommutative?: boolean;
    excludeFactors?: number[];
  };
}

interface ExamConfig {
  questionsCount: number;
  passGrade: number;
  pool: {
    type: "multiplication";
    hardPercent: number;
    hardMinFactor: number;
    excludeFactors?: number[];
  };
}

interface BattleConfig {
  pool: { type: "multiplication"; tables: number[] };
  questionTimeMs: number;
  feedbackMs: number;
  winPosition: number;
  losePosition: number;
  optionsCount: 4 | 6 | 8;
}

interface SeedLevel {
  position: number;
  emoji: string | null;
  titleKey: string | null;
  titleVars: Record<string, string | number> | null;
  subtitleKey: string | null;
  subtitleVars: Record<string, string | number> | null;
  mechanic: "multiple_choice" | "exam" | "battle";
  config: MCConfig | ExamConfig | BattleConfig;
  unlockRule: Record<string, unknown> | null;
  unlocksMascotId: number | null;
  coinReward: { base: number; perStar: number };
  replayable: boolean;
}

function buildSeedLevels(): SeedLevel[] {
  const out: SeedLevel[] = [];

  // 1..41: port from lib/curriculum.ts
  for (const lv of LEVELS) {
    const isLearn = !!lv.factors;
    const cfg: MCConfig = {
      questionsCount: lv.questions,
      minScore: lv.minScore,
      optionsCount: optionsCountForLevel(lv.id) as 4 | 6 | 8,
      recentWindow: 6,
      pool: {
        type: "multiplication",
        tables: lv.tables,
        ...(lv.factors ? { factors: lv.factors } : {}),
        ...(isLearn ? { includeCommutative: true } : {}),
      },
    };
    out.push({
      position: lv.id,
      emoji: lv.emoji,
      titleKey: lv.titleKey,
      titleVars: lv.titleVars ?? null,
      subtitleKey: lv.subtitleKey,
      subtitleVars: lv.subtitleVars ?? null,
      mechanic: "multiple_choice",
      config: cfg,
      unlockRule: lv.id === 1 ? { type: "previous" } : { type: "previous" },
      unlocksMascotId: lv.id, // mantiene el mapeo histórico mascot.id = level.id
      coinReward: { base: 5, perStar: 5 },
      replayable: false,
    });
  }

  // 42: Exam
  out.push({
    position: 42,
    emoji: "📝",
    titleKey: "exam.title",
    titleVars: null,
    subtitleKey: "exam.subtitle",
    subtitleVars: { total: 20 },
    mechanic: "exam",
    config: {
      questionsCount: 20,
      passGrade: 6,
      pool: {
        type: "multiplication",
        hardPercent: 0.7,
        hardMinFactor: 4,
        excludeFactors: [1],
      },
    },
    unlockRule: { type: "min_position", position: 29 },
    unlocksMascotId: null,
    coinReward: { base: 10, perStar: 5 },
    replayable: true,
  });

  // 43: Battle
  out.push({
    position: 43,
    emoji: "⚔️",
    titleKey: "fnf.title",
    titleVars: null,
    subtitleKey: "fnf.intro_sub",
    subtitleVars: null,
    mechanic: "battle",
    config: {
      pool: { type: "multiplication", tables: [2, 3, 4, 5, 6, 7, 8, 9, 10] },
      questionTimeMs: 5000,
      feedbackMs: 600,
      winPosition: 10,
      losePosition: -10,
      optionsCount: 4,
    },
    unlockRule: {
      type: "score_on",
      levelPosition: 42,
      minScore: 18,
      minTotal: 20,
    },
    unlocksMascotId: null,
    coinReward: { base: 20, perStar: 10 },
    replayable: true,
  });

  return out;
}

async function main() {
  const pgUrl = process.env.POSTGRES_URL;
  if (!pgUrl) {
    console.error("❌ POSTGRES_URL no está en .env.local");
    process.exit(1);
  }

  const pg = new Client({
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false },
  });
  await pg.connect();

  try {
    console.log("📚 Upsert subject 'math'...");
    const subjectRes = await pg.query<{ id: string }>(
      `insert into subjects (slug, emoji, name_es, name_en, sort_order)
       values ($1, $2, $3, $4, $5)
       on conflict (slug) do update set
         emoji = excluded.emoji,
         name_es = excluded.name_es,
         name_en = excluded.name_en,
         sort_order = excluded.sort_order
       returning id`,
      ["math", "🔢", "Matemáticas", "Math", 0],
    );
    const subjectId = subjectRes.rows[0].id;
    console.log(`   ✓ subject id=${subjectId}`);

    console.log("📖 Upsert topic 'multiplication-tables'...");
    const topicRes = await pg.query<{ id: string }>(
      `insert into topics (subject_id, slug, emoji, name_es, name_en, age_min, age_max, sort_order)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (subject_id, slug) do update set
         emoji = excluded.emoji,
         name_es = excluded.name_es,
         name_en = excluded.name_en,
         age_min = excluded.age_min,
         age_max = excluded.age_max,
         sort_order = excluded.sort_order
       returning id`,
      [subjectId, "multiplication-tables", "✖️", "Tablas de multiplicar", "Multiplication tables", 6, 10, 0],
    );
    const topicId = topicRes.rows[0].id;
    console.log(`   ✓ topic id=${topicId}`);

    const levels = buildSeedLevels();
    console.log(`🧱 Upsert ${levels.length} topic_levels...`);
    for (const lv of levels) {
      await pg.query(
        `insert into topic_levels (
           topic_id, position, emoji,
           title_key, title_vars, subtitle_key, subtitle_vars,
           mechanic, config, unlock_rule,
           unlocks_mascot_id, coin_reward, replayable
         )
         values (
           $1, $2, $3,
           $4, $5, $6, $7,
           $8, $9, $10,
           $11, $12, $13
         )
         on conflict (topic_id, position) do update set
           emoji = excluded.emoji,
           title_key = excluded.title_key,
           title_vars = excluded.title_vars,
           subtitle_key = excluded.subtitle_key,
           subtitle_vars = excluded.subtitle_vars,
           mechanic = excluded.mechanic,
           config = excluded.config,
           unlock_rule = excluded.unlock_rule,
           unlocks_mascot_id = excluded.unlocks_mascot_id,
           coin_reward = excluded.coin_reward,
           replayable = excluded.replayable`,
        [
          topicId,
          lv.position,
          lv.emoji,
          lv.titleKey,
          lv.titleVars ? JSON.stringify(lv.titleVars) : null,
          lv.subtitleKey,
          lv.subtitleVars ? JSON.stringify(lv.subtitleVars) : null,
          lv.mechanic,
          JSON.stringify(lv.config),
          lv.unlockRule ? JSON.stringify(lv.unlockRule) : null,
          lv.unlocksMascotId,
          JSON.stringify(lv.coinReward),
          lv.replayable,
        ],
      );
    }
    console.log(`   ✓ ${levels.length} niveles upserteados`);

    // Sanity check
    const countRes = await pg.query<{ count: string }>(
      `select count(*)::text from topic_levels where topic_id = $1`,
      [topicId],
    );
    console.log(
      `\n✅ Listo. topic 'multiplication-tables' tiene ${countRes.rows[0].count} niveles.`,
    );
  } finally {
    await pg.end();
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message ?? err);
  process.exit(1);
});
