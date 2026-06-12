export const PHRASES = [
  "You're on mute",
  "Let's circle back",
  "Reply all by mistake",
  "Can you see my screen?",
  "Sorry, you go first",
  "I think you're frozen",
  "Let's take this offline",
  "Synergy",
  "Quick sync",
  "Per my last email",
  "Touch base",
  "Move the needle",
  "Low-hanging fruit",
  "Bandwidth",
  "Hard stop at the top of the hour",
  "Ping me",
  "Loop me in",
  "Action item",
  "Out of pocket",
  "Drinking from the firehose",
  "Boil the ocean",
  "Deep dive",
  "Parking lot it",
  "Open the kimono",
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export type Saved = { date: string; cells: string[]; stamps: boolean[] };

export function newBoard(): Saved {
  const picked = shuffle(PHRASES).slice(0, 25);
  picked[12] = "FREE · sip your coffee";
  return {
    date: todayKey(),
    cells: picked,
    stamps: Array.from({ length: 25 }, (_, i) => i === 12),
  };
}

export function checkBingo(s: boolean[]): boolean {
  const lines: number[][] = [];
  for (let r = 0; r < 5; r++) lines.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
  for (let c = 0; c < 5; c++) lines.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
  lines.push([0, 6, 12, 18, 24]);
  lines.push([4, 8, 12, 16, 20]);
  return lines.some((line) => line.every((i) => s[i]));
}
