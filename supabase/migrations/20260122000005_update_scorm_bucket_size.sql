-- =====================================================
-- Update SCORM Packages Bucket Size Limit
-- =====================================================
-- Purpose: Increase SCORM package size limit from 100MB to 10GB
-- Date: 2026-01-22

-- Update the scorm-packages bucket file size limit
UPDATE storage.buckets
SET file_size_limit = 10737418240 -- 10GB in bytes (10 * 1024 * 1024 * 1024)
WHERE id = 'scorm-packages';

