export const SIZE = 4;
export type Board = number[][];

export function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

export function clone(b: Board): Board {
  return b.map((r) => [...r]);
}

export function addRandom(b: Board): Board {
  const empties: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (b[r][c] === 0) empties.push([r, c]);
  if (!empties.length) return b;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const nb = clone(b);
  nb[r][c] = Math.random() < 0.9 ? 2 : 4;
  return nb;
}

export function init(): Board {
  return addRandom(addRandom(emptyBoard()));
}

export function rotate(b: Board): Board {
  const n = clone(emptyBoard());
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) n[c][SIZE - 1 - r] = b[r][c];
  return n;
}

export function slideRowLeft(row: number[]): {
  row: number[];
  gained: number;
} {
  const filtered = row.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      out.push(filtered[i] * 2);
      gained += filtered[i] * 2;
      i++;
    } else out.push(filtered[i]);
  }
  while (out.length < SIZE) out.push(0);
  return { row: out, gained };
}

export function moveLeft(b: Board): {
  board: Board;
  gained: number;
  changed: boolean;
} {
  let gained = 0;
  let changed = false;
  const nb = b.map((row) => {
    const { row: nr, gained: g } = slideRowLeft(row);
    gained += g;
    if (nr.some((v, i) => v !== row[i])) changed = true;
    return nr;
  });
  return { board: nb, gained, changed };
}

export function move(
  b: Board,
  dir: "L" | "R" | "U" | "D",
): { board: Board; gained: number; changed: boolean } {
  const rotations = { L: 0, U: 1, R: 2, D: 3 }[dir];
  let nb = b;
  for (let i = 0; i < rotations; i++) nb = rotate(nb);
  const res = moveLeft(nb);
  nb = res.board;
  for (let i = 0; i < (4 - rotations) % 4; i++) nb = rotate(nb);
  return { board: nb, gained: res.gained, changed: res.changed };
}

export function hasMoves(b: Board): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (b[r][c] === 0) return true;
      if (c < SIZE - 1 && b[r][c] === b[r][c + 1]) return true;
      if (r < SIZE - 1 && b[r][c] === b[r + 1][c]) return true;
    }
  return false;
}

export function tileStyle(value: number) {
  if (value === 0) return { background: "oklch(0.96 0.015 240 / 0.5)" };
  const exp = Math.log2(value);
  const hue = 200 + (exp - 1) * 18;
  const lightness = Math.max(0.6, 0.96 - exp * 0.025);
  const chroma = Math.min(0.15, 0.04 + exp * 0.012);
  return {
    background: `linear-gradient(135deg, oklch(${lightness + 0.04} ${chroma} ${hue}), oklch(${lightness} ${chroma} ${hue + 30}))`,
    color: `oklch(0.3 0.04 ${hue})`,
    boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.6), 0 6px 14px oklch(0.7 0.1 270 / 0.18)",
  };
}
