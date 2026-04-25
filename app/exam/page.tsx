import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_MASCOT, getMascotForLevel } from "@/lib/mascots";
import { getSelectedMascotId, loadProgress } from "@/lib/progress-db";
import ExamClient from "./ExamClient";

export const dynamic = "force-dynamic";

export default async function ExamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [selectedId, progress] = await Promise.all([
    getSelectedMascotId(),
    loadProgress(),
  ]);
  if (!progress.results.math[29]?.passed) redirect("/");

  const mascot = getMascotForLevel(selectedId) ?? DEFAULT_MASCOT;
  return <ExamClient mascot={mascot} userId={user.id} />;
}
