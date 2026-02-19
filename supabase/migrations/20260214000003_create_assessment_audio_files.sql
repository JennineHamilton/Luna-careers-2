-- Create assessment_audio_files table for transcription assessments
-- Allows multiple audio files per assessment with random selection

CREATE TABLE IF NOT EXISTS assessment_audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_template_id UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  
  -- File Info
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,  -- bytes
  duration_seconds INTEGER,  -- audio duration
  mime_type TEXT DEFAULT 'audio/mpeg',
  
  -- Metadata
  uploaded_by UUID REFERENCES users(id),
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Analytics (optional, for future)
  times_served INTEGER DEFAULT 0,
  average_accuracy NUMERIC(5,2),
  
  -- Soft delete
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast random selection
CREATE INDEX idx_audio_files_assessment ON assessment_audio_files(assessment_template_id, is_active);
CREATE INDEX idx_audio_files_active ON assessment_audio_files(is_active);

-- Enable RLS
ALTER TABLE assessment_audio_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view active audio files for active assessments
CREATE POLICY "Users can view active audio files"
  ON assessment_audio_files
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Platform admins can manage all audio files
CREATE POLICY "Platform admins can manage audio files"
  ON assessment_audio_files
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'account_type') = 'platformAdmin'
  );

-- Updated_at trigger
CREATE TRIGGER update_assessment_audio_files_updated_at
  BEFORE UPDATE ON assessment_audio_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE assessment_audio_files IS 'Audio files for transcription typing assessments. System randomly selects one file per attempt.';

-- ============================================================================
-- STORAGE BUCKET FOR AUDIO FILES
-- ============================================================================

-- Create storage bucket for assessment audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assessment-audio',
  'assessment-audio',
  true,  -- Public bucket so users can access audio during tests
  10485760,  -- 10MB max file size
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies

-- Anyone authenticated can view audio files
CREATE POLICY "Authenticated users can view audio files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'assessment-audio');

-- Platform admins can upload audio files
CREATE POLICY "Platform admins can upload audio files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'assessment-audio'
    AND (auth.jwt() -> 'user_metadata' ->> 'account_type') = 'platformAdmin'
  );

-- Platform admins can update audio files
CREATE POLICY "Platform admins can update audio files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'assessment-audio'
    AND (auth.jwt() -> 'user_metadata' ->> 'account_type') = 'platformAdmin'
  );

-- Platform admins can delete audio files
CREATE POLICY "Platform admins can delete audio files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'assessment-audio'
    AND (auth.jwt() -> 'user_metadata' ->> 'account_type') = 'platformAdmin'
  );

