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

export interface WatercoolerComment {
  id: string;
  post_id: string;
  user_id: string | null;
  nickname: string | null;
  body: string;
  status: string;
  created_at: string;
  updated_at: string;
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

/**
 * Like a watercooler post
 */
export async function likeWatercoolerPost(
  postId: string,
  userId: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Supabase is not configured" };
  }

  try {
    const { error } = await supabase
      .from("watercooler_post_likes")
      .insert({
        post_id: postId,
        user_id: userId,
      });

    if (error) {
      console.error("[watercooler] like failed:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error("[watercooler] like failed with exception:", error);
    return { error: "Could not like post. Please try again." };
  }
}

/**
 * Unlike a watercooler post
 */
export async function unlikeWatercoolerPost(
  postId: string,
  userId: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Supabase is not configured" };
  }

  try {
    const { error } = await supabase
      .from("watercooler_post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) {
      console.error("[watercooler] unlike failed:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error("[watercooler] unlike failed with exception:", error);
    return { error: "Could not unlike post. Please try again." };
  }
}

/**
 * Get IDs of posts liked by a user
 */
export async function getUserLikedPostIds(
  userId: string,
  postIds: string[]
): Promise<{ likedPostIds: string[]; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { likedPostIds: [], error: "Supabase is not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("watercooler_post_likes")
      .select("post_id")
      .eq("user_id", userId)
      .in("post_id", postIds);

    if (error) {
      console.error("[watercooler] get liked post ids failed:", error);
      return { likedPostIds: [], error: error.message };
    }

    const likedPostIds = (data || []).map((like) => like.post_id);
    return { likedPostIds, error: null };
  } catch (error) {
    console.error("[watercooler] get liked post ids failed with exception:", error);
    return { likedPostIds: [], error: "Could not fetch liked posts. Please try again." };
  }
}

/**
 * Get comments for a post
 */
export async function getCommentsForPost(
  postId: string
): Promise<{ comments: WatercoolerComment[]; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { comments: [], error: "Supabase is not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("watercooler_post_comments")
      .select("id, post_id, user_id, nickname, body, status, created_at, updated_at")
      .eq("post_id", postId)
      .eq("status", "published")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[watercooler] get comments failed:", error);
      return { comments: [], error: error.message };
    }

    return { comments: data || [], error: null };
  } catch (error) {
    console.error("[watercooler] get comments failed with exception:", error);
    return { comments: [], error: "Could not load comments. Please try again." };
  }
}

/**
 * Create a comment on a post
 */
export async function createWatercoolerComment(
  postId: string,
  userId: string,
  nickname: string | null,
  body: string
): Promise<{ comment: WatercoolerComment | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { comment: null, error: "Supabase is not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("watercooler_post_comments")
      .insert({
        post_id: postId,
        user_id: userId,
        nickname: nickname || null,
        body,
        status: "published",
      })
      .select("id, post_id, user_id, nickname, body, status, created_at, updated_at")
      .maybeSingle();

    if (error) {
      console.error("[watercooler] create comment failed:", error);
      return { comment: null, error: error.message };
    }

    return { comment: data, error: null };
  } catch (error) {
    console.error("[watercooler] create comment failed with exception:", error);
    return { comment: null, error: "Could not post reply. Please try again." };
  }
}

/**
 * Delete own comment
 */
export async function deleteOwnWatercoolerComment(
  commentId: string,
  userId: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Supabase is not configured" };
  }

  try {
    const { error } = await supabase
      .from("watercooler_post_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId);

    if (error) {
      console.error("[watercooler] delete comment failed:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error("[watercooler] delete comment failed with exception:", error);
    return { error: "Could not delete reply. Please try again." };
  }
}

/**
 * Get trending watercooler posts (last 7 days, most liked)
 */
export async function getTrendingWatercoolerPosts(): Promise<{ posts: WatercoolerPost[]; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { posts: [], error: "Supabase is not configured" };
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("watercooler_posts")
      .select("id, user_id, nickname, body, mood_tag, media_url, media_type, likes_count, status, report_count, hidden_reason, hidden_by, hidden_at, created_at, updated_at")
      .eq("status", "published")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("likes_count", { ascending: false })
      .limit(3);

    if (error) {
      console.error("[watercooler] get trending posts failed:", error);
      return { posts: [], error: error.message };
    }

    return { posts: data || [], error: null };
  } catch (error) {
    console.error("[watercooler] get trending posts failed with exception:", error);
    return { posts: [], error: "Could not load trending posts. Please try again." };
  }
}
