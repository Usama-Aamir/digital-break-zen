import { useLanguage } from "@/lib/language";
import { languageMeta, type Language } from "@/lib/i18n";
import { useEffect, useState } from "react";

export function LanguageGate() {
  const { language, setLanguage, ready } = useLanguage();
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (ready && !language) {
      const t = setTimeout(() => setMounted(true), 20);
      return () => clearTimeout(t);
    }
    setMounted(false);
    setClosing(false);
  }, [ready, language]);

  if (!ready || language) return null;

  const pick = (lang: Language) => {
    setClosing(true);
    setTimeout(() => {
      setLanguage(lang);
    }, 350);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-opacity duration-300 ${
        closing ? "opacity-0" : mounted ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at top, oklch(0.95 0.05 280 / 0.85), oklch(0.95 0.04 200 / 0.92))",
        backdropFilter: "blur(20px)",
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`glass-card rounded-[2rem] max-w-lg w-full p-8 sm:p-10 text-center transition-all duration-500 ${
          closing
            ? "scale-95 -translate-y-2 opacity-0"
            : mounted
            ? "scale-100 translate-y-0 opacity-100"
            : "scale-95 translate-y-4 opacity-0"
        }`}
      >
        <span className="inline-block text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-white/60 rounded-full px-3 py-1 mb-4">
          welcome
        </span>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-foreground">
          Choose your language
          <span className="block bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
            Pilih bahasa anda
          </span>
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Select your preferred language to personalize your experience.
        </p>

        <div className="mt-7 flex flex-col gap-3">
          {(Object.keys(languageMeta) as Language[]).map((lang) => {
            const meta = languageMeta[lang];
            return (
              <button
                key={lang}
                onClick={() => pick(lang)}
                className="group relative rounded-2xl px-6 py-4 text-left bg-white/70 hover:bg-white shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5 transition-all border border-white/70"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{meta.flag}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{meta.name}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{meta.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
