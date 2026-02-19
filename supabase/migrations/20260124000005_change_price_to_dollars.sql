-- =====================================================
-- Change Price Fields from Credits to Dollars
-- =====================================================
-- Changes price_credits to price (storing dollar values)
-- in modules, courses, and programs tables
-- =====================================================

-- 1. MODULES TABLE
-- Rename price_credits to price and convert values from credits to dollars
-- Assuming current values are in credits (e.g., 1000 credits = $10)
ALTER TABLE modules
  RENAME COLUMN price_credits TO price;

-- Update the data type to DECIMAL for dollar values
ALTER TABLE modules
  ALTER COLUMN price TYPE DECIMAL(10, 2);

-- Convert existing credit values to dollar values (divide by 100)
-- Example: 1000 credits becomes 10.00 dollars
UPDATE modules
SET price = price / 100
WHERE price > 0;

-- Add comment
COMMENT ON COLUMN modules.price IS 'Price in dollars (not credits). Use credits_per_dollar setting to calculate credit equivalent.';

-- 2. COURSES TABLE
ALTER TABLE courses
  RENAME COLUMN price_credits TO price;

ALTER TABLE courses
  ALTER COLUMN price TYPE DECIMAL(10, 2);

UPDATE courses
SET price = price / 100
WHERE price > 0;

COMMENT ON COLUMN courses.price IS 'Price in dollars (not credits). Use credits_per_dollar setting to calculate credit equivalent.';

-- 3. PROGRAMS TABLE
ALTER TABLE programs
  RENAME COLUMN price_credits TO price;

ALTER TABLE programs
  ALTER COLUMN price TYPE DECIMAL(10, 2);

UPDATE programs
SET price = price / 100
WHERE price > 0;

COMMENT ON COLUMN programs.price IS 'Price in dollars (not credits). Use credits_per_dollar setting to calculate credit equivalent.';

-- 4. UPDATE PURCHASES TABLE
-- Rename columns to reflect dollar values
ALTER TABLE purchases
  RENAME COLUMN original_price_credits TO original_price;

ALTER TABLE purchases
  RENAME COLUMN discount_amount_credits TO discount_amount;

ALTER TABLE purchases
  RENAME COLUMN final_price_credits TO final_price;

-- Change data types to DECIMAL
ALTER TABLE purchases
  ALTER COLUMN original_price TYPE DECIMAL(10, 2);

ALTER TABLE purchases
  ALTER COLUMN discount_amount TYPE DECIMAL(10, 2);

ALTER TABLE purchases
  ALTER COLUMN final_price TYPE DECIMAL(10, 2);

-- Convert existing values from credits to dollars
UPDATE purchases
SET original_price = original_price / 100,
    discount_amount = discount_amount / 100,
    final_price = final_price / 100
WHERE original_price > 0 OR discount_amount > 0 OR final_price > 0;

-- Add comments
COMMENT ON COLUMN purchases.original_price IS 'Original price in dollars before discounts';
COMMENT ON COLUMN purchases.discount_amount IS 'Discount amount in dollars';
COMMENT ON COLUMN purchases.final_price IS 'Final price in dollars after discounts';

