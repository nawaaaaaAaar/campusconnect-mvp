# 🛡️ How to Access Admin Panel

**CampusConnect MVP - Admin Access Guide**

---

## 🎯 **Quick Answer**

Currently, **no admin users exist** in your database. You need to make yourself an admin first!

---

## 📋 **Step-by-Step: Become an Admin**

### **Method 1: Using Supabase MCP (Recommended)**

I can make you an admin right now using Supabase MCP!

**Tell me:**
1. What's your **email address** that you use to log into the app?
2. Or give me your **user ID** from the database

**I'll run:**
```sql
INSERT INTO admin_users (user_id, role, is_active)
VALUES ('your-user-id-here', 'admin', true);
```

---

### **Method 2: Using Supabase Dashboard (Manual)**

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/egdavxjkyxvawgguqmvx

2. **Find Your User ID:**
   - Go to **Table Editor** → **profiles** table
   - Search for your email
   - Copy your **id** (UUID)

3. **Make Yourself Admin:**
   - Go to **Table Editor** → **admin_users** table
   - Click **Insert** → **Insert row**
   - Fill in:
     ```
     user_id: your-uuid-from-step-2
     role: admin
     is_active: true
     ```
   - Click **Save**

4. **Refresh Your App:**
   - Log out and log back in
   - Admin panel should now be accessible

---

### **Method 3: Using SQL Editor**

1. **Go to Supabase Dashboard** → **SQL Editor**

2. **Run this query** (replace with your email):
   ```sql
   -- Find your user ID
   SELECT id, email FROM profiles WHERE email = 'your-email@example.com';
   
   -- Make yourself admin (use the ID from above)
   INSERT INTO admin_users (user_id, role, is_active)
   VALUES ('paste-your-user-id-here', 'admin', true);
   ```

3. **Verify it worked:**
   ```sql
   SELECT 
       au.user_id,
       p.email,
       au.role,
       au.is_active
   FROM admin_users au
   JOIN profiles p ON p.id = au.user_id;
   ```

---

## 🎨 **How to Access Admin Panel in the App**

### **Option 1: Direct URL (If Route Exists)**

Check if there's a route like:
- `/admin`
- `/dashboard/admin`
- Add `?admin=true` to dashboard URL

### **Option 2: Via Dashboard**

Based on the code, the AdminPanel component exists but might not be routed yet. 

**Current Issue:** There's no visible route to AdminPanel in `App.tsx`

Let me check and add a route for you...

---

## 🔧 **Admin Panel Features**

Once you have admin access, you can:

✅ **Societies Management**
- Verify pending societies
- Approve/reject verification requests
- View all societies

✅ **Reports Management**
- Review user reports (posts, comments, societies)
- Take action on reported content
- Mark reports as resolved/rejected

✅ **User Management**
- View all users
- Manage user permissions
- Search and filter users

✅ **Analytics**
- View platform statistics
- Monitor new societies, posts, users
- Track pending reports

---

## 🚀 **Quick Setup (I'll Do This For You)**

If you give me your email, I can:

1. ✅ Find your user ID
2. ✅ Make you an admin
3. ✅ Add admin route if missing
4. ✅ Verify everything works

Just tell me your email address!

---

## 🔐 **Admin Roles & Permissions**

| Role | Description | Permissions |
|------|-------------|-------------|
| **admin** | Full access | All admin features |
| **moderator** | Content moderation | Review reports, moderate content |
| **support** | User support | View users, limited actions |

**Default role:** `moderator`  
**Recommended for you:** `admin`

---

## 🐛 **Troubleshooting**

### **Issue: "Admin panel not showing"**

**Possible causes:**
1. ❌ Not logged in
2. ❌ Not added to `admin_users` table
3. ❌ `is_active = false` in admin_users
4. ❌ No route to admin panel

**Solutions:**
1. Log out and log in again
2. Verify you're in `admin_users` table
3. Set `is_active = true`
4. Let me add the route if missing

---

### **Issue: "Access denied" when accessing admin features**

**Check:**
```sql
-- Verify your admin status
SELECT * FROM admin_users WHERE user_id = 'your-user-id';
```

**Should return:**
- `role`: admin or moderator
- `is_active`: true

---

## 📊 **Current Status**

**Database Check Results:**
- ✅ `admin_users` table exists
- ✅ Table structure correct (user_id, role, permissions, is_active)
- ❌ **No admin users exist yet** ← YOU NEED TO ADD YOURSELF

**Active Users in Database:**
- Total profiles: 10+
- Most recent: `e2e_student_1761032522109@example.com`
- All are test accounts (e2e_student_*)

**Recommendation:** Create a real account with your actual email, then make it admin.

---

## 🎯 **Next Steps**

### **Choose your path:**

**Path A: Quick (Tell me your email)**
1. Tell me your email address
2. I'll make you admin using Supabase MCP
3. You log out and back in
4. Access admin panel

**Path B: Manual (DIY)**
1. Log into Supabase Dashboard
2. Find your user ID in profiles table
3. Add yourself to admin_users table
4. Log out and back in

**Path C: Let me check routes**
1. I'll verify if admin route exists
2. Add route if missing
3. Then follow Path A or B

---

## 📝 **Example: Making User Admin**

```sql
-- Step 1: Find your user
SELECT id, email FROM profiles 
WHERE email = 'nawaaaar@example.com';  -- Replace with your email

-- Returns: id = 'abc-123-xyz...'

-- Step 2: Make admin
INSERT INTO admin_users (user_id, role, is_active)
VALUES ('abc-123-xyz...', 'admin', true);

-- Step 3: Verify
SELECT 
    p.email,
    au.role,
    au.is_active,
    au.granted_at
FROM admin_users au
JOIN profiles p ON p.id = au.user_id
WHERE au.user_id = 'abc-123-xyz...';
```

---

## ⚡ **Fast Track**

**Just tell me your email and I'll handle everything!**

Example:
> "My email is nawaaaar@gmail.com"

I'll:
1. ✅ Find your user ID in database
2. ✅ Add you to admin_users table
3. ✅ Verify admin access granted
4. ✅ Check if route exists (add if needed)
5. ✅ Give you exact URL to access admin panel

---

**What's your email address so I can make you admin?** 📧



