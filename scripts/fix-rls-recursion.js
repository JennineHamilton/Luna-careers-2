/**
 * Fix RLS Infinite Recursion Issue
 * Applies the migration to fix users table RLS policies
 */

const { getDbClient } = require('./db-config');
const fs = require('fs');
const path = require('path');

async function fixRLS() {
  const client = getDbClient();

  try {
    console.log('🔧 Fixing RLS infinite recursion issue...\n');
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260120000009_fix_users_rls_final.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Applying migration: 20260120000009_fix_users_rls_final.sql');
    console.log('   This will:');
    console.log('   - Drop all existing RLS policies on users table');
    console.log('   - Create new JWT-based policies (no table queries)');
    console.log('   - Prevent infinite recursion\n');

    await client.query(sql);
    
    console.log('✅ Migration applied successfully!\n');

    // Verify the policies
    const result = await client.query(`
      SELECT policyname, cmd 
      FROM pg_policies 
      WHERE tablename = 'users' AND schemaname = 'public'
      ORDER BY policyname
    `);

    console.log('📋 Current RLS policies on users table:');
    result.rows.forEach(row => {
      console.log(`   - ${row.policyname} (${row.cmd})`);
    });
    console.log(`\n   Total: ${result.rows.length} policies\n`);

    console.log('✅ RLS policies fixed! Please refresh your profile page.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

fixRLS();

