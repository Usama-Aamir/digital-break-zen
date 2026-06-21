-- Supabase Database Schema for The Digital Breakroom
-- This file contains the SQL schema for future community story publishing
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
-- Stores user profile information linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  role_label TEXT,
  preferred_mood TEXT,
  language TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Story submissions table
-- Stores community story submissions for moderation and publishing
CREATE TABLE IF NOT EXISTS public.story_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  email TEXT,
  story_type TEXT,
  title TEXT,
  category TEXT,
  mood_tag TEXT,
  body TEXT,
  anonymous BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.story_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for story_submissions
-- Users can insert their own submissions
CREATE POLICY "Users can insert own submissions"
  ON public.story_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON public.story_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own submissions
CREATE POLICY "Users can update own submissions"
  ON public.story_submissions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own submissions
CREATE POLICY "Users can delete own submissions"
  ON public.story_submissions FOR DELETE
  USING (auth.uid() = user_id);

-- Public cannot see pending submissions (only published ones will be visible)
-- This policy will be updated when moderation is implemented
CREATE POLICY "Public cannot see pending submissions"
  ON public.story_submissions FOR SELECT
  USING (status = 'published');

-- Story drafts table
-- Stores user's story drafts in the cloud
CREATE TABLE IF NOT EXISTS public.story_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  category TEXT,
  mood_tag TEXT,
  body TEXT,
  anonymous BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.story_drafts ENABLE ROW LEVEL SECURITY;

-- RLS policies for story_drafts
-- Users can insert their own drafts
CREATE POLICY "Users can insert own drafts"
  ON public.story_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own drafts
CREATE POLICY "Users can view own drafts"
  ON public.story_drafts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own drafts
CREATE POLICY "Users can update own drafts"
  ON public.story_drafts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own drafts
CREATE POLICY "Users can delete own drafts"
  ON public.story_drafts FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_story_submissions_user_id ON public.story_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_story_submissions_status ON public.story_submissions(status);
