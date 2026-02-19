/**
 * Fix Knowledge Assessment Delete Policies migration
 * Run with: node scripts/fix-knowledge-assessment-delete-policies.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

const migrationFile = '20260218000003_fix_knowledge_assessment_delete_policies.sql';

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

    console.log('\n🎉 Knowledge Assessment Delete Policies migration applied successfully!');
    console.log('\n📊 Summary:');
    console.log('  ✅ Fixed RLS policies for knowledge_assessments');
    console.log('  ✅ Fixed RLS policies for knowledge_questions');
    console.log('  ✅ Fixed RLS policies for knowledge_question_options');
    console.log('  ✅ Split FOR ALL policies into explicit SELECT, INSERT, UPDATE, DELETE');
    console.log('  ✅ Platform admins can now delete assessments and questions');
    console.log('\n🔄 Next step: Run the trigger fix migration');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

applyMigration();

