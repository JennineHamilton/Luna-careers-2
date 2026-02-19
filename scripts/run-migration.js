/**
 * Database Migration Runner
 * Connects to Supabase and runs SQL migrations
 */

const { getDbClient } = require('./db-config');
const fs = require('fs');
const path = require('path');

async function runMigration(filePath) {
  const client = getDbClient();

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`\nRunning migration: ${path.basename(filePath)}`);
    
    await client.query(sql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node scripts/run-migration.js <path-to-migration-file>');
  process.exit(1);
}

runMigration(migrationFile)
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed');
    process.exit(1);
  });

