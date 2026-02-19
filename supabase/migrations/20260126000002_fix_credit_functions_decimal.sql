-- Migration: Fix credit functions to support decimal values
-- Update award_credits and spend_credits functions to use NUMERIC instead of INTEGER

-- Drop old INTEGER versions first to avoid function overloading conflicts
DROP FUNCTION IF EXISTS award_credits(UUID, INTEGER, VARCHAR, UUID, TEXT);
DROP FUNCTION IF EXISTS spend_credits(UUID, INTEGER, VARCHAR, UUID, TEXT);

-- Function: Award Credits (Updated for NUMERIC)
CREATE OR REPLACE FUNCTION award_credits(
  p_user_id UUID,
  p_amount NUMERIC(10,2),
  p_source_type VARCHAR,
  p_source_id UUID,
  p_description TEXT
)
RETURNS VOID AS $$
DECLARE
  v_new_balance NUMERIC(10,2);
BEGIN
  -- Update wallet
  UPDATE credit_wallets
  SET balance = balance + p_amount,
      lifetime_earned = lifetime_earned + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Create transaction record
  INSERT INTO credit_transactions (
    user_id, transaction_type, amount, balance_after,
    source_type, source_id, description
  ) VALUES (
    p_user_id, 'earned', p_amount, v_new_balance,
    p_source_type, p_source_id, p_description
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Spend Credits (Updated for NUMERIC)
CREATE OR REPLACE FUNCTION spend_credits(
  p_user_id UUID,
  p_amount NUMERIC(10,2),
  p_source_type VARCHAR,
  p_source_id UUID,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance NUMERIC(10,2);
  v_new_balance NUMERIC(10,2);
BEGIN
  -- Check balance
  SELECT balance INTO v_current_balance
  FROM credit_wallets
  WHERE user_id = p_user_id;
  
  IF v_current_balance < p_amount THEN
    RETURN FALSE; -- Insufficient funds
  END IF;
  
  -- Update wallet
  UPDATE credit_wallets
  SET balance = balance - p_amount,
      lifetime_spent = lifetime_spent + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Create transaction record
  INSERT INTO credit_transactions (
    user_id, transaction_type, amount, balance_after,
    source_type, source_id, description
  ) VALUES (
    p_user_id, 'spent', -p_amount, v_new_balance,
    p_source_type, p_source_id, p_description
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Note: These functions now support decimal credit amounts (e.g., 125.5 credits)

