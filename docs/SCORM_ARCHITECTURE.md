# SCORM Architecture Documentation

## Overview
This document describes the **single, unified SCORM process flow** used across the entire Luna Careers platform for uploading, extracting, serving, and tracking SCORM content.

## Architecture Principles
1. **One Process Only**: There is ONE standardized flow for SCORM handling
2. **Upload Once, Extract Once**: SCORM packages are uploaded and extracted during lesson creation, NOT on page load
3. **Serve from Storage**: All SCORM files are served from Supabase Storage via proxy route
4. **Consistent API**: Same SCORM API initialization across Module/Course/Program learn pages

---

## Phase 1: Upload (Admin Creates Lesson)

### Component
- **File**: `components/luna/learning/modals/create-lesson-modal.tsx`

### Process
1. Admin opens "Create Lesson" modal
2. Selects SCORM version (1.2 or 2004)
3. Uploads ZIP file (max 100MB)
4. File uploaded to Supabase Storage bucket: `scorm-packages/`
5. Temporary lesson record created in database
6. Background extraction triggered

### API Endpoint
- **POST** `/api/learning/lessons` - Creates lesson record

---

## Phase 2: Extraction (Background Processing)

### API Endpoint
- **POST** `/api/learning/scorm/extract-background`
- **File**: `app/api/learning/scorm/extract-background/route.ts`

### Process
1. Download SCORM ZIP from `scorm-packages` bucket
2. Extract ZIP using `adm-zip` library
3. Parse `imsmanifest.xml` to find:
   - Launch URL (entry point HTML file)
   - SCORM version
   - Package metadata
4. Upload ALL extracted files to `scorm-extracted/{lessonId}/` bucket
5. Update lesson record with:
   - `scorm_launch_url` (e.g., "scormdriver/indexAPI.html")
   - Extraction status

### Storage Buckets
- **scorm-packages**: Original ZIP files
- **scorm-extracted**: Extracted SCORM content organized by lesson ID

### Important Notes
- Extraction happens ONCE during upload
- Files are stored with proper content types (HTML, CSS, JS, images, fonts)
- Launch URL is relative path within the extracted package

---

## Phase 3: Serving (User Plays Lesson)

### Server-Side Pages
- `app/u/learning/modules/[moduleId]/learn/page.tsx`
- `app/u/learning/courses/[courseId]/learn/page.tsx`
- `app/u/learning/programs/[programId]/learn/page.tsx`

### Process
1. User navigates to learn page
2. Server fetches lesson data including `scorm_launch_url`
3. Server passes `scormUrl` to client component
4. Client renders iframe: `/api/scorm/{lessonId}/{scorm_launch_url}`

### SCORM Proxy Route
- **GET** `/api/scorm/[lessonId]/[...path]`
- **File**: `app/api/scorm/[lessonId]/[...path]/route.ts`

### Proxy Functionality
1. Receives request for SCORM file
2. Downloads file from `scorm-extracted/{lessonId}/{path}` bucket
3. Determines correct MIME type based on file extension
4. Returns file with proper headers

### Supported MIME Types
- HTML/HTM: `text/html; charset=utf-8`
- CSS: `text/css; charset=utf-8`
- JS: `application/javascript; charset=utf-8`
- JSON: `application/json; charset=utf-8`
- XML/XSD/DTD: `application/xml; charset=utf-8`
- Images: JPEG, PNG, GIF, SVG
- Fonts: WOFF, WOFF2, TTF, EOT

---

## Phase 4: SCORM API Initialization

### Client Components
- `app/u/learning/modules/[moduleId]/learn/module-learn-client.tsx`
- `app/u/learning/courses/[courseId]/learn/course-learn-client.tsx`
- `app/u/learning/programs/[programId]/learn/program-learn-client.tsx`

### Two-Stage Initialization