CREATE INDEX IF NOT EXISTS idx_story_submissions_created_at ON public.story_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_drafts_user_id ON public.story_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_story_drafts_updated_at ON public.story_drafts(updated_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_story_submissions_updated_at BEFORE UPDATE ON public.story_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_story_drafts_updated_at BEFORE UPDATE ON public.story_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Watercooler posts table
-- Stores short casual community posts for the Watercooler Wall
CREATE TABLE IF NOT EXISTS public.watercooler_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nickname TEXT,
  body TEXT NOT NULL,
  mood_tag TEXT,
  media_url TEXT,
  media_type TEXT,
  likes_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published',
  report_count INTEGER DEFAULT 0,
  hidden_reason TEXT,
  hidden_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  hidden_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.watercooler_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for watercooler_posts
-- Public can select published posts
CREATE POLICY "Public can view published posts"
  ON public.watercooler_posts FOR SELECT
  USING (status = 'published');

-- Authenticated users can insert posts with their own user_id
CREATE POLICY "Users can insert own posts"
  ON public.watercooler_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON public.watercooler_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
  ON public.watercooler_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_watercooler_posts_user_id ON public.watercooler_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_watercooler_posts_status ON public.watercooler_posts(status);
CREATE INDEX IF NOT EXISTS idx_watercooler_posts_created_at ON public.watercooler_posts(created_at DESC);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_watercooler_posts_updated_at BEFORE UPDATE ON public.watercooler_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Watercooler post reports table
-- Stores reports on Watercooler posts for moderation
CREATE TABLE IF NOT EXISTS public.watercooler_post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.watercooler_posts(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.watercooler_post_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for watercooler_post_reports
-- Authenticated users can insert reports
CREATE POLICY "Users can insert reports"
  ON public.watercooler_post_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON public.watercooler_post_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_watercooler_post_reports_post_id ON public.watercooler_post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_watercooler_post_reports_reporter_id ON public.watercooler_post_reports(reporter_id);

-- Safe alter table statements for existing profiles table
-- These will add columns if they don't exist, without causing errors if they do
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_label TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_mood TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Safe alter table statements for existing watercooler_posts table
-- These will add moderation columns if they don't exist
ALTER TABLE public.watercooler_posts ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
ALTER TABLE public.watercooler_posts ADD COLUMN IF NOT EXISTS hidden_reason TEXT;
ALTER TABLE public.watercooler_posts ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.watercooler_posts ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ;
ALTER TABLE public.watercooler_posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- ============================================================================
-- WATERCOOLER POST LIKES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.watercooler_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.watercooler_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- RLS for watercooler_post_likes
ALTER TABLE public.watercooler_post_likes ENABLE ROW LEVEL SECURITY;

-- Public can view likes (for like counts)
CREATE POLICY "Public can view watercooler post likes"
  ON public.watercooler_post_likes FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert their own likes
CREATE POLICY "Authenticated users can insert own like"
  ON public.watercooler_post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own likes
CREATE POLICY "Authenticated users can delete own like"
  ON public.watercooler_post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for watercooler_post_likes
CREATE INDEX IF NOT EXISTS idx_watercooler_post_likes_post_id ON public.watercooler_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_watercooler_post_likes_user_id ON public.watercooler_post_likes(user_id);

-- Function to increment likes_count on post when like is inserted
CREATE OR REPLACE FUNCTION increment_watercooler_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.watercooler_posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment likes_count on like insert
DROP TRIGGER IF EXISTS trigger_increment_watercooler_post_likes_count ON public.watercooler_post_likes;
CREATE TRIGGER trigger_increment_watercooler_post_likes_count
  AFTER INSERT ON public.watercooler_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_watercooler_post_likes_count();

-- Function to decrement likes_count on post when like is deleted
CREATE OR REPLACE FUNCTION decrement_watercooler_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.watercooler_posts
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to decrement likes_count on like delete
DROP TRIGGER IF EXISTS trigger_decrement_watercooler_post_likes_count ON public.watercooler_post_likes;
CREATE TRIGGER trigger_decrement_watercooler_post_likes_count
  AFTER DELETE ON public.watercooler_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_watercooler_post_likes_count();

-- ============================================================================
-- WATERCOOLER POST COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.watercooler_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.watercooler_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nickname TEXT,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for watercooler_post_comments
ALTER TABLE public.watercooler_post_comments ENABLE ROW LEVEL SECURITY;

-- Public can view published comments
CREATE POLICY "Public can view published watercooler post comments"
  ON public.watercooler_post_comments FOR SELECT
  TO public
  USING (status = 'published');

-- Authenticated users can insert comments with own user_id
CREATE POLICY "Authenticated users can insert own comment"
  ON public.watercooler_post_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own watercooler post comments"
  ON public.watercooler_post_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own watercooler post comments"
  ON public.watercooler_post_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin can update all comments
CREATE POLICY "Admin can update all watercooler post comments"
  ON public.watercooler_post_comments FOR UPDATE
  TO authenticated
  USING (
    auth.jwt()->>'email' = 'aamirusama8@gmail.com'
  );

-- Indexes for watercooler_post_comments
CREATE INDEX IF NOT EXISTS idx_watercooler_post_comments_post_id ON public.watercooler_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_watercooler_post_comments_user_id ON public.watercooler_post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_watercooler_post_comments_status ON public.watercooler_post_comments(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_watercooler_post_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on comment update
DROP TRIGGER IF EXISTS trigger_update_watercooler_post_comments_updated_at ON public.watercooler_post_comments;
CREATE TRIGGER trigger_update_watercooler_post_comments_updated_at
  BEFORE UPDATE ON public.watercooler_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_watercooler_post_comments_updated_at();

-- ============================================================================
-- SUPABASE STORAGE SETUP FOR WATERCOOLER MEDIA
-- ============================================================================
-- 
-- The following setup must be done manually in the Supabase Dashboard:
--
-- 1. Create Storage Bucket:
--    - Go to Storage → New bucket
--    - Bucket name: watercooler-media
--    - Make bucket public: YES (this allows public read access)
--    - File size limit: 25MB (to support video uploads)
--
-- 2. Storage Policies (SQL):
--    Run the following policies in Supabase SQL Editor:
--
--    -- Public read policy (allow anyone to read files)
--    CREATE POLICY "Public can read watercooler media"
--      ON storage.objects FOR SELECT
--      TO public
--      USING (bucket_id = 'watercooler-media');
--
--    -- Authenticated upload policy (allow logged-in users to upload)
--    CREATE POLICY "Authenticated users can upload watercooler media"
--      ON storage.objects FOR INSERT
--      TO authenticated
--      WITH CHECK (
--        bucket_id = 'watercooler-media' AND
--        auth.uid()::text = (storage.foldername(name))[1]
--      );
--
--    -- User can delete own files (optional, for future deletion feature)
--    CREATE POLICY "Users can delete own watercooler media"
--      ON storage.objects FOR DELETE
--      TO authenticated
--      USING (
--        bucket_id = 'watercooler-media' AND
--        auth.uid()::text = (storage.foldername(name))[1]
--      );
--
-- Note: The path format used by the app is: user_id/timestamp-filename
-- This ensures users can only upload to their own folder and delete their own files.

-- ============================================================================
-- USER BREAK ACTIVITY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_break_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  mood_tag TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for user_break_activity
ALTER TABLE public.user_break_activity ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view their own activity
CREATE POLICY "Users can view own break activity"
  ON public.user_break_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own activity
CREATE POLICY "Users can insert own break activity"
  ON public.user_break_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own activity
CREATE POLICY "Users can delete own break activity"
  ON public.user_break_activity FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for user_break_activity
CREATE INDEX IF NOT EXISTS idx_user_break_activity_user_id ON public.user_break_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_break_activity_activity_type ON public.user_break_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_break_activity_created_at ON public.user_break_activity(created_at DESC);

-- ============================================================================
-- FRIEND REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester_id, receiver_id),
  CHECK (requester_id != receiver_id)
);

-- RLS for friend_requests
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert friend requests as requester
CREATE POLICY "Users can insert own friend requests"
  ON public.friend_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Users can view friend requests where they are requester or receiver
CREATE POLICY "Users can view own friend requests"
  ON public.friend_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Receiver can update request status
CREATE POLICY "Receiver can update friend request status"
  ON public.friend_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id AND status = 'pending')
  WITH CHECK (auth.uid() = receiver_id AND status IN ('accepted', 'rejected'));

