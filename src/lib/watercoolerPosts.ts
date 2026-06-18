import { supabase, isSupabaseConfigured } from "./supabase";

export interface WatercoolerPost {
  id: string;
  user_id: string | null;
  nickname: string | null;
  body: string;
  mood_tag: string | null;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WatercoolerPostInput {
  body: string;
  nickname?: string;
  mood_tag?: string;
  media_url?: string;
  media_type?: string;
}

/**
 * Get all published watercooler posts for public display
 */
export async function getPublishedWatercoolerPosts(): Promise<{ posts: WatercoolerPost[]; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { posts: [], error: "Supabase is not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("watercooler_posts")
      .select("id, user_id, nickname, body, mood_tag, media_url, media_type, likes_count, status, created_at, updated_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading watercooler posts:", error);
      return { posts: [], error: error.message };
    }

    return { posts: data || [], error: null };
  } catch (error) {
    console.error("Error loading watercooler posts:", error);
    return { posts: [], error: "Could not load Watercooler posts. Showing local posts if available." };
  }
}

/**
 * Create a new watercooler post
 */
export async function createWatercoolerPost(
  userId: string,
  post: WatercoolerPostInput
): Promise<{ post: WatercoolerPost | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { post: null, error: "Supabase is not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("watercooler_posts")
      .insert({
        user_id: userId,
        body: post.body,
        nickname: post.nickname || null,
        mood_tag: post.mood_tag || null,
        media_url: post.media_url || null,
        media_type: post.media_type || null,
        status: "published",
        likes_count: 0,
      })
      .select("id, user_id, nickname, body, mood_tag, media_url, media_type, likes_count, status, created_at, updated_at")
      .single();

    if (error) {
      console.error("Error creating watercooler post:", error);
      return { post: null, error: error.message };
    }

    return { post: data, error: null };
  } catch (error) {
    console.error("Error creating watercooler post:", error);
    return { post: null, error: "Could not publish your post. Your typed text is still safe." };
  }
}

/**
 * Delete a watercooler post (only if owned by the user)
 */
export async function deleteOwnWatercoolerPost(
  id: string,
  userId: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Supabase is not configured" };
  }

  try {
    const { error } = await supabase
      .from("watercooler_posts")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting watercooler post:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error("Error deleting watercooler post:", error);
    return { error: "Could not delete post. Please try again." };
  }
}

/**
 * Get the public display name for a watercooler post
 */
export function getWatercoolerDisplayName(post: WatercoolerPost): string {
  if (post.nickname && post.nickname.trim()) {
    return post.nickname;
  }
  return "Community member";
}
