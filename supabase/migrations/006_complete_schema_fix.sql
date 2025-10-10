-- COMPREHENSIVE SCHEMA FIX
-- Adds ALL missing columns to ALL tables in one go
-- Run this BEFORE migration 002

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
DO $$ 
BEGIN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Profiles table updated';
END $$;

-- ============================================================================
-- SOCIETIES TABLE
-- ============================================================================
DO $$ 
BEGIN
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS verification_date TIMESTAMPTZ;
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Societies table updated';
END $$;

-- ============================================================================
-- POSTS TABLE
-- ============================================================================
DO $$ 
BEGIN
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_data JSONB;
    RAISE NOTICE '✅ Posts table updated';
END $$;

-- ============================================================================
-- POST_COMMENTS TABLE
-- ============================================================================
DO $$ 
BEGIN
    ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE;
    ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
    ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Post comments table updated';
END $$;

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
DO $$ 
BEGIN
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_sent BOOLEAN DEFAULT false;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Notifications table updated';
END $$;

-- ============================================================================
-- SOCIETY_INVITATIONS TABLE
-- ============================================================================
DO $$ 
BEGIN
    -- Add token column with default
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='society_invitations' AND column_name='token') THEN
        ALTER TABLE society_invitations 
        ADD COLUMN token TEXT DEFAULT gen_random_uuid()::text;
        
        -- Make it unique after adding
        UPDATE society_invitations SET token = gen_random_uuid()::text WHERE token IS NULL;
        ALTER TABLE society_invitations ALTER COLUMN token SET NOT NULL;
        ALTER TABLE society_invitations ADD CONSTRAINT society_invitations_token_key UNIQUE (token);
    END IF;
    
    ALTER TABLE society_invitations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
    ALTER TABLE society_invitations ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
    ALTER TABLE society_invitations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days');
    
    -- Add constraint if it doesn't exist
    DO $inner$
    BEGIN
        ALTER TABLE society_invitations 
        ADD CONSTRAINT society_invitations_status_check 
        CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'));
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Constraint already exists
    END $inner$;
    
    RAISE NOTICE '✅ Society invitations table updated';
END $$;

-- ============================================================================
-- CREATE ALL MISSING TABLES
-- ============================================================================

-- Institutes table
CREATE TABLE IF NOT EXISTS institutes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    short_name TEXT,
    location TEXT,
    website TEXT,
    logo_url TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push devices table  
CREATE TABLE IF NOT EXISTS push_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    device_info JSONB DEFAULT '{}',
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, fcm_token)
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'moderator' CHECK (role IN ('super_admin', 'admin', 'moderator')),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'society', 'user')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    resolution_action TEXT,
    resolution_reason TEXT,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    post_push_enabled BOOLEAN DEFAULT true,
    invite_push_enabled BOOLEAN DEFAULT true,
    comment_push_enabled BOOLEAN DEFAULT true,
    like_push_enabled BOOLEAN DEFAULT false,
    quiet_start TIME DEFAULT '22:00',
    quiet_end TIME DEFAULT '07:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '🎉 COMPLETE! All tables and columns are now ready for migration 002';
    RAISE NOTICE 'Next step: Run migration 002_safe_migration.sql';
END $$;

