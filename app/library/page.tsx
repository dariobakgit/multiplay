import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSelectedMascotId, selectMascot } from "@/lib/progress-db";
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

  const [{ data: ownedRows }, selectedId] = await Promise.all([
    supabase
      .from("user_mascots")
      .select("mascot_id")
      .eq("user_id", user.id),
    getSelectedMascotId(),
  ]);

  const ownedIds = new Set<number>([1]); // Multi (default) always available
  for (const row of ownedRows ?? []) ownedIds.add(row.mascot_id);

  const unlocked = Array.from(ownedIds).sort((a, b) => a - b);
  // Count of "real" unlocks (from DB rows). Multi default isn't earned.
  const unlockedCount = ownedRows?.length ?? 0;

  return (
    <LibraryPageClient
      selectedId={selectedId}
      unlocked={unlocked}
      unlockedCount={unlockedCount}
      onSelect={selectMascotAction}
    />
  );
}
