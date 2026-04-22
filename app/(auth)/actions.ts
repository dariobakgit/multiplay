"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthState = { error: string | null };

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;

function usernameToEmail(u: string) {
  return `${u.toLowerCase().trim()}@players.multiply.local`;
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    return { error: "err.missing_fields" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
  if (error) {
    return { error: "err.wrong_credentials" };
  }
  redirect("/");
}

export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!USERNAME_RE.test(username)) {
    return { error: "err.username_invalid" };
  }
  if (password.length < 4) {
    return { error: "err.password_too_short" };
  }

  const email = usernameToEmail(username);

  // Use service-role to create the user with email pre-confirmed,
  // so we don't need to disable "Confirm email" in Supabase settings.
  const admin = createAdminClient();
  const { data: created, error: createErr } = await admin.auth.admin.createUser(
    {
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    },
  );
  if (createErr) {
    if (createErr.message.toLowerCase().includes("already")) {
      return { error: "err.user_exists" };
    }
    return { error: createErr.message };
  }

  if (created.user) {
    const { error: profileErr } = await admin
      .from("profiles")
      .insert({ id: created.user.id, username });
    if (profileErr && !profileErr.message.toLowerCase().includes("duplicate")) {
      return { error: "err.profile_create_failed" };
    }
  }

  // Sign the new user in on the current browser session.
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) {
    return { error: "err.account_created_login" };
  }
  redirect("/");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
