"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { audio } from "@/lib/audio";
import {
  formatLevelSubtitle,
  formatLevelTitle,
  levelsByDay,
  totalLevels,
  type Level,
} from "@/lib/curriculum";
import { MASCOTS } from "@/lib/mascots";
import {
  isUnlocked,
  overallPercent,
  passedCountForTheme,
  passedCountForTrack,
  unlockedMascotCount,
  type Progress,
} from "@/lib/progress-helpers";
import { resetProgress } from "@/lib/progress-db";
import { TRACKS, type Track } from "@/lib/tracks";
import { themesFor, type ThemeSlug, type ThemeInfo } from "@/lib/themes";
import { logoutAction } from "./(auth)/actions";
import { type Mood, Character } from "@/components/Mascot";
import type { MascotVariant } from "@/lib/mascots";
import { loadBestStreak } from "@/lib/streak";
import { FNF_UNLOCK_CORRECT, loadLastExam } from "@/lib/exam-state";
import { useI18n } from "@/lib/i18n/context";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

const TRACK_EMOJI: Record<Track, string> = {
  math: "🧮",
  language: "📚",
};

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
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [activeTheme, setActiveTheme] = useState<ThemeSlug | null>(null);

  useEffect(() => {
    audio.init();
    setMuted(audio.isMuted());
    audio.playMusic("menu");
    return () => audio.stopAll();
  }, []);

  useEffect(() => {
    setBestStreak(loadBestStreak(userId));
    setFnfUnlocked(isAdmin || loadLastExam(userId) >= FNF_UNLOCK_CORRECT);
  }, [userId, isAdmin]);

  const showBack = activeTrack !== null;
  const onBack = () => {
    if (activeTheme !== null) setActiveTheme(null);
    else if (activeTrack !== null) setActiveTrack(null);
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <Header
        t={t}
        locale={locale}
        toggleLocale={toggleLocale}
        muted={muted}
        setMuted={setMuted}
        username={username}
        pending={pending}
        startTransition={startTransition}
        showBack={showBack}
        onBack={onBack}
      />

      {activeTrack === null && (
        <SubjectSelector
          t={t}
          username={username}
          progress={progress}
          selectedMascot={selectedMascot}
          isAdmin={isAdmin}
          onPickTrack={(track) => {
            setActiveTrack(track);
            setActiveTheme(null);
          }}
        />
      )}

      {activeTrack !== null && activeTheme === null && (
        <ThemeSelector
          track={activeTrack}
          t={t}
          progress={progress}
          onPickTheme={(theme) => setActiveTheme(theme)}
        />
      )}

      {activeTrack !== null && activeTheme !== null && (
        <LevelsView
          track={activeTrack}
          theme={activeTheme}
          t={t}
          progress={progress}
          bestStreak={bestStreak}
          fnfUnlocked={fnfUnlocked}
        />
      )}
    </main>
  );
}

function Header({
  t,
  locale,
  toggleLocale,
  muted,
  setMuted,
  username,
  pending,
  startTransition,
  showBack,
  onBack,
}: {
  t: TFn;
  locale: "es" | "en";
  toggleLocale: () => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
  username: string;
  pending: boolean;
  startTransition: ReturnType<typeof useTransition>[1];
  showBack: boolean;
  onBack: () => void;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-lg font-black text-white shadow-md shadow-brand-500/30 ring-1 ring-brand-600 active:scale-95"
            aria-label={t("topbar.back")}
          >
            ←
          </button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-black tracking-tight text-slate-900">
            {t("home.greeting", { name: username })}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{t("home.subtitle")}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
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
    </header>
  );
}

