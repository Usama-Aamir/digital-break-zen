export type MatchTileData = {
  id: number;
  key: string;
  hue: number;
  flipped: boolean;
  matched: boolean;
};

export const ICON_KEYS: { key: string; hue: number }[] = [
  { key: "coffee", hue: 50 },
  { key: "leaf", hue: 165 },
  { key: "cloud", hue: 230 },
  { key: "laptop", hue: 280 },
  { key: "cookie", hue: 30 },
  { key: "head", hue: 320 },
  { key: "sun", hue: 90 },
  { key: "moon", hue: 260 },
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeDeck(): MatchTileData[] {
  const pairs = ICON_KEYS.flatMap((ic, i) => [
    { id: i * 2, ...ic, flipped: false, matched: false },
    { id: i * 2 + 1, ...ic, flipped: false, matched: false },
  ]);
  return shuffle(pairs);
}
