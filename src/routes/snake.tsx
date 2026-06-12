import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { GamePageHeader } from "@/components/GamePageHeader";

export const Route = createFileRoute("/snake")({
  head: () => ({
    meta: [
      { title: "ZenSnake — The Digital Breakroom" },
      { name: "description", content: "A calming, soft-glow take on the classic Snake game." },
    ],
  }),
  component: SnakePage,
});

const COLS = 24;
const ROWS = 18;
const CELL = 24;
const W = COLS * CELL;
const H = ROWS * CELL;

type Dir = { x: number; y: number };
type Pt = { x: number; y: number };

const DIRS: Record<string, Dir> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

function randFood(snake: Pt[]): Pt {
  while (true) {
    const p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    if (!snake.some((s) => s.x === p.x && s.y === p.y)) return p;
  }
}

function SnakePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const [chill, setChill] = useState(true);

  const snakeRef = useRef<Pt[]>([]);
  const dirRef = useRef<Dir>({ x: 1, y: 0 });
  const nextDirRef = useRef<Dir>({ x: 1, y: 0 });
  const foodRef = useRef<Pt>({ x: 10, y: 9 });
  const lastTickRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const pulseRef = useRef(0);

  const speed = chill ? 180 : 90; // ms per tick

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    // background
    ctx.fillStyle = "#1d355e";
    ctx.fillRect(0, 0, W, H);
    // subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 1; i < COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, H);
      ctx.stroke();
    }
    for (let j = 1; j < ROWS; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * CELL);
      ctx.lineTo(W, j * CELL);
      ctx.stroke();
    }

    // food — glowing orb
    const f = foodRef.current;
    pulseRef.current += 0.06;
    const pulse = 0.5 + 0.5 * Math.sin(pulseRef.current);
    const fx = f.x * CELL + CELL / 2;
    const fy = f.y * CELL + CELL / 2;
    const glow = ctx.createRadialGradient(fx, fy, 2, fx, fy, CELL * 1.4);
    glow.addColorStop(0, `rgba(253, 224, 187, ${0.85})`);
    glow.addColorStop(0.4, `rgba(244, 174, 207, ${0.45 + pulse * 0.2})`);
    glow.addColorStop(1, "rgba(244, 174, 207, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(fx, fy, CELL * 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff6e6";
    ctx.beginPath();
    ctx.arc(fx, fy, CELL * 0.32, 0, Math.PI * 2);
    ctx.fill();

    // snake as rounded gradient line
    const snake = snakeRef.current;
    if (snake.length === 0) return;
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#a7f3d0");
    grad.addColorStop(0.5, "#bae6fd");
    grad.addColorStop(1, "#c7d2fe");
    ctx.strokeStyle = grad;
    ctx.lineWidth = CELL * 0.72;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(186, 230, 253, 0.55)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    snake.forEach((s, i) => {
      const x = s.x * CELL + CELL / 2;
      const y = s.y * CELL + CELL / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // head dot
    const head = snake[snake.length - 1];
    ctx.fillStyle = "#ecfeff";
    ctx.beginPath();
    ctx.arc(head.x * CELL + CELL / 2, head.y * CELL + CELL / 2, CELL * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const tick = useCallback(() => {
    dirRef.current = nextDirRef.current;
    const snake = snakeRef.current;
    const head = snake[snake.length - 1];
    const nx = head.x + dirRef.current.x;
    const ny = head.y + dirRef.current.y;

    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
      setRunning(false);
      setOver(true);
      return;
    }
    if (snake.some((s) => s.x === nx && s.y === ny)) {
      setRunning(false);
      setOver(true);
      return;
    }

    const newHead = { x: nx, y: ny };
    const ate = nx === foodRef.current.x && ny === foodRef.current.y;
    const next = [...snake, newHead];
    if (!ate) next.shift();
    snakeRef.current = next;
    if (ate) {
      foodRef.current = randFood(next);
      setScore((s) => s + 1);
    }
  }, []);

  // loop
  useEffect(() => {
    if (!running) {
      draw();
      return;
    }
    const loop = (t: number) => {
      if (!lastTickRef.current) lastTickRef.current = t;
      if (t - lastTickRef.current >= speed) {
        lastTickRef.current = t;
        tick();
      }
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = 0;
    };
  }, [running, speed, draw, tick]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const d = DIRS[key];
      if (!d) return;
      e.preventDefault();
      const cur = dirRef.current;
      // prevent reversing into self
      if (d.x === -cur.x && d.y === -cur.y) return;
      nextDirRef.current = d;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  const start = () => {
    snakeRef.current = [
      { x: 6, y: 9 },
      { x: 7, y: 9 },
      { x: 8, y: 9 },
      { x: 9, y: 9 },
    ];
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = { x: 1, y: 0 };
    foodRef.current = randFood(snakeRef.current);
    setScore(0);
    setOver(false);
    setRunning(true);
    setTimeout(() => wrapRef.current?.focus(), 0);
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <GamePageHeader
          title="ZenSnake"
          subtitle="Soft glow. Slow breaths. No game-over panic."
          gameKey="snake"
          howToSteps={[
            { icon: "⌨️", text: "Use Arrow keys or WASD to steer the glowing snake." },
            { icon: "🍑", text: "Eat the pastel orb to grow longer and gain a point." },
            { icon: "🌿", text: "Avoid the walls and your own tail. Start in Chill Speed." },
          ]}
        />

        <div className="glass-card rounded-3xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-sm font-semibold text-foreground/80">
              Score <span className="ml-2 text-lg font-display font-bold">{score}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/70">
              <span>Chill</span>
              <Switch checked={!chill} onCheckedChange={(v) => setChill(!v)} disabled={running} />
              <span>Classic</span>
            </div>
          </div>

          <div
            ref={wrapRef}
            tabIndex={0}
            className="relative rounded-2xl overflow-hidden outline-none mx-auto"
            style={{ width: W, maxWidth: "100%" }}
          >
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              className="block w-full h-auto rounded-2xl"
              style={{ background: "#1d355e" }}
            />

            {!running && !over && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1d355e]/70 backdrop-blur-sm">
                <Button
                  onClick={start}
                  className="rounded-full text-base px-8 py-6 bg-[image:var(--gradient-mint)] text-foreground hover:opacity-95 shadow-[var(--shadow-glow)]"
                >
                  Start Game
                </Button>
              </div>
            )}

            {over && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#1d355e]/80 backdrop-blur-sm text-white">
                <div className="text-center">
                  <div className="font-display text-2xl font-bold">Game Over</div>
                  <div className="text-sm text-white/70 mt-1">Final score: {score}</div>
                </div>
                <Button
                  onClick={start}
                  className="rounded-full px-6 py-5 bg-[image:var(--gradient-mint)] text-foreground hover:opacity-95 shadow-[var(--shadow-glow)]"
                >
                  Deep breath, try again
                </Button>
              </div>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground mt-3">
            Steer with Arrow keys or WASD.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
