# Holistic — PRD (MVP with Base)
**Version:** v0.6 • **Date:** 2025‑08‑23 • **Owner:** PM/ENG Lead  
**Goal:** Ship a focused MVP using a proven open‑source base. Foundation = **Next.js (App Router) + Supabase + shadcn/ui**, extended with campus‑specific features (Institutes ▶ Societies ▶ Posts), **Follow** system with 70/30 blended **Feed**, **Push Notifications**, and light **Admin**.

---

## 1) Final Decisions
- **Base (web):** **SupaNext Starter Kit** — Next.js 14 App Router + Supabase (`@supabase/ssr`) + Tailwind + shadcn/ui (MIT).
  **Scaffold:**
  ```bash
  pnpm create next-app -e https://github.com/michaeltroya/supa-next-starter
  # or
  npx create-next-app -e https://github.com/michaeltroya/supa-next-starter
  ```
- **UI Blocks:** Prefer official **Supabase UI Library** components where they save time (Auth block, Storage, Realtime) while keeping our UX.
- **Optional mobile path:** Expo + Supabase (kept out of MVP; reuse API/DB later).
- **Navigation:** Bottom nav = **Home / Categories / Institutes / Upload / Profile**. **Header:** Search field **+ Notifications bell** on primary tabs (upper‑right).
- **Feed blend:** **70/30** (Followed/Global) via **2F:1G interleaving**; preserve chronological order within buckets; fallback to global when followed supply is low.
- **Post actions:** **Like / Comment / Share** (native share sheet or copy deep link).
- **Members tab:** **Public** — everyone can see **member names & avatars/photos** on Society pages.
- **Follow privacy:** Follows are public on member profiles, **not searchable** in MVP (no "people who follow X").
- **Moderation:** Editors can edit ≤ **15 min** post‑publish; Owner/Admin can remove with **AuditLog**; **App Admin can delete comments** across societies.
- **Notifications:** Event types = `post:new`, `roster:invite`; enforce **quiet hours 22:00–07:00** (local) + rate‑limits. **Bell opens Notification Settings**.
- **Auth:** Email + OTP (**CTA: Verify OTP**) **and** **Continue with Google**.

---

## 2) Why this Base
- **Speed:** Auth/session, UI primitives, and data layer are done; we focus on domain features.
- **Fit:** Matches our wireframes (React, Tailwind, shadcn).
- **Extensibility:** Supabase (Postgres, RLS, Realtime, Storage), Edge Functions for pushes/digests.
- **License:** MIT‑aligned starters keep our code permissively licensed.

---

## 3) Architecture Overview
**Frontend (Web):** Next.js (App Router), React 18, Tailwind, shadcn/ui.  
**Backend:** Supabase (Postgres, Auth, RLS, Realtime, Storage), Edge Functions.  
**Notifications:** Web push via FCM; device tokens per user; quiet‑hours logic server‑side.  
**Observability:** Request logging, error tracking, notification funnel metrics.

```
Browser (PWA) ── FCM Service Worker ─▶ FCM
     │                                 ▲
     │ (fetch content)                 │ push
     ▼                                 │
Next.js routes/app ─▶ Supabase RPC/REST (RLS) ─▶ Postgres
                                 │
                                 └─ Edge Function: notify_post_created (fan‑out + rate‑limit + digest)
```

---

## 4) Information Architecture & Navigation
- **Bottom nav:** Home / Categories / Institutes / Upload / Profile.
- **Header:** Search field **+ Notifications bell** on primary tabs (upper‑right). Bell opens **Notifications Settings**.
- **Deep links:** `/society/[id]?tab=posts|about|members`, `/category/[slug]`, `/institute/[id]`.

**Acceptance:** Search reachable from all primary tabs; bell visible on primary tabs; deep links open correct tab/state; nav selection persists across sessions.

---

## 5) Feature Requirements & Acceptance Criteria
### 5.1 Auth & Onboarding (Email + OTP + Google)
**Stories**
- Sign up with email → OTP → verify → enter app; or **Continue with Google**.
- After verification/auth, prompt **Profile Setup** (name, institute, course).

**Acceptance**
- 6‑digit OTP (paste, resend timer). CTA = **Verify OTP**.
- Success (OTP or Google) → session + Profile Setup (if incomplete).
- Errors accessible (ARIA live) for invalid/expired OTP and OAuth cancel.
- **Perf:** p95 verify ≤ **800 ms** (excl. email delivery).
- **Telemetry:** `auth_verify_otp`, `auth_oauth_login` (provider: 'google'), `profile_complete`.

