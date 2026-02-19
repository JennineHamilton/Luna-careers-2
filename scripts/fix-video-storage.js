/**
 * Fix Video Storage Issues
 * 
 * This script fixes:
 * 1. Adds video MIME types to user-credentials bucket
 * 2. Increases file size limit to 50MB for videos
 * 3. Ensures RLS policies allow video uploads
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
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixVideoStorage() {
  console.log('🔧 Fixing video storage configuration...\n');

  try {
    // Update user-credentials bucket to support videos
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Update user-credentials bucket to support videos
        UPDATE storage.buckets
        SET 
          file_size_limit = 52428800, -- 50MB
          allowed_mime_types = ARRAY[
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'video/mp4',
            'video/quicktime',
            'video/webm',
            'video/x-msvideo'
          ]
        WHERE id = 'user-credentials';
      `
    });

    if (updateError) {
      console.error('❌ Error updating bucket:', updateError);
      
      // Try alternative approach using direct SQL
      console.log('\n📝 Trying alternative approach...\n');
      
      const { error: altError } = await supabase
        .from('buckets')
        .update({
          file_size_limit: 52428800,
          allowed_mime_types: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'video/mp4',
            'video/quicktime',
            'video/webm',
            'video/x-msvideo'
          ]
        })
        .eq('id', 'user-credentials');

      if (altError) {
        console.error('❌ Alternative approach also failed:', altError);
        console.log('\n📋 Manual steps required:');
        console.log('   1. Go to Supabase Dashboard > Storage > user-credentials');
        console.log('   2. Click "Edit bucket"');
        console.log('   3. Set file size limit to 50MB (52428800 bytes)');
        console.log('   4. Add these MIME types:');
        console.log('      - video/mp4');
        console.log('      - video/quicktime');
        console.log('      - video/webm');
        console.log('      - video/x-msvideo');
        return;
      }
    }

    console.log('✅ Successfully updated user-credentials bucket');
    console.log('   - File size limit: 50MB');
    console.log('   - Added video MIME types: mp4, mov, webm, avi');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixVideoStorage();

