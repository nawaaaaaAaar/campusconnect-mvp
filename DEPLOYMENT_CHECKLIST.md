# CampusConnect MVP - Deployment Checklist

**Target Date:** [Fill in]  
**Environment:** Production  
**Version:** 1.0.0

---

## Pre-Deployment Tasks

### 1. Code Quality ✅
- [x] All features implemented (95% PRD compliance)
- [x] No linting errors
- [ ] TypeScript strict mode enabled
- [ ] All `any` types resolved (where possible)
- [ ] Code review completed
- [ ] Security audit passed

### 2. Database
- [ ] Create production Supabase project
- [ ] Apply all migrations in order:
  - [ ] `001_initial_schema.sql`
  - [ ] `002_` through `011_` (existing migrations)
  - [ ] `012_add_edit_tracking.sql`
  - [ ] `013_notification_rate_limits.sql`
  - [ ] `014_seed_categories_institutes.sql`
- [ ] Verify RLS policies enabled on all tables
- [ ] Seed data loaded (categories, institutes)
- [ ] Test admin user created
- [ ] Database backups configured

### 3. Edge Functions
- [ ] Deploy all Edge Functions to Supabase:
  ```bash
  supabase functions deploy home-feed-api
  supabase functions deploy posts-api
  supabase functions deploy societies-api
  supabase functions deploy admin-api
  supabase functions deploy push-notifications
  supabase functions deploy categories-api
  supabase functions deploy institutes-api
  supabase functions deploy reports-api
  ```
- [ ] Verify CORS headers configured
- [ ] Test each endpoint with production data
- [ ] Set environment variables in Supabase dashboard

### 4. Authentication
- [ ] Configure OAuth providers in Supabase:
  - [ ] Google OAuth (client ID + secret)
  - [ ] Redirect URLs added
- [ ] Email templates customized
- [ ] OTP timeout configured (default: 60s)
- [ ] Session timeout configured
- [ ] Rate limiting enabled

### 5. Storage
- [ ] Create storage buckets:
  - [ ] `avatars` (public)
  - [ ] `post-media` (public)
  - [ ] `society-banners` (public)
- [ ] Set size limits:
  - [ ] Images: 5MB
  - [ ] Videos: 50MB
- [ ] Configure allowed MIME types
- [ ] Set up CDN caching headers

### 6. Push Notifications
- [ ] Create Firebase project
- [ ] Generate FCM server key
- [ ] Add FCM key to Supabase secrets:
  ```bash
  supabase secrets set FCM_SERVER_KEY=<your-key>
  ```
- [ ] Upload service worker to `/public/firebase-messaging-sw.js`
- [ ] Test notification delivery
- [ ] Configure notification icons

### 7. Environment Variables
- [ ] Create production `.env`:
  ```env
  VITE_SUPABASE_URL=https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJxxx...
  VITE_APP_VERSION=1.0.0
  ```
- [ ] Add to hosting platform (Vercel/Netlify)
- [ ] Verify no secrets in frontend bundle

---

## Deployment Steps

### Frontend Deployment

