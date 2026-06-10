import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Send, Scissors } from "lucide-react";
import { HowToPlay } from "@/components/HowToPlay";

export const Route = createFileRoute("/shredder")({
  head: () => ({
    meta: [
      { title: "The Digital Shredder — The Digital Breakroom" },
      { name: "description", content: "Vent in private. Let it go. Nothing is saved." },
    ],
  }),
  component: ShredderPage,
});

type Mode = "shred" | "fly";

function ShredderPage() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("shred");
  const [animating, setAnimating] = useState(false);
  const [released, setReleased] = useState<string | null>(null);

  const letItGo = () => {
    if (!text.trim() || animating) return;
    setReleased(text);
    setText("");
    setAnimating(true);
    window.setTimeout(() => {
      setReleased(null);
      setAnimating(false);
    }, mode === "shred" ? 1600 : 2400);
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-display font-bold">The Digital Shredder</h1>
            <HowToPlay
              gameKey="shredder"
              title="The Digital Shredder"
              steps={[
                { icon: "✍️", text: "Type out whatever's frustrating you in the text box." },
                { icon: "🗑️", text: "Pick Shred or Fly away, then hit 'Let it go'." },
                { icon: "🔒", text: "Nothing is saved — your words vanish with the animation." },
              ]}
              cta="Got it!"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Need to vent? Type it out. We promise — nothing is saved, anywhere.
          </p>
        </div>
        <div className="flex items-center gap-1 glass-card rounded-full p-1">
          <button
            onClick={() => setMode("shred")}
            className={`text-sm rounded-full px-3 py-1.5 font-medium transition-all flex items-center gap-1.5 ${
              mode === "shred"
                ? "bg-[image:var(--gradient-peach)] text-foreground shadow-[var(--shadow-soft)]"
                : "text-muted-foreground"
            }`}
          >
            <Scissors className="h-3.5 w-3.5" /> Shred
          </button>
          <button
            onClick={() => setMode("fly")}
            className={`text-sm rounded-full px-3 py-1.5 font-medium transition-all flex items-center gap-1.5 ${
              mode === "fly"
                ? "bg-[image:var(--gradient-lav)] text-foreground shadow-[var(--shadow-soft)]"
                : "text-muted-foreground"
            }`}
          >
            <Send className="h-3.5 w-3.5" /> Fly away
          </button>
        </div>
      </div>

      <div className="relative glass-card rounded-3xl p-6 overflow-hidden min-h-[420px]">
        {!animating && (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's bugging you today? Type it out — every annoying email, every back-to-back meeting…"
              rows={10}
              className="w-full resize-none bg-white/60 rounded-2xl p-4 text-foreground placeholder:text-muted-foreground/70 outline-none focus:ring-2 focus:ring-[var(--lavender)] font-sans"
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={letItGo} disabled={!text.trim()} className="gap-2 bg-[image:var(--gradient-hero)] text-foreground hover:opacity-90">
                {mode === "shred" ? <Scissors className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                Let it go
              </Button>
            </div>
          </>
        )}

        {animating && released && mode === "shred" && (
          <div className="absolute inset-6">
            <div className="relative h-full w-full">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bg-white/80 rounded-sm text-xs text-foreground/70 overflow-hidden px-1 py-2"
                  style={{
                    left: `${(i / 14) * 100}%`,
                    width: `${100 / 14}%`,
                    height: "60%",
                    animation: `shred 1.5s ${i * 0.04}s ease-in forwards`,
                    boxShadow: "0 2px 6px oklch(0 0 0 / 0.06)",
                  }}
                >
                  <div className="whitespace-pre-wrap break-all leading-tight">
                    {released.split("").filter((_, idx) => idx % 14 === i).join("")}
                  </div>
                </div>
              ))}
              {/* Shredder mouth */}
              <div className="absolute left-0 right-0 top-[60%] h-6 rounded-md bg-[image:var(--gradient-lav)] shadow-[var(--shadow-soft)]" />
              <div className="absolute left-0 right-0 top-[60%] h-6 flex items-center justify-around">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span key={i} className="h-4 w-0.5 bg-white/50 rounded-full" />
                ))}
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground animate-pulse">
                Shredding… breathe out.
              </p>
            </div>
          </div>
        )}

        {animating && released && mode === "fly" && (
          <div className="absolute inset-6">
            <div
              className="absolute left-1/2 bottom-10 -translate-x-1/2"
              style={{ animation: "fly 2.4s ease-in forwards" }}
            >
              <PaperPlane />
              <p className="mt-2 text-xs text-muted-foreground text-center max-w-[12rem] truncate">
                {released}
              </p>
            </div>
            <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground animate-pulse">
              Letting it fly away…
            </p>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4">
        Nothing you type here is stored. It exists only in this browser tab, just for a moment.
      </p>

      <style>{`
        @keyframes shred {
          0% { transform: translateY(0) rotate(0); opacity: 1; }
          40% { transform: translateY(0) rotate(0); opacity: 1; }
          100% { transform: translateY(80%) rotate(${Math.random() * 6 - 3}deg); opacity: 0; }
        }
        @keyframes fly {
          0% { transform: translate(-50%, 0) rotate(-5deg); opacity: 1; }
          60% { transform: translate(20%, -200px) rotate(15deg); opacity: 1; }
          100% { transform: translate(120%, -420px) rotate(40deg); opacity: 0; }
        }
      `}</style>
    </AppShell>
  );
}

function PaperPlane() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <path d="M4 36 L68 8 L48 64 L36 44 L4 36 Z" fill="url(#g)" stroke="oklch(0.6 0.06 270)" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M36 44 L68 8" stroke="oklch(0.6 0.06 270 / 0.6)" strokeWidth="1" />
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.95 0.04 230)" />
          <stop offset="100%" stopColor="oklch(0.88 0.07 300)" />
        </linearGradient>
      </defs>
    </svg>
  );
}