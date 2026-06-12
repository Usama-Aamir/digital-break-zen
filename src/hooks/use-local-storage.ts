import { useEffect, useState } from "react";

/**
 * Persist a value to localStorage with automatic hydration.
 *
 * @param key   localStorage key
 * @param init  initial / fallback value (used when nothing is stored yet)
 */
export function useLocalStorage<T>(
  key: string,
  init: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(init);

  // Hydrate once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* noop */
    }
  }, [key]);

  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* noop */
    }
  }, [key, value]);

  return [value, setValue];
}
