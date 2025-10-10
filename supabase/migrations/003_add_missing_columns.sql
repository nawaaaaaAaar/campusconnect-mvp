-- Add missing columns to existing tables
-- This migration adds any columns that might be missing from the initial setup

-- Add missing columns to posts table if they don't exist
DO $$ 
BEGIN
    -- Check and add is_published column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='posts' AND column_name='is_published') THEN
        ALTER TABLE posts ADD COLUMN is_published BOOLEAN DEFAULT true;
    END IF;

    -- Check and add title column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='posts' AND column_name='title') THEN
        ALTER TABLE posts ADD COLUMN title TEXT;
    END IF;

    -- Check and add tags column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='posts' AND column_name='tags') THEN
        ALTER TABLE posts ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;

    -- Check and add is_pinned column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='posts' AND column_name='is_pinned') THEN
        ALTER TABLE posts ADD COLUMN is_pinned BOOLEAN DEFAULT false;
    END IF;

    -- Check and add shares_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='posts' AND column_name='shares_count') THEN
        ALTER TABLE posts ADD COLUMN shares_count INTEGER DEFAULT 0;
    END IF;

    -- Check and add views_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='posts' AND column_name='views_count') THEN
        ALTER TABLE posts ADD COLUMN views_count INTEGER DEFAULT 0;
    END IF;

    -- Check and add published_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='posts' AND column_name='published_at') THEN
        ALTER TABLE posts ADD COLUMN published_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Check and add event_data column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='posts' AND column_name='event_data') THEN
        ALTER TABLE posts ADD COLUMN event_data JSONB;
    END IF;

    RAISE NOTICE 'Posts table columns updated successfully';
END $$;

-- Add missing columns to profiles table if they don't exist
DO $$ 
BEGIN
    -- Check and add bio column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='bio') THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
    END IF;

    -- Check and add phone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='phone') THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
    END IF;

    -- Check and add website column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='website') THEN
        ALTER TABLE profiles ADD COLUMN website TEXT;
    END IF;

    -- Check and add social_links column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='social_links') THEN
        ALTER TABLE profiles ADD COLUMN social_links JSONB DEFAULT '{}';
    END IF;

    -- Check and add preferences column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='preferences') THEN
        ALTER TABLE profiles ADD COLUMN preferences JSONB DEFAULT '{}';
    END IF;

    -- Check and add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='is_active') THEN
        ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Check and add is_verified column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='is_verified') THEN
        ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;

    RAISE NOTICE 'Profiles table columns updated successfully';
END $$;

-- Add missing columns to societies table if they don't exist
DO $$ 
BEGIN
    -- Check and add cover_image_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='societies' AND column_name='cover_image_url') THEN
        ALTER TABLE societies ADD COLUMN cover_image_url TEXT;
    END IF;

    -- Check and add social_links column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='societies' AND column_name='social_links') THEN
        ALTER TABLE societies ADD COLUMN social_links JSONB DEFAULT '{}';
    END IF;

    -- Check and add verification_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='societies' AND column_name='verification_date') THEN
        ALTER TABLE societies ADD COLUMN verification_date TIMESTAMPTZ;
    END IF;

    -- Check and add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='societies' AND column_name='is_active') THEN
        ALTER TABLE societies ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Check and add follower_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='societies' AND column_name='follower_count') THEN
        ALTER TABLE societies ADD COLUMN follower_count INTEGER DEFAULT 0;
    END IF;

    -- Check and add member_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='societies' AND column_name='member_count') THEN
        ALTER TABLE societies ADD COLUMN member_count INTEGER DEFAULT 0;
    END IF;

    -- Check and add post_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='societies' AND column_name='post_count') THEN
        ALTER TABLE societies ADD COLUMN post_count INTEGER DEFAULT 0;
    END IF;

    RAISE NOTICE 'Societies table columns updated successfully';
END $$;

-- Add missing columns to post_comments table if they don't exist
DO $$ 
BEGIN
    -- Check and add is_edited column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='post_comments' AND column_name='is_edited') THEN
        ALTER TABLE post_comments ADD COLUMN is_edited BOOLEAN DEFAULT false;
    END IF;

    -- Check and add likes_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='post_comments' AND column_name='likes_count') THEN
        ALTER TABLE post_comments ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;

    RAISE NOTICE 'Post comments table columns updated successfully';
END $$;

-- Add missing columns to notifications table if they don't exist
DO $$ 
BEGIN
    -- Check and add is_sent column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='notifications' AND column_name='is_sent') THEN
        ALTER TABLE notifications ADD COLUMN is_sent BOOLEAN DEFAULT false;
    END IF;

    -- Check and add read_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='notifications' AND column_name='read_at') THEN
        ALTER TABLE notifications ADD COLUMN read_at TIMESTAMPTZ;
    END IF;

    RAISE NOTICE 'Notifications table columns updated successfully';
END $$;

-- Now create indexes safely
DO $$ 
BEGIN
    -- Posts indexes
    DROP INDEX IF EXISTS idx_posts_published;
    CREATE INDEX idx_posts_published ON posts(published_at DESC) WHERE is_published = true;
    
    DROP INDEX IF EXISTS idx_posts_text_search;
    CREATE INDEX idx_posts_text_search ON posts USING GIN(to_tsvector('english', COALESCE(text, '')));

    RAISE NOTICE 'Indexes created successfully';
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully! All missing columns have been added.';
END $$;

