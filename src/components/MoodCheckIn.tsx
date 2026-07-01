import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/lib/language";
import { useAuth } from "@/lib/auth";
import { awardXP } from "@/lib/gamification";

const MOODS = [
  { emoji: "😩", quote: "Tough mornings build legendary afternoons. One small win at a time." },
  { emoji: "😕", quote: "Even spreadsheets respect a hero who takes breaks. You've got this." },
  { emoji: "😐", quote: "Steady is a superpower. Sip some water and reset your tabs (and your mind)." },
  { emoji: "🙂", quote: "Look at you, casually thriving in fluorescent lighting. Keep going." },
  { emoji: "😄", quote: "You're radiating productivity AND vibes. The breakroom approves." },
];

const KEY = "breakroom_mood";
const LAST_MOOD_CHECK_KEY = "breakroom_last_mood_check";

export function MoodCheckIn() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [val, setVal] = useState(2);
  const [hasAwardedToday, setHasAwardedToday] = useState(false);
  
  useEffect(() => {
    const s = localStorage.getItem(KEY);
    if (s) setVal(parseInt(s, 10));
    
    // Check if already awarded XP today
    const lastCheck = localStorage.getItem(LAST_MOOD_CHECK_KEY);
    const today = new Date().toISOString().split('T')[0];
    if (lastCheck === today) {
      setHasAwardedToday(true);
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem(KEY, String(val));
  }, [val]);
  
  const handleMoodChange = (newValue: number) => {
    setVal(newValue);
    
    // Award XP for mood check-in (once per day)
    if (user && !hasAwardedToday) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(LAST_MOOD_CHECK_KEY, today);
      setHasAwardedToday(true);
      
      // Award XP asynchronously (don't block UI)
      awardXP(user.id, 'mood_check_in').catch(err => {
        console.warn('Failed to award mood check-in XP:', err);
      });
    }
  };
  
  const mood = MOODS[val];
  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
        {t("moodHeading")}
      </h3>
      <div className="flex items-center justify-center gap-4">
        <span className="text-6xl animate-float-soft drop-shadow-sm select-none">
          {mood.emoji}
        </span>
      </div>
      <Slider
        value={[val]}
        onValueChange={(v) => handleMoodChange(v[0])}
        min={0}
        max={4}
        step={1}
        className="my-2"
      />
      <div className="flex justify-between text-xs text-muted-foreground -mt-2">
        <span>{t("moodSubtitle")}</span>
        <span>{t("moodSubtitleHigh")}</span>
      </div>
      <p className="text-sm text-foreground/80 text-center italic min-h-[3rem]">
        "{mood.quote}"
      </p>
    </div>
  );
}