### 5.2 Search & Discovery
**Stories**
- Search societies, institutes, and categories; browse by **Categories** and **Institutes**.

**Acceptance**
- Typeahead ≤ **10** suggestions; p95 **150 ms** cached, **500 ms** network.
- Category grid → list → Society profile; verified badges shown where applicable.
- Institute detail lists its societies; empty states handled.

### 5.3 Follow / Unfollow Societies
**Stories**
- Follow/unfollow from Society Profile.

**Acceptance**
- Writes are idempotent; Follow state updates instantly.
- Follow is **public** on profile (MVP), **not searchable**.
- Unfollow removes future items from followed bucket (existing posts remain in global).

### 5.4 Home Feed
**Stories**
- Blended feed of Followed (F) and Global (G).

**Acceptance**
- Interleave **2F:1G** toward **70/30**; preserve order within F and within G.
- If `|F| < 0.7N`, fill deficit from G. If F empty → global + nudge.
- **Post actions:** **Like**, **Comment**, **Share**; Share opens native share sheet (or copy link) with deep link to the post.
- **Pagination:** keyset by `(created_at, id)`; no duplicates across pages.
- **Perf:** p95 first page ≤ **700 ms**; next pages ≤ **600 ms**.

### 5.5 Create Post (Text/Image/Video/Link)
**Stories**
- Owner/Admin/Editor publish posts to their society.

**Acceptance**
- Fields: type, text (optional if media/link present), media or link (optional if text present), visibility (default public).
- Media size/type guards; upload progress; retry guidance.
- Post appears on Society → Posts tab and in Home feed for followers on refresh/realtime.

### 5.6 Notifications (Web Push)
**Stories**
- Followers receive pushes for `post:new`; users receive `roster:invite`.

**Acceptance**
- Quiet hours **22:00–07:00** (user configurable) suppress banners; digest after quiet hours.
- Rate‑limit: ≤ **1 post push/society/hour** per user; coalesce multiples.
- Tapping push opens correct destination (post detail, invite flow).
- **Placement:** **bell in header** on primary tabs opens Notification Settings.

### 5.7 Society Profile & Members
**Stories**
- View tabs (Posts, About, Members) and follow.

**Acceptance**
- **Members tab visibility:** **Public** — everyone can view **member names & avatars/photos**; grid/list with avatars and display names.
- Follow button reflects state and toggles without full reload.

### 5.8 Admin Backoffice (Prototype)
**Stories**
- Staff verify societies, review reports, view user directory, **delete comments** when required.

**Acceptance**
- **Verification:** Approve/Reject updates status and toggles verified badge.
- **Reports:** Resolve or remove content (**including delete comments**); every action writes to **AuditLog**.
- **Users:** Read‑only directory (basic filters optional v1+).

### 5.9 Moderation
**Acceptance**
- **Edit window:** Editor edits ≤ **15 minutes** post‑publish; Owner/Admin removal anytime.
- **App Admin can delete comments** (any society) — must write an **AuditLog** entry (actor, target, reason).
- All destructive/privileged actions write **AuditLog** (actor, target, timestamp, reason).

---

## 6) Base → Our Domain Mapping
| Domain | Base provides | We add/modify |
|---|---|---|
| Auth/session | Cookie‑based Supabase Auth | OTP flow & label, **Google sign‑in**, DPDP consent, profile setup |
| UI | Tailwind + shadcn/ui | Society‑first IA, **header bell**, feed cards, share sheet |
| Data | Postgres + RLS | Institutes, Societies, Follows, Posts, Reports, Verifications, Devices, AuditLog |
| Realtime | Realtime channels | Post list invalidation; optional live counters |
| Storage | Buckets & signed URLs | Media guards and moderation hooks |
| Functions | Edge Functions scaffold | `notify_post_created` fan‑out + rate‑limit + quiet‑hours digest |

---

## 7) Data Model (SQL‑ready)
**Tables**
- `profiles(id, email, name, avatar_url, institute, course, created_at)`
- `institutes(id, name)`
- `societies(id, name, institute_id, category, verified boolean, owner_user_id)`
- `society_followers(user_id, society_id, created_at)` **UNIQUE(user_id, society_id)**
- `posts(id, society_id, author_id, type text CHECK(type IN ('text','image','video','link')), text, media_url, link_url, created_at)`
- `post_likes(user_id, post_id, created_at)`
- `post_comments(id, post_id, author_id, text, created_at)`
- `reports(id, target_type text, target_id uuid, reason text, reporter_id uuid, status text, created_at)`
- `verifications(id, society_id, status text, submitted_at, decided_at, decided_by)`
- `push_devices(id, user_id, fcm_token, platform text, last_seen)`
- `audit_log(id, actor_user_id, action text, target_type text, target_id uuid, meta jsonb, created_at)`

