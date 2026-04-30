"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Character, Mascot } from "@/components/Mascot";
import type { MascotVariant } from "@/lib/mascots";
import { computeStars } from "@/lib/progress-helpers";
import { loadCurrentStreak, saveStreak } from "@/lib/streak";
import { useI18n } from "@/lib/i18n/context";
import type { MechanicAfterResult, MechanicRendererProps } from "../types";
import { buildMCQuestions, type MCQuestion } from "./build-question";
import type { MultipleChoiceConfig } from "./config";

const CELEBRATE_MOVES = [
  "animate-mv-jump",
  "animate-mv-boing",
  "animate-mv-shimmy",
] as const;

type Stage = "intro" | "playing" | "result";

interface ResultData {
  passed: boolean;
  score: number;
  total: number;
  stars: number;
  unlockedMascot: MascotVariant | null;
  hasNext: boolean;
}

/**
 * Renderer de la mecánica multiple_choice. Controla la introducción y
 * el loop de juego. Cuando termina llama a `onResult` con el score
 * final — el page wrapper se encarga del result screen, audio,
 * persistencia y navegación.
 */
export function MultipleChoiceRenderer({
  level,
  selectedMascot,
  userId,
  onResult,
  onNext,
  onExit,
}: MechanicRendererProps<MultipleChoiceConfig>) {
  const [stage, setStage] = useState<Stage>("intro");
  const [questions, setQuestions] = useState<MCQuestion[]>(() =>
    buildMCQuestions(level.config),
  );
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [resultData, setResultData] = useState<ResultData | null>(null);

  // Re-build cuando cambia el level (re-mount o navegación).
  useEffect(() => {
    setQuestions(buildMCQuestions(level.config));
    setIdx(0);
    setScore(0);
    setPicked(null);
    setLocked(false);
    setResultData(null);
    setStage("intro");
  }, [level.id, level.config]);

  // Streak persiste cross-niveles vía localStorage (será migrada a DB
  // per-topic en el paso 5 del plan).
  useEffect(() => {
    setStreak(loadCurrentStreak(userId));
  }, [userId]);
  useEffect(() => {
    saveStreak(userId, streak);
  }, [streak, userId]);

  function onPick(option: number) {
    if (locked || stage !== "playing") return;
    const q = questions[idx];
    const correct = option === q.answer;
    setPicked(option);
    setLocked(true);
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
    setTimeout(
      () => {
        if (idx + 1 >= questions.length) {
          const finalScore = score + (correct ? 1 : 0);
          const total = questions.length;
          const passed = finalScore >= level.config.minScore;
          const stars = computeStars(finalScore, total);
          // Persistir vía page wrapper.
          onResult({ passed, score: finalScore, total, starsEarned: stars })
            .then((after: MechanicAfterResult) => {
              setResultData({
                passed,
                score: finalScore,
                total,
                stars,
                unlockedMascot: after.unlockedMascot ?? null,
                hasNext: after.hasNext,
              });
              setStage("result");
            })
            .catch(() => {
              setResultData({
                passed,
                score: finalScore,
                total,
                stars,
                unlockedMascot: null,
                hasNext: false,
              });
              setStage("result");
            });
        } else {
          setIdx((i) => i + 1);
          setPicked(null);
          setLocked(false);
        }
      },
      correct ? 550 : 1100,
    );
  }

  function retry() {
    setQuestions(buildMCQuestions(level.config));
    setIdx(0);
    setScore(0);
    setPicked(null);
    setLocked(false);
    setResultData(null);
    setStage("playing");
  }

  if (stage === "intro") {
    return (
      <Intro
        level={level}
        selectedMascot={selectedMascot}
        onStart={() => setStage("playing")}
      />
    );
  }

  if (stage === "result" && resultData) {
    return (
      <Result
        data={resultData}
        onRetry={retry}
        onNext={onNext}
        onExit={onExit}
      />
    );
  }

  return (
    <Playing
      level={level}
      question={questions[idx]}
      index={idx}
      total={questions.length}
      score={score}
      streak={streak}
      picked={picked}
      locked={locked}
      onPick={onPick}
      selectedMascot={selectedMascot}
    />
  );
}

