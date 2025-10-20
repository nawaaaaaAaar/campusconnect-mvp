-- Migration: Add notification rate limiting support
-- Version: 1.0.0
-- Purpose: Track notification rate limits per user per society (PRD 5.6)

-- Add is_sent column to notifications table for quiet hours queueing
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_sent BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_notifications_is_sent ON notifications(is_sent, created_at) WHERE is_sent = false;

-- Create table to track when last notification was sent
CREATE TABLE IF NOT EXISTS notification_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    last_notification_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notification_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, society_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_rate_limits_user_society 
ON notification_rate_limits(user_id, society_id);

CREATE INDEX IF NOT EXISTS idx_notification_rate_limits_timestamp 
ON notification_rate_limits(last_notification_at);

-- Function to check if notification can be sent (≤1 per hour per society)
CREATE OR REPLACE FUNCTION can_send_notification(
    p_user_id UUID,
    p_society_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_last_sent TIMESTAMPTZ;
BEGIN
    SELECT last_notification_at INTO v_last_sent
    FROM notification_rate_limits
    WHERE user_id = p_user_id AND society_id = p_society_id;
    
    -- If no record found, can send
    IF v_last_sent IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- PRD 5.6: Check if more than 1 hour has passed
    IF NOW() - v_last_sent > INTERVAL '1 hour' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to record notification sent
CREATE OR REPLACE FUNCTION record_notification_sent(
    p_user_id UUID,
    p_society_id UUID
) RETURNS VOID AS $$
BEGIN
    INSERT INTO notification_rate_limits (user_id, society_id, last_notification_at, notification_count)
    VALUES (p_user_id, p_society_id, NOW(), 1)
    ON CONFLICT (user_id, society_id)
    DO UPDATE SET 
        last_notification_at = NOW(),
        notification_count = notification_rate_limits.notification_count + 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE notification_rate_limits IS 'PRD 5.6: Tracks notification rate limits (≤1 per society per hour per user)';
COMMENT ON FUNCTION can_send_notification IS 'PRD 5.6: Checks if notification can be sent based on rate limit';
COMMENT ON FUNCTION record_notification_sent IS 'PRD 5.6: Records that a notification was sent';

