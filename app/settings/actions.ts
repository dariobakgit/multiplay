"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = {
  status: "idle" | "ok" | "error";
  errorKey?: string;
};

const NAME_RE = /^.{1,50}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function updateSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", errorKey: "settings.save_error" };

  const rawName = String(formData.get("display_name") ?? "").trim();
  const rawDate = String(formData.get("birth_date") ?? "").trim();

  const update: Record<string, string | null> = {};

  if (rawName === "") {
    update.display_name = null;
  } else if (NAME_RE.test(rawName)) {
    update.display_name = rawName;
  } else {
    return { status: "error", errorKey: "settings.save_error" };
  }

  if (rawDate === "") {
    update.birth_date = null;
  } else if (DATE_RE.test(rawDate)) {
    update.birth_date = rawDate;
  } else {
    return { status: "error", errorKey: "settings.save_error" };
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);
  if (error) return { status: "error", errorKey: "settings.save_error" };

  revalidatePath("/");
  revalidatePath("/settings");
  return { status: "ok" };
}
