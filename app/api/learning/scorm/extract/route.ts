/**
 * API Route: SCORM Package Extraction
 * POST /api/learning/scorm/extract - Extract SCORM ZIP and parse manifest
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import path from 'path';
import fs from 'fs/promises';

/**
 * POST /api/learning/scorm/extract
 * Extract SCORM package and return launch URL
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { scormPath, lessonId } = body;

    if (!scormPath || !lessonId) {
      return NextResponse.json(
        { error: 'Missing scormPath or lessonId' },
        { status: 400 }
      );
    }

    // Download SCORM package from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('scorm-packages')
      .download(scormPath);

    if (downloadError || !fileData) {
      console.error('Error downloading SCORM package:', downloadError);
      return NextResponse.json(
        { error: 'Failed to download SCORM package', details: downloadError?.message },
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
      console.error('imsmanifest.xml not found. Available files:', zipEntries.map(e => e.entryName));
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
      console.warn('Could not parse launch file from manifest, using default');
    }

    // Extract to public folder
    const extractPath = path.join(process.cwd(), 'public', 'scorm', lessonId);

    // Create directory if it doesn't exist
    await fs.mkdir(extractPath, { recursive: true });

    // Extract all files
    let filesExtracted = 0;
    for (const entry of zipEntries) {
      if (!entry.isDirectory) {
        const filePath = path.join(extractPath, entry.entryName);
        const fileDir = path.dirname(filePath);

        // Create subdirectories
        await fs.mkdir(fileDir, { recursive: true });

        // Write file
        await fs.writeFile(filePath, entry.getData());
        filesExtracted++;
      }
    }
    // Return the launch URL
    const launchUrl = `/scorm/${lessonId}/${launchFile}`;

    // Update lesson with launch URL
    const { error: updateError } = await supabase
      .from('lessons')
      .update({ scorm_launch_url: launchUrl })
      .eq('id', lessonId);

    if (updateError) {
      console.error('Error updating lesson:', updateError);
    }

    return NextResponse.json({
      success: true,
      launchUrl,
      extractPath: `/scorm/${lessonId}`,
    });

  } catch (error) {
    console.error('Error extracting SCORM package:', error);
    return NextResponse.json(
      { error: 'Failed to extract SCORM package', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

