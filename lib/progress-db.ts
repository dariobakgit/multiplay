"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

export async function resetProgress() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("progress").delete().eq("user_id", user.id);
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
  // Others require passing the level with the matching id.
  if (mascotId !== 1) {
    const { data: passed } = await supabase
      .from("progress")
      .select("passed")
      .eq("user_id", user.id)
      .eq("level_id", mascotId)
      .eq("passed", true)
      .maybeSingle();
    if (!passed) return { ok: false, error: "Mascota bloqueada" };
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
