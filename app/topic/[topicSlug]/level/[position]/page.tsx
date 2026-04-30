import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getSelectedMascotId,
} from "@/lib/progress-db";
import {
  DEFAULT_MASCOT,
  getMascotForLevel,
  type MascotVariant,
} from "@/lib/mascots";
import { isAdminUsername } from "@/lib/admin";
import {
  isLevelUnlocked,
  loadNextLevelPosition,
  loadTopicBySlug,
  loadTopicLevel,
} from "@/lib/topics-db";
import { loadStreak } from "@/lib/streaks-db";
import LevelHost from "./LevelHost";

export const dynamic = "force-dynamic";

export default async function TopicLevelPage({
  params,
}: {
  params: Promise<{ topicSlug: string; position: string }>;
}) {
  const { topicSlug, position: positionStr } = await params;
  const position = Number(positionStr);
  if (!Number.isInteger(position) || position < 1) return notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const topic = await loadTopicBySlug(topicSlug);
  if (!topic) return notFound();

  const level = await loadTopicLevel(topic.id, position);
  if (!level) return notFound();

  // Admin check
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, selected_mascot_id")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = isAdminUsername(profile?.username);

  // Unlock guard
  const unlocked = await isLevelUnlocked(level, isAdmin);
  if (!unlocked) {
    redirect(`/topic/${topicSlug}`);
  }

  const selectedId = profile?.selected_mascot_id ?? (await getSelectedMascotId());
  const selectedMascot: MascotVariant =
    getMascotForLevel(selectedId) ?? DEFAULT_MASCOT;

  const [nextPosition, streakState] = await Promise.all([
    loadNextLevelPosition(topic.id, position),
    loadStreak(topic.id),
  ]);

  return (
    <LevelHost
      topicSlug={topicSlug}
      topicId={topic.id}
      level={{
        id: level.id,
        topicId: level.topicId,
        position: level.position,
        emoji: level.emoji,
        titleKey: level.titleKey,
        titleVars: level.titleVars,
        subtitleKey: level.subtitleKey,
        subtitleVars: level.subtitleVars,
        config: level.config,
        unlocksMascotId: level.unlocksMascotId,
        coinReward: level.coinReward,
        replayable: level.replayable,
      }}
      mechanic={level.mechanic}
      selectedMascot={selectedMascot}
      userId={user.id}
      nextPosition={nextPosition}
      initialStreak={{
        current: streakState.current,
        best: streakState.best,
      }}
    />
  );
}
