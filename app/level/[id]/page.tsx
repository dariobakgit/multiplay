import { notFound, redirect } from "next/navigation";
import { getLevel } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/server";
import { getSelectedMascotId, loadProgress } from "@/lib/progress-db";
import { isUnlocked } from "@/lib/progress-helpers";
import { DEFAULT_MASCOT, getMascotForLevel } from "@/lib/mascots";
import LevelPlayer from "./LevelPlayer";

export const dynamic = "force-dynamic";

export default async function LevelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const levelId = Number(id);
  const level = getLevel(levelId);
  if (!level) return notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [progress, selectedId] = await Promise.all([
    loadProgress(),
    getSelectedMascotId(),
  ]);
  if (!isUnlocked(levelId, progress)) {
    redirect("/");
  }
  const selectedMascot = getMascotForLevel(selectedId) ?? DEFAULT_MASCOT;

  return (
    <LevelPlayer
      level={level}
      selectedMascot={selectedMascot}
      userId={user.id}
    />
  );
}
