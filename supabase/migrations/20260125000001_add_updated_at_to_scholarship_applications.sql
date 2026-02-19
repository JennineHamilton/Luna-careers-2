-- Add updated_at column to scholarship_applications table
-- This provides transparency for tracking when applications are modified

ALTER TABLE scholarship_applications
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_scholarship_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scholarship_applications_updated_at_trigger
BEFORE UPDATE ON scholarship_applications
FOR EACH ROW
EXECUTE FUNCTION update_scholarship_applications_updated_at();

-- Set updated_at to applied_at for existing records
UPDATE scholarship_applications
SET updated_at = applied_at
WHERE updated_at IS NULL;

