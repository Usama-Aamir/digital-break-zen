import { describe, it, expect } from "vitest";
import {
  SIZE,
  emptyBoard,
  clone,
  addRandom,
  init,
  rotate,
  slideRowLeft,
  moveLeft,
  move,
  hasMoves,
  tileStyle,
} from "../game-2048";

describe("game-2048", () => {
  describe("emptyBoard", () => {
    it("creates a SIZE x SIZE board of zeros", () => {
      const b = emptyBoard();
      expect(b).toHaveLength(SIZE);
      for (const row of b) {
        expect(row).toHaveLength(SIZE);
        expect(row.every((v) => v === 0)).toBe(true);
      }
    });
  });

  describe("clone", () => {
    it("creates a deep copy", () => {
      const b = emptyBoard();
      b[0][0] = 2;
      const c = clone(b);
      c[0][0] = 4;
      expect(b[0][0]).toBe(2);
      expect(c[0][0]).toBe(4);
    });
  });

  describe("addRandom", () => {
    it("adds a 2 or 4 to an empty cell", () => {
      const b = emptyBoard();
      const after = addRandom(b);
      const nonZero = after.flat().filter((v) => v !== 0);
      expect(nonZero).toHaveLength(1);
      expect([2, 4]).toContain(nonZero[0]);
    });

    it("returns the same board if no empty cells", () => {
      const full = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 2));
      const after = addRandom(full);
      expect(after).toBe(full);
    });
  });

  describe("init", () => {
    it("creates a board with exactly 2 tiles", () => {
      const b = init();
      const nonZero = b.flat().filter((v) => v !== 0);
      expect(nonZero).toHaveLength(2);
    });
  });

  describe("rotate", () => {
    it("rotates 90 degrees clockwise", () => {
      const b = emptyBoard();
      b[0][0] = 1;
      b[0][1] = 2;
      b[1][0] = 3;
      b[1][1] = 4;
      const r = rotate(b);
      expect(r[0][3]).toBe(1);
      expect(r[1][3]).toBe(2);
      expect(r[0][2]).toBe(3);
      expect(r[1][2]).toBe(4);
    });

    it("four rotations return the original board", () => {
      const b = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16],
      ];
      let r = b;
      for (let i = 0; i < 4; i++) r = rotate(r);
      expect(r).toEqual(b);
    });
  });

  describe("slideRowLeft", () => {
    it("slides tiles to the left", () => {
      const { row, gained } = slideRowLeft([0, 2, 0, 2]);
      expect(row).toEqual([4, 0, 0, 0]);
      expect(gained).toBe(4);
    });

    it("merges adjacent equal tiles", () => {
      const { row, gained } = slideRowLeft([2, 2, 4, 4]);
      expect(row).toEqual([4, 8, 0, 0]);
      expect(gained).toBe(12);
    });

    it("does not merge more than once per tile", () => {
      const { row } = slideRowLeft([2, 2, 2, 0]);
      expect(row).toEqual([4, 2, 0, 0]);
    });

    it("handles already-sorted row", () => {
      const { row, gained } = slideRowLeft([4, 2, 0, 0]);
      expect(row).toEqual([4, 2, 0, 0]);
      expect(gained).toBe(0);
    });

    it("handles all zeros", () => {
      const { row, gained } = slideRowLeft([0, 0, 0, 0]);
      expect(row).toEqual([0, 0, 0, 0]);
      expect(gained).toBe(0);
    });

    it("handles full row with no merges", () => {
      const { row, gained } = slideRowLeft([2, 4, 8, 16]);
      expect(row).toEqual([2, 4, 8, 16]);
      expect(gained).toBe(0);
    });
  });

  describe("moveLeft", () => {
    it("detects changed state", () => {
      const b = [
        [0, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const { changed } = moveLeft(b);
      expect(changed).toBe(true);
    });

    it("detects unchanged state", () => {
      const b = [
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const { changed } = moveLeft(b);
      expect(changed).toBe(false);
    });

    it("accumulates gained score from all rows", () => {
      const b = [
        [2, 2, 0, 0],
        [4, 4, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const { gained } = moveLeft(b);
      expect(gained).toBe(12);
    });
  });

  describe("move", () => {
    it("moves left correctly", () => {
      const b = [
        [0, 0, 0, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const { board } = move(b, "L");
      expect(board[0][0]).toBe(2);
      expect(board[0][3]).toBe(0);
    });

    it("moves right correctly", () => {
      const b = [
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const { board } = move(b, "R");
      expect(board[0][3]).toBe(2);
      expect(board[0][0]).toBe(0);
    });

    it("moves with U direction", () => {
      const b = [
        [0, 0, 0, 0],
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const { board, changed } = move(b, "U");
      expect(changed).toBe(true);
      expect(board[3][0]).toBe(2);
    });

    it("moves with D direction", () => {
      const b = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [2, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const { board, changed } = move(b, "D");
      expect(changed).toBe(true);
      expect(board[0][0]).toBe(2);
    });

    it("reports changed=false when move has no effect", () => {
      const b = [
        [2, 4, 8, 16],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const { changed } = move(b, "L");
      expect(changed).toBe(false);
    });
  });

  describe("hasMoves", () => {
    it("returns true when empty cells exist", () => {
      const b = emptyBoard();
      b[0][0] = 2;
      expect(hasMoves(b)).toBe(true);
    });

    it("returns true when adjacent equal cells exist", () => {
      const b = [
        [2, 4, 8, 16],
        [16, 8, 4, 2],
        [2, 4, 8, 16],
        [16, 8, 4, 4],
      ];
      expect(hasMoves(b)).toBe(true);
    });

    it("returns false when board is full with no merges", () => {
      const b = [
        [2, 4, 8, 16],
        [16, 8, 4, 2],
        [2, 4, 8, 16],
        [16, 8, 4, 2],
      ];
      expect(hasMoves(b)).toBe(false);
    });
  });

  describe("tileStyle", () => {
    it("returns transparent background for 0", () => {
      const style = tileStyle(0);
      expect(style.background).toContain("oklch");
      expect(style).not.toHaveProperty("color");
    });

    it("returns gradient for non-zero values", () => {
      const style = tileStyle(2);
      expect(style.background).toContain("linear-gradient");
      expect(style.color).toBeDefined();
      expect(style.boxShadow).toBeDefined();
    });

    it("returns different styles for different values", () => {
      const s2 = tileStyle(2);
      const s1024 = tileStyle(1024);
      expect(s2.background).not.toBe(s1024.background);
    });
  });
});
