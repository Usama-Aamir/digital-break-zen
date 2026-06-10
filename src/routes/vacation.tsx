import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Waves, CloudRain, Trees } from "lucide-react";
import { HowToPlay } from "@/components/HowToPlay";

export const Route = createFileRoute("/vacation")({
  head: () => ({
    meta: [
      { title: "Desk Vacation — The Digital Breakroom" },
      { name: "description", content: "A virtual window with calming scenery and gentle ambient sound." },
    ],
  }),
  component: VacationPage,
});

type Scene = "beach" | "mountain" | "forest";
type Sound = "waves" | "rain" | "forest";

const SCENES: Record<Scene, { label: string; sky: string; mid: string; ground: string; sound: Sound }> = {
  beach: {
    label: "Sunset Beach",
    sky: "linear-gradient(180deg, oklch(0.88 0.07 50) 0%, oklch(0.85 0.09 25) 60%, oklch(0.78 0.1 340) 100%)",
    mid: "radial-gradient(ellipse at 50% 65%, oklch(0.92 0.1 70 / 0.9), transparent 60%)",
    ground: "linear-gradient(180deg, oklch(0.7 0.06 230) 0%, oklch(0.55 0.08 240) 100%)",
    sound: "waves",
  },
  mountain: {
    label: "Alpine Dawn",
    sky: "linear-gradient(180deg, oklch(0.86 0.06 250) 0%, oklch(0.9 0.05 280) 50%, oklch(0.92 0.07 320) 100%)",
    mid: "radial-gradient(ellipse at 50% 80%, oklch(0.95 0.04 280 / 0.6), transparent 70%)",
    ground: "linear-gradient(180deg, oklch(0.7 0.05 260) 0%, oklch(0.5 0.04 270) 100%)",
    sound: "rain",
  },
  forest: {
    label: "Mossy Forest",
    sky: "linear-gradient(180deg, oklch(0.88 0.06 160) 0%, oklch(0.85 0.08 150) 60%, oklch(0.7 0.08 145) 100%)",
    mid: "radial-gradient(ellipse at 50% 70%, oklch(0.9 0.08 130 / 0.55), transparent 65%)",
    ground: "linear-gradient(180deg, oklch(0.55 0.07 150) 0%, oklch(0.35 0.06 155) 100%)",
    sound: "forest",
  },
};

