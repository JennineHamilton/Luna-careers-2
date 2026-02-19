/**
 * Apply Professional Personality Profile migrations to Supabase database
 * Run with: node scripts/run-personality-migrations.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

const migrationFiles = [
  '20260215000001_create_personality_assessment_schema.sql',
  '20260215000002_seed_ipip50_questions.sql',
  '20260215000003_create_personality_assessment_template.sql'
];

async function applyMigrations() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\n');

    for (const migrationFile of migrationFiles) {
      const filePath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);
      
      console.log(`📄 Applying migration: ${migrationFile}`);
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Migration file not found: ${filePath}`);
        continue;
      }
      
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await client.query(sql);
        console.log(`✅ Successfully applied: ${migrationFile}\n`);
      } catch (error) {
        console.error(`❌ Error applying ${migrationFile}:`);
        console.error(error.message);
        console.error('\nFull error:', error);
        throw error; // Stop on first error
      }
    }

    console.log('🎉 All personality assessment migrations applied successfully!\n');
    console.log('📋 Next steps:');
    console.log('1. Run: node scripts/generate-typescript-types.js');
    console.log('2. Implement assessment UI components');
    console.log('3. Create API routes for personality assessment');

  } catch (error) {
    console.error('❌ Migration process failed');
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

applyMigrations();

