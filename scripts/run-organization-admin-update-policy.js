/**
 * Apply Organization Admin Update Policy migration
 * Run with: node scripts/run-organization-admin-update-policy.js
 *
 * This allows org_admins to update their organization (logo_url, cover_image_url, etc.)
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:BANgalOO5317@db.mdwneiiqjlwlcwwnzjjt.supabase.co:5432/postgres';
const migrationFile = '20260220000002_organization_admin_update_policy.sql';

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

    await client.query(sql);
    console.log(`✅ Successfully applied: ${migrationFile}\n`);

    console.log('🎉 Organization admin update policy applied!');
    console.log('\n📊 Summary:');
    console.log('  ✅ Org admins can now UPDATE their organization');
    console.log('  ✅ Logo and banner URLs will persist and render on the profile page');
  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

applyMigration();
