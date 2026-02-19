/**
 * Apply Decimal Prices Migration
 * Changes INTEGER columns to NUMERIC(10,2) to support decimal values
 */

const { getDbClient } = require('./db-config');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const client = getDbClient();

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\n');

    const migrationFile = '20260126000001_fix_decimal_prices.sql';
    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);

    console.log(`📄 Applying migration: ${migrationFile}`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf8');

    await client.query(sql);
    console.log(`✅ Migration applied successfully\n`);

    console.log('🎉 Decimal prices migration complete!');
    console.log('\n📊 Summary:');
    console.log('  ✅ awarded_scholarships: original_price, discounted_price → NUMERIC(10,2)');
    console.log('  ✅ modules, courses, programs: price → NUMERIC(10,2)');
    console.log('  ✅ credit_wallets: balance, lifetime_earned, lifetime_spent → NUMERIC(10,2)');
    console.log('  ✅ credit_transactions: amount, balance_after → NUMERIC(10,2)');
    console.log('  ✅ credit_earning_rules: credits_awarded → NUMERIC(10,2)');
    console.log('\n💡 Benefits:');
    console.log('  - Prices can now be $12.50 instead of rounding to $13');
    console.log('  - Credits can now be 125 instead of rounding to 130');
    console.log('  - Accurate scholarship discounts (e.g., 75% of $50 = $12.50)');

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

