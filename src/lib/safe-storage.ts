/**
 * Thin wrappers around localStorage that swallow quota / security errors
 * (e.g. private-browsing mode, third-party iframe sandboxing) and log a
 * dev-mode warning so the failure is visible in devtools.
 */

function warn(action: string, key: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.warn(`[safe-storage] ${action}("${key}") failed:`, error);
  }
}

export function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    warn("getItem", key, e);
    return null;
  }
}

export function setItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    warn("setItem", key, e);
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    warn("removeItem", key, e);
  }
}
