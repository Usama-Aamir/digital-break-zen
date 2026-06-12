import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { GamePageHeader } from "@/components/GamePageHeader";
import { getAudioContext } from "@/lib/audio";
import { useLocalStorage } from "@/hooks/use-local-storage";

export const Route = createFileRoute("/melody")({
  head: () => ({
    meta: [
      { title: "Zen Melody Maker — The Digital Breakroom" },
      { name: "description", content: "Tap a soothing pentatonic grid to compose ambient music." },
    ],
  }),
  component: MelodyPage,
});

const ROWS = 8;
const COLS = 8;
// Pentatonic scale (C major pent) high → low so top row = high note
const NOTES = [880, 783.99, 659.25, 587.33, 523.25, 440, 392, 329.63];
const HUES = [10, 50, 95, 165, 200, 230, 270, 320];
const STORAGE = "breakroom_melody_grid";

function emptyGrid(): boolean[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(false));
}

function MelodyPage() {
  const [grid, setGrid] = useLocalStorage<boolean[][]>(STORAGE, emptyGrid());
  const [playing, setPlaying] = useState(true);
  const [bpm, setBpm] = useState(110);
  const [step, setStep] = useState(0);
  const gridRef = useRef(grid);
  gridRef.current = grid;

  useEffect(() => {
    if (!playing) return;
    const interval = (60 / bpm / 2) * 1000;
    const id = window.setInterval(() => {
      setStep((s) => {
        const next = (s + 1) % COLS;
        playColumn(next);
        return next;
      });
    }, interval);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, bpm]);

  const playColumn = (col: number) => {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    for (let r = 0; r < ROWS; r++) {
      if (!gridRef.current[r][col]) continue;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = NOTES[r];
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.65);
    }
  };

  const toggle = (r: number, c: number) => {
    getAudioContext();
    setGrid((g) => g.map((row, ri) => row.map((v, ci) => (ri === r && ci === c ? !v : v))));
  };

  return (
    <AppShell>
      <GamePageHeader
        title="Zen Melody Maker"
        subtitle="Tap cells. The playhead drifts left→right, gently playing your tune."
        gameKey="melody"
        howToSteps={[
          {
            icon: "🎵",
            text: "Tap cells in the grid — each row plays a soothing pentatonic note.",
          },
          { icon: "▶️", text: "A playhead sweeps left to right, playing whatever you've lit up." },
          { icon: "🎚️", text: "Drag the slider to slow it down or speed the loop up." },
        ]}
        actions={
          <div className="flex items-center gap-2 glass-card rounded-full px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPlaying((p) => !p)}
              className="gap-2"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? "Pause" : "Play"}
            </Button>
            <input
              type="range"
              min={60}
              max={180}
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="accent-[var(--lavender)] w-24"
              aria-label="tempo"
            />
            <span className="text-xs text-muted-foreground w-12 tabular-nums">{bpm} bpm</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGrid(emptyGrid())}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="glass-card rounded-3xl p-4 sm:p-6">
        <div
          className="grid gap-1.5 sm:gap-2"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0,1fr))` }}
        >
          {grid.map((row, r) =>
            row.map((on, c) => {
              const head = c === step;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => toggle(r, c)}
                  className="aspect-square rounded-xl transition-all active:scale-90"
                  style={{
                    background: on
                      ? `radial-gradient(circle at 30% 30%, oklch(0.96 0.06 ${HUES[r]}), oklch(0.78 0.14 ${HUES[r]}))`
                      : head
                        ? `oklch(0.95 0.04 ${HUES[r]} / 0.6)`
                        : `oklch(0.97 0.012 240 / 0.6)`,
                    boxShadow: on
                      ? `0 6px 18px oklch(0.7 0.12 ${HUES[r]} / 0.45), inset 0 1px 3px oklch(1 0 0 / 0.6)`
                      : head
                        ? `inset 0 0 0 2px oklch(0.75 0.1 ${HUES[r]} / 0.7)`
                        : "inset 0 1px 2px oklch(0 0 0 / 0.04)",
                  }}
                  aria-label={`row ${r + 1} col ${c + 1} ${on ? "on" : "off"}`}
                />
              );
            }),
          )}
        </div>
      </div>
    </AppShell>
  );
}
