# Vercel Deployment Guide for CampusConnect MVP

**Date:** October 20, 2025  
**Status:** Ready for Deployment

---

## 🚀 Quick Deploy

### Option 1: Automated Deployment (Recommended)

```bash
# Login to Vercel (opens browser)
npx vercel login

# Deploy to production
npx vercel --prod
```

### Option 2: GitHub Integration (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository: `nawaaaaaAaar/campusconnect-mvp`
4. Vercel will auto-detect Vite configuration
5. Add environment variables (see below)
6. Click "Deploy"

---

## ⚙️ Project Configuration

Vercel will auto-detect these settings from your Vite project:

- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Root Directory:** `./` (or `campusconnect-mvp` if monorepo)

---

## 🔐 Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

### Required Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_VERSION=1.0.0
```

### Optional Variables

```env
VITE_FCM_VAPID_KEY=your-fcm-vapid-key (for push notifications)
VITE_ENABLE_TELEMETRY=true
VITE_ENVIRONMENT=production
```

**Important:** Add these for all environments (Production, Preview, Development)

---

## 📋 Pre-Deployment Checklist

### 1. Build Test Locally

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173` to test the production build locally.

### 2. Verify Environment Variables

Create `.env.production` file (DO NOT commit to Git):

```env
VITE_SUPABASE_URL=your-production-url
VITE_SUPABASE_ANON_KEY=your-production-key
VITE_APP_VERSION=1.0.0
```

### 3. Check Build Size

```bash
npm run build
# Check dist/ folder size - should be <10MB for optimal performance
```

### 4. Update Supabase Settings

In your Supabase project dashboard:

**Authentication → URL Configuration:**
- Add Vercel URL to redirect URLs: `https://your-app.vercel.app/**`
- Add to site URL: `https://your-app.vercel.app`

**API Settings:**
- Add Vercel domain to allowed origins

---

## 🎯 Deployment Steps

### Step 1: Login to Vercel

```bash
npx vercel login
```

This will open your browser to authenticate with Vercel.

### Step 2: Link Project (First Time Only)

```bash
npx vercel
```

You'll be asked:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account/team
- **Link to existing project?** → No (first time) or Yes (if already created)
- **What's your project's name?** → `campusconnect-mvp`
- **In which directory is your code?** → `./`
- **Want to override settings?** → No (auto-detected correctly)

This creates a preview deployment.

### Step 3: Deploy to Production

```bash
npx vercel --prod
```

This deploys to your production URL: `https://campusconnect-mvp.vercel.app`

---

## 🔄 Continuous Deployment

### GitHub Integration (Recommended)

Once connected to GitHub:

**Automatic Deployments:**
- **Push to `main`** → Deploys to production
- **Push to other branches** → Creates preview deployment
- **Pull requests** → Creates preview deployment with unique URL

**Configure in Vercel Dashboard:**
1. Go to Project Settings → Git
2. Enable "Auto-deploy" for main branch
3. Set production branch to `main`

---

## 📊 Post-Deployment Verification

### 1. Health Check

Visit your deployed URL and verify:
- ✅ Homepage loads
- ✅ Authentication works (Email + Google OAuth)
- ✅ Can create account
- ✅ Dashboard loads
- ✅ Can create post (society accounts)
- ✅ Search works
- ✅ Categories/Institutes pages load
- ✅ Deep links work (`/post/:id`, `/society/:id`)

### 2. Performance Check

Run Lighthouse audit:
```bash
npx lighthouse https://your-app.vercel.app --view
```

**Targets:**
- Performance: ≥90
- Accessibility: ≥95
- Best Practices: ≥90
- SEO: ≥90

### 3. Monitor Deployment

**Vercel Dashboard:**
- Check deployment logs
- Monitor function execution times
- Track bandwidth usage
- Review analytics

**Supabase Dashboard:**
- Monitor database connections
- Check API usage
- Review error logs

---

## 🐛 Troubleshooting

### Build Failures

