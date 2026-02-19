-- Create storage bucket for extracted SCORM content
-- This bucket will store the extracted SCORM files that are served to users

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scorm-extracted',
  'scorm-extracted',
  true, -- Public bucket so SCORM content can be loaded in iframes
  104857600, -- 100MB limit per file
  ARRAY[
    'text/html',
    'text/css',
    'application/javascript',
    'application/json',
    'application/xml',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'font/woff',
    'font/woff2',
    'font/ttf',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read from the bucket
CREATE POLICY "Authenticated users can read extracted SCORM content"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'scorm-extracted');

-- Allow service role to upload/update/delete files (for server-side extraction)
CREATE POLICY "Service role can manage extracted SCORM content"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'scorm-extracted');

-- Allow public read access (needed for iframe loading)
CREATE POLICY "Public can read extracted SCORM content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'scorm-extracted');

