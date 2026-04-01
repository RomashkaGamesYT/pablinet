
ALTER TABLE public.verification_requests ALTER COLUMN telegram_chat_id DROP NOT NULL;
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS user_id uuid;

-- Allow authenticated users to insert their own verification requests
CREATE POLICY "Users can submit verification requests"
ON public.verification_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own requests
CREATE POLICY "Users can view own verification requests"
ON public.verification_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
