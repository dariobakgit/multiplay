import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUsername } from "@/lib/admin";
import { listMechanicIds } from "@/lib/mechanics/registry";
import { deleteLevel, updateLevel } from "../../actions";

export const dynamic = "force-dynamic";

interface LevelRow {
  id: string;
  topic_id: string;
  position: number;
  emoji: string | null;
  title_key: string | null;
  title_vars: unknown;
  subtitle_key: string | null;
  subtitle_vars: unknown;
  mechanic: string;
  config: unknown;
  unlock_rule: unknown;
  unlocks_mascot_id: number | null;
  coin_reward: unknown;
  replayable: boolean;
}

function pretty(v: unknown): string {
  if (v === null || v === undefined) return "";
  return JSON.stringify(v, null, 2);
}

export default async function LevelEditorPage({
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
  const { data: level } = await admin
    .from("topic_levels")
    .select(
      "id, topic_id, position, emoji, title_key, title_vars, subtitle_key, subtitle_vars, mechanic, config, unlock_rule, unlocks_mascot_id, coin_reward, replayable",
    )
    .eq("id", id)
    .maybeSingle();

  if (!level) notFound();
  const l = level as LevelRow;

  const { data: topic } = await admin
    .from("topics")
    .select("name_es, slug")
    .eq("id", l.topic_id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/content/topics/${l.topic_id}`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-lg font-black text-white shadow-md shadow-brand-500/30 ring-1 ring-brand-600 active:scale-95"
          aria-label="Volver"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Nivel #{l.position}
          </h1>
          <p className="text-sm text-slate-600">
            {topic?.name_es ?? "(tema)"} · {l.mechanic}
          </p>
        </div>
      </div>

      <form
        action={updateLevel}
        className="mt-6 space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
      >
        <input type="hidden" name="id" value={l.id} />

        <div className="grid grid-cols-2 gap-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">position</span>
            <input
              name="position"
              type="number"
              defaultValue={l.position}
              required
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">mecánica</span>
            <select
              name="mechanic"
              defaultValue={l.mechanic}
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
              defaultValue={l.emoji ?? ""}
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">
              unlocks_mascot_id
            </span>
            <input
              name="unlocks_mascot_id"
              type="number"
              defaultValue={l.unlocks_mascot_id ?? ""}
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">title_key</span>
            <input
              name="title_key"
              defaultValue={l.title_key ?? ""}
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">subtitle_key</span>
            <input
              name="subtitle_key"
              defaultValue={l.subtitle_key ?? ""}
              className="rounded-lg border border-slate-300 px-2 py-1"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-slate-600">title_vars (JSON)</span>
          <textarea
            name="title_vars"
            rows={2}
            defaultValue={pretty(l.title_vars)}
            className="rounded-lg border border-slate-300 px-2 py-1 font-mono"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-slate-600">
            subtitle_vars (JSON)
          </span>
          <textarea
            name="subtitle_vars"
            rows={2}
            defaultValue={pretty(l.subtitle_vars)}
            className="rounded-lg border border-slate-300 px-2 py-1 font-mono"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-slate-600">config (JSON)</span>
          <textarea
            name="config"
            rows={12}
            defaultValue={pretty(l.config) || "{}"}
            className="rounded-lg border border-slate-300 px-2 py-1 font-mono"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-slate-600">
            unlock_rule (JSON · ej: {`{"type":"previous"}`})
          </span>
          <textarea
            name="unlock_rule"
            rows={3}
            defaultValue={pretty(l.unlock_rule)}
            className="rounded-lg border border-slate-300 px-2 py-1 font-mono"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-slate-600">
            coin_reward (JSON · ej: {`{"base":5,"perStar":5}`})
          </span>
          <textarea
            name="coin_reward"
            rows={2}
            defaultValue={pretty(l.coin_reward)}
            className="rounded-lg border border-slate-300 px-2 py-1 font-mono"
          />
        </label>

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            name="replayable"
            defaultChecked={l.replayable}
          />
          <span className="font-semibold text-slate-600">replayable</span>
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white"
          >
            Guardar
          </button>
        </div>
      </form>

      <form
        action={deleteLevel}
        className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
      >
        <input type="hidden" name="id" value={l.id} />
        <button
          type="submit"
          className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100"
        >
          Eliminar nivel
        </button>
      </form>
    </main>
  );
}