**Issue:** Build fails with module not found

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Issue:** Environment variables not working

**Solution:**
- Ensure variables are prefixed with `VITE_`
- Redeploy after adding env vars
- Check they're set for correct environment

### Runtime Errors

**Issue:** Blank page after deployment

**Solution:**
1. Check browser console for errors
2. Verify Supabase URL and keys are correct
3. Check CORS settings in Supabase
4. Review Vercel function logs

**Issue:** OAuth redirect not working

**Solution:**
1. Add Vercel URL to Supabase redirect URLs
2. Format: `https://your-app.vercel.app/**`
3. Include both `www` and non-`www` versions if using custom domain

### Performance Issues

**Issue:** Slow initial load

**Solutions:**
- Enable Vercel's Edge Network (automatic)
- Implement code splitting with lazy loading
- Optimize images (use Vercel Image Optimization)
- Enable compression (automatic in Vercel)

---

## 🌐 Custom Domain Setup

### Step 1: Add Domain in Vercel

1. Go to Project Settings → Domains
2. Click "Add Domain"
3. Enter your domain: `campusconnect.com`

### Step 2: Configure DNS

**For Vercel Nameservers (Recommended):**
- Point your domain nameservers to Vercel
- Vercel manages DNS automatically

**For External DNS (e.g., Cloudflare):**

Add these records:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 3: Update Supabase

Add custom domain to Supabase:
- Authentication → Redirect URLs
- Add `https://campusconnect.com/**`
- Add `https://www.campusconnect.com/**`

---

## 📈 Monitoring & Analytics

### Vercel Analytics

**Enable in Dashboard:**
1. Go to Project → Analytics
2. Enable Web Analytics (free tier available)
3. View metrics: Page views, unique visitors, top pages

**Integration:**
```tsx
// Already enabled via Vercel automatically
// No code changes needed
```

### Performance Monitoring

**Vercel Speed Insights:**
1. Install package: `npm install @vercel/speed-insights`
2. Add to App.tsx:
```tsx
import { SpeedInsights } from '@vercel/speed-insights/react'

function App() {
  return (
    <>
      <YourApp />
      <SpeedInsights />
    </>
  )
}
```

---

## 💰 Cost Estimate

### Vercel Pricing

**Hobby Plan (Free):**
- ✅ Perfect for CampusConnect MVP
- 100GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS
- Preview deployments
- Web Analytics (basic)

**Pro Plan ($20/month):**
- Recommended if you exceed free tier
- 1TB bandwidth/month
- Priority support
- Advanced analytics
- Team collaboration

### Bandwidth Estimate

**Assumptions:**
- 1,000 monthly active users
- Each user loads 50 pages/month
- Average page size: 1MB (with caching)

**Calculation:**
1,000 users × 50 pages × 1MB = 50GB/month

**Conclusion:** Free tier is sufficient for MVP launch!

---

## 🔒 Security Checklist

- ✅ Environment variables stored in Vercel (not in code)
- ✅ HTTPS enabled automatically
- ✅ CORS configured in Supabase
- ✅ API keys rotated regularly
- ✅ Redirect URLs whitelisted
- ✅ Rate limiting enabled in Edge Functions
- ✅ RLS policies active in database

---

## 📞 Support

**Vercel Issues:**
- Documentation: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions
- Support: support@vercel.com

**Deployment Help:**
- Check deployment logs in Vercel Dashboard
- Review function logs for serverless errors
- Use Vercel CLI for detailed debugging: `vercel logs`

---

## 🎉 Success!

Your CampusConnect MVP is now live on Vercel! 🚀

**Next Steps:**
1. Share deployment URL with team
2. Run QA testing on production
3. Monitor analytics and performance
4. Collect user feedback
5. Iterate based on metrics

**Deployment URL:** Will be provided after first deploy
**Custom Domain:** Configure in Vercel Dashboard → Domains

---

**Last Updated:** October 20, 2025  
**Deployed By:** [Your Name]  
**Version:** 1.0.0




