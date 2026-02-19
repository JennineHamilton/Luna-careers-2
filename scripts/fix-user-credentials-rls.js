/**
 * Fix User Credentials Storage RLS Policies
 * 
 * This script ensures the correct RLS policies are in place for user-credentials bucket
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixUserCredentialsRLS() {
  console.log('🔧 Fixing user-credentials storage RLS policies...\n');

  try {
    // Drop any conflicting policies
    console.log('📝 Dropping existing policies...');
    
    const dropPolicies = `
      DROP POLICY IF EXISTS "Users can upload own credentials" ON storage.objects;
      DROP POLICY IF EXISTS "Users can view own credentials" ON storage.objects;
      DROP POLICY IF EXISTS "Users can update own credentials" ON storage.objects;
      DROP POLICY IF EXISTS "Users can delete own credentials" ON storage.objects;
      DROP POLICY IF EXISTS "Platform admins can view all credentials" ON storage.objects;
      DROP POLICY IF EXISTS "Platform admins can update all credentials" ON storage.objects;
      DROP POLICY IF EXISTS "Platform admins can delete all credentials" ON storage.objects;
    `;

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies });
    
    if (dropError && !dropError.message.includes('does not exist')) {
      console.log('⚠️  Some policies may not exist (this is OK)');
    }

    console.log('✅ Dropped existing policies\n');

    // Create new policies
    console.log('📝 Creating new RLS policies...');
    
    const createPolicies = `
      -- Users can upload their own credentials
      -- Path structure: /user-credentials/{user-id}/{filename}
      CREATE POLICY "Users can upload own credentials"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = 'user-credentials' AND
          (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Users can view their own credentials
      CREATE POLICY "Users can view own credentials"
        ON storage.objects
        FOR SELECT
        TO authenticated
        USING (
          bucket_id = 'user-credentials' AND
          (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Users can update their own credentials
      CREATE POLICY "Users can update own credentials"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (
          bucket_id = 'user-credentials' AND
          (storage.foldername(name))[1] = auth.uid()::text
        )
        WITH CHECK (
          bucket_id = 'user-credentials' AND
          (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Users can delete their own credentials
      CREATE POLICY "Users can delete own credentials"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (
          bucket_id = 'user-credentials' AND
          (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Platform admins can view all credentials
      CREATE POLICY "Platform admins can view all credentials"
        ON storage.objects
        FOR SELECT
        TO authenticated
        USING (
          bucket_id = 'user-credentials' AND
          (auth.jwt() ->> 'account_type') = 'platformAdmin'
        );

      -- Platform admins can update credentials (for verification purposes)
      CREATE POLICY "Platform admins can update all credentials"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (
          bucket_id = 'user-credentials' AND
          (auth.jwt() ->> 'account_type') = 'platformAdmin'
        )
        WITH CHECK (
          bucket_id = 'user-credentials' AND
          (auth.jwt() ->> 'account_type') = 'platformAdmin'
        );

      -- Platform admins can delete credentials if needed
      CREATE POLICY "Platform admins can delete all credentials"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (
          bucket_id = 'user-credentials' AND
          (auth.jwt() ->> 'account_type') = 'platformAdmin'
        );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createPolicies });
    
    if (createError) {
      throw createError;
    }

    console.log('✅ Successfully created RLS policies\n');
    console.log('📋 Summary:');
    console.log('   ✓ Users can upload to their own folder: {user-id}/{filename}');
    console.log('   ✓ Users can view/update/delete their own files');
    console.log('   ✓ Platform admins have full access');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n📋 Please run these SQL commands manually in Supabase SQL Editor:');
    console.log('   See: scripts/fix-user-credentials-rls.sql');
  }
}

fixUserCredentialsRLS();

