# 🚨 Quick Fix: Database Schema Setup (Updated)

## Problem
Getting database errors when trying to sign up or use the app. Missing columns like `is_published`, `token`, `parent_comment_id`, etc.

## Root Cause
Your database has some tables but is missing many critical columns that were added in later schema versions.

## ✅ Solution: 2-Step Migration Process

### Step 1: Run the Comprehensive Schema Fix

This migration adds ALL missing columns and tables to your existing database.

**Using Supabase Dashboard (Recommended):**

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `egdavxjkyxvawgguqmvx`

2. **Open SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy and run the fix:**
   - Open `supabase/migrations/006_complete_schema_fix.sql`
   - Copy the entire contents (it should already be in your clipboard!)
   - Paste into SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify success:**
   - You should see: `🎉 COMPLETE! All tables and columns are now ready for migration 002`

### Step 2: Run the Full Schema Migration

After Step 1 succeeds, run the complete schema to add indexes, functions, and RLS policies.

**Using Supabase Dashboard:**

1. **In the same SQL Editor:**
   - Click "New Query"

2. **Copy and run migration 002:**
   - Open `supabase/migrations/002_safe_migration.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click "Run"

3. **Verify success:**
   - You should see: `✅ Database setup complete!`

## After Running Both Migrations

1. **Verify the setup:**
   - Go to Supabase Dashboard > Table Editor
   - Check that these tables exist with all columns:
     - ✅ profiles (with bio, interests, society_name, etc.)
     - ✅ societies (with verified, verification_date, etc.)
     - ✅ posts (with is_published, title, tags, etc.)
     - ✅ post_comments (with parent_comment_id)
     - ✅ society_invitations (with token, status, expires_at)
     - ✅ society_members
     - ✅ society_followers
     - ✅ notifications
     - ✅ institutes
     - ✅ push_devices
     - ✅ admin_users
     - ✅ audit_logs
     - ✅ reports
     - ✅ notification_preferences

2. **Test signup again:**
   - Try creating a new account
   - Should work without errors now

## Alternative: Using Supabase CLI

If you prefer the command line:

```powershell
# Set your access token
$env:SUPABASE_ACCESS_TOKEN="your-token-here"

# Run migration 006 first
npx supabase db execute --file supabase/migrations/006_complete_schema_fix.sql

# Then run migration 002
npx supabase db execute --file supabase/migrations/002_safe_migration.sql
```

## Quick Test

After both migrations, verify in SQL Editor:

```sql
-- Check if all key columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('is_published', 'title', 'tags', 'published_at');

-- Should return all 4 columns

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'society_invitations' 
AND column_name IN ('token', 'status', 'expires_at');

-- Should return all 3 columns
```

## Migration File Order

**DO NOT run these in order:**
- ~~001_initial_schema.sql~~ (skip this, it conflicts with existing data)
- ~~003_add_missing_columns.sql~~ (superseded by 006)
- ~~004_fix_post_comments.sql~~ (superseded by 006)
- ~~005_fix_society_invitations.sql~~ (superseded by 006)

**DO run these in this exact order:**
1. **006_complete_schema_fix.sql** ← Start here!
2. **002_safe_migration.sql** ← Then this!

## Still Having Issues?

If you encounter errors:

1. **Check which migration failed:**
   - Look at the error message for the column/table name
   - Note which line number in the migration

2. **Verify current schema:**
   ```sql
   -- List all tables
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- List all columns in a specific table
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'your_table_name';
   ```

3. **Contact support with:**
   - The exact error message
   - Which migration file you were running
   - The line number that failed

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs/guides/database
- Migration files: `supabase/migrations/`
- Full guide: `run-migrations.md`
