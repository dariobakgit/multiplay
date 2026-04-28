import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, birth_date")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <SettingsClient
      username={profile?.username ?? ""}
      displayName={profile?.display_name ?? ""}
      birthDate={profile?.birth_date ?? ""}
    />
  );
}
