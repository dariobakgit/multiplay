import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminUsername } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminHubPage() {
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
            🛠 Administración
          </h1>
          <p className="text-sm text-slate-600">
            Elegí qué administrar
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/users"
          className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl">
            👤
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-black text-slate-900">Usuarios</p>
            <p className="text-xs text-slate-600">Cambiar clave o reiniciar progreso</p>
          </div>
          <span className="text-slate-400">→</span>
        </Link>

        <Link
          href="/admin/content"
          className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-2xl">
            📚
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-black text-slate-900">Contenido</p>
            <p className="text-xs text-slate-600">Materias, temas y niveles</p>
          </div>
          <span className="text-slate-400">→</span>
        </Link>
      </div>
    </main>
  );
}