function VacationPage() {
  const [scene, setScene] = useState<Scene>("beach");
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    return () => stopSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopSound = () => {
    nodesRef.current?.stop();
    nodesRef.current = null;
  };

  const startSound = (sound: Sound) => {
    stopSound();
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = ctxRef.current;

    // White noise buffer
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (sound === "waves") {
      filter.type = "lowpass";
      filter.frequency.value = 600;
      gain.gain.value = 0.18;
      // slow LFO for wave swell
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.15;
      lfoGain.gain.value = 0.12;
      lfo.connect(lfoGain).connect(gain.gain);
      lfo.start();
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start();
      nodesRef.current = {
        stop: () => { try { src.stop(); lfo.stop(); } catch { /* noop */ } },
      };
    } else if (sound === "rain") {
      filter.type = "highpass";
      filter.frequency.value = 1000;
      gain.gain.value = 0.12;
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start();
      nodesRef.current = { stop: () => { try { src.stop(); } catch { /* noop */ } } };
    } else {
      filter.type = "bandpass";
      filter.frequency.value = 800;
      filter.Q.value = 0.6;
      gain.gain.value = 0.08;
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start();
      nodesRef.current = { stop: () => { try { src.stop(); } catch { /* noop */ } } };
    }
  };

  const toggleAudio = () => {
    if (playing) {
      stopSound();
      setPlaying(false);
    } else {
      startSound(SCENES[scene].sound);
      setPlaying(true);
    }
  };

  const switchScene = (s: Scene) => {
    setScene(s);
    if (playing) startSound(SCENES[s].sound);
  };

  const cfg = SCENES[scene];
  const ICON = { waves: Waves, rain: CloudRain, forest: Trees }[cfg.sound];

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-display font-bold">Desk Vacation</h1>
            <HowToPlay
              gameKey="vacation"
              title="Desk Vacation"
              steps={[
                { icon: "🏝️", text: "Pick a scene — Sunset Beach, Alpine Dawn, or Mossy Forest." },
                { icon: "🔊", text: "Tap the speaker to play matching ambient sounds." },
                { icon: "👀", text: "Lean back, look out the window, breathe for a minute." },
              ]}
              cta="Take me there"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Look out the window for a minute. {cfg.label}.
          </p>
        </div>
        <div className="flex items-center gap-2 glass-card rounded-full px-3 py-2">
          {(Object.keys(SCENES) as Scene[]).map((s) => (
            <button
              key={s}
              onClick={() => switchScene(s)}
              className={`text-xs sm:text-sm rounded-full px-3 py-1.5 font-medium transition-all ${
                scene === s
                  ? "bg-[image:var(--gradient-mint)] text-foreground shadow-[var(--shadow-soft)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/40"
              }`}
            >
              {SCENES[s].label}
            </button>
          ))}
          <Button variant="ghost" size="sm" onClick={toggleAudio} className="gap-2">
            {playing ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <ICON className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className="relative rounded-3xl overflow-hidden h-[70vh] glass-card"
        style={{ background: cfg.sky }}
      >
        {/* Sun / moon */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[28%] h-32 w-32 rounded-full animate-float-soft"
          style={{
            background:
              scene === "beach"
                ? "radial-gradient(circle, oklch(0.96 0.12 75), oklch(0.85 0.15 50))"
                : scene === "mountain"
                ? "radial-gradient(circle, oklch(0.97 0.02 280), oklch(0.88 0.04 280))"
                : "radial-gradient(circle, oklch(0.95 0.08 140), oklch(0.85 0.1 130))",
            boxShadow: "0 0 80px oklch(1 0.1 80 / 0.5)",
          }}
        />
        {/* Mid haze */}
        <div className="absolute inset-0" style={{ background: cfg.mid }} />
        {/* Drifting clouds */}
        <Cloud className="absolute top-[12%]" style={{ left: "-20%", animation: "drift 60s linear infinite" }} />
        <Cloud className="absolute top-[20%]" style={{ left: "-30%", animation: "drift 90s linear infinite", animationDelay: "-30s", transform: "scale(0.7)" }} />
        <Cloud className="absolute top-[8%]" style={{ left: "-25%", animation: "drift 75s linear infinite", animationDelay: "-50s", transform: "scale(1.2)" }} />
        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3" style={{ background: cfg.ground }}>
          {scene === "beach" && (
            <div
              className="absolute inset-x-0 top-0 h-2/3 opacity-60"
              style={{
                background:
                  "repeating-linear-gradient(180deg, transparent 0 8px, oklch(1 0 0 / 0.15) 8px 10px)",
                animation: "shimmer 6s ease-in-out infinite",
              }}
            />
          )}
        </div>
        {/* Window frame */}
        <div className="absolute inset-0 pointer-events-none rounded-3xl border-[12px] border-white/40" style={{ boxShadow: "inset 0 0 80px oklch(0 0 0 / 0.12)" }} />
        <div className="absolute inset-y-0 left-1/2 w-2 -translate-x-1/2 bg-white/40 pointer-events-none" />
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 bg-white/40 pointer-events-none" />
      </div>

      <style>{`
        @keyframes drift { from { transform: translateX(0); } to { transform: translateX(160vw); } }
        @keyframes shimmer { 0%,100% { opacity: 0.4; } 50% { opacity: 0.7; } }
      `}</style>
    </AppShell>
  );
}

function Cloud({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={style}>
      <div className="relative h-12 w-32">
        <div className="absolute inset-0 rounded-full bg-white/60 blur-sm" />
        <div className="absolute left-6 -top-3 h-10 w-16 rounded-full bg-white/70 blur-sm" />
        <div className="absolute right-2 -top-2 h-8 w-14 rounded-full bg-white/60 blur-sm" />
      </div>
    </div>
  );
}