import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// This route serves SCORM files from Supabase Storage with proper MIME types
// It acts as a proxy to handle relative file paths within SCORM packages

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string; path: string[] }> }
) {
  try {
    const { lessonId, path: pathSegments } = await params;
    const filePath = pathSegments.join('/');
    


    // Create service role client to access storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Download file from scorm-extracted bucket
    const { data, error } = await supabase.storage
      .from('scorm-extracted')
      .download(`${lessonId}/${filePath}`);

    if (error || !data) {
      console.error(`[SCORM Proxy] Error downloading file: ${lessonId}/${filePath}`, {
        error,
        message: error?.message,
      });
      return new NextResponse(`File not found: ${filePath}`, { status: 404 });
    }



    // Determine content type based on file extension
    const getContentType = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase();
      const types: Record<string, string> = {
        // HTML/CSS/JS
        'html': 'text/html; charset=utf-8',
        'htm': 'text/html; charset=utf-8',
        'css': 'text/css; charset=utf-8',
        'js': 'application/javascript; charset=utf-8',
        'mjs': 'application/javascript; charset=utf-8',
        'json': 'application/json; charset=utf-8',

        // XML and related
        'xml': 'application/xml; charset=utf-8',
        'xsd': 'application/xml; charset=utf-8',
        'dtd': 'application/xml-dtd; charset=utf-8',

        // Images
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'ico': 'image/x-icon',

        // Fonts
        'woff': 'font/woff',
        'woff2': 'font/woff2',
        'ttf': 'font/ttf',
        'otf': 'font/otf',
        'eot': 'application/vnd.ms-fontobject',

        // Audio/Video (some SCORM packages include media)
        'mp3': 'audio/mpeg',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'audio/ogg',
        'wav': 'audio/wav',

        // Flash (legacy SCORM)
        'swf': 'application/x-shockwave-flash',

        // Text files
        'txt': 'text/plain; charset=utf-8',
        'csv': 'text/csv; charset=utf-8',
      };
      return types[ext || ''] || 'application/octet-stream';
    };

    const contentType = getContentType(filePath);

    // Convert blob to array buffer
    const arrayBuffer = await data.arrayBuffer();

    // Get allowed origin from environment or default to app URL
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Return file with proper headers and aggressive caching
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true',
        // Add compression hint
        'Vary': 'Accept-Encoding',
        // Add ETag for better caching
        'ETag': `"${lessonId}-${filePath}"`,
      },
    });
  } catch (error) {
    console.error('[SCORM Proxy] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

