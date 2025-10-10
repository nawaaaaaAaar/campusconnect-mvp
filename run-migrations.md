# 🚀 Run Database Migrations - Easy Guide

## Method 1: Using Supabase CLI (Recommended)

### Step 1: Get Your Access Token

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click **"Generate new token"**
3. Give it a name: "CLI Access"
4. Copy the token (it will only be shown once!)

### Step 2: Set the Token

**Windows PowerShell:**
```powershell
$env:SUPABASE_ACCESS_TOKEN="your-token-here"
```

**Windows CMD:**
```cmd
set SUPABASE_ACCESS_TOKEN=your-token-here
```

**Mac/Linux:**
```bash
export SUPABASE_ACCESS_TOKEN="your-token-here"
```

### Step 3: Link Your Project

```bash
cd campusconnect-mvp
npx supabase link --project-ref egdavxjkyxvawgguqmvx
```

### Step 4: Run Migrations in Order

```bash
# Step 1: Add missing columns
npx supabase db push --include-all supabase/migrations/003_add_missing_columns.sql

# Step 2: Complete the setup
npx supabase db push --include-all supabase/migrations/002_safe_migration.sql
```

## Method 2: Using Database Password (Alternative)

### Step 1: Get Database Password

1. Go to: https://supabase.com/dashboard/project/egdavxjkyxvawgguqmvx/settings/database
2. Copy your database password (or reset it if you forgot)

### Step 2: Run with psql

```bash
# Set your password
$env:PGPASSWORD="your-db-password"

# Run migrations
psql "postgresql://postgres.egdavxjkyxvawgguqmvx:$env:PGPASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/003_add_missing_columns.sql

psql "postgresql://postgres.egdavxjkyxvawgguqmvx:$env:PGPASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/002_safe_migration.sql
```

## Method 3: Manual in Dashboard (Easiest for now)

Since the CLI needs setup, here's the quickest path:

### For File: 003_add_missing_columns.sql

1. Open: `campusconnect-mvp/supabase/migrations/003_add_missing_columns.sql`
2. Copy ALL contents (Ctrl+A, Ctrl+C)
3. Go to: https://supabase.com/dashboard/project/egdavxjkyxvawgguqmvx/sql
4. Click "New query"
5. Paste and click "Run"
6. Wait for success message

### Then File: 002_safe_migration.sql

1. Open: `campusconnect-mvp/supabase/migrations/002_safe_migration.sql`
2. Copy ALL contents
3. New query in Supabase
4. Paste and Run

## ✅ Verify Success

After running migrations, check:

```sql
-- In Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Should show all 14 tables:
- admin_users
- audit_logs  
- institutes
- notifications
- notification_preferences
- post_comments
- post_likes
- posts
- profiles
- push_devices
- reports
- societies
- society_followers
- society_invitations
- society_members

## 🎯 Test Signup

After migrations complete:
1. Refresh your app
2. Try creating an account
3. Should work without errors! ✅

## 🆘 Troubleshooting

**Error: "Access token not provided"**
- Solution: Use Method 2 or Method 3 above

**Error: "column already exists"**
- Solution: That's fine! The scripts handle this gracefully

**Error: "relation already exists"**  
- Solution: Use 002_safe_migration.sql which drops and recreates safely

---

**Recommended:** Start with Method 3 (dashboard) - it's the fastest for now!

