import { useAuth } from "./auth";
import { isAdminEmail } from "./adminSubmissions";

/**
 * Centralized admin check hook.
 * Returns { isAdmin, loading, isConfigured } so routes can guard consistently.
 */
export function useIsAdmin() {
  const { user, loading, isConfigured } = useAuth();
  const isAdmin = !!user && isAdminEmail(user.email);
  return { isAdmin, loading, isConfigured, user };
}
