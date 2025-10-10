-- Add missing columns to societies table that are needed by the API

DO $$
BEGIN
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='societies' AND column_name='description') THEN
        ALTER TABLE societies ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to societies table';
    END IF;
    
    -- Add contact_email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='societies' AND column_name='contact_email') THEN
        ALTER TABLE societies ADD COLUMN contact_email TEXT;
        RAISE NOTICE 'Added contact_email column to societies table';
    END IF;
    
    -- Add website column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='societies' AND column_name='website') THEN
        ALTER TABLE societies ADD COLUMN website TEXT;
        RAISE NOTICE 'Added website column to societies table';
    END IF;
    
    RAISE NOTICE '✅ Societies table columns updated successfully!';
END $$;

