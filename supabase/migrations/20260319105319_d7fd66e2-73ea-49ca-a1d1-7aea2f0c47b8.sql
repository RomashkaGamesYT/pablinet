
-- Broadcasts table
CREATE TABLE public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Broadcasts viewable by everyone" ON public.broadcasts FOR SELECT USING (true);
CREATE POLICY "Allowed users can create broadcasts" ON public.broadcasts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own broadcasts" ON public.broadcasts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own broadcasts" ON public.broadcasts FOR DELETE USING (auth.uid() = user_id);

-- Broadcast messages table
CREATE TABLE public.broadcast_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Broadcast messages viewable by everyone" ON public.broadcast_messages FOR SELECT USING (true);
CREATE POLICY "Broadcaster can send messages" ON public.broadcast_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcasts;
