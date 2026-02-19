-- Migration: Update organization address fields
-- Replace headquarters_location with separate address fields

-- Add new address columns
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS street_address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT;

-- Migrate existing data from headquarters_location to new fields
-- This attempts to parse the old format: "Street, City, State, Country"
UPDATE public.organizations
SET 
  street_address = CASE 
    WHEN headquarters_location IS NOT NULL THEN
      SPLIT_PART(headquarters_location, ',', 1)
    ELSE NULL
  END,
  city = CASE 
    WHEN headquarters_location IS NOT NULL AND array_length(string_to_array(headquarters_location, ','), 1) >= 2 THEN
      TRIM(SPLIT_PART(headquarters_location, ',', 2))
    ELSE NULL
  END,
  state = CASE 
    WHEN headquarters_location IS NOT NULL AND array_length(string_to_array(headquarters_location, ','), 1) >= 3 THEN
      TRIM(SPLIT_PART(headquarters_location, ',', 3))
    ELSE NULL
  END,
  country = CASE 
    WHEN headquarters_location IS NOT NULL AND array_length(string_to_array(headquarters_location, ','), 1) >= 4 THEN
      TRIM(SPLIT_PART(headquarters_location, ',', 4))
    WHEN headquarters_location IS NOT NULL AND array_length(string_to_array(headquarters_location, ','), 1) = 3 THEN
      TRIM(SPLIT_PART(headquarters_location, ',', 3))
    WHEN headquarters_location IS NOT NULL AND array_length(string_to_array(headquarters_location, ','), 1) = 2 THEN
      TRIM(SPLIT_PART(headquarters_location, ',', 2))
    WHEN headquarters_location IS NOT NULL AND array_length(string_to_array(headquarters_location, ','), 1) = 1 THEN
      TRIM(headquarters_location)
    ELSE NULL
  END
WHERE headquarters_location IS NOT NULL;

-- Drop the old headquarters_location column
ALTER TABLE public.organizations
  DROP COLUMN IF EXISTS headquarters_location;

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.street_address IS 'Street address of organization headquarters';
COMMENT ON COLUMN public.organizations.city IS 'City of organization headquarters';
COMMENT ON COLUMN public.organizations.state IS 'State/Province of organization headquarters';
COMMENT ON COLUMN public.organizations.country IS 'Country of organization headquarters';