#### Stage 1: Synchronous Placeholder (BEFORE iframe loads)
```tsx
<Script
  id="scorm-api-init"
  strategy="beforeInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      window.API = { /* SCORM 1.2 placeholder methods */ };
      window.API_1484_11 = { /* SCORM 2004 placeholder methods */ };
    `
  }}
/>
```

**Purpose**: Ensure API exists BEFORE SCORM content searches for it

#### Stage 2: Enhanced API (AFTER component mounts)
```tsx
<ScormApiAdapter
  lessonId={currentLesson.id}
  userId={userId}
  moduleId={module.id}
  onScormComplete={(data) => setScormCompleted(true)}
  onProgressUpdate={handleProgressUpdate}
/>
```

**Component**: `components/luna/learning/scorm-api-adapter.tsx`

**Purpose**: Enhance placeholder APIs with:
- Completion detection logic
- Score tracking
- Progress callbacks
- Data persistence

### Why Two Stages?
- SCORM content searches for API immediately on load
- React `useEffect` runs AFTER component mount (too late)
- Solution: Placeholder API created synchronously, then enhanced

---

## Phase 5: Completion Tracking

### SCORM API Methods Tracked

#### SCORM 1.2
- `LMSSetValue('cmi.core.lesson_status', 'completed')`
- `LMSSetValue('cmi.core.lesson_status', 'passed')`
- `LMSSetValue('cmi.core.score.raw', score)`
- `LMSCommit()` - Checks completion on commit
- `LMSFinish()` - Checks completion on finish

#### SCORM 2004
- `SetValue('cmi.completion_status', 'completed')`
- `SetValue('cmi.success_status', 'passed')`
- `SetValue('cmi.score.scaled', score)`
- `SetValue('cmi.score.raw', score)`
- `Commit()` - Checks completion on commit
- `Terminate()` - Checks completion on terminate

### Completion Flow
1. SCORM content calls `LMSSetValue` or `SetValue`
2. `ScormApiAdapter` detects completion status
3. `onScormComplete` callback fired
4. "Mark Complete" button enabled
5. User clicks button
6. Progress saved to `lesson_progress` table

### Database Schema
```sql
lesson_progress:
  - user_id
  - lesson_id
  - status ('completed', 'passed', 'failed', 'in_progress')
  - score_raw
  - score_min
  - score_max
  - completion_date
  - time_spent_seconds
```

---

## File Structure

### API Routes
```
app/api/
├── learning/
│   ├── lessons/
│   │   ├── route.ts                    # POST - Create lesson
│   │   ├── [id]/route.ts               # PATCH - Update lesson
│   │   └── upload-scorm/route.ts       # (Deprecated - not used)
│   └── scorm/
│       ├── extract/route.ts            # (Deprecated - not used)
│       └── extract-background/route.ts # POST - Background extraction
└── scorm/
    └── [lessonId]/
        └── [...path]/route.ts          # GET - Serve SCORM files
```

### Components
```
components/luna/learning/
├── modals/
│   └── create-lesson-modal.tsx         # Upload & extraction UI
├── scorm-api-adapter.tsx               # SCORM API with completion detection
└── lms-sidebar.tsx                     # Course navigation sidebar
```

### Learn Pages (Server Components)
```
app/u/learning/
├── modules/[moduleId]/learn/
│   ├── page.tsx                        # Server: Fetch data
│   └── module-learn-client.tsx         # Client: Render player
├── courses/[courseId]/learn/
│   ├── page.tsx                        # Server: Fetch data
│   └── course-learn-client.tsx         # Client: Render player
└── programs/[programId]/learn/
    ├── page.tsx                        # Server: Fetch data
    └── program-learn-client.tsx        # Client: Render player
