# CampusConnect - Production Deployment Guide

## 🚀 Overview

This guide covers deploying CampusConnect to production with all security, monitoring, and performance optimizations.

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Vercel account (for deployment)
- Firebase project (for push notifications)
- Sentry account (for error tracking)
- Docker (optional, for containerized deployment)

## 🔐 Security Checklist

### Environment Variables

**Required:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

**Optional but Recommended:**
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_SENTRY_DSN` - Sentry DSN for error tracking
- `VITE_APP_VERSION` - Application version
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins

### Database Setup

1. **Run migrations:**
```bash
cd campusconnect-mvp/supabase
psql -h <db-host> -U postgres -d postgres -f migrations/001_initial_schema.sql
```

2. **Verify tables:**
```sql
\dt
```

3. **Set up Row Level Security:**
All tables have RLS enabled by default. Review policies in `001_initial_schema.sql`.

4. **Create admin user:**
```sql
INSERT INTO admin_users (user_id, role, is_active)
VALUES ('your-user-id', 'super_admin', true);
```

### Edge Functions Configuration

1. **Set environment variables in Supabase:**
```bash
supabase secrets set ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
supabase secrets set ENVIRONMENT=production
```

2. **Deploy Edge Functions:**
```bash
cd campusconnect-mvp
supabase functions deploy profile-management
supabase functions deploy posts-api
supabase functions deploy societies-api
supabase functions deploy notifications-api
supabase functions deploy admin-api
supabase functions deploy health
```

## 🏗️ Build & Deploy

### Option 1: Vercel Deployment

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
cd campusconnect-mvp
vercel --prod
```

4. **Set environment variables in Vercel dashboard:**
- Go to Project Settings > Environment Variables
- Add all required variables

### Option 2: Docker Deployment

1. **Build Docker image:**
```bash
docker build -t campusconnect:latest \
  --build-arg VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
  --build-arg VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
  .
```

2. **Run container:**
```bash
docker run -p 80:80 campusconnect:latest
```

3. **Health check:**
```bash
curl http://localhost/health
```

### Option 3: Static Hosting (Netlify, Cloudflare Pages)

1. **Build:**
```bash
npm run build:prod
```

2. **Deploy `dist/` folder to your hosting provider**

## 📊 Monitoring & Logging

### Health Checks

- **Application health:** `https://your-domain.com/health`
- **API health:** `https://your-supabase-url.supabase.co/functions/v1/health`

### Sentry Setup

1. **Create Sentry project**
2. **Add DSN to environment variables**
3. **Monitor errors at:** https://sentry.io/organizations/your-org/issues/

### Logs

- **Edge Functions logs:** Supabase Dashboard > Edge Functions > Logs
- **Client logs:** Sentry Dashboard
- **Build logs:** Vercel Dashboard > Deployments

## 🔒 Security Hardening

### 1. CORS Configuration

Update `ALLOWED_ORIGINS` in Supabase secrets:
```bash
supabase secrets set ALLOWED_ORIGINS=https://campusconnect.com,https://www.campusconnect.com
```

### 2. Rate Limiting

Rate limits are configured in `_shared/ratelimit.ts`:
- API calls: 100 req/min
- Auth operations: 5 req/15min
- Admin operations: 20 req/min

### 3. Content Security Policy

CSP is configured in `vercel.json` and `nginx.conf`. Review and adjust based on your needs.

### 4. Database Security

- RLS enabled on all tables
- Service role key kept secure
- Regular backups configured

## 🧪 Testing

### Run All Tests

```bash
npm run test:all
```

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Load Testing

Use tools like k6 or Artillery:

```bash
# Install k6
brew install k6

# Run load test
k6 run scripts/load-test.js
```

## 📈 Performance Optimization

### 1. Database Indexes

All critical indexes are created in `001_initial_schema.sql`:
- Full-text search on posts and societies
- Foreign key indexes
- Timestamp indexes for pagination

### 2. Caching

- Static assets: 1 year cache
- API responses: Implement Redis caching (optional)
- CDN: Use Vercel Edge Network or Cloudflare

### 3. Bundle Size

Check bundle size:
```bash
npm run build:prod
npx vite-bundle-visualizer
```

Target: < 500KB initial load

## 🔄 CI/CD Pipeline

GitHub Actions is configured in `.github/workflows/ci-cd.yml`:

**On Pull Request:**
- Lint check
- Type check
- Unit tests
- E2E tests
- Build verification

**On Push to Main:**
- All PR checks
- Security scan
- Docker image build
- Deploy to production

**Required GitHub Secrets:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_FIREBASE_API_KEY`
- `VITE_SENTRY_DSN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

## 🚨 Incident Response

### Database Backup

```bash
# Manual backup
pg_dump -h <host> -U postgres -d postgres > backup-$(date +%Y%m%d).sql

# Restore
psql -h <host> -U postgres -d postgres < backup-20250101.sql
```

### Rollback Deployment

```bash
# Vercel
vercel rollback

# Docker
docker run -p 80:80 campusconnect:previous-tag
```

### Emergency Contacts

- **Database issues:** Check Supabase status page
- **Deployment issues:** Check Vercel status
- **Edge Functions:** Check Supabase Edge Functions logs

## 📊 Metrics & Analytics

### Key Metrics to Monitor

1. **Application Metrics:**
   - Response time (target: < 200ms)
   - Error rate (target: < 0.1%)
   - Uptime (target: > 99.9%)

2. **Database Metrics:**
   - Query performance
   - Connection pool usage
   - Table sizes

3. **User Metrics:**
   - Daily active users
   - Session duration
   - Feature usage

### Dashboards

- **Supabase:** Database and API metrics
- **Vercel:** Deployment and performance
- **Sentry:** Error tracking and performance
- **Google Analytics:** User behavior (if configured)

## 🔧 Maintenance

### Regular Tasks

**Daily:**
- Check error logs in Sentry
- Review rate limit hits
- Monitor response times

**Weekly:**
- Review security alerts
- Check database performance
- Update dependencies (if needed)

**Monthly:**
- Database vacuum and analyze
- Review and optimize slow queries
- Update documentation

### Dependency Updates

```bash
# Check for updates
npm outdated

# Update safely
npm update

# Security fixes
npm audit fix
```

## 📝 Production Checklist

Before going live:

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Edge Functions deployed
- [ ] CORS properly configured
- [ ] Rate limiting tested
- [ ] SSL certificate configured
- [ ] Sentry error tracking enabled
- [ ] Health checks passing
- [ ] Backups configured
- [ ] CI/CD pipeline working
- [ ] Documentation updated
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Admin accounts created
- [ ] Monitoring alerts configured

## 🆘 Support

For issues:
1. Check logs in Sentry
2. Review Supabase Edge Functions logs
3. Check GitHub Issues
4. Contact support team

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [React Best Practices](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-10  
**Maintained By:** CampusConnect Team

