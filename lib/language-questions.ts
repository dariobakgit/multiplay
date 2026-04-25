import type {
  LanguageLevel,
  LanguageQuestionType,
  LanguageTopic,
} from "./level-types";
import { shuffle, type LanguageQuestion } from "./questions";
import {
  ADJECTIVES,
  ADVERBS_AND_OTHERS,
  CAPITALIZATION_QUESTIONS,
  COMMON_NOUNS,
  DESCRIBE_NOUN,
  PROPER_NOUNS,
  SENT_MULTI_NOUNS,
  SENT_ONE_ADJECTIVE,
  SENT_ONE_COMMON_NOUN,
  SENT_ONE_PROPER_NOUN,
  SENT_ONE_VERB,
  SUBJECT_VERB,
  VERBS_INFINITIVE,
} from "./language-bank";

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr.slice()).slice(0, n);
}

/** Pick 3 distractors from the given pool, none equal (case-insensitive)
 * to `exclude`. */
function pickDistractors(pool: readonly string[], exclude: string, n: number): string[] {
  const lc = exclude.toLowerCase();
  const filtered = pool.filter((w) => w.toLowerCase() !== lc);
  return pickN(filtered, n);
}

function shuffleOptions(answer: string, distractors: string[]): string[] {
  return shuffle([answer, ...distractors]);
}

/** Build a question of type "identify" — pick a target word of the
 * topic's class and 3 distractors of other classes. */
function buildIdentify(topic: LanguageTopic): LanguageQuestion {
  // For "final" treat as random across the four base topics.
  const effective: LanguageTopic =
    topic === "final"
      ? pick(["noun-common", "noun-proper", "adjective", "verb"] as const)
      : topic;

  let prompt: string;
  let answer: string;
  let distractors: string[];

  if (effective === "noun-common") {
    prompt = "¿Cuál de estas palabras es un sustantivo común?";
    answer = pick(COMMON_NOUNS);
    distractors = [
      pick(VERBS_INFINITIVE),
      pick(ADJECTIVES),
      pick(ADVERBS_AND_OTHERS),
    ];
  } else if (effective === "noun-proper") {
    prompt = "¿Cuál de estas palabras es un sustantivo propio?";
    answer = pick(PROPER_NOUNS);
    distractors = [
      pick(COMMON_NOUNS),
      pick(VERBS_INFINITIVE),
      pick(ADJECTIVES),
    ];
  } else if (effective === "adjective") {
    prompt = "¿Cuál de estas palabras es un adjetivo?";
    answer = pick(ADJECTIVES);
    distractors = [
      pick(COMMON_NOUNS),
      pick(VERBS_INFINITIVE),
      pick(ADVERBS_AND_OTHERS),
    ];
  } else {
    // verb (and noun-mix falls back to verb here, though noun-mix shouldn't
    // use "identify"; safe default).
    prompt = "¿Cuál de estas palabras es un verbo?";
    answer = pick(VERBS_INFINITIVE);
    distractors = [
      pick(COMMON_NOUNS),
      pick(ADJECTIVES),
      pick(ADVERBS_AND_OTHERS),
    ];
  }

  return {
    type: "language",
    prompt,
    answer,
    options: shuffleOptions(answer, distractors),
  };
}

/** Pick a sentence that has exactly one noun (common or proper depending
 * on topic) and ask which word is the noun. Options are 4 words from
 * the sentence. */
function buildFindNoun(topic: LanguageTopic): LanguageQuestion {
  const effective: LanguageTopic =
    topic === "final"
      ? pick(["noun-common", "noun-proper"] as const)
      : topic;

  const useProper = effective === "noun-proper";
  const source = useProper ? SENT_ONE_PROPER_NOUN : SENT_ONE_COMMON_NOUN;
  const item = pick(source);

  const words = item.sentence.split(" ");
  const correct = item.noun;
  const others = words.filter(
    (w) => w.toLowerCase() !== correct.toLowerCase(),
  );
  const distractors =
    others.length >= 3
      ? pickN(others, 3)
      : [
          ...others,
          ...pickN(
            ADVERBS_AND_OTHERS.filter(
              (w) => !words.some((x) => x.toLowerCase() === w.toLowerCase()),
            ),
            3 - others.length,
          ),
        ];

  const promptText = useProper
    ? "¿Cuál es el sustantivo propio en esta oración?"
    : "¿Cuál es el sustantivo común en esta oración?";

  return {
    type: "language",
    prompt: promptText,
    context: item.sentence,
    answer: correct,
    options: shuffleOptions(correct, distractors),
  };
}

/** Show a multi-noun sentence and ask how many nouns it has.
 * Options are numbers as strings: 1, 2, 3, 4. */
function buildCountNouns(): LanguageQuestion {
  const item = pick(SENT_MULTI_NOUNS);
  const correct = String(item.count);
  const distractors = ["1", "2", "3", "4"].filter((n) => n !== correct);
  return {
    type: "language",
    prompt: "¿Cuántos sustantivos hay en esta oración?",
    context: item.sentence,
    answer: correct,
    options: shuffleOptions(correct, pickN(distractors, 3)),
  };
}

/** Classify a single word as common or proper. */
function buildClassifyNoun(): LanguageQuestion {
  const isProper = Math.random() < 0.5;
  const word = isProper ? pick(PROPER_NOUNS) : pick(COMMON_NOUNS);
  const correct = isProper ? "Sustantivo propio" : "Sustantivo común";
  return {
    type: "language",
    prompt: `La palabra "${word}" es:`,
    answer: correct,
    options: ["Sustantivo común", "Sustantivo propio"],
  };
}

