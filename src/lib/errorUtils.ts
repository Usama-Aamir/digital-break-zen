/**
 * Maps raw Supabase / Postgres error messages to user-friendly copy.
 * Technical details (RLS, policy names, JWT, storage paths) are never shown in the UI.
 * console.error is kept by the caller for dev debugging.
 */

const FRIENDLY_DEFAULT = "Something went wrong. Please try again.";

const KNOWN_PATTERNS: Array<{ test: RegExp; message: string }> = [
  { test: /invalid login credentials/i, message: "Incorrect email or password. Please try again." },
  { test: /email not confirmed/i, message: "Please confirm your email before signing in." },
  { test: /user already registered/i, message: "An account with this email already exists. Try signing in instead." },
  { test: /password should be at least/i, message: "Password is too short. Please use at least 6 characters." },
  { test: /rate limit/i, message: "Too many attempts. Please wait a moment and try again." },
  { test: /row-level security|rls|policy/i, message: "You don't have permission to do that." },
  { test: /jwt|token|session/i, message: "Your session has expired. Please sign in again." },
  { test: /storage|bucket/i, message: "Could not upload media. Please try again." },
  { test: /network|fetch failed|connection/i, message: "Network error. Please check your connection and try again." },
  { test: /duplicate key|unique constraint/i, message: "This already exists. Try refreshing the page." },
  { test: /foreign key/i, message: "Something went wrong with the data. Please refresh and try again." },
  { test: /not configured/i, message: "The service is not configured. Please contact support." },
];

export function getFriendlyErrorMessage(rawError: string | null | undefined): string {
  if (!rawError) return FRIENDLY_DEFAULT;

  for (const { test, message } of KNOWN_PATTERNS) {
    if (test.test(rawError)) {
      return message;
    }
  }

  // If the error message looks technical (contains quotes, SQL, etc.), hide it
  if (/["'(){}]|SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|schema|relation|column/i.test(rawError)) {
    return FRIENDLY_DEFAULT;
  }

  // If it's a short, plain message, allow it through but cap length
  if (rawError.length <= 120) {
    return rawError;
  }

  return FRIENDLY_DEFAULT;
}
