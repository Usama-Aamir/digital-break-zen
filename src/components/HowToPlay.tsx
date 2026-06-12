import { useEffect, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getItem, setItem } from "@/lib/safe-storage";

export type HowToStep = { icon: string; text: string };

type Props = {
  gameKey: string;
  title: string;
  steps: HowToStep[];
  cta?: string;
};

/** Help button + first-visit auto-modal. Stores a per-game seen flag in localStorage. */
export function HowToPlay({ gameKey, title, steps, cta = "Let's Play" }: Props) {
  const storageKey = `breakroom_howto_${gameKey}_v1`;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!getItem(storageKey)) setOpen(true);
  }, [storageKey]);

  const close = () => {
    setOpen(false);
    setItem(storageKey, "1");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How to play"
        className="inline-flex items-center justify-center h-9 w-9 rounded-full glass-card text-foreground/70 hover:text-foreground transition-colors"
      >
        <HelpCircle className="h-4.5 w-4.5" />
      </button>

      {mounted && open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ animation: "howto-fade 220ms ease-out both" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`howto-${gameKey}-title`}
        >
          <button
            type="button"
            aria-label="Close how to play"
            onClick={close}
            className="absolute inset-0 backdrop-blur-md bg-white/30"
          />
          <div
            className="relative w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-md shadow-[0_20px_60px_oklch(0.5_0.1_280/0.25)] border border-white/60 p-6 sm:p-7"
            style={{ animation: "howto-pop 320ms cubic-bezier(.2,1.4,.4,1) both" }}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-white/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <h2
              id={`howto-${gameKey}-title`}
              className="text-xl sm:text-2xl font-display font-bold pr-8"
            >
              How to Play: {title}
            </h2>
            <ul className="mt-5 space-y-3">
              {steps.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl bg-white/60 px-3 py-2.5"
                >
                  <span className="text-xl leading-none mt-0.5" aria-hidden>{s.icon}</span>
                  <span className="text-sm text-foreground/80 leading-snug">{s.text}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={close}
              className="mt-6 w-full rounded-full text-base font-semibold py-6 bg-[image:var(--gradient-lav)] text-foreground hover:opacity-95 shadow-[var(--shadow-soft)]"
            >
              {cta}
            </Button>
          </div>
          <style>{`
            @keyframes howto-fade { from { opacity: 0; } to { opacity: 1; } }
            @keyframes howto-pop {
              from { opacity: 0; transform: translateY(8px) scale(0.96); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}