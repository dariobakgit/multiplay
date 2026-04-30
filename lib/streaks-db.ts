"use server";

import { createClient } from "@/lib/supabase/server";

export interface StreakState {
  current: number;
  best: number;
  lastExamCorrect: number | null;
}

const EMPTY: StreakState = { current: 0, best: 0, lastExamCorrect: null };

/** Lee el streak (current, best, last_exam) para el usuario actual y un topic. */
export async function loadStreak(topicId: string): Promise<StreakState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const { data } = await supabase
    .from("streaks")
    .select("current, best, last_exam_correct")
    .eq("user_id", user.id)
    .eq("topic_id", topicId)
    .maybeSingle();

  return {
    current: data?.current ?? 0,
    best: data?.best ?? 0,
    lastExamCorrect: data?.last_exam_correct ?? null,
  };
}

async function upsertStreak(
  topicId: string,
  patch: Partial<{ current: number; best: number; last_exam_correct: number }>,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("streaks")
    .select("current, best, last_exam_correct")
    .eq("user_id", user.id)
    .eq("topic_id", topicId)
    .maybeSingle();

  const merged = {
    user_id: user.id,
    topic_id: topicId,
    current: patch.current ?? existing?.current ?? 0,
    best: patch.best ?? existing?.best ?? 0,
    last_exam_correct:
      patch.last_exam_correct ?? existing?.last_exam_correct ?? null,
    updated_at: new Date().toISOString(),
  };

  await supabase.from("streaks").upsert(merged, { onConflict: "user_id,topic_id" });
}

/** Suma 1 al streak actual del topic; sube `best` si lo supera. */
export async function recordCorrect(topicId: string): Promise<StreakState> {
  const before = await loadStreak(topicId);
  const next = before.current + 1;
  const best = Math.max(before.best, next);
  await upsertStreak(topicId, { current: next, best });
  return { ...before, current: next, best };
}

/** Resetea el streak actual del topic a 0. `best` no cambia. */
export async function recordWrong(topicId: string): Promise<StreakState> {
  await upsertStreak(topicId, { current: 0 });
  const after = await loadStreak(topicId);
  return after;
}

/** Guarda el resultado del examen (cantidad correcta) para el topic. */
export async function recordExamResult(
  topicId: string,
  correct: number,
): Promise<void> {
  await upsertStreak(topicId, { last_exam_correct: correct });
}

/** Migra los valores de localStorage (legacy global) a la tabla `streaks`
 *  para un topic específico. Idempotente: solo sube valores, nunca los baja.
 *  Retorna lo que quedó persistido. */
export async function migrateLegacyStreak(
  topicId: string,
  current: number,
  best: number,
  lastExam: number | null,
): Promise<StreakState> {
  const before = await loadStreak(topicId);
  const newCurrent = Math.max(before.current, current);
  const newBest = Math.max(before.best, best, current);
  const newLastExam = Math.max(
    before.lastExamCorrect ?? 0,
    lastExam ?? 0,
  );
  await upsertStreak(topicId, {
    current: newCurrent,
    best: newBest,
    last_exam_correct: newLastExam > 0 ? newLastExam : undefined,
  });
  return {
    current: newCurrent,
    best: newBest,
    lastExamCorrect: newLastExam > 0 ? newLastExam : null,
  };
}
