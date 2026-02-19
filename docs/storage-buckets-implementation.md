# Storage Buckets & File Upload Implementation

## Overview
This document outlines all Supabase storage buckets needed for the LMS and how to implement file uploads using existing Luna components.

---

## 📦 Required Storage Buckets

### 1. **creator-logos** (Public, 2MB)
- **Purpose**: Store logos for content creators
- **Formats**: PNG, JPG, JPEG, SVG, WEBP
- **Max Size**: 2MB
- **Path Structure**: `/creator-logos/{creator-id}/{filename}`
- **Upload Access**: Platform admins only
- **View Access**: Public
- **Component**: `LunaAvatarUpload` (circular logo upload)

### 2. **scorm-packages** (Private, 10MB)
- **Purpose**: Store SCORM lesson packages
- **Formats**: ZIP
- **Max Size**: 10MB
- **Path Structure**: `/scorm-packages/{lesson-id}/{filename}`
- **Upload Access**: Platform admins only
- **View Access**: Authenticated users
- **Component**: `LunaFileUpload` (drag-drop ZIP upload)

### 3. **course-covers** (Public, 5MB)
- **Purpose**: Cover images for modules, courses, programs
- **Formats**: PNG, JPG, JPEG, WEBP
- **Max Size**: 5MB
- **Path Structure**: `/course-covers/{type}/{id}/{filename}`
  - `type` = 'modules' | 'courses' | 'programs'
- **Upload Access**: Platform admins only
- **View Access**: Public
- **Component**: `LunaFileUpload` (image upload with preview)

### 4. **intro-videos** (Public, 50MB)
- **Purpose**: Intro/preview videos for modules, courses, programs
- **Formats**: MP4, WEBM, MOV
- **Max Size**: 50MB
- **Path Structure**: `/intro-videos/{type}/{id}/{filename}`
  - `type` = 'modules' | 'courses' | 'programs'
- **Upload Access**: Platform admins only
- **View Access**: Public
- **Component**: `LunaFileUpload` (video upload)

### 5. **scholarship-documents** (Private, 10MB)
- **Purpose**: User-uploaded scholarship application documents
- **Formats**: PDF, DOC, DOCX, PNG, JPG, JPEG
- **Max Size**: 10MB
- **Path Structure**: `/scholarship-docs/{application-id}/{filename}`
- **Upload Access**: Application owner only
- **View Access**: Application owner + Platform admins
- **Delete Access**: Platform admins only
- **Component**: `LunaFileUpload` (multi-file document upload)

---

## 🎨 Using Existing Luna Components

### LunaAvatarUpload
**Best for**: Creator logos, profile pictures, circular images

```tsx
import { LunaAvatarUpload } from '@/components/luna';

<LunaAvatarUpload
  label="Creator Logo"
  size="lg"
  value={logoUrl} // Current logo URL
  helperText="PNG, JPG, SVG or WEBP (max. 2MB)"
  onChange={(file) => handleLogoUpload(file)}
/>
```

**Features**:
- Circular preview
- Drag & drop support
- Change/Remove buttons
- Image preview
- File validation

### LunaFileUpload
**Best for**: SCORM packages, cover images, videos, documents

```tsx
import { LunaFileUpload } from '@/components/luna';

// Example 1: SCORM Package Upload
<LunaFileUpload
  label="SCORM Package"
  helperText="ZIP file up to 10MB"
  accept=".zip"
  maxSize={10 * 1024 * 1024} // 10MB
  onFilesChange={(files) => handleScormUpload(files)}
/>

// Example 2: Cover Image Upload
<LunaFileUpload
  label="Cover Image"
  helperText="PNG, JPG or WEBP (max. 5MB)"
  accept="image/png,image/jpeg,image/webp"
  maxSize={5 * 1024 * 1024} // 5MB
  onFilesChange={(files) => handleCoverUpload(files)}
/>

// Example 3: Multiple Documents
<LunaFileUpload
  label="Supporting Documents"
  helperText="PDF, DOC, DOCX up to 10MB each"
  accept=".pdf,.doc,.docx"
  maxSize={10 * 1024 * 1024} // 10MB
  multiple
  onFilesChange={(files) => handleDocumentsUpload(files)}
/>
```

**Features**:
- Drag & drop zone
- Multiple file support
- File size validation
- File type validation
- File list with remove buttons
- Progress indicators
- Error handling

---

## 🔧 Implementation Steps

### Step 1: Run Storage Buckets Migration
```bash
# The migration file has been created at:
# supabase/migrations/20260122000001_create_storage_buckets.sql

# Apply the migration (when ready)
supabase db push
```

### Step 2: Update Creator Modal to Use LunaAvatarUpload
Replace the `logo_url` text input with `LunaAvatarUpload`:

```tsx
// Before (in create-creator-modal.tsx and edit-creator-modal.tsx):
<LunaInput
  label="Logo URL"
  type="url"
  value={creatorData.logo_url || ''}
  onChange={(e) => setCreatorData({ ...creatorData, logo_url: e.target.value || null })}
  placeholder="https://example.com/logo.png"
  helperText="URL to the creator's logo image"
/>

// After:
const [logoFile, setLogoFile] = useState<File | null>(null);

<LunaAvatarUpload
  label="Creator Logo"
  size="lg"
  value={creatorData.logo_url || undefined}
  helperText="PNG, JPG, SVG or WEBP (max. 2MB)"
  onChange={setLogoFile}
/>
```

### Step 3: Implement Upload Handler
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    // 1. Upload logo if file selected
    let logoUrl = creatorData.logo_url;
    if (logoFile) {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `creator-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('creator-logos')
        .upload(filePath, logoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('creator-logos')
        .getPublicUrl(filePath);

      logoUrl = publicUrl;
    }

    // 2. Create/update creator with logo URL
    const response = await fetch('/api/learning/creators', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        ...creatorData,
        logo_url: logoUrl,
      }),
    });

    // ... rest of the logic
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 📋 Next Steps

1. ✅ Storage buckets migration created
2. ⏳ Apply migration to Supabase
3. ⏳ Update creator modals to use `LunaAvatarUpload`
4. ⏳ Implement upload handlers
5. ⏳ Test file uploads
6. ⏳ Apply same pattern to lessons, modules, courses, programs

---

## 🔒 Security Notes

- All buckets have RLS policies enforcing access control
- File size limits prevent abuse
- MIME type restrictions prevent malicious uploads
- Private buckets require authentication
- Scholarship documents only accessible by owner + admins

