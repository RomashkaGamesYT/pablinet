-- Fix infinite recursion in conversation_participants RLS policies
DROP POLICY IF EXISTS "Users see own conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Authenticated can add participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users see own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users see messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;

-- Create a security definer function to check conversation membership (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_conversation_member(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  )
$$;

-- conversation_participants policies (no self-reference)
CREATE POLICY "Users see own participations"
  ON public.conversation_participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated can add participants v2"
  ON public.conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- conversations policies using security definer function
CREATE POLICY "Users see own conversations v2"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (public.is_conversation_member(auth.uid(), id));

CREATE POLICY "Users can update own conversations v2"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (public.is_conversation_member(auth.uid(), id));

CREATE POLICY "Authenticated can create conversations v2"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- messages policies using security definer function
CREATE POLICY "Users see messages in convos v2"
  ON public.messages FOR SELECT
  TO authenticated
  USING (public.is_conversation_member(auth.uid(), conversation_id));

CREATE POLICY "Users can send messages v2"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_conversation_member(auth.uid(), conversation_id));

CREATE POLICY "Users can update messages v2"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (public.is_conversation_member(auth.uid(), conversation_id));

-- Create user_settings table
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  dm_enabled boolean NOT NULL DEFAULT true,
  show_events_tab boolean NOT NULL DEFAULT true,
  show_notifications_tab boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any settings"
  ON public.user_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());