import { createClient } from '@supabase/supabase-js';
import { getDisplayName } from './profiles';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'direct_message'
  | 'game_invite'
  | 'game_invite_accepted'
  | 'game_invite_rejected'
  | 'badge_unlocked'
  | 'xp_earned'
  | 'story_approved'
  | 'story_rejected'
  | 'watercooler_reply'
  | 'watercooler_like'
  | 'system_notice';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  actor_profile?: { display_name: string | null; username: string | null; avatar_url: string | null } | null;
  type: NotificationType;
  title: string;
  body: string | null;
  link_path: string | null;
  source_table: string | null;
  source_id: string | null;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationParams {
  user_id: string;
  actor_id?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  link_path?: string | null;
  source_table?: string | null;
  source_id?: string | null;
  metadata?: Record<string, any>;
}

function getClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function createNotification(
  params: CreateNotificationParams
): Promise<{ notification: Notification | null; error: string | null }> {
  try {
    const supabase = getClient();

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.user_id,
        actor_id: params.actor_id ?? null,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        link_path: params.link_path ?? null,
        source_table: params.source_table ?? null,
        source_id: params.source_id ?? null,
        metadata: params.metadata ?? {},
      })
      .select()
      .single();

    if (error) {
      console.warn('Failed to create notification:', error.message);
      return { notification: null, error: error.message };
    }

    return { notification: data as Notification, error: null };
  } catch (err) {
    console.warn('Error creating notification:', err);
    return { notification: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getNotifications(
  userId: string,
  limit = 30
): Promise<{ notifications: Notification[]; error: string | null }> {
  try {
    const supabase = getClient();

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Failed to get notifications:', error.message);
      return { notifications: [], error: error.message };
    }

    const notifications = (data || []) as Notification[];

    // Merge actor profiles safely
    const actorIds = [...new Set(notifications.map(n => n.actor_id).filter(Boolean))];
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .in('id', actorIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p as { display_name: string | null; username: string | null; avatar_url: string | null }])
      );

      notifications.forEach(n => {
        if (n.actor_id) {
          n.actor_profile = profileMap.get(n.actor_id) || null;
        }
      });
    }

    return { notifications, error: null };
  } catch (err) {
    console.warn('Error getting notifications:', err);
    return { notifications: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getUnreadNotificationCount(
  userId: string
): Promise<{ count: number; error: string | null }> {
  try {
    const supabase = getClient();

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.warn('Failed to get unread notification count:', error.message);
      return { count: 0, error: error.message };
    }

    return { count: count || 0, error: null };
  } catch (err) {
    console.warn('Error getting unread notification count:', err);
    return { count: 0, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function markNotificationRead(
  notificationId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getClient();

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.warn('Failed to mark notification read:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.warn('Error marking notification read:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function markAllNotificationsRead(
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getClient();

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.warn('Failed to mark all notifications read:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.warn('Error marking all notifications read:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getClient();

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.warn('Failed to delete notification:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.warn('Error deleting notification:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function subscribeToNotifications(
  userId: string,
  callback: (payload: { event: 'INSERT' | 'UPDATE' | 'DELETE'; notification: Notification }) => void
) {
  try {
    const supabase = getClient();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback({
            event: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            notification: payload.new as Notification,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Notifications realtime subscription error');
        }
      });

    return channel;
  } catch (err) {
    console.warn('Error subscribing to notifications:', err);
    return null;
  }
}

export async function fetchActorProfiles(
  actorIds: string[]
): Promise<Map<string, { display_name: string | null; username: string | null; avatar_url: string | null }>> {
  if (actorIds.length === 0) return new Map();

  try {
    const supabase = getClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', [...new Set(actorIds)]);

    if (error || !data) {
      console.warn('Failed to fetch actor profiles:', error?.message);
      return new Map();
    }

    return new Map(
      data.map(p => [p.id, p as { display_name: string | null; username: string | null; avatar_url: string | null }])
    );
  } catch (err) {
    console.warn('Error fetching actor profiles:', err);
    return new Map();
  }
}

export function formatActorName(
  profile: { display_name: string | null; username: string | null; avatar_url: string | null } | null | undefined
): string {
  if (!profile) return 'Someone';
  return profile.display_name || profile.username || 'Someone';
}