/** Show a multi-noun sentence and ask whether a specific noun pulled
 * from it is common or proper. */
function buildClassifyNounInSentence(): LanguageQuestion {
  // Pick a sentence with at least one common AND one proper noun.
  const candidates = SENT_MULTI_NOUNS.filter((s) =>
    s.nouns.some((n) => PROPER_NOUNS.includes(n)) &&
    s.nouns.some((n) => COMMON_NOUNS.includes(n)),
  );
  const item = pick(candidates.length > 0 ? candidates : SENT_MULTI_NOUNS);
  const target = pick(item.nouns);
  const isProper = PROPER_NOUNS.includes(target);
  const correct = isProper ? "Sustantivo propio" : "Sustantivo común";
  return {
    type: "language",
    prompt: `En "${item.sentence}", la palabra "${target}" es:`,
    answer: correct,
    options: ["Sustantivo común", "Sustantivo propio"],
  };
}

/** Choose the correctly capitalized version of a sentence. */
function buildCapitalization(): LanguageQuestion {
  const item = pick(CAPITALIZATION_QUESTIONS);
  return {
    type: "language",
    prompt: "¿Cuál oración está correctamente escrita?",
    answer: item.correct,
    options: shuffleOptions(item.correct, item.variants.slice()),
  };
}

/** "¿Qué adjetivo describe a/al X?" */
function buildDescribeWithAdjective(): LanguageQuestion {
  const item = pick(DESCRIBE_NOUN);
  const article = item.gender === "f" ? "una" : "un";
  // Get 3 wrong adjectives that are clearly different from the right one.
  const distractors = pickDistractors(ADJECTIVES, item.adjective, 3);
  return {
    type: "language",
    prompt: `¿Qué adjetivo describe mejor a ${article} ${item.subject}?`,
    answer: item.adjective,
    options: shuffleOptions(item.adjective, distractors),
  };
}

/** Find the adjective in a sentence with exactly one adjective. */
function buildFindAdjective(): LanguageQuestion {
  const item = pick(SENT_ONE_ADJECTIVE);
  const words = item.sentence.split(" ");
  const correct = item.adjective;
  const others = words.filter(
    (w) => w.toLowerCase() !== correct.toLowerCase(),
  );
  return {
    type: "language",
    prompt: "¿Cuál es el adjetivo en esta oración?",
    context: item.sentence,
    answer: correct,
    options: shuffleOptions(correct, pickN(others, 3)),
  };
}

/** "¿Qué hace X?" */
function buildSubjectVerb(): LanguageQuestion {
  const item = pick(SUBJECT_VERB);
  const distractors = pickDistractors(
    SUBJECT_VERB.map((s) => s.verb),
    item.verb,
    3,
  );
  return {
    type: "language",
    prompt: `¿Qué hace ${item.article} ${item.subject}?`,
    answer: item.verb,
    options: shuffleOptions(item.verb, distractors),
  };
}

/** Find the verb in a sentence with exactly one verb. */
function buildFindVerb(): LanguageQuestion {
  const item = pick(SENT_ONE_VERB);
  const words = item.sentence.split(" ");
  const correct = item.verb;
  const others = words.filter(
    (w) => w.toLowerCase() !== correct.toLowerCase(),
  );
  return {
    type: "language",
    prompt: "¿Cuál es el verbo en esta oración?",
    context: item.sentence,
    answer: correct,
    options: shuffleOptions(correct, pickN(others, 3)),
  };
}

const ALL_TYPES: LanguageQuestionType[] = [
  "identify",
  "find-noun-1",
  "count-nouns",
  "classify-noun",
  "classify-noun-in-sentence",
  "capitalization",
  "describe-with-adjective",
  "find-adjective",
  "subject-verb",
  "find-verb",
];

function buildOne(
  type: LanguageQuestionType,
  topic: LanguageTopic,
): LanguageQuestion {
  switch (type) {
    case "identify":
      return buildIdentify(topic);
    case "find-noun-1":
      return buildFindNoun(topic);
    case "count-nouns":
      return buildCountNouns();
    case "classify-noun":
      return buildClassifyNoun();
    case "classify-noun-in-sentence":
      return buildClassifyNounInSentence();
    case "capitalization":
      return buildCapitalization();
    case "describe-with-adjective":
      return buildDescribeWithAdjective();
    case "find-adjective":
      return buildFindAdjective();
    case "subject-verb":
      return buildSubjectVerb();
    case "find-verb":
      return buildFindVerb();
    case "all":
      return buildOne(pick(ALL_TYPES), "final");
  }
}

export function buildLanguageQuestions(level: LanguageLevel): LanguageQuestion[] {
  const out: LanguageQuestion[] = [];
  // Avoid two identical prompts (with same answer & options) in a row.
  let lastKey = "";
  let safety = 0;
  while (out.length < level.questions && safety < level.questions * 10) {
    safety++;
    const t = pick(level.questionTypes);
    const q = buildOne(t, level.topic);
    const key = `${q.prompt}|${q.context ?? ""}|${q.answer}`;
    if (key === lastKey) continue;
    out.push(q);
    lastKey = key;
  }
  return out;
}
