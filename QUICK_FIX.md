# 🚨 Quick Fix: Database Schema Setup

## Problem
Getting "Database error saving new user" when trying to sign up.

## Solution

### Option 1: Using Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `egdavxjkyxvawgguqmvx`

2. **Open SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy and run the schema:**
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify tables created:**
   - Go to "Table Editor" in sidebar
   - You should see: profiles, societies, posts, etc.

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref egdavxjkyxvawgguqmvx

# Run migrations
supabase db push
```

### Option 3: Using psql (Advanced)

```bash
# Get your database connection string from Supabase Dashboard
# Settings > Database > Connection string (Direct connection)

psql "postgresql://postgres:[PASSWORD]@db.egdavxjkyxvawgguqmvx.supabase.co:5432/postgres" \
  -f supabase/migrations/001_initial_schema.sql
```

## After Running Migration

1. **Verify the setup:**
   - Go to Supabase Dashboard > Table Editor
   - Check that these tables exist:
     - ✅ profiles
     - ✅ societies
     - ✅ posts
     - ✅ society_members
     - ✅ society_followers
     - ✅ notifications

2. **Test signup again:**
   - Try creating a new account
   - Should work without errors now

## Still Having Issues?

If you get permission errors:

1. **Check RLS is enabled but has policies:**
   - The schema includes policies for authenticated users

2. **Verify the trigger exists:**
   ```sql
   -- Check in SQL Editor
   SELECT trigger_name 
   FROM information_schema.triggers 
   WHERE event_object_table = 'users';
   ```
   - Should show: `on_auth_user_created`

3. **Create admin user (optional):**
   ```sql
   -- After you create your first account, make yourself admin
   INSERT INTO admin_users (user_id, role, is_active)
   VALUES ('your-user-id-here', 'super_admin', true);
   ```

## Quick Test

After migration, try this in SQL Editor:

```sql
-- Check if profiles table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- Should return: profiles
```

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs/guides/database
- Your migration file: `supabase/migrations/001_initial_schema.sql`

