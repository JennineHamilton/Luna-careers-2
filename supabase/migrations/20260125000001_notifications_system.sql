-- ============================================================
-- Luna Careers - Notifications System
-- Migration: 20260125000001
-- Description: Creates notifications table for in-app notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification content
  type VARCHAR(50) NOT NULL, -- 'scholarship_approved', 'scholarship_rejected', 'enrollment_confirmed', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Optional action link
  action_url TEXT,
  action_label VARCHAR(100),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional data (scholarship_id, content_id, etc.)
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT notifications_type_check CHECK (type IN (
    'scholarship_approved',
    'scholarship_rejected',
    'scholarship_expired',
    'enrollment_confirmed',
    'course_completed',
    'certificate_issued',
    'credits_earned',
    'payment_received',
    'general'
  ))
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Only system/admin can create notifications
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.notifications IS 'In-app notifications for users';
COMMENT ON COLUMN public.notifications.type IS 'Type of notification for categorization and filtering';
COMMENT ON COLUMN public.notifications.metadata IS 'Additional data specific to notification type (JSON)';
COMMENT ON COLUMN public.notifications.action_url IS 'Optional URL for notification action button';

