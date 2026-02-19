-- =====================================================
-- Update SCORM Packages Bucket Size Limit to 10MB
-- =====================================================
-- Purpose: Reduce SCORM package size limit from 10GB to 10MB
-- Date: 2026-01-22

-- Update the scorm-packages bucket file size limit
UPDATE storage.buckets
SET file_size_limit = 10485760 -- 10MB in bytes (10 * 1024 * 1024)
WHERE id = 'scorm-packages';

