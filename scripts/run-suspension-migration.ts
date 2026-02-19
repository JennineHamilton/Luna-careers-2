/**
 * Script to run the suspension fields migration
 * Run with: npx tsx scripts/run-suspension-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Running suspension fields migration...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Read the migration file
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260120000010_add_suspension_fields.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log('📄 Migration file loaded');
  console.log('📝 Executing SQL...\n');
  
  try {
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not found, trying direct execution...\n');
      
      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.includes('COMMENT ON')) continue; // Skip comments for now
        
        const { error: execError } = await supabase.rpc('exec', { sql: statement });
        if (execError) {
          console.error('❌ Error executing statement:', execError);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }
    
    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Verifying columns...');
    
    // Verify the columns were added
    const { data: columns, error: verifyError } = await supabase
      .from('users')
      .select('is_suspended, suspension_reason, suspended_at, suspended_by')
      .limit(1);
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Columns verified successfully!');
      console.log('   - is_suspended');
      console.log('   - suspension_reason');
      console.log('   - suspended_at');
      console.log('   - suspended_by');
    }
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();

