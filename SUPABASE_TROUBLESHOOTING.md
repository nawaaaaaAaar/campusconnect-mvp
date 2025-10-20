# Supabase Edge Functions Troubleshooting

**Date:** October 20, 2025  
**Issue:** 500 Internal Server Error on posts-api endpoints

---

## 🔍 Current Errors

```
POST /posts-api/{id}/like - 500 Internal Server Error
POST /posts-api/{id}/comments - 500 Internal Server Error
```

---

## 🛠️ Debug Steps

### 1. Check Edge Function Logs

```bash
# View real-time logs for posts-api
supabase functions logs posts-api --follow

# Or in Supabase Dashboard:
# Project → Edge Functions → posts-api → Logs
```

### 2. Verify Edge Functions Are Deployed

```bash
# List deployed functions
supabase functions list

# Expected output should include:
# - posts-api
# - home-feed-api
# - societies-api
# - admin-api
# - push-notifications
```

### 3. Deploy/Redeploy Edge Functions

```bash
cd "C:\Users\nawaa\Desktop\campus connect\campusconnect-mvp"

# Deploy all functions
supabase functions deploy posts-api
supabase functions deploy home-feed-api
supabase functions deploy societies-api
supabase functions deploy admin-api
supabase functions deploy push-notifications
supabase functions deploy categories-api
supabase functions deploy institutes-api
supabase functions deploy reports-api
```

### 4. Check Environment Variables

In Supabase Dashboard → Project Settings → Edge Functions:

**Required Secrets:**
```bash
SUPABASE_URL=https://egdavxjkyxvawgguqmvx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Set via CLI:**
```bash
supabase secrets set SUPABASE_URL=https://egdavxjkyxvawgguqmvx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🔧 Common Fixes

### Fix 1: Missing CORS Headers

**Issue:** Browser blocks requests due to CORS

**Solution:** Already implemented in all Edge Functions ✅

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
}
```

### Fix 2: Database Table Missing

**Issue:** `post_likes` or `post_comments` table doesn't exist

**Check in Supabase Dashboard → Table Editor:**
- ✅ `posts` table exists
- ✅ `post_likes` table exists
- ✅ `post_comments` table exists
- ✅ `profiles` table exists

**If missing, run migrations:**
```bash
supabase db push
```

### Fix 3: RLS Policies Blocking Requests

**Issue:** Row Level Security preventing inserts

**Check RLS Policies:**

Go to Dashboard → Authentication → Policies

**Required policies for `post_likes`:**
```sql
-- Allow authenticated users to insert likes
CREATE POLICY "Users can like posts"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view all likes
CREATE POLICY "Likes are viewable by everyone"
  ON post_likes FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to delete their own likes
CREATE POLICY "Users can unlike posts"
  ON post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

**Required policies for `post_comments`:**
```sql
-- Allow authenticated users to insert comments
CREATE POLICY "Users can comment on posts"
  ON post_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Allow users to view all comments
CREATE POLICY "Comments are viewable by everyone"
  ON post_comments FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete own comments"
  ON post_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);
```

### Fix 4: Service Role Key Issues

**Issue:** Edge Functions can't bypass RLS

**Solution:** Ensure Edge Functions use service role key in headers:

```typescript
headers: {
  'Authorization': `Bearer ${serviceRoleKey}`,
  'apikey': serviceRoleKey
}
```

---

## 🚀 Quick Fix Commands

**Option 1: Redeploy All Functions**
```bash
cd "C:\Users\nawaa\Desktop\campus connect\campusconnect-mvp"

# Deploy all at once
supabase functions deploy posts-api
supabase functions deploy home-feed-api  
supabase functions deploy societies-api
supabase functions deploy admin-api
supabase functions deploy push-notifications

# Or use a loop (PowerShell)
$functions = @("posts-api", "home-feed-api", "societies-api", "admin-api", "push-notifications", "categories-api", "institutes-api", "reports-api")
foreach ($func in $functions) {
    Write-Host "Deploying $func..."
    supabase functions deploy $func
}
```

**Option 2: Check Function Logs**
```bash
# View logs in real-time
supabase functions logs posts-api --follow

# Check last 100 lines
supabase functions logs posts-api -n 100
```

**Option 3: Test Function Locally**
```bash
# Serve functions locally
supabase functions serve posts-api

# Test with curl
curl -X POST http://localhost:54321/functions/v1/posts-api/test-id/like \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🔍 Debugging Workflow

1. **Check Supabase Dashboard Logs**
   - Go to Edge Functions → posts-api → Logs
   - Look for the actual error message (not just 500)

2. **Common Error Messages:**
   - `"Supabase configuration missing"` → Set environment variables
   - `"relation does not exist"` → Table missing, run migrations
   - `"JWT expired"` → Auth token issue
   - `"permission denied"` → RLS policy blocking request

3. **Test Locally First**
   ```bash
   # Start Supabase locally
   supabase start
   
   # Serve functions
   supabase functions serve
   
   # Test endpoints
   ```

4. **Deploy After Fixing**
   ```bash
   supabase functions deploy posts-api --no-verify-jwt
   ```

---

## 📊 Telemetry Error (Non-Critical)

**Error:** `Failed to flush events: TypeError: Failed to fetch`

**Cause:** `/analytics-api` endpoint doesn't exist yet

**Fix:** Create analytics-api Edge Function (optional for MVP)

**Temporary Fix:** Disable telemetry in production

```typescript
// src/lib/telemetry.ts
const ENABLE_TELEMETRY = import.meta.env.VITE_ENABLE_TELEMETRY === 'true'

// Only enable if explicitly set
if (!ENABLE_TELEMETRY) {
  this.enabled = false
}
```

---

## ✅ Verification Checklist

After deploying fixes:

- [ ] `supabase functions list` shows all 8 functions
- [ ] Function logs show no errors
- [ ] Can like a post (no 500 error)
- [ ] Can comment on a post (no 500 error)
- [ ] Feed loads correctly
- [ ] No CORS errors in browser console

---

## 🆘 If Still Not Working

1. **Get actual error from logs:**
   ```bash
   supabase functions logs posts-api -n 50
   ```

2. **Share the error message** - it will tell us exactly what's wrong

3. **Check Supabase Project Status** - ensure project isn't paused

4. **Verify API URL** - should match:
   ```
   https://egdavxjkyxvawgguqmvx.supabase.co/functions/v1/posts-api
   ```

---

**Last Updated:** October 20, 2025


