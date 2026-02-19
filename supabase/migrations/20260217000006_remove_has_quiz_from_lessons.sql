/**
 * Migration: Remove has_quiz and passing_score from lessons table
 * These fields were part of the old SCORM quiz system which has been replaced
 * with the new custom quiz builder system
 */

-- Drop the has_quiz column
ALTER TABLE lessons DROP COLUMN IF EXISTS has_quiz;

-- Drop the passing_score column
ALTER TABLE lessons DROP COLUMN IF EXISTS passing_score;

