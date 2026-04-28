"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "multiply-install-dismissed";

type Platform = "ios" | "android" | "other";

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari exposes this property when launched from the home screen.
  return (window.navigator as { standalone?: boolean }).standalone === true;
}

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

export function InstallBanner() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (detectStandalone()) return;
    if (window.sessionStorage.getItem(DISMISS_KEY)) return;

    setPlatform(detectPlatform());
    setShow(true);

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setShow(false);
      setShowHelp(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    window.sessionStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
    setShowHelp(false);
  }

  async function handleInstall() {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        if (choice.outcome === "accepted") {
          setShow(false);
          return;
        }
      } catch {
        // fall through to manual help
      }
    }
    // No native prompt available — show manual instructions.
    setShowHelp(true);
  }

  if (!show) return null;

  const helpTitle =
    platform === "ios" ? t("install.ios_title") : t("install.android_title");
  const helpSteps =
    platform === "ios"
      ? [t("install.ios_step1"), t("install.ios_step2"), t("install.ios_step3")]
      : [
          t("install.android_step1"),
          t("install.android_step2"),
          t("install.android_step3"),
        ];

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center gap-2 border-b border-brand-200 bg-brand-50/95 px-3 py-2 shadow-sm backdrop-blur">
        <p className="flex-1 truncate text-xs font-bold text-brand-900 sm:text-sm">
          {t("install.cta")}
        </p>
        <button
          type="button"
          onClick={handleInstall}
          className="shrink-0 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-black text-white shadow-sm shadow-brand-500/30 active:scale-95"
        >
          {t("install.button")}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("install.dismiss")}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base font-black text-brand-700 hover:bg-brand-100"
        >
          ×
        </button>
      </div>

      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-slate-900">{helpTitle}</h3>
            <ol className="mt-3 space-y-2 text-sm text-slate-700">
              {helpSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-black text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full rounded-xl bg-brand-500 py-3 text-sm font-black text-white shadow-sm active:scale-[0.99]"
            >
              {t("install.ok")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
