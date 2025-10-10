-- Diagnostic script to check database configuration
-- Run this in Supabase SQL Editor to see what's missing

-- Check if profiles table exists and its structure
SELECT 
    'Profiles table columns:' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if the auth trigger exists
SELECT 
    'Auth triggers:' as check_type,
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%auth%' OR event_object_table = 'users';

-- Check if the handle_new_user function exists
SELECT 
    'Functions:' as check_type,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%user%';

-- Check RLS policies on profiles table
SELECT 
    'RLS Policies on profiles:' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Check if RLS is enabled on profiles
SELECT 
    'RLS Status:' as check_type,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- Try to see recent errors in logs (if accessible)
SELECT 'Database ready!' as status;

