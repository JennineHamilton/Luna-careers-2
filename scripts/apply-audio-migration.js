/**
 * Apply the assessment_audio_files migration
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Hardcode the connection string for this one-time migration
const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260214000003_create_assessment_audio_files.sql');

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    console.log('📄 Reading migration file...');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`✅ Loaded ${sql.length} characters\n`);

    console.log('🚀 Running migration: 20260214000003_create_assessment_audio_files.sql');
    await client.query(sql);
    console.log('✅ Migration completed successfully!\n');

    console.log('📋 Next steps:');
    console.log('1. Run: node scripts/generate-typescript-types.js');
    console.log('2. Run: npm run build');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

runMigration();

