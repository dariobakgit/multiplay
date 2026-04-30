import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminUsername } from "@/lib/admin";
import {
  loadTopicBySlug,
  loadTopicLevels,
  loadTopicProgress,
  type TopicLevelData,
} from "@/lib/topics-db";
import TopicGrid from "./TopicGrid";

export const dynamic = "force-dynamic";

type ProgressMap = Record<
  number,
  { passed: boolean; score: number; total: number; stars: number }
>;

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>;
}) {
  const { topicSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const topic = await loadTopicBySlug(topicSlug);
  if (!topic) return notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = isAdminUsername(profile?.username);

  const levels = await loadTopicLevels(topic.id);
  const { byPosition } = await loadTopicProgress(topic.id);

  const items = levels.map((lv) => ({
    level: lv,
    progress: byPosition[lv.position] ?? null,
    unlocked: isAdmin || isUnlocked(lv, byPosition),
  }));

  const passedCount = Object.values(byPosition).filter((p) => p?.passed).length;

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-lg font-black text-white shadow-md shadow-brand-500/30 ring-1 ring-brand-600 active:scale-95"
          aria-label="Volver"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {topic.emoji} {topic.nameEs}
          </h1>
          <p className="text-sm text-slate-600">
            {passedCount} / {levels.length}
          </p>
        </div>
      </div>

      <TopicGrid topicSlug={topicSlug} items={items} />
    </main>
  );
}

function isUnlocked(level: TopicLevelData, byPosition: ProgressMap): boolean {
  if (level.position === 1) return true;
  const rule = level.unlockRule;
  if (!rule || rule.type === "previous") {
    return byPosition[level.position - 1]?.passed === true;
  }
  if (rule.type === "min_position") {
    return Object.entries(byPosition).some(
      ([pos, r]) => Number(pos) >= rule.position && r.passed,
    );
  }
  if (rule.type === "score_on") {
    const r = byPosition[rule.levelPosition];
    if (!r || !r.passed) return false;
    return r.score / r.total >= rule.minScore / rule.minTotal;
  }
  return false;
}
