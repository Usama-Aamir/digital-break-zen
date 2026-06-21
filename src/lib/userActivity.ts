import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface UserActivityInput {
  userId: string;
  activityType: 'mood_checkin' | 'breathing' | 'focus_timer' | 'game' | 'watercooler_post' | 'watercooler_like' | 'watercooler_comment' | 'story_draft' | 'story_submission';
  moodTag?: string;
  metadata?: Record<string, any>;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  mood_tag: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ActivitySummary {
  breaksThisWeek: number;
  moodCheckins: number;
  watercoolerContributions: number;
  storiesSubmitted: number;
  currentStreak: number;
}

export interface MoodSummary {
  calm: number;
  focus: number;
  happy: number;
  energize: number;
  reflect: number;
}

export interface ContributionSummary {
  postsCreated: number;
  repliesWritten: number;
  postsLiked: number;
  storiesSubmitted: number;
  draftsSaved: number;
}

export async function trackUserActivity(input: UserActivityInput): Promise<{ error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { error } = await supabase
      .from('user_break_activity')
      .insert({
        user_id: input.userId,
        activity_type: input.activityType,
        mood_tag: input.moodTag || null,
        metadata: input.metadata || {},
      });
    
    if (error) {
      console.warn('Failed to track user activity:', error.message);
      return { error: error.message };
    }
    
    return { error: null };
  } catch (err) {
    console.warn('Error tracking user activity:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getUserActivitySummary(userId: string): Promise<{ summary: ActivitySummary | null; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get activities from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: activities, error } = await supabase
      .from('user_break_activity')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString());
    
    if (error) {
      console.warn('Failed to get user activity summary:', error.message);
      return { summary: null, error: error.message };
    }
    
    if (!activities || activities.length === 0) {
      return { summary: { breaksThisWeek: 0, moodCheckins: 0, watercoolerContributions: 0, storiesSubmitted: 0, currentStreak: 0 }, error: null };
    }
    
    const breaksThisWeek = activities.length;
    const moodCheckins = activities.filter(a => a.activity_type === 'mood_checkin').length;
    const watercoolerContributions = activities.filter(a => a.activity_type.startsWith('watercooler')).length;
    const storiesSubmitted = activities.filter(a => a.activity_type === 'story_submission').length;
    
    // Calculate streak (consecutive days with activity)
    const streak = await getBreakStreak(userId);
    
    return {
      summary: {
        breaksThisWeek,
        moodCheckins,
        watercoolerContributions,
        storiesSubmitted,
        currentStreak: streak,
      },
      error: null,
    };
  } catch (err) {
    console.warn('Error getting user activity summary:', err);
    return { summary: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getRecentUserActivity(userId: string, limit: number = 10): Promise<{ activities: UserActivity[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('user_break_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.warn('Failed to get recent user activity:', error.message);
      return { activities: [], error: error.message };
    }
    
    return { activities: data || [], error: null };
  } catch (err) {
    console.warn('Error getting recent user activity:', err);
    return { activities: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getWeeklyMoodSummary(userId: string): Promise<{ summary: MoodSummary | null; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: activities, error } = await supabase
      .from('user_break_activity')
      .select('mood_tag')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .not('mood_tag', 'is', null);
    
    if (error) {
      console.warn('Failed to get weekly mood summary:', error.message);
      return { summary: null, error: error.message };
    }
    
    if (!activities || activities.length === 0) {
      return { summary: { calm: 0, focus: 0, happy: 0, energize: 0, reflect: 0 }, error: null };
    }
    
    const summary: MoodSummary = {
      calm: 0,
      focus: 0,
      happy: 0,
      energize: 0,
      reflect: 0,
    };
    
    activities.forEach(activity => {
      const mood = activity.mood_tag?.toLowerCase();
      if (mood?.includes('calm')) summary.calm++;
      else if (mood?.includes('focus')) summary.focus++;
      else if (mood?.includes('happy')) summary.happy++;
      else if (mood?.includes('energize')) summary.energize++;
      else if (mood?.includes('reflect')) summary.reflect++;
    });
    
    return { summary, error: null };
  } catch (err) {
    console.warn('Error getting weekly mood summary:', err);
    return { summary: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getBreakStreak(userId: string): Promise<number> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get all activities for the user
    const { data: activities, error } = await supabase
      .from('user_break_activity')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error || !activities || activities.length === 0) {
      return 0;
    }
    
    // Get unique dates of activities
    const dates = new Set<string>();
    activities.forEach(activity => {
      const date = new Date(activity.created_at).toDateString();
      dates.add(date);
    });
    
    const sortedDates = Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    // Calculate streak
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const dateStr of sortedDates) {
      const activityDate = new Date(dateStr);
      activityDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
        currentDate = activityDate;
      } else if (diffDays > streak) {
        break;
      }
    }
    
    return streak;
  } catch (err) {
    console.warn('Error getting break streak:', err);
    return 0;
  }
}

export async function getUserContributionSummary(userId: string): Promise<{ summary: ContributionSummary | null; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    let postsCreated = 0;
    let repliesWritten = 0;
    let postsLiked = 0;
    let storiesSubmitted = 0;
    let draftsSaved = 0;
    
    // Get watercooler posts
    try {
      const { data: posts, error: postsError } = await supabase
        .from('watercooler_posts')
        .select('id')
        .eq('user_id', userId);
      
      if (!postsError && posts) {
        postsCreated = posts.length;
      }
    } catch (e) {
      console.warn('Failed to get watercooler posts:', e);
    }
    
    // Get watercooler comments
    try {
      const { data: comments, error: commentsError } = await supabase
        .from('watercooler_post_comments')
        .select('id')
        .eq('user_id', userId);
      
      if (!commentsError && comments) {
        repliesWritten = comments.length;
      }
    } catch (e) {
      console.warn('Failed to get watercooler comments:', e);
    }
    
    // Get watercooler likes
    try {
      const { data: likes, error: likesError } = await supabase
        .from('watercooler_post_likes')
        .select('id')
        .eq('user_id', userId);
      
      if (!likesError && likes) {
        postsLiked = likes.length;
      }
    } catch (e) {
      console.warn('Failed to get watercooler likes:', e);
    }
    
    // Get story submissions
    try {
      const { data: submissions, error: submissionsError } = await supabase
        .from('story_submissions')
        .select('id')
        .eq('user_id', userId);
      
      if (!submissionsError && submissions) {
        storiesSubmitted = submissions.length;
      }
    } catch (e) {
      console.warn('Failed to get story submissions:', e);
    }
    
    // Get story drafts
    try {
      const { data: drafts, error: draftsError } = await supabase
        .from('story_drafts')
        .select('id')
        .eq('user_id', userId);
      
      if (!draftsError && drafts) {
        draftsSaved = drafts.length;
      }
    } catch (e) {
      console.warn('Failed to get story drafts:', e);
    }
    
    return {
      summary: {
        postsCreated,
        repliesWritten,
        postsLiked,
        storiesSubmitted,
        draftsSaved,
      },
      error: null,
    };
  } catch (err) {
    console.warn('Error getting user contribution summary:', err);
    return { summary: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
