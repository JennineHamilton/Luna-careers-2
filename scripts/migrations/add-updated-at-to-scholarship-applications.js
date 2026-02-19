/**
 * Migration: Add updated_at column to scholarship_applications table
 *
 * This migration adds an updated_at timestamp column to track when
 * scholarship applications are modified (e.g., withdrawn, status changes).
 * This provides transparency for both users and admins.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

async function runMigration() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\n');

    // Read the migration SQL file
    const migrationFile = '20260125000001_add_updated_at_to_scholarship_applications.sql';
    const filePath = path.join(__dirname, '../../supabase/migrations', migrationFile);

    console.log(`📄 Applying migration: ${migrationFile}`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      await client.query(sql);
      console.log(`✅ Successfully applied: ${migrationFile}\n`);
      console.log('✅ Migration completed successfully!');
      console.log('');
      console.log('The following changes were made:');
      console.log('  - Added updated_at column to scholarship_applications table');
      console.log('  - Created trigger function to auto-update updated_at on changes');
      console.log('  - Created trigger to call the function on UPDATE');
      console.log('  - Set updated_at = applied_at for existing records');
      console.log('');
    } catch (error) {
      console.error(`❌ Error applying migration: ${error.message}`);
      throw error;
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

runMigration();

