/**
 * Apply SCORM Extraction Status migration to Supabase database
 * Run with: node scripts/run-migration-scorm-extraction-status.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

const migrationFile = '20260201000002_add_scorm_extraction_status.sql';

async function applyMigration() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\n');

    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);

    console.log(`📄 Applying migration: ${migrationFile}`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      await client.query(sql);
      console.log(`✅ Successfully applied: ${migrationFile}\n`);
    } catch (error) {
      console.error(`❌ Error applying ${migrationFile}:`);
      console.error(error.message);
      console.error('\nFull error:', error);
      throw error;
    }

    console.log('\n🎉 Migration applied successfully!');
    console.log('\n📊 Summary:');
    console.log('  ✅ Added column: scorm_extraction_status (VARCHAR(20))');
    console.log('  ✅ Added column: scorm_extraction_error (TEXT)');
    console.log('  ✅ Added column: scorm_extracted_at (TIMESTAMPTZ)');
    console.log('  ✅ Created index: idx_lessons_extraction_status');
    console.log('  ✅ Updated existing lessons with scorm_launch_url to "completed" status');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

applyMigration();

