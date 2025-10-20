# 🚨 QUICKSTART: Fix 500 Errors in Production

**Last Updated:** October 20, 2025  
**Issue:** Edge Functions returning 500 errors for likes, comments, and other endpoints  
**Status:** ✅ **FIXED** - Ready to deploy

---

## 🐛 What Was The Problem?

**Root Cause:** Path routing bug in Edge Functions

The path parsing logic in `posts-api`, `societies-api`, and `profile-api` was incorrectly handling URLs that include the `/functions/v1/` prefix.

**Example:**
```
URL: /functions/v1/posts-api/abc123/like
Expected pathSegments: ['abc123', 'like']
Actual pathSegments (before fix): ['v1', 'posts-api', 'abc123', 'like']
```

This caused all endpoint matching to fail, resulting in 500 Internal Server Errors.

---

## ✅ The Fix (Already Committed)

**Commit:** `c306cfb` - fix(edge-functions): Fix path routing bug causing 500 errors

**Files Fixed:**
- ✅ `supabase/functions/posts-api/index.ts`
- ✅ `supabase/functions/societies-api/index.ts`
- ✅ `supabase/functions/profile-api/index.ts`

**Changes:**
```typescript
// Before (WRONG)
const pathSegments = url.pathname.split('/').filter(Boolean).slice(1)

// After (CORRECT)
let pathSegments = url.pathname.split('/').filter(Boolean);
const functionNameIndex = pathSegments.indexOf('posts-api');
if (functionNameIndex !== -1) {
    pathSegments = pathSegments.slice(functionNameIndex + 1);
}
```

---

## 🚀 Deploy The Fix NOW (3 Steps)

### **Option A: Using PowerShell Script (Easiest)**

```powershell
# 1. Open PowerShell in project directory
cd "C:\Users\nawaa\Desktop\campus connect\campusconnect-mvp"

# 2. Run the deployment script
.\deploy-edge-functions.ps1

# That's it! ✅
```

The script will automatically deploy all 13 Edge Functions and show you a summary.

---

### **Option B: Manual Deployment**

```powershell
# 1. Navigate to project
cd "C:\Users\nawaa\Desktop\campus connect\campusconnect-mvp"

# 2. Make sure you're logged in to Supabase
supabase login

# 3. Deploy the fixed functions (minimum required)
supabase functions deploy posts-api
supabase functions deploy societies-api
supabase functions deploy profile-api

# 4. Optional: Deploy all other functions
supabase functions deploy home-feed-api
supabase functions deploy admin-api
supabase functions deploy push-notifications
supabase functions deploy categories-api
supabase functions deploy institutes-api
supabase functions deploy reports-api
supabase functions deploy notifications-api
supabase functions deploy media-upload-api
supabase functions deploy invitations-api
supabase functions deploy health
```

---

## 🧪 Test The Fix

After deploying, test these critical endpoints:

### 1. **Like a Post**
```bash
# In your browser console on the app:
# Click the heart icon on any post
# Should see: ✅ Like count increases
# Should NOT see: ❌ 500 error
```

### 2. **Comment on a Post**
```bash
# In your browser console on the app:
# Type a comment and submit
# Should see: ✅ Comment appears in the list
# Should NOT see: ❌ 500 error
```

### 3. **Follow a Society**
```bash
# In your browser console on the app:
# Click "Follow" on a society
# Should see: ✅ Button changes to "Following"
# Should NOT see: ❌ 500 error
```

---

## 📊 Monitor Function Logs

**In Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to "Edge Functions" in the left sidebar
4. Click on "posts-api"
5. View the "Logs" tab
6. Look for successful requests (should see 200 status codes)

**Via CLI:**
```bash
# Real-time logs
supabase functions logs posts-api --follow

# Last 50 lines
supabase functions logs posts-api -n 50
```

**What to look for:**
- ✅ `Posts API - Method: POST Path: /functions/v1/posts-api/abc123/like Segments: ['abc123', 'like']`
- ❌ NO: `Uncaught Error` or `500 Internal Server Error`

---

## 🎯 Expected Results After Fix

### Before (BROKEN ❌)
```
Console errors:
- POST https://.../posts-api/{id}/like 500 (Internal Server Error)
- POST https://.../posts-api/{id}/comments 500 (Internal Server Error)

Function logs:
- pathSegments: ['v1', 'posts-api', '{id}', 'like']
- No matching route found → returns 500
```

### After (WORKING ✅)
```
Console:
- POST https://.../posts-api/{id}/like 200 OK
- POST https://.../posts-api/{id}/comments 200 OK

Function logs:
- pathSegments: ['{id}', 'like']
- Route matched successfully → returns 200
```

---

## 🛠️ Troubleshooting

### Issue: `supabase: command not found`

**Solution:**
```bash
# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version
```

### Issue: `Project not linked`

**Solution:**
```bash
# Link your project
supabase link --project-ref egdavxjkyxvawgguqmvx

# Or login and link manually
supabase login
supabase link
```

### Issue: Still getting 500 errors after deployment

**Check:**
1. **Deployment actually succeeded?**
   ```bash
   supabase functions list
   # Should show all functions with recent "Last Deployed" times
   ```

2. **Correct version deployed?**
   ```bash
   # Check function logs for the new path parsing logic
   supabase functions logs posts-api -n 20
   # Look for: "Path: /functions/v1/posts-api/..."
   ```

3. **Environment variables set?**
   ```bash
   # Verify in Supabase Dashboard:
   # Settings → Edge Functions → Secrets
   # Should have: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
   ```

4. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or open in incognito/private window

---

## 📞 Still Having Issues?

1. **Get detailed error logs:**
   ```bash
   supabase functions logs posts-api -n 100 > logs.txt
   ```

2. **Check the comprehensive guide:**
   - See `SUPABASE_TROUBLESHOOTING.md` in this project

3. **Common issues:**
   - RLS policies blocking requests
   - Missing database tables
   - Incorrect JWT token
   - Service role key not set

---

## 📋 Post-Deployment Checklist

After deploying, verify:

- [ ] `supabase functions list` shows all functions
- [ ] Function logs show correct path parsing
- [ ] Can like a post (no 500 error)
- [ ] Can comment on a post (no 500 error)
- [ ] Can follow a society (no 500 error)
- [ ] No CORS errors in browser console
- [ ] Feed loads correctly
- [ ] No TypeScript errors in browser console

---

## 🎉 Success Criteria

**You'll know it's working when:**
1. ✅ No 500 errors in browser console
2. ✅ Like button works (heart icon fills, count updates)
3. ✅ Comments appear after submitting
4. ✅ Follow button toggles correctly
5. ✅ Function logs show `200 OK` responses
6. ✅ App is fully functional!

---

**Time to deploy:** ~5 minutes  
**Expected downtime:** ~30 seconds  
**Risk level:** 🟢 Low (only fixes existing bugs)

---

🚀 **Ready? Run the deployment now!**

```powershell
cd "C:\Users\nawaa\Desktop\campus connect\campusconnect-mvp"
.\deploy-edge-functions.ps1
```


