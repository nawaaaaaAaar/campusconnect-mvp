-- Add missing columns to society_invitations table
-- This table handles invitations to join societies

DO $$ 
BEGIN
    -- Add token column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='society_invitations' AND column_name='token') THEN
        ALTER TABLE society_invitations 
        ADD COLUMN token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text;
        
        RAISE NOTICE 'Added token column to society_invitations';
    ELSE
        RAISE NOTICE 'token column already exists';
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='society_invitations' AND column_name='status') THEN
        ALTER TABLE society_invitations 
        ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'));
        
        RAISE NOTICE 'Added status column to society_invitations';
    ELSE
        RAISE NOTICE 'status column already exists';
    END IF;

    -- Add responded_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='society_invitations' AND column_name='responded_at') THEN
        ALTER TABLE society_invitations 
        ADD COLUMN responded_at TIMESTAMPTZ;
        
        RAISE NOTICE 'Added responded_at column to society_invitations';
    ELSE
        RAISE NOTICE 'responded_at column already exists';
    END IF;

    -- Add expires_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='society_invitations' AND column_name='expires_at') THEN
        ALTER TABLE society_invitations 
        ADD COLUMN expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days');
        
        RAISE NOTICE 'Added expires_at column to society_invitations';
    ELSE
        RAISE NOTICE 'expires_at column already exists';
    END IF;

END $$;

-- Create the index for token
DO $$
BEGIN
    DROP INDEX IF EXISTS idx_invitations_token;
    CREATE INDEX idx_invitations_token ON society_invitations(token);
    RAISE NOTICE 'Created index on token';
END $$;

-- Create the index for status
DO $$
BEGIN
    DROP INDEX IF EXISTS idx_invitations_status;
    CREATE INDEX idx_invitations_status ON society_invitations(status);
    RAISE NOTICE 'Created index on status';
END $$;

-- Success
DO $$
BEGIN
    RAISE NOTICE '✅ Society invitations table updated successfully!';
END $$;

