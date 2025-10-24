-- Fix society creation trigger to properly lookup institute UUID
-- The previous version was passing text directly to UUID field

-- Drop and recreate the function with proper institute lookup
CREATE OR REPLACE FUNCTION public.create_society_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  institute_uuid UUID;
BEGIN
  -- Only proceed if this is a society account with a name
  IF NEW.account_type = 'society' AND NEW.name IS NOT NULL THEN
    -- Check if society already exists for this profile
    IF NOT EXISTS (SELECT 1 FROM societies WHERE owner_user_id = NEW.id) THEN
      
      -- Lookup institute UUID from short_name
      SELECT id INTO institute_uuid
      FROM institutes
      WHERE short_name = NEW.institute
      LIMIT 1;
      
      -- Only create society if we found a valid institute
      IF institute_uuid IS NOT NULL THEN
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
          institute_uuid, -- Use the looked-up UUID
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
      ELSE
        RAISE WARNING 'Cannot create society for profile %: Institute % not found', NEW.id, NEW.institute;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_society_from_profile() TO authenticated, service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Society trigger fixed to properly lookup institute UUIDs!';
END $$;