function SubjectSelector({
  t,
  username,
  progress,
  selectedMascot,
  isAdmin,
  onPickTrack,
}: {
  t: TFn;
  username: string;
  progress: Progress;
  selectedMascot: MascotVariant;
  isAdmin: boolean;
  onPickTrack: (track: Track) => void;
}) {
  const totalPassedAcrossTracks = unlockedMascotCount(progress);
  const passedTotal = TRACKS.reduce(
    (sum, tr) => sum + passedCountForTrack(tr, progress),
    0,
  );
  const mascot = pickHomeMascot(t, username, passedTotal, selectedMascot.name);

  return (
    <div className="flex flex-col items-center">
      {/* Mascot */}
      <div className="flex flex-col items-center gap-3 py-2">
        <Character variant={selectedMascot} size="lg" mood={mascot.mood} />
        <p className="rounded-2xl bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
          {mascot.messages[0]}
        </p>
      </div>

      {/* Library card */}
      <Link
        href="/library"
        className="mt-6 flex w-full items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200 transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
            {t("home.library_title")}
          </p>
          <p className="text-sm font-black text-amber-900">
            {t("home.library_subtitle", {
              n: totalPassedAcrossTracks,
              total: MASCOTS.length,
            })}
          </p>
        </div>
        <span className="text-amber-700">→</span>
      </Link>

      {/* Subject picker */}
      <div className="mt-8 w-full">
        <p className="mb-3 text-center text-sm font-bold uppercase tracking-wide text-slate-500">
          {t("home.pick_subject")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {TRACKS.map((track) => {
            const passed = passedCountForTrack(track, progress);
            const total = themesFor(track).reduce(
              (sum, th) => sum + totalLevels(track, th.slug),
              0,
            );
            const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
            return (
              <button
                key={track}
                type="button"
                onClick={() => onPickTrack(track)}
                className="flex flex-col items-center gap-2 rounded-2xl bg-white p-5 shadow-sm ring-2 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-brand-500 hover:shadow-md active:scale-[0.98]"
              >
                <span className="text-5xl">{TRACK_EMOJI[track]}</span>
                <span className="text-lg font-black text-slate-900">
                  {t(`track.${track}`)}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {passed} / {total}
                </span>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {isAdmin && (
        <Link
          href="/admin"
          className="mt-6 flex w-full items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 ring-1 ring-slate-800 transition hover:-translate-y-0.5 hover:shadow-md"
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
    </div>
  );
}

function ThemeSelector({
  track,
  t,
  progress,
  onPickTheme,
}: {
  track: Track;
  t: TFn;
  progress: Progress;
  onPickTheme: (slug: ThemeSlug) => void;
}) {
  const themes = themesFor(track);
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-4xl">{TRACK_EMOJI[track]}</span>
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            {t(`track.${track}`)}
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            {t("home.pick_theme")}
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {themes.map((th: ThemeInfo) => {
          const total = totalLevels(track, th.slug);
          const passed = passedCountForTheme(track, th.slug, progress);
          const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
          const isAvailable = total > 0;
          return (
            <li key={th.slug}>
              <button
                type="button"
                onClick={() => isAvailable && onPickTheme(th.slug)}
                disabled={!isAvailable}
                className={`flex w-full items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-2 ring-slate-200 transition ${
                  isAvailable
                    ? "hover:-translate-y-0.5 hover:ring-brand-500 hover:shadow-md active:scale-[0.99]"
                    : "cursor-not-allowed opacity-60"
                }`}
              >
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-base font-black text-slate-900">
                    {t(th.nameKey)}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    {isAvailable
                      ? `${passed} / ${total}`
                      : t("home.theme_empty")}
                  </p>
                  {isAvailable && (
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
                <span className="text-slate-400">→</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LevelsView({
  track,
  theme,
  t,
  progress,
  bestStreak,
  fnfUnlocked,
}: {
  track: Track;
  theme: ThemeSlug;
  t: TFn;
  progress: Progress;
  bestStreak: number;
  fnfUnlocked: boolean;
}) {
  const passedThisTheme = passedCountForTheme(track, theme, progress);
  const totalThisTheme = totalLevels(track, theme);
  const pct = overallPercent(track, theme, progress, totalThisTheme);
  const examUnlocked =
    progress.results.math?.tables?.[29]?.passed === true;
  const themeInfo = themesFor(track).find((th) => th.slug === theme);

  return (
    <div>
      {/* Theme header */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl">{TRACK_EMOJI[track]}</span>
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            {themeInfo ? t(themeInfo.nameKey) : theme}
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            {t(`track.${track}`)} · {passedThisTheme} / {totalThisTheme}
          </p>
        </div>
        {bestStreak >= 2 && (
          <div className="ml-auto rounded-2xl bg-amber-50 px-3 py-2 text-center shadow-sm ring-1 ring-amber-200">
            <div className="text-xl leading-none">🔥</div>
            <div className="text-base font-black leading-none text-amber-700">
              {bestStreak}
            </div>
            <div className="mt-0.5 whitespace-pre-line text-[8px] font-bold uppercase leading-tight text-amber-700">
              {t("home.best_streak")}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">
            {t("home.progress_total")}
          </span>
          <span className="font-bold text-brand-600">{pct}%</span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Math/tables-only bonus modes */}
      {track === "math" && theme === "tables" && (
        <div className="mt-3 space-y-3">
          {examUnlocked ? (
            <Link
              href="/exam"
              className="flex items-center justify-between rounded-2xl bg-indigo-50 px-4 py-3 ring-1 ring-indigo-200 transition hover:-translate-y-0.5 hover:shadow-md"
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
            <div className="flex cursor-not-allowed items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 opacity-70 ring-1 ring-slate-200">
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
              className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-rose-600 to-slate-900 px-4 py-3 ring-1 ring-rose-900 transition hover:-translate-y-0.5 hover:shadow-md"
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
        </div>
      )}

      {/* Day sections */}
      <div className="mt-6">
        {[1, 2, 3].map((d) => (
          <DaySection
            key={`${track}-${theme}-${d}`}
            track={track}
            theme={theme}
            day={d as 1 | 2 | 3}
            levels={levelsByDay(track, theme, d as 1 | 2 | 3)}
            progress={progress}
          />
        ))}
      </div>
    </div>
  );
}

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
  return {
    mood: "happy",
    messages: [t("mascot.default1"), t("mascot.default2")],
  };
}

function DaySection({
  track,
  theme,
  day,
  levels,
  progress,
}: {
  track: Track;
  theme: ThemeSlug;
  day: 1 | 2 | 3;
  levels: Level[];
  progress: Progress;
}) {
  const { t } = useI18n();
  if (levels.length === 0) return null;
  const label = t(`home.${track}.day${day}`);
  const dayPassed = levels.filter(
    (l) => progress.results[track]?.[theme]?.[l.id]?.passed,
  ).length;

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
          <LevelCard
            key={`${track}-${theme}-${l.id}`}
            track={track}
            theme={theme}
            level={l}
            progress={progress}
          />
        ))}
      </ol>
    </section>
  );
}

function LevelCard({
  track,
  theme,
  level,
  progress,
}: {
  track: Track;
  theme: ThemeSlug;
  level: Level;
  progress: Progress;
}) {
  const { t } = useI18n();
  const unlocked = isUnlocked(track, theme, level.id, progress);
  const r = progress.results[track]?.[theme]?.[level.id];
  const stars = progress.stars[track]?.[theme]?.[level.id] ?? 0;
  const passed = r?.passed;

  const ring = passed
    ? "ring-brand-500 bg-brand-50"
    : unlocked
    ? "ring-slate-200 bg-white"
    : "ring-slate-200 bg-slate-50 opacity-60";

  const isMixBadge = level.track === "math" && level.kind === "mix";

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
          {isMixBadge && (
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
        <Link href={`/level/${track}/${theme}/${level.id}`} className="block">
          {inner}
        </Link>
      ) : (
        <div className="cursor-not-allowed">{inner}</div>
      )}
    </li>
  );
}
