import { useMood, type Mood } from "@/lib/mood";
import { useLanguage } from "@/lib/language";
import { moodLabels } from "@/lib/i18n";

const MOOD_ORDER: Mood[] = ["frustrated", "tired", "demotivated", "happy", "fun"];

export function MoodSwitcher() {
  const { mood, setMood } = useMood();
  const { language } = useLanguage();

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase mb-3">
        {language === "en" ? "Quick mood check" : language === "ms" ? "Check mood pantas" : "Quick mood check"}
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {MOOD_ORDER.map((m) => {
          const isActive = mood === m;
          const label = moodLabels[language][m] || m;
          
          return (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-gradient-to-r from-[var(--gradient-mint)] to-[var(--gradient-lav)] text-foreground shadow-[var(--shadow-glow)]"
                  : "bg-white/40 hover:bg-white/60 text-foreground/70 border border-white/30"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
