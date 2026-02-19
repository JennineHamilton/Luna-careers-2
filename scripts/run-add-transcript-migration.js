const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

async function runMigration() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database');

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260214000005_add_transcript_to_audio_files.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: 20260214000005_add_transcript_to_audio_files.sql');
    await client.query(migrationSQL);
    console.log('✅ Successfully applied: 20260214000005_add_transcript_to_audio_files.sql');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

