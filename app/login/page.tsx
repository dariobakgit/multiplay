"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthState } from "../(auth)/actions";
import { useI18n } from "@/lib/i18n/context";

const initial: AuthState = { error: null };

export default function LoginPage() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
      <div className="text-center">
        <div className="text-6xl">🌱</div>
        <h1 className="mt-3 text-3xl font-black text-slate-900">
          {t("auth.app_title")}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{t("auth.login_sub")}</p>
      </div>

      <form
        action={action}
        className="mt-8 space-y-3"
        autoComplete="on"
      >
        <input
          id="username"
          name="username"
          type="text"
          placeholder={t("auth.username_placeholder")}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
          required
          className="w-full rounded-2xl border-0 bg-white px-4 py-4 text-lg font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500"
        />
        <input
          id="current-password"
          name="password"
          type="password"
          placeholder={t("auth.password_placeholder")}
          autoComplete="current-password"
          required
          className="w-full rounded-2xl border-0 bg-white px-4 py-4 text-lg font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500"
        />
        {state.error && (
          <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
            {t(state.error)}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-brand-500 py-4 text-lg font-black text-white shadow-lg shadow-brand-500/30 active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? t("auth.login_submitting") : t("auth.login_submit")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {t("auth.no_account")}{" "}
        <Link href="/signup" className="font-bold text-brand-600">
          {t("auth.go_signup")}
        </Link>
      </p>
    </main>
  );
}
