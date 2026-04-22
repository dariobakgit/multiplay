"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  findLearnLevelFor,
  formatLevelSubtitle,
  formatLevelTitle,
  TOTAL_LEVELS,
  type Level,
} from "@/lib/curriculum";
import { buildQuestions, type Question } from "@/lib/questions";
import { computeStars } from "@/lib/progress-helpers";
import { recordResult } from "@/lib/progress-db";
import { Character, Mascot } from "@/components/Mascot";
import { getMascotForLevel, type MascotVariant } from "@/lib/mascots";
import { audio } from "@/lib/audio";
import { loadCurrentStreak, saveStreak } from "@/lib/streak";
import { useI18n } from "@/lib/i18n/context";

const CELEBRATE_MOVES = [
  "animate-mv-jump",
  "animate-mv-boing",
  "animate-mv-shimmy",
] as const;

type Stage = "intro" | "playing" | "result";
type TFn = (key: string, vars?: Record<string, string | number>) => string;

export default function LevelPlayer({
  level,
  selectedMascot,
  userId,
}: {
  level: Level;
  selectedMascot: MascotVariant;
  userId: string;
}) {
  const [stage, setStage] = useState<Stage>("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<Question[]>([]);
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setQuestions(buildQuestions(level));
    setIdx(0);
    setScore(0);
    setWrong([]);
    setPicked(null);
    setLocked(false);
    setStage("intro");
  }, [level.id]);

  useEffect(() => {
    setStreak(loadCurrentStreak(userId));
  }, [userId]);

  useEffect(() => {
    saveStreak(userId, streak);
  }, [streak, userId]);

  useEffect(() => {
    audio.init();
    audio.playMusic("menu");
    return () => audio.stopMusic();
  }, []);

  useEffect(() => {
    if (stage === "playing") {
      audio.playMusic("game");
    } else if (stage === "intro") {
      audio.playMusic("menu");
    }
  }, [stage]);

  function start() {
    setStage("playing");
  }

  function onPick(option: number) {
    if (locked) return;
    const q = questions[idx];
    const correct = option === q.answer;
    setPicked(option);
    setLocked(true);
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
      setWrong((ws) => [...ws, q]);
    }
    setTimeout(
      () => {
        if (idx + 1 >= questions.length) {
          const finalScore = score + (correct ? 1 : 0);
          const passed = finalScore >= level.minScore;
          startTransition(async () => {
            await recordResult(level.id, finalScore, questions.length, level.minScore);
          });
          audio.stopMusic();
          audio.playSfx(passed ? "win" : "lose");
          setStage("result");
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
    setQuestions(buildQuestions(level));
    setIdx(0);
    setScore(0);
    setWrong([]);
    setPicked(null);
    setLocked(false);
    setStage("playing");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-4 sm:max-w-2xl sm:px-6 sm:py-6">
      {stage === "intro" && (
        <Intro level={level} selectedMascot={selectedMascot} onStart={start} />
      )}
      {stage === "playing" && questions[idx] && (
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
      )}
      {stage === "result" && (
        <Result
          level={level}
          score={score}
          total={questions.length}
          wrong={wrong}
          onRetry={retry}
        />
      )}
    </main>
  );
}

function pickIntroMascot(
  level: Level,
  t: TFn,
): {
  mood: "happy" | "excited" | "think";
  messages: string[];
} {
  if (level.kind === "learn") {
    const table = level.tables[0];
    const first = level.factors?.[0] ?? 1;
    const last = level.factors?.[level.factors.length - 1] ?? 10;
    return {
      mood: "excited",
      messages: [
        t("intro.learn_title", { table, emoji: level.emoji }),
        t("intro.learn_range", { t: table, first, last }),
        t("intro.learn_look"),
      ],
    };
  }
  if (level.tables.length === 1) {
    return {
      mood: "happy",
      messages: [t("intro.single_practice"), t("intro.single_you_can")],
    };
  }
  if (level.tables.length === 9 && level.emoji === "👑") {
    return {
      mood: "think",
      messages: [t("intro.final_title"), t("intro.final_breath")],
    };
  }
  return {
    mood: "happy",
    messages: [
      t("intro.mix_title", { n: level.tables.length }),
      t("intro.mix_look"),
    ],
  };
}

function Intro({
  level,
  selectedMascot,
  onStart,
}: {
  level: Level;
  selectedMascot: MascotVariant;
  onStart: () => void;
}) {
  const { t } = useI18n();
  const mascot = pickIntroMascot(level, t);
  return (
    <div className="flex flex-1 flex-col">
      <TopBar />
      <div className="mt-4 text-center">
        <div className="text-6xl">{level.emoji}</div>
        <h1 className="mt-3 text-3xl font-black text-slate-900">
          {formatLevelTitle(level, t)}
        </h1>
        <p className="mt-1 text-slate-600">
          {formatLevelSubtitle(level, t)}
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("level.intro_rule", {
            min: level.minScore,
            total: level.questions,
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

      {level.kind === "learn" && (
        <TableReference
          table={level.tables[0]}
          factors={level.factors ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
        />
      )}

      {level.kind === "mix" && (
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-center text-sm font-semibold text-slate-700">
            {t("level.practice_tables")}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {level.tables.map((tbl) => (
              <span
                key={tbl}
                className="rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700"
              >
                × {tbl}
              </span>
            ))}
          </div>
        </div>
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

function TableReference({
  table,
  factors,
}: {
  table: number;
  factors: number[];
}) {
  const { t } = useI18n();
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
  level: Level;
  question: Question;
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
      <TopBar />
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
          <span>{t("level.goal", { n: level.minScore })}</span>
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

function findWeakTable(level: Level, wrong: Question[]): number | null {
  if (wrong.length === 0) return null;
  const counts = new Map<number, number>();
  const allowed = new Set(level.tables);
  for (const q of wrong) {
    if (allowed.has(q.a)) counts.set(q.a, (counts.get(q.a) ?? 0) + 1);
    else if (allowed.has(q.b)) counts.set(q.b, (counts.get(q.b) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  let best = -1;
  let bestCount = 0;
  for (const [tbl, c] of counts) {
    if (c > bestCount) {
      best = tbl;
      bestCount = c;
    }
  }
  return best === -1 ? null : best;
}

function Result({
  level,
  score,
  total,
  wrong,
  onRetry,
}: {
  level: Level;
  score: number;
  total: number;
  wrong: Question[];
  onRetry: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const passed = score >= level.minScore;
  const stars = computeStars(score, total);
  const next = level.id + 1;

  const weakTable = findWeakTable(level, wrong);
  const reviewLevel = weakTable != null ? findLearnLevelFor(weakTable) : undefined;
  const suggestReview = !passed && reviewLevel && reviewLevel.id !== level.id;

  const resultMood = passed
    ? stars === 3
      ? "celebrate"
      : "happy"
    : "sad";
  const unlockedMascot = passed ? getMascotForLevel(level.id) : undefined;
  const resultMessage = passed
    ? stars === 3
      ? t("level.result_3_stars")
      : stars === 2
      ? t("level.result_2_stars")
      : t("level.result_1_star")
    : t("level.result_failed", { n: level.minScore - score });

  return (
    <div className="flex flex-1 flex-col">
      <TopBar />
      <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center">
        <Character mood={resultMood} size="lg" variant={unlockedMascot} />
        <h1 className="mt-4 text-3xl font-black text-slate-900">
          {passed ? t("level.passed_title") : t("level.not_passed_title")}
        </h1>
        <p className="mt-1 text-slate-600">{resultMessage}</p>
        {passed && unlockedMascot && (
          <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
              {t("level.new_mascot")}
            </p>
            <p className="mt-0.5 text-lg font-black text-amber-900">
              {t("level.meet_mascot", { name: unlockedMascot.name })}
            </p>
          </div>
        )}

        <div className="mt-6 text-5xl">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={i < stars ? "text-amber-400 animate-pop" : "text-slate-200"}
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
            {score} <span className="text-slate-400">/ {total}</span>
          </div>
        </div>

        {suggestReview && reviewLevel && weakTable != null && (
          <div className="mt-6 w-full rounded-2xl bg-amber-50 p-4 text-left ring-1 ring-amber-200">
            <p className="text-sm font-bold text-amber-900">
              {t("level.weak_hint_title", { table: weakTable })}
            </p>
            <p className="mt-1 text-xs text-amber-800">
              {t("level.weak_hint_sub", {
                id: reviewLevel.id,
                title: formatLevelTitle(reviewLevel, t),
              })}
            </p>
            <button
              onClick={() => router.push(`/level/${reviewLevel.id}`)}
              className="mt-3 w-full rounded-xl bg-amber-500 py-3 text-sm font-black text-white shadow-sm active:scale-[0.99]"
            >
              {t("level.weak_hint_button", { table: weakTable })}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3 pb-4">
        {passed ? (
          <button
            onClick={() => {
              if (next <= TOTAL_LEVELS) router.push(`/level/${next}`);
              else router.push("/");
            }}
            className="w-full rounded-2xl bg-brand-500 py-4 text-lg font-black text-white shadow-lg shadow-brand-500/30 active:scale-[0.99]"
          >
            {next <= TOTAL_LEVELS ? t("level.next") : t("level.back_to_map")}
          </button>
        ) : (
          <button
            onClick={onRetry}
            className="w-full rounded-2xl bg-brand-500 py-4 text-lg font-black text-white shadow-lg shadow-brand-500/30 active:scale-[0.99]"
          >
            {t("level.retry")}
          </button>
        )}
        <Link
          href="/"
          className="block w-full rounded-2xl bg-white py-3 text-center text-sm font-bold text-slate-700 ring-1 ring-slate-200"
        >
          {t("level.back_to_map")}
        </Link>
      </div>
    </div>
  );
}

function TopBar() {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between">
      <Link
        href="/"
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
