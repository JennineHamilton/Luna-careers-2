/**
 * Migration: Update module_quizzes table
 * Adds sort_order and is_required fields to match module_lessons pattern
 */

-- Add sort_order column (rename from order_index if it exists)
DO $$
BEGIN
  -- Check if order_index exists and rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'module_quizzes' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE module_quizzes RENAME COLUMN order_index TO sort_order;
  END IF;
  
  -- Add sort_order if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'module_quizzes' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE module_quizzes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add is_required column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'module_quizzes' AND column_name = 'is_required'
  ) THEN
    ALTER TABLE module_quizzes ADD COLUMN is_required BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

