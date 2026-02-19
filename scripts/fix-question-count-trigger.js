/**
 * Fix Question Count Trigger migration
 * Run with: node scripts/fix-question-count-trigger.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

const migrationFile = '20260218000004_fix_question_count_trigger.sql';

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

    console.log('\n🎉 Question Count Trigger migration applied successfully!');
    console.log('\n📊 Summary:');
    console.log('  ✅ Updated update_assessment_question_count() trigger function');
    console.log('  ✅ Trigger now auto-adjusts questions_per_attempt when deleting questions');
    console.log('  ✅ Updated valid_questions_per_attempt constraint');
    console.log('  ✅ Constraint now allows questions_per_attempt = 0 when total_questions_in_pool = 0');
    console.log('  ✅ Fixed any existing bad data in the database');
    console.log('\n🔄 Next step: Test deleting questions and assessments in the admin portal');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

applyMigration();

