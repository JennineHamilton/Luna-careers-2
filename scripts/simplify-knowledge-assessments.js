const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

async function runMigration() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database');

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260218000005_simplify_knowledge_assessments.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: 20260218000005_simplify_knowledge_assessments.sql');
    await client.query(sql);
    console.log('✅ Migration completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

runMigration();

