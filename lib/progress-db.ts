"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeStars, type Progress } from "./progress-helpers";

export async function loadProgress(): Promise<Progress> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { results: {}, stars: {} };

  const { data } = await supabase
    .from("progress")
    .select("level_id, score, total, passed, stars, updated_at")
    .eq("user_id", user.id);

  const results: Progress["results"] = {};
  const stars: Progress["stars"] = {};
  for (const row of data ?? []) {
    results[row.level_id] = {
      score: row.score,
      total: row.total,
      passed: row.passed,
      at: new Date(row.updated_at).getTime(),
    };
    stars[row.level_id] = row.stars;
  }
  return { results, stars };
}

export async function recordResult(
  levelId: number,
  score: number,
  total: number,
  minScore: number,
): Promise<
  | { ok: true; passed: boolean; stars: number }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const passed = score >= minScore;
  const stars = computeStars(score, total);

  const { data: existing } = await supabase
    .from("progress")
    .select("passed, stars")
    .eq("user_id", user.id)
    .eq("level_id", levelId)
    .maybeSingle();

  const finalPassed = (existing?.passed ?? false) || passed;
  const finalStars = Math.max(existing?.stars ?? 0, stars);

  const { error } = await supabase.from("progress").upsert(
    {
      user_id: user.id,
      level_id: levelId,
      score,
      total,
      passed: finalPassed,
      stars: finalStars,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,level_id" },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true, passed: finalPassed, stars: finalStars };
}

/**
 * Persiste el resultado de un nivel referenciado por `topic_level_id`
 * (la nueva fuente de verdad). El mechanic reporta `passed` y `stars`
 * (porque cada uno define qué significa eso). Maneja:
 *  - upsert de progress, conservando passed/stars máximos
 *  - inserción en user_mascots si el nivel desbloquea una mascota y es
 *    primera vez que pasa
 */
export async function recordResultByTopicLevel(
  topicLevelId: string,
  score: number,
  total: number,
  passed: boolean,
  starsEarned: number | null,
  unlocksMascotId: number | null,
  legacyLevelId: number | null = null,
): Promise<
  | {
      ok: true;
      passed: boolean;
      stars: number;
      newlyUnlockedMascotId: number | null;
    }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const stars = starsEarned ?? computeStars(score, total);

  // Buscar fila existente por topic_level_id (no por level_id legacy).
  const { data: existing } = await supabase
    .from("progress")
    .select("id, passed, stars, level_id")
    .eq("user_id", user.id)
    .eq("topic_level_id", topicLevelId)
    .maybeSingle();

  const wasPassed = existing?.passed ?? false;
  const finalPassed = wasPassed || passed;
  const finalStars = Math.max(existing?.stars ?? 0, stars);
  const firstPass = !wasPassed && passed;

  if (existing) {
    const update: Record<string, unknown> = {
      score,
      total,
      passed: finalPassed,
      stars: finalStars,
      updated_at: new Date().toISOString(),
    };
    if (existing.level_id == null && legacyLevelId != null) {
      update.level_id = legacyLevelId;
    }
    const { error } = await supabase
      .from("progress")
      .update(update)
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("progress").insert({
      user_id: user.id,
      topic_level_id: topicLevelId,
      level_id: legacyLevelId,
      score,
      total,
      passed: finalPassed,
      stars: finalStars,
      updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: error.message };
  }

  // Insertar mascota si corresponde — service-role para bypass RLS,
  // ya validamos que es para el user autenticado.
  let newlyUnlockedMascotId: number | null = null;
  if (firstPass && unlocksMascotId != null) {
    const admin = createAdminClient();
    const { data: existingMascot } = await admin
      .from("user_mascots")
      .select("mascot_id")
      .eq("user_id", user.id)
      .eq("mascot_id", unlocksMascotId)
      .maybeSingle();
    if (!existingMascot) {
      await admin.from("user_mascots").insert({
        user_id: user.id,
        mascot_id: unlocksMascotId,
        source: "level",
        acquired_at: new Date().toISOString(),
      });
      newlyUnlockedMascotId = unlocksMascotId;
    }
  }

  revalidatePath("/");
  return { ok: true, passed: finalPassed, stars: finalStars, newlyUnlockedMascotId };
}

export async function resetProgress() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("progress").delete().eq("user_id", user.id);
  await supabase.from("user_mascots").delete().eq("user_id", user.id);
  await supabase
    .from("profiles")
    .update({ selected_mascot_id: 1 })
    .eq("id", user.id);
  revalidatePath("/");
}

export async function getSelectedMascotId(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 1;
  const { data } = await supabase
    .from("profiles")
    .select("selected_mascot_id")
    .eq("id", user.id)
    .maybeSingle();
  return data?.selected_mascot_id ?? 1;
}

export async function selectMascot(
  mascotId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isInteger(mascotId) || mascotId < 1 || mascotId > 100) {
    return { ok: false, error: "Mascota inválida" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  // Mascot 1 (Multi, the default) is always available.
  // Las demás se validan contra user_mascots (la nueva fuente de
  // verdad). Fallback a progress.passed para usuarios pre-migración.
  if (mascotId !== 1) {
    const { data: owned } = await supabase
      .from("user_mascots")
      .select("mascot_id")
      .eq("user_id", user.id)
      .eq("mascot_id", mascotId)
      .maybeSingle();
    if (!owned) {
      const { data: passed } = await supabase
        .from("progress")
        .select("passed")
        .eq("user_id", user.id)
        .eq("level_id", mascotId)
        .eq("passed", true)
        .maybeSingle();
      if (!passed) return { ok: false, error: "Mascota bloqueada" };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ selected_mascot_id: mascotId })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/library");
  return { ok: true };
}
