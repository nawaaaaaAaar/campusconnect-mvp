-- CampusConnect Database Schema - Safe Migration
-- Version: 1.0.1
-- This version checks for existing objects before creating them

-- Enable UUID extension (safe - won't fail if exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES (IF NOT EXISTS)
-- =============================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    avatar_url TEXT,
    institute TEXT,
    course TEXT,
    account_type TEXT NOT NULL CHECK (account_type IN ('student', 'society')),
    bio TEXT,
    phone TEXT,
    website TEXT,
    social_links JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Societies table
CREATE TABLE IF NOT EXISTS societies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT,
    contact_email TEXT,
    website TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    social_links JSONB DEFAULT '{}',
    verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    follower_count INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, institute_id)
);

-- Society members table
CREATE TABLE IF NOT EXISTS society_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    UNIQUE(society_id, user_id)
);

-- Society followers table
CREATE TABLE IF NOT EXISTS society_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(society_id, user_id)
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('text', 'image', 'link', 'event')),
    title TEXT,
    text TEXT,
    media_url TEXT,
    link_url TEXT,
    event_data JSONB,
    tags TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Post comments table
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    target_type TEXT,
    target_id UUID,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
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

-- Society invitations table
CREATE TABLE IF NOT EXISTS society_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
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

-- =============================================================================
-- INDEXES (Safe creation)
-- =============================================================================

-- Drop and recreate indexes to avoid "already exists" errors
DO $$ 
BEGIN
    -- Profiles indexes
    DROP INDEX IF EXISTS idx_profiles_email;
    CREATE INDEX idx_profiles_email ON profiles(email);
    
    DROP INDEX IF EXISTS idx_profiles_account_type;
    CREATE INDEX idx_profiles_account_type ON profiles(account_type);
    
    DROP INDEX IF EXISTS idx_profiles_institute;
    CREATE INDEX idx_profiles_institute ON profiles(institute);

    -- Institutes indexes
    DROP INDEX IF EXISTS idx_institutes_name;
    CREATE INDEX idx_institutes_name ON institutes(name);

    -- Societies indexes
    DROP INDEX IF EXISTS idx_societies_institute;
    CREATE INDEX idx_societies_institute ON societies(institute_id);
    
    DROP INDEX IF EXISTS idx_societies_category;
    CREATE INDEX idx_societies_category ON societies(category);
    
    DROP INDEX IF EXISTS idx_societies_verified;
    CREATE INDEX idx_societies_verified ON societies(verified);
    
    DROP INDEX IF EXISTS idx_societies_owner;
    CREATE INDEX idx_societies_owner ON societies(owner_user_id);
    
    DROP INDEX IF EXISTS idx_societies_name_search;
    CREATE INDEX idx_societies_name_search ON societies USING GIN(to_tsvector('english', name));

    -- Society members indexes
    DROP INDEX IF EXISTS idx_society_members_society;
    CREATE INDEX idx_society_members_society ON society_members(society_id);
    
    DROP INDEX IF EXISTS idx_society_members_user;
    CREATE INDEX idx_society_members_user ON society_members(user_id);
    
    DROP INDEX IF EXISTS idx_society_members_role;
    CREATE INDEX idx_society_members_role ON society_members(role);

    -- Society followers indexes
    DROP INDEX IF EXISTS idx_society_followers_society;
    CREATE INDEX idx_society_followers_society ON society_followers(society_id);
    
    DROP INDEX IF EXISTS idx_society_followers_user;
    CREATE INDEX idx_society_followers_user ON society_followers(user_id);
    
    DROP INDEX IF EXISTS idx_society_followers_created;
    CREATE INDEX idx_society_followers_created ON society_followers(created_at DESC);

    -- Posts indexes
    DROP INDEX IF EXISTS idx_posts_society;
    CREATE INDEX idx_posts_society ON posts(society_id);
    
    DROP INDEX IF EXISTS idx_posts_author;
    CREATE INDEX idx_posts_author ON posts(author_id);
    
    DROP INDEX IF EXISTS idx_posts_type;
    CREATE INDEX idx_posts_type ON posts(type);
    
    DROP INDEX IF EXISTS idx_posts_published;
    CREATE INDEX idx_posts_published ON posts(published_at DESC) WHERE is_published = true;
    
    DROP INDEX IF EXISTS idx_posts_created;
    CREATE INDEX idx_posts_created ON posts(created_at DESC);
    
    DROP INDEX IF EXISTS idx_posts_text_search;
    CREATE INDEX idx_posts_text_search ON posts USING GIN(to_tsvector('english', COALESCE(text, '')));

    -- Post likes indexes
    DROP INDEX IF EXISTS idx_post_likes_post;
    CREATE INDEX idx_post_likes_post ON post_likes(post_id);
    
    DROP INDEX IF EXISTS idx_post_likes_user;
    CREATE INDEX idx_post_likes_user ON post_likes(user_id);
    
    DROP INDEX IF EXISTS idx_post_likes_created;
    CREATE INDEX idx_post_likes_created ON post_likes(created_at DESC);

    -- Post comments indexes
    DROP INDEX IF EXISTS idx_post_comments_post;
    CREATE INDEX idx_post_comments_post ON post_comments(post_id);
    
    DROP INDEX IF EXISTS idx_post_comments_author;
    CREATE INDEX idx_post_comments_author ON post_comments(author_id);
    
    DROP INDEX IF EXISTS idx_post_comments_parent;
    CREATE INDEX idx_post_comments_parent ON post_comments(parent_comment_id);
    
    DROP INDEX IF EXISTS idx_post_comments_created;
    CREATE INDEX idx_post_comments_created ON post_comments(created_at DESC);

    -- Notifications indexes
    DROP INDEX IF EXISTS idx_notifications_user;
    CREATE INDEX idx_notifications_user ON notifications(user_id);
    
    DROP INDEX IF EXISTS idx_notifications_created;
    CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
    
    DROP INDEX IF EXISTS idx_notifications_read;
    CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

    -- Push devices indexes
    DROP INDEX IF EXISTS idx_push_devices_user;
    CREATE INDEX idx_push_devices_user ON push_devices(user_id);
    
    DROP INDEX IF EXISTS idx_push_devices_token;
    CREATE INDEX idx_push_devices_token ON push_devices(fcm_token);

    -- Invitations indexes
    DROP INDEX IF EXISTS idx_invitations_society;
    CREATE INDEX idx_invitations_society ON society_invitations(society_id);
    
    DROP INDEX IF EXISTS idx_invitations_email;
    CREATE INDEX idx_invitations_email ON society_invitations(email);
    
    DROP INDEX IF EXISTS idx_invitations_status;
    CREATE INDEX idx_invitations_status ON society_invitations(status);
    
    DROP INDEX IF EXISTS idx_invitations_token;
    CREATE INDEX idx_invitations_token ON society_invitations(token);

    -- Admin users indexes
    DROP INDEX IF EXISTS idx_admin_users_role;
    CREATE INDEX idx_admin_users_role ON admin_users(role);
    
    DROP INDEX IF EXISTS idx_admin_users_active;
    CREATE INDEX idx_admin_users_active ON admin_users(is_active);

    -- Audit logs indexes
    DROP INDEX IF EXISTS idx_audit_logs_user;
    CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
    
    DROP INDEX IF EXISTS idx_audit_logs_action;
    CREATE INDEX idx_audit_logs_action ON audit_logs(action);
    
    DROP INDEX IF EXISTS idx_audit_logs_created;
    CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

    -- Reports indexes
    DROP INDEX IF EXISTS idx_reports_target;
    CREATE INDEX idx_reports_target ON reports(target_type, target_id);
    
    DROP INDEX IF EXISTS idx_reports_reporter;
    CREATE INDEX idx_reports_reporter ON reports(reporter_id);
    
    DROP INDEX IF EXISTS idx_reports_status;
    CREATE INDEX idx_reports_status ON reports(status);
    
    DROP INDEX IF EXISTS idx_reports_created;
    CREATE INDEX idx_reports_created ON reports(created_at DESC);
