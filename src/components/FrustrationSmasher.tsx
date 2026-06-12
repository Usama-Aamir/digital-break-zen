import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getItem, setItem } from "@/lib/safe-storage";

const SOUND_KEY = "breakroom_smasher_muted_v1";
const POPS = ["BOING!", "OOF!", "SQUISH!", "BONK!", "PLOP!", "WOBBLE!", "SPROING!"];

type Pop = { id: number; x: number; y: number; text: string; rot: number };

export function FrustrationSmasher({ full = false }: { full?: boolean }) {
  const [count, setCount] = useState(0);
  const [muted, setMuted] = useState(false);
  const [squishing, setSquishing] = useState(false);
  const [pops, setPops] = useState<Pop[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const popIdRef = useRef(0);
  const squishTimer = useRef<number | null>(null);

  useEffect(() => {
    setMuted(getItem(SOUND_KEY) === "1");
    return () => {
      if (squishTimer.current) window.clearTimeout(squishTimer.current);
    };
  }, []);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      setItem(SOUND_KEY, next ? "1" : "0");
      return next;
    });
  };

  const playBoing = () => {
    if (muted) return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      // cartoon boing: pitch falls fast then wobbles
      osc.frequency.setValueAtTime(820, t0);
      osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.18);
      osc.frequency.exponentialRampToValueAtTime(260, t0 + 0.32);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.42);
    } catch (err) {
      console.warn("[FrustrationSmasher] Audio playback failed:", err);
    }
  };

  const handleSmash = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = ++popIdRef.current;
    const pop: Pop = {
      id,
      x,
      y,
      text: POPS[Math.floor(Math.random() * POPS.length)],
      rot: Math.random() * 30 - 15,
    };
    setPops((p) => [...p, pop]);
    window.setTimeout(() => {
      setPops((p) => p.filter((q) => q.id !== id));
    }, 800);

    setSquishing(true);
    if (squishTimer.current) window.clearTimeout(squishTimer.current);
    squishTimer.current = window.setTimeout(() => setSquishing(false), 280);

    setCount((c) => c + 1);
    playBoing();
  };

  return (
    <div
      className="relative glass-card rounded-3xl p-6 overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(160deg, oklch(0.94 0.04 220) 0%, oklch(0.93 0.06 170) 100%)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display font-bold text-lg text-foreground">
            Frustration Smasher
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Need a quick reset? Give the frustration blob a squish.
          </p>
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
        onClick={handleSmash}
        aria-label="Squish the blob"
        className={`relative w-full ${full ? "h-[420px]" : "h-64"} rounded-2xl bg-white/30 flex items-center justify-center overflow-hidden select-none active:cursor-pointer cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/80`}
      >
        {/* ground shadow */}
        <span
          className="absolute bottom-6 h-3 w-40 rounded-full bg-foreground/10 blur-md"
          style={{
            transform: squishing ? "scaleX(1.25)" : "scaleX(1)",
            transition: "transform 280ms cubic-bezier(.34,1.56,.64,1)",
          }}
        />
        <div
          className="relative"
          style={{
            transform: squishing
              ? "scale(1.15, 0.78) translateY(8px)"
              : "scale(1, 1)",
            transition: "transform 280ms cubic-bezier(.34,1.56,.64,1)",
            animation: squishing ? undefined : "blob-sway 4s ease-in-out infinite",
            transformOrigin: "50% 100%",
          }}
        >
          <BlobSvg />
        </div>

        {pops.map((p) => (
          <span
            key={p.id}
            className="pointer-events-none absolute font-display font-extrabold text-xl sm:text-2xl text-foreground"
            style={{
              left: p.x,
              top: p.y,
              transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
              animation: "pop-bubble 800ms ease-out forwards",
              textShadow: "0 2px 0 white, 0 4px 12px oklch(0 0 0 / 0.15)",
            }}
          >
            {p.text}
          </span>
        ))}
      </button>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Tap the blob. Repeat as needed.</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-foreground shadow-[var(--shadow-soft)] border border-white/70">
          Frustration Vented
          <span className="tabular-nums font-bold text-foreground">{count}</span>
        </span>
      </div>

      <style>{`
        @keyframes blob-sway {
          0%, 100% { transform: translateY(0) rotate(-1.5deg); }
          50% { transform: translateY(-4px) rotate(1.5deg); }
        }
        @keyframes pop-bubble {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4) rotate(var(--r, 0deg)); }
          30% { opacity: 1; transform: translate(-50%, -90%) scale(1.15); }
          100% { opacity: 0; transform: translate(-50%, -160%) scale(1); }
        }
      `}</style>
    </div>
  );
}

function BlobSvg() {
  return (
    <svg width="180" height="170" viewBox="0 0 180 170" fill="none" aria-hidden>
      <defs>
        <linearGradient id="blobGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.9 0.09 175)" />
          <stop offset="100%" stopColor="oklch(0.82 0.11 200)" />
        </linearGradient>
        <radialGradient id="cheekGrad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="oklch(0.85 0.13 25 / 0.7)" />
          <stop offset="100%" stopColor="oklch(0.85 0.13 25 / 0)" />
        </radialGradient>
      </defs>
      {/* body */}
      <path
        d="M90 18 C140 18 162 60 158 100 C154 138 128 158 90 158 C52 158 26 138 22 100 C18 60 40 18 90 18 Z"
        fill="url(#blobGrad)"
        stroke="oklch(0.55 0.07 220)"
        strokeWidth="2"
      />
      {/* cheeks */}
      <ellipse cx="50" cy="110" rx="14" ry="9" fill="url(#cheekGrad)" />
      <ellipse cx="130" cy="110" rx="14" ry="9" fill="url(#cheekGrad)" />
      {/* eyes */}
      <ellipse cx="68" cy="88" rx="6" ry="8" fill="oklch(0.2 0.04 240)" />
      <ellipse cx="112" cy="88" rx="6" ry="8" fill="oklch(0.2 0.04 240)" />
      <circle cx="70" cy="85" r="2" fill="white" />
      <circle cx="114" cy="85" r="2" fill="white" />
      {/* worried mouth */}
      <path d="M76 120 Q90 112 104 120" stroke="oklch(0.3 0.05 240)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* tiny coffee cup */}
      <g transform="translate(118 128)">
        <rect x="0" y="0" width="18" height="14" rx="2" fill="white" stroke="oklch(0.55 0.07 220)" strokeWidth="1.4" />
        <path d="M18 3 q5 0 5 4 t-5 4" fill="none" stroke="oklch(0.55 0.07 220)" strokeWidth="1.4" />
        <rect x="3" y="2.5" width="12" height="3" rx="1" fill="oklch(0.45 0.08 50)" />
        <path d="M5 -3 q1 -3 2 0 M9 -4 q1 -3 2 0 M13 -3 q1 -3 2 0" stroke="oklch(0.7 0.04 240)" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}