import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLanguage } from "./language";
import { trackUserActivity } from "./userActivity";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export type Mood = "frustrated" | "tired" | "demotivated" | "happy" | "fun";

export const MOOD_META: Record<Mood, {
  label: string;
  emoji: string;
  dot: string;
  bg: string;
  headline: string;
  subhead: string;
  featured: string[];
}> = {
  frustrated: {
    label: "Frustrated",
    emoji: "🔴",
    dot: "oklch(0.7 0.15 25)",
    bg: "linear-gradient(180deg, oklch(0.94 0.04 230) 0%, oklch(0.93 0.06 170) 100%)",
    headline: "Take a deep breath.",
    subhead: "Let's get rid of that tension.",
    featured: ["/shredder", "/bubbles"],
  },
  tired: {
    label: "Tired",
    emoji: "🌙",
    dot: "oklch(0.7 0.1 300)",
    bg: "linear-gradient(180deg, oklch(0.72 0.05 290) 0%, oklch(0.78 0.07 30) 100%)",
    headline: "Time to recharge your batteries.",
    subhead: "Stare out the window for a while. The inbox can wait.",
    featured: ["/vacation", "/melody"],
  },
  demotivated: {
    label: "Demotivated",
    emoji: "🟡",
    dot: "oklch(0.82 0.12 60)",
    bg: "linear-gradient(180deg, oklch(0.95 0.06 55) 0%, oklch(0.92 0.07 25) 100%)",
    headline: "You're doing great.",
    subhead: "Let's start with a quick win.",
    featured: ["/2048", "/match"],
  },
  happy: {
    label: "Happy",
    emoji: "✨",
    dot: "oklch(0.85 0.1 200)",
    bg: "linear-gradient(135deg, oklch(0.92 0.08 200) 0%, oklch(0.9 0.09 320) 50%, oklch(0.94 0.08 90) 100%)",
    headline: "Love the energy!",
    subhead: "Let's keep the vibe going.",
    featured: ["/melody", "/bingo"],
  },
  fun: {
    label: "Fun",
    emoji: "🚀",
    dot: "oklch(0.82 0.13 340)",
    bg: "linear-gradient(135deg, oklch(0.9 0.1 340) 0%, oklch(0.92 0.09 50) 50%, oklch(0.9 0.1 180) 100%)",
    headline: "Love the energy!",
    subhead: "Let's keep the vibe going.",
    featured: ["/melody", "/bingo"],
  },
};

export function useLocalizedMoodMeta(mood: Mood | null) {
  const { moodLabel } = useLanguage();
  if (!mood) return null;
  const base = MOOD_META[mood];
  return {
    ...base,
    label: moodLabel(mood),
  };
}

const KEY = "breakroom_mood_v1";

type Ctx = {
  mood: Mood | null;
  setMood: (m: Mood) => void;
  clearMood: () => void;
  ready: boolean;
};

const MoodContext = createContext<Ctx | null>(null);

export function MoodProvider({ children }: { children: ReactNode }) {
  const [mood, setMoodState] = useState<Mood | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY) as Mood | null;
      if (stored && stored in MOOD_META) setMoodState(stored);
    } catch {}
    setReady(true);
  }, []);

  const setMood = (m: Mood) => {
    setMoodState(m);
    try { localStorage.setItem(KEY, m); } catch {}
    
    // Track mood check-in activity for logged-in users
    (async () => {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await trackUserActivity({
            userId: user.id,
            activityType: 'mood_checkin',
            moodTag: m,
          });
        }
      } catch (err) {
        console.warn('Failed to track mood check-in:', err);
      }
    })();
  };
  const clearMood = () => {
    setMoodState(null);
    try { localStorage.removeItem(KEY); } catch {}
  };

  return (
    <MoodContext.Provider value={{ mood, setMood, clearMood, ready }}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error("useMood must be used within MoodProvider");
  return ctx;
}