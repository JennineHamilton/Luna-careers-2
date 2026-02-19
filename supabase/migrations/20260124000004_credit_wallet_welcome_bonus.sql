-- =====================================================
-- Update Credit Wallet Creation to Include Welcome Bonus
-- =====================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_create_credit_wallet ON auth.users;
DROP FUNCTION IF EXISTS create_credit_wallet_for_new_user();

-- Create updated function with welcome bonus
CREATE OR REPLACE FUNCTION create_credit_wallet_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  welcome_bonus INTEGER := 100; -- Starting credits for new users
BEGIN
  -- Create wallet with welcome bonus
  INSERT INTO credit_wallets (user_id, balance, lifetime_earned, lifetime_spent)
  VALUES (NEW.id, welcome_bonus, welcome_bonus, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create initial transaction record
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    balance_after,
    description,
    source_type,
    source_id
  )
  VALUES (
    NEW.id,
    welcome_bonus,
    'earn',
    welcome_bonus,
    'Welcome bonus - Starting credits',
    'system',
    NEW.id
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER trigger_create_credit_wallet
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION create_credit_wallet_for_new_user();

-- Update existing wallets with 0 balance to have welcome bonus
-- (Only for users who haven't earned or spent any credits yet)
UPDATE credit_wallets
SET 
  balance = 100,
  lifetime_earned = 100
WHERE 
  balance = 0 
  AND lifetime_earned = 0 
  AND lifetime_spent = 0;

-- Create transaction records for users who just received the welcome bonus
INSERT INTO credit_transactions (
  user_id,
  amount,
  transaction_type,
  balance_after,
  description,
  source_type,
  source_id
)
SELECT 
  user_id,
  100,
  'earn',
  100,
  'Welcome bonus - Starting credits (retroactive)',
  'system',
  user_id
FROM credit_wallets
WHERE 
  balance = 100 
  AND lifetime_earned = 100 
  AND lifetime_spent = 0
  AND NOT EXISTS (
    SELECT 1 FROM credit_transactions 
    WHERE credit_transactions.user_id = credit_wallets.user_id
  );

