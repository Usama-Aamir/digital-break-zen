import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role_label: string | null;
}

export interface FriendRequest {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
}

// Search users by username or display name (public profile fields only)
export async function searchUsers(query: string, currentUserId: string): Promise<{ users: UserProfile[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url, role_label')
      .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
      .neq('id', currentUserId)
      .limit(20);
    
    if (error) {
      console.warn('Failed to search users:', error.message);
      return { users: [], error: error.message };
    }
    
    return { users: data || [], error: null };
  } catch (err) {
    console.warn('Error searching users:', err);
    return { users: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Send friend request
export async function sendFriendRequest(receiverId: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Not authenticated' };
    }
    
    const { error } = await supabase
      .from('friend_requests')
      .insert({
        requester_id: user.id,
        receiver_id: receiverId,
        status: 'pending',
      });
    
    if (error) {
      console.warn('Failed to send friend request:', error.message);
      return { error: error.message };
    }
    
    return { error: null };
  } catch (err) {
    console.warn('Error sending friend request:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get incoming friend requests
export async function getIncomingFriendRequests(userId: string): Promise<{ requests: FriendRequest[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Failed to get incoming friend requests:', error.message);
      return { requests: [], error: error.message };
    }
    
    return { requests: data || [], error: null };
  } catch (err) {
    console.warn('Error getting incoming friend requests:', err);
    return { requests: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get outgoing friend requests
export async function getOutgoingFriendRequests(userId: string): Promise<{ requests: FriendRequest[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('requester_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Failed to get outgoing friend requests:', error.message);
      return { requests: [], error: error.message };
    }
    
    return { requests: data || [], error: null };
  } catch (err) {
    console.warn('Error getting outgoing friend requests:', err);
    return { requests: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Accept friend request and create friendships
export async function acceptFriendRequest(requestId: string, requesterId: string, receiverId: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Update friend request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .eq('receiver_id', receiverId);
    
    if (updateError) {
      console.warn('Failed to accept friend request:', updateError.message);
      return { error: updateError.message };
    }
    
    // Create two friendship rows (bidirectional)
    const { error: insertError } = await supabase
      .from('friendships')
      .insert([
        { user_id: requesterId, friend_id: receiverId },
        { user_id: receiverId, friend_id: requesterId },
      ]);
    
    if (insertError) {
      console.warn('Failed to create friendships:', insertError.message);
      return { error: insertError.message };
    }
    
    return { error: null };
  } catch (err) {
    console.warn('Error accepting friend request:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Reject friend request
export async function rejectFriendRequest(requestId: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
    
    if (error) {
      console.warn('Failed to reject friend request:', error.message);
      return { error: error.message };
    }
    
    return { error: null };
  } catch (err) {
    console.warn('Error rejecting friend request:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Cancel friend request
export async function cancelFriendRequest(requestId: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId);
    
    if (error) {
      console.warn('Failed to cancel friend request:', error.message);
      return { error: error.message };
    }
    
    return { error: null };
  } catch (err) {
    console.warn('Error cancelling friend request:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get friends list
export async function getFriends(userId: string): Promise<{ friends: UserProfile[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        friend_id,
        profiles!friendships_friend_id_fkey (
          id,
          display_name,
          username,
          avatar_url,
          role_label
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Failed to get friends:', error.message);
      return { friends: [], error: error.message };
    }
    
    const friends = data?.map((f: any) => f.profiles).filter(Boolean) || [];
    return { friends, error: null };
  } catch (err) {
    console.warn('Error getting friends:', err);
    return { friends: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Remove friend
export async function removeFriend(friendId: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Not authenticated' };
    }
    
    // Delete both friendship rows (bidirectional)
    const { error } = await supabase
      .from('friendships')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
      .delete();
    
    if (error) {
      console.warn('Failed to remove friend:', error.message);
      return { error: error.message };
    }
    
    return { error: null };
  } catch (err) {
    console.warn('Error removing friend:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Check if two users are friends
export async function areFriends(userId: string, friendId: string): Promise<{ isFriend: boolean; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', userId)
      .eq('friend_id', friendId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.warn('Failed to check friendship:', error.message);
      return { isFriend: false, error: error.message };
    }
    
    return { isFriend: !!data, error: null };
  } catch (err) {
    console.warn('Error checking friendship:', err);
    return { isFriend: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Check if friend request exists and its status
export async function getFriendRequestStatus(requesterId: string, receiverId: string): Promise<{ status: string | null; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('friend_requests')
      .select('status')
      .eq('requester_id', requesterId)
      .eq('receiver_id', receiverId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.warn('Failed to get friend request status:', error.message);
      return { status: null, error: error.message };
    }
    
    return { status: data?.status || null, error: null };
  } catch (err) {
    console.warn('Error getting friend request status:', err);
    return { status: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
