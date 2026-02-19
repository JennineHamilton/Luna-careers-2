-- =====================================================
-- Payment System RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transfer_submissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PAYMENT SETTINGS POLICIES
-- =====================================================

-- Anyone can read active payment settings (for displaying enabled payment methods)
CREATE POLICY "Anyone can read active payment settings"
  ON payment_settings
  FOR SELECT
  USING (is_active = true);

-- Only platform admins can insert payment settings
CREATE POLICY "Platform admins can insert payment settings"
  ON payment_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
      AND users.is_suspended = false
    )
  );

-- Only platform admins can update payment settings
CREATE POLICY "Platform admins can update payment settings"
  ON payment_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
      AND users.is_suspended = false
    )
  );

-- Only platform admins can delete payment settings
CREATE POLICY "Platform admins can delete payment settings"
  ON payment_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
      AND users.is_suspended = false
    )
  );

-- =====================================================
-- BANK TRANSFER SUBMISSIONS POLICIES
-- =====================================================

-- Users can read their own bank transfer submissions
CREATE POLICY "Users can read own bank transfer submissions"
  ON bank_transfer_submissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Platform admins can read all bank transfer submissions
CREATE POLICY "Platform admins can read all bank transfer submissions"
  ON bank_transfer_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
      AND users.is_suspended = false
    )
  );

-- Users can insert their own bank transfer submissions
CREATE POLICY "Users can insert own bank transfer submissions"
  ON bank_transfer_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only platform admins can update bank transfer submissions (for approval/rejection)
CREATE POLICY "Platform admins can update bank transfer submissions"
  ON bank_transfer_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
      AND users.is_suspended = false
    )
  );

-- No one can delete bank transfer submissions (audit trail)
-- Platform admins can delete if absolutely necessary via direct DB access

