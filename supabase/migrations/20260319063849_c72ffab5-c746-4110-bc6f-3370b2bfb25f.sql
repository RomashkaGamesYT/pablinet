
-- Comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Add verified column to profiles
ALTER TABLE public.profiles ADD COLUMN verified BOOLEAN NOT NULL DEFAULT false;

-- Add pinned_in_feed (admin), pinned_in_profile (user) to posts
ALTER TABLE public.posts ADD COLUMN pinned_in_feed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.posts ADD COLUMN pinned_in_profile BOOLEAN NOT NULL DEFAULT false;

-- Add notification type 'comment'
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'comment';
