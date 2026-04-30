"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUsername } from "@/lib/admin";

async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  if (!isAdminUsername(profile?.username)) {
    throw new Error("Acceso denegado");
  }
}

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function intOrNull(form: FormData, key: string): number | null {
  const v = form.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function jsonOrNull(form: FormData, key: string): unknown {
  const v = form.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  return JSON.parse(v);
}

// ============ Subjects ============

export async function createSubject(form: FormData): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const slug = str(form, "slug");
  const nameEs = str(form, "name_es");
  const nameEn = str(form, "name_en");
  const emoji = str(form, "emoji") || null;
  const sortOrder = intOrNull(form, "sort_order") ?? 0;

  if (!slug || !nameEs || !nameEn) throw new Error("Campos requeridos");

  const { error } = await admin.from("subjects").insert({
    slug,
    emoji,
    name_es: nameEs,
    name_en: nameEn,
    sort_order: sortOrder,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
}

export async function updateSubject(form: FormData): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const id = str(form, "id");
  if (!id) throw new Error("Falta id");

  const { error } = await admin
    .from("subjects")
    .update({
      slug: str(form, "slug"),
      emoji: str(form, "emoji") || null,
      name_es: str(form, "name_es"),
      name_en: str(form, "name_en"),
      sort_order: intOrNull(form, "sort_order") ?? 0,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
}

export async function deleteSubject(form: FormData): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const id = str(form, "id");
  if (!id) throw new Error("Falta id");
  const { error } = await admin.from("subjects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
}

// ============ Topics ============

export async function createTopic(form: FormData): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const subjectId = str(form, "subject_id");
  const slug = str(form, "slug");
  const nameEs = str(form, "name_es");
  const nameEn = str(form, "name_en");
  if (!subjectId || !slug || !nameEs || !nameEn) {
    throw new Error("Campos requeridos");
  }

  const { error } = await admin.from("topics").insert({
    subject_id: subjectId,
    slug,
    emoji: str(form, "emoji") || null,
    name_es: nameEs,
    name_en: nameEn,
    age_min: intOrNull(form, "age_min"),
    age_max: intOrNull(form, "age_max"),
    sort_order: intOrNull(form, "sort_order") ?? 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
}

export async function updateTopic(form: FormData): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const id = str(form, "id");
  if (!id) throw new Error("Falta id");

  const { error } = await admin
    .from("topics")
    .update({
      slug: str(form, "slug"),
      emoji: str(form, "emoji") || null,
      name_es: str(form, "name_es"),
      name_en: str(form, "name_en"),
      age_min: intOrNull(form, "age_min"),
      age_max: intOrNull(form, "age_max"),
      sort_order: intOrNull(form, "sort_order") ?? 0,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/topics/${id}`);
}

export async function deleteTopic(form: FormData): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const id = str(form, "id");
  if (!id) throw new Error("Falta id");
  const { error } = await admin.from("topics").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
}

// ============ Levels ============

export async function createLevel(form: FormData): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const topicId = str(form, "topic_id");
  if (!topicId) throw new Error("Falta topic_id");

  const mechanic = str(form, "mechanic");
  const position = intOrNull(form, "position");
  if (!mechanic || position === null) throw new Error("Campos requeridos");

  let config: unknown;
  try {
    config = jsonOrNull(form, "config");
  } catch (e) {
    throw new Error(`config inválido: ${(e as Error).message}`);
  }
  if (config === null) config = {};

  let unlockRule: unknown;
  try {
    unlockRule = jsonOrNull(form, "unlock_rule");
  } catch (e) {
    throw new Error(`unlock_rule inválido: ${(e as Error).message}`);
  }

  let coinReward: unknown;
  try {
    coinReward = jsonOrNull(form, "coin_reward");
  } catch (e) {
    throw new Error(`coin_reward inválido: ${(e as Error).message}`);
  }

  let titleVars: unknown;
  let subtitleVars: unknown;
  try {
    titleVars = jsonOrNull(form, "title_vars");
    subtitleVars = jsonOrNull(form, "subtitle_vars");
  } catch (e) {
    throw new Error(`vars inválidos: ${(e as Error).message}`);
  }

  const { data, error } = await admin
    .from("topic_levels")
    .insert({
      topic_id: topicId,
      position,
      mechanic,
      emoji: str(form, "emoji") || null,
      title_key: str(form, "title_key") || null,
      title_vars: titleVars,
      subtitle_key: str(form, "subtitle_key") || null,
      subtitle_vars: subtitleVars,
      config,
      unlock_rule: unlockRule,
      unlocks_mascot_id: intOrNull(form, "unlocks_mascot_id"),
      coin_reward: coinReward,
      replayable: form.get("replayable") === "on",
    })
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/content/topics/${topicId}`);
  if (data?.id) redirect(`/admin/content/levels/${data.id}`);
}

export async function updateLevel(form: FormData): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const id = str(form, "id");
  if (!id) throw new Error("Falta id");

  const position = intOrNull(form, "position");
  if (position === null) throw new Error("position requerido");

  let config: unknown;
  try {
    config = jsonOrNull(form, "config");
  } catch (e) {
    throw new Error(`config inválido: ${(e as Error).message}`);
  }
  if (config === null) config = {};

  let unlockRule: unknown;
  try {
    unlockRule = jsonOrNull(form, "unlock_rule");
  } catch (e) {
    throw new Error(`unlock_rule inválido: ${(e as Error).message}`);
  }

  let coinReward: unknown;
  try {
    coinReward = jsonOrNull(form, "coin_reward");
  } catch (e) {
    throw new Error(`coin_reward inválido: ${(e as Error).message}`);
  }

  let titleVars: unknown;
  let subtitleVars: unknown;
  try {
    titleVars = jsonOrNull(form, "title_vars");
    subtitleVars = jsonOrNull(form, "subtitle_vars");
  } catch (e) {
    throw new Error(`vars inválidos: ${(e as Error).message}`);
  }

  const { data: row } = await admin
    .from("topic_levels")
    .select("topic_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin
    .from("topic_levels")
    .update({
      position,
      mechanic: str(form, "mechanic"),
      emoji: str(form, "emoji") || null,
      title_key: str(form, "title_key") || null,
      title_vars: titleVars,
      subtitle_key: str(form, "subtitle_key") || null,
      subtitle_vars: subtitleVars,
      config,
      unlock_rule: unlockRule,
      unlocks_mascot_id: intOrNull(form, "unlocks_mascot_id"),
      coin_reward: coinReward,
      replayable: form.get("replayable") === "on",
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/content/levels/${id}`);
  if (row?.topic_id) revalidatePath(`/admin/content/topics/${row.topic_id}`);
}

export async function deleteLevel(form: FormData): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const id = str(form, "id");
  if (!id) throw new Error("Falta id");

  const { data: row } = await admin
    .from("topic_levels")
    .select("topic_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.from("topic_levels").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (row?.topic_id) {
    revalidatePath(`/admin/content/topics/${row.topic_id}`);
    redirect(`/admin/content/topics/${row.topic_id}`);
  }
  redirect("/admin/content");
}
