-- =====================================================
-- FIX STORAGE BUCKET RLS POLICIES - AVOID RECURSION
-- =====================================================
-- Use the existing is_platform_admin() helper function
-- which uses SECURITY DEFINER to bypass RLS and avoid recursion

-- Drop all existing storage policies
DROP POLICY IF EXISTS "Platform admins can upload creator logos" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can update creator logos" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can delete creator logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view creator logos" ON storage.objects;

DROP POLICY IF EXISTS "Platform admins can upload SCORM packages" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can update SCORM packages" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can delete SCORM packages" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view SCORM packages" ON storage.objects;

DROP POLICY IF EXISTS "Platform admins can upload course covers" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can update course covers" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can delete course covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course covers" ON storage.objects;

DROP POLICY IF EXISTS "Platform admins can upload intro videos" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can update intro videos" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can delete intro videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view intro videos" ON storage.objects;

DROP POLICY IF EXISTS "Application owners can upload scholarship documents" ON storage.objects;
DROP POLICY IF EXISTS "Application owners can view scholarship documents" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can view scholarship documents" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can delete scholarship documents" ON storage.objects;

-- =====================================================
-- CREATOR LOGOS - Public bucket
-- =====================================================

CREATE POLICY "Platform admins can upload creator logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'creator-logos' AND
  is_platform_admin()
);

CREATE POLICY "Platform admins can update creator logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'creator-logos' AND
  is_platform_admin()
);

CREATE POLICY "Platform admins can delete creator logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'creator-logos' AND
  is_platform_admin()
);

CREATE POLICY "Anyone can view creator logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'creator-logos');

-- =====================================================
-- SCORM PACKAGES - Private bucket
-- =====================================================

CREATE POLICY "Platform admins can upload SCORM packages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'scorm-packages' AND
  is_platform_admin()
);

CREATE POLICY "Platform admins can update SCORM packages"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'scorm-packages' AND
  is_platform_admin()
);

CREATE POLICY "Platform admins can delete SCORM packages"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'scorm-packages' AND
  is_platform_admin()
);

CREATE POLICY "Authenticated users can view SCORM packages"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'scorm-packages');

-- =====================================================
-- COURSE COVERS - Public bucket
-- =====================================================

CREATE POLICY "Platform admins can upload course covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-covers' AND
  is_platform_admin()
);

CREATE POLICY "Platform admins can update course covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-covers' AND
  is_platform_admin()
);

CREATE POLICY "Platform admins can delete course covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-covers' AND
  is_platform_admin()
);

CREATE POLICY "Anyone can view course covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-covers');

-- =====================================================
-- INTRO VIDEOS - Public bucket
-- =====================================================

CREATE POLICY "Platform admins can upload intro videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'intro-videos' AND
  is_platform_admin()
);

CREATE POLICY "Platform admins can update intro videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'intro-videos' AND
  is_platform_admin()
);

CREATE POLICY "Platform admins can delete intro videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'intro-videos' AND
  is_platform_admin()
);

CREATE POLICY "Anyone can view intro videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'intro-videos');

-- =====================================================
-- SCHOLARSHIP DOCUMENTS - Private bucket
-- =====================================================
-- Note: Scholarship applications policies will be added later
-- For now, only platform admins can manage these files

CREATE POLICY "Platform admins can upload scholarship documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'scholarship-documents' AND
  is_platform_admin()
);

CREATE POLICY "Platform admins can view scholarship documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'scholarship-documents' AND
  is_platform_admin()
);

CREATE POLICY "Platform admins can delete scholarship documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'scholarship-documents' AND
  is_platform_admin()
);

