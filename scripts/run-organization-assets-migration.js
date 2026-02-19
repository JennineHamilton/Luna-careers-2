/**
 * Apply Organization Assets Storage migration to Supabase database
 * Run with: node scripts/run-organization-assets-migration.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';

const migrationFile = '20260220000001_organization_assets_storage.sql';

async function applyMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

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
      throw error;
    }

    console.log('\n🎉 Organization Assets Storage migration applied successfully!');
    console.log('\n📊 Summary:');
    console.log('  ✅ Created bucket: organization-assets (public, 5MB)');
    console.log('  ✅ Created function: storage_user_can_upload_to_org()');
    console.log('  ✅ RLS: Org members can upload/update/delete logo & banner');
    console.log('  ✅ RLS: Public read for displaying logos/banners');
    console.log('\n🔄 Organization logo and banner uploads should now work.');
  } catch (error) {
    console.error('\n❌ Migration failed!');
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

applyMigration();
