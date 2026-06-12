import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { type ReactNode } from "react";
import { type Mood, MOOD_META, MoodProvider, useMood } from "../mood";

function wrapper({ children }: { children: ReactNode }) {
  return <MoodProvider>{children}</MoodProvider>;
}

describe("mood", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("MOOD_META", () => {
    const moods: Mood[] = ["frustrated", "tired", "demotivated", "happy", "fun"];

    it("has entries for all mood types", () => {
      for (const mood of moods) {
        expect(MOOD_META[mood]).toBeDefined();
      }
    });

    it("each mood has required properties", () => {
      for (const mood of moods) {
        const meta = MOOD_META[mood];
        expect(typeof meta.label).toBe("string");
        expect(typeof meta.emoji).toBe("string");
        expect(typeof meta.dot).toBe("string");
        expect(typeof meta.bg).toBe("string");
        expect(typeof meta.headline).toBe("string");
        expect(typeof meta.subhead).toBe("string");
        expect(Array.isArray(meta.featured)).toBe(true);
        expect(meta.featured.length).toBeGreaterThan(0);
      }
    });

    it("featured routes are valid paths", () => {
      for (const mood of moods) {
        for (const route of MOOD_META[mood].featured) {
          expect(route).toMatch(/^\//);
        }
      }
    });
  });

  describe("MoodProvider + useMood", () => {
    it("starts with null mood", () => {
      const { result } = renderHook(() => useMood(), { wrapper });
      expect(result.current.mood).toBeNull();
    });

    it("setMood updates the mood", () => {
      const { result } = renderHook(() => useMood(), { wrapper });
      act(() => result.current.setMood("happy"));
      expect(result.current.mood).toBe("happy");
    });

    it("clearMood resets mood to null", () => {
      const { result } = renderHook(() => useMood(), { wrapper });
      act(() => result.current.setMood("tired"));
      act(() => result.current.clearMood());
      expect(result.current.mood).toBeNull();
    });

    it("persists mood to localStorage", () => {
      const { result } = renderHook(() => useMood(), { wrapper });
      act(() => result.current.setMood("frustrated"));
      expect(localStorage.getItem("breakroom_mood_v1")).toBe("frustrated");
    });

    it("clearMood removes from localStorage", () => {
      const { result } = renderHook(() => useMood(), { wrapper });
      act(() => result.current.setMood("fun"));
      act(() => result.current.clearMood());
      expect(localStorage.getItem("breakroom_mood_v1")).toBeNull();
    });

    it("restores mood from localStorage on mount", () => {
      localStorage.setItem("breakroom_mood_v1", "demotivated");
      const { result } = renderHook(() => useMood(), { wrapper });
      expect(result.current.mood).toBe("demotivated");
    });

    it("ignores invalid mood from localStorage", () => {
      localStorage.setItem("breakroom_mood_v1", "nonexistent");
      const { result } = renderHook(() => useMood(), { wrapper });
      expect(result.current.mood).toBeNull();
    });

    it("throws when used outside MoodProvider", () => {
      expect(() => {
        renderHook(() => useMood());
      }).toThrow("useMood must be used within MoodProvider");
    });

    it("reports ready after mount", () => {
      const { result } = renderHook(() => useMood(), { wrapper });
      expect(result.current.ready).toBe(true);
    });
  });
});
