import {
  MIN_PASS,
  Q_COUNT,
  type LanguageLevel,
  type LanguageQuestionType,
  type LanguageTopic,
} from "./level-types";

interface Spec {
  topic: LanguageTopic;
  emoji: string;
  titleKey: string;
  subtitleKey: string;
  types: LanguageQuestionType[];
  showIntro: boolean;
  day: 1 | 2 | 3;
}

const SPECS: Spec[] = [
  // Sustantivos comunes (1-3)
  {
    topic: "noun-common",
    emoji: "📦",
    titleKey: "lang.title.noun_common_p1",
    subtitleKey: "lang.sub.noun_common_p1",
    types: ["identify"],
    showIntro: true,
    day: 1,
  },
  {
    topic: "noun-common",
    emoji: "📦",
    titleKey: "lang.title.noun_common_p2",
    subtitleKey: "lang.sub.noun_common_p2",
    types: ["identify", "find-noun-1"],
    showIntro: false,
    day: 1,
  },
  {
    topic: "noun-common",
    emoji: "📦",
    titleKey: "lang.title.noun_common_p3",
    subtitleKey: "lang.sub.noun_common_p3",
    types: ["identify", "find-noun-1", "count-nouns"],
    showIntro: false,
    day: 1,
  },

  // Sustantivos propios (4-6)
  {
    topic: "noun-proper",
    emoji: "🌎",
    titleKey: "lang.title.noun_proper_p1",
    subtitleKey: "lang.sub.noun_proper_p1",
    types: ["identify"],
    showIntro: true,
    day: 1,
  },
  {
    topic: "noun-proper",
    emoji: "🌎",
    titleKey: "lang.title.noun_proper_p2",
    subtitleKey: "lang.sub.noun_proper_p2",
    types: ["identify", "find-noun-1"],
    showIntro: false,
    day: 1,
  },
  {
    topic: "noun-proper",
    emoji: "🌎",
    titleKey: "lang.title.noun_proper_p3",
    subtitleKey: "lang.sub.noun_proper_p3",
    types: ["identify", "find-noun-1", "capitalization"],
    showIntro: false,
    day: 2,
  },

  // Mezcla común vs propio (7-8)
  {
    topic: "noun-mix",
    emoji: "🔀",
    titleKey: "lang.title.noun_mix_a",
    subtitleKey: "lang.sub.noun_mix_a",
    types: ["classify-noun"],
    showIntro: true,
    day: 2,
  },
  {
    topic: "noun-mix",
    emoji: "🎯",
    titleKey: "lang.title.noun_mix_b",
    subtitleKey: "lang.sub.noun_mix_b",
    types: ["classify-noun", "classify-noun-in-sentence"],
    showIntro: false,
    day: 2,
  },

  // Adjetivos (9-11)
  {
    topic: "adjective",
    emoji: "🌈",
    titleKey: "lang.title.adjective_p1",
    subtitleKey: "lang.sub.adjective_p1",
    types: ["identify"],
    showIntro: true,
    day: 2,
  },
  {
    topic: "adjective",
    emoji: "🌈",
    titleKey: "lang.title.adjective_p2",
    subtitleKey: "lang.sub.adjective_p2",
    types: ["identify", "describe-with-adjective"],
    showIntro: false,
    day: 3,
  },
  {
    topic: "adjective",
    emoji: "🌈",
    titleKey: "lang.title.adjective_p3",
    subtitleKey: "lang.sub.adjective_p3",
    types: ["identify", "describe-with-adjective", "find-adjective"],
    showIntro: false,
    day: 3,
  },

  // Verbos (12-14)
  {
    topic: "verb",
    emoji: "🏃",
    titleKey: "lang.title.verb_p1",
    subtitleKey: "lang.sub.verb_p1",
    types: ["identify"],
    showIntro: true,
    day: 3,
  },
  {
    topic: "verb",
    emoji: "🏃",
    titleKey: "lang.title.verb_p2",
    subtitleKey: "lang.sub.verb_p2",
    types: ["identify", "subject-verb"],
    showIntro: false,
    day: 3,
  },
  {
    topic: "verb",
    emoji: "🏃",
    titleKey: "lang.title.verb_p3",
    subtitleKey: "lang.sub.verb_p3",
    types: ["identify", "subject-verb", "find-verb"],
    showIntro: false,
    day: 3,
  },

  // Desafío Final (15)
  {
    topic: "final",
    emoji: "👑",
    titleKey: "lang.title.final",
    subtitleKey: "lang.sub.final",
    types: ["all"],
    showIntro: true,
    day: 3,
  },
];

export const LANGUAGE_LEVELS: LanguageLevel[] = SPECS.map((s, i) => ({
  id: i + 1,
  track: "language",
  theme: "nouns-verbs",
  day: s.day,
  emoji: s.emoji,
  titleKey: s.titleKey,
  subtitleKey: s.subtitleKey,
  topic: s.topic,
  questionTypes: s.types,
  questions: Q_COUNT,
  minScore: MIN_PASS,
  showIntro: s.showIntro,
}));
