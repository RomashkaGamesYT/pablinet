
DROP POLICY "Service can insert verification requests" ON public.verification_requests;
CREATE POLICY "Service role can insert verification requests" ON public.verification_requests
  FOR INSERT TO service_role WITH CHECK (true);
