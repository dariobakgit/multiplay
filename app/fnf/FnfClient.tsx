"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Character, MOVES } from "@/components/Mascot";
import { EVIL_MASCOT, type MascotVariant } from "@/lib/mascots";
import {
  buildFnfQuestion,
  FNF_FEEDBACK_MS,
  FNF_LOSE_POSITION,
  FNF_QUESTION_TIME_MS,
  FNF_WIN_POSITION,
  type FnfQuestion,
} from "@/lib/fnf";
import { audio } from "@/lib/audio";
import { FNF_UNLOCK_CORRECT, loadLastExam } from "@/lib/exam-state";
import { useI18n } from "@/lib/i18n/context";

type Stage = "gate" | "intro" | "fight" | "result";
type Outcome = "pending" | "correct" | "wrong" | "timeout";

export default function FnfClient({
  mascot,
  userId,
  isAdmin,
}: {
  mascot: MascotVariant;
  userId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("gate");
  const [lastResult, setLastResult] = useState<"won" | "lost" | null>(null);

  useEffect(() => {
    if (isAdmin || loadLastExam(userId) >= FNF_UNLOCK_CORRECT) {
      setStage("intro");
    } else {
      router.replace("/");
    }
  }, [isAdmin, userId, router]);

  useEffect(() => {
    audio.init();
    return () => audio.stopAll();
  }, []);

  useEffect(() => {
    if (stage === "fight") audio.playMusic("fnf");
    else if (stage === "intro" || stage === "result") audio.playMusic("menu");
  }, [stage]);

  if (stage === "gate") {
    return <GateLoading />;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-4 sm:px-6">
      <TopBar />
      {stage === "intro" && (
        <Intro mascot={mascot} onStart={() => setStage("fight")} />
      )}
      {stage === "fight" && (
        <Fight
          mascot={mascot}
          onFinish={(won) => {
            setLastResult(won ? "won" : "lost");
            setStage("result");
          }}
        />
      )}
      {stage === "result" && (
        <Result
          mascot={mascot}
          won={lastResult === "won"}
          onRetry={() => {
            setLastResult(null);
            setStage("fight");
          }}
        />
      )}
    </main>
  );
}

function GateLoading() {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4">
      <p className="text-sm text-slate-500">{t("fnf.verifying")}</p>
    </main>
  );
}

function Intro({
  mascot,
  onStart,
}: {
  mascot: MascotVariant;
  onStart: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-6 text-center">
        <h1 className="text-3xl font-black text-slate-900">{t("fnf.title")}</h1>
        <p className="mt-1 text-slate-600">{t("fnf.intro_sub")}</p>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="flex flex-col items-center">
          <Character variant={mascot} size="md" mood="happy" />
          <span className="mt-1 text-xs font-black text-brand-700">
            {t("fnf.you_big")}
          </span>
        </div>
        <div className="text-4xl font-black text-slate-400">{t("fnf.vs")}</div>
        <div className="flex flex-col items-center">
          <Character variant={EVIL_MASCOT} size="md" evil />
          <span className="mt-1 text-xs font-black text-rose-700">
            {t("fnf.evil_big")}
          </span>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <ul className="space-y-2 text-sm text-slate-700">
          <li>{t("fnf.rule_1")}</li>
          <li>{t("fnf.rule_2")}</li>
          <li>{t("fnf.rule_3")}</li>
          <li>{t("fnf.rule_4")}</li>
        </ul>
      </div>

      <button
        onClick={onStart}
        className="mt-auto w-full rounded-2xl bg-rose-600 py-4 text-lg font-black text-white shadow-lg shadow-rose-600/30 active:scale-[0.99]"
      >
        {t("fnf.fight")}
      </button>
    </div>
  );
}

