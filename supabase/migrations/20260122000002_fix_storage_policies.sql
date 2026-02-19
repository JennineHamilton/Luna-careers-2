-- =====================================================
-- FIX STORAGE BUCKET RLS POLICIES
-- =====================================================
-- This migration fixes the RLS policies to ensure public buckets
-- are actually accessible to the public.

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view creator logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view intro videos" ON storage.objects;

-- Recreate public SELECT policies with anon role
CREATE POLICY "Anyone can view creator logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'creator-logos');

CREATE POLICY "Anyone can view course covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-covers');

CREATE POLICY "Anyone can view intro videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'intro-videos');

-- Ensure authenticated users can also view (in case public doesn't work)
CREATE POLICY "Authenticated users can view creator logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'creator-logos');

CREATE POLICY "Authenticated users can view course covers"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'course-covers');

CREATE POLICY "Authenticated users can view intro videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'intro-videos');

