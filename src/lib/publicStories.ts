import { supabase, isSupabaseConfigured } from "./supabase";

export interface PublicStory {
  id: string;
  title: string;
  story_type: string;
  category: string;
  mood_tag: string;
  body: string;
  nickname: string | null;
  anonymous: boolean;
  created_at: string;
  updated_at: string;
  status: string;
}

/**
 * Get all approved community stories for public display
 */
export async function getApprovedCommunityStories(): Promise<{ stories: PublicStory[]; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { stories: [], error: "Supabase is not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("story_submissions")
      .select("id, title, story_type, category, mood_tag, body, nickname, anonymous, created_at, updated_at, status")
      .eq("status", "approved")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading approved stories:", error);
      return { stories: [], error: 'Could not load community stories. Please try again.' };
    }

    return { stories: data || [], error: null };
  } catch (error) {
    console.error("Error loading approved stories:", error);
    return { stories: [], error: "Could not load community stories. Please try again." };
  }
}

/**
 * Get the public author name for a story, respecting privacy settings
 */
export function getPublicAuthorName(story: PublicStory): string {
  if (story.anonymous) {
    return "Anonymous community member";
  }
  
  if (story.nickname && story.nickname.trim()) {
    return story.nickname;
  }
  
  return "Community member";
}
