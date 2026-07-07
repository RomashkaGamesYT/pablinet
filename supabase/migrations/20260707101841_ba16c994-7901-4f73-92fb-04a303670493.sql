
-- =========================================================
-- 1) Helper: check if a user is banned
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_banned FROM public.profiles WHERE user_id = _user_id), false)
$$;

-- =========================================================
-- 2) Ban-aware INSERT policies for posts / comments / messages / broadcast_messages
-- =========================================================
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
CREATE POLICY "Users can create their own posts"
ON public.posts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND NOT public.is_user_banned(auth.uid()));

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can create their own comments" ON public.comments;
CREATE POLICY "Users can create their own comments"
ON public.comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND NOT public.is_user_banned(auth.uid()));

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create their own messages" ON public.messages;
CREATE POLICY "Users can send messages if not banned"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id AND NOT public.is_user_banned(auth.uid()));

-- =========================================================
-- 3) Admin fallback for broadcasts / giveaways
-- =========================================================
DROP POLICY IF EXISTS "Allowed users can create broadcasts" ON public.broadcasts;
CREATE POLICY "Cooling or admin can create broadcasts"
ON public.broadcasts FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT public.is_user_banned(auth.uid())
  AND (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND lower(p.username) = 'cooling')
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

DROP POLICY IF EXISTS "Users can update own broadcasts" ON public.broadcasts;
CREATE POLICY "Owner or admin can update broadcasts"
ON public.broadcasts FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can delete own broadcasts" ON public.broadcasts;
CREATE POLICY "Owner or admin can delete broadcasts"
ON public.broadcasts FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Cooling can create giveaways" ON public.giveaways;
CREATE POLICY "Cooling or admin can create giveaways"
ON public.giveaways FOR INSERT TO authenticated
WITH CHECK (
  creator_id = auth.uid()
  AND NOT public.is_user_banned(auth.uid())
  AND (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND lower(p.username) = 'cooling')
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Also allow admins to send broadcast messages (in addition to broadcaster)
DROP POLICY IF EXISTS "Broadcaster can send messages" ON public.broadcast_messages;
DROP POLICY IF EXISTS "Users can send own broadcast messages" ON public.broadcast_messages;
CREATE POLICY "Broadcaster can send messages"
ON public.broadcast_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT public.is_user_banned(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.broadcasts b
    WHERE b.id = broadcast_id AND b.user_id = auth.uid() AND b.active = true
  )
);

-- =========================================================
-- 4) Support chat tables
-- =========================================================
CREATE TABLE IF NOT EXISTS public.support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_active boolean NOT NULL DEFAULT true,
  needs_specialist boolean NOT NULL DEFAULT false,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_conversations TO authenticated;
GRANT ALL ON public.support_conversations TO service_role;
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User sees own support conversation"
ON public.support_conversations FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "User creates own support conversation"
ON public.support_conversations FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner or admin updates support conversation"
ON public.support_conversations FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_support_conversations_updated_at
BEFORE UPDATE ON public.support_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','admin','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "See messages of accessible conversation"
ON public.support_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_conversations c
    WHERE c.id = conversation_id
      AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Owner writes as user, admin writes as admin"
ON public.support_messages FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_conversations c
    WHERE c.id = conversation_id
      AND (
        (c.user_id = auth.uid() AND role = 'user' AND sender_id = auth.uid())
        OR (public.has_role(auth.uid(), 'admin'::app_role) AND role IN ('admin','system') AND sender_id = auth.uid())
      )
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;
