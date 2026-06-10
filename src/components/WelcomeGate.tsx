import { useMood, MOOD_META, type Mood } from "@/lib/mood";
import { useEffect, useState } from "react";

const ORDER: Mood[] = ["frustrated", "tired", "demotivated", "happy", "fun"];

export function WelcomeGate() {
  const { mood, setMood, ready } = useMood();
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (ready && !mood) {
      // ensure entrance animation
      const t = setTimeout(() => setMounted(true), 20);
      return () => clearTimeout(t);
    }
    setMounted(false);
    setClosing(false);
  }, [ready, mood]);

  if (!ready || mood) return null;

  const pick = (m: Mood) => {
    setClosing(true);
    setTimeout(() => setMood(m), 350);
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
          How are you feeling
          <span className="block bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
            right now?
          </span>
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Pick a mood — we'll set the room just for you.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {ORDER.map((m) => {
            const meta = MOOD_META[m];
            return (
              <button
                key={m}
                onClick={() => pick(m)}
                className="group relative rounded-2xl px-4 py-3 text-sm font-semibold text-foreground/80 bg-white/70 hover:bg-white shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5 transition-all border border-white/70"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: meta.dot }}
                    aria-hidden
                  />
                  <span>{meta.label}</span>
                  <span className="text-base leading-none">{meta.emoji}</span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-[11px] text-muted-foreground">
          You can change your mood any time from the navbar.
        </p>
      </div>
    </div>
  );
}