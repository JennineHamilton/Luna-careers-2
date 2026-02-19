/**
 * Check SCORM bucket size limit
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBucketSize() {
  try {
    console.log('Checking SCORM bucket size limit...\n');

    // Query the storage.buckets table
    const { data, error } = await supabase
      .from('buckets')
      .select('id, name, file_size_limit')
      .eq('id', 'scorm-packages')
      .single();

    if (error) {
      console.error('Error querying bucket:', error);
      return;
    }

    if (!data) {
      console.log('❌ SCORM bucket not found');
      return;
    }

    const sizeInBytes = data.file_size_limit;
    const sizeInMB = sizeInBytes / 1024 / 1024;
    const sizeInGB = sizeInBytes / 1024 / 1024 / 1024;

    console.log('Bucket:', data.name);
    console.log('Size Limit (bytes):', sizeInBytes);
    console.log('Size Limit (MB):', sizeInMB.toFixed(2));
    console.log('Size Limit (GB):', sizeInGB.toFixed(2));

    if (sizeInBytes === 10737418240) {
      console.log('\n✅ Bucket is correctly set to 10GB');
    } else {
      console.log('\n❌ Bucket is NOT set to 10GB');
      console.log('Expected: 10737418240 bytes (10GB)');
      console.log('Actual:', sizeInBytes, 'bytes');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkBucketSize();

