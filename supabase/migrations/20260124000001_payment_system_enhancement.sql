-- =====================================================
-- Payment System Enhancement Migration
-- =====================================================
-- Adds support for multiple payment methods, bank transfers,
-- payment settings, and hybrid credit+cash payments
-- =====================================================

-- =====================================================
-- A. EXTEND PURCHASES TABLE
-- =====================================================

-- Add new columns to purchases table for cash payments
ALTER TABLE purchases
  ADD COLUMN amount_credits INTEGER DEFAULT 0,
  ADD COLUMN amount_cash DECIMAL(10, 2) DEFAULT 0.00,
  ADD COLUMN currency VARCHAR(3) DEFAULT 'USD',
  ADD COLUMN payment_status VARCHAR(20) DEFAULT 'completed',
  ADD COLUMN payment_reference VARCHAR(255),
  ADD COLUMN payment_notes TEXT;

-- Update existing records to use new columns
UPDATE purchases 
SET amount_credits = final_price_credits,
    amount_cash = 0.00,
    payment_status = 'completed'
WHERE amount_credits IS NULL;

-- Add check constraint for payment status
ALTER TABLE purchases
  ADD CONSTRAINT check_payment_status 
  CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'));

-- Update payment_method to support new methods
-- Old values: 'credits', 'free', 'scholarship'
-- New values: 'credits', 'free', 'scholarship', 'bank_transfer', 'digiWallet', 'credit_card', 'hybrid'
COMMENT ON COLUMN purchases.payment_method IS 'Payment method: credits, free, scholarship, bank_transfer, digiWallet, credit_card, hybrid';

-- =====================================================
-- B. PAYMENT SETTINGS TABLE
-- =====================================================

CREATE TABLE payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(20) NOT NULL DEFAULT 'text', -- 'text', 'boolean', 'number', 'json'
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default payment settings
INSERT INTO payment_settings (setting_key, setting_value, setting_type, description) VALUES
  -- Payment method toggles
  ('payment_method_credits', 'true', 'boolean', 'Enable credit wallet payments'),
  ('payment_method_bank_transfer', 'true', 'boolean', 'Enable bank transfer payments'),
  ('payment_method_digiWallet', 'false', 'boolean', 'Enable DigiWallet payments'),
  ('payment_method_credit_card', 'false', 'boolean', 'Enable credit card payments'),
  
  -- Banking information
  ('bank_name', 'Luna Careers Bank', 'text', 'Platform bank name'),
  ('bank_account_name', 'Luna Careers Ltd', 'text', 'Account holder name'),
  ('bank_account_number', '1234567890', 'text', 'Bank account number'),
  ('bank_routing_number', '987654321', 'text', 'Routing/Sort code'),
  ('bank_swift_code', 'LUNAXXXX', 'text', 'SWIFT/BIC code for international transfers'),
  ('bank_payment_instructions', 'Please include your user ID in the payment reference.', 'text', 'Additional payment instructions'),
  
  -- Credit to cash conversion rate
  ('credit_to_usd_rate', '0.10', 'number', 'Conversion rate: 1 credit = $X USD');

-- =====================================================
-- C. BANK TRANSFER SUBMISSIONS TABLE
-- =====================================================

CREATE TABLE bank_transfer_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_type VARCHAR(20) NOT NULL,
  enrollment_id UUID NOT NULL,
  
  -- User submitted information
  user_bank_name VARCHAR(255) NOT NULL,
  user_account_holder VARCHAR(255) NOT NULL,
  transaction_reference VARCHAR(255) NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL,
  receipt_image_url TEXT,
  
  -- Admin review
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT check_bank_transfer_status 
    CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- =====================================================
-- D. INDEXES
-- =====================================================

CREATE INDEX idx_purchases_payment_status ON purchases(payment_status);
CREATE INDEX idx_purchases_payment_method ON purchases(payment_method);
CREATE INDEX idx_bank_transfers_status ON bank_transfer_submissions(status);
CREATE INDEX idx_bank_transfers_user ON bank_transfer_submissions(user_id);
CREATE INDEX idx_bank_transfers_purchase ON bank_transfer_submissions(purchase_id);

-- =====================================================
-- E. UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER update_payment_settings_updated_at
  BEFORE UPDATE ON payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_transfer_submissions_updated_at
  BEFORE UPDATE ON bank_transfer_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- F. COMMENTS
-- =====================================================

COMMENT ON TABLE payment_settings IS 'Platform-wide payment configuration and banking information';
COMMENT ON TABLE bank_transfer_submissions IS 'User-submitted bank transfer payment proofs pending admin approval';
COMMENT ON COLUMN purchases.amount_credits IS 'Amount paid in credits (for hybrid payments)';
COMMENT ON COLUMN purchases.amount_cash IS 'Amount paid in cash/fiat currency';
COMMENT ON COLUMN purchases.payment_status IS 'Status of the payment transaction';

