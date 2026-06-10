import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { HowToPlay } from "@/components/HowToPlay";

export const Route = createFileRoute("/2048")({
  head: () => ({
    meta: [
      { title: "2048 · Calm Edition — The Digital Breakroom" },
      { name: "description", content: "The classic 2048 puzzle, washed in soothing pastel gradients." },
    ],
  }),
  component: Game2048,
});

const SIZE = 4;
type Board = number[][];

function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}
function clone(b: Board): Board {
  return b.map((r) => [...r]);
}
function addRandom(b: Board): Board {
  const empties: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (b[r][c] === 0) empties.push([r, c]);
  if (!empties.length) return b;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const nb = clone(b);
  nb[r][c] = Math.random() < 0.9 ? 2 : 4;
  return nb;
}
function init(): Board {
  return addRandom(addRandom(emptyBoard()));
}
function rotate(b: Board): Board {
  const n = clone(emptyBoard());
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) n[c][SIZE - 1 - r] = b[r][c];
  return n;
}
function slideRowLeft(row: number[]): { row: number[]; gained: number } {
  const filtered = row.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      out.push(filtered[i] * 2);
      gained += filtered[i] * 2;
      i++;
    } else out.push(filtered[i]);
  }
  while (out.length < SIZE) out.push(0);
  return { row: out, gained };
}
function moveLeft(b: Board): { board: Board; gained: number; changed: boolean } {
  let gained = 0;
  let changed = false;
  const nb = b.map((row) => {
    const { row: nr, gained: g } = slideRowLeft(row);
    gained += g;
    if (nr.some((v, i) => v !== row[i])) changed = true;
    return nr;
  });
  return { board: nb, gained, changed };
}
function move(b: Board, dir: "L" | "R" | "U" | "D") {
  let rotations = { L: 0, U: 1, R: 2, D: 3 }[dir];
  let nb = b;
  for (let i = 0; i < rotations; i++) nb = rotate(nb);
  const res = moveLeft(nb);
  nb = res.board;
  for (let i = 0; i < (4 - rotations) % 4; i++) nb = rotate(nb);
  return { board: nb, gained: res.gained, changed: res.changed };
}
function hasMoves(b: Board): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (b[r][c] === 0) return true;
      if (c < SIZE - 1 && b[r][c] === b[r][c + 1]) return true;
      if (r < SIZE - 1 && b[r][c] === b[r + 1][c]) return true;
    }
  return false;
}

const BEST_KEY = "breakroom_2048_best";

function tileStyle(value: number) {
  if (value === 0) return { background: "oklch(0.96 0.015 240 / 0.5)" };
  const exp = Math.log2(value); // 1..11
  const hue = 200 + (exp - 1) * 18; // shifts through pastel spectrum
  const lightness = Math.max(0.6, 0.96 - exp * 0.025);
  const chroma = Math.min(0.15, 0.04 + exp * 0.012);
  return {
    background: `linear-gradient(135deg, oklch(${lightness + 0.04} ${chroma} ${hue}), oklch(${lightness} ${chroma} ${hue + 30}))`,
    color: `oklch(0.3 0.04 ${hue})`,
    boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.6), 0 6px 14px oklch(0.7 0.1 270 / 0.18)",
  };
}

function Game2048() {
  const [board, setBoard] = useState<Board>(init);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);

  useEffect(() => {
    const b = localStorage.getItem(BEST_KEY);
    if (b) setBest(parseInt(b, 10));
  }, []);

  useEffect(() => {
    if (score > best) {
      setBest(score);
      localStorage.setItem(BEST_KEY, String(score));
    }
  }, [score, best]);

  const doMove = useCallback(
    (dir: "L" | "R" | "U" | "D") => {
      if (over) return;
      setBoard((cur) => {
        const res = move(cur, dir);
        if (!res.changed) return cur;
        const withRand = addRandom(res.board);
        setScore((s) => s + res.gained);
        if (!hasMoves(withRand)) setOver(true);
        return withRand;
      });
    },
    [over],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, "L" | "R" | "U" | "D"> = {
        ArrowLeft: "L", ArrowRight: "R", ArrowUp: "U", ArrowDown: "D",
        a: "L", d: "R", w: "U", s: "D",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        doMove(dir);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doMove]);

  // touch swipe
  useEffect(() => {
    let sx = 0, sy = 0;
    const ts = (e: TouchEvent) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    };
    const te = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? "R" : "L");
      else doMove(dy > 0 ? "D" : "U");
    };
    window.addEventListener("touchstart", ts, { passive: true });
    window.addEventListener("touchend", te);
    return () => {
      window.removeEventListener("touchstart", ts);
      window.removeEventListener("touchend", te);
    };
  }, [doMove]);

  const reset = () => {
    setBoard(init());
    setScore(0);
    setOver(false);
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-display font-bold">2048 · Calm Edition</h1>
            <HowToPlay
              gameKey="2048"
              title="2048 · Calm Edition"
              steps={[
                { icon: "⌨️", text: "Use your Arrow Keys, WASD, or swipe to slide tiles." },
                { icon: "🎨", text: "Matching tiles merge into a softer, bigger pastel." },
                { icon: "🧘", text: "No timers. Aim for 2048 — or just drift and enjoy." },
              ]}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Arrow keys, WASD, or swipe.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card rounded-2xl px-4 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</div>
            <div className="font-display font-bold text-lg">{score}</div>
          </div>
          <div className="glass-card rounded-2xl px-4 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Best</div>
            <div className="font-display font-bold text-lg">{best}</div>
          </div>
          <Button variant="ghost" onClick={reset} className="glass-card rounded-full gap-2">
            <RotateCcw className="h-4 w-4" /> New
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-3 sm:p-5 max-w-md mx-auto relative">
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {board.flatMap((row, r) =>
            row.map((v, c) => (
              <div
                key={`${r}-${c}`}
                className="aspect-square rounded-2xl flex items-center justify-center font-display font-bold text-xl sm:text-2xl transition-all duration-200"
                style={tileStyle(v)}
              >
                {v !== 0 && <span className="animate-[fade-in_0.2s_ease-out]">{v}</span>}
              </div>
            )),
          )}
        </div>
        {over && (
          <div className="absolute inset-0 rounded-3xl backdrop-blur-md bg-white/40 flex flex-col items-center justify-center gap-3">
            <p className="font-display font-bold text-xl">Lovely run.</p>
            <p className="text-sm text-muted-foreground">Score: {score}</p>
            <Button onClick={reset} className="rounded-full">Play again</Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}