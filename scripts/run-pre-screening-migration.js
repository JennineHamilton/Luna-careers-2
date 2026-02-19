/**
 * Apply Pre-Screening Engine migration to Supabase database
 * Run with: node scripts/run-pre-screening-migration.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

const migrationFile = '20260214000002_create_pre_screening_engine.sql';

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

    console.log('\n🎉 Pre-Screening Engine migration applied successfully!');
    console.log('\n📊 Summary:');
    console.log('  ✅ Created table: assessment_templates');
    console.log('  ✅ Created table: assessment_attempts');
    console.log('  ✅ Created table: user_skill_badges');
    console.log('  ✅ Created function: calculate_skill_level()');
    console.log('  ✅ Created RLS policies for all tables');
    console.log('  ✅ Created indexes for performance');
    console.log('  ✅ Created updated_at triggers');
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

