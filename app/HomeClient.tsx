"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { audio } from "@/lib/audio";
import { MASCOTS } from "@/lib/mascots";
import { resetProgress } from "@/lib/progress-db";
import { logoutAction } from "./(auth)/actions";
import { Mascot, type Mood } from "@/components/Mascot";
import type { MascotVariant } from "@/lib/mascots";
import { useI18n } from "@/lib/i18n/context";

export interface TopicCardData {
  id: string;
  slug: string;
  emoji: string | null;
  nameEs: string;
  nameEn: string;
  subjectNameEs: string;
  subjectNameEn: string;
  subjectEmoji: string | null;
  levelsTotal: number;
  levelsPassed: number;
  streakBest: number;
}

export default function HomeClient({
  username,
  greetingName,
  selectedMascot,
  userId,
  isAdmin,
  topics,
  ownedMascotsCount,
}: {
  username: string;
  greetingName: string;
  selectedMascot: MascotVariant;
  userId: string;
  isAdmin: boolean;
  topics: TopicCardData[];
  ownedMascotsCount: number;
}) {
  const { t, locale } = useI18n();
  const [pending, startTransition] = useTransition();
  const [muted, setMuted] = useState(false);

  const totalPassed = topics.reduce((s, t) => s + t.levelsPassed, 0);
  const totalLevels = topics.reduce((s, t) => s + t.levelsTotal, 0);
  const bestStreakAcrossTopics = Math.max(
    0,
    ...topics.map((t) => t.streakBest),
  );

  // Group topics by subject
  const bySubject = new Map<
    string,
    { name: string; emoji: string | null; topics: TopicCardData[] }
  >();
  for (const tt of topics) {
    const key = locale === "en" ? tt.subjectNameEn : tt.subjectNameEs;
    if (!bySubject.has(key)) {
      bySubject.set(key, {
        name: key,
        emoji: tt.subjectEmoji,
        topics: [],
      });
    }
    bySubject.get(key)!.topics.push(tt);
  }

  const mascot = pickHomeMascot(t, greetingName, totalPassed, selectedMascot.name);

  useEffect(() => {
    audio.init();
    setMuted(audio.isMuted());
    audio.playMusic("menu");
    return () => audio.stopAll();
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {t("home.greeting", { name: greetingName })}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{t("home.subtitle")}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Link
                href="/settings"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                aria-label={t("home.settings_aria")}
              >
                ⚙️
              </Link>
              <button
                type="button"
                onClick={() => {
                  const m = audio.toggleMute();
                  setMuted(m);
                  if (!m) audio.playMusic("menu");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                aria-label={muted ? t("home.sound_unmute") : t("home.sound_mute")}
              >
                {muted ? "🔇" : "🔊"}
              </button>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-rose-600"
                >
                  {t("home.logout")}
                </button>
              </form>
            </div>
            <button
              onClick={() => {
                if (!confirm(t("home.reset_confirm", { name: username })))
                  return;
                startTransition(async () => {
                  await resetProgress();
                });
              }}
              disabled={pending}
              className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 disabled:opacity-50"
            >
              {pending ? t("home.resetting") : t("home.reset")}
            </button>
          </div>
        </div>

        {totalLevels > 0 && (
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">
                {t("home.progress_total")}
              </span>
              <span className="font-bold text-brand-600">
                {totalPassed} / {totalLevels}
              </span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all"
                style={{
                  width: `${
                    totalLevels === 0
                      ? 0
                      : (totalPassed / totalLevels) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="mt-5 flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <Mascot
              mood={mascot.mood}
              message={mascot.messages}
              size="md"
              variant={selectedMascot}
            />
          </div>
          {bestStreakAcrossTopics >= 2 && (
            <div className="shrink-0 rounded-2xl bg-amber-50 px-3 py-2 text-center shadow-sm ring-1 ring-amber-200">
              <div className="text-2xl leading-none">🔥</div>
              <div className="mt-1 text-xl font-black leading-none text-amber-700">
                {bestStreakAcrossTopics}
              </div>
              <div className="mt-1 whitespace-pre-line text-[9px] font-bold uppercase leading-tight text-amber-700">
                {t("home.best_streak")}
              </div>
            </div>
          )}
        </div>

        <Link
          href="/library"
          className="mt-3 flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
              {t("home.library_title")}
            </p>
            <p className="text-sm font-black text-amber-900">
              {t("home.library_subtitle", {
                n: ownedMascotsCount,
                total: MASCOTS.length,
              })}
            </p>
          </div>
          <span className="text-amber-700">→</span>
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            className="mt-3 flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 ring-1 ring-slate-800 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {t("home.admin_title")}
              </p>
              <p className="text-sm font-black text-white">
                {t("home.admin_subtitle")}
              </p>
            </div>
            <span className="text-slate-400">→</span>
          </Link>
        )}
      </header>

      {Array.from(bySubject.values()).map((subject) => (
        <section key={subject.name} className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-slate-800">
            {subject.emoji ? `${subject.emoji} ` : ""}
            {subject.name}
          </h2>
          <ul className="space-y-3">
            {subject.topics.map((tt) => {
              const pct =
                tt.levelsTotal > 0
                  ? (tt.levelsPassed / tt.levelsTotal) * 100
                  : 0;
              const done = tt.levelsTotal > 0 && tt.levelsPassed >= tt.levelsTotal;
              return (
                <li key={tt.id}>
                  <Link
                    href={`/topic/${tt.slug}`}
                    className={`block rounded-2xl p-4 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${
                      done
                        ? "bg-brand-50 ring-brand-300"
                        : "bg-white ring-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${
                          done ? "bg-brand-500 text-white" : "bg-slate-100"
                        }`}
                      >
                        {tt.emoji ?? "•"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-black text-slate-900">
                          {locale === "en" ? tt.nameEn : tt.nameEs}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-bold">
                            {tt.levelsPassed} / {tt.levelsTotal}
                          </span>
                          {tt.streakBest >= 2 && (
                            <span className="font-bold text-amber-600">
                              · 🔥 {tt.streakBest}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-slate-400">→</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {topics.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-600">
            {/* edge case: no topics for this user's age */}
            No topics available.
          </p>
        </div>
      )}
    </main>
  );
}

type TFn = (key: string, vars?: Record<string, string | number>) => string;

function pickHomeMascot(
  t: TFn,
  username: string,
  passedCount: number,
  mascotName: string,
): { mood: Mood; messages: string[] } {
  if (passedCount === 0) {
    return {
      mood: "excited",
      messages: [
        t("mascot.welcome_first", { name: username, mascot: mascotName }),
        t("mascot.welcome_intro"),
        t("mascot.welcome_start"),
      ],
    };
  }
  if (passedCount >= 30) {
    return {
      mood: "celebrate",
      messages: [
        t("mascot.all_done_title", { name: username }),
        t("mascot.all_done_sub"),
      ],
    };
  }
  if (passedCount >= 15) {
    return {
      mood: "happy",
      messages: [
        t("mascot.halfway1", { name: username }),
        t("mascot.halfway2"),
      ],
    };
  }
  return {
    mood: "happy",
    messages: [t("mascot.default1"), t("mascot.default2")],
  };
}
