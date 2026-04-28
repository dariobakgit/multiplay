"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { updateSettings, type SettingsState } from "./actions";

const initial: SettingsState = { status: "idle" };

export default function SettingsClient({
  username,
  displayName,
  birthDate,
}: {
  username: string;
  displayName: string;
  birthDate: string;
}) {
  const { t, locale, setLocale } = useI18n();
  const [state, action, pending] = useActionState(updateSettings, initial);

  return (
    <main className="mx-auto max-w-xl px-4 py-6 pb-24">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-lg font-black text-white shadow-md shadow-brand-500/30 ring-1 ring-brand-600 active:scale-95"
          aria-label={t("topbar.back")}
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {t("settings.title")}
          </h1>
          <p className="text-sm text-slate-600">{t("settings.subtitle")}</p>
        </div>
      </div>

      <form action={action} className="mt-6 space-y-6">
        {/* Account section */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("settings.section_account")}
          </h2>

          <div className="mt-4 space-y-4">
            <Field label={t("settings.username_label")}>
              <input
                value={username}
                disabled
                className="w-full rounded-xl bg-slate-100 px-4 py-3 text-base font-semibold text-slate-500 ring-1 ring-slate-200"
              />
              <p className="mt-1 text-xs text-slate-500">
                {t("settings.username_hint")}
              </p>
            </Field>

            <Field label={t("settings.display_name")}>
              <input
                name="display_name"
                type="text"
                defaultValue={displayName}
                placeholder={t("settings.display_name_placeholder")}
                maxLength={50}
                autoComplete="off"
                className="w-full rounded-xl bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                {t("settings.display_name_hint")}
              </p>
            </Field>

            <Field label={t("settings.birth_date")}>
              <input
                name="birth_date"
                type="date"
                defaultValue={birthDate}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-xl bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                {t("settings.birth_date_hint")}
              </p>
            </Field>
          </div>
        </section>

        {/* App section */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("settings.section_app")}
          </h2>

          <div className="mt-4">
            <Field label={t("settings.language")}>
              <div className="flex gap-2">
                {(["es", "en"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLocale(l)}
                    className={`flex-1 rounded-xl px-4 py-3 text-sm font-black transition ${
                      locale === l
                        ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {l === "es" ? "Español" : "English"}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </section>

        {state.status === "ok" && (
          <p className="rounded-xl bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 ring-1 ring-brand-200">
            {t("settings.saved")}
          </p>
        )}
        {state.status === "error" && (
          <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 ring-1 ring-rose-200">
            {t(state.errorKey ?? "settings.save_error")}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-brand-500 py-4 text-lg font-black text-white shadow-lg shadow-brand-500/30 active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? t("settings.saving") : t("settings.save")}
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}
