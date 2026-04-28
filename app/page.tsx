import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadProgress } from "@/lib/progress-db";
import { getMascotForLevel, DEFAULT_MASCOT } from "@/lib/mascots";
import { isAdminUsername } from "@/lib/admin";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, selected_mascot_id")
    .eq("id", user.id)
    .maybeSingle();

  const progress = await loadProgress();
  const username =
    profile?.username ??
    (user.user_metadata?.username as string | undefined) ??
    "jugador";
  const greetingName = profile?.display_name?.trim() || username;

  const selectedId = profile?.selected_mascot_id ?? 1;
  const selectedMascot = getMascotForLevel(selectedId) ?? DEFAULT_MASCOT;

  return (
    <HomeClient
      username={username}
      greetingName={greetingName}
      progress={progress}
      selectedMascot={selectedMascot}
      userId={user.id}
      isAdmin={isAdminUsername(profile?.username)}
    />
  );
}
