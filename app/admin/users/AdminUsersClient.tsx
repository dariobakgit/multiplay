"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { adminChangePassword, adminResetProgress } from "./actions";
import { useI18n } from "@/lib/i18n/context";

export interface AdminUser {
  id: string;
  username: string;
  levelsPassed: number;
  createdAt: string | null;
  isSelf: boolean;
}

export default function AdminClient({ users }: { users: AdminUser[] }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(
    null,
  );

  function showToast(kind: "ok" | "err", msg: string) {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function onChangePassword(u: AdminUser) {
    const pw = window.prompt(t("admin.new_password_prompt", { name: u.username }));
    if (pw === null) return;
    const trimmed = pw.trim();
    if (trimmed.length < 4) {
      showToast("err", t("admin.pw_too_short"));
      return;
    }
    startTransition(async () => {
      const res = await adminChangePassword(u.id, trimmed);
      if (res.ok) showToast("ok", t("admin.pw_changed", { name: u.username }));
      else showToast("err", `❌ ${res.error}`);
    });
  }

  function onResetProgress(u: AdminUser) {
    if (!window.confirm(t("admin.reset_confirm", { name: u.username }))) return;
    startTransition(async () => {
      const res = await adminResetProgress(u.id);
      if (res.ok) showToast("ok", t("admin.reset_done", { name: u.username }));
      else showToast("err", `❌ ${res.error}`);
    });
  }

  const countText =
    users.length === 1
      ? t("admin.user_count_one")
      : t("admin.user_count_many", { n: users.length });

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-lg font-black text-white shadow-md shadow-brand-500/30 ring-1 ring-brand-600 active:scale-95"
          aria-label={t("topbar.back")}
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {t("admin.title")} · {t("home.admin_subtitle")}
          </h1>
          <p className="text-sm text-slate-600">{countText}</p>
        </div>
      </div>

      {toast && (
        <div
          className={`mt-4 rounded-xl px-4 py-2 text-sm font-bold ring-1 ${
            toast.kind === "ok"
              ? "bg-brand-50 text-brand-700 ring-brand-200"
              : "bg-rose-50 text-rose-700 ring-rose-200"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {users.map((u) => (
          <li
            key={u.id}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-lg font-black text-slate-900">
                  {u.username}
                  {u.isSelf && (
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-700">
                      {t("admin.you")}
                    </span>
                  )}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {t("admin.levels_passed", { n: u.levelsPassed })}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => onChangePassword(u)}
                  disabled={pending}
                  className="rounded-xl bg-blue-500 px-3 py-2 text-xs font-black text-white shadow-sm active:scale-[0.98] disabled:opacity-50"
                >
                  {t("admin.change_password")}
                </button>
                <button
                  type="button"
                  onClick={() => onResetProgress(u)}
                  disabled={pending || u.isSelf}
                  title={u.isSelf ? t("admin.no_self_reset") : undefined}
                  className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-black text-white shadow-sm active:scale-[0.98] disabled:opacity-50"
                >
                  {t("admin.reset_game")}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
