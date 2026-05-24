-- SQL Schema Setup for Story Writing App
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/kioguwrftttvrrymteub/sql/new)

-- 1. Create the stories table
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    keywords TEXT[] NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    moral TEXT NOT NULL,
    cover_color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row-Level Security (RLS)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Policy to allow users to view only their own stories
CREATE POLICY "Users can view their own stories" 
ON public.stories 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy to allow users to create their own stories
CREATE POLICY "Users can create their own stories" 
ON public.stories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own stories
CREATE POLICY "Users can delete their own stories" 
ON public.stories 
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Set up an index on user_id for high-performance queries
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON public.stories(user_id);
