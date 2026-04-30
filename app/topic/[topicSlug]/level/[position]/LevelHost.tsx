"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { audio } from "@/lib/audio";
import { useI18n } from "@/lib/i18n/context";
import { getMascotForLevel, type MascotVariant } from "@/lib/mascots";
import { recordResultByTopicLevel } from "@/lib/progress-db";
import { setStreakState, recordExamResult } from "@/lib/streaks-db";
import { getMechanic } from "@/lib/mechanics/registry";
import type {
  MechanicAfterResult,
  MechanicLevel,
  MechanicResult,
} from "@/lib/mechanics/types";

interface LevelData {
  id: string;
  topicId: string;
  position: number;
  emoji: string | null;
  titleKey: string | null;
  titleVars: Record<string, string | number> | null;
  subtitleKey: string | null;
  subtitleVars: Record<string, string | number> | null;
  config: unknown;
  unlocksMascotId: number | null;
  coinReward: { base?: number; perStar?: number } | null;
  replayable: boolean;
}

export default function LevelHost({
  topicSlug,
  topicId,
  level,
  mechanic,
  selectedMascot,
  userId,
  nextPosition,
  initialStreak,
}: {
  topicSlug: string;
  topicId: string;
  level: LevelData;
  mechanic: string;
  selectedMascot: MascotVariant;
  userId: string;
  nextPosition: number | null;
  initialStreak: { current: number; best: number };
}) {
  const { t } = useI18n();
  const router = useRouter();

  // Audio: música de juego mientras el nivel está abierto.
  useEffect(() => {
    audio.init();
    if (mechanic === "battle") audio.playMusic("fnf");
    else audio.playMusic("game");
    return () => audio.stopAll();
  }, [mechanic]);

  const m = getMechanic(mechanic);
  if (!m) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 py-8">
        <p className="text-sm text-slate-600">
          Mecánica desconocida: {mechanic}
        </p>
        <Link
          href={`/topic/${topicSlug}`}
          className="mt-4 rounded-2xl bg-brand-500 px-4 py-2 font-bold text-white"
        >
          {t("level.back_to_map")}
        </Link>
      </main>
    );
  }

  // Validar config (lanza si está mal)
  let validConfig: unknown;
  try {
    validConfig = m.validateConfig(level.config);
  } catch (e) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 py-8">
        <p className="text-sm text-rose-600">
          Config inválido: {(e as Error).message}
        </p>
        <Link
          href={`/topic/${topicSlug}`}
          className="mt-4 rounded-2xl bg-brand-500 px-4 py-2 font-bold text-white"
        >
          {t("level.back_to_map")}
        </Link>
      </main>
    );
  }

  const mechanicLevel: MechanicLevel<unknown> = {
    id: level.id,
    topicId: level.topicId,
    position: level.position,
    emoji: level.emoji,
    titleKey: level.titleKey,
    titleVars: level.titleVars,
    subtitleKey: level.subtitleKey,
    subtitleVars: level.subtitleVars,
    config: validConfig,
    unlocksMascotId: level.unlocksMascotId,
    coinReward: level.coinReward,
    replayable: level.replayable,
  };

  async function handleResult(
    result: MechanicResult,
  ): Promise<MechanicAfterResult> {
    void topicSlug; // reserved for analytics later
    const res = await recordResultByTopicLevel(
      level.id,
      result.score,
      result.total,
      result.passed,
      result.starsEarned ?? null,
      level.unlocksMascotId,
    );

    // Persist streak (per-topic) si la mecánica lo trackea.
    if (result.finalStreak) {
      void setStreakState(
        topicId,
        result.finalStreak.current,
        result.finalStreak.best,
      );
    }

    // Si fue un examen, guardar last_exam_correct para gating de
    // batalla.
    if (mechanic === "exam") {
      void recordExamResult(topicId, result.score);
    }

    audio.stopMusic();
    audio.playSfx(result.passed ? "win" : "lose");

    if (!res.ok) {
      return { unlockedMascot: null, hasNext: nextPosition !== null };
    }

    const unlockedMascot =
      res.newlyUnlockedMascotId != null
        ? getMascotForLevel(res.newlyUnlockedMascotId) ?? null
        : null;

    return {
      unlockedMascot,
      hasNext: nextPosition !== null,
    };
  }

  function handleNext() {
    if (nextPosition !== null) {
      router.push(`/topic/${topicSlug}/level/${nextPosition}`);
    } else {
      router.push("/");
    }
  }

  function handleExit() {
    router.push("/");
  }

  const Renderer = m.Renderer;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-4 sm:max-w-2xl sm:px-6 sm:py-6">
      <TopBar topicSlug={topicSlug} />
      <Renderer
        level={mechanicLevel}
        selectedMascot={selectedMascot}
        userId={userId}
        initialStreak={initialStreak}
        onResult={handleResult}
        onNext={handleNext}
        onExit={handleExit}
      />
    </main>
  );
}

function TopBar({ topicSlug }: { topicSlug: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between">
      <Link
        href={`/topic/${topicSlug}`}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-lg font-black text-white shadow-md shadow-brand-500/30 ring-1 ring-brand-600 active:scale-95"
        aria-label={t("topbar.back")}
      >
        ←
      </Link>
      <span className="text-sm font-bold text-slate-500">
        {t("meta.app_name")} ✖️
      </span>
      <div className="h-10 w-10" />
    </div>
  );
}
