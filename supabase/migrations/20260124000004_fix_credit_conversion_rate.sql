-- =====================================================
-- Fix Credit Conversion Rate
-- =====================================================
-- Updates the credit conversion rate to match the new logic:
-- 100 credits = $1 (1 credit = $0.01)
-- =====================================================

-- Update the credit_to_usd_rate setting
-- Old: 0.10 (1 credit = $0.10)
-- New: 0.01 (1 credit = $0.01, or 100 credits = $1)
UPDATE payment_settings
SET setting_value = '0.01',
    description = 'Conversion rate: 1 credit = $X USD (100 credits = $1)',
    updated_at = NOW()
WHERE setting_key = 'credit_to_usd_rate';

-- Add a new setting for credits per dollar (inverse rate for easier calculations)
INSERT INTO payment_settings (setting_key, setting_value, setting_type, description)
VALUES ('credits_per_dollar', '100', 'number', 'How many credits equal $1 (inverse of credit_to_dollar_rate)')
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = '100',
    description = 'How many credits equal $1 (inverse of credit_to_dollar_rate)',
    updated_at = NOW();

