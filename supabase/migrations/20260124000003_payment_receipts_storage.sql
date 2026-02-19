-- =====================================================
-- Payment Receipts Storage Bucket
-- =====================================================

-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  false, -- Not public, only accessible by user and admins
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
);

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Users can upload their own payment receipts
CREATE POLICY "Users can upload own payment receipts"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own payment receipts
CREATE POLICY "Users can read own payment receipts"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Platform admins can read all payment receipts
CREATE POLICY "Platform admins can read all payment receipts"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-receipts' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
      AND users.is_suspended = false
    )
  );

-- Users can update their own payment receipts (before submission)
CREATE POLICY "Users can update own payment receipts"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'payment-receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own payment receipts (before submission)
CREATE POLICY "Users can delete own payment receipts"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'payment-receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

