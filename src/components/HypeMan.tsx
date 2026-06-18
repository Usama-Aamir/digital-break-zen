import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { generateHypeSpeech } from "@/lib/hype-generator";
import { Button } from "@/components/ui/button";

type Confetti = { id: number; left: number; delay: number; bg: string; rot: number };

const COLORS = ["#FBCFE8", "#BAE6FD", "#FDE68A", "#C7D2FE", "#BBF7D0", "#FECACA"];

export function HypeMan() {
  const [title, setTitle] = useState("");
  const [hype, setHype] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<Confetti[]>([]);

  function generateHype(jobTitle: string) {
    return generateHypeSpeech(jobTitle);
  }

  function burstConfetti() {
    const next: Confetti[] = Array.from({ length: 24 }, (_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100,
      delay: Math.random() * 200,
      bg: COLORS[i % COLORS.length],
      rot: Math.random() * 360,
    }));
    setConfetti(next);
    setTimeout(() => setConfetti([]), 1800);
  }

  async function onSubmit() {
    if (!title.trim() || loading) return;
    setLoading(true);
    setError(null);
    setHype("");
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const out = generateHype(title.trim());
      setHype(out);
      burstConfetti();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-3 relative overflow-hidden">
      <div>
        <h3 className="font-display font-bold text-lg">Hyper-Specific Hype-Man</h3>
        <p className="text-sm text-muted-foreground">Tell me your title. I'll make it sound legendary.</p>
      </div>
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder="What is your job title?"
          className="flex-1 rounded-full bg-white/70 border border-white/60 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button
          onClick={onSubmit}
          disabled={!title.trim() || loading}
          className="rounded-full bg-[image:var(--gradient-peach)] text-foreground hover:opacity-95 shadow-[var(--shadow-soft)] shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          <span className="ml-2">Hype Me Up!</span>
        </Button>
      </div>
      <blockquote
        className="rounded-2xl px-5 py-6 text-center text-lg sm:text-xl font-display font-bold leading-snug bg-[image:var(--gradient-hero)] bg-clip-text text-transparent min-h-[96px] flex items-center justify-center border border-white/60"
        style={{ WebkitTextFillColor: hype ? "transparent" : undefined }}
      >
        {error ? (
          <span className="text-destructive text-base font-medium" style={{ WebkitTextFillColor: "currentColor" }}>{error}</span>
        ) : hype ? (
          `"${hype}"`
        ) : (
          <span className="text-muted-foreground text-sm font-medium" style={{ WebkitTextFillColor: "currentColor" }}>
            Your personalized pep talk lands here.
          </span>
        )}
      </blockquote>
      {confetti.length > 0 && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {confetti.map((c) => (
            <span
              key={c.id}
              className="absolute top-0 h-2.5 w-2.5 rounded-sm"
              style={{
                left: `${c.left}%`,
                background: c.bg,
                transform: `rotate(${c.rot}deg)`,
                animation: `hype-fall 1.5s ${c.delay}ms ease-in forwards`,
              }}
            />
          ))}
          <style>{`
            @keyframes hype-fall {
              from { transform: translateY(-20px) rotate(0deg); opacity: 1; }
              to   { transform: translateY(380px) rotate(540deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}