#### Option A: Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Build and deploy
npm run build
vercel --prod
```

Configuration:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Framework Preset: Vite

#### Option B: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

Configuration:
- Build Command: `npm run build`
- Publish Directory: `dist`
- Functions Directory: (none)

#### Option C: Cloudflare Pages
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables
5. Deploy

### Post-Deployment Verification

- [ ] Homepage loads correctly
- [ ] Authentication works (Email + Google)
- [ ] Profile creation/update works
- [ ] Post creation works
- [ ] Feed loads with posts
- [ ] Search works
- [ ] Categories page loads
- [ ] Institutes page loads
- [ ] Deep links work (`/post/:id`, `/society/:id`)
- [ ] Notifications send correctly
- [ ] Push notifications work (if user grants permission)
- [ ] Images upload successfully
- [ ] Reports submit successfully

---

## Performance Validation

### Lighthouse Audit
```bash
# Run Lighthouse on production URL
npx lighthouse https://your-domain.com --view
```

**Targets:**
- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Load Testing
```bash
# Use Artillery or k6
artillery quick --count 100 --num 10 https://your-domain.com
```

**Targets:**
- [ ] Search p95 latency: ≤500ms
- [ ] Feed first page p95: ≤700ms
- [ ] Feed next page p95: ≤600ms
- [ ] API errors: <1%
- [ ] Uptime: >99.9%

### Manual Performance Checks
- [ ] Feed loads in <1 second
- [ ] Search results appear instantly
- [ ] Smooth scrolling on mobile
- [ ] No layout shift (CLS)
- [ ] Images lazy load
- [ ] No console errors

---

## Security Checklist

### Authentication & Authorization
- [ ] All endpoints require authentication
- [ ] RLS policies prevent unauthorized access
- [ ] Admins can only access admin endpoints
- [ ] Session tokens expire appropriately
- [ ] No sensitive data in localStorage

### Content Security
- [ ] XSS protection enabled
- [ ] SQL injection prevented (parameterized queries)
- [ ] CORS configured correctly
- [ ] Rate limiting on API endpoints
- [ ] File upload validation (type, size)

### Data Privacy
- [ ] User emails not publicly visible
- [ ] Reports anonymous to reported users
- [ ] Audit logs access restricted to admins
- [ ] GDPR compliance (if EU users)
- [ ] Data retention policy defined

---

## Monitoring Setup

### Error Tracking
- [ ] Sentry/Rollbar configured (optional)
- [ ] Error boundaries catch React errors
- [ ] API errors logged
- [ ] User-facing error messages friendly

### Analytics
- [ ] Telemetry service sending events
- [ ] Analytics dashboard created (optional)
- [ ] Key metrics tracked:
  - [ ] Daily Active Users (DAU)
  - [ ] Posts created per day
  - [ ] Societies created per day
  - [ ] Average session duration
  - [ ] Feed engagement rate

### Alerts
- [ ] Database usage alerts
- [ ] Storage quota alerts
- [ ] Edge Function error rate alerts
- [ ] Downtime alerts

---

## User Communication

### Launch Announcement
- [ ] Email to beta users (if applicable)
- [ ] Social media announcement
- [ ] Landing page live
- [ ] Support email/contact form ready

### User Documentation
- [ ] FAQ page created
- [ ] Help center/docs available
- [ ] Tutorial/onboarding flow tested
- [ ] Privacy policy published
- [ ] Terms of service published

---

## Rollback Plan

### Backup Strategy
- [ ] Database backup before deployment
- [ ] Previous version tagged in Git
- [ ] Rollback procedure documented

### Rollback Steps (if needed)
1. Revert frontend deployment to previous version
2. If database changed, restore from backup
3. Notify users of temporary downtime
4. Investigate issue in staging
5. Deploy fix with testing

---

## Post-Launch Monitoring (First 24 Hours)

### Hour 1
- [ ] Check error rates
- [ ] Monitor user signups
- [ ] Verify critical flows work
- [ ] Check API latency

### Hour 6
- [ ] Review analytics data
- [ ] Check for reported bugs
- [ ] Monitor database performance
- [ ] Verify push notifications sent

### Hour 24
- [ ] Full metrics review
- [ ] User feedback collection
- [ ] Bug triage
- [ ] Plan hotfix if needed

---

## Success Metrics (Week 1)

- [ ] Zero critical bugs
- [ ] ≥100 user signups
- [ ] ≥50 posts created
- [ ] ≥10 societies created
- [ ] Uptime ≥99.5%
- [ ] Average load time <2s
- [ ] User satisfaction ≥4/5

---

## Known Issues (Non-Blocking)

### Minor Issues
1. **No search typeahead** - Users must type full query
2. **No scheduled notification sender** - Quiet hour notifications queued but not auto-sent
3. **No verification request UI** - Societies can't request verification badge

### Workarounds
1. Search still works, just no suggestions
2. Notifications send next time user is active outside quiet hours
3. Admins can manually verify societies via database

---

## Contact Information

**Technical Lead:** [Name]  
**Email:** [Email]  
**On-Call:** [Phone]  
**Incident Channel:** [Slack/Discord]

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| Product Owner | | | |
| DevOps | | | |

---

**Deployment Date:** [Fill in]  
**Deployment Time:** [Fill in]  
**Deployed By:** [Name]  
**Deployment Status:** [ ] Success [ ] Failed [ ] Rolled Back

---

**Notes:**
- Keep this checklist updated as you deploy
- Check off items as completed
- Document any issues encountered
- Update rollback plan if needed

**Good luck with the launch! 🚀**


