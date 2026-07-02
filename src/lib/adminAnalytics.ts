import { supabase, isSupabaseConfigured } from "./supabase";
import { isAdminEmail } from "./adminSubmissions";

export { isAdminEmail };

export function isAdminUser(email?: string | null): boolean {
  return isAdminEmail(email);
}

export interface AdminOverviewMetrics {
  totalUsers: number;
  usersCreatedToday: number;
  usersCreatedThisWeek: number;
  totalWatercoolerPosts: number;
  totalStories: number;
  totalMessages: number;
  totalGameRooms: number;
  totalGamesFinished: number;
  totalXpAwarded: number;
  totalNotifications: number;
  unreadNotifications: number;
}

export interface AdminEngagementMetrics {
  moodCheckIns: number;
  breakActivities: number;
  watercoolerComments: number;
  likes: number;
  friendRequests: number;
  friendships: number;
  messagesSent: number;
  gamesPlayed: number;
  rewardsEvents: number;
}

export interface AdminContentMetrics {
  approvedStories: number;
  pendingStories: number;
  rejectedStories: number;
  watercoolerPosts: number;
  mediaPosts: number;
  reportsPending: number;
  reportsResolved: number;
}

export interface AdminGameMetrics {
  roomsWaiting: number;
  roomsActive: number;
  roomsFinished: number;
  invitesPending: number;
  invitesAccepted: number;
  gameResults: number;
  draws: number;
  wins: number;
}

export interface AdminRewardsMetrics {
  totalXpEvents: number;
  totalBadgesEarned: number;
  usersWithXp: number;
  averageLevel: number;
  topLevel: number;
  totalWeeklyXp: number;
}

export interface AdminRecentActivity {
  id: string;
  type: string;
  title: string;
  created_at: string;
  link_path?: string;
}

export interface AdminTopUser {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  weekly_xp: number;
}

export interface AdminTopWatercoolerPost {
  id: string;
  nickname: string | null;
  body: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  link_path: string;
}

function safeCount(count: number | null | undefined): number {
  return typeof count === "number" ? count : 0;
}

function startOfDay(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function getCount(table: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  try {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) {
      console.warn(`[admin-analytics] count ${table} failed:`, error.message);
      return 0;
    }
    return safeCount(count);
  } catch (err) {
    console.warn(`[admin-analytics] count ${table} exception:`, err);
    return 0;
  }
}

async function getCountWhere(
  table: string,
  column: string,
  value: string | number
): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  try {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(column, value);
    if (error) {
      console.warn(`[admin-analytics] count ${table} where failed:`, error.message);
      return 0;
    }
    return safeCount(count);
  } catch (err) {
    console.warn(`[admin-analytics] count ${table} where exception:`, err);
    return 0;
  }
}

async function getCountSince(table: string, since: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  try {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .gte("created_at", since);
    if (error) {
      console.warn(`[admin-analytics] count ${table} since failed:`, error.message);
      return 0;
    }
    return safeCount(count);
  } catch (err) {
    console.warn(`[admin-analytics] count ${table} since exception:`, err);
    return 0;
  }
}

export async function getAdminOverviewMetrics(): Promise<{ metrics: AdminOverviewMetrics; error: string | null }> {
  const metrics: AdminOverviewMetrics = {
    totalUsers: 0,
    usersCreatedToday: 0,
    usersCreatedThisWeek: 0,
    totalWatercoolerPosts: 0,
    totalStories: 0,
    totalMessages: 0,
    totalGameRooms: 0,
    totalGamesFinished: 0,
    totalXpAwarded: 0,
    totalNotifications: 0,
    unreadNotifications: 0,
  };

  if (!isSupabaseConfigured || !supabase) {
    return { metrics, error: "Supabase is not configured" };
  }

  try {
    const today = startOfDay();
    const week = startOfWeek();

    const [
      totalUsers,
      usersCreatedToday,
      usersCreatedThisWeek,
      totalWatercoolerPosts,
      totalStories,
      totalMessages,
      totalGameRooms,
      totalGamesFinished,
      totalNotifications,
      unreadNotifications,
    ] = await Promise.all([
      getCount("profiles"),
      getCountSince("profiles", today),
      getCountSince("profiles", week),
      getCount("watercooler_posts"),
      getCount("story_submissions"),
      getCount("direct_messages"),
      getCount("game_rooms"),
      getCountWhere("game_rooms", "status", "finished"),
      getCount("notifications"),
      getCountWhere("notifications", "is_read", false),
    ]);

    metrics.totalUsers = totalUsers;
    metrics.usersCreatedToday = usersCreatedToday;
    metrics.usersCreatedThisWeek = usersCreatedThisWeek;
    metrics.totalWatercoolerPosts = totalWatercoolerPosts;
    metrics.totalStories = totalStories;
    metrics.totalMessages = totalMessages;
    metrics.totalGameRooms = totalGameRooms;
    metrics.totalGamesFinished = totalGamesFinished;
    metrics.totalNotifications = totalNotifications;
    metrics.unreadNotifications = unreadNotifications;

    const { data: xpData, error: xpError } = await supabase
      .from("xp_events")
      .select("xp_amount")
      .limit(1000);
    if (!xpError && xpData) {
      metrics.totalXpAwarded = xpData.reduce((sum, e) => sum + (e.xp_amount || 0), 0);
    }
  } catch (err) {
    console.warn("[admin-analytics] overview metrics exception:", err);
  }

  return { metrics, error: null };
}

export async function getUserGrowthMetrics(): Promise<{ totalUsers: number; usersCreatedToday: number; usersCreatedThisWeek: number; error: string | null }> {
  const today = startOfDay();
  const week = startOfWeek();

  const [totalUsers, usersCreatedToday, usersCreatedThisWeek] = await Promise.all([
    getCount("profiles"),
    getCountSince("profiles", today),
    getCountSince("profiles", week),
  ]);

  return { totalUsers, usersCreatedToday, usersCreatedThisWeek, error: null };
}

export async function getEngagementMetrics(): Promise<{ metrics: AdminEngagementMetrics; error: string | null }> {
  const metrics: AdminEngagementMetrics = {
    moodCheckIns: 0,
    breakActivities: 0,
    watercoolerComments: 0,
    likes: 0,
    friendRequests: 0,
    friendships: 0,
    messagesSent: 0,
    gamesPlayed: 0,
    rewardsEvents: 0,
  };

  if (!isSupabaseConfigured || !supabase) {
    return { metrics, error: "Supabase is not configured" };
  }

  try {
    const [
      moodCheckIns,
      breakActivities,
      watercoolerComments,
      likes,
      friendRequests,
      friendships,
      messagesSent,
      gamesPlayed,
      rewardsEvents,
    ] = await Promise.all([
      getCountWhere("user_break_activity", "activity_type", "mood_check_in"),
      getCount("user_break_activity"),
      getCount("watercooler_post_comments"),
      getCount("watercooler_post_likes"),
      getCount("friend_requests"),
      getCount("friendships"),
      getCountWhere("direct_messages", "status", "sent"),
      getCount("game_results"),
      getCount("xp_events"),
    ]);

    metrics.moodCheckIns = moodCheckIns;
    metrics.breakActivities = breakActivities;
    metrics.watercoolerComments = watercoolerComments;
    metrics.likes = likes;
    metrics.friendRequests = friendRequests;
    metrics.friendships = friendships;
    metrics.messagesSent = messagesSent;
    metrics.gamesPlayed = gamesPlayed;
    metrics.rewardsEvents = rewardsEvents;
  } catch (err) {
    console.warn("[admin-analytics] engagement metrics exception:", err);
  }

  return { metrics, error: null };
}

export async function getContentMetrics(): Promise<{ metrics: AdminContentMetrics; error: string | null }> {
  const metrics: AdminContentMetrics = {
    approvedStories: 0,
    pendingStories: 0,
    rejectedStories: 0,
    watercoolerPosts: 0,
    mediaPosts: 0,
    reportsPending: 0,
    reportsResolved: 0,
  };

  if (!isSupabaseConfigured || !supabase) {
    return { metrics, error: "Supabase is not configured" };
  }

  try {
    const [
      approvedStories,
      pendingStories,
      rejectedStories,
      watercoolerPosts,
      mediaPosts,
      reportsPending,
      reportsResolved,
    ] = await Promise.all([
      getCountWhere("story_submissions", "status", "published"),
      getCountWhere("story_submissions", "status", "pending"),
      getCountWhere("story_submissions", "status", "rejected"),
      getCount("watercooler_posts"),
      getCountWhere("watercooler_posts", "media_type", "image"),
      getCountWhere("watercooler_post_reports", "status", "pending"),
      getCountWhere("watercooler_post_reports", "status", "resolved"),
    ]);

    metrics.approvedStories = approvedStories;
    metrics.pendingStories = pendingStories;
    metrics.rejectedStories = rejectedStories;
    metrics.watercoolerPosts = watercoolerPosts;
    metrics.mediaPosts = mediaPosts;
    metrics.reportsPending = reportsPending;
    metrics.reportsResolved = reportsResolved;
  } catch (err) {
    console.warn("[admin-analytics] content metrics exception:", err);
  }

  return { metrics, error: null };
}

export async function getGameMetrics(): Promise<{ metrics: AdminGameMetrics; error: string | null }> {
  const metrics: AdminGameMetrics = {
    roomsWaiting: 0,
    roomsActive: 0,
    roomsFinished: 0,
    invitesPending: 0,
    invitesAccepted: 0,
    gameResults: 0,
    draws: 0,
    wins: 0,
  };

  if (!isSupabaseConfigured || !supabase) {
    return { metrics, error: "Supabase is not configured" };
  }

  try {
    const [
      roomsWaiting,
      roomsActive,
      roomsFinished,
      invitesPending,
      invitesAccepted,
      gameResults,
      draws,
      wins,
    ] = await Promise.all([
      getCountWhere("game_rooms", "status", "waiting"),
      getCountWhere("game_rooms", "status", "active"),
      getCountWhere("game_rooms", "status", "finished"),
      getCountWhere("game_invites", "status", "pending"),
      getCountWhere("game_invites", "status", "accepted"),
      getCount("game_results"),
      getCountWhere("game_results", "result", "draw"),
      getCountWhere("game_results", "result", "player_one_win"),
    ]);

    metrics.roomsWaiting = roomsWaiting;
    metrics.roomsActive = roomsActive;
    metrics.roomsFinished = roomsFinished;
    metrics.invitesPending = invitesPending;
    metrics.invitesAccepted = invitesAccepted;
    metrics.gameResults = gameResults;
    metrics.draws = draws;
    metrics.wins = wins;
  } catch (err) {
    console.warn("[admin-analytics] game metrics exception:", err);
  }

  return { metrics, error: null };
}

export async function getRewardsMetrics(): Promise<{ metrics: AdminRewardsMetrics; error: string | null }> {
  const metrics: AdminRewardsMetrics = {
    totalXpEvents: 0,
    totalBadgesEarned: 0,
    usersWithXp: 0,
    averageLevel: 0,
    topLevel: 0,
    totalWeeklyXp: 0,
  };

  if (!isSupabaseConfigured || !supabase) {
    return { metrics, error: "Supabase is not configured" };
  }

  try {
    const [totalXpEvents, totalBadgesEarned, usersWithXp] = await Promise.all([
      getCount("xp_events"),
      getCount("user_badges"),
      getCount("user_xp"),
    ]);

    metrics.totalXpEvents = totalXpEvents;
    metrics.totalBadgesEarned = totalBadgesEarned;
    metrics.usersWithXp = usersWithXp;

    const { data: xpRows, error: xpError } = await supabase
      .from("user_xp")
      .select("level, weekly_xp")
      .limit(1000);

    if (!xpError && xpRows && xpRows.length > 0) {
      const totalLevel = xpRows.reduce((sum, row) => sum + (row.level || 0), 0);
      metrics.averageLevel = Math.round(totalLevel / xpRows.length);
      metrics.topLevel = Math.max(...xpRows.map((row) => row.level || 0));
      metrics.totalWeeklyXp = xpRows.reduce((sum, row) => sum + (row.weekly_xp || 0), 0);
    }
  } catch (err) {
    console.warn("[admin-analytics] rewards metrics exception:", err);
  }

  return { metrics, error: null };
}

export async function getRecentActivity(limit = 20): Promise<{ activity: AdminRecentActivity[]; error: string | null }> {
  const activity: AdminRecentActivity[] = [];

  if (!isSupabaseConfigured || !supabase) {
    return { activity, error: "Supabase is not configured" };
  }

  try {
    const [posts, stories, messages, games, xpEvents, notifications] = await Promise.all([
      supabase
        .from("watercooler_posts")
        .select("id, nickname, body, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("story_submissions")
        .select("id, title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("direct_messages")
        .select("id, body, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("game_results")
        .select("id, result, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("xp_events")
        .select("id, event_type, xp_amount, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("notifications")
        .select("id, title, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

    if (!posts.error && posts.data) {
      posts.data.forEach((p) => {
        activity.push({
          id: p.id,
          type: "watercooler_post",
          title: p.nickname ? `${p.nickname} posted` : "New watercooler post",
          created_at: p.created_at,
          link_path: "/watercooler",
        });
      });
    }

    if (!stories.error && stories.data) {
      stories.data.forEach((s) => {
        activity.push({
          id: s.id,
          type: "story_submission",
          title: s.title || "New story submission",
          created_at: s.created_at,
          link_path: "/admin-submissions",
        });
      });
    }

    if (!messages.error && messages.data) {
      messages.data.forEach((m) => {
        activity.push({
          id: m.id,
          type: "direct_message",
          title: "New direct message",
          created_at: m.created_at,
          link_path: "/messages",
        });
      });
    }

    if (!games.error && games.data) {
      games.data.forEach((g) => {
        activity.push({
          id: g.id,
          type: "game_result",
          title: g.result === "draw" ? "Game ended in a draw" : "Game finished",
          created_at: g.created_at,
          link_path: "/games-multiplayer",
        });
      });
    }

    if (!xpEvents.error && xpEvents.data) {
      xpEvents.data.forEach((e) => {
        activity.push({
          id: e.id,
          type: "xp_event",
          title: `${e.xp_amount || 0} XP awarded`,
          created_at: e.created_at,
          link_path: "/rewards",
        });
      });
    }

    if (!notifications.error && notifications.data) {
      notifications.data.forEach((n) => {
        activity.push({
          id: n.id,
          type: "notification",
          title: n.title || "New notification",
          created_at: n.created_at,
          link_path: n.link_path || "/notifications",
        });
      });
    }

    activity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    activity.splice(limit);
  } catch (err) {
    console.warn("[admin-analytics] recent activity exception:", err);
  }

  return { activity, error: null };
}

export async function getTopUsersByXP(limit = 10): Promise<{ users: AdminTopUser[]; error: string | null }> {
  const users: AdminTopUser[] = [];

  if (!isSupabaseConfigured || !supabase) {
    return { users, error: "Supabase is not configured" };
  }

  try {
    const { data: xpRows, error: xpError } = await supabase
      .from("user_xp")
      .select("user_id, level, total_xp, weekly_xp")
      .order("total_xp", { ascending: false })
      .limit(limit);

    if (xpError || !xpRows || xpRows.length === 0) {
      return { users, error: xpError ? 'Could not load top users right now.' : null };
    }

    const userIds = xpRows.map((row) => row.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .in("id", userIds);

    if (profileError) {
      console.warn("[admin-analytics] top users profiles failed:", profileError.message);
    }

    const profileMap = new Map();
    if (profiles) {
      profiles.forEach((p) => profileMap.set(p.id, p));
    }

    xpRows.forEach((row) => {
      const profile = profileMap.get(row.user_id) || {};
      users.push({
        user_id: row.user_id,
        display_name: profile.display_name || null,
        username: profile.username || null,
        avatar_url: profile.avatar_url || null,
        level: row.level || 1,
        total_xp: row.total_xp || 0,
        weekly_xp: row.weekly_xp || 0,
      });
    });
  } catch (err) {
    console.warn("[admin-analytics] top users exception:", err);
  }

  return { users, error: null };
}

export async function getTopWatercoolerPosts(limit = 10): Promise<{ posts: AdminTopWatercoolerPost[]; error: string | null }> {
  const posts: AdminTopWatercoolerPost[] = [];

  if (!isSupabaseConfigured || !supabase) {
    return { posts, error: "Supabase is not configured" };
  }

  try {
    const { data: postRows, error: postError } = await supabase
      .from("watercooler_posts")
      .select("id, nickname, body, likes_count, created_at")
      .order("likes_count", { ascending: false })
      .limit(limit);

    if (postError || !postRows || postRows.length === 0) {
      return { posts, error: postError ? 'Could not load top posts right now.' : null };
    }

    const postIds = postRows.map((p) => p.id);
    const { data: commentCounts, error: commentError } = await supabase
      .from("watercooler_post_comments")
      .select("post_id")
      .in("post_id", postIds);

    if (commentError) {
      console.warn("[admin-analytics] top posts comments failed:", commentError.message);
    }

    const commentMap = new Map<string, number>();
    if (commentCounts) {
      commentCounts.forEach((c) => {
        commentMap.set(c.post_id, (commentMap.get(c.post_id) || 0) + 1);
      });
    }

    postRows.forEach((p) => {
      posts.push({
        id: p.id,
        nickname: p.nickname || null,
        body: p.body || "",
        likes_count: p.likes_count || 0,
        comments_count: commentMap.get(p.id) || 0,
        created_at: p.created_at,
        link_path: "/watercooler",
      });
    });
  } catch (err) {
    console.warn("[admin-analytics] top posts exception:", err);
  }

  return { posts, error: null };
}
