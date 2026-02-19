/**
 * Apply Quiz Attempts migration to Supabase database
 * Run with: node scripts/run-quiz-migration.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

const migrationFile = '20260204000001_create_quiz_attempts_table.sql';

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
    console.log('  ✅ Created table: quiz_attempts');
    console.log('  ✅ Created function: get_next_attempt_number()');
    console.log('  ✅ Created function: get_latest_quiz_attempt()');
    console.log('  ✅ Created function: get_best_quiz_attempt()');
    console.log('  ✅ Created RLS policies for quiz_attempts');
    console.log('  ✅ Created indexes for performance');
    console.log('\n🔄 Next step: Run npm run build to regenerate TypeScript types');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

applyMigration();

