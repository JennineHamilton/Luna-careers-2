-- Migration: Fix spend_credits race condition
-- Add SELECT ... FOR UPDATE to prevent concurrent spend operations from
-- both passing the balance check and causing a negative balance.

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
  -- Lock the row to prevent concurrent spends from racing
  SELECT balance INTO v_current_balance
  FROM credit_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RETURN FALSE; -- Wallet not found
  END IF;
  
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

