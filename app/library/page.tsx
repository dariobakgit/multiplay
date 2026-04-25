import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getSelectedMascotId,
  loadProgress,
  selectMascot,
} from "@/lib/progress-db";
import { unlockedMascotCount } from "@/lib/progress-helpers";
import { TRACKS } from "@/lib/tracks";
import LibraryPageClient from "./LibraryPageClient";

export const dynamic = "force-dynamic";

async function selectMascotAction(id: number) {
  "use server";
  await selectMascot(id);
}

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [progress, selectedId] = await Promise.all([
    loadProgress(),
    getSelectedMascotId(),
  ]);

  // A mascot N is unlocked if level N has been passed in any track.
  const unlockedSet = new Set<number>([1]);
  for (const t of TRACKS) {
    for (const [id, r] of Object.entries(progress.results[t])) {
      if (r.passed) unlockedSet.add(Number(id));
    }
  }
  const unlocked = Array.from(unlockedSet);
  const unlockedCount = unlockedMascotCount(progress);

  return (
    <LibraryPageClient
      selectedId={selectedId}
      unlocked={unlocked}
      unlockedCount={unlockedCount}
      onSelect={selectMascotAction}
    />
  );
}
