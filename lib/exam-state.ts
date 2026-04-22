"use client";

/** Last exam result (number of correct answers, 0-20) per user in localStorage. */

const KEY = (userId: string) => `multiply-last-exam-${userId}`;

export const FNF_UNLOCK_CORRECT = 18;

export function saveLastExam(userId: string, correctCount: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY(userId), String(correctCount));
}

export function loadLastExam(userId: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(KEY(userId));
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
