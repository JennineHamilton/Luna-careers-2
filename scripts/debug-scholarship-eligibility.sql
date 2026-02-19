-- Debug Scholarship Eligibility
-- Run this query to check why scholarships might not be showing as eligible

-- 1. Check all scholarships
SELECT 
  s.id,
  s.name,
  s.type,
  s.is_active,
  s.valid_from,
  s.valid_until,
  s.slots_total,
  s.slots_remaining,
  s.discount_percentage
FROM scholarships s
ORDER BY s.created_at DESC;

-- 2. Check scholarship_content mappings
SELECT 
  sc.id,
  sc.scholarship_id,
  sc.content_type,
  sc.content_id,
  s.name as scholarship_name,
  s.is_active,
  s.valid_from,
  s.valid_until,
  s.slots_remaining
FROM scholarship_content sc
JOIN scholarships s ON s.id = sc.scholarship_id
ORDER BY sc.created_at DESC;

-- 3. Check for a specific module (replace 'YOUR_MODULE_ID' with actual module ID)
SELECT 
  m.id as module_id,
  m.title as module_title,
  sc.id as scholarship_content_id,
  s.id as scholarship_id,
  s.name as scholarship_name,
  s.is_active,
  s.valid_from,
  s.valid_until,
  s.slots_remaining,
  CASE 
    WHEN s.is_active = false THEN 'Scholarship is not active'
    WHEN s.valid_from IS NOT NULL AND s.valid_from > NOW() THEN 'Scholarship not yet valid'
    WHEN s.valid_until IS NOT NULL AND s.valid_until < NOW() THEN 'Scholarship expired'
    WHEN s.slots_remaining IS NOT NULL AND s.slots_remaining <= 0 THEN 'No slots remaining'
    ELSE 'ELIGIBLE'
  END as eligibility_status
FROM modules m
LEFT JOIN scholarship_content sc ON sc.content_id = m.id AND sc.content_type = 'module'
LEFT JOIN scholarships s ON s.id = sc.scholarship_id
WHERE m.id = 'YOUR_MODULE_ID';

-- 4. Check all modules with scholarships
SELECT 
  m.id as module_id,
  m.title as module_title,
  s.name as scholarship_name,
  s.is_active,
  s.valid_from,
  s.valid_until,
  s.slots_remaining,
  CASE 
    WHEN s.is_active = false THEN 'Inactive'
    WHEN s.valid_from IS NOT NULL AND s.valid_from > NOW() THEN 'Not yet valid'
    WHEN s.valid_until IS NOT NULL AND s.valid_until < NOW() THEN 'Expired'
    WHEN s.slots_remaining IS NOT NULL AND s.slots_remaining <= 0 THEN 'No slots'
    ELSE 'ELIGIBLE'
  END as status
FROM modules m
JOIN scholarship_content sc ON sc.content_id = m.id AND sc.content_type = 'module'
JOIN scholarships s ON s.id = sc.scholarship_id
ORDER BY m.title;

