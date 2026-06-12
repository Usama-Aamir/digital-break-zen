import { describe, it, expect, vi, afterEach } from "vitest";
import { PHRASES, shuffle, todayKey, newBoard, checkBingo } from "../game-bingo";

describe("game-bingo", () => {
  describe("PHRASES", () => {
    it("has exactly 24 phrases", () => {
      expect(PHRASES).toHaveLength(24);
    });

    it("contains no duplicates", () => {
      const set = new Set(PHRASES);
      expect(set.size).toBe(PHRASES.length);
    });
  });

  describe("shuffle", () => {
    it("returns an array of the same length", () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr);
      expect(shuffled).toHaveLength(arr.length);
    });

    it("contains the same elements", () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr);
      expect(shuffled.sort()).toEqual(arr.sort());
    });

    it("does not mutate the original array", () => {
      const arr = [1, 2, 3, 4, 5];
      const copy = [...arr];
      shuffle(arr);
      expect(arr).toEqual(copy);
    });

    it("handles empty array", () => {
      expect(shuffle([])).toEqual([]);
    });

    it("handles single-element array", () => {
      expect(shuffle([42])).toEqual([42]);
    });
  });

  describe("todayKey", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("returns a YYYY-MM-DD string", () => {
      const key = todayKey();
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("returns the correct date", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
      expect(todayKey()).toBe("2025-06-15");
      vi.useRealTimers();
    });
  });

  describe("newBoard", () => {
    it("creates a board with 24 cells (PHRASES has 24 entries)", () => {
      const board = newBoard();
      expect(board.cells).toHaveLength(PHRASES.length);
    });

    it("creates stamps array with 25 entries for 5x5 grid", () => {
      const board = newBoard();
      expect(board.stamps).toHaveLength(25);
    });

    it("has the free space in the center (index 12)", () => {
      const board = newBoard();
      expect(board.cells[12]).toBe("FREE · sip your coffee");
      expect(board.stamps[12]).toBe(true);
    });

    it("only stamps the center cell initially", () => {
      const board = newBoard();
      const stamped = board.stamps.filter(Boolean);
      expect(stamped).toHaveLength(1);
      expect(board.stamps[12]).toBe(true);
    });

    it("sets the date to today", () => {
      const board = newBoard();
      expect(board.date).toBe(todayKey());
    });
  });

  describe("checkBingo", () => {
    const falseStamps = () => Array(25).fill(false);

    it("returns false for empty board", () => {
      expect(checkBingo(falseStamps())).toBe(false);
    });

    it("detects first row bingo", () => {
      const s = falseStamps();
      [0, 1, 2, 3, 4].forEach((i) => (s[i] = true));
      expect(checkBingo(s)).toBe(true);
    });

    it("detects last row bingo", () => {
      const s = falseStamps();
      [20, 21, 22, 23, 24].forEach((i) => (s[i] = true));
      expect(checkBingo(s)).toBe(true);
    });

    it("detects first column bingo", () => {
      const s = falseStamps();
      [0, 5, 10, 15, 20].forEach((i) => (s[i] = true));
      expect(checkBingo(s)).toBe(true);
    });

    it("detects last column bingo", () => {
      const s = falseStamps();
      [4, 9, 14, 19, 24].forEach((i) => (s[i] = true));
      expect(checkBingo(s)).toBe(true);
    });

    it("detects main diagonal bingo", () => {
      const s = falseStamps();
      [0, 6, 12, 18, 24].forEach((i) => (s[i] = true));
      expect(checkBingo(s)).toBe(true);
    });

    it("detects anti-diagonal bingo", () => {
      const s = falseStamps();
      [4, 8, 12, 16, 20].forEach((i) => (s[i] = true));
      expect(checkBingo(s)).toBe(true);
    });

    it("returns false for partial line", () => {
      const s = falseStamps();
      [0, 1, 2, 3].forEach((i) => (s[i] = true));
      expect(checkBingo(s)).toBe(false);
    });

    it("returns true for all stamps", () => {
      const s = Array(25).fill(true);
      expect(checkBingo(s)).toBe(true);
    });
  });
});
