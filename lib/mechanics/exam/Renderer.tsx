"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Character } from "@/components/Mascot";
import type { MascotVariant } from "@/lib/mascots";
import { computeStars } from "@/lib/progress-helpers";
import { useI18n } from "@/lib/i18n/context";
import type { MechanicAfterResult, MechanicRendererProps } from "../types";
import { buildExamQuestions, gradeForCorrect, type ExamQuestion } from "./build-question";
import type { ExamConfig } from "./config";

type Stage = "intro" | "taking" | "result";

interface ResultData {
  passed: boolean;
  correct: number;
  total: number;
  grade: number;
  questions: ExamQuestion[];
  answers: string[];
  unlockedMascot: MascotVariant | null;
  hasNext: boolean;
}

export function ExamRenderer({
  level,
  selectedMascot,
  onResult,
  onNext,
  onExit,
}: MechanicRendererProps<ExamConfig>) {
  const [stage, setStage] = useState<Stage>("intro");
  const [questions, setQuestions] = useState<ExamQuestion[]>(() =>
    buildExamQuestions(level.config),
  );
  const [answers, setAnswers] = useState<string[]>(() =>
    Array(level.config.questionsCount).fill(""),
  );
  const [resultData, setResultData] = useState<ResultData | null>(null);

  useEffect(() => {
    setQuestions(buildExamQuestions(level.config));
    setAnswers(Array(level.config.questionsCount).fill(""));
    setResultData(null);
    setStage("intro");
  }, [level.id, level.config]);

  function submit() {
    const correct = countCorrect(questions, answers);
    const grade = gradeForCorrect(correct, questions.length);
    const passed = grade >= level.config.passGrade;
    onResult({
      passed,
      score: correct,
      total: questions.length,
      starsEarned: computeStars(correct, questions.length),
    })
      .then((after: MechanicAfterResult) => {
        setResultData({
          passed,
          correct,
          total: questions.length,
          grade,
          questions,
          answers,
          unlockedMascot: after.unlockedMascot ?? null,
          hasNext: after.hasNext,
        });
        setStage("result");
      })
      .catch(() => {
        setResultData({
          passed,
          correct,
          total: questions.length,
          grade,
          questions,
          answers,
          unlockedMascot: null,
          hasNext: false,
        });
        setStage("result");
      });
  }

  function retake() {
    setQuestions(buildExamQuestions(level.config));
    setAnswers(Array(level.config.questionsCount).fill(""));
    setResultData(null);
    setStage("taking");
  }

  if (stage === "intro") {
    return (
      <Intro
        level={level}
        selectedMascot={selectedMascot}
        onStart={() => setStage("taking")}
      />
    );
  }

  if (stage === "result" && resultData) {
    return (
      <Result
        data={resultData}
        mascot={selectedMascot}
        onRetake={retake}
        onNext={onNext}
        onExit={onExit}
      />
    );
  }

  return (
    <Taking
      questions={questions}
      answers={answers}
      setAnswers={setAnswers}
      onSubmit={submit}
    />
  );
}

