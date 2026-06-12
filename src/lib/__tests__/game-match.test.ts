import { describe, it, expect } from "vitest";
import { ICON_KEYS, shuffle, makeDeck } from "../game-match";

describe("game-match", () => {
  describe("ICON_KEYS", () => {
    it("has 8 icons", () => {
      expect(ICON_KEYS).toHaveLength(8);
    });

    it("has unique keys", () => {
      const keys = ICON_KEYS.map((i) => i.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it("each icon has a key and hue", () => {
      for (const icon of ICON_KEYS) {
        expect(typeof icon.key).toBe("string");
        expect(icon.key.length).toBeGreaterThan(0);
        expect(typeof icon.hue).toBe("number");
      }
    });
  });

  describe("shuffle", () => {
    it("returns an array of the same length", () => {
      const arr = [1, 2, 3, 4, 5];
      expect(shuffle(arr)).toHaveLength(arr.length);
    });

    it("contains the same elements", () => {
      const arr = [1, 2, 3, 4, 5];
      expect(shuffle(arr).sort()).toEqual([...arr].sort());
    });

    it("does not mutate the original", () => {
      const arr = [1, 2, 3];
      const copy = [...arr];
      shuffle(arr);
      expect(arr).toEqual(copy);
    });
  });

  describe("makeDeck", () => {
    it("creates 16 tiles (8 pairs)", () => {
      const deck = makeDeck();
      expect(deck).toHaveLength(16);
    });

    it("has exactly 2 tiles per key", () => {
      const deck = makeDeck();
      const counts = new Map<string, number>();
      for (const tile of deck) {
        counts.set(tile.key, (counts.get(tile.key) ?? 0) + 1);
      }
      for (const [, count] of counts) {
        expect(count).toBe(2);
      }
    });

    it("all tiles start unflipped and unmatched", () => {
      const deck = makeDeck();
      for (const tile of deck) {
        expect(tile.flipped).toBe(false);
        expect(tile.matched).toBe(false);
      }
    });

    it("has unique ids", () => {
      const deck = makeDeck();
      const ids = deck.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("each tile has required properties", () => {
      const deck = makeDeck();
      for (const tile of deck) {
        expect(typeof tile.id).toBe("number");
        expect(typeof tile.key).toBe("string");
        expect(typeof tile.hue).toBe("number");
        expect(typeof tile.flipped).toBe("boolean");
        expect(typeof tile.matched).toBe("boolean");
      }
    });
  });
});
