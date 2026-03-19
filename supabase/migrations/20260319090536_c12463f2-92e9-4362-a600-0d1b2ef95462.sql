ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS dm_privacy text NOT NULL DEFAULT 'everyone';
-- dm_privacy values: 'everyone', 'followers', 'nobody'