function Result({
  data,
  mascot,
  onRetake,
  onNext,
  onExit,
}: {
  data: ResultData;
  mascot: MascotVariant;
  onRetake: () => void;
  onNext?: () => void;
  onExit?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-4 flex flex-col items-center text-center">
        <Character
          variant={data.unlockedMascot ?? mascot}
          size="lg"
          mood={data.passed ? "celebrate" : "sad"}
        />
        <h1 className="mt-3 text-3xl font-black text-slate-900">
          {data.passed ? t("exam.result_pass_title") : t("exam.result_fail_title")}
        </h1>
        <div className="mt-4 rounded-2xl bg-white px-6 py-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("exam.grade_label")}
          </div>
          <div className="text-5xl font-black text-slate-900">
            <span className={data.passed ? "text-brand-600" : "text-rose-600"}>
              {data.grade}
            </span>
            <span className="text-slate-400"> / 10</span>
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-500">
            {t("exam.correct_of_total", {
              n: data.correct,
              total: data.total,
            })}
          </div>
        </div>
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
      </div>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">
        {t("exam.corrections_title")}
      </h2>
      <ol className="mt-2 space-y-2">
        {data.questions.map((q, i) => {
          const given = (data.answers[i] ?? "").trim();
          const ok = given !== "" && Number(given) === q.answer;
          return (
            <li
              key={i}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm ring-1 ${
                ok
                  ? "bg-brand-50 ring-brand-200"
                  : "bg-rose-50 ring-rose-200"
              }`}
            >
              <span className="shrink-0 text-xs font-bold text-slate-500">
                {String(i + 1).padStart(2, "0")}.
              </span>
              <span className="flex-1 text-base font-bold text-slate-900">
                {q.a} × {q.b} ={" "}
                <span className="font-black text-slate-900">{q.answer}</span>
              </span>
              <span
                className={`shrink-0 text-right text-sm font-black ${
                  ok ? "text-brand-700" : "text-rose-700"
                }`}
              >
                {ok
                  ? `✓ ${given}`
                  : given === ""
                  ? t("exam.unanswered")
                  : `✗ ${given}`}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 space-y-3 pb-4">
        {data.passed && data.hasNext && onNext ? (
          <button
            onClick={onNext}
            className="w-full rounded-2xl bg-brand-500 py-4 text-lg font-black text-white shadow-lg shadow-brand-500/30 active:scale-[0.99]"
          >
            {t("level.next")}
          </button>
        ) : (
          <button
            onClick={onRetake}
            className="w-full rounded-2xl bg-brand-500 py-4 text-lg font-black text-white shadow-lg shadow-brand-500/30 active:scale-[0.99]"
          >
            {t("exam.retake")}
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
  level: MechanicRendererProps<ExamConfig>["level"];
  selectedMascot: MascotVariant;
  onStart: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-6 text-center">
        <div className="flex justify-center">
          <Character variant={selectedMascot} size="md" mood="think" />
        </div>
        <h1 className="mt-3 text-3xl font-black text-slate-900">
          {t("exam.title")}
        </h1>
        <p className="mt-1 text-slate-600">
          {t("exam.subtitle", { total: level.config.questionsCount })}
        </p>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <ul className="space-y-2 text-sm text-slate-700">
          <li>{t("exam.rule_1")}</li>
          <li>{t("exam.rule_2")}</li>
          <li>{t("exam.rule_3")}</li>
          <li>{t("exam.rule_4")}</li>
        </ul>
      </div>

      <button
        onClick={onStart}
        className="mt-auto w-full rounded-2xl bg-brand-500 py-4 text-lg font-black text-white shadow-lg shadow-brand-500/30 active:scale-[0.99]"
      >
        {t("exam.start")}
      </button>
    </div>
  );
}

function Taking({
  questions,
  answers,
  setAnswers,
  onSubmit,
}: {
  questions: ExamQuestion[];
  answers: string[];
  setAnswers: (a: string[]) => void;
  onSubmit: () => void;
}) {
  const { t } = useI18n();
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [idx]);

  const q = questions[idx];
  const isLast = idx === questions.length - 1;
  const pct = Math.round(((idx + 1) / questions.length) * 100);

  function next() {
    const cleaned = value.replace(/\D/g, "");
    const newAnswers = answers.slice();
    newAnswers[idx] = cleaned;
    setAnswers(newAnswers);
    if (isLast) {
      onSubmit();
    } else {
      setIdx(idx + 1);
      setValue("");
    }
  }

  function handleChange(v: string) {
    setValue(v.replace(/\D/g, "").slice(0, 4));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        next();
      }}
      className="mt-4 flex flex-1 flex-col"
    >
      <div className="mt-2">
        <div className="flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            {idx + 1} / {questions.length}
          </span>
        </div>
      </div>

      <div key={idx} className="mt-10 flex flex-col items-center animate-pop">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t("exam.question_n", { n: idx + 1 })}
        </p>
        <div className="mt-2 text-6xl font-black text-slate-900 sm:text-7xl md:text-8xl">
          {q.a} × {q.b} =
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="?"
          className="w-40 rounded-2xl border-0 bg-white px-4 py-4 text-center text-4xl font-black text-slate-900 shadow-sm ring-2 ring-slate-200 focus:outline-none focus:ring-brand-500"
        />
      </div>

      <div className="mt-auto pb-4 pt-8">
        <button
          type="submit"
          className="w-full rounded-2xl bg-brand-500 py-4 text-lg font-black text-white shadow-lg shadow-brand-500/30 active:scale-[0.99]"
        >
          {isLast ? t("exam.submit") : t("exam.next")}
        </button>
      </div>
    </form>
  );
}

function countCorrect(questions: ExamQuestion[], answers: string[]): number {
  let n = 0;
  for (let i = 0; i < questions.length; i++) {
    const raw = (answers[i] ?? "").trim();
    if (raw === "") continue;
    if (Number(raw) === questions[i].answer) n++;
  }
  return n;
}
