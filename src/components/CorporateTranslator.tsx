import { useState } from "react";
import { Copy, Check, Wand2, Loader2 } from "lucide-react";
import { translateRageToCorporate } from "@/lib/rage-translator";
import { Button } from "@/components/ui/button";

export function CorporateTranslator() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function onSubmit() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setOutput("");
    // Simulate a brief delay for better UX
    setTimeout(() => {
      setOutput(translateRageToCorporate(input.trim()));
      setLoading(false);
    }, 300);
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  }

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-3">
      <div>
        <h3 className="font-display font-bold text-lg">Rage-to-Corporate Translator</h3>
        <p className="text-sm text-muted-foreground">Vent it raw — get back meeting-safe diplomacy.</p>
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your angry thoughts here..."
        rows={4}
        className="w-full rounded-2xl bg-white/70 border border-white/60 p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-ring"
      />
      <Button
        onClick={onSubmit}
        disabled={loading || !input.trim()}
        className="rounded-full bg-[image:var(--gradient-lav)] text-foreground hover:opacity-95 shadow-[var(--shadow-soft)]"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        <span className="ml-2">{loading ? "Translating..." : "Make it Professional"}</span>
      </Button>
      <div className="relative rounded-2xl bg-white/80 border border-white/60 p-4 min-h-[96px] text-sm text-foreground/90 whitespace-pre-wrap">
        {output ? (
          output
        ) : (
          <span className="text-muted-foreground">Your professionally-translated reply will appear here.</span>
        )}
        {output && (
          <button
            type="button"
            onClick={copy}
            aria-label="Copy to clipboard"
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}