import { useState } from "react";
import { Palmtree } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AiVacation() {
  const [place, setPlace] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);

  function generate() {
    const userInput = place.trim();
    if (!userInput) return;
    setIsGenerating(true);
    setHasError(false);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(userInput)}?width=1080&height=720&nologo=true&seed=${Math.random()}`;
    setImageUrl(url);
  }

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-3">
      <div>
        <h3 className="font-display font-bold text-lg">Infinite Desk Vacation</h3>
        <p className="text-sm text-muted-foreground">Pick a place. Stare out a freshly-imagined window.</p>
      </div>
      <div className="flex gap-2">
        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
          placeholder="Where do you want to relax?"
          className="flex-1 rounded-full bg-white/70 border border-white/60 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button
          onClick={generate}
          disabled={!place.trim() || isGenerating}
          className="rounded-full bg-[image:var(--gradient-mint)] text-foreground hover:opacity-95 shadow-[var(--shadow-soft)] shrink-0"
        >
          <Palmtree className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">Generate Destination</span>
          <span className="ml-2 sm:hidden">Go</span>
        </Button>
      </div>
      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-white/40 border border-white/60">
        {imageUrl && !hasError && (
          <img
            key={imageUrl}
            src={imageUrl}
            alt={place}
            className={`w-full h-auto rounded-xl object-cover ${isGenerating ? "hidden" : "block"}`}
            onLoad={() => setIsGenerating(false)}
            onError={() => {
              setHasError(true);
              setIsGenerating(false);
            }}
          />
        )}
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[image:var(--gradient-mint)]/40 backdrop-blur-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/45 shadow-[var(--shadow-soft)] animate-pulse">
              <Palmtree className="h-9 w-9 text-foreground/60" />
            </div>
            <p className="animate-pulse text-center text-sm font-medium text-foreground/70">
              🧘 Customizing your peaceful escape...
            </p>
          </div>
        )}
        {hasError && !isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center bg-white/45 backdrop-blur-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/60 shadow-[var(--shadow-soft)]">
              <Palmtree className="h-7 w-7 text-foreground/60" />
            </div>
            <p className="max-w-sm text-sm font-medium text-foreground/70">
              The universe is busy right now. Let's try another peaceful prompt!
            </p>
          </div>
        )}
        {!imageUrl && !isGenerating && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Your virtual window will appear here.
          </div>
        )}
      </div>
    </div>
  );
}