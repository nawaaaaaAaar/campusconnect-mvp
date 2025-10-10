-- Add missing parent_comment_id column to post_comments table
-- This enables nested/threaded comments

DO $$ 
BEGIN
    -- Add parent_comment_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='post_comments' AND column_name='parent_comment_id') THEN
        ALTER TABLE post_comments 
        ADD COLUMN parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added parent_comment_id column to post_comments';
    ELSE
        RAISE NOTICE 'parent_comment_id column already exists';
    END IF;
END $$;

-- Create the index for parent comments
DO $$
BEGIN
    DROP INDEX IF EXISTS idx_post_comments_parent;
    CREATE INDEX idx_post_comments_parent ON post_comments(parent_comment_id);
    RAISE NOTICE 'Created index on parent_comment_id';
END $$;

-- Success
DO $$
BEGIN
    RAISE NOTICE '✅ Post comments table updated successfully!';
END $$;

