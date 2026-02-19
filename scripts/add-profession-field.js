/**
 * Add profession field to users table
 * Run with: node scripts/add-profession-field.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const CONNECTION_STRING = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

async function addProfessionField() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260127000001_add_profession_to_users.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('\nAdding profession field to users table...');
    await client.query(sql);
    console.log('✅ Profession field added successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

addProfessionField()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to add profession field');
    process.exit(1);
  });

