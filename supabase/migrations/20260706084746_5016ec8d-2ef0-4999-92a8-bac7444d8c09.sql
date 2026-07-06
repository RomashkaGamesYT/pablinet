
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();

DROP POLICY IF EXISTS "Admins can update any profile ban" ON public.profiles;
CREATE POLICY "Admins can update any profile ban"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.giveaways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  ends_at timestamptz NOT NULL,
  winner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.giveaways TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.giveaways TO authenticated;
GRANT ALL ON public.giveaways TO service_role;

ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view giveaways"
  ON public.giveaways FOR SELECT USING (true);

CREATE POLICY "Cooling can create giveaways"
  ON public.giveaways FOR INSERT TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND lower(username) = 'cooling')
  );

CREATE POLICY "Cooling or admin can update giveaways"
  ON public.giveaways FOR UPDATE TO authenticated
  USING (
    (creator_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND lower(username) = 'cooling'))
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    (creator_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND lower(username) = 'cooling'))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Cooling or admin can delete giveaways"
  ON public.giveaways FOR DELETE TO authenticated
  USING (
    (creator_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND lower(username) = 'cooling'))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_giveaways_updated_at ON public.giveaways;
CREATE TRIGGER update_giveaways_updated_at
  BEFORE UPDATE ON public.giveaways
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
