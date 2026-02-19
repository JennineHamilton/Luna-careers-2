-- =====================================================
-- UPDATE USER CREDENTIALS BUCKET CONFIGURATION
-- =====================================================
-- This script updates the user-credentials bucket to:
-- 1. Increase file size limit to 50MB (for videos)
-- 2. Add video MIME types
--
-- Run this in Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste this → Run

-- Update bucket configuration
UPDATE storage.buckets
SET 
  file_size_limit = 52428800, -- 50MB (52,428,800 bytes)
  allowed_mime_types = ARRAY[
    -- Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    -- Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    -- Videos
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo'
  ]
WHERE id = 'user-credentials';

-- Verify the update
SELECT 
  id,
  name,
  public,
  file_size_limit,
  file_size_limit / 1024 / 1024 AS size_limit_mb,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'user-credentials';

