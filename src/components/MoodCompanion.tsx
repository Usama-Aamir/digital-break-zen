import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useMood, type Mood } from "@/lib/mood";
import { getItem, setItem } from "@/lib/safe-storage";

const MUTE_KEY = "breakroom_companion_muted_v1";
const COUNT_KEY = "breakroom_frustration_vented_v1";

type MoodConfig = {
  header: string;
  cta: string;
  bg: string;
  idleAnim: string;
  clickAnim: string;
  clickDurationMs: number;
  bodyColor: string;
  bodyStroke: string;
  accessory: "none" | "headphones" | "zzz" | "sparkle" | "sweat";
  mouth: "worried" | "sleepy" | "flat" | "smile" | "open";
};

const CONFIG: Record<Mood, MoodConfig> = {
  frustrated: {
    header: "Tap the blob to vent.",
    cta: "Squish me",
    bg: "linear-gradient(160deg, oklch(0.94 0.04 220) 0%, oklch(0.93 0.06 170) 100%)",
    idleAnim: "companion-tense 1.4s ease-in-out infinite",
    clickAnim: "companion-squish 360ms cubic-bezier(.34,1.56,.64,1)",
    clickDurationMs: 360,
    bodyColor: "oklch(0.86 0.1 195)",
    bodyStroke: "oklch(0.55 0.07 220)",
    accessory: "sweat",
    mouth: "worried",
  },
  tired: {
    header: "Tap for a gentle yawn.",
    cta: "Wake me softly",
    bg: "linear-gradient(180deg, oklch(0.86 0.05 290) 0%, oklch(0.9 0.07 30) 100%)",
    idleAnim: "companion-sleep 4.5s ease-in-out infinite",
    clickAnim: "companion-yawn 1000ms ease-in-out",
    clickDurationMs: 1000,
    bodyColor: "oklch(0.84 0.08 295)",
    bodyStroke: "oklch(0.5 0.06 290)",
    accessory: "zzz",
    mouth: "sleepy",
  },
  demotivated: {
    header: "Tap for a little hype.",
    cta: "Hype me up",
    bg: "linear-gradient(180deg, oklch(0.95 0.07 70) 0%, oklch(0.93 0.08 35) 100%)",
    idleAnim: "companion-slump 3.2s ease-in-out infinite",
    clickAnim: "companion-jump 700ms cubic-bezier(.34,1.56,.64,1)",
    clickDurationMs: 700,
    bodyColor: "oklch(0.9 0.1 70)",
    bodyStroke: "oklch(0.55 0.1 50)",
    accessory: "sparkle",
    mouth: "flat",
  },
  happy: {
    header: "Tap for happy bubbles.",
    cta: "Bounce me",
    bg: "linear-gradient(135deg, oklch(0.92 0.08 200) 0%, oklch(0.9 0.09 320) 100%)",
    idleAnim: "companion-float 3s ease-in-out infinite",
    clickAnim: "companion-bounce 600ms cubic-bezier(.34,1.56,.64,1)",
    clickDurationMs: 600,
    bodyColor: "oklch(0.9 0.1 200)",
    bodyStroke: "oklch(0.55 0.1 220)",
    accessory: "sparkle",
    mouth: "smile",
  },
  fun: {
    header: "Tap for a dance break.",
    cta: "Drop the beat",
    bg: "linear-gradient(135deg, oklch(0.9 0.1 340) 0%, oklch(0.92 0.09 50) 50%, oklch(0.9 0.1 180) 100%)",
    idleAnim: "companion-bobble 0.8s ease-in-out infinite",
    clickAnim: "companion-dance 3000ms ease-in-out",
    clickDurationMs: 3000,
    bodyColor: "oklch(0.88 0.13 340)",
    bodyStroke: "oklch(0.55 0.13 340)",
    accessory: "headphones",
    mouth: "open",
  },
};

type Particle = { id: number; x: number; y: number; color: string; dx: number; dy: number; text?: string };

const CONFETTI_COLORS = [
  "oklch(0.85 0.15 25)",
  "oklch(0.85 0.15 90)",
  "oklch(0.85 0.15 160)",
  "oklch(0.85 0.15 230)",
  "oklch(0.85 0.15 320)",
];

const POP_WORDS = ["BOING!", "OOF!", "SQUISH!", "BONK!"];

