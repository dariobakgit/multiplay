import type { Track } from "./tracks";

export const Q_COUNT = 14;
export const MIN_PASS = 12;

export type LevelKind = "learn" | "mix";

interface BaseLevel {
  id: number;
  track: Track;
  day: 1 | 2 | 3;
  /** i18n key + vars for the level title. */
  titleKey: string;
  titleVars?: Record<string, string | number>;
  /** i18n key + vars for the subtitle. */
  subtitleKey: string;
  subtitleVars?: Record<string, string | number>;
  questions: number;
  minScore: number;
  emoji: string;
  /** Whether to show the full intro screen at the start of this level
   * (concept explanation + examples). Math levels always do. Language
   * uses it only on the first level of each topic. */
  showIntro: boolean;
}

export interface MathLevel extends BaseLevel {
  track: "math";
  kind: LevelKind;
  tables: number[];
  /** Optional — restrict factors (b in a×b) for "learn" levels (e.g. [1..5]) */
  factors?: number[];
}

export type LanguageTopic =
  | "noun-common"
  | "noun-proper"
  | "noun-mix"
  | "adjective"
  | "verb"
  | "final";

export type LanguageQuestionType =
  /** Identify a word of a given class among 4 options. */
  | "identify"
  /** Find the noun in a sentence with exactly one noun. */
  | "find-noun-1"
  /** Count how many nouns there are in a sentence (multiple nouns). */
  | "count-nouns"
  /** Classify a single word: common vs proper noun. */
  | "classify-noun"
  /** Classify a noun pulled out of a sentence: common vs proper. */
  | "classify-noun-in-sentence"
  /** Choose the correctly capitalized sentence. */
  | "capitalization"
  /** Adjective that best describes a given noun (subject). */
  | "describe-with-adjective"
  /** Find the adjective inside a sentence with one adjective. */
  | "find-adjective"
  /** Verb that expresses what a given subject does. */
  | "subject-verb"
  /** Find the verb inside a sentence with one verb. */
  | "find-verb"
  /** Mix of all language types (used by the final challenge). */
  | "all";

export interface LanguageLevel extends BaseLevel {
  track: "language";
  topic: LanguageTopic;
  questionTypes: LanguageQuestionType[];
}

export type Level = MathLevel | LanguageLevel;
