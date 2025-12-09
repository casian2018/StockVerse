import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import fr from "@/locales/fr.json";
import de from "@/locales/de.json";
import it from "@/locales/it.json";
import pt from "@/locales/pt.json";
import ru from "@/locales/ru.json";
import zh from "@/locales/zh.json";
import ja from "@/locales/ja.json";
import ko from "@/locales/ko.json";
import hi from "@/locales/hi.json";
import ar from "@/locales/ar.json";
import nl from "@/locales/nl.json";
import sv from "@/locales/sv.json";
import tr from "@/locales/tr.json";

type Messages = Record<string, string>;

export type Locale =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "pt"
  | "ru"
  | "zh"
  | "ja"
  | "ko"
  | "hi"
  | "ar"
  | "nl"
  | "sv"
  | "tr";

const dictionaries: Record<Locale, Messages> = { en, es, fr, de, it, pt, ru, zh, ja, ko, hi, ar, nl, sv, tr };

export const supportedLanguages: Array<{ code: Locale; label: string }> = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "hi", label: "हिन्दी" },
  { code: "ar", label: "العربية" },
  { code: "nl", label: "Nederlands" },
  { code: "sv", label: "Svenska" },
  { code: "tr", label: "Türkçe" },
];


interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, fallback?: string) => string;
  formatDate: (date: Date | number, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (
    value: number,
    options?: { currency?: string; minimumFractionDigits?: number; maximumFractionDigits?: number }
  ) => string;
}

const STORAGE_KEY = "stockverse_locale";

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const getBrowserLocale = () => {
  if (typeof navigator === "undefined") return "en";
  const candidate = navigator.language?.slice(0, 2)?.toLowerCase();
  return candidate && candidate in dictionaries ? (candidate as Locale) : "en";
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(STORAGE_KEY) as Locale | null)
        : null;
    if (stored && stored in dictionaries) {
      setLocaleState(stored);
    } else {
      setLocaleState(getBrowserLocale());
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      const dict: Messages = dictionaries[locale] || dictionaries.en;
      return dict[key] || dictionaries.en[key] || fallback || key;
    },
    [locale]
  );

  const formatDate = useCallback(
    (date: Date | number, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, options).format(date),
    [locale]
  );

  const formatCurrency = useCallback(
    (
      value: number,
      options?: { currency?: string; minimumFractionDigits?: number; maximumFractionDigits?: number }
    ) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: options?.currency || "USD",
        minimumFractionDigits: options?.minimumFractionDigits,
        maximumFractionDigits: options?.maximumFractionDigits ?? 0,
      }).format(value || 0),
    [locale]
  );

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      formatDate,
      formatCurrency,
    }),
    [locale, setLocale, t, formatDate, formatCurrency]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
