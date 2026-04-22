"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { formatMessage, LOCALES, type Locale } from "./messages";

const STORAGE_KEY = "multiply-locale";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: TFn;
}

const I18nContext = createContext<I18nValue>({
  locale: "es",
  setLocale: () => {},
  toggleLocale: () => {},
  t: (key) => key,
});

function detectInitial(): Locale {
  if (typeof window === "undefined") return "es";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "es" || saved === "en") return saved;
  const nav =
    typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "";
  return nav.startsWith("en") ? "en" : "es";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // SSR safe: always start in "es" to match the server-rendered lang attr,
  // then update from localStorage/browser in an effect.
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    const next = detectInitial();
    if (next !== locale) setLocaleState(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    if (!LOCALES.includes(l)) return;
    setLocaleState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "es" ? "en" : "es");
  }, [locale, setLocale]);

  const t = useCallback<TFn>(
    (key, vars) => formatMessage(locale, key, vars),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
