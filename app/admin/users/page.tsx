import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUsername } from "@/lib/admin";
import AdminUsersClient, { type AdminUser } from "./AdminUsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  if (!isAdminUsername(me?.username)) redirect("/");

  const admin = createAdminClient();
  const [{ data: authList }, { data: profiles }, { data: progressRows }] =
    await Promise.all([
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.from("profiles").select("id, username"),
      admin.from("progress").select("user_id, passed").eq("passed", true),
    ]);

  const passedCount = new Map<string, number>();
  for (const row of progressRows ?? []) {
    passedCount.set(row.user_id, (passedCount.get(row.user_id) ?? 0) + 1);
  }

  const profileByUser = new Map<string, string>();
  for (const p of profiles ?? []) profileByUser.set(p.id, p.username);

  const users: AdminUser[] = (authList?.users ?? [])
    .map((u) => ({
      id: u.id,
      username: profileByUser.get(u.id) ?? u.email ?? "(sin nombre)",
      levelsPassed: passedCount.get(u.id) ?? 0,
      createdAt: u.created_at ?? null,
      isSelf: u.id === user.id,
    }))
    .sort((a, b) => a.username.localeCompare(b.username));

  return <AdminUsersClient users={users} />;
}