**Indexes**
- `posts (society_id, created_at, id)`; `society_followers (user_id, society_id)`; `reports (status, created_at)`

**RLS (examples)**
- `societies`: read all; write by owner or staff; `verified` update by staff only.
- `posts`: insert by society Owner/Admin/Editor; read all; delete by author or staff.
- `society_followers`: insert/delete by `auth.uid()`; read by owner.
- `audit_log`: insert by server role only.

---

## 8) API (Shape, built on RPC/REST)
- `POST /auth/signup` (email) → 200  
- `POST /auth/verify-otp` → session  
- **`POST /auth/google`** → OAuth start; callback establishes session  
- `GET /search?q=` → suggestions (society|institute|category)  
- `GET /feed?cursor=&limit=` → pre‑blended list **or** `{ F:[], G:[], hint:'2F:1G' }`  
- `POST /follow` `{ society_id }` / `DELETE /follow/{society_id}`  
- `POST /posts` (multipart)  
- `GET /societies/{id}?tab=posts|about|members`  
- `POST /reports` `{ target_type, target_id, reason }`  
- Admin:  
  - `GET /verifications?status=pending` / `POST /verifications/{id}:approve|reject`  
  - `POST /moderation/remove` `{ target_type, target_id, reason }`  
  - **`DELETE /comments/{id}`** (admin only)  
- Devices:  
  - `POST /devices` `{ push_token, platform }`  
  - `POST /notifications/test` (dev only)

**Contracts**: Writes return canonical JSON; pagination via `next_cursor`; errors include `code`, `message`, validation field paths.

---

## 9) Notifications Design (Web Push)
**Flow**
1. Post created → DB trigger calls Edge Function `notify_post_created` with `post_id`.  
2. Function collects followers’ device tokens, filters **quiet hours**, coalesces per user (≤ 1 per society/hour).  
3. Sends **FCM** push **IDs only**; app fetches content on open; write delivery/audit rows.

**Quiet hours:** default **22:00–07:00**; user configurable; server queues digest.

---

## 10) Accessibility (WCAG 2.2 AA)
Contrast ≥ 4.5:1; visible focus; keyboard‑only navigation; SR labels; ARIA live for OTP errors/upload progress; respect `prefers‑reduced‑motion`; tap targets ≥ 44×44 px.

---

## 11) Localization & Timezones
Externalized strings; store UTC; display locale time; persist timezone for pushes; Indian English first.

---

## 12) Error / Empty / Offline
Global error; offline banner + queue safe actions; skeletons; empty states for Search/Feed/Society with actionable nudges.

---

## 13) Privacy, Security & Threats
RBAC server‑side; OTP/follow/post/report throttles; input validation + sanitization; signed media URLs; CSRF/XSS mitigations; **Membership visibility public** noted in privacy copy; immutable **AuditLog**.

---

## 14) Observability & Telemetry
**Events**: `auth_verify_otp`, **`auth_oauth_login` (provider:'google')**, `profile_complete`, `search_suggest_view`, `search_result_click`, `follow_add`, `follow_remove`, `feed_impression`, `feed_next_page`, `post_publish`, `post_like`, `post_comment`, **`share_clicked`, `share_completed`**, `notification_sent`, `notification_received`, `notification_opened`, `report_created`, `moderation_action`, `verification_decision`.  
Payload: `{ ts, user_id, institute_id?, society_id?, post_id?, device, app_version, latency_ms? }`.

---

## 15) Non‑Functional Requirements
Perf: p95 Search ≤ 500 ms; Feed first page ≤ 700 ms; fresh session payload < 1.5 MB.  
Availability 99.5%; Capacity 5k DAU; Rate limits: Post ≤ 10/min/society; Report ≤ 5/min/user.  
Privacy: push payloads carry **IDs only**.

---

## 16) Release Criteria (Go/No‑Go)
- All acceptance tests in §19 pass.  
- p95 perf targets in §15 met in staging and prod canary.  
- A11y audit (WCAG 2.2 AA): no Blockers, ≤ 3 Minors with fixes scheduled.  
- <1% error rate over 24h soak; no Sev1/Sev2 incidents during soak.  
- ≥80% push deliverability to seed cohort; quiet‑hours digest verified end‑to‑end.  
- Account deletion & data export functional; privacy copy reviewed and versioned.  
- Backups enabled; DR runbook validated.

---

