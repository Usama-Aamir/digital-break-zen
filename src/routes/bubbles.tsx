import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RotateCcw, Volume2, VolumeX } from "lucide-react";
import { HowToPlay } from "@/components/HowToPlay";
import { getItem, setItem } from "@/lib/safe-storage";

export const Route = createFileRoute("/bubbles")({
  head: () => ({
    meta: [
      { title: "Zen Bubble Wrap — The Digital Breakroom" },
      { name: "description", content: "Pop endless soft bubbles for instant relaxation." },
    ],
  }),
  component: BubblesPage,
});

type Bubble = { id: number; popped: boolean; hue: number };
const COUNT = 96;

function makeBubbles(): Bubble[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    id: i,
    popped: false,
    hue: 180 + ((i * 37) % 180),
  }));
}

function BubblesPage() {
  const [bubbles, setBubbles] = useState<Bubble[]>(makeBubbles);
  const [sound, setSound] = useState(true);
  const audioCtx = useRef<AudioContext | null>(null);

  useEffect(() => {
    const s = getItem("breakroom_bubbles_sound");
    if (s) setSound(s === "1");
  }, []);
  useEffect(() => {
    setItem("breakroom_bubbles_sound", sound ? "1" : "0");
  }, [sound]);

  const playPop = () => {
    if (!sound) return;
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtx.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(420 + Math.random() * 240, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.15);
      g.gain.setValueAtTime(0.18, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.2);
    } catch (err) {
      console.warn("[Bubbles] Audio playback failed:", err);
    }
  };

  const pop = (id: number) => {
    setBubbles((bs) => bs.map((b) => (b.id === id && !b.popped ? { ...b, popped: true } : b)));
    playPop();
  };

  const remaining = useMemo(() => bubbles.filter((b) => !b.popped).length, [bubbles]);

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-display font-bold">Zen Bubble Wrap</h1>
            <HowToPlay
              gameKey="bubbles"
              title="Zen Bubble Wrap"
              steps={[
                { icon: "👆", text: "Tap or click a bubble to pop it with a soft sound." },
                { icon: "🔊", text: "Toggle sound off if you'd rather pop in silence." },
                { icon: "♻️", text: "Hit Reset Wrap any time for a fresh sheet of bubbles." },
              ]}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {remaining} bubbles left · pop away
          </p>
        </div>
        <div className="flex items-center gap-3 glass-card rounded-full px-4 py-2">
          <span className="flex items-center gap-2 text-sm text-foreground/80">
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            Sound
          </span>
          <Switch checked={sound} onCheckedChange={setSound} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBubbles(makeBubbles())}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" /> Reset Wrap
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-4 sm:p-6">
        <div
          className="grid gap-2 sm:gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))" }}
        >
          {bubbles.map((b) => (
            <BubbleDot key={b.id} bubble={b} onPop={() => pop(b.id)} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function BubbleDot({ bubble, onPop }: { bubble: Bubble; onPop: () => void }) {
  const [rippling, setRippling] = useState(false);
  const handle = () => {
    if (bubble.popped) return;
    setRippling(true);
    onPop();
  };
  return (
    <button
      onClick={handle}
      onMouseEnter={() => {
        /* hover hint only */
      }}
      disabled={bubble.popped}
      className="relative aspect-square rounded-full transition-transform active:scale-90 disabled:cursor-default"
      style={{
        background: bubble.popped
          ? `oklch(0.96 0.01 ${bubble.hue} / 0.4)`
          : `radial-gradient(circle at 30% 30%, oklch(0.99 0.04 ${bubble.hue}) 0%, oklch(0.85 0.08 ${bubble.hue}) 70%, oklch(0.75 0.1 ${bubble.hue}) 100%)`,
        boxShadow: bubble.popped
          ? "inset 0 2px 6px oklch(0 0 0 / 0.08)"
          : "inset -2px -3px 6px oklch(0 0 0 / 0.08), inset 2px 3px 8px oklch(1 0 0 / 0.6), 0 4px 12px oklch(0.7 0.1 280 / 0.15)",
      }}
      aria-label={bubble.popped ? "popped bubble" : "pop bubble"}
    >
      {rippling && !bubble.popped && (
        <span
          className="absolute inset-0 rounded-full animate-ripple"
          style={{ background: `oklch(0.9 0.1 ${bubble.hue})` }}
        />
      )}
    </button>
  );
}