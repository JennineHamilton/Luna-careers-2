/**
 * Reset Users Table RLS Policies
 * Drops ALL existing policies and recreates them correctly
 */

const { getDbClient } = require('./db-config');

async function resetRLS() {
  const client = getDbClient();

  try {
    console.log('🔧 Resetting users table RLS policies...\n');
    await client.connect();
    console.log('✅ Connected to database\n');

    // Step 1: Get all existing policies
    console.log('📋 Checking existing policies...');
    const existingPolicies = await client.query(`
      SELECT policyname 
      FROM pg_policies 
      WHERE tablename = 'users' AND schemaname = 'public'
    `);

    console.log(`   Found ${existingPolicies.rows.length} existing policies:\n`);
    existingPolicies.rows.forEach(row => {
      console.log(`   - ${row.policyname}`);
    });
    console.log('');

    // Step 2: Drop all existing policies
    console.log('🗑️  Dropping all existing policies...');
    for (const row of existingPolicies.rows) {
      const dropSQL = `DROP POLICY IF EXISTS "${row.policyname}" ON public.users;`;
      await client.query(dropSQL);
      console.log(`   ✓ Dropped: ${row.policyname}`);
    }
    console.log('');

    // Step 3: Create new JWT-based policies
    console.log('✨ Creating new JWT-based policies (no recursion)...\n');

    const policies = [
      {
        name: 'users_read_own',
        sql: `CREATE POLICY "users_read_own"
          ON public.users
          FOR SELECT
          TO authenticated
          USING (auth.uid() = id);`
      },
      {
        name: 'users_update_own',
        sql: `CREATE POLICY "users_update_own"
          ON public.users
          FOR UPDATE
          TO authenticated
          USING (auth.uid() = id)
          WITH CHECK (auth.uid() = id);`
      },
      {
        name: 'users_insert_own',
        sql: `CREATE POLICY "users_insert_own"
          ON public.users
          FOR INSERT
          TO authenticated
          WITH CHECK (auth.uid() = id);`
      },
      {
        name: 'users_read_platform_admin',
        sql: `CREATE POLICY "users_read_platform_admin"
          ON public.users
          FOR SELECT
          TO authenticated
          USING ((auth.jwt()->>'account_type') = 'platformAdmin');`
      },
      {
        name: 'users_update_platform_admin',
        sql: `CREATE POLICY "users_update_platform_admin"
          ON public.users
          FOR UPDATE
          TO authenticated
          USING ((auth.jwt()->>'account_type') = 'platformAdmin')
          WITH CHECK ((auth.jwt()->>'account_type') = 'platformAdmin');`
      },
      {
        name: 'users_insert_platform_admin',
        sql: `CREATE POLICY "users_insert_platform_admin"
          ON public.users
          FOR INSERT
          TO authenticated
          WITH CHECK ((auth.jwt()->>'account_type') = 'platformAdmin');`
      }
    ];

    for (const policy of policies) {
      await client.query(policy.sql);
      console.log(`   ✓ Created: ${policy.name}`);
    }
    console.log('');

    // Step 4: Verify RLS is enabled
    await client.query('ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;');
    console.log('✅ RLS enabled on users table\n');

    // Step 5: Verify the new policies
    const newPolicies = await client.query(`
      SELECT policyname, cmd 
      FROM pg_policies 
      WHERE tablename = 'users' AND schemaname = 'public'
      ORDER BY policyname
    `);

    console.log('📋 New RLS policies:');
    newPolicies.rows.forEach(row => {
      console.log(`   - ${row.policyname} (${row.cmd})`);
    });
    console.log(`\n   Total: ${newPolicies.rows.length} policies\n`);

    console.log('✅ SUCCESS! RLS policies have been reset.');
    console.log('   All policies now use JWT-based checks (no table queries)');
    console.log('   This prevents infinite recursion.\n');
    console.log('🎉 Please refresh your profile page - it should work now!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

resetRLS();

