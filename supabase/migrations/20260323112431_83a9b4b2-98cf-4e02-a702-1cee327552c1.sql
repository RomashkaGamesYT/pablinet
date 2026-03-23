-- Add customization fields to profiles for admins
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS banner_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS logo_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS profile_theme jsonb DEFAULT NULL;

-- Create storage bucket for profile assets (banners, logos)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-assets', 'profile-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to profile-assets
CREATE POLICY "Users can upload own profile assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read
CREATE POLICY "Profile assets are public"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile-assets');

-- Allow users to delete own profile assets
CREATE POLICY "Users can delete own profile assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to update own profile assets
CREATE POLICY "Users can update own profile assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-assets' AND (storage.foldername(name))[1] = auth.uid()::text);