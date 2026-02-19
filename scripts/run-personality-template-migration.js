/**
 * Apply Professional Personality Profile template migration to Supabase database
 * Run with: node scripts/run-personality-template-migration.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

const migrationFile = '20260215000003_create_personality_assessment_template.sql';

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

    console.log('🎉 Personality assessment template created successfully!\n');
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

applyMigration();

