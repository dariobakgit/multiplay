import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMascotForLevel, DEFAULT_MASCOT } from "@/lib/mascots";
import { isAdminUsername } from "@/lib/admin";
import HomeClient, { type TopicCardData } from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, selected_mascot_id, birth_date")
    .eq("id", user.id)
    .maybeSingle();

  const username =
    profile?.username ??
    (user.user_metadata?.username as string | undefined) ??
    "jugador";
  const greetingName = profile?.display_name?.trim() || username;

  const selectedId = profile?.selected_mascot_id ?? 1;
  const selectedMascot = getMascotForLevel(selectedId) ?? DEFAULT_MASCOT;
  const isAdmin = isAdminUsername(profile?.username);

  // Edad estimada para filtrar topics — admin ve todos.
  const ageYears = computeAge(profile?.birth_date);

  // Fetch topics + per-topic stats en una sola pasada.
  const { data: topicsRaw } = await supabase
    .from("topics")
    .select(
      "id, slug, emoji, name_es, name_en, age_min, age_max, sort_order, subjects(slug, name_es, name_en, emoji, sort_order)",
    )
    .order("sort_order", { ascending: true });

  type RawTopic = NonNullable<typeof topicsRaw>[number];

  // Filter by age (admin sees all)
  const matchesAge = (t: RawTopic) => {
    if (isAdmin || ageYears == null) return true;
    if (t.age_min != null && ageYears < t.age_min) return false;
    if (t.age_max != null && ageYears > t.age_max) return false;
    return true;
  };

  const eligibleTopics = (topicsRaw ?? []).filter(matchesAge);

  const topicCards: TopicCardData[] = await Promise.all(
    eligibleTopics.map(async (t) => {
      const [{ count: levelCount }, { count: passedCount }, { data: streak }] =
        await Promise.all([
          supabase
            .from("topic_levels")
            .select("id", { count: "exact", head: true })
            .eq("topic_id", t.id),
          supabase
            .from("progress")
            .select("topic_levels!inner(topic_id)", {
              count: "exact",
              head: true,
            })
            .eq("user_id", user.id)
            .eq("passed", true)
            .eq("topic_levels.topic_id", t.id),
          supabase
            .from("streaks")
            .select("current, best")
            .eq("user_id", user.id)
            .eq("topic_id", t.id)
            .maybeSingle(),
        ]);
      const subj = Array.isArray(t.subjects) ? t.subjects[0] : t.subjects;
      return {
        id: t.id,
        slug: t.slug,
        emoji: t.emoji,
        nameEs: t.name_es,
        nameEn: t.name_en,
        subjectNameEs: subj?.name_es ?? "",
        subjectNameEn: subj?.name_en ?? "",
        subjectEmoji: subj?.emoji ?? null,
        levelsTotal: levelCount ?? 0,
        levelsPassed: passedCount ?? 0,
        streakBest: streak?.best ?? 0,
      };
    }),
  );

  const { count: ownedMascotsCount } = await supabase
    .from("user_mascots")
    .select("mascot_id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <HomeClient
      username={username}
      greetingName={greetingName}
      selectedMascot={selectedMascot}
      userId={user.id}
      isAdmin={isAdmin}
      topics={topicCards}
      ownedMascotsCount={ownedMascotsCount ?? 0}
    />
  );
}

function computeAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years--;
  return years;
}
