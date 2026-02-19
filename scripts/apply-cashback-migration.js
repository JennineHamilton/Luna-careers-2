/**
 * Apply Cashback Percentage Migration
 * Adds cashback_percentage setting to payment_settings table
 */

const { getDbClient } = require('./db-config');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const client = getDbClient();

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database\n');

    const migrationFile = '20260125000001_add_cashback_percentage.sql';
    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);

    console.log(`📄 Applying migration: ${migrationFile}`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf8');

    await client.query(sql);
    console.log(`✅ Migration applied successfully\n`);

    console.log('🎉 Cashback percentage migration complete!');
    console.log('\n📊 Summary:');
    console.log('  ✅ Added cashback_percentage setting (default: 10%)');
    console.log('\n💡 Next steps:');
    console.log('  1. Platform settings UI updated to manage cashback percentage');
    console.log('  2. Use cashback_percentage in enrollment/purchase logic');
    console.log('  3. Test cashback calculations with new percentage');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();

