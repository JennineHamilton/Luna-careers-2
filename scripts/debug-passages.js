// Debug script to check what's in content_library
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Manually load .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPassages() {
  console.log('\n=== Checking content_library ===\n');
  
  const { data, error } = await supabase
    .from('content_library')
    .select('*')
    .eq('type', 'typing_passage')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} typing passages:\n`);
  
  data.forEach((row, i) => {
    console.log(`\n--- Passage ${i + 1} ---`);
    console.log('ID:', row.id);
    console.log('Assessment ID:', row.assessment_id);
    console.log('Content Hash in JSON:', row.content_data?.contentHash);
    console.log('Source:', row.content_data?.source);
    console.log('Passage Preview:', row.content_data?.passage?.substring(0, 100) + '...');
    console.log('Created:', row.created_at);
  });

  // Now check user_assessment_history
  console.log('\n\n=== Checking user_assessment_history ===\n');
  
  const { data: attempts, error: attemptsError } = await supabase
    .from('user_assessment_history')
    .select('id, assessment_id, content_hash, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (attemptsError) {
    console.error('Error:', attemptsError);
    return;
  }

  console.log(`Found ${attempts.length} recent attempts:\n`);
  
  attempts.forEach((attempt, i) => {
    console.log(`\n--- Attempt ${i + 1} ---`);
    console.log('ID:', attempt.id);
    console.log('Assessment ID:', attempt.assessment_id);
    console.log('Content Hash:', attempt.content_hash);
    console.log('Status:', attempt.status);
    console.log('Created:', attempt.created_at);
  });
}

checkPassages().then(() => process.exit(0));

