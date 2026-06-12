import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Loader2 } from "lucide-react";
import { generateText } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";

const SYSTEM =
  "You are an empathetic, supportive active listener. Your goal is to validate the user's feelings and provide brief, comforting encouragement. Do not give medical or psychological advice. Just be a kind sounding board.";

const WELCOME =
  "Hello! Whether you are overwhelmed with your IT Master's coursework, stressing over upcoming customer service interviews, or just having a long day, I am here to listen. What's on your mind?";

type Msg = { id: number; role: "user" | "ai"; text: string };

export function ActiveListener() {
  const run = useServerFn(generateText);
  const [messages, setMessages] = useState<Msg[]>([
    { id: 0, role: "ai", text: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function fetchEmpathyResponse(userMessage: string): Promise<string> {
    try {
      const { text } = await run({ data: { system: SYSTEM, user: userMessage } });
      return text || "I'm here with you. Tell me more whenever you're ready.";
    } catch {
      return "I'm having trouble responding right now, but I'm still here. Keep going if you'd like.";
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || typing) return;
    const userMsg: Msg = { id: Date.now(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    const [reply] = await Promise.all([
      fetchEmpathyResponse(text),
      new Promise((r) => setTimeout(r, 2000)),
    ]);

    setTyping(false);
    setMessages((m) => [...m, { id: Date.now() + 1, role: "ai", text: reply }]);
  }

  return (
    <div className="glass-card rounded-3xl overflow-hidden flex flex-col h-[520px] bg-[image:var(--gradient-mint)]/40">
      <div className="sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b border-white/60 px-5 py-3">
        <h3 className="font-display font-bold text-base text-foreground">The Active Listener</h3>
        <p className="text-xs text-muted-foreground">A safe space to vent. Chat history is cleared when you leave.</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-[var(--shadow-soft)] ${
                m.role === "user"
                  ? "bg-[image:var(--gradient-lav)] text-foreground rounded-br-md"
                  : "bg-white/85 text-foreground/90 rounded-bl-md border border-white/70"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-white/85 border border-white/70 rounded-2xl rounded-bl-md px-4 py-3 shadow-[var(--shadow-soft)] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="ml-1 text-xs text-muted-foreground">typing…</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/60 bg-white/70 backdrop-blur-md p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Share what's on your mind…"
          className="flex-1 rounded-full bg-white/80 border border-white/60 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button
          onClick={send}
          disabled={!input.trim() || typing}
          className="rounded-full bg-[image:var(--gradient-mint)] text-foreground hover:opacity-95 shadow-[var(--shadow-soft)] shrink-0"
        >
          {typing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="ml-2">Share</span>
        </Button>
      </div>
    </div>
  );
}