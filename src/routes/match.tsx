import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Coffee, Leaf, Cloud, Laptop, Cookie, Headphones, Sun, Moon,
  RotateCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/match")({
  head: () => ({
    meta: [
      { title: "Pastel Match — The Digital Breakroom" },
      { name: "description", content: "A cozy memory game with cute office icons." },
    ],
  }),
  component: MatchPage,
});

type Tile = { id: number; icon: LucideIcon; key: string; hue: number; flipped: boolean; matched: boolean };

const ICONS: { icon: LucideIcon; key: string; hue: number }[] = [
  { icon: Coffee, key: "coffee", hue: 50 },
  { icon: Leaf, key: "leaf", hue: 165 },
  { icon: Cloud, key: "cloud", hue: 230 },
  { icon: Laptop, key: "laptop", hue: 280 },
  { icon: Cookie, key: "cookie", hue: 30 },
  { icon: Headphones, key: "head", hue: 320 },
  { icon: Sun, key: "sun", hue: 90 },
  { icon: Moon, key: "moon", hue: 260 },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeDeck(): Tile[] {
  const pairs = ICONS.flatMap((ic, i) => [
    { id: i * 2, ...ic, flipped: false, matched: false },
    { id: i * 2 + 1, ...ic, flipped: false, matched: false },
  ]);
  return shuffle(pairs);
}

const BEST_KEY = "breakroom_match_best";

function MatchPage() {
  const [tiles, setTiles] = useState<Tile[]>(makeDeck);
  const [picks, setPicks] = useState<number[]>([]);
  const [flips, setFlips] = useState(0);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    const b = localStorage.getItem(BEST_KEY);
    if (b) setBest(parseInt(b, 10));
  }, []);

  const allMatched = useMemo(() => tiles.every((t) => t.matched), [tiles]);

  useEffect(() => {
    if (allMatched && tiles.length > 0) {
      if (best === null || flips < best) {
        setBest(flips);
        localStorage.setItem(BEST_KEY, String(flips));
      }
    }
  }, [allMatched, flips, best, tiles.length]);

  const flip = (id: number) => {
    if (picks.length === 2) return;
    const tile = tiles.find((t) => t.id === id);
    if (!tile || tile.flipped || tile.matched) return;
    const next = tiles.map((t) => (t.id === id ? { ...t, flipped: true } : t));
    const newPicks = [...picks, id];
    setTiles(next);
    setPicks(newPicks);

    if (newPicks.length === 2) {
      setFlips((f) => f + 1);
      const [a, b2] = newPicks.map((pid) => next.find((t) => t.id === pid)!);
      if (a.key === b2.key) {
        setTimeout(() => {
          setTiles((ts) =>
            ts.map((t) => (t.id === a.id || t.id === b2.id ? { ...t, matched: true } : t)),
          );
          setPicks([]);
        }, 350);
      } else {
        setTimeout(() => {
          setTiles((ts) =>
            ts.map((t) => (t.id === a.id || t.id === b2.id ? { ...t, flipped: false } : t)),
          );
          setPicks([]);
        }, 850);
      }
    }
  };

  const reset = () => {
    setTiles(makeDeck());
    setPicks([]);
    setFlips(0);
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Pastel Match</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Flips: <span className="font-semibold text-foreground">{flips}</span>
            {best !== null && <> · Best: <span className="font-semibold text-foreground">{best}</span></>}
          </p>
        </div>
        <Button variant="ghost" onClick={reset} className="glass-card rounded-full gap-2">
          <RotateCcw className="h-4 w-4" /> New game
        </Button>
      </div>

      {allMatched && (
        <div className="glass-card rounded-3xl p-4 mb-4 text-center text-sm">
          You did it in <strong>{flips}</strong> flips. Take a sip of water. 🌿
        </div>
      )}

      <div className="glass-card rounded-3xl p-4 sm:p-6">
        <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-2xl mx-auto">
          {tiles.map((t) => (
            <MatchTile key={t.id} tile={t} onClick={() => flip(t.id)} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function MatchTile({ tile, onClick }: { tile: Tile; onClick: () => void }) {
  const open = tile.flipped || tile.matched;
  const Icon = tile.icon;
  return (
    <button
      onClick={onClick}
      className="relative aspect-square rounded-2xl transition-transform active:scale-95"
      style={{ perspective: "800px" }}
      aria-label={open ? tile.key : "hidden card"}
    >
      <div
        className="absolute inset-0 transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: open ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl shadow-[var(--shadow-soft)]"
          style={{
            backfaceVisibility: "hidden",
            background: "var(--gradient-lav)",
          }}
        >
          <div className="h-full w-full rounded-2xl flex items-center justify-center text-foreground/40 text-2xl font-display">
            ✦
          </div>
        </div>
        <div
          className="absolute inset-0 rounded-2xl flex items-center justify-center shadow-[var(--shadow-soft)]"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: `radial-gradient(circle at 30% 30%, oklch(0.98 0.04 ${tile.hue}), oklch(0.88 0.08 ${tile.hue}))`,
            opacity: tile.matched ? 0.65 : 1,
          }}
        >
          <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-foreground/70" />
        </div>
      </div>
    </button>
  );
}