# IIT Dropdown Setup Guide

## ✅ What's Been Done

1. **Migration Created:** `supabase/migrations/015_seed_iit_institutes.sql`
   - Clears existing sample institute data
   - Adds all 23 IITs with proper names and locations

2. **ProfileSetup Updated:** `src/components/auth/ProfileSetup.tsx`
   - Replaced text input with Select dropdown
   - Fetches institutes from API
   - Shows IIT short names in dropdown

3. **Code Pushed to GitHub:** Commit `5031d05`

---

## 🚀 How to Apply the Migration

You need to run the migration to populate the institutes table with IIT data. Here are 3 methods:

### Method 1: Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/egdavxjkyxvawgguqmvx
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire content of `supabase/migrations/015_seed_iit_institutes.sql`
5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

### Method 2: Supabase CLI (If you have it set up)

```bash
cd campusconnect-mvp
npx supabase db push
```

This will apply all pending migrations.

### Method 3: Manual SQL (Quick Test)

Open your Supabase SQL Editor and run:

```sql
-- Quick check: See current institutes
SELECT name, short_name FROM institutes LIMIT 5;

-- If you see old data, run the full migration from the file
```

---

## 📋 What the Migration Does

### Before:
```
institutes table contains:
- MIT
- Stanford
- Harvard
- etc. (sample US universities)
```

### After:
```
institutes table contains:
- IIT Kharagpur
- IIT Bombay
- IIT Madras
- IIT Kanpur
- IIT Delhi
- ... (all 23 IITs)
```

---

## 🎨 How It Looks in the App

### Signup Flow:

1. User creates account → redirected to Profile Setup
2. **Institution field now shows a dropdown** instead of text input
3. Dropdown contains all 23 IITs:
   ```
   Select your IIT ▼
   
   IIT Kharagpur
   IIT Bombay
   IIT Madras
   IIT Kanpur
   IIT Delhi
   IIT Guwahati
   IIT Roorkee
   ... (and 16 more)
   ```
4. User selects their IIT from the list
5. Profile is created with the selected IIT

---

## 📝 List of All 23 IITs Included

1. IIT Kharagpur (West Bengal)
2. IIT Bombay (Maharashtra) 
3. IIT Madras (Tamil Nadu)
4. IIT Kanpur (Uttar Pradesh)
5. IIT Delhi (Delhi)
6. IIT Guwahati (Assam)
7. IIT Roorkee (Uttarakhand)
8. IIT Ropar (Punjab)
9. IIT Bhubaneswar (Odisha)
10. IIT Gandhinagar (Gujarat)
11. IIT Hyderabad (Telangana)
12. IIT Jodhpur (Rajasthan)
13. IIT Patna (Bihar)
14. IIT Indore (Madhya Pradesh)
15. IIT Mandi (Himachal Pradesh)
16. IIT BHU (Uttar Pradesh)
17. IIT Palakkad (Kerala)
18. IIT Tirupati (Andhra Pradesh)
19. IIT ISM Dhanbad (Jharkhand)
20. IIT Bhilai (Chhattisgarh)
21. IIT Goa
22. IIT Jammu (Jammu & Kashmir)
23. IIT Dharwad (Karnataka)

---

## ✅ Verification Steps

After running the migration:

1. **Check Database:**
   ```sql
   SELECT COUNT(*) FROM institutes WHERE verified = true;
   -- Should return: 23
   
   SELECT short_name FROM institutes ORDER BY short_name;
   -- Should show all IIT names
   ```

2. **Test in App:**
   - Sign out (if signed in)
   - Create a new account
   - Go to Profile Setup
   - Check that Institution field shows a dropdown
   - Verify all 23 IITs appear in the list
   - Select an IIT and complete profile
   - Profile should save with the selected IIT

---

## 🐛 Troubleshooting

### Dropdown shows "Loading institutes..." forever
- Check browser console for API errors
- Verify `institutes-api` Edge Function is deployed
- Check network tab for `/institutes-api` request

### Dropdown is empty
- Migration hasn't been run yet → Run it using Method 1 above
- API not returning data → Check Edge Function logs

### Error: "Failed to load institutes"
- API endpoint might be down
- Check Supabase Edge Function status
- Verify `getInstitutes()` method exists in `api.ts`

---

## 🔄 Future Enhancements

If you want to add more institutions later:

1. Create a new migration file: `016_add_more_institutes.sql`
2. Add INSERT statements for new institutes:
   ```sql
   INSERT INTO institutes (name, short_name, location, verified) VALUES
     ('National Institute of Technology Trichy', 'NIT Trichy', 'Tiruchirappalli, Tamil Nadu', true)
   ON CONFLICT (name) DO UPDATE SET
     short_name = EXCLUDED.short_name,
     location = EXCLUDED.location;
   ```
3. Run the migration
4. Institutes will automatically appear in the dropdown (no code changes needed!)

---

## 📊 Database Schema Reference

```sql
CREATE TABLE institutes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,           -- Full name: "Indian Institute of Technology Bombay"
    short_name TEXT,                      -- Short name: "IIT Bombay"
    location TEXT,                        -- Location: "Mumbai, Maharashtra"
    verified BOOLEAN DEFAULT true,        -- Only verified institutes show in dropdown
    description TEXT,
    logo_url TEXT,
    society_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

The dropdown shows `short_name` to users for readability.

---

**Status:** ✅ Code ready, waiting for migration to be run  
**Last Updated:** October 21, 2025


