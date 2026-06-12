import { Slider } from "@/components/ui/slider";
import { useLocalStorage } from "@/hooks/use-local-storage";

const MOODS = [
  { emoji: "😩", quote: "Tough mornings build legendary afternoons. One small win at a time." },
  { emoji: "😕", quote: "Even spreadsheets respect a hero who takes breaks. You've got this." },
  {
    emoji: "😐",
    quote: "Steady is a superpower. Sip some water and reset your tabs (and your mind).",
  },
  { emoji: "🙂", quote: "Look at you, casually thriving in fluorescent lighting. Keep going." },
  { emoji: "😄", quote: "You're radiating productivity AND vibes. The breakroom approves." },
];

const KEY = "breakroom_mood";

export function MoodCheckIn() {
  const [val, setVal] = useLocalStorage(KEY, 2);
  const mood = MOODS[val];
  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
        Daily Mood Check-In
      </h3>
      <div className="flex items-center justify-center gap-4">
        <span className="text-6xl animate-float-soft drop-shadow-sm select-none">{mood.emoji}</span>
      </div>
      <Slider
        value={[val]}
        onValueChange={(v) => setVal(v[0])}
        min={0}
        max={4}
        step={1}
        className="my-2"
      />
      <div className="flex justify-between text-xs text-muted-foreground -mt-2">
        <span>rough</span>
        <span>glowing</span>
      </div>
      <p className="text-sm text-foreground/80 text-center italic min-h-[3rem]">"{mood.quote}"</p>
    </div>
  );
}
