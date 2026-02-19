/**
 * Migration: Fix quiz-images storage bucket RLS policies
 * Updates RLS policies to use users table check instead of JWT claims
 * This matches the pattern used by other storage buckets
 */

-- Drop existing policies
DROP POLICY IF EXISTS quiz_images_upload_platform_admin ON storage.objects;
DROP POLICY IF EXISTS quiz_images_update_platform_admin ON storage.objects;
DROP POLICY IF EXISTS quiz_images_delete_platform_admin ON storage.objects;
DROP POLICY IF EXISTS quiz_images_read_all ON storage.objects;

-- =====================================================
-- QUIZ IMAGES - Public bucket
-- =====================================================

-- Platform admins can upload
CREATE POLICY "Platform admins can upload quiz images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'quiz-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Platform admins can update
CREATE POLICY "Platform admins can update quiz images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'quiz-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Platform admins can delete
CREATE POLICY "Platform admins can delete quiz images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'quiz-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Anyone can view (public bucket)
CREATE POLICY "Anyone can view quiz images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'quiz-images');

