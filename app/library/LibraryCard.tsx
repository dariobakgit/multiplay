"use client";

import { useTransition } from "react";
import { Character, useRandomMove } from "@/components/Mascot";
import type { MascotVariant } from "@/lib/mascots";
import { useI18n } from "@/lib/i18n/context";

interface Props {
  mascot: MascotVariant;
  isUnlocked: boolean;
  isSelected: boolean;
  onSelect: (id: number) => Promise<void>;
}

export function LibraryCard({
  mascot,
  isUnlocked,
  isSelected,
  onSelect,
}: Props) {
  const { t } = useI18n();
  const { move, trigger, clear } = useRandomMove();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!isUnlocked) return;
    trigger();
    if (!isSelected) {
      startTransition(() => onSelect(mascot.id));
    }
  }

  const base =
    "flex w-full flex-col items-center rounded-2xl p-3 shadow-sm ring-2 transition";
  const ringCls = isSelected
    ? "bg-brand-50 ring-brand-500"
    : isUnlocked
    ? "bg-white ring-transparent hover:-translate-y-0.5 hover:ring-brand-300 hover:shadow-md"
    : "bg-slate-50 ring-transparent";
  const cursor = isUnlocked ? "cursor-pointer" : "cursor-not-allowed";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isUnlocked || pending}
      className={`${base} ${ringCls} ${cursor}`}
    >
      <Character
        variant={mascot}
        size="sm"
        animated={isUnlocked}
        locked={!isUnlocked}
        animClass={move}
        onAnimationEnd={clear}
      />
      <p
        className={`mt-2 text-sm font-black ${
          isUnlocked ? "text-slate-900" : "text-slate-400"
        }`}
      >
        {isUnlocked ? mascot.name : t("library.unknown")}
      </p>
      <p className="text-[10px] font-semibold uppercase text-slate-500">
        {t("library.level_n", { n: mascot.id })}
      </p>
      {isSelected && (
        <span className="mt-1 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">
          {t("library.chosen")}
        </span>
      )}
      {isUnlocked && !isSelected && (
        <span className="mt-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-black uppercase text-brand-700">
          {t("library.choose")}
        </span>
      )}
    </button>
  );
}
