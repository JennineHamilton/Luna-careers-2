/**
 * Fix RLS policies for personality_responses table
 * Run with: node scripts/fix-personality-rls.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

let connectionString = null;
for (const line of envLines) {
  if (line.startsWith('DATABASE_URL=')) {
    connectionString = line.substring('DATABASE_URL='.length).trim();
    break;
  }
}

if (!connectionString) {
  console.error('❌ Missing DATABASE_URL in .env.local');
  process.exit(1);
}

async function fixRLSPolicies() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('🔧 Fixing RLS policies for personality_responses table...\n');

    // Drop existing policies
    console.log('1. Dropping existing policies...');
    await client.query('DROP POLICY IF EXISTS "Users can insert own personality responses" ON personality_responses;');
    await client.query('DROP POLICY IF EXISTS "Users can view own personality responses" ON personality_responses;');
    await client.query('DROP POLICY IF EXISTS "Users can update own personality responses" ON personality_responses;');
    console.log('✅ Dropped existing policies\n');

    // Create new INSERT policy
    console.log('2. Creating new INSERT policy...');
    await client.query(`
      CREATE POLICY "Users can insert own personality responses"
        ON personality_responses FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM personality_attempts
            WHERE personality_attempts.id = attempt_id
            AND personality_attempts.user_id = auth.uid()
          )
        );
    `);
    console.log('✅ Created INSERT policy\n');

    // Create new SELECT policy
    console.log('3. Creating new SELECT policy...');
    await client.query(`
      CREATE POLICY "Users can view own personality responses"
        ON personality_responses FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM personality_attempts
            WHERE personality_attempts.id = personality_responses.attempt_id
            AND personality_attempts.user_id = auth.uid()
          )
        );
    `);
    console.log('✅ Created SELECT policy\n');

    // Create UPDATE policy for upsert operations
    console.log('4. Creating UPDATE policy...');
    await client.query(`
      CREATE POLICY "Users can update own personality responses"
        ON personality_responses FOR UPDATE
        USING (
          EXISTS (
            SELECT 1 FROM personality_attempts
            WHERE personality_attempts.id = personality_responses.attempt_id
            AND personality_attempts.user_id = auth.uid()
          )
        );
    `);
    console.log('✅ Created UPDATE policy\n');

    console.log('✅ RLS policies fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixRLSPolicies();

