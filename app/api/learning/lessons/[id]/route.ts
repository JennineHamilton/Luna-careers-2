/**
 * API Route: Individual Lesson Operations
 * GET /api/learning/lessons/[id] - Get single lesson
 * PATCH /api/learning/lessons/[id] - Update lesson (admin only)
 * DELETE /api/learning/lessons/[id] - Delete lesson (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyPlatformAdmin } from '../../_helpers/auth';
import type { Database } from '@/types/database.types';

type LessonUpdate = Database['public']['Tables']['lessons']['Update'];

/**
 * GET /api/learning/lessons/[id]
 * Get single lesson by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*, creators(id, name, logo_url)')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Lesson not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch lesson', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ lesson }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/lessons/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/learning/lessons/[id]
 * Update lesson (platform admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify platform admin
    const authResult = await verifyPlatformAdmin(request);
    if (!authResult.authorized) {
      return authResult.error!;
    }

    const supabase = createAdminClient();
    const { id } = await params;
    
    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      scorm_package_url,
      scorm_version,
      duration_minutes,
      creator_id,
    } = body;

    const updateData: LessonUpdate = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (scorm_package_url !== undefined) updateData.scorm_package_url = scorm_package_url;
    if (scorm_version !== undefined) updateData.scorm_version = scorm_version;
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
    if (creator_id !== undefined) updateData.creator_id = creator_id;
    
    const { data: lesson, error: updateError } = await supabase
      .from('lessons')
      .update(updateData)
      .eq('id', id)
      .select('*, creators(id, name, logo_url)')
      .single();
    
    if (updateError) {
      console.error('Error updating lesson:', updateError);
      return NextResponse.json(
        { error: 'Failed to update lesson', details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ lesson }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in PATCH /api/learning/lessons/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/learning/lessons/[id]
 * Delete lesson (platform admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify platform admin
    const authResult = await verifyPlatformAdmin(request);
    if (!authResult.authorized) {
      return authResult.error!;
    }

    const supabase = createAdminClient();
    const { id } = await params;

    // First, get the lesson to find the SCORM package URL
    const { data: lesson, error: fetchError } = await supabase
      .from('lessons')
      .select('scorm_package_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching lesson:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch lesson', details: fetchError.message },
        { status: 500 }
      );
    }

    // Delete the lesson from database
    const { error: deleteError } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting lesson:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete lesson', details: deleteError.message },
        { status: 500 }
      );
    }

    // Delete SCORM files from storage (do this after DB delete to avoid orphaned records)
    const storageErrors: string[] = [];

    // 1. Delete original SCORM package from scorm-packages bucket
    if (lesson?.scorm_package_url) {
      let scormPath = lesson.scorm_package_url;

      // Extract just the filename if it's a full URL
      if (scormPath.includes('scorm-packages')) {
        const match = scormPath.match(/\/scorm-packages\/(.+?)(?:\?|$)/);
        if (match && match[1]) {
          scormPath = match[1];
        }
      }

      const { error: packageDeleteError } = await supabase.storage
        .from('scorm-packages')
        .remove([scormPath]);

      if (packageDeleteError) {
        console.error('Error deleting SCORM package:', packageDeleteError);
        storageErrors.push(`SCORM package: ${packageDeleteError.message}`);
      }
    }

    // 2. Delete all extracted files from scorm-extracted bucket
    // Recursively collect all file paths in the lesson folder
    const collectAllFiles = async (path: string = ''): Promise<string[]> => {
      const searchPath = path ? `${id}/${path}` : id;
      const { data: items, error: listError } = await supabase.storage
        .from('scorm-extracted')
        .list(searchPath);

      if (listError) {
        console.error(`Error listing files at ${searchPath}:`, listError);
        return [];
      }

      if (!items || items.length === 0) {
        return [];
      }

      const allFiles: string[] = [];

      for (const item of items) {
        const itemPath = path ? `${path}/${item.name}` : item.name;
        const fullPath = `${id}/${itemPath}`;

        // Check if it's a folder by trying to list its contents
        // In Supabase, folders don't have a metadata field, so we check if we can list inside
        const { data: subItems } = await supabase.storage
          .from('scorm-extracted')
          .list(fullPath);

        if (subItems && subItems.length > 0) {
          // It's a folder, recurse into it
          const subFiles = await collectAllFiles(itemPath);
          allFiles.push(...subFiles);
        } else {
          // It's a file
          allFiles.push(fullPath);
        }
      }

      return allFiles;
    };

    const filesToDelete = await collectAllFiles();

    if (filesToDelete.length > 0) {
      // Supabase has a limit on batch delete, so delete in chunks of 100
      const chunkSize = 100;
      for (let i = 0; i < filesToDelete.length; i += chunkSize) {
        const chunk = filesToDelete.slice(i, i + chunkSize);

        const { error: deleteError } = await supabase.storage
          .from('scorm-extracted')
          .remove(chunk);

        if (deleteError) {
          console.error('Error deleting extracted files chunk:', deleteError);
          storageErrors.push(`Extracted files chunk ${i / chunkSize + 1}: ${deleteError.message}`);
        }
      }
    }

    // Return success even if storage deletion had issues (lesson is already deleted from DB)
    if (storageErrors.length > 0) {
      console.warn('Lesson deleted but some storage files could not be removed:', storageErrors);
      return NextResponse.json({
        success: true,
        warning: 'Lesson deleted but some storage files could not be removed',
        storageErrors
      }, { status: 200 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/learning/lessons/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

