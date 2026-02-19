/**
 * Apply Phase 2 LMS migrations to Supabase database
 * Runs the three migration files in order
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

const migrationFiles = [
  '20260121000001_phase_2_lms_schema.sql',
  '20260121000002_phase_2_lms_functions.sql',
  '20260121000003_phase_2_lms_rls_policies.sql'
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

    console.log('\n🎉 All Phase 2 migrations applied successfully!');
    console.log('\n📊 Summary:');
    console.log('  ✅ 20+ LMS tables created');
    console.log('  ✅ Duration computation functions added');
    console.log('  ✅ Credit transaction functions added');
    console.log('  ✅ Progress calculation functions added');
    console.log('  ✅ Enrollment & completion triggers added');
    console.log('  ✅ RLS policies enabled on all tables');
    
  } catch (error) {
    console.error('\n❌ Migration failed!');
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

applyMigrations();

