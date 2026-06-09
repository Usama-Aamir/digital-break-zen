import { useEffect, useState } from "react";

const PHASES = [
  { label: "Breathe in", duration: 4000 },
  { label: "Hold", duration: 2000 },
  { label: "Breathe out", duration: 4000 },
] as const;

export function Breather() {
  const [phaseIdx, setPhaseIdx] = useState(0);
  useEffect(() => {
    const t = setTimeout(
      () => setPhaseIdx((i) => (i + 1) % PHASES.length),
      PHASES[phaseIdx].duration,
    );
    return () => clearTimeout(t);
  }, [phaseIdx]);
  const phase = PHASES[phaseIdx];
  const scale = phase.label === "Breathe in" ? 1.15 : phase.label === "Hold" ? 1.15 : 0.65;
  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col items-center justify-center gap-4">
      <h3 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
        10-Second Breather
      </h3>
      <div className="relative h-40 w-40 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[image:var(--gradient-mint)] opacity-30 blur-2xl" />
        <div
          className="h-32 w-32 rounded-full bg-[image:var(--gradient-hero)] shadow-[var(--shadow-glow)] transition-transform ease-in-out"
          style={{
            transform: `scale(${scale})`,
            transitionDuration: `${phase.duration}ms`,
          }}
        />
        <span className="absolute text-sm font-display font-semibold text-foreground/80">
          {phase.label}
        </span>
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Follow the circle. Inhale as it grows, exhale as it softens.
      </p>
    </div>
  );
}