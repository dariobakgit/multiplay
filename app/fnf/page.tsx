import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_MASCOT, getMascotForLevel } from "@/lib/mascots";
import { getSelectedMascotId } from "@/lib/progress-db";
import { isAdminUsername } from "@/lib/admin";
import FnfClient from "./FnfClient";

export const dynamic = "force-dynamic";

export default async function FnfPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  const selectedId = await getSelectedMascotId();
  const mascot = getMascotForLevel(selectedId) ?? DEFAULT_MASCOT;
  const isAdmin = isAdminUsername(profile?.username);

  return <FnfClient mascot={mascot} userId={user.id} isAdmin={isAdmin} />;
}
