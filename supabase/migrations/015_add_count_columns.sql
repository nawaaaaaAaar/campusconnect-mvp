-- Migration: Add likes_count and comments_count columns to posts table
-- Version: 1.0.0  
-- Purpose: Fix 500 error - triggers expect these columns to exist

-- Add count columns (these should have been in the initial schema)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0;

-- Backfill counts for existing posts
UPDATE posts SET likes_count = COALESCE((
  SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id
), 0);

UPDATE posts SET comments_count = COALESCE((
  SELECT COUNT(*) FROM post_comments WHERE post_comments.post_id = posts.id
), 0);

-- Create indexes for better performance on count queries
CREATE INDEX IF NOT EXISTS idx_posts_likes_count ON posts(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_comments_count ON posts(comments_count DESC);

-- Comments to explain the fix
COMMENT ON COLUMN posts.likes_count IS 'Denormalized count of likes, updated by trigger';
COMMENT ON COLUMN posts.comments_count IS 'Denormalized count of comments, updated by trigger';

