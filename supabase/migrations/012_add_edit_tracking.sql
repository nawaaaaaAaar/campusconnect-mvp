-- Migration: Add edit tracking and timezone support
-- Version: 1.0.0
-- Purpose: Support 15-minute edit window and quiet hours timezone

-- Add edit tracking to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;

-- Add timezone to profiles for quiet hours calculation
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Create index for edit tracking
CREATE INDEX IF NOT EXISTS idx_posts_edited ON posts(is_edited) WHERE is_edited = true;

-- Comment for documentation
COMMENT ON COLUMN posts.is_edited IS 'Indicates if post has been edited after creation';
COMMENT ON COLUMN posts.edit_count IS 'Number of times post has been edited';
COMMENT ON COLUMN profiles.timezone IS 'User timezone for quiet hours enforcement (IANA format)';