## 17) Rollout Plan
- **Phase 0 (Internal Alpha):** Seed 3 institutes/10 societies/50 posts; validate follow, blend, notifications.  
- **Phase 1 (Closed Beta):** +10 institutes; enforce verification workflow; instrument analytics.  
- **Phase 2 (Open Beta):** Invite codes; monitor scale/safety; iterate moderation.

---

## 18) Implementation Plan (Base‑Aware)
### Week 1 — Project Bootstrap
- Create repo from base; set up env; run locally.
- Add shadcn/ui components or Supabase UI blocks as needed.
- Apply SQL schema; enable RLS on new tables; seed Institutes/Societies.
- Port routes: Home, Categories, Institutes, Society Profile, Create Post, Search, Notifications, Profile.

### Week 2 — Core Features
- Follow/Unfollow mutations + UI; implement **reorder** and **2F:1G** blend (client interleave or server pre‑blend).  
- Society verification (Admin), Reports queue, AuditLog writes.  
- Media uploads with size/type guards; signed URL display.

### Week 3 — Notifications & Polish
- Service worker + FCM; Devices table with tokens; `notify_post_created` fan‑out + rate limit + quiet‑hours digest.  
- QA acceptance run; dashboards; seed test data.

---

## 19) CI/CD & DevOps
- **Branching:** trunk‑based with short‑lived feature branches.  
- **CI:** type‑check, lint, unit tests, build.  
- **Preview deploys:** per PR with seed script.  
- **Env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `FCM_VAPID_KEY`, service worker origin.  
- **Backups:** daily (30‑day retention). **DR:** RPO ≤ 24h, RTO ≤ 4h.

---

## 20) QA / Acceptance (High‑Level)
Auth (OTP+Google), Search (debounce), Follow (idempotent, public), Feed (2F:1G; empty F → nudge; **Like/Comment/Share**), Create Post (validations, media guards), Notifications (quiet‑hours suppression, digest, rate‑limit, deep‑link; **bell opens settings**), Admin (verify toggles badge; reports log; **delete comments** works), Moderation (15‑min edit lock; Owner/Admin override; AuditLog entries), Members (**public names & avatars**), A11y (keyboard‑only), Offline (queued post retry).

---

## 21) Risks & Mitigations
- **Abuse/Spam:** throttles; reports; admin removal; basic keyword filter (v1+).  
- **Push fatigue:** rate‑limit + digests; per‑society mute (v1+).  
- **Media costs:** size/type limits; client‑side compression.  
- **Engagement risk:** adjust blend ratio; surface Suggested follows (v1+).

---

## 22) Data Retention, Backups & DR
- **Retention:** Posts/Comments until deleted; Reports & AuditLog **365 days**; push device tokens **90 days** since `last_seen`.  
- **Backups:** Daily full backups; **30‑day retention**.  
- **DR Targets:** **RPO ≤ 24h; RTO ≤ 4h**; validate restore quarterly with runbook.
- **Export/Delete:** Provide user data export and account deletion flows (see §16).

---

## 23) Support & Incident Response
- **Sev1 (outage):** Response ≤ 30m; comms on status page; hotfix ASAP; postmortem in 3 business days.  
- **Sev2 (degradation):** Response ≤ 2h; comms; mitigation in 1 business day.  
- **On‑call:** Single rotation in MVP; Slack/Email escalation; runbooks for push failures and auth issues.

---

## 24) Content Policy & Legal
Prohibited content: harassment, hate, sexual content involving minors, illegal goods/services, doxxing.  
Reports triage (biz hours, MVP) with escalation path; DPDP consent and versioned privacy copy at signup.


## 22) Base Open‑Source Starter (for build)
**Primary (Chosen):** **SupaNext Starter Kit** — Next.js 14 **App Router**, **Supabase** with **`@supabase/ssr`**, **Tailwind**, **shadcn/ui**, tests (Jest/RTL), MSW, CI; **MIT**.  
**Repo:** https://github.com/michaeltroya/supa-next-starter  
**Scaffold:**
```bash
pnpm create next-app -e https://github.com/michaeltroya/supa-next-starter
# or
npx create-next-app -e https://github.com/michaeltroya/supa-next-starter
```

**Alternate:** Vercel **Supabase Starter** — Next.js **App Router** template with cookie-based Supabase auth, **Tailwind**, and **shadcn/ui**; official template; **MIT**.  
**Template page:** https://vercel.com/templates/authentication/supabase  
**Scaffold:**
```bash
npx create-next-app --example with-supabase with-supabase-app
# or yarn/pnpm equivalents
```

**Why this choice:** Closest stack match to our PRD (App Router + shadcn/ui + SSR via `@supabase/ssr` + testing & CI baked-in), making it the easiest to build upon while keeping quality gates in place.

