-- =====================================================
-- SUPABASE STORAGE BUCKETS FOR LMS
-- =====================================================
-- This migration creates all storage buckets needed for the Learning Management System
-- with appropriate RLS policies for secure file uploads and access.

-- =====================================================
-- 1. CREATOR LOGOS BUCKET
-- =====================================================
-- Purpose: Store logos for content creators (individuals, institutions, organizations, partners)
-- Max file size: 2MB
-- Allowed formats: PNG, JPG, JPEG, SVG, WEBP
-- Path structure: /creator-logos/{creator-id}/{filename}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creator-logos',
  'creator-logos',
  true, -- Public bucket for easy access
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for creator-logos bucket
CREATE POLICY "Platform admins can upload creator logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'creator-logos' AND
  (auth.jwt() ->> 'account_type')::text = 'platformAdmin'
);

CREATE POLICY "Platform admins can update creator logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'creator-logos' AND
  (auth.jwt() ->> 'account_type')::text = 'platformAdmin'
);

CREATE POLICY "Platform admins can delete creator logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'creator-logos' AND
  (auth.jwt() ->> 'account_type')::text = 'platformAdmin'
);

CREATE POLICY "Anyone can view creator logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'creator-logos');

-- =====================================================
-- 2. SCORM PACKAGES BUCKET
-- =====================================================
-- Purpose: Store SCORM lesson packages (.zip files)
-- Max file size: 10MB
-- Allowed formats: ZIP
-- Path structure: /scorm-packages/{lesson-id}/{filename}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scorm-packages',
  'scorm-packages',
  false, -- Private bucket - requires authentication
  10485760, -- 10MB limit
  ARRAY['application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for scorm-packages bucket
CREATE POLICY "Platform admins can upload SCORM packages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'scorm-packages' AND
  (auth.jwt() ->> 'account_type')::text = 'platformAdmin'
);

CREATE POLICY "Platform admins can update SCORM packages"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'scorm-packages' AND
  (auth.jwt() ->> 'account_type')::text = 'platformAdmin'
);

CREATE POLICY "Platform admins can delete SCORM packages"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'scorm-packages' AND
  (auth.jwt() ->> 'account_type')::text = 'platformAdmin'
);

CREATE POLICY "Authenticated users can view SCORM packages"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'scorm-packages');

-- =====================================================
-- 3. COURSE COVER IMAGES BUCKET
-- =====================================================
-- Purpose: Store cover images for modules, courses, and programs
-- Max file size: 5MB
-- Allowed formats: PNG, JPG, JPEG, WEBP
-- Path structure: /course-covers/{type}/{id}/{filename}
--   where type = 'modules' | 'courses' | 'programs'

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-covers',
  'course-covers',
  true, -- Public bucket for easy access
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for course-covers bucket
CREATE POLICY "Platform admins can upload course covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-covers' AND
  (auth.jwt() ->> 'account_type')::text = 'platformAdmin'
);

CREATE POLICY "Platform admins can update course covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-covers' AND
  (auth.jwt() ->> 'account_type')::text = 'platformAdmin'
);

CREATE POLICY "Platform admins can delete course covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-covers' AND
  (auth.jwt() ->> 'account_type')::text = 'platformAdmin'
);

CREATE POLICY "Anyone can view course covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-covers');

-- =====================================================
-- 4. INTRO VIDEOS BUCKET
-- =====================================================
-- Purpose: Store intro/preview videos for modules, courses, and programs
-- Max file size: 50MB
-- Allowed formats: MP4, WEBM, MOV
-- Path structure: /intro-videos/{type}/{id}/{filename}
--   where type = 'modules' | 'courses' | 'programs'

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intro-videos',
  'intro-videos',
  true, -- Public bucket for easy access
  52428800, -- 50MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for intro-videos bucket
CREATE POLICY "Platform admins can upload intro videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'intro-videos' AND
  (auth.jwt() ->> 'account_type')::text = 'platformAdmin'
);

CREATE POLICY "Platform admins can update intro videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'intro-videos' AND
  (auth.jwt() ->> 'account_type')::text = 'platformAdmin'
);

CREATE POLICY "Platform admins can delete intro videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'intro-videos' AND
  (auth.jwt() ->> 'account_type')::text = 'platformAdmin'
);

CREATE POLICY "Anyone can view intro videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'intro-videos');

-- =====================================================
-- 5. SCHOLARSHIP DOCUMENTS BUCKET
-- =====================================================
-- Purpose: Store documents uploaded by users as part of scholarship applications
-- Max file size: 10MB
-- Allowed formats: PDF, DOC, DOCX, PNG, JPG, JPEG
-- Path structure: /scholarship-docs/{application-id}/{filename}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scholarship-documents',
  'scholarship-documents',
  false, -- Private bucket - sensitive user documents
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for scholarship-documents bucket
CREATE POLICY "Users can upload their own scholarship documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'scholarship-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM scholarship_applications WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own scholarship documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'scholarship-documents' AND
  (
    -- User owns the application
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM scholarship_applications WHERE user_id = auth.uid()
    )
    OR
    -- User is platform admin
    (auth.jwt() ->> 'account_type')::text = 'platformAdmin'
  )
);

CREATE POLICY "Platform admins can delete scholarship documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'scholarship-documents' AND
  (auth.jwt() ->> 'account_type')::text = 'platformAdmin'
);

-- =====================================================
-- SUMMARY OF STORAGE BUCKETS
-- =====================================================
--
-- 1. creator-logos (Public, 2MB)
--    - Creator profile logos
--    - Formats: PNG, JPG, JPEG, SVG, WEBP
--    - Upload: Platform admins only
--    - View: Public
--
-- 2. scorm-packages (Private, 10MB)
--    - SCORM lesson packages
--    - Formats: ZIP
--    - Upload: Platform admins only
--    - View: Authenticated users
--
-- 3. course-covers (Public, 5MB)
--    - Cover images for modules, courses, programs
--    - Formats: PNG, JPG, JPEG, WEBP
--    - Upload: Platform admins only
--    - View: Public
--
-- 4. intro-videos (Public, 50MB)
--    - Intro/preview videos for modules, courses, programs
--    - Formats: MP4, WEBM, MOV
--    - Upload: Platform admins only
--    - View: Public
--
-- 5. scholarship-documents (Private, 10MB)
--    - User-uploaded scholarship application documents
--    - Formats: PDF, DOC, DOCX, PNG, JPG, JPEG
--    - Upload: Application owner only
--    - View: Application owner + Platform admins
--    - Delete: Platform admins only
--
-- =====================================================

