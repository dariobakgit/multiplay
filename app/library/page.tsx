import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getSelectedMascotId,
  loadProgress,
  selectMascot,
} from "@/lib/progress-db";
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

  const unlocked = Array.from(
    new Set([
      1, // Multi (default) always available
      ...Object.entries(progress.results)
        .filter(([, r]) => r.passed)
        .map(([id]) => Number(id)),
    ]),
  );
  const unlockedCount = Object.values(progress.results).filter(
    (r) => r.passed,
  ).length;

  return (
    <LibraryPageClient
      selectedId={selectedId}
      unlocked={unlocked}
      unlockedCount={unlockedCount}
      onSelect={selectMascotAction}
    />
  );
}
