-- Allow admins to update and delete events
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
-- Allow admins to delete event registrations (for cleanup)
CREATE POLICY "Admins can delete event registrations" ON public.event_registrations FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));