function Result({
  data,
  onRetry,
  onNext,
  onExit,
}: {
  data: ResultData;
  onRetry: () => void;
  onNext?: () => void;
  onExit?: () => void;
}) {
  const { t } = useI18n();
  const resultMood = data.passed
    ? data.stars === 3
      ? "celebrate"
      : "happy"
    : "sad";
  const resultMessage = data.passed
    ? data.stars === 3
      ? t("level.result_3_stars")
      : data.stars === 2
      ? t("level.result_2_stars")
      : t("level.result_1_star")
    : t("level.result_failed", { n: Math.max(0, data.total - data.score) });

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center">
        <Character
          mood={resultMood}
          size="lg"
          variant={data.unlockedMascot ?? undefined}
        />
        <h1 className="mt-4 text-3xl font-black text-slate-900">
          {data.passed ? t("level.passed_title") : t("level.not_passed_title")}
        </h1>
        <p className="mt-1 text-slate-600">{resultMessage}</p>
        {data.passed && data.unlockedMascot && (
          <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
              {t("level.new_mascot")}
            </p>
            <p className="mt-0.5 text-lg font-black text-amber-900">
              {t("level.meet_mascot", { name: data.unlockedMascot.name })}
            </p>
          </div>
        )}

        <div className="mt-6 text-5xl">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={
                i < data.stars ? "text-amber-400 animate-pop" : "text-slate-200"
              }
              style={{ animationDelay: `${i * 120}ms` }}
            >
              ★
            </span>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-white px-6 py-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase text-slate-500">
            {t("level.score")}
          </div>
          <div className="text-3xl font-black text-slate-900">
            {data.score} <span className="text-slate-400">/ {data.total}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3 pb-4">
        {data.passed ? (
          data.hasNext && onNext ? (
            <button
              onClick={onNext}
              className="w-full rounded-2xl bg-brand-500 py-4 text-lg font-black text-white shadow-lg shadow-brand-500/30 active:scale-[0.99]"
            >
              {t("level.next")}
            </button>
          ) : (
            <button
              onClick={onExit ?? (() => {})}
              className="w-full rounded-2xl bg-brand-500 py-4 text-lg font-black text-white shadow-lg shadow-brand-500/30 active:scale-[0.99]"
            >
              {t("level.back_to_map")}
            </button>
          )
        ) : (
          <button
            onClick={onRetry}
            className="w-full rounded-2xl bg-brand-500 py-4 text-lg font-black text-white shadow-lg shadow-brand-500/30 active:scale-[0.99]"
          >
            {t("level.retry")}
          </button>
        )}
        {onExit ? (
          <button
            onClick={onExit}
            className="block w-full rounded-2xl bg-white py-3 text-center text-sm font-bold text-slate-700 ring-1 ring-slate-200"
          >
            {t("level.back_to_map")}
          </button>
        ) : (
          <Link
            href="/"
            className="block w-full rounded-2xl bg-white py-3 text-center text-sm font-bold text-slate-700 ring-1 ring-slate-200"
          >
            {t("level.back_to_map")}
          </Link>
        )}
      </div>
    </div>
  );
}

function Intro({
  level,
  selectedMascot,
  onStart,
}: {
  level: MechanicRendererProps<MultipleChoiceConfig>["level"];
  selectedMascot: MascotVariant;
  onStart: () => void;
}) {
  const { t } = useI18n();
  const mascot = pickIntroMascot(level.config, t);
  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-4 text-center">
        {level.emoji && <div className="text-6xl">{level.emoji}</div>}
        {level.titleKey && (
          <h1 className="mt-3 text-3xl font-black text-slate-900">
            {t(level.titleKey, level.titleVars ?? undefined)}
          </h1>
        )}
        {level.subtitleKey && (
          <p className="mt-1 text-slate-600">
            {t(level.subtitleKey, level.subtitleVars ?? undefined)}
          </p>
        )}
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("level.intro_rule", {
            min: level.config.minScore,
            total: level.config.questionsCount,
          })}
        </p>
      </div>

      <div className="mt-5">
        <Mascot
          mood={mascot.mood}
          message={mascot.messages}
          size="md"
          variant={selectedMascot}
        />
      </div>

      {/* Reference card: only meaningful for "multiplication" pools. */}
      {level.config.pool.type === "multiplication" && (
        <ReferenceCard config={level.config} />
      )}

      <button
        onClick={onStart}
        className="mt-auto w-full rounded-2xl bg-brand-500 py-4 text-lg font-black text-white shadow-lg shadow-brand-500/30 active:scale-[0.99]"
      >
        {t("level.start")}
      </button>
    </div>
  );
}

/** Tarjeta de referencia: para 1 sola tabla muestra la lista; para
 *  varias, muestra los chips. Para pools "explicit" no hay nada genérico
 *  que mostrar. */
