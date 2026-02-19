-- Verify SCORM bucket size limit
SELECT 
  id,
  name,
  file_size_limit as size_bytes,
  ROUND(file_size_limit / 1024.0 / 1024.0, 2) as size_mb,
  ROUND(file_size_limit / 1024.0 / 1024.0 / 1024.0, 2) as size_gb
FROM storage.buckets
WHERE id = 'scorm-packages';

