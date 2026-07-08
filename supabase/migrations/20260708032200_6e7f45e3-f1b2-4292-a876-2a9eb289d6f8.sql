
DROP POLICY IF EXISTS "Anyone can view role assignments" ON public.user_roles;
CREATE POLICY "Anyone can view role assignments" ON public.user_roles
  FOR SELECT TO authenticated
  USING (true);

-- Drop the older narrower policy so it doesn't shadow the broader one
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
