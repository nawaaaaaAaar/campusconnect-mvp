-- Quick verification script to check if the database schema is complete
-- Run this in Supabase SQL Editor to verify everything is set up correctly

DO $$
DECLARE
    table_count INTEGER;
    column_count INTEGER;
    index_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    RAISE NOTICE '📊 Tables: %', table_count;
    
    -- Check critical columns exist
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND (
        (table_name = 'posts' AND column_name IN ('is_published', 'title', 'tags')) OR
        (table_name = 'society_invitations' AND column_name IN ('token', 'status', 'expires_at')) OR
        (table_name = 'post_comments' AND column_name = 'parent_comment_id')
    );
    
    RAISE NOTICE '📋 Critical columns found: %/7', column_count;
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '🔍 Indexes: %', index_count;
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public';
    
    RAISE NOTICE '⚙️  Functions: %', function_count;
    
    -- Count RLS policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '🔒 RLS Policies: %', policy_count;
    
    -- Final verdict
    IF table_count >= 13 AND column_count = 7 AND index_count > 20 AND function_count >= 1 AND policy_count > 10 THEN
        RAISE NOTICE '✅ DATABASE FULLY CONFIGURED AND READY!';
    ELSE
        RAISE WARNING '⚠️  Some components may be missing. Check counts above.';
    END IF;
END $$;

-- Show all tables
SELECT 
    '📁 ' || table_name as "Available Tables",
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as "Columns"
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

