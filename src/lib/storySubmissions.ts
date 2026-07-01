import { supabase, isSupabaseConfigured } from "./supabase";
import { awardXP } from "./gamification";

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

export interface SubmissionInput {
  nickname: string;
  email: string;
  story_type: string;
  title: string;
  category: string;
  mood_tag: string;
  body: string;
  anonymous: boolean;
}

/**
 * Submit a community story to Supabase story_submissions table
 */
export async function submitCommunityStory(
  userId: string,
  submission: SubmissionInput
): Promise<{ submission: StorySubmission | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { submission: null, error: "Supabase is not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("story_submissions")
      .insert({
        user_id: userId,
        nickname: submission.nickname,
        email: submission.email,
        story_type: submission.story_type,
        title: submission.title,
        category: submission.category,
        mood_tag: submission.mood_tag,
        body: submission.body,
        anonymous: submission.anonymous,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error submitting story:", error);
      return { submission: null, error: error.message };
    }

    // Award XP for story submission
    if (data && data.id) {
      awardXP(userId, 'story_submitted', data.id, 'story_submissions').catch(err => {
        console.warn('Failed to award story submission XP:', err);
      });
    }

    return { submission: data as StorySubmission, error: null };
  } catch (error) {
    console.error("Error submitting story:", error);
    return { submission: null, error: "Could not submit your story. Your typed content is still safe." };
  }
}

/**
 * Get all story submissions for a specific user
 */
export async function getUserStorySubmissions(
  userId: string
): Promise<{ submissions: StorySubmission[]; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { submissions: [], error: "Supabase is not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("story_submissions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading submissions:", error);
      return { submissions: [], error: error.message };
    }

    return { submissions: data || [], error: null };
  } catch (error) {
    console.error("Error loading submissions:", error);
    return { submissions: [], error: "Could not load submissions. Please try again." };
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