```

---

## Critical Rules

### ❌ DO NOT
1. **Extract SCORM on page load** - Extraction happens ONCE during upload
2. **Create duplicate API initialization** - Use the two-stage pattern only
3. **Serve SCORM from different buckets** - Always use `scorm-extracted`
4. **Initialize API in useEffect only** - Must use `beforeInteractive` script first
5. **Create separate extraction logic per page** - Use `/api/learning/scorm/extract-background` only

### ✅ DO
1. **Extract during upload** - Call `/api/learning/scorm/extract-background` in create modal
2. **Use two-stage API init** - Placeholder script + ScormApiAdapter enhancement
3. **Serve via proxy** - All files through `/api/scorm/[lessonId]/[...path]`
4. **Track completion consistently** - Use ScormApiAdapter across all learn pages
5. **Store launch URL** - Save `scorm_launch_url` in lesson record

---

## Troubleshooting

### Issue: "Unable to acquire LMS API"
**Cause**: SCORM content searches for API before it's initialized
**Solution**: Ensure `<Script strategy="beforeInteractive">` is present BEFORE iframe

### Issue: "Mark Complete button not activating"
**Cause**: ScormApiAdapter not detecting completion
**Solution**: Check console logs for SCORM API calls, verify completion status is being set

### Issue: "SCORM files not loading"
**Cause**: Files not extracted or wrong MIME types
**Solution**: Check `scorm-extracted` bucket, verify extraction completed successfully

### Issue: "Duplicate API initialization"
**Cause**: Multiple places creating window.API
**Solution**: Remove all duplicate initialization, use only the two-stage pattern

---

## Testing Checklist

### Upload & Extraction
- [ ] Upload SCORM 1.2 package
- [ ] Upload SCORM 2004 package
- [ ] Verify extraction completes (15-20 seconds)
- [ ] Check `scorm_launch_url` is set in database
- [ ] Verify all files in `scorm-extracted/{lessonId}/` bucket

### Playback
- [ ] Navigate to module learn page
- [ ] Navigate to course learn page
- [ ] Navigate to program learn page
- [ ] Verify SCORM content loads in iframe
- [ ] Check console for "API initialized synchronously"
- [ ] Verify no "Unable to acquire LMS API" errors

### Completion
- [ ] Complete SCORM lesson
- [ ] Verify "Mark Complete" button enables
- [ ] Click "Mark Complete"
- [ ] Verify progress saved to database
- [ ] Check lesson shows as completed in sidebar

---

## Database Schema

### lessons table
```sql
id                  uuid PRIMARY KEY
title               text NOT NULL
description         text
scorm_package_url   text              -- Path in scorm-packages bucket
scorm_launch_url    text              -- Relative path to launch file
scorm_version       text              -- '1.2' or '2004'
duration_minutes    integer
has_quiz            boolean
passing_score       integer
creator_id          uuid
created_at          timestamp
updated_at          timestamp
```

### lesson_progress table
```sql
id                  uuid PRIMARY KEY
user_id             uuid NOT NULL
lesson_id           uuid NOT NULL
status              text              -- 'completed', 'passed', 'failed', 'in_progress'
score_raw           numeric
score_min           numeric
score_max           numeric
completion_date     timestamp
time_spent_seconds  integer
created_at          timestamp
updated_at          timestamp
```

---

## Version History

### Current Version (2026-02-04)
- ✅ Single unified SCORM process flow
- ✅ Two-stage API initialization (beforeInteractive + ScormApiAdapter)
- ✅ Background extraction during upload
- ✅ Proxy serving from scorm-extracted bucket
- ✅ Consistent completion tracking across all learn pages

### Deprecated Approaches
- ❌ On-demand extraction during page load
- ❌ useEffect-only API initialization
- ❌ Direct storage URL serving
- ❌ Per-page extraction logic

---

## Support

For issues or questions about SCORM implementation:
1. Check this documentation first
2. Review console logs for SCORM API calls
3. Verify extraction completed successfully
4. Check Supabase Storage buckets
5. Review ScormApiAdapter logs for completion detection

**Last Updated**: 2026-02-04
**Maintained By**: Luna Careers Development Team

