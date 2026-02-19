-- ============================================================
-- Enable pgcrypto extension for gen_random_bytes function
-- ============================================================

-- Enable pgcrypto extension (provides gen_random_bytes and other crypto functions)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Also ensure it's available in public schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

