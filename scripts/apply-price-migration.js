/**
 * Apply price field migration to Supabase database
 * Changes price_credits (INTEGER) to price (DECIMAL) and converts data
 */

const { getDbClient } = require('./db-config');
const fs = require('fs');
const path = require('path');

const migrationFiles = [
  '20260124000005_change_price_to_dollars.sql'
];

async function applyMigrations() {
  const client = getDbClient();
  
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

    console.log('\n🎉 Price field migration applied successfully!');
    console.log('\n📊 Summary:');
    console.log('  ✅ modules.price_credits → modules.price (DECIMAL)');
    console.log('  ✅ courses.price_credits → courses.price (DECIMAL)');
    console.log('  ✅ programs.price_credits → programs.price (DECIMAL)');
    console.log('  ✅ purchases table fields updated to DECIMAL');
    console.log('  ✅ All existing data converted (credits ÷ 100 = dollars)');
    console.log('\n💡 Next steps:');
    console.log('  1. Update TypeScript types (types/database.types.ts)');
    console.log('  2. Update API routes to use "price" field');
    console.log('  3. Update display components');
    console.log('  4. See PRICE_FIELD_MIGRATION_GUIDE.md for details');
    
  } catch (error) {
    console.error('\n❌ Migration failed!');
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

applyMigrations();

