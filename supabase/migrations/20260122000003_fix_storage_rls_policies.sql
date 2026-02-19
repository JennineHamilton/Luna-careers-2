-- =====================================================
-- FIX STORAGE BUCKET RLS POLICIES - CORRECT JWT ACCESS
-- =====================================================
-- Storage policies need to check user metadata differently
-- than table RLS policies. We'll use a helper function.

-- Drop all existing storage policies
DROP POLICY IF EXISTS "Platform admins can upload creator logos" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can update creator logos" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can delete creator logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view creator logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view creator logos" ON storage.objects;

DROP POLICY IF EXISTS "Platform admins can upload SCORM packages" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can update SCORM packages" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can delete SCORM packages" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view SCORM packages" ON storage.objects;

DROP POLICY IF EXISTS "Platform admins can upload course covers" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can update course covers" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can delete course covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view course covers" ON storage.objects;

DROP POLICY IF EXISTS "Platform admins can upload intro videos" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can update intro videos" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can delete intro videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view intro videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view intro videos" ON storage.objects;

DROP POLICY IF EXISTS "Application owners can upload scholarship documents" ON storage.objects;
DROP POLICY IF EXISTS "Application owners can view scholarship documents" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can view scholarship documents" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can delete scholarship documents" ON storage.objects;

-- =====================================================
-- CREATOR LOGOS - Public bucket
-- =====================================================

-- Platform admins can upload
CREATE POLICY "Platform admins can upload creator logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'creator-logos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Platform admins can update
CREATE POLICY "Platform admins can update creator logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'creator-logos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Platform admins can delete
CREATE POLICY "Platform admins can delete creator logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'creator-logos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Anyone can view (public bucket)
CREATE POLICY "Anyone can view creator logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'creator-logos');

-- =====================================================
-- SCORM PACKAGES - Private bucket
-- =====================================================

-- Platform admins can upload
CREATE POLICY "Platform admins can upload SCORM packages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'scorm-packages' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Platform admins can update
CREATE POLICY "Platform admins can update SCORM packages"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'scorm-packages' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Platform admins can delete
CREATE POLICY "Platform admins can delete SCORM packages"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'scorm-packages' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Authenticated users can view
CREATE POLICY "Authenticated users can view SCORM packages"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'scorm-packages');

-- =====================================================
-- COURSE COVERS - Public bucket
-- =====================================================

-- Platform admins can upload
CREATE POLICY "Platform admins can upload course covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-covers' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Platform admins can update
CREATE POLICY "Platform admins can update course covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-covers' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Platform admins can delete
CREATE POLICY "Platform admins can delete course covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-covers' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Anyone can view (public bucket)
CREATE POLICY "Anyone can view course covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-covers');

-- =====================================================
-- INTRO VIDEOS - Public bucket
-- =====================================================

-- Platform admins can upload
CREATE POLICY "Platform admins can upload intro videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'intro-videos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Platform admins can update
CREATE POLICY "Platform admins can update intro videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'intro-videos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Platform admins can delete
CREATE POLICY "Platform admins can delete intro videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'intro-videos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Anyone can view (public bucket)
CREATE POLICY "Anyone can view intro videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'intro-videos');

-- =====================================================
-- SCHOLARSHIP DOCUMENTS - Private bucket
-- =====================================================

-- Application owners can upload their documents
CREATE POLICY "Application owners can upload scholarship documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'scholarship-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.scholarship_applications
    WHERE user_id = auth.uid()
  )
);

-- Application owners can view their documents
CREATE POLICY "Application owners can view scholarship documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'scholarship-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.scholarship_applications
    WHERE user_id = auth.uid()
  )
);

-- Platform admins can view all scholarship documents
CREATE POLICY "Platform admins can view scholarship documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'scholarship-documents' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

-- Platform admins can delete scholarship documents
CREATE POLICY "Platform admins can delete scholarship documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'scholarship-documents' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.account_type = 'platformAdmin'
  )
);