function Fight({
  mascot,
  onFinish,
}: {
  mascot: MascotVariant;
  onFinish: (won: boolean) => void;
}) {
  const { t } = useI18n();
  const [question, setQuestion] = useState<FnfQuestion>(() =>
    buildFnfQuestion(),
  );
  const [position, setPosition] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>("pending");
  const [picked, setPicked] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(FNF_QUESTION_TIME_MS);
  const [battleDone, setBattleDone] = useState<boolean>(false);
  const [playerMove, setPlayerMove] = useState<string | null>(null);
  const [evilMove, setEvilMove] = useState<string | null>(null);
  const [hitTick, setHitTick] = useState(0);

  useEffect(() => {
    if (battleDone || outcome !== "pending") return;
    const started = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - started;
      const left = FNF_QUESTION_TIME_MS - elapsed;
      if (left <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        resolveOutcome("timeout");
      } else {
        setTimeLeft(left);
      }
    }, 80);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, battleDone]);

  // Ambient random moves on both mascots during pending turns.
  useEffect(() => {
    if (outcome !== "pending" || battleDone) return;
    let cancelled = false;
    function schedule(
      setter: (v: string | null) => void,
      clearer: (v: string | null) => void,
    ) {
      if (cancelled) return;
      const delay = 1400 + Math.random() * 2400;
      setTimeout(() => {
        if (cancelled) return;
        const move = MOVES[Math.floor(Math.random() * MOVES.length)];
        setter(null);
        requestAnimationFrame(() => setter(move));
        setTimeout(() => clearer(null), 1100);
        schedule(setter, clearer);
      }, delay);
    }
    schedule(setPlayerMove, setPlayerMove);
    schedule(setEvilMove, setEvilMove);
    return () => {
      cancelled = true;
    };
  }, [outcome, battleDone, question]);

  function resolveOutcome(o: "correct" | "wrong" | "timeout") {
    setOutcome(o);
    setHitTick((t) => t + 1);
    // In FNF mode only the loop music plays — no per-round SFX.

    setPosition((p) => {
      const delta = o === "correct" ? 1 : -1;
      const np = Math.max(FNF_LOSE_POSITION, Math.min(FNF_WIN_POSITION, p + delta));
      if (np >= FNF_WIN_POSITION) {
        setBattleDone(true);
        setTimeout(() => onFinish(true), 1000);
      } else if (np <= FNF_LOSE_POSITION) {
        setBattleDone(true);
        setTimeout(() => onFinish(false), 1000);
      } else {
        setTimeout(nextRound, FNF_FEEDBACK_MS);
      }
      return np;
    });
  }

  function nextRound() {
    setQuestion(buildFnfQuestion());
    setOutcome("pending");
    setPicked(null);
    setTimeLeft(FNF_QUESTION_TIME_MS);
    setPlayerMove(null);
    setEvilMove(null);
  }

  function pick(opt: number) {
    if (outcome !== "pending") return;
    setPicked(opt);
    resolveOutcome(opt === question.answer ? "correct" : "wrong");
  }

  const markerPct = ((position + 10) / 20) * 100;
  const timerPct = (timeLeft / FNF_QUESTION_TIME_MS) * 100;
  const playerHit = outcome === "wrong" || outcome === "timeout";
  const evilHit = outcome === "correct";
  const playerAnim = playerHit ? "animate-shake" : playerMove;
  const evilAnim = evilHit ? "animate-shake" : evilMove;

  return (
    <div className="flex flex-1 flex-col">
      {/* Combat bar (above the fighters) */}
      <div className="mt-3">
        <div className="relative h-10 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200 sm:h-12">
          <div className="absolute inset-y-0 left-1/2 w-px bg-slate-300" />
          {position > 0 && (
            <div
              className="absolute inset-y-0 left-1/2 bg-gradient-to-r from-amber-300 to-brand-500 transition-[width] duration-500"
              style={{ width: `${(position / 10) * 50}%` }}
            />
          )}
          {position < 0 && (
            <div
              className="absolute inset-y-0 bg-gradient-to-l from-amber-300 to-rose-500 transition-[width] duration-500"
              style={{
                right: "50%",
                width: `${(Math.abs(position) / 10) * 50}%`,
              }}
            />
          )}
          <div
            className="absolute top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-2xl font-black shadow ring-2 ring-slate-300 transition-[left] duration-500"
            style={{ left: `${markerPct}%` }}
          >
            {position > 0 ? "💥" : position < 0 ? "😰" : "⚔️"}
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs font-bold uppercase text-slate-500">
          <span className="text-brand-700">{t("fnf.you_short")}</span>
          <span>
            {position > 0
              ? `+${position}`
              : position < 0
              ? `${position}`
              : t("fnf.score_draw")}
          </span>
          <span className="text-rose-700">{t("fnf.evil_short")}</span>
        </div>
      </div>

      {/* Timer */}
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-[width] duration-100 ${
            timeLeft > 2000
              ? "bg-brand-500"
              : timeLeft > 1000
              ? "bg-amber-500"
              : "bg-rose-500"
          }`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Fighters face to face */}
      <div className="mt-6 flex items-end justify-between">
        <div className="relative">
          <Character
            variant={mascot}
            size="lg"
            mood={outcome === "correct" ? "celebrate" : "happy"}
            animClass={playerAnim}
            onAnimationEnd={() => {
              if (!playerHit) setPlayerMove(null);
            }}
          />
          {playerHit && (
            <div
              key={`hit-left-${hitTick}`}
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-7xl animate-hit drop-shadow-lg sm:text-8xl"
            >
              💥
            </div>
          )}
        </div>
        <div className="relative">
          <Character
            variant={EVIL_MASCOT}
            size="lg"
            evil
            mood={playerHit ? "celebrate" : "happy"}
            animClass={evilAnim}
            onAnimationEnd={() => {
              if (!evilHit) setEvilMove(null);
            }}
          />
          {evilHit && (
            <div
              key={`hit-right-${hitTick}`}
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-7xl animate-hit drop-shadow-lg sm:text-8xl"
            >
              💥
            </div>
          )}
        </div>
      </div>

      {/* Question */}
      <div
        key={`${question.a}x${question.b}`}
        className="mt-6 flex flex-col items-center animate-pop"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("level.question_label")}
        </p>
        <div className="mt-1 text-6xl font-black text-slate-900 sm:text-7xl md:text-8xl">
          {question.a} × {question.b}
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3 pt-6 sm:gap-4">
        {question.options.map((opt) => {
          const isPicked = picked === opt;
          const isCorrect = opt === question.answer;
          let cls =
            "rounded-2xl bg-white py-6 text-3xl font-black text-slate-900 shadow-sm ring-2 ring-slate-200 active:scale-[0.98] sm:py-8 sm:text-4xl";
          if (outcome !== "pending") {
            if (isCorrect)
              cls +=
                " !ring-brand-500 !bg-brand-50 !text-brand-700 animate-pop";
            else if (isPicked)
              cls +=
                " !ring-rose-500 !bg-rose-50 !text-rose-700 animate-shake";
            else cls += " opacity-60";
          } else {
            cls += " hover:ring-rose-500";
          }
          return (
            <button
              key={opt}
              onClick={() => pick(opt)}
              disabled={outcome !== "pending" || battleDone}
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

function Result({
  mascot,
  won,
  onRetry,
}: {
  mascot: MascotVariant;
  won: boolean;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-8 flex flex-col items-center text-center">
        <div className="flex items-center gap-6">
          <Character
            variant={mascot}
            size="lg"
            mood={won ? "celebrate" : "sad"}
          />
          <Character
            variant={EVIL_MASCOT}
            size="lg"
            evil
            mood={won ? "sad" : "celebrate"}
          />
        </div>
        <h1 className="mt-6 text-4xl font-black text-slate-900">
          {won ? t("fnf.won_title") : t("fnf.lost_title")}
        </h1>
        <p className="mt-1 text-slate-600">
          {won ? t("fnf.won_sub") : t("fnf.lost_sub")}
        </p>
      </div>

      <div className="mt-auto space-y-3 pb-4">
        <button
          onClick={onRetry}
          className="w-full rounded-2xl bg-rose-600 py-4 text-lg font-black text-white shadow-lg shadow-rose-600/30 active:scale-[0.99]"
        >
          {won ? t("fnf.won_retry") : t("fnf.lost_retry")}
        </button>
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
      <span className="text-sm font-bold text-rose-600">{t("fnf.title")}</span>
      <div className="h-10 w-10" />
    </div>
  );
}
