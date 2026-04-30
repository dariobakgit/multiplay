import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUsername } from "@/lib/admin";
import { createSubject, createTopic, deleteSubject } from "./actions";

export const dynamic = "force-dynamic";

interface SubjectRow {
  id: string;
  slug: string;
  emoji: string | null;
  name_es: string;
  name_en: string;
  sort_order: number;
}

interface TopicRow {
  id: string;
  subject_id: string;
  slug: string;
  emoji: string | null;
  name_es: string;
  name_en: string;
  age_min: number | null;
  age_max: number | null;
  sort_order: number;
}

export default async function AdminContentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  if (!isAdminUsername(me?.username)) redirect("/");

  const admin = createAdminClient();
  const [{ data: subjects }, { data: topics }, { data: levelCounts }] =
    await Promise.all([
      admin
        .from("subjects")
        .select("id, slug, emoji, name_es, name_en, sort_order")
        .order("sort_order", { ascending: true }),
      admin
        .from("topics")
        .select(
          "id, subject_id, slug, emoji, name_es, name_en, age_min, age_max, sort_order",
        )
        .order("sort_order", { ascending: true }),
      admin.from("topic_levels").select("topic_id"),
    ]);

  const levelsByTopic = new Map<string, number>();
  for (const row of (levelCounts ?? []) as Array<{ topic_id: string }>) {
    levelsByTopic.set(row.topic_id, (levelsByTopic.get(row.topic_id) ?? 0) + 1);
  }

  const topicsBySubject = new Map<string, TopicRow[]>();
  for (const t of (topics ?? []) as TopicRow[]) {
    const arr = topicsBySubject.get(t.subject_id) ?? [];
    arr.push(t);
    topicsBySubject.set(t.subject_id, arr);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-lg font-black text-white shadow-md shadow-brand-500/30 ring-1 ring-brand-600 active:scale-95"
          aria-label="Volver"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">📚 Contenido</h1>
          <p className="text-sm text-slate-600">Materias, temas y niveles</p>
        </div>
      </div>

      <section className="mt-6 space-y-6">
        {(subjects ?? []).map((s: SubjectRow) => {
          const subjectTopics = topicsBySubject.get(s.id) ?? [];
          return (
            <div
              key={s.id}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-slate-900">
                    {s.emoji ? `${s.emoji} ` : ""}
                    {s.name_es}
                    <span className="ml-2 text-xs font-semibold text-slate-400">
                      / {s.name_en}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    slug: {s.slug} · orden: {s.sort_order}
                  </p>
                </div>
                <form action={deleteSubject}>
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100"
                  >
                    Eliminar
                  </button>
                </form>
              </div>

              <ul className="mt-3 space-y-2">
                {subjectTopics.length === 0 && (
                  <li className="text-xs text-slate-400">Sin temas todavía.</li>
                )}
                {subjectTopics.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                  >
                    <Link
                      href={`/admin/content/topics/${t.id}`}
                      className="min-w-0 flex-1"
                    >
                      <p className="truncate text-sm font-bold text-slate-900">
                        {t.emoji ? `${t.emoji} ` : ""}
                        {t.name_es}
                        <span className="ml-2 text-xs font-normal text-slate-400">
                          / {t.name_en}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        slug: {t.slug} · edad: {t.age_min ?? "-"}-{t.age_max ?? "-"} ·{" "}
                        {levelsByTopic.get(t.id) ?? 0} niveles
                      </p>
                    </Link>
                    <span className="text-slate-400">→</span>
                  </li>
                ))}
              </ul>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-bold text-brand-600">
                  + Nuevo tema
                </summary>
                <form
                  action={createTopic}
                  className="mt-2 grid grid-cols-2 gap-2 text-xs"
                >
                  <input type="hidden" name="subject_id" value={s.id} />
                  <input
                    name="slug"
                    placeholder="slug"
                    required
                    className="rounded-lg border border-slate-300 px-2 py-1"
                  />
                  <input
                    name="emoji"
                    placeholder="emoji"
                    className="rounded-lg border border-slate-300 px-2 py-1"
                  />
                  <input
                    name="name_es"
                    placeholder="nombre (es)"
                    required
                    className="rounded-lg border border-slate-300 px-2 py-1"
                  />
                  <input
                    name="name_en"
                    placeholder="nombre (en)"
                    required
                    className="rounded-lg border border-slate-300 px-2 py-1"
                  />
                  <input
                    name="age_min"
                    type="number"
                    placeholder="edad min"
                    className="rounded-lg border border-slate-300 px-2 py-1"
                  />
                  <input
                    name="age_max"
                    type="number"
                    placeholder="edad max"
                    className="rounded-lg border border-slate-300 px-2 py-1"
                  />
                  <input
                    name="sort_order"
                    type="number"
                    placeholder="orden"
                    defaultValue={0}
                    className="rounded-lg border border-slate-300 px-2 py-1"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-brand-500 px-2 py-1 font-bold text-white"
                  >
                    Crear tema
                  </button>
                </form>
              </details>
            </div>
          );
        })}
      </section>

      <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black text-slate-900">+ Nueva materia</p>
        <form action={createSubject} className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <input
            name="slug"
            placeholder="slug"
            required
            className="rounded-lg border border-slate-300 px-2 py-1"
          />
          <input
            name="emoji"
            placeholder="emoji"
            className="rounded-lg border border-slate-300 px-2 py-1"
          />
          <input
            name="name_es"
            placeholder="nombre (es)"
            required
            className="rounded-lg border border-slate-300 px-2 py-1"
          />
          <input
            name="name_en"
            placeholder="nombre (en)"
            required
            className="rounded-lg border border-slate-300 px-2 py-1"
          />
          <input
            name="sort_order"
            type="number"
            placeholder="orden"
            defaultValue={0}
            className="rounded-lg border border-slate-300 px-2 py-1"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-2 py-1 font-bold text-white"
          >
            Crear materia
          </button>
        </form>
      </section>
    </main>
  );
}
