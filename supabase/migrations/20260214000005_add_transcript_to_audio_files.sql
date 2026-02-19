-- Add transcript column to assessment_audio_files table
-- This stores the expected text that users should type when transcribing the audio

ALTER TABLE assessment_audio_files
ADD COLUMN transcript TEXT;

-- Add comment
COMMENT ON COLUMN assessment_audio_files.transcript IS 'The expected text/transcript of the audio file. Used to calculate accuracy when users transcribe the audio.';

