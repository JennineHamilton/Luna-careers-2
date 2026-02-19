-- =====================================================
-- Organization Assets Storage Bucket
-- Migration: 20260220000001
-- Description: Storage bucket for organization logos and banners.
--              Allows org members to upload; public read for display.
-- =====================================================

-- =====================================================
-- HELPER FUNCTION
-- =====================================================
-- Check if the current user can upload to an organization's folder.
-- Returns true if user's organization_id matches the folder (org id).
CREATE OR REPLACE FUNCTION public.storage_user_can_upload_to_org(org_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND organization_id::text = org_id
      AND account_type IN ('organization', 'hybrid')
      AND is_active = true
  );
$$;

-- =====================================================
-- CREATE STORAGE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-assets',
  'organization-assets',
  true,  -- Public: logos and banners need to be displayed without auth
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- RLS POLICIES FOR STORAGE BUCKET
-- =====================================================

-- Org members can upload to their organization's folder
-- Path structure: {organization_id}/logo-xxx.ext or {organization_id}/banner-xxx.ext
CREATE POLICY "Org members can upload organization assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'organization-assets'
    AND public.storage_user_can_upload_to_org((storage.foldername(name))[1])
  );

-- Org members can update their organization's assets
CREATE POLICY "Org members can update organization assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'organization-assets'
    AND public.storage_user_can_upload_to_org((storage.foldername(name))[1])
  )
  WITH CHECK (
    bucket_id = 'organization-assets'
    AND public.storage_user_can_upload_to_org((storage.foldername(name))[1])
  );

-- Org members can delete their organization's assets
CREATE POLICY "Org members can delete organization assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'organization-assets'
    AND public.storage_user_can_upload_to_org((storage.foldername(name))[1])
  );

-- Public read (bucket is public, but explicit policy for RLS)
CREATE POLICY "Anyone can view organization assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'organization-assets');
