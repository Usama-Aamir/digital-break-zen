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
  report_count: number;
  hidden_reason: string | null;
  hidden_by: string | null;
  hidden_at: string | null;
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
      .select("id, user_id, nickname, body, mood_tag, media_url, media_type, likes_count, status, report_count, hidden_reason, hidden_by, hidden_at, created_at, updated_at")
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
        report_count: 0,
      })
      .select("id, user_id, nickname, body, mood_tag, media_url, media_type, likes_count, status, report_count, hidden_reason, hidden_by, hidden_at, created_at, updated_at")
      .maybeSingle();

    if (error) {
      console.error("[watercooler] create post failed:", error);
      return { post: null, error: error.message };
    }

    return { post: data, error: null };
  } catch (error) {
    console.error("[watercooler] create post failed:", error);
    return { post: null, error: "Could not publish your post. Your typed text is still safe." };
  }
}

/**
 * Delete a watercooler post (only if owned by the user)
 * Uses soft delete by setting status to "deleted"
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
      .update({ status: "deleted" })
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

/**
 * Report a watercooler post
 */
export async function reportWatercoolerPost(
  postId: string,
  reporterId: string,
  reason: string,
  details?: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Supabase is not configured" };
  }

  try {
    // Insert report
    const { error: reportError } = await supabase
      .from("watercooler_post_reports")
      .insert({
        post_id: postId,
        reporter_id: reporterId,
        reason,
        details: details || null,
      });

    if (reportError) {
      console.error("[watercooler] report failed:", reportError);
      return { error: reportError.message };
    }

    // Note: report_count increment would ideally be done via RPC or trigger
    // For now, admin can see reports and the count can be updated manually
    // or we can add a database trigger later

    return { error: null };
  } catch (error) {
    console.error("[watercooler] report failed with exception:", error);
    return { error: "Could not report this post. Please try again." };
  }
}

/**
 * Get all watercooler posts for admin moderation
 */
export async function getAllWatercoolerPostsForAdmin(
  statusFilter?: string
): Promise<{ posts: WatercoolerPost[]; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { posts: [], error: "Supabase is not configured" };
  }

  try {
    let query = supabase
      .from("watercooler_posts")
      .select("id, user_id, nickname, body, mood_tag, media_url, media_type, likes_count, status, report_count, hidden_reason, hidden_by, hidden_at, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (statusFilter) {
      if (statusFilter === "reported") {
        // Filter by posts with report_count > 0
        query = query.gt("report_count", 0);
      } else {
        query = query.eq("status", statusFilter);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("[watercooler] admin posts fetch failed:", error);
      return { posts: [], error: error.message };
    }

    return { posts: data || [], error: null };
  } catch (error) {
    console.error("[watercooler] admin posts fetch failed with exception:", error);
    return { posts: [], error: "Could not load posts for moderation. Please try again." };
  }
}

/**
 * Update watercooler post status (admin moderation)
 */
export async function updateWatercoolerPostStatus(
  id: string,
  status: "published" | "hidden" | "deleted",
  hiddenReason?: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Supabase is not configured" };
  }

  try {
    const updateData: any = { status };

    if (status === "hidden" && hiddenReason) {
      updateData.hidden_reason = hiddenReason;
      updateData.hidden_at = new Date().toISOString();
    }

    if (status === "published") {
      updateData.hidden_reason = null;
      updateData.hidden_by = null;
      updateData.hidden_at = null;
    }

    const { error } = await supabase
      .from("watercooler_posts")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("[watercooler] status update failed:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error("[watercooler] status update failed with exception:", error);
    return { error: "Could not update post status. Please try again." };
  }
}