-- Requester can cancel own pending request
CREATE POLICY "Requester can cancel own pending request"
  ON public.friend_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id AND status = 'pending')
  WITH CHECK (auth.uid() = requester_id AND status = 'cancelled');

-- Indexes for friend_requests
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester_id ON public.friend_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_created_at ON public.friend_requests(created_at DESC);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS trigger_update_friend_requests_updated_at ON public.friend_requests;
CREATE TRIGGER trigger_update_friend_requests_updated_at
  BEFORE UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FRIENDSHIPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- RLS for friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can view their own friendships
CREATE POLICY "Users can view own friendships"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert friendships (for MVP, done from frontend after accept)
CREATE POLICY "Users can insert own friendships"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete own friendships
CREATE POLICY "Users can delete own friendships"
  ON public.friendships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for friendships
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_created_at ON public.friendships(created_at DESC);

-- ============================================================================
-- DIRECT CONVERSATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.direct_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for direct_conversations
ALTER TABLE public.direct_conversations ENABLE ROW LEVEL SECURITY;

-- Users can only view conversations where they are a member (via join with members table)
CREATE POLICY "Users can view conversations they are member of"
  ON public.direct_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.direct_conversation_members
      WHERE conversation_id = direct_conversations.id AND user_id = auth.uid()
    )
  );

-- Users can insert conversations (for MVP, done via helper that also adds members)
CREATE POLICY "Users can insert conversations"
  ON public.direct_conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for direct_conversations
CREATE INDEX IF NOT EXISTS idx_direct_conversations_created_at ON public.direct_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_updated_at ON public.direct_conversations(updated_at DESC);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS trigger_update_direct_conversations_updated_at ON public.direct_conversations;
CREATE TRIGGER trigger_update_direct_conversations_updated_at
  BEFORE UPDATE ON public.direct_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- DIRECT CONVERSATION MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.direct_conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- RLS for direct_conversation_members
ALTER TABLE public.direct_conversation_members ENABLE ROW LEVEL SECURITY;

-- Users can view conversation memberships where they are the user
CREATE POLICY "Users can view own conversation memberships"
  ON public.direct_conversation_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert conversation memberships (for MVP, done via helper)
CREATE POLICY "Users can insert conversation memberships"
  ON public.direct_conversation_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes for direct_conversation_members
CREATE INDEX IF NOT EXISTS idx_direct_conversation_members_conversation_id ON public.direct_conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_conversation_members_user_id ON public.direct_conversation_members(user_id);

-- ============================================================================
-- DIRECT MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- RLS for direct_messages
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can only view messages in conversations where they are a member
CREATE POLICY "Users can view messages in their conversations"
  ON public.direct_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.direct_conversation_members
      WHERE conversation_id = direct_messages.conversation_id AND user_id = auth.uid()
    )
  );

-- Users can only insert messages into conversations where they are a member
CREATE POLICY "Users can insert messages in their conversations"
  ON public.direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.direct_conversation_members
      WHERE conversation_id = direct_messages.conversation_id AND user_id = auth.uid()
    )
  );

-- Indexes for direct_messages
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_id ON public.direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_status ON public.direct_messages(status);

-- Function to update conversation updated_at when message is inserted
CREATE OR REPLACE FUNCTION update_direct_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.direct_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation updated_at on message insert
DROP TRIGGER IF EXISTS trigger_update_direct_conversation_updated_at ON public.direct_messages;
CREATE TRIGGER trigger_update_direct_conversation_updated_at
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_direct_conversation_updated_at();
