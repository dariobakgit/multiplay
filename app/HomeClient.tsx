"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { audio } from "@/lib/audio";
import {
  formatLevelSubtitle,
  formatLevelTitle,
  levelsByDay,
  TOTAL_LEVELS,
  type Level,
} from "@/lib/curriculum";
import { MASCOTS } from "@/lib/mascots";
import {
  isUnlocked,
  overallPercent,
  type Progress,
} from "@/lib/progress-helpers";
import { resetProgress } from "@/lib/progress-db";
import { logoutAction } from "./(auth)/actions";
import { Mascot, type Mood } from "@/components/Mascot";
import type { MascotVariant } from "@/lib/mascots";
import { loadBestStreak } from "@/lib/streak";
import { FNF_UNLOCK_CORRECT, loadLastExam } from "@/lib/exam-state";
import { useI18n } from "@/lib/i18n/context";

export default function HomeClient({
  username,
  progress,
  selectedMascot,
  userId,
  isAdmin,
}: {
  username: string;
  progress: Progress;
  selectedMascot: MascotVariant;
  userId: string;
  isAdmin: boolean;
}) {
  const { t, locale, toggleLocale } = useI18n();
  const [pending, startTransition] = useTransition();
  const [muted, setMuted] = useState(false);
  const [bestStreak, setBestStreak] = useState(0);
  const [fnfUnlocked, setFnfUnlocked] = useState(isAdmin);
  const passed = Object.values(progress.results).filter((r) => r.passed).length;
  const examUnlocked = progress.results[29]?.passed === true;
  const pct = overallPercent(progress);

  const mascot = pickHomeMascot(t, username, passed, selectedMascot.name);
  const unlockedCount = passed;

  useEffect(() => {
    audio.init();
    setMuted(audio.isMuted());
    audio.playMusic("menu");
    return () => audio.stopMusic();
  }, []);

  useEffect(() => {
    setBestStreak(loadBestStreak(userId));
    setFnfUnlocked(isAdmin || loadLastExam(userId) >= FNF_UNLOCK_CORRECT);
  }, [userId, isAdmin]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {t("home.greeting", { name: username })}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{t("home.subtitle")}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLocale}
                className="flex h-8 min-w-8 items-center justify-center rounded-full bg-white px-2 text-[10px] font-black uppercase tracking-wide text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                aria-label={t("home.lang_toggle")}
              >
                {locale === "es" ? "ES" : "EN"}
              </button>
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

        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">
              {t("home.progress_total")}
            </span>
            <span className="font-bold text-brand-600">
              {passed} / {TOTAL_LEVELS}
            </span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="mt-5 flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <Mascot
              mood={mascot.mood}
              message={mascot.messages}
              size="md"
              variant={selectedMascot}
            />
          </div>
          {bestStreak >= 2 && (
            <div className="shrink-0 rounded-2xl bg-amber-50 px-3 py-2 text-center shadow-sm ring-1 ring-amber-200">
              <div className="text-2xl leading-none">🔥</div>
              <div className="mt-1 text-xl font-black leading-none text-amber-700">
                {bestStreak}
              </div>
              <div className="mt-1 whitespace-pre-line text-[9px] font-bold uppercase leading-tight text-amber-700">
                {t("home.best_streak")}
              </div>
            </div>
          )}
        </div>

        {examUnlocked ? (
          <Link
            href="/exam"
            className="mt-4 flex items-center justify-between rounded-2xl bg-indigo-50 px-4 py-3 ring-1 ring-indigo-200 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                {t("home.exam_title")}
              </p>
              <p className="text-sm font-black text-indigo-900">
                {t("home.exam_subtitle")}
              </p>
            </div>
            <span className="text-indigo-700">→</span>
          </Link>
        ) : (
          <div className="mt-4 flex cursor-not-allowed items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 opacity-70 ring-1 ring-slate-200">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {t("home.exam_locked_title")}
              </p>
              <p className="text-sm font-black text-slate-500">
                {t("home.exam_locked_subtitle")}
              </p>
            </div>
            <span className="text-slate-400">🔒</span>
          </div>
        )}

        {fnfUnlocked && (
          <Link
            href="/fnf"
            className="mt-3 flex items-center justify-between rounded-2xl bg-gradient-to-r from-rose-600 to-slate-900 px-4 py-3 ring-1 ring-rose-900 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-rose-200">
                {t("home.fnf_title")}
              </p>
              <p className="text-sm font-black text-white">
                {t("home.fnf_subtitle")}
              </p>
            </div>
            <span className="text-rose-200">→</span>
          </Link>
        )}

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
                n: unlockedCount,
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

      {[1, 2, 3].map((d) => (
        <DaySection
          key={d}
          day={d as 1 | 2 | 3}
          levels={levelsByDay(d as 1 | 2 | 3)}
          progress={progress}
        />
      ))}
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
  if (passedCount >= TOTAL_LEVELS) {
    return {
      mood: "celebrate",
      messages: [
        t("mascot.all_done_title", { name: username }),
        t("mascot.all_done_sub"),
      ],
    };
  }
  if (passedCount >= TOTAL_LEVELS - 3) {
    return {
      mood: "celebrate",
      messages: [t("mascot.almost_done1"), t("mascot.almost_done2")],
    };
  }
  if (passedCount >= Math.floor(TOTAL_LEVELS / 2)) {
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

function DaySection({
  day,
  levels,
  progress,
}: {
  day: 1 | 2 | 3;
  levels: Level[];
  progress: Progress;
}) {
  const { t } = useI18n();
  const label = t(`home.day${day}`);
  const dayPassed = levels.filter((l) => progress.results[l.id]?.passed).length;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-slate-800">{label}</h2>
        <span className="text-xs font-semibold text-slate-500">
          {dayPassed} / {levels.length}
        </span>
      </div>
      <ol className="space-y-3">
        {levels.map((l) => (
          <LevelCard key={l.id} level={l} progress={progress} />
        ))}
      </ol>
    </section>
  );
}

function LevelCard({ level, progress }: { level: Level; progress: Progress }) {
  const { t } = useI18n();
  const unlocked = isUnlocked(level.id, progress);
  const r = progress.results[level.id];
  const stars = progress.stars[level.id] ?? 0;
  const passed = r?.passed;

  const ring = passed
    ? "ring-brand-500 bg-brand-50"
    : unlocked
    ? "ring-slate-200 bg-white"
    : "ring-slate-200 bg-slate-50 opacity-60";

  const inner = (
    <div
      className={`flex items-center gap-3 rounded-2xl p-4 shadow-sm ring-1 transition ${ring} ${
        unlocked ? "hover:-translate-y-0.5 hover:shadow-md" : ""
      }`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
          passed ? "bg-brand-500 text-white" : "bg-slate-100"
        }`}
      >
        {unlocked ? level.emoji : "🔒"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("library.level_n", { n: level.id })}
          </span>
          {level.kind === "mix" && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
              {t("level.mix_tag")}
            </span>
          )}
        </div>
        <p className="truncate text-base font-bold text-slate-900">
          {formatLevelTitle(level, t)}
        </p>
        <p className="truncate text-xs text-slate-600">
          {formatLevelSubtitle(level, t)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-lg leading-none">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={i < stars ? "text-amber-400" : "text-slate-200"}
            >
              ★
            </span>
          ))}
        </div>
        <div className="mt-1 text-[10px] font-semibold text-slate-500">
          {t("level.pass_min", {
            min: level.minScore,
            total: level.questions,
          })}
        </div>
      </div>
    </div>
  );

  return (
    <li>
      {unlocked ? (
        <Link href={`/level/${level.id}`} className="block">
          {inner}
        </Link>
      ) : (
        <div className="cursor-not-allowed">{inner}</div>
      )}
    </li>
  );
}
