-- =====================================================
-- CREATE ASSESSMENT IMAGES STORAGE BUCKET
-- Migration: 20260218000002
-- Description: Create storage bucket for knowledge assessment question images
-- =====================================================

-- Create assessment-images bucket (public for reading)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assessment-images',
  'assessment-images',
  true,  -- Public bucket so users can view images during assessments
  5242880,  -- 5MB max file size
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- RLS POLICIES FOR ASSESSMENT IMAGES
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Platform admins can upload assessment images" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can update assessment images" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can delete assessment images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view assessment images" ON storage.objects;

-- Platform admins can upload images
CREATE POLICY "Platform admins can upload assessment images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assessment-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Platform admins can update images
CREATE POLICY "Platform admins can update assessment images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assessment-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Platform admins can delete images
CREATE POLICY "Platform admins can delete assessment images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assessment-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Anyone can view images (public bucket)
CREATE POLICY "Anyone can view assessment images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'assessment-images');

