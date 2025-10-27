# 🔐 **Supabase OTP Configuration Guide**

## 🎯 **Problem**
Currently, Supabase sends magic links instead of 6-digit OTP codes during email authentication.

## ✅ **Solution**
Configure the Magic Link email template to send the OTP token instead of a confirmation URL.

---

## 🛠️ **Method 1: Supabase Dashboard (Recommended)**

### **Step 1: Access Email Templates**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `egdavxjkyxvawgguqmvx`
3. Navigate to **Authentication** → **Email Templates**

### **Step 2: Update Magic Link Template**
1. Find the **"Magic Link"** template
2. Replace the existing content with this OTP template:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Verification Code</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 24px; display: inline-block; }
        .code-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 30px 0; }
        .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f46e5; margin: 0; }
        .instructions { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CC</div>
            <h1>CampusConnect</h1>
        </div>
        
        <h2>Your Verification Code</h2>
        
        <div class="instructions">
            <p><strong>Enter this code to verify your email and sign in:</strong></p>
        </div>
        
        <div class="code-box">
            <p style="margin: 0 0 12px 0; color: #64748b;">6-digit verification code:</p>
            <div class="code">{{ .Token }}</div>
        </div>
        
        <p><strong>This code expires in 5 minutes.</strong></p>
        
        <p>If you're having trouble, copy and paste the code into the verification field.</p>
        
        <div class="footer">
            <p>This email was sent to {{ .Email }}</p>
            <p>CampusConnect - Connecting Campus Communities</p>
        </div>
    </div>
</body>
</html>
```

### **Step 3: Update Email Settings**
1. Go to **Authentication** → **Settings**
2. Ensure **Email OTP** is enabled
3. Optionally disable **Magic Link** if you only want OTP codes

### **Step 4: Test the Configuration**
1. Try signing in with an academic email
2. Check if you receive a 6-digit code instead of a magic link

---

## 🔧 **Method 2: Management API (Alternative)**

If you prefer programmatic configuration, use the Supabase Management API:

### **Get Current Access Token**
1. Go to [Supabase Account Settings](https://supabase.com/dashboard/account/tokens)
2. Generate a new access token
3. Store it securely

### **Update Email Templates via API**
```bash
# Replace with your actual values
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="egdavxjkyxvawgguqmvx"

curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_subjects_magic_link": "Your Verification Code",
    "mailer_templates_magic_link_content": "<h2>Your Verification Code</h2><p>Please enter this code: <strong>{{ .Token }}</strong></p><p>This code expires in 5 minutes.</p>"
  }'
```

---

## 🧪 **Testing Checklist**

After configuration, verify:

- [ ] Gmail emails are rejected (academic validation works)
- [ ] IIT emails are accepted 
- [ ] OTP codes are sent instead of magic links
- [ ] 6-digit codes work for authentication
- [ ] Code expiration works (5 minutes)
- [ ] User can successfully sign in with OTP

---

## 🎯 **Expected Results**

### **Before (Magic Links)**
- Email contains a clickable link
- User clicks link to sign in
- Redirects to app after clicking

### **After (OTP Codes)**  
- Email contains 6-digit code
- User enters code in app
- App verifies code and signs user in
- More secure and user-friendly

---

## 🔗 **Additional Resources**

- [Supabase Email OTP Documentation](https://supabase.com/docs/guides/auth/auth-email)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Magic Link vs OTP](https://supabase.com/docs/guides/auth/auth-email#with-magic-link)

---

## ⚡ **Quick Fix Commands**

For immediate testing, you can also create a temporary Edge Function to send custom OTP emails:

```bash
supabase functions new custom-otp-email
```

Then configure it as a Send Email Hook in the dashboard.

---

**Ready to implement? Start with Method 1 (Dashboard) for the quickest solution!** 🚀
