import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUsername } from "@/lib/admin";
import { listMechanicIds } from "@/lib/mechanics/registry";
import {
  createLevel,
  deleteTopic,
  updateTopic,
} from "../../actions";

export const dynamic = "force-dynamic";

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

interface LevelRow {
  id: string;
  position: number;
  emoji: string | null;
  mechanic: string;
  unlocks_mascot_id: number | null;
  replayable: boolean;
}

export default async function TopicEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
  const [{ data: topic }, { data: levels }] = await Promise.all([
    admin
      .from("topics")
      .select(
        "id, subject_id, slug, emoji, name_es, name_en, age_min, age_max, sort_order",
      )
      .eq("id", id)
      .maybeSingle(),
    admin
      .from("topic_levels")
      .select("id, position, emoji, mechanic, unlocks_mascot_id, replayable")
      .eq("topic_id", id)
      .order("position", { ascending: true }),
  ]);

  if (!topic) notFound();
  const t = topic as TopicRow;

  const nextPosition =
    (levels ?? []).reduce((m, r) => Math.max(m, r.position), 0) + 1;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/content"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-lg font-black text-white shadow-md shadow-brand-500/30 ring-1 ring-brand-600 active:scale-95"
          aria-label="Volver"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {t.emoji ? `${t.emoji} ` : ""}
            {t.name_es}
          </h1>
          <p className="text-sm text-slate-600">Editar tema y niveles</p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black text-slate-900">Datos del tema</p>
        <form action={updateTopic} className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <input type="hidden" name="id" value={t.id} />
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">slug</span>
            <input
              name="slug"
              defaultValue={t.slug}
              required
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">emoji</span>
            <input
              name="emoji"
              defaultValue={t.emoji ?? ""}
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">nombre (es)</span>
            <input
              name="name_es"
              defaultValue={t.name_es}
              required
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">nombre (en)</span>
            <input
              name="name_en"
              defaultValue={t.name_en}
              required
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">edad min</span>
            <input
              name="age_min"
              type="number"
              defaultValue={t.age_min ?? ""}
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">edad max</span>
            <input
              name="age_max"
              type="number"
              defaultValue={t.age_max ?? ""}
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">orden</span>
            <input
              name="sort_order"
              type="number"
              defaultValue={t.sort_order}
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
          <div className="col-span-2 mt-2 flex justify-between gap-2">
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-3 py-1.5 font-bold text-white"
            >
              Guardar
            </button>
          </div>
        </form>
        <form
          action={deleteTopic}
          className="mt-3 border-t border-slate-100 pt-3"
        >
          <input type="hidden" name="id" value={t.id} />
          <button
            type="submit"
            className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100"
          >
            Eliminar tema
          </button>
        </form>
      </section>

      <section className="mt-6">
        <p className="mb-3 text-sm font-black text-slate-900">
          Niveles ({(levels ?? []).length})
        </p>
        <ul className="space-y-2">
          {(levels ?? []).map((l: LevelRow) => (
            <li key={l.id}>
              <Link
                href={`/admin/content/levels/${l.id}`}
                className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200 hover:ring-brand-300"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base">
                    {l.emoji ?? "•"}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      #{l.position} · {l.mechanic}
                      {l.replayable && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                          replay
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      mascota:{" "}
                      {l.unlocks_mascot_id != null ? `#${l.unlocks_mascot_id}` : "—"}
                    </p>
                  </div>
                </div>
                <span className="text-slate-400">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black text-slate-900">+ Nuevo nivel</p>
        <form
          action={createLevel}
          className="mt-2 grid grid-cols-2 gap-2 text-xs"
        >
          <input type="hidden" name="topic_id" value={t.id} />
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">position</span>
            <input
              name="position"
              type="number"
              defaultValue={nextPosition}
              required
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">mecánica</span>
            <select
              name="mechanic"
              required
              className="rounded-lg border border-slate-300 px-2 py-1"
            >
              {listMechanicIds().map((mid) => (
                <option key={mid} value={mid}>
                  {mid}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">emoji</span>
            <input
              name="emoji"
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">unlocks_mascot_id</span>
            <input
              name="unlocks_mascot_id"
              type="number"
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1">
            <span className="font-semibold text-slate-600">
              config (JSON, default {"{}"})
            </span>
            <textarea
              name="config"
              rows={3}
              defaultValue="{}"
              className="rounded-lg border border-slate-300 px-2 py-1 font-mono"
            />
          </label>
          <label className="col-span-2 flex items-center gap-2 pt-1">
            <input type="checkbox" name="replayable" />
            <span className="font-semibold text-slate-600">replayable</span>
          </label>
          <div className="col-span-2 mt-1 flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-3 py-1.5 font-bold text-white"
            >
              Crear y editar →
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
