import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Language } from "./i18n";
import { translations, moodLabels } from "./i18n";

const KEY = "breakroom_language_v1";

type Ctx = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  moodLabel: (mood: string) => string;
  ready: boolean;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY) as Language | null;
      if (stored && (stored === "en" || stored === "ms" || stored === "manglish")) {
        setLanguageState(stored);
      }
    } catch {}
    setReady(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem(KEY, lang); } catch {}
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  const moodLabel = (mood: string) => {
    return moodLabels[language][mood] || mood;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, moodLabel, ready }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
