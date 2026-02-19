/**
 * API Route: Background SCORM Extraction
 * POST /api/learning/scorm/extract-background
 * 
 * Extracts SCORM package in the background and updates lesson status
 * This should be called during lesson upload, NOT on page load
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import type { Database } from '@/types/database.types';

/**
 * POST /api/learning/scorm/extract-background
 * Extract SCORM package and upload to storage
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, scormPath } = body;

    if (!lessonId || !scormPath) {
      return NextResponse.json(
        { error: 'Missing lessonId or scormPath' },
        { status: 400 }
      );
    }

    // Create service role client (bypasses RLS)
    const supabase = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Update status to 'extracting'
    await supabase
      .from('lessons')
      .update({
        scorm_extraction_status: 'extracting',
        scorm_extraction_error: null
      })
      .eq('id', lessonId);

    // Download SCORM package from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('scorm-packages')
      .download(scormPath);

    if (downloadError || !fileData) {
      console.error('[SCORM Extract] Download error:', downloadError);
      await supabase
        .from('lessons')
        .update({
          scorm_extraction_status: 'failed',
          scorm_extraction_error: downloadError?.message || 'Failed to download SCORM package'
        })
        .eq('id', lessonId);
      
      return NextResponse.json(
        { error: 'Failed to download SCORM package', details: downloadError },
        { status: 500 }
      );
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract ZIP
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    // Find imsmanifest.xml
    const manifestEntry = zipEntries.find(
      entry => entry.entryName.toLowerCase() === 'imsmanifest.xml' ||
               entry.entryName.toLowerCase().endsWith('/imsmanifest.xml')
    );

    if (!manifestEntry) {
      console.error('[SCORM Extract] imsmanifest.xml not found');
      await supabase
        .from('lessons')
        .update({
          scorm_extraction_status: 'failed',
          scorm_extraction_error: 'imsmanifest.xml not found in SCORM package'
        } as any)
        .eq('id', lessonId);
      
      return NextResponse.json(
        { error: 'Invalid SCORM package: imsmanifest.xml not found' },
        { status: 400 }
      );
    }

    // Parse manifest
    const manifestXml = manifestEntry.getData().toString('utf8');
    const manifest = await parseStringPromise(manifestXml);

    // Find launch file from manifest
    let launchFile = 'index.html'; // default
    try {
      const resources = manifest?.manifest?.resources?.[0]?.resource;
      if (resources && resources.length > 0) {
        const mainResource = resources[0];
        if (mainResource.$?.href) {
          launchFile = mainResource.$.href;
        }
      }
    } catch (e) {
      console.warn('[SCORM Extract] Could not parse launch file from manifest, using default');
    }

    // Helper function to determine content type
    const getContentType = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase();
      const types: Record<string, string> = {
        'html': 'text/html',
        'htm': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'xml': 'application/xml',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'woff': 'font/woff',
        'woff2': 'font/woff2',
        'ttf': 'font/ttf',
      };
      return types[ext || ''] || 'application/octet-stream';
    };

    // Upload all files to scorm-extracted bucket
    let filesExtracted = 0;
    for (const entry of zipEntries) {
      if (!entry.isDirectory) {
        const storagePath = `${lessonId}/${entry.entryName}`;

        const { error: uploadError } = await supabase.storage
          .from('scorm-extracted')
          .upload(storagePath, entry.getData(), {
            contentType: getContentType(entry.entryName),
            upsert: true // Overwrite if exists
          });

        if (uploadError) {
          console.error(`[SCORM Extract] Error uploading ${entry.entryName}:`, uploadError);
        } else {
          filesExtracted++;
        }
      }
    }

    // Generate launch URL using proxy route
    const launchUrl = `/api/scorm/${lessonId}/${launchFile}`;

    // Update lesson with launch URL and mark as completed
    const { error: updateError } = await supabase
      .from('lessons')
      .update({
        scorm_launch_url: launchUrl,
        scorm_extraction_status: 'completed',
        scorm_extracted_at: new Date().toISOString(),
        scorm_extraction_error: null
      } as any)
      .eq('id', lessonId);

    if (updateError) {
      console.error('[SCORM Extract] Error updating lesson:', updateError);
      return NextResponse.json(
        { error: 'Extraction succeeded but failed to update lesson', details: updateError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      launchUrl,
      filesExtracted
    });

  } catch (error) {
    console.error('[SCORM Extract] Unexpected error:', error);

    // Try to update lesson status to failed
    try {
      const supabase = createServiceClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const body = await request.json();
      if (body.lessonId) {
        await supabase
          .from('lessons')
          .update({
            scorm_extraction_status: 'failed',
            scorm_extraction_error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', body.lessonId);
      }
    } catch (e) {
      console.error('[SCORM Extract] Failed to update error status:', e);
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

