"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUsername } from "@/lib/admin";

async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  if (!isAdminUsername(profile?.username)) {
    return { ok: false, error: "Acceso denegado" };
  }
  return { ok: true, userId: user.id };
}

export async function adminChangePassword(
  targetUserId: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  if (!newPassword || newPassword.length < 4) {
    return { ok: false, error: "La contraseña debe tener 4+ caracteres" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(targetUserId, {
    password: newPassword,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminResetProgress(
  targetUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  const admin = createAdminClient();
  const { error: delErr } = await admin
    .from("progress")
    .delete()
    .eq("user_id", targetUserId);
  if (delErr) return { ok: false, error: delErr.message };

  await admin
    .from("profiles")
    .update({ selected_mascot_id: 1 })
    .eq("id", targetUserId);

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}