function ReferenceCard({ config }: { config: MultipleChoiceConfig }) {
  const { t } = useI18n();
  if (config.pool.type !== "multiplication") return null;
  const tables = config.pool.tables;
  const factors = config.pool.factors ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  if (tables.length === 1) {
    const table = tables[0];
    const first = factors[0];
    const last = factors[factors.length - 1];
    return (
      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="text-center text-sm font-semibold text-slate-700">
          {t("level.table_ref", { table, t: table, first, last })}
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {factors.map((b) => (
            <li
              key={b}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              <span>
                {table} × {b}
              </span>
              <span className="font-black text-brand-600">= {table * b}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-center text-sm font-semibold text-slate-700">
        {t("level.practice_tables")}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {tables.map((tbl) => (
          <span
            key={tbl}
            className="rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700"
          >
            × {tbl}
          </span>
        ))}
      </div>
    </div>
  );
}

function Playing({
  level,
  question,
  index,
  total,
  score,
  streak,
  picked,
  locked,
  onPick,
  selectedMascot,
}: {
  level: { config: MultipleChoiceConfig };
  question: MCQuestion;
  index: number;
  total: number;
  score: number;
  streak: number;
  picked: number | null;
  locked: boolean;
  onPick: (n: number) => void;
  selectedMascot: MascotVariant;
}) {
  const { t } = useI18n();
  const pct = Math.round((index / total) * 100);

  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [anim, setAnim] = useState<string | null>(null);

  useEffect(() => {
    setFeedback(null);
    setAnim(null);
  }, [index]);

  useEffect(() => {
    if (picked == null) return;
    const correct = picked === question.answer;
    setFeedback(correct ? "correct" : "wrong");
    const next = correct
      ? CELEBRATE_MOVES[Math.floor(Math.random() * CELEBRATE_MOVES.length)]
      : "animate-shake";
    setAnim(null);
    requestAnimationFrame(() => setAnim(next));
  }, [picked, question.answer]);

  const mascotMood: "happy" | "celebrate" | "sad" =
    feedback === "correct"
      ? "celebrate"
      : feedback === "wrong"
      ? "sad"
      : "happy";

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-4">
        <div className="flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            {index + 1} / {total}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>✅ {score}</span>
          <span>{t("level.goal", { n: level.config.minScore })}</span>
        </div>
        {streak >= 2 && (
          <div className="mt-1 flex flex-wrap items-center gap-x-1 text-[14px] leading-tight">
            <span className="text-xs font-bold text-amber-700">
              {t("level.streak_label")}
            </span>
            {Array.from({ length: Math.min(streak, 80) }, (_, i) => (
              <span key={i}>🔥</span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center">
        <Character
          variant={selectedMascot}
          size="sm"
          mood={mascotMood}
          animClass={anim}
          onAnimationEnd={() => setAnim(null)}
        />
      </div>

      <div key={index} className="mt-2 flex flex-col items-center animate-pop">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t("level.question_label")}
        </p>
        <div className="mt-1 text-6xl font-black text-slate-900 sm:text-7xl md:text-8xl">
          {question.a} × {question.b}
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2.5 pt-6 sm:gap-3">
        {question.options.map((opt) => {
          const isPicked = picked === opt;
          const isCorrect = opt === question.answer;
          const n = question.options.length;
          const sizeCls =
            n >= 8
              ? "py-3 text-xl sm:py-4 sm:text-2xl"
              : n >= 6
              ? "py-4 text-xl sm:py-5 sm:text-2xl"
              : "py-5 text-2xl sm:py-6 sm:text-3xl";
          let cls = `rounded-2xl bg-white ${sizeCls} font-black text-slate-900 shadow-sm ring-2 ring-slate-200 active:scale-[0.98]`;
          if (locked) {
            if (isCorrect)
              cls += " !ring-brand-500 !bg-brand-50 !text-brand-700 animate-pop";
            else if (isPicked)
              cls += " !ring-rose-500 !bg-rose-50 !text-rose-700 animate-shake";
            else cls += " opacity-60";
          } else {
            cls += " hover:ring-brand-500";
          }
          return (
            <button
              key={opt}
              onClick={() => onPick(opt)}
              disabled={locked}
              className={cls}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type TFn = (key: string, vars?: Record<string, string | number>) => string;

function pickIntroMascot(
  config: MultipleChoiceConfig,
  t: TFn,
): { mood: "happy" | "excited" | "think"; messages: string[] } {
  const pool = config.pool;
  if (pool.type === "multiplication" && pool.tables.length === 1) {
    const table = pool.tables[0];
    const factors = pool.factors ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const first = factors[0];
    const last = factors[factors.length - 1];
    return {
      mood: "excited",
      messages: [
        t("intro.learn_title", { table, emoji: "" }).trim(),
        t("intro.learn_range", { t: table, first, last }),
        t("intro.learn_look"),
      ],
    };
  }
  if (pool.type === "multiplication" && pool.tables.length >= 9) {
    return {
      mood: "think",
      messages: [t("intro.final_title"), t("intro.final_breath")],
    };
  }
  if (pool.type === "multiplication") {
    return {
      mood: "happy",
      messages: [
        t("intro.mix_title", { n: pool.tables.length }),
        t("intro.mix_look"),
      ],
    };
  }
  return {
    mood: "happy",
    messages: [t("intro.single_practice"), t("intro.single_you_can")],
  };
}
