-- =====================================================
-- CREATE QUIZ IMAGES STORAGE BUCKET
-- Migration: 20260217000004
-- Description: Create storage bucket for quiz question images
-- =====================================================

-- Create quiz-images bucket (public for reading)
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-images', 'quiz-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for quiz-images bucket

-- Allow platform admins to upload images
CREATE POLICY quiz_images_upload_platform_admin ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'quiz-images' AND
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

-- Allow platform admins to update images
CREATE POLICY quiz_images_update_platform_admin ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'quiz-images' AND
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

-- Allow platform admins to delete images
CREATE POLICY quiz_images_delete_platform_admin ON storage.objects
  FOR DELETE USING (
    bucket_id = 'quiz-images' AND
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

-- Allow everyone to read images (public bucket)
CREATE POLICY quiz_images_read_all ON storage.objects
  FOR SELECT USING (bucket_id = 'quiz-images');

