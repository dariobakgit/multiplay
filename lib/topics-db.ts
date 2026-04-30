"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface TopicSummary {
  id: string;
  slug: string;
  emoji: string | null;
  nameEs: string;
  nameEn: string;
  ageMin: number | null;
  ageMax: number | null;
  sortOrder: number;
  subjectId: string;
}

export interface TopicLevelData<TConfig = unknown> {
  id: string;
  topicId: string;
  position: number;
  emoji: string | null;
  titleKey: string | null;
  titleVars: Record<string, string | number> | null;
  subtitleKey: string | null;
  subtitleVars: Record<string, string | number> | null;
  mechanic: string;
  config: TConfig;
  unlockRule: UnlockRule | null;
  unlocksMascotId: number | null;
  coinReward: { base?: number; perStar?: number } | null;
  replayable: boolean;
}

export type UnlockRule =
  | { type: "previous" }
  | { type: "min_position"; position: number }
  | {
      type: "score_on";
      levelPosition: number;
      minScore: number;
      minTotal: number;
    };

export interface TopicProgress {
  /** Map de position → resumen de progreso del usuario en ese nivel. */
  byPosition: Record<
    number,
    { passed: boolean; score: number; total: number; stars: number }
  >;
}

interface RawTopicLevel {
  id: string;
  topic_id: string;
  position: number;
  emoji: string | null;
  title_key: string | null;
  title_vars: Record<string, string | number> | null;
  subtitle_key: string | null;
  subtitle_vars: Record<string, string | number> | null;
  mechanic: string;
  config: Record<string, unknown>;
  unlock_rule: UnlockRule | null;
  unlocks_mascot_id: number | null;
  coin_reward: { base?: number; perStar?: number } | null;
  replayable: boolean;
}

function mapTopicLevel<T = unknown>(row: RawTopicLevel): TopicLevelData<T> {
  return {
    id: row.id,
    topicId: row.topic_id,
    position: row.position,
    emoji: row.emoji,
    titleKey: row.title_key,
    titleVars: row.title_vars,
    subtitleKey: row.subtitle_key,
    subtitleVars: row.subtitle_vars,
    mechanic: row.mechanic,
    config: row.config as T,
    unlockRule: row.unlock_rule,
    unlocksMascotId: row.unlocks_mascot_id,
    coinReward: row.coin_reward,
    replayable: row.replayable,
  };
}

export async function loadTopicBySlug(
  slug: string,
): Promise<TopicSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("id, slug, emoji, name_es, name_en, age_min, age_max, sort_order, subject_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    emoji: data.emoji,
    nameEs: data.name_es,
    nameEn: data.name_en,
    ageMin: data.age_min,
    ageMax: data.age_max,
    sortOrder: data.sort_order,
    subjectId: data.subject_id,
  };
}

export async function loadTopicLevels(
  topicId: string,
): Promise<TopicLevelData[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topic_levels")
    .select(
      "id, topic_id, position, emoji, title_key, title_vars, subtitle_key, subtitle_vars, mechanic, config, unlock_rule, unlocks_mascot_id, coin_reward, replayable",
    )
    .eq("topic_id", topicId)
    .order("position", { ascending: true });
  return (data ?? []).map((row) => mapTopicLevel(row as RawTopicLevel));
}

export async function loadTopicLevel(
  topicId: string,
  position: number,
): Promise<TopicLevelData | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topic_levels")
    .select(
      "id, topic_id, position, emoji, title_key, title_vars, subtitle_key, subtitle_vars, mechanic, config, unlock_rule, unlocks_mascot_id, coin_reward, replayable",
    )
    .eq("topic_id", topicId)
    .eq("position", position)
    .maybeSingle();
  if (!data) return null;
  return mapTopicLevel(data as RawTopicLevel);
}

/** Carga el progreso del usuario en TODO un topic, agrupado por position. */
export async function loadTopicProgress(
  topicId: string,
): Promise<TopicProgress> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { byPosition: {} };

  const { data } = await supabase
    .from("progress")
    .select("score, total, passed, stars, topic_levels!inner(position, topic_id)")
    .eq("user_id", user.id)
    .eq("topic_levels.topic_id", topicId);

  const byPosition: TopicProgress["byPosition"] = {};
  // Supabase returns the joined relation as an array (one-to-many) by
  // default; collapse to first.
  for (const row of (data ?? []) as Array<{
    score: number;
    total: number;
    passed: boolean;
    stars: number;
    topic_levels:
      | { position: number; topic_id: string }
      | Array<{ position: number; topic_id: string }>
      | null;
  }>) {
    const tl = Array.isArray(row.topic_levels)
      ? row.topic_levels[0]
      : row.topic_levels;
    if (!tl) continue;
    byPosition[tl.position] = {
      passed: row.passed,
      score: row.score,
      total: row.total,
      stars: row.stars,
    };
  }
  return { byPosition };
}

/** Determina si un nivel está desbloqueado para el usuario actual.
 *  Admin ve todo desbloqueado. */
export async function isLevelUnlocked(
  level: TopicLevelData,
  isAdmin: boolean,
): Promise<boolean> {
  if (isAdmin) return true;
  const rule = level.unlockRule;
  if (!rule) return true; // sin regla = desbloqueado

  // primer nivel siempre desbloqueado
  if (level.position === 1) return true;

  const progress = await loadTopicProgress(level.topicId);

  if (rule.type === "previous") {
    return progress.byPosition[level.position - 1]?.passed === true;
  }
  if (rule.type === "min_position") {
    return Object.entries(progress.byPosition).some(
      ([pos, r]) => Number(pos) >= rule.position && r.passed,
    );
  }
  if (rule.type === "score_on") {
    const r = progress.byPosition[rule.levelPosition];
    if (!r || !r.passed) return false;
    // Comparar como ratio para que minScore/minTotal sea robusto.
    const userRatio = r.score / r.total;
    const required = rule.minScore / rule.minTotal;
    return userRatio >= required;
  }
  return false;
}

/** Próximo nivel disponible (siguiente position que existe). Devuelve
 *  null si no hay siguiente. */
export async function loadNextLevelPosition(
  topicId: string,
  currentPosition: number,
): Promise<number | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("topic_levels")
    .select("position")
    .eq("topic_id", topicId)
    .gt("position", currentPosition)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.position ?? null;
}
