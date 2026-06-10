import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { RotateCcw, Sparkles } from "lucide-react";

export const Route = createFileRoute("/bingo")({
  head: () => ({
    meta: [
      { title: "Office Bingo — The Digital Breakroom" },
      { name: "description", content: "Stamp corporate clichés on a cozy pastel bingo card." },
    ],
  }),
  component: BingoPage,
});

const PHRASES = [
  "You're on mute",
  "Let's circle back",
  "Reply all by mistake",
  "Can you see my screen?",
  "Sorry, you go first",
  "I think you're frozen",
  "Let's take this offline",
  "Synergy",
  "Quick sync",
  "Per my last email",
  "Touch base",
  "Move the needle",
  "Low-hanging fruit",
  "Bandwidth",
  "Hard stop at the top of the hour",
  "Ping me",
  "Loop me in",
  "Action item",
  "Out of pocket",
  "Drinking from the firehose",
  "Boil the ocean",
  "Deep dive",
  "Parking lot it",
  "Open the kimono",
];

const HUES = [10, 50, 95, 165, 200, 230, 270, 320];
const STORAGE_KEY = "breakroom_bingo_v1";

type Saved = { date: string; cells: string[]; stamps: boolean[] };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function newBoard(): Saved {
  const picked = shuffle(PHRASES).slice(0, 25);
  picked[12] = "FREE · sip your coffee";
  return {
    date: todayKey(),
    cells: picked,
    stamps: Array.from({ length: 25 }, (_, i) => i === 12),
  };
}

function BingoPage() {
  const [board, setBoard] = useState<Saved>(() => newBoard());

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: Saved = JSON.parse(raw);
        if (parsed.date === todayKey() && parsed.cells?.length === 25) {
          setBoard(parsed);
          return;
        }
      } catch { /* noop */ }
    }
    const fresh = newBoard();
    setBoard(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  }, [board]);

  const toggle = (i: number) => {
    setBoard((b) => ({ ...b, stamps: b.stamps.map((v, idx) => (idx === i ? !v : v)) }));
  };

  const bingo = useMemo(() => checkBingo(board.stamps), [board.stamps]);

  const resetBoard = () => {
    const fresh = newBoard();
    setBoard(fresh);
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Office Bingo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stamp a square when you hear it on a call today. Board resets daily.
          </p>
        </div>
        <div className="flex items-center gap-2 glass-card rounded-full px-3 py-2">
          {bingo && (
            <span className="text-sm font-semibold text-foreground flex items-center gap-1 pr-2">
              <Sparkles className="h-4 w-4" /> BINGO!
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={resetBoard} className="gap-2">
            <RotateCcw className="h-4 w-4" /> New card
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-3 sm:p-5">
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {board.cells.map((phrase, i) => {
            const stamped = board.stamps[i];
            const hue = HUES[(i * 3) % HUES.length];
            return (
              <button
                key={i}
                onClick={() => toggle(i)}
                className="relative aspect-square rounded-2xl text-[10px] sm:text-xs font-semibold text-foreground/80 p-2 transition-all active:scale-95 text-center flex items-center justify-center leading-tight"
                style={{
                  background: `oklch(0.98 0.012 ${hue} / 0.85)`,
                  boxShadow: "inset 0 1px 2px oklch(1 0 0 / 0.7), 0 4px 12px oklch(0.7 0.08 280 / 0.1)",
                }}
              >
                <span className="px-1">{phrase}</span>
                {stamped && (
                  <span
                    className="absolute inset-1 rounded-full pointer-events-none flex items-center justify-center"
                    style={{
                      background: `radial-gradient(circle, oklch(0.78 0.14 ${hue} / 0.45) 0%, oklch(0.78 0.14 ${hue} / 0.18) 60%, transparent 75%)`,
                      animation: "stamp 0.35s cubic-bezier(.2,1.6,.4,1) both",
                    }}
                  >
                    <span
                      className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-[3px] flex items-center justify-center text-[10px] font-extrabold tracking-widest uppercase"
                      style={{
                        borderColor: `oklch(0.55 0.18 ${hue} / 0.7)`,
                        color: `oklch(0.55 0.18 ${hue} / 0.85)`,
                        transform: "rotate(-12deg)",
                      }}
                    >
                      Yep
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes stamp { 0% { transform: scale(0.4); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </AppShell>
  );
}

function checkBingo(s: boolean[]): boolean {
  const lines: number[][] = [];
  for (let r = 0; r < 5; r++) lines.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
  for (let c = 0; c < 5; c++) lines.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
  lines.push([0, 6, 12, 18, 24]);
  lines.push([4, 8, 12, 16, 20]);
  return lines.some((line) => line.every((i) => s[i]));
}