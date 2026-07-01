import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// XP amounts for different event types
export const XP_AMOUNTS: Record<string, number> = {
  daily_check_in: 10,
  mood_check_in: 5,
  watercooler_post: 15,
  watercooler_comment: 8,
  watercooler_like_received: 3,
  story_submitted: 20,
  story_approved: 40,
  game_played: 15,
  game_won: 30,
  game_draw: 10,
  friend_added: 20,
  message_sent: 2,
  break_completed: 10,
};

// Daily cap for message XP
const MESSAGE_XP_DAILY_CAP = 10;

export interface UserXP {
  id: string;
  user_id: string;
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  weekly_xp: number;
  weekly_reset_at: string;
  created_at: string;
  updated_at: string;
}

export interface XPEvent {
  id: string;
  user_id: string;
  event_type: string;
  xp_amount: number;
  source_id: string | null;
  source_table: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Badge {
  id: string;
  badge_key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  source_event_id: string | null;
  badge: Badge;
}

export interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  weekly_xp: number;
  level: number;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

// Get user XP record
export async function getUserXP(userId: string): Promise<{ userXP: UserXP | null; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.warn('Failed to get user XP:', error.message);
      return { userXP: null, error: error.message };
    }
    
    return { userXP: data, error: null };
  } catch (err) {
    console.warn('Error getting user XP:', err);
    return { userXP: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Ensure user XP record exists
export async function ensureUserXP(userId: string): Promise<{ userXP: UserXP | null; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // First try to get existing record
    const { data: existing, error: getError } = await supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existing) {
      return { userXP: existing, error: null };
    }
    
    // Create new record
    const { data, error } = await supabase
      .from('user_xp')
      .insert({
        user_id: userId,
        total_xp: 0,
        level: 1,
        current_streak: 0,
        longest_streak: 0,
        weekly_xp: 0,
      })
      .select()
      .maybeSingle();
    
    if (error) {
      console.warn('Failed to create user XP:', error.message);
      return { userXP: null, error: error.message };
    }
    
    return { userXP: data, error: null };
  } catch (err) {
    console.warn('Error ensuring user XP:', err);
    return { userXP: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Calculate level from total XP
export function calculateLevel(totalXp: number): number {
  return Math.floor(totalXp / 100) + 1;
}

// Update streak based on activity
export function updateStreak(existingUserXP: UserXP, today: Date = new Date()): { current_streak: number; longest_streak: number; last_activity_date: string } {
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  let currentStreak = existingUserXP.current_streak;
  let longestStreak = existingUserXP.longest_streak;
  
  if (existingUserXP.last_activity_date === yesterdayStr) {
    // Activity yesterday, continue streak
    currentStreak += 1;
  } else if (existingUserXP.last_activity_date === todayStr) {
    // Activity already today, streak unchanged
    currentStreak = existingUserXP.current_streak;
  } else {
    // Streak broken or first activity
    currentStreak = 1;
  }
  
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }
  
  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_activity_date: todayStr,
  };
}

// Award XP to user
export async function awardXP(
  userId: string,
  eventType: string,
  sourceId?: string,
  sourceTable?: string,
  metadata?: Record<string, any>
): Promise<{ userXP: UserXP | null; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get XP amount
    const xpAmount = XP_AMOUNTS[eventType] || 0;
    if (xpAmount === 0) {
      return { userXP: null, error: 'Invalid event type or no XP for this event' };
    }
    
    // Check daily cap for messages
    if (eventType === 'message_sent') {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayEvents } = await supabase
        .from('xp_events')
        .select('xp_amount')
        .eq('user_id', userId)
        .eq('event_type', 'message_sent')
        .gte('created_at', `${today}T00:00:00.000Z`);
      
      const todayMessageXP = todayEvents?.reduce((sum, e) => sum + e.xp_amount, 0) || 0;
      if (todayMessageXP >= MESSAGE_XP_DAILY_CAP) {
        return { userXP: null, error: null }; // Cap reached, no error but no XP
      }
    }
    
    // Ensure user XP record exists
    const { userXP: existingUserXP, error: ensureError } = await ensureUserXP(userId);
    if (ensureError || !existingUserXP) {
      return { userXP: null, error: ensureError || 'Failed to ensure user XP' };
    }
    
    // Check weekly reset
    const now = new Date();
    const weeklyResetAt = new Date(existingUserXP.weekly_reset_at);
    const daysSinceReset = (now.getTime() - weeklyResetAt.getTime()) / (1000 * 60 * 60 * 24);
    
    let weeklyXp = existingUserXP.weekly_xp;
    let weeklyResetAtValue = existingUserXP.weekly_reset_at;
    
    if (daysSinceReset >= 7) {
      weeklyXp = 0;
      weeklyResetAtValue = now.toISOString();
    }
    
    // Update streak
    const streakUpdate = updateStreak(existingUserXP);
    
    // Calculate new totals
    const newTotalXp = existingUserXP.total_xp + xpAmount;
    const newWeeklyXp = weeklyXp + xpAmount;
    const newLevel = calculateLevel(newTotalXp);
    
    // Update user XP
    const { data: updatedUserXP, error: updateError } = await supabase
      .from('user_xp')
      .update({
        total_xp: newTotalXp,
        level: newLevel,
        current_streak: streakUpdate.current_streak,
        longest_streak: streakUpdate.longest_streak,
        last_activity_date: streakUpdate.last_activity_date,
        weekly_xp: newWeeklyXp,
        weekly_reset_at: weeklyResetAtValue,
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    
    if (updateError) {
      console.warn('Failed to update user XP:', updateError.message);
      return { userXP: null, error: updateError.message };
    }
    
    // Create XP event
    const { error: eventError } = await supabase
      .from('xp_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        xp_amount: xpAmount,
        source_id: sourceId || null,
        source_table: sourceTable || null,
        metadata: metadata || {},
      });
    
    if (eventError) {
      console.warn('Failed to create XP event:', eventError.message);
      // Continue anyway, XP was awarded
    }
    
    // Check and award badges
    await checkAndAwardBadges(userId);
    
    return { userXP: updatedUserXP, error: null };
  } catch (err) {
    console.warn('Error awarding XP:', err);
    return { userXP: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get badge definitions
export async function getBadgeDefinitions(): Promise<{ badges: Badge[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('category');
    
    if (error) {
      console.warn('Failed to get badge definitions:', error.message);
      return { badges: [], error: error.message };
    }
    
    return { badges: data || [], error: null };
  } catch (err) {
    console.warn('Error getting badge definitions:', err);
    return { badges: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get user badges
export async function getUserBadges(userId: string): Promise<{ userBadges: UserBadge[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
    
    if (error) {
      console.warn('Failed to get user badges:', error.message);
      return { userBadges: [], error: error.message };
    }
    
    const userBadges = data?.map(ub => ({
      ...ub,
      badge: ub.badges,
    })) || [];
    
    return { userBadges, error: null };
  } catch (err) {
    console.warn('Error getting user badges:', err);
    return { userBadges: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Check and award badges based on user activity
export async function checkAndAwardBadges(userId: string): Promise<{ awardedBadges: Badge[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get user XP
    const { userXP, error: xpError } = await getUserXP(userId);
    if (xpError || !userXP) {
      return { awardedBadges: [], error: xpError || 'Failed to get user XP' };
    }
    
    // Get user's existing badges
    const { userBadges, error: badgesError } = await getUserBadges(userId);
    if (badgesError) {
      return { awardedBadges: [], error: badgesError };
    }
    
    const earnedBadgeKeys = new Set(userBadges.map(ub => ub.badge.badge_key));
    const awardedBadges: Badge[] = [];
    
    // Get all badge definitions
    const { badges } = await getBadgeDefinitions();
    
    // Get user's XP events for counting
    const { data: xpEvents } = await supabase
      .from('xp_events')
      .select('event_type')
      .eq('user_id', userId);
    
    const eventCounts = xpEvents?.reduce((acc, e) => {
      acc[e.event_type] = (acc[e.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    // Check each badge
    for (const badge of badges) {
      if (earnedBadgeKeys.has(badge.badge_key)) continue;
      
      let shouldAward = false;
      
      switch (badge.badge_key) {
        case 'first_break':
          shouldAward = eventCounts['break_completed'] > 0 || eventCounts['mood_check_in'] > 0;
          break;
        case 'streak_3':
          shouldAward = userXP.current_streak >= 3;
          break;
        case 'streak_7':
          shouldAward = userXP.current_streak >= 7;
          break;
        case 'social_starter':
          shouldAward = eventCounts['friend_added'] > 0 || eventCounts['message_sent'] > 0;
          break;
        case 'first_game':
          shouldAward = eventCounts['game_played'] > 0;
          break;
        case 'first_win':
          shouldAward = eventCounts['game_won'] > 0;
          break;
        case 'story_sharer':
          shouldAward = eventCounts['story_submitted'] > 0;
          break;
        case 'watercooler_voice':
          shouldAward = eventCounts['watercooler_post'] > 0;
          break;
        case 'level_5':
          shouldAward = userXP.level >= 5;
          break;
        case 'level_10':
          shouldAward = userXP.level >= 10;
          break;
      }
      
      if (shouldAward) {
        // Award badge
        const { error: insertError } = await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badge.id,
          });
        
        if (!insertError) {
          awardedBadges.push(badge);
        }
      }
    }
    
    // Award badge XP rewards
    for (const badge of awardedBadges) {
      if (badge.xp_reward > 0) {
        await awardXP(userId, 'badge_awarded', badge.id, 'badges', { badge_key: badge.badge_key });
      }
    }
    
    return { awardedBadges, error: null };
  } catch (err) {
    console.warn('Error checking and awarding badges:', err);
    return { awardedBadges: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get recent XP events
export async function getRecentXPEvents(userId: string, limit: number = 20): Promise<{ events: XPEvent[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('xp_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.warn('Failed to get recent XP events:', error.message);
      return { events: [], error: error.message };
    }
    
    return { events: data || [], error: null };
  } catch (err) {
    console.warn('Error getting recent XP events:', err);
    return { events: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get leaderboard
export async function getLeaderboard(type: 'weekly' | 'all_time' = 'weekly', limit: number = 20): Promise<{ leaderboard: LeaderboardEntry[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get user XP records
    const { data: userXPData, error: xpError } = await supabase
      .from('user_xp')
      .select('user_id, total_xp, weekly_xp, level')
      .order(type === 'weekly' ? 'weekly_xp' : 'total_xp', { ascending: false })
      .limit(limit);
    
    if (xpError) {
      console.warn('Failed to get leaderboard:', xpError.message);
      return { leaderboard: [], error: xpError.message };
    }
    
    if (!userXPData || userXPData.length === 0) {
      return { leaderboard: [], error: null };
    }
    
    // Get profiles for leaderboard entries (two-step query)
    const userIds = userXPData.map(u => u.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    const leaderboard: LeaderboardEntry[] = userXPData.map(u => ({
      user_id: u.user_id,
      total_xp: u.total_xp,
      weekly_xp: u.weekly_xp,
      level: u.level,
      display_name: profileMap.get(u.user_id)?.display_name || null,
      username: profileMap.get(u.user_id)?.username || null,
      avatar_url: profileMap.get(u.user_id)?.avatar_url || null,
    }));
    
    return { leaderboard, error: null };
  } catch (err) {
    console.warn('Error getting leaderboard:', err);
    return { leaderboard: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get friend leaderboard
export async function getFriendLeaderboard(userId: string, type: 'weekly' | 'all_time' = 'weekly', limit: number = 20): Promise<{ leaderboard: LeaderboardEntry[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get user's friends
    const { data: friendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');
    
    const friendIds = friendships?.map(f => f.friend_id) || [];
    friendIds.push(userId); // Include user themselves
    
    // Get user XP records for friends
    const { data: userXPData, error: xpError } = await supabase
      .from('user_xp')
      .select('user_id, total_xp, weekly_xp, level')
      .in('user_id', friendIds)
      .order(type === 'weekly' ? 'weekly_xp' : 'total_xp', { ascending: false })
      .limit(limit);
    
    if (xpError) {
      console.warn('Failed to get friend leaderboard:', xpError.message);
      return { leaderboard: [], error: xpError.message };
    }
    
    if (!userXPData || userXPData.length === 0) {
      return { leaderboard: [], error: null };
    }
    
    // Get profiles for leaderboard entries
    const userIds = userXPData.map(u => u.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    const leaderboard: LeaderboardEntry[] = userXPData.map(u => ({
      user_id: u.user_id,
      total_xp: u.total_xp,
      weekly_xp: u.weekly_xp,
      level: u.level,
      display_name: profileMap.get(u.user_id)?.display_name || null,
      username: profileMap.get(u.user_id)?.username || null,
      avatar_url: profileMap.get(u.user_id)?.avatar_url || null,
    }));
    
    return { leaderboard, error: null };
  } catch (err) {
    console.warn('Error getting friend leaderboard:', err);
    return { leaderboard: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
