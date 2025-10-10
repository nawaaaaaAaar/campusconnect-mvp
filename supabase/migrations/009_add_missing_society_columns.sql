-- Add ALL missing columns to societies table

DO $$
BEGIN
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS contact_email TEXT;
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS website TEXT;
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS logo_url TEXT;
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS verification_date TIMESTAMPTZ;
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0;
    ALTER TABLE societies ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
    
    RAISE NOTICE '✅ All societies table columns added successfully!';
END $$;

