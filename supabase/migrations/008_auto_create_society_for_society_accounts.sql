-- Automatically create a society when a society account completes profile setup
-- This ensures society accounts can post immediately

-- Function to create society from profile
CREATE OR REPLACE FUNCTION public.create_society_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only proceed if this is a society account with a name
  IF NEW.account_type = 'society' AND NEW.name IS NOT NULL THEN
    -- Check if society already exists for this profile
    IF NOT EXISTS (SELECT 1 FROM societies WHERE owner_user_id = NEW.id) THEN
      -- Create the society
      INSERT INTO societies (
        owner_user_id,
        name,
        description,
        category,
        institute_id,
        verified,
        created_at,
        updated_at
      )
      VALUES (
        NEW.id,
        NEW.name,
        COALESCE(NEW.bio, 'A campus society'),
        'Other',
        NEW.institute,
        false,
        NOW(),
        NOW()
      );
      
      -- Make the profile creator an admin member of their society
      INSERT INTO society_members (
        society_id,
        user_id,
        role,
        joined_at
      )
      SELECT
        s.id,
        NEW.id,
        'admin',
        NOW()
      FROM societies s
      WHERE s.owner_user_id = NEW.id
      ON CONFLICT (society_id, user_id) DO NOTHING;
      
      RAISE NOTICE 'Created society for profile %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_society_profile_created ON profiles;

-- Create trigger to run after profile insert or update
CREATE TRIGGER on_society_profile_created
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.account_type = 'society' AND NEW.name IS NOT NULL)
  EXECUTE FUNCTION public.create_society_from_profile();

-- Backfill: Create societies for existing society accounts that don't have one
DO $$
DECLARE
  profile_record RECORD;
  new_society_id UUID;
BEGIN
  FOR profile_record IN
    SELECT p.* 
    FROM profiles p
    LEFT JOIN societies s ON s.owner_user_id = p.id
    WHERE p.account_type = 'society' 
    AND p.name IS NOT NULL
    AND s.id IS NULL
  LOOP
    -- Create society
    INSERT INTO societies (
      owner_user_id,
      name,
      description,
      category,
      institute_id,
      verified,
      created_at,
      updated_at
    )
    VALUES (
      profile_record.id,
      profile_record.name,
      COALESCE(profile_record.bio, 'A campus society'),
      'Other',
      profile_record.institute,
      false,
      NOW(),
      NOW()
    )
    RETURNING id INTO new_society_id;
    
    -- Make them admin
    INSERT INTO society_members (
      society_id,
      user_id,
      role,
      joined_at
    )
    VALUES (
      new_society_id,
      profile_record.id,
      'admin',
      NOW()
    )
    ON CONFLICT (society_id, user_id) DO NOTHING;
    
    RAISE NOTICE 'Backfilled society for profile %', profile_record.id;
  END LOOP;
END $$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_society_from_profile() TO authenticated, service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Society auto-creation trigger installed and backfill complete!';
END $$;

