import { notFound, redirect } from "next/navigation";
import { getLevel } from "@/lib/curriculum";
import { trackFromParam } from "@/lib/tracks";
import { isValidTheme } from "@/lib/themes";
import { createClient } from "@/lib/supabase/server";
import { getSelectedMascotId, loadProgress } from "@/lib/progress-db";
import { isUnlocked } from "@/lib/progress-helpers";
import { DEFAULT_MASCOT, getMascotForLevel } from "@/lib/mascots";
import LevelPlayer from "./LevelPlayer";

export const dynamic = "force-dynamic";

export default async function LevelPage({
  params,
}: {
  params: Promise<{ track: string; theme: string; id: string }>;
}) {
  const { track: trackParam, theme: themeParam, id } = await params;
  const track = trackFromParam(trackParam);
  if (!track) return notFound();
  if (!isValidTheme(track, themeParam)) return notFound();

  const levelId = Number(id);
  const level = getLevel(track, themeParam, levelId);
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
  if (!isUnlocked(track, themeParam, levelId, progress)) {
    redirect("/");
  }
  const selectedMascot = getMascotForLevel(selectedId) ?? DEFAULT_MASCOT;

  return (
    <LevelPlayer
      level={level}
      track={track}
      theme={themeParam}
      selectedMascot={selectedMascot}
      userId={user.id}
    />
  );
}
