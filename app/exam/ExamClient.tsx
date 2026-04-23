"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildExam, EXAM_TOTAL, gradeForScore, type ExamQuestion } from "@/lib/exam";
import { Character } from "@/components/Mascot";
import type { MascotVariant } from "@/lib/mascots";
import { audio } from "@/lib/audio";
import { saveLastExam } from "@/lib/exam-state";
import { useI18n } from "@/lib/i18n/context";

type Stage = "intro" | "taking" | "result";

export default function ExamClient({
  mascot,
  userId,
}: {
  mascot: MascotVariant;
  userId: string;
}) {
  const [stage, setStage] = useState<Stage>("intro");
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>(() =>
    Array(EXAM_TOTAL).fill(""),
  );

  useEffect(() => {
    audio.init();
    audio.playMusic("menu");
    return () => audio.stopAll();
  }, []);

  function start() {
    setQuestions(buildExam());
    setAnswers(Array(EXAM_TOTAL).fill(""));
    setStage("taking");
  }

  function submit() {
    setStage("result");
    const correct = countCorrect(questions, answers);
    const grade = gradeForScore(correct);
    saveLastExam(userId, correct);
    audio.stopMusic();
    audio.playSfx(grade >= 6 ? "win" : "lose");
  }

  function retake() {
    setQuestions(buildExam());
    setAnswers(Array(EXAM_TOTAL).fill(""));
    setStage("taking");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-4 sm:px-6">
      <TopBar />
      {stage === "intro" && <Intro mascot={mascot} onStart={start} />}
      {stage === "taking" && (
        <Taking
          questions={questions}
          answers={answers}
          setAnswers={setAnswers}
          onSubmit={submit}
        />
      )}
      {stage === "result" && (
        <Result
          mascot={mascot}
          questions={questions}
          answers={answers}
          onRetake={retake}
        />
      )}
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
        <div className="flex justify-center">
          <Character variant={mascot} size="md" mood="think" />
        </div>
        <h1 className="mt-3 text-3xl font-black text-slate-900">
          {t("exam.title")}
        </h1>
        <p className="mt-1 text-slate-600">
          {t("exam.subtitle", { total: EXAM_TOTAL })}
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

function Result({
  mascot,
  questions,
  answers,
  onRetake,
}: {
  mascot: MascotVariant;
  questions: ExamQuestion[];
  answers: string[];
  onRetake: () => void;
}) {
  const { t } = useI18n();
  const correct = useMemo(
    () => countCorrect(questions, answers),
    [questions, answers],
  );
  const grade = gradeForScore(correct);
  const pass = grade >= 6;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-4 flex flex-col items-center text-center">
        <Character
          variant={mascot}
          size="lg"
          mood={pass ? "celebrate" : "sad"}
        />
        <h1 className="mt-3 text-3xl font-black text-slate-900">
          {pass ? t("exam.result_pass_title") : t("exam.result_fail_title")}
        </h1>
        <div className="mt-4 rounded-2xl bg-white px-6 py-4 shadow-sm ring-1 ring-slate-200">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {t("exam.grade_label")}
          </div>
          <div className="text-5xl font-black text-slate-900">
            <span className={pass ? "text-brand-600" : "text-rose-600"}>
              {grade}
            </span>
            <span className="text-slate-400"> / 10</span>
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-500">
            {t("exam.correct_of_total", { n: correct, total: questions.length })}
          </div>
        </div>
      </div>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">
        {t("exam.corrections_title")}
      </h2>
      <ol className="mt-2 space-y-2">
        {questions.map((q, i) => {
          const given = (answers[i] ?? "").trim();
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
        <button
          onClick={onRetake}
          className="w-full rounded-2xl bg-brand-500 py-4 text-lg font-black text-white shadow-lg shadow-brand-500/30 active:scale-[0.99]"
        >
          {t("exam.retake")}
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
      <span className="text-sm font-bold text-slate-500">
        {t("exam.exam_label")}
      </span>
      <div className="h-10 w-10" />
    </div>
  );
}
