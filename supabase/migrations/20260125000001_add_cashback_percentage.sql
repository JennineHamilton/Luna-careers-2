-- =====================================================
-- Add Cashback Percentage Setting
-- =====================================================
-- Adds a configurable cashback percentage setting
-- for the credit rewards system
-- =====================================================

-- Add cashback percentage setting
INSERT INTO payment_settings (setting_key, setting_value, setting_type, description)
VALUES ('cashback_percentage', '10', 'number', 'Percentage of purchase amount returned as credits (e.g., 10 for 10%)')
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = '10',
    description = 'Percentage of purchase amount returned as credits (e.g., 10 for 10%)',
    updated_at = NOW();

-- Add comment
COMMENT ON TABLE payment_settings IS 'Platform-wide payment configuration including credit conversion rates and cashback settings';

