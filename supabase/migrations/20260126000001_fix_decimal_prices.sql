-- Migration: Fix decimal prices for scholarships and credits
-- Change INTEGER columns to NUMERIC(10,2) to support decimal values

-- 1. Update awarded_scholarships table to support decimal prices
ALTER TABLE awarded_scholarships
  ALTER COLUMN original_price TYPE NUMERIC(10,2),
  ALTER COLUMN discounted_price TYPE NUMERIC(10,2);

-- 2. Update modules table to support decimal prices
ALTER TABLE modules
  ALTER COLUMN price TYPE NUMERIC(10,2);

-- 3. Update courses table to support decimal prices
ALTER TABLE courses
  ALTER COLUMN price TYPE NUMERIC(10,2);

-- 4. Update programs table to support decimal prices
ALTER TABLE programs
  ALTER COLUMN price TYPE NUMERIC(10,2);

-- 5. Update credit_wallets to support decimal credits
ALTER TABLE credit_wallets
  ALTER COLUMN balance TYPE NUMERIC(10,2),
  ALTER COLUMN lifetime_earned TYPE NUMERIC(10,2),
  ALTER COLUMN lifetime_spent TYPE NUMERIC(10,2);

-- 6. Update credit_transactions to support decimal credits
ALTER TABLE credit_transactions
  ALTER COLUMN amount TYPE NUMERIC(10,2),
  ALTER COLUMN balance_after TYPE NUMERIC(10,2);

-- 7. Update credit_earning_rules to support decimal credits
ALTER TABLE credit_earning_rules
  ALTER COLUMN credits_awarded TYPE NUMERIC(10,2);

-- Note: This migration allows the system to handle decimal values for prices and credits
-- Example: $12.50 instead of $13, or 125 credits instead of 130 credits

