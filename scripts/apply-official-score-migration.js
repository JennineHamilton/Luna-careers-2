/**
 * Apply official score flag migration to Supabase database
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Hardcoded connection string (from .env.local)
const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

async function applyMigration() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\n');

    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', '20260207000004_add_official_score_flag.sql');
    
    console.log(`📄 Applying migration: 20260207000004_add_official_score_flag.sql`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(filePath, 'utf8');
    
    await client.query(sql);
    console.log(`✅ Successfully applied migration!\n`);

    console.log('\n🎉 Migration applied successfully!');
    console.log('\n📊 Changes:');
    console.log('  ✅ Added column: is_official_score (BOOLEAN)');
    console.log('  ✅ Added column: score (DECIMAL)');
    console.log('  ✅ Added column: percentile (INTEGER)');
    console.log('  ✅ Added column: started_at (TIMESTAMPTZ)');
    console.log('  ✅ Added unique index: one official score per user/assessment');
    console.log('  ✅ Added check constraints for score and percentile');
    
  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error(error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

applyMigration();

