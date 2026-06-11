import { useState } from "react";
import { Loader2, Palmtree } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AiVacation() {
  const [place, setPlace] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function generate() {
    const q = place.trim();
    if (!q) return;
    setLoading(true);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(q)}?width=1920&height=1080&nologo=true&seed=${Date.now()}`;
    setUrl(imageUrl);
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
          disabled={!place.trim() || loading}
          className="rounded-full bg-[image:var(--gradient-mint)] text-foreground hover:opacity-95 shadow-[var(--shadow-soft)] shrink-0"
        >
          <Palmtree className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">Generate Destination</span>
          <span className="ml-2 sm:hidden">Go</span>
        </Button>
      </div>
      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-white/40 border border-white/60">
        {url && (
          <img
            key={url}
            src={url}
            alt={place ? `AI-generated view of ${place}` : "AI-generated vacation view"}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loading ? "opacity-0" : "opacity-100"}`}
          />
        )}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/40 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-foreground/60" />
            <p className="text-sm text-muted-foreground">Visualizing your escape…</p>
          </div>
        )}
        {!url && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Your virtual window will appear here.
          </div>
        )}
      </div>
    </div>
  );
}