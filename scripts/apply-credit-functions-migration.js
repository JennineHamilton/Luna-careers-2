/**
 * Apply Credit Functions Migration
 * Updates award_credits and spend_credits functions to support NUMERIC(10,2)
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

async function applyMigration() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\n');

    const migrationFile = '20260126000002_fix_credit_functions_decimal.sql';
    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);

    console.log(`📄 Applying migration: ${migrationFile}`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf8');

    await client.query(sql);
    console.log(`✅ Migration applied successfully\n`);

    console.log('🎉 Credit functions migration complete!');
    console.log('\n📊 Summary:');
    console.log('  ✅ award_credits: p_amount INTEGER → NUMERIC(10,2)');
    console.log('  ✅ award_credits: v_new_balance INTEGER → NUMERIC(10,2)');
    console.log('  ✅ spend_credits: p_amount INTEGER → NUMERIC(10,2)');
    console.log('  ✅ spend_credits: v_current_balance INTEGER → NUMERIC(10,2)');
    console.log('  ✅ spend_credits: v_new_balance INTEGER → NUMERIC(10,2)');
    console.log('\n💡 Benefits:');
    console.log('  - Functions now accept decimal credit amounts (e.g., 125.5 credits)');
    console.log('  - Transaction history balance_after will be accurate');
    console.log('  - Credit tracker dropdown will match transaction history');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

applyMigration();

