import { supabase, isSupabaseConfigured } from "./supabase";

export const ADMIN_EMAIL = "aamirusama8@gmail.com";

export interface StorySubmission {
  id: string;
  user_id: string;
  nickname: string;
  email: string;
  story_type: string;
  title: string;
  category: string;
  mood_tag: string;
  body: string;
  anonymous: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Check if the given email is the admin email
 */
export function isAdminEmail(email?: string | null): boolean {
  return email === ADMIN_EMAIL;
}

/**
 * Get all story submissions, optionally filtered by status
 */
export async function getAllStorySubmissions(
  status?: string
): Promise<{ submissions: StorySubmission[]; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { submissions: [], error: "Supabase is not configured" };
  }

  try {
    let query = supabase
      .from("story_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading submissions:", error);
      return { submissions: [], error: error.message };
    }

    return { submissions: data || [], error: null };
  } catch (error) {
    console.error("Error loading submissions:", error);
    return { submissions: [], error: "Could not load moderation items. Admin policy may need to be enabled." };
  }
}

/**
 * Update the status of a story submission
 */
export async function updateStorySubmissionStatus(
  id: string,
  status: "pending" | "approved" | "rejected"
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Supabase is not configured" };
  }

  try {
    const { error } = await supabase
      .from("story_submissions")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating submission status:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error("Error updating submission status:", error);
    return { error: "Could not update story status. Please try again." };
  }
}

/**
 * Get a human-readable label for submission status
 */
export function getSubmissionStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  };
  return statusLabels[status] || status;
}
