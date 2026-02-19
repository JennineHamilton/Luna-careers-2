-- Add profession field to users table
-- This field stores the user's professional title/role (e.g., "Digital Solutions Architect")

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS profession TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.users.profession IS 'User professional title or role';

