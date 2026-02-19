-- =====================================================
-- User Credentials Storage Bucket
-- Migration: 20260126000005
-- Description: Storage bucket for user-uploaded certificates, diplomas, and credentials
-- =====================================================

-- =====================================================
-- CREATE STORAGE BUCKET
-- =====================================================

-- Create storage bucket for user credentials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-credentials',
  'user-credentials',
  false, -- Private bucket - only accessible by user and admins
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- RLS POLICIES FOR STORAGE BUCKET
-- =====================================================

-- Users can upload their own credentials
-- Path structure: /user-credentials/{user-id}/{filename}
CREATE POLICY "Users can upload own credentials"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-credentials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view their own credentials
CREATE POLICY "Users can view own credentials"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-credentials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own credentials
CREATE POLICY "Users can update own credentials"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-credentials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-credentials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own credentials
CREATE POLICY "Users can delete own credentials"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-credentials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Platform admins can view all credentials
CREATE POLICY "Platform admins can view all credentials"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-credentials' AND
    (auth.jwt() ->> 'account_type') = 'platformAdmin'
  );

-- Platform admins can update credentials (for verification purposes)
CREATE POLICY "Platform admins can update all credentials"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-credentials' AND
    (auth.jwt() ->> 'account_type') = 'platformAdmin'
  )
  WITH CHECK (
    bucket_id = 'user-credentials' AND
    (auth.jwt() ->> 'account_type') = 'platformAdmin'
  );

-- Platform admins can delete credentials if needed
CREATE POLICY "Platform admins can delete all credentials"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-credentials' AND
    (auth.jwt() ->> 'account_type') = 'platformAdmin'
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can upload own credentials" ON storage.objects IS 'Users can upload certificates, diplomas, and credentials to their own folder';
COMMENT ON POLICY "Platform admins can view all credentials" ON storage.objects IS 'Platform admins can view all user credentials for verification purposes';