END $$;

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers (safe - will replace if exists)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_societies_updated_at ON societies;
CREATE TRIGGER update_societies_updated_at BEFORE UPDATE ON societies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_post_comments_updated_at ON post_comments;
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Counter update functions
CREATE OR REPLACE FUNCTION update_society_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE societies SET follower_count = follower_count + 1 WHERE id = NEW.society_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE societies SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.society_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_follower_count ON society_followers;
CREATE TRIGGER trigger_update_follower_count
AFTER INSERT OR DELETE ON society_followers
FOR EACH ROW EXECUTE FUNCTION update_society_follower_count();

CREATE OR REPLACE FUNCTION update_society_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE societies SET member_count = member_count + 1 WHERE id = NEW.society_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE societies SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.society_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_member_count ON society_members;
CREATE TRIGGER trigger_update_member_count
AFTER INSERT OR DELETE ON society_members
FOR EACH ROW EXECUTE FUNCTION update_society_member_count();

CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_likes_count ON post_likes;
CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comments_count ON post_comments;
CREATE TRIGGER trigger_update_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Auto-create profile function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, account_type, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'account_type', 'student'),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policies (drop if exists, then create)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
    CREATE POLICY "Profiles are viewable by everyone" ON profiles
        FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    CREATE POLICY "Users can update their own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Societies are viewable by everyone" ON societies;
    CREATE POLICY "Societies are viewable by everyone" ON societies
        FOR SELECT USING (is_active = true);

    DROP POLICY IF EXISTS "Society members can update society" ON societies;
    CREATE POLICY "Society members can update society" ON societies
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM society_members
                WHERE society_id = societies.id
                AND user_id = auth.uid()
                AND role IN ('owner', 'admin')
            )
        );

    DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON posts;
    CREATE POLICY "Published posts are viewable by everyone" ON posts
        FOR SELECT USING (is_published = true);

    DROP POLICY IF EXISTS "Society members can create posts" ON posts;
    CREATE POLICY "Society members can create posts" ON posts
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM society_members
                WHERE society_id = posts.society_id
                AND user_id = auth.uid()
            )
        );

    DROP POLICY IF EXISTS "Comments are viewable by everyone" ON post_comments;
    CREATE POLICY "Comments are viewable by everyone" ON post_comments
        FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Authenticated users can create comments" ON post_comments;
    CREATE POLICY "Authenticated users can create comments" ON post_comments
        FOR INSERT WITH CHECK (auth.uid() = author_id);

    DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
    CREATE POLICY "Users can view their own notifications" ON notifications
        FOR SELECT USING (auth.uid() = user_id);
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

