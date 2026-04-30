"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import type { TopicLevelData } from "@/lib/topics-db";

interface Item {
  level: TopicLevelData;
  progress: { passed: boolean; score: number; total: number; stars: number } | null;
  unlocked: boolean;
}

const MECHANIC_BADGE: Record<string, { es: string; en: string; cls: string }> = {
  multiple_choice: {
    es: "Opciones",
    en: "Choice",
    cls: "bg-brand-100 text-brand-700",
  },
  exam: {
    es: "Examen",
    en: "Exam",
    cls: "bg-indigo-100 text-indigo-700",
  },
  battle: {
    es: "Batalla",
    en: "Battle",
    cls: "bg-rose-100 text-rose-700",
  },
};

export default function TopicGrid({
  topicSlug,
  items,
}: {
  topicSlug: string;
  items: Item[];
}) {
  const { t, locale } = useI18n();

  return (
    <ol className="mt-6 space-y-3">
      {items.map(({ level, progress, unlocked }) => {
        const stars = progress?.stars ?? 0;
        const passed = progress?.passed === true;
        const ring = passed
          ? "ring-brand-500 bg-brand-50"
          : unlocked
          ? "ring-slate-200 bg-white"
          : "ring-slate-200 bg-slate-50 opacity-60";

        const badge = MECHANIC_BADGE[level.mechanic];

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
              {unlocked ? level.emoji ?? "•" : "🔒"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t("library.level_n", { n: level.position })}
                </span>
                {badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${badge.cls}`}
                  >
                    {locale === "en" ? badge.en : badge.es}
                  </span>
                )}
              </div>
              <p className="truncate text-base font-bold text-slate-900">
                {level.titleKey
                  ? t(level.titleKey, level.titleVars ?? undefined)
                  : `Nivel ${level.position}`}
              </p>
              {level.subtitleKey && (
                <p className="truncate text-xs text-slate-600">
                  {t(level.subtitleKey, level.subtitleVars ?? undefined)}
                </p>
              )}
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
            </div>
          </div>
        );

        return (
          <li key={level.id}>
            {unlocked ? (
              <Link
                href={`/topic/${topicSlug}/level/${level.position}`}
                className="block"
              >
                {inner}
              </Link>
            ) : (
              <div className="cursor-not-allowed">{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
