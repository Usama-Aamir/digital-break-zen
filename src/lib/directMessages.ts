import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export interface DirectConversation {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  body: string;
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
  read_at: string | null;
}

export interface ConversationWithDetails {
  id: string;
  created_at: string;
  updated_at: string;
  friend_id: string;
  friend_display_name: string | null;
  friend_username: string | null;
  friend_avatar_url: string | null;
  friend_role_label: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

// Get or create direct conversation with a friend
export async function getOrCreateDirectConversation(friendId: string): Promise<{ conversationId: string | null; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { conversationId: null, error: 'Not authenticated' };
    }
    
    // Check if conversation already exists between these two users
    const { data: existingMembers } = await supabase
      .from('direct_conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);
    
    const conversationIds = existingMembers?.map(m => m.conversation_id) || [];
    
    if (conversationIds.length > 0) {
      // Check if friend is also a member of any of these conversations
      const { data: friendMembers } = await supabase
        .from('direct_conversation_members')
        .select('conversation_id')
        .eq('user_id', friendId)
        .in('conversation_id', conversationIds);
      
      if (friendMembers && friendMembers.length > 0) {
        return { conversationId: friendMembers[0].conversation_id, error: null };
      }
    }
    
    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('direct_conversations')
      .insert({})
      .select('id')
      .single();
    
    if (createError || !newConversation) {
      console.warn('Failed to create conversation:', createError?.message);
      return { conversationId: null, error: createError?.message || 'Failed to create conversation' };
    }
    
    // Add both users as members
    const { error: memberError } = await supabase
      .from('direct_conversation_members')
      .insert([
        { conversation_id: newConversation.id, user_id: user.id },
        { conversation_id: newConversation.id, user_id: friendId },
      ]);
    
    if (memberError) {
      console.warn('Failed to add conversation members:', memberError.message);
      return { conversationId: null, error: memberError.message };
    }
    
    return { conversationId: newConversation.id, error: null };
  } catch (err) {
    console.warn('Error getting or creating conversation:', err);
    return { conversationId: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get all direct conversations for a user
export async function getDirectConversations(userId: string): Promise<{ conversations: ConversationWithDetails[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Step 1: Get all conversation IDs where user is a member
    const { data: members, error: memberError } = await supabase
      .from('direct_conversation_members')
      .select('conversation_id')
      .eq('user_id', userId);
    
    if (memberError) {
      console.warn('Failed to get conversation members:', memberError.message);
      return { conversations: [], error: memberError.message };
    }
    
    if (!members || members.length === 0) {
      return { conversations: [], error: null };
    }
    
    const conversationIds = members.map(m => m.conversation_id);
    
    // Step 2: Get all members for these conversations
    const { data: allMembers, error: allMembersError } = await supabase
      .from('direct_conversation_members')
      .select('conversation_id, user_id')
      .in('conversation_id', conversationIds);
    
    if (allMembersError) {
      console.warn('Failed to get all conversation members:', allMembersError.message);
      return { conversations: [], error: allMembersError.message };
    }
    
    // Extract unique user IDs (excluding current user)
    const userIds = [...new Set((allMembers || [])
      .map((m: any) => m.user_id)
      .filter((id: string) => id !== userId))];
    
    // Step 3: Get profiles for all users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url, role_label')
      .in('id', userIds);
    
    if (profilesError) {
      console.warn('Failed to get profiles:', profilesError.message);
      return { conversations: [], error: profilesError.message };
    }
    
    // Create a map of user_id to profile
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    
    // Step 4: Get conversations with last message
    const { data: conversations, error: convError } = await supabase
      .from('direct_conversations')
      .select(`
        id,
        created_at,
        updated_at,
        direct_messages (
          body,
          created_at
        )
      `)
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });
    
    if (convError) {
      console.warn('Failed to get conversations:', convError.message);
      return { conversations: [], error: convError.message };
    }
    
    // Step 5: Transform data to include friend details and last message
    const transformedConversations: ConversationWithDetails[] = (conversations || []).map((conv: any) => {
      const friendMember = allMembers?.find((m: any) => m.conversation_id === conv.id && m.user_id !== userId);
      const friend = friendMember ? profileMap.get(friendMember.user_id) : null;
      const messages = conv.direct_messages || [];
      const lastMessage = messages[0];
      
      return {
        id: conv.id,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        friend_id: friend?.id || '',
        friend_display_name: friend?.display_name || null,
        friend_username: friend?.username || null,
        friend_avatar_url: friend?.avatar_url || null,
        friend_role_label: friend?.role_label || null,
        last_message: lastMessage?.body || null,
        last_message_at: lastMessage?.created_at || null,
        unread_count: 0, // TODO: Calculate unread count based on read_at
      };
    });
    
    return { conversations: transformedConversations, error: null };
  } catch (err) {
    console.warn('Error getting conversations:', err);
    return { conversations: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get messages for a specific conversation
export async function getDirectMessages(conversationId: string): Promise<{ messages: DirectMessage[]; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.warn('Failed to get messages:', error.message);
      return { messages: [], error: error.message };
    }
    
    return { messages: data || [], error: null };
  } catch (err) {
    console.warn('Error getting messages:', err);
    return { messages: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Send a direct message
export async function sendDirectMessage(conversationId: string, body: string): Promise<{ message: DirectMessage | null; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { message: null, error: 'Not authenticated' };
    }
    
    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: body.trim(),
        status: 'sent',
      })
      .select('*')
      .single();
    
    if (error) {
      console.warn('Failed to send message:', error.message);
      return { message: null, error: error.message };
    }
    
    return { message: data, error: null };
  } catch (err) {
    console.warn('Error sending message:', err);
    return { message: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Mark conversation as read (update read_at for messages sent to current user)
export async function markConversationRead(conversationId: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Not authenticated' };
    }
    
    const { error } = await supabase
      .from('direct_messages')
      .update({ read_at: new Date().toISOString(), status: 'read' })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .is('read_at', null);
    
    if (error) {
      console.warn('Failed to mark conversation as read:', error.message);
      return { error: error.message };
    }
    
    return { error: null };
  } catch (err) {
    console.warn('Error marking conversation as read:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Get unread message count for a user
export async function getUnreadMessageCount(userId: string): Promise<{ count: number; error: string | null }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get all conversation IDs where user is a member
    const { data: members } = await supabase
      .from('direct_conversation_members')
      .select('conversation_id')
      .eq('user_id', userId);
    
    if (!members || members.length === 0) {
      return { count: 0, error: null };
    }
    
    const conversationIds = members.map(m => m.conversation_id);
    
    // Count unread messages (sent by others, not read)
    const { count, error } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .is('read_at', null);
    
    if (error) {
      console.warn('Failed to get unread count:', error.message);
      return { count: 0, error: error.message };
    }
    
    return { count: count || 0, error: null };
  } catch (err) {
    console.warn('Error getting unread count:', err);
    return { count: 0, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
