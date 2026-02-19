/**
 * Remove Pre-Screening Assessment Engine from Database
 * Applies the rollback migration to drop all pre-screening tables and objects
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read connection string from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);

if (!dbUrlMatch) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const connectionString = dbUrlMatch[1].trim();

async function removePrescreeningEngine() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\n');

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260214000001_remove_pre_screening_engine.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Applying migration: 20260214000001_remove_pre_screening_engine.sql');
    console.log('⚠️  This will permanently remove all pre-screening assessment data!\n');
    
    await client.query(sql);
    
    console.log('\n✅ Migration applied successfully!');
    console.log('\n🎉 Pre-Screening Assessment Engine Removed!');
    console.log('\n📊 Summary:');
    console.log('  ✅ Dropped table: assessments');
    console.log('  ✅ Dropped table: assessment_results');
    console.log('  ✅ Dropped table: user_assessment_history');
    console.log('  ✅ Dropped table: content_library');
    console.log('  ✅ Dropped 5 database functions');
    console.log('  ✅ Dropped all RLS policies');
    console.log('  ✅ Dropped all indexes');
    console.log('\n✨ Database is now clean and ready for a fresh pre-screening implementation!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

removePrescreeningEngine();