export function MoodCompanion() {
  const { mood } = useMood();
  const effectiveMood: Mood = mood ?? "happy";
  const cfg = CONFIG[effectiveMood];

  const [muted, setMuted] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ventCount, setVentCount] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const particleIdRef = useRef(0);
  const clickTimer = useRef<number | null>(null);

  useEffect(() => {
    setMuted(getItem(MUTE_KEY) === "1");
    const c = Number(getItem(COUNT_KEY) || "0");
    if (!Number.isNaN(c)) setVentCount(c);
    return () => {
      if (clickTimer.current) window.clearTimeout(clickTimer.current);
    };
  }, []);

  // Reset transient state when mood changes
  useEffect(() => {
    setClicking(false);
    setParticles([]);
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
  }, [effectiveMood]);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      setItem(MUTE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const getCtx = () => {
    if (muted) return null;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (err) {
      console.warn("[MoodCompanion] AudioContext init failed:", err);
      return null;
    }
  };

  const playSound = (m: Mood) => {
    const ctx = getCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime;

    if (m === "frustrated") {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(820, t0);
      osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.18);
      osc.frequency.exponentialRampToValueAtTime(260, t0 + 0.32);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.42);
    } else if (m === "tired") {
      // soft chime: two gentle sine tones
      [523.25, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = t0 + i * 0.18;
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(0.18, start + 0.15);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);
        osc.connect(g).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 1.3);
      });
    } else if (m === "demotivated") {
      // bright ascending arpeggio
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        const start = t0 + i * 0.08;
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
        osc.connect(g).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.32);
      });
    } else if (m === "happy") {
      // bubbly giggles: quick pitch wobbles
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        const start = t0 + i * 0.09;
        osc.frequency.setValueAtTime(700 + Math.random() * 400, start);
        osc.frequency.exponentialRampToValueAtTime(900 + Math.random() * 400, start + 0.08);
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
        osc.connect(g).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.14);
      }
    } else if (m === "fun") {
      // 2s upbeat arcade riff
      const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.51, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        const start = t0 + i * 0.18;
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(0.12, start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
        osc.connect(g).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      });
    }
  };

  const spawnParticles = (m: Mood, cx: number, cy: number) => {
    const next: Particle[] = [];
    if (m === "frustrated") {
      next.push({
        id: ++particleIdRef.current,
        x: cx,
        y: cy,
        color: "",
        dx: 0,
        dy: -80,
        text: POP_WORDS[Math.floor(Math.random() * POP_WORDS.length)],
      });
    } else if (m === "demotivated") {
      for (let i = 0; i < 18; i++) {
        const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
        const dist = 80 + Math.random() * 60;
        next.push({
          id: ++particleIdRef.current,
          x: cx,
          y: cy,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist - 30,
        });
      }
    } else if (m === "happy") {
      for (let i = 0; i < 8; i++) {
        next.push({
          id: ++particleIdRef.current,
          x: cx + (Math.random() - 0.5) * 60,
          y: cy + (Math.random() - 0.5) * 30,
          color: "oklch(0.9 0.1 200)",
          dx: (Math.random() - 0.5) * 60,
          dy: -60 - Math.random() * 40,
        });
      }
    } else if (m === "fun") {
      for (let i = 0; i < 12; i++) {
        next.push({
          id: ++particleIdRef.current,
          x: cx,
          y: cy,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          dx: (Math.random() - 0.5) * 200,
          dy: -50 - Math.random() * 100,
        });
      }
    } else if (m === "tired") {
      for (let i = 0; i < 3; i++) {
        next.push({
          id: ++particleIdRef.current,
          x: cx + (i - 1) * 14,
          y: cy - 20,
          color: "oklch(0.7 0.05 290)",
          dx: 0,
          dy: -50,
          text: "z",
        });
      }
    }
    if (next.length === 0) return;
    setParticles((p) => [...p, ...next]);
    const ids = next.map((n) => n.id);
    window.setTimeout(() => {
      setParticles((p) => p.filter((q) => !ids.includes(q.id)));
    }, 1400);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setClicking(true);
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => setClicking(false), cfg.clickDurationMs);

    spawnParticles(effectiveMood, x, y);
    playSound(effectiveMood);

    if (effectiveMood === "frustrated") {
      setVentCount((c) => {
        const next = c + 1;
        setItem(COUNT_KEY, String(next));
        return next;
      });
    }
  };

  return (
    <div
      className="relative glass-card rounded-3xl p-6 overflow-hidden transition-[background] duration-700"
      style={{ backgroundImage: cfg.bg }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display font-bold text-lg text-foreground">Mood Companion</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{cfg.header}</p>
        </div>
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          title={muted ? "Unmute" : "Mute"}
          className="shrink-0 rounded-full bg-white/80 hover:bg-white p-2 shadow-[var(--shadow-soft)] transition-all border border-white/70"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      <button
        onClick={handleClick}
        aria-label={cfg.cta}
        className="relative w-full h-72 sm:h-80 rounded-2xl bg-white/30 flex items-center justify-center overflow-hidden select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        <span
          className="absolute bottom-8 h-3 w-40 rounded-full bg-foreground/10 blur-md"
          style={{
            transform: clicking && effectiveMood === "frustrated" ? "scaleX(1.25)" : "scaleX(1)",
            transition: "transform 280ms cubic-bezier(.34,1.56,.64,1)",
          }}
        />
        <div
          key={effectiveMood + (clicking ? "-c" : "-i")}
          className="relative"
          style={{
            animation: clicking ? cfg.clickAnim : cfg.idleAnim,
            transformOrigin: "50% 100%",
          }}
        >
          <CompanionSvg cfg={cfg} />
        </div>

        {particles.map((p) => (
          <span
            key={p.id}
            className="pointer-events-none absolute"
            style={
              p.text
                ? {
                    left: p.x,
                    top: p.y,
                    transform: "translate(-50%, -50%)",
                    animation: "companion-pop-text 900ms ease-out forwards",
                    fontFamily: "var(--font-display, inherit)",
                    fontWeight: 800,
                    fontSize: p.text === "z" ? "1.2rem" : "1.4rem",
                    color: "oklch(0.3 0.05 240)",
                    textShadow: "0 2px 0 white",
                  }
                : {
                    left: p.x,
                    top: p.y,
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: p.color,
                    transform: "translate(-50%, -50%)",
                    animation: "companion-particle 1100ms ease-out forwards",
                    // @ts-expect-error css var
                    "--dx": `${p.dx}px`,
                    "--dy": `${p.dy}px`,
                  }
            }
          >
            {p.text}
          </span>
        ))}
      </button>

      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground">{cfg.cta} — tap as many times as you like.</span>
        {effectiveMood === "frustrated" && (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-foreground shadow-[var(--shadow-soft)] border border-white/70">
            Frustration Vented
            <span className="tabular-nums font-bold">{ventCount}</span>
          </span>
        )}
      </div>

      <style>{`
        @keyframes companion-tense {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-2px) rotate(1deg); }
        }
        @keyframes companion-squish {
          0% { transform: scale(1,1); }
          40% { transform: scale(1.2, 0.75) translateY(10px); }
          100% { transform: scale(1,1); }
        }
        @keyframes companion-sleep {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes companion-yawn {
          0% { transform: scale(1); }
          50% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes companion-slump {
          0%, 100% { transform: translateY(4px) rotate(-3deg); }
          50% { transform: translateY(6px) rotate(-1deg); }
        }
        @keyframes companion-jump {
          0% { transform: translateY(0); }
          40% { transform: translateY(-60px) scale(1.05, 0.95); }
          70% { transform: translateY(0) scale(1.1, 0.85); }
          100% { transform: translateY(0) scale(1,1); }
        }
        @keyframes companion-float {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes companion-bounce {
          0% { transform: translateY(0) rotate(0); }
          30% { transform: translateY(-30px) rotate(-8deg) scale(1.05); }
          60% { transform: translateY(0) rotate(8deg) scale(0.97); }
          100% { transform: translateY(0) rotate(0) scale(1); }
        }
        @keyframes companion-bobble {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-4px) rotate(3deg); }
        }
        @keyframes companion-dance {
          0% { transform: rotate(0) translateY(0); }
          15% { transform: rotate(-15deg) translateY(-10px); }
          30% { transform: rotate(15deg) translateY(0); }
          50% { transform: rotate(360deg) translateY(-8px); }
          70% { transform: rotate(360deg) translateY(0) scale(1.08); }
          85% { transform: rotate(720deg) translateY(-6px); }
          100% { transform: rotate(720deg) translateY(0); }
        }
        @keyframes companion-pop-text {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
          30% { opacity: 1; transform: translate(-50%, -110%) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -180%) scale(1); }
        }
        @keyframes companion-particle {
          0% { opacity: 1; transform: translate(-50%, -50%) translate(0,0) rotate(0); }
          100% { opacity: 0; transform: translate(-50%, -50%) translate(var(--dx), var(--dy)) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function CompanionSvg({ cfg }: { cfg: MoodConfig }) {
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" fill="none" aria-hidden>
      <defs>
        <linearGradient id="cgBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cfg.bodyColor} />
          <stop offset="100%" stopColor="oklch(0.78 0.1 220)" />
        </linearGradient>
      </defs>
      <path
        d="M90 20 C140 20 162 62 158 102 C154 140 128 160 90 160 C52 160 26 140 22 102 C18 62 40 20 90 20 Z"
        fill="url(#cgBody)"
        stroke={cfg.bodyStroke}
        strokeWidth="2"
      />
      {/* eyes */}
      {cfg.mouth === "sleepy" ? (
        <>
          <path d="M60 90 q8 -6 16 0" stroke="oklch(0.2 0.04 240)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M104 90 q8 -6 16 0" stroke="oklch(0.2 0.04 240)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <ellipse cx="68" cy="88" rx="6" ry="8" fill="oklch(0.2 0.04 240)" />
          <ellipse cx="112" cy="88" rx="6" ry="8" fill="oklch(0.2 0.04 240)" />
          <circle cx="70" cy="85" r="2" fill="white" />
          <circle cx="114" cy="85" r="2" fill="white" />
        </>
      )}
      {/* cheeks */}
      <ellipse cx="50" cy="112" rx="12" ry="7" fill="oklch(0.85 0.13 25 / 0.45)" />
      <ellipse cx="130" cy="112" rx="12" ry="7" fill="oklch(0.85 0.13 25 / 0.45)" />
      {/* mouth */}
      {cfg.mouth === "worried" && (
        <path d="M76 122 Q90 114 104 122" stroke="oklch(0.3 0.05 240)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      )}
      {cfg.mouth === "sleepy" && (
        <ellipse cx="90" cy="124" rx="6" ry="4" fill="oklch(0.3 0.05 240)" />
      )}
      {cfg.mouth === "flat" && (
        <path d="M78 124 L102 124" stroke="oklch(0.3 0.05 240)" strokeWidth="2.5" strokeLinecap="round" />
      )}
      {cfg.mouth === "smile" && (
        <path d="M74 118 Q90 134 106 118" stroke="oklch(0.3 0.05 240)" strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
      {cfg.mouth === "open" && (
        <>
          <path d="M74 116 Q90 138 106 116 Z" fill="oklch(0.3 0.05 240)" />
          <path d="M82 128 Q90 134 98 128" stroke="oklch(0.85 0.13 25)" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* accessories */}
      {cfg.accessory === "headphones" && (
        <g>
          <path d="M30 78 Q90 8 150 78" stroke={cfg.bodyStroke} strokeWidth="5" fill="none" strokeLinecap="round" />
          <rect x="22" y="74" width="18" height="26" rx="6" fill="oklch(0.4 0.1 320)" />
          <rect x="140" y="74" width="18" height="26" rx="6" fill="oklch(0.4 0.1 320)" />
        </g>
      )}
      {cfg.accessory === "zzz" && (
        <g fill="oklch(0.5 0.06 290)" fontFamily="serif" fontWeight="bold">
          <text x="138" y="48" fontSize="18">z</text>
          <text x="150" y="36" fontSize="14">z</text>
        </g>
      )}
      {cfg.accessory === "sparkle" && (
        <g fill="white">
          <path d="M30 40 l3 6 l6 3 l-6 3 l-3 6 l-3 -6 l-6 -3 l6 -3 z" opacity="0.9" />
          <path d="M150 50 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2 z" opacity="0.8" />
        </g>
      )}
      {cfg.accessory === "sweat" && (
        <path d="M138 70 q-4 8 0 14 q4 -6 0 -14 z" fill="oklch(0.7 0.12 230)" />
      )}
    </svg>
  );
}