/**
 * Apply assessment type migrations to Supabase database
 * Run with: node scripts/run-assessment-type-migrations.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

const migrationFiles = [
  '20260215000004_add_assessment_types.sql',
  '20260215000005_update_personality_template_type.sql'
];

async function applyMigrations() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\n');

    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, '..', 'supabase', 'migrations', file);
      
      console.log(`📄 Applying migration: ${file}`);
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Migration file not found: ${filePath}`);
        process.exit(1);
      }
      
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await client.query(sql);
        console.log(`✅ Successfully applied: ${file}\n`);
      } catch (error) {
        console.error(`❌ Error applying ${file}:`);
        console.error(error.message);
        console.error('\nFull error:', error);
        throw error;
      }
    }

    console.log('🎉 All migrations applied successfully!\n');
    console.log('📋 Next steps:');
    console.log('1. Run: node scripts/extract-schema.js');
    console.log('2. Run: node scripts/generate-typescript-types.js');
    console.log('3. Create personality assessment modal component');

  } catch (error) {
    console.error('❌ Migration process failed');
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

applyMigrations();

