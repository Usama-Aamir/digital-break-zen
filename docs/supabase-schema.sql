-- Supabase Database Schema for The Digital Breakroom
-- This file contains the SQL schema for future community story publishing
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
-- Stores user profile information linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
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
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
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
