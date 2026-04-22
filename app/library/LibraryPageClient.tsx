"use client";

import Link from "next/link";
import { MASCOTS, type MascotVariant } from "@/lib/mascots";
import { LibraryCard } from "./LibraryCard";
import { useI18n } from "@/lib/i18n/context";

export default function LibraryPageClient({
  selectedId,
  unlocked,
  unlockedCount,
  onSelect,
}: {
  selectedId: number;
  unlocked: number[];
  unlockedCount: number;
  onSelect: (id: number) => Promise<void>;
}) {
  const { t } = useI18n();
  const unlockedSet = new Set(unlocked);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 pb-24">
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
            {t("library.title")}
          </h1>
          <p className="text-sm text-slate-600">
            {t("library.counter", {
              n: unlockedCount,
              total: MASCOTS.length,
            })}
          </p>
        </div>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all"
          style={{ width: `${(unlockedCount / MASCOTS.length) * 100}%` }}
        />
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {MASCOTS.map((m: MascotVariant) => (
          <li key={m.id}>
            <LibraryCard
              mascot={m}
              isUnlocked={unlockedSet.has(m.id)}
              isSelected={selectedId === m.id}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
