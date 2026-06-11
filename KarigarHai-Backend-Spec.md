# KarigarHai — Complete Backend Specification

**Version:** 1.0  
**Source of truth:** Frontend (TanStack Start app) — 70+ screens across Public, Worker, Employer, and Admin surfaces.  
**Stack recommendation:** Lovable Cloud (Postgres + Auth + Storage + Edge/Server Functions) with TanStack Start `createServerFn` + server routes under `src/routes/api/public/*` for webhooks.

---

## 1. Module Breakdown

| # | Module | Purpose | Primary Actors |
|---|--------|---------|----------------|
| 1 | **Auth & Identity** | Signup, login, OTP, password reset, sessions, MFA | All |
| 2 | **Onboarding** | Language, role selection, welcome flow | Guest |
| 3 | **User Profiles** | Worker & Employer profiles, edit, avatar | Worker, Employer |
| 4 | **KYC & Verification** | Doc upload, verification queue, status | Worker, Admin |
| 5 | **Skills & Availability** | Worker skills catalog, availability toggle | Worker |
| 6 | **Jobs** | CRUD, posting wizard, search, filters, saved | Employer, Worker |
| 7 | **Applications** | Apply, shortlist, hire, reject | Worker, Employer |
| 8 | **Active Job / Tracking** | Live job, location, navigation, arrival, completion | Worker, Employer |
| 9 | **Chat & Messaging** | 1:1 chat, attachments, audio, read receipts | Worker, Employer |
| 10 | **Reviews & Ratings** | Rate worker / employer post-job | Both |
| 11 | **Payments & Wallet** | Wallet balance, transactions, withdraw, invoices | Worker, Employer, Admin |
| 12 | **Notifications** | In-app, push, email, SMS + preferences | All |
| 13 | **Saved / Favourites** | Saved jobs (worker), favourited workers (employer) | Worker, Employer |
| 14 | **Admin Console** | Users, jobs, KYC queue, disputes, revenue, cities, broadcast | Admin |
| 15 | **Disputes** | Raise, track, resolve | All |
| 16 | **Reports & Analytics** | Employer reports, admin overview | Employer, Admin |
| 17 | **Cities / Geo** | Service cities, location picker, geocoding | All |
| 18 | **Broadcast / Announcements** | Admin → users mass message | Admin |
| 19 | **Settings & Preferences** | Language, notifications, privacy | All |
| 20 | **Help & Support** | FAQ, tickets | Worker, Employer |
| 21 | **Activity & Audit Logs** | User activity, admin audit | System |
| 22 | **Files & Media** | Avatars, KYC docs, chat attachments, job images | All |

---

## 2. Page-Wise Feature Analysis

### 2.1 Public / Auth
| Route | Features | APIs needed |
|---|---|---|
| `/` (index) | Splash / brand | — |
| `/language` | Pick app language | `PATCH /me/preferences` |
| `/onboarding` | 3-slide intro | — |
| `/welcome` | Entry CTAs | — |
| `/role` | Worker vs Employer | `PATCH /me/role` |
| `/signup` | Phone + name + role | `POST /auth/signup` |
| `/login` | Phone/email + password | `POST /auth/login` |
| `/otp` | OTP verify | `POST /auth/otp/send`, `POST /auth/otp/verify` |
| `/forgot` | Reset link | `POST /auth/password/forgot` |
| `/verification.pending` | Poll status | `GET /me/verification` |
| `/verification.success` | Confirmation | — |
| `/maintenance`, `/offline` | Static | `GET /system/status` |

### 2.2 Worker
| Route | Features | APIs |
|---|---|---|
| `/worker` (home) | Greeting, nearby jobs, categories, stats | `GET /worker/dashboard`, `GET /jobs/nearby` |
| `/worker/search` | Search + filter chips (category, distance, pay, rating) | `GET /jobs?q&category&...` |
| `/worker/jobs/$jobId` | Job details | `GET /jobs/:id` |
| `/worker/apply` | Apply form (rate, message) | `POST /applications` |
| `/worker/applications` | List + status tabs | `GET /applications?status` |
| `/worker/applications/$id` | Detail + timeline | `GET /applications/:id` |
| `/worker/active` | Live job, directions, status update | `GET /jobs/active`, `PATCH /jobs/:id/status` |
| `/worker/completion` | Mark done + photos | `POST /jobs/:id/complete` |
| `/worker/chat` & `/worker/chat/$id` | Threads, messages | `GET /chats`, `GET /chats/:id/messages`, `POST /chats/:id/messages`, `WS /realtime` |
| `/worker/saved` | Saved jobs | `GET /saved`, `POST /saved`, `DELETE /saved/:id` |
| `/worker/profile` + `/edit` | Profile view & edit | `GET /me`, `PATCH /me` |
| `/worker/skills` | Manage skills | `GET/PUT /me/skills` |
| `/worker/availability` | Toggle availability + schedule | `PATCH /me/availability` |
| `/worker/earnings` | Wallet, transactions, charts | `GET /wallet`, `GET /wallet/transactions` |
| `/worker/withdraw` | Withdraw flow | `POST /wallet/withdraw` |
| `/worker/kyc` + `/kyc/docs` | Upload docs, status | `POST /kyc/documents`, `GET /kyc/status` |
| `/worker/notifications` + `/settings` | List + prefs | `GET /notifications`, `PATCH /me/notification-preferences` |
| `/worker/activity` | Activity log | `GET /me/activity` |
| `/worker/help` | Help center | `GET /help/articles`, `POST /support/tickets` |
| `/worker/settings` | App settings, logout, delete account | `PATCH /me`, `DELETE /me`, `POST /auth/logout` |

### 2.3 Employer
| Route | Features | APIs |
|---|---|---|
| `/employer` | KPIs, active jobs, applicants summary | `GET /employer/dashboard` |
| `/employer/post` | Multi-step Post-a-Job wizard | `POST /jobs`, `POST /jobs/:id/publish` |
| `/employer/jobs` | List with filters & status | `GET /jobs?owner=me` |
| `/employer/jobs/$jobId` | Job detail + manage | `GET/PATCH/DELETE /jobs/:id` |
| `/employer/jobs/$jobId/applicants` | Applicant list, shortlist, hire | `GET /jobs/:id/applications`, `PATCH /applications/:id` |
| `/employer/workers/$id` | Worker profile | `GET /workers/:id` |
| `/employer/favourites` | Saved workers + search | `GET/POST/DELETE /favourites` |
| `/employer/hire` | Direct hire flow | `POST /jobs/:id/hire` |
| `/employer/tracking` | Track worker location | `GET /jobs/:id/tracking` (WS) |
| `/employer/chat` | Chat threads | same as worker chat |
| `/employer/payment` | Payment methods, totals | `GET/POST /payment-methods`, `POST /payments` |
| `/employer/invoices` | Invoice list, download | `GET /invoices`, `GET /invoices/:id/pdf` |
| `/employer/rate` | Rate worker | `POST /reviews` |
| `/employer/reports` | Spend, hires, charts | `GET /employer/reports?range` |
| `/employer/profile` | Company profile | `GET/PATCH /me` |
| `/employer/settings` | Settings | `PATCH /me` |

### 2.4 Location
| Route | Features | APIs |
|---|---|---|
| `/location/permission` | Ask GPS | client-only |
| `/location/picker` | Map pin + search | `GET /geo/search?q`, `GET /geo/reverse?lat&lng` |
| `/location/tracking` | Live broadcast | `POST /location/ping` (throttled) |
| `/location/navigation` | Directions | `GET /geo/route?from&to` |
| `/location/arrival` | Arrival confirmation | `POST /jobs/:id/arrived` |

### 2.5 Admin
| Route | Features | APIs |
|---|---|---|
| `/admin/login` | Admin auth | `POST /auth/admin/login` |
| `/admin` | Platform KPIs | `GET /admin/overview` |
| `/admin/users` | List, search, suspend | `GET/PATCH /admin/users` |
| `/admin/jobs` | All jobs + moderation | `GET/PATCH /admin/jobs` |
| `/admin/kyc` | KYC queue approve/reject | `GET/PATCH /admin/kyc` |
| `/admin/disputes` | Dispute mgmt | `GET/PATCH /admin/disputes` |
| `/admin/revenue` | Revenue charts | `GET /admin/revenue` |
| `/admin/cities` | CRUD service cities | `CRUD /admin/cities` |
| `/admin/broadcast` | Send announcements | `POST /admin/broadcasts` |
| `/admin/settings` | Platform config, feature flags | `GET/PATCH /admin/settings` |

---

## 3. User Journeys

1. **Worker onboarding:** Language → Onboarding → Role(worker) → Signup → OTP → KYC docs → Skills → Availability → Home.
2. **Worker apply→hire→complete:** Search → Job detail → Apply → (chat) → Hired → Active job → Navigate → Arrival → Complete → Rated → Wallet credit → Withdraw.
3. **Employer post→hire:** Login → Post Job (wizard) → Publish → Receive applicants → Shortlist → Chat → Hire → Track → Mark complete → Pay → Rate → Invoice.
4. **Admin moderation:** Login → KYC queue → Approve/reject → Disputes → Resolve → Broadcast.
5. **Password reset:** Forgot → Email/SMS link → Reset password → Login.

---

## 4. API Catalogue

### 4.1 Conventions
- Base: `/api/v1`
- Auth: `Authorization: Bearer <jwt>`
- JSON, ISO-8601 timestamps, snake_case fields, cursor pagination `?cursor=&limit=` (default 20, max 100), sorting `?sort=field,-other`, filtering `?filter[status]=...`.
- Standard envelope: `{ data, meta: { pagination }, error: null }`.

### 4.2 Auth
```
POST   /auth/signup           { phone, name, role, password? }
POST   /auth/login            { identifier, password }
POST   /auth/logout
POST   /auth/refresh          { refresh_token }
POST   /auth/otp/send         { phone, purpose }
POST   /auth/otp/verify       { phone, code, purpose }
POST   /auth/password/forgot  { identifier }
POST   /auth/password/reset   { token, new_password }
POST   /auth/mfa/enroll
POST   /auth/mfa/verify       { code }
GET    /auth/sessions
DELETE /auth/sessions/:id
POST   /auth/admin/login
```

### 4.3 Profile / Me
```
GET    /me
PATCH  /me                       (name, bio, avatar, language, city)
DELETE /me
PATCH  /me/role
PATCH  /me/preferences
PATCH  /me/notification-preferences
PATCH  /me/availability          (worker)
GET    /me/skills  PUT /me/skills
GET    /me/verification
GET    /me/activity
```

### 4.4 Jobs
```
GET    /jobs                    ?q,category,city,lat,lng,radius,min_pay,max_pay,rating,status,sort,cursor
POST   /jobs                    (employer)
GET    /jobs/:id
PATCH  /jobs/:id
DELETE /jobs/:id
POST   /jobs/:id/publish
POST   /jobs/:id/close
GET    /jobs/nearby             ?lat,lng,radius
GET    /jobs/active             (current user)
PATCH  /jobs/:id/status         { status }   enum below
POST   /jobs/:id/arrived
POST   /jobs/:id/complete       { photos[], notes }
GET    /jobs/:id/tracking       (SSE/WS)
POST   /jobs/:id/hire           { worker_id }   (direct hire)
```

### 4.5 Applications
```
GET    /applications            ?role=worker|employer&status&job_id
POST   /applications            { job_id, rate, message }
GET    /applications/:id
PATCH  /applications/:id        { status }  shortlisted|hired|rejected|withdrawn
DELETE /applications/:id
GET    /jobs/:id/applications   (employer)
```

### 4.6 Saved / Favourites
```
GET    /saved              POST /saved {job_id}   DELETE /saved/:job_id
GET    /favourites         POST /favourites {worker_id}   DELETE /favourites/:worker_id
```

### 4.7 Chat
```
GET    /chats                            ?cursor
POST   /chats                            { participant_id, job_id? }
GET    /chats/:id
GET    /chats/:id/messages               ?before&limit
POST   /chats/:id/messages               { type:text|image|audio|file, body, attachment_id? }
PATCH  /chats/:id/read
WS     /realtime/chats/:id               typing, messages, read receipts
POST   /uploads/chat-attachment          multipart
```

### 4.8 Reviews
```
GET    /users/:id/reviews
POST   /reviews                  { job_id, ratee_id, rating, comment, photos[] }
PATCH  /reviews/:id              (within edit window)
```

### 4.9 Payments / Wallet
```
GET    /wallet
GET    /wallet/transactions      ?type,from,to,cursor
POST   /wallet/withdraw          { amount, method, account_id }
GET    /payment-methods
POST   /payment-methods
DELETE /payment-methods/:id
POST   /payments                 { job_id, amount, method_id }
GET    /payments/:id
GET    /invoices                 ?from,to,status
GET    /invoices/:id
GET    /invoices/:id/pdf
POST   /api/public/webhooks/payments   (Razorpay/Stripe webhook — signed)
```

### 4.10 KYC
```
POST   /kyc/documents           multipart { type, file }   types: aadhaar, pan, selfie, address
GET    /kyc/status
POST   /kyc/submit
```

### 4.11 Notifications
```
GET    /notifications            ?unread_only
PATCH  /notifications/:id/read
PATCH  /notifications/read-all
POST   /devices                  { fcm_token, platform }
DELETE /devices/:id
```

### 4.12 Geo / Cities / Search
```
GET    /geo/search?q
GET    /geo/reverse?lat&lng
GET    /geo/route?from_lat&from_lng&to_lat&to_lng
POST   /location/ping            { lat, lng, accuracy }
GET    /cities
GET    /categories
GET    /skills/catalog
```

### 4.13 Disputes / Support
```
POST   /disputes                 { job_id, reason, description, evidence[] }
GET    /disputes                 ?role
GET    /disputes/:id
PATCH  /disputes/:id             (admin)
POST   /support/tickets
GET    /help/articles            ?q,category
```

### 4.14 Admin
```
GET    /admin/overview
GET    /admin/users   PATCH /admin/users/:id   POST /admin/users/:id/suspend
GET    /admin/jobs    PATCH /admin/jobs/:id    DELETE /admin/jobs/:id
GET    /admin/kyc     PATCH /admin/kyc/:id     { status, reason }
GET    /admin/disputes PATCH /admin/disputes/:id
GET    /admin/revenue ?range
CRUD   /admin/cities
POST   /admin/broadcasts          { audience, channels[], title, body, schedule_at? }
GET    /admin/settings   PATCH /admin/settings
GET    /admin/audit-logs
POST   /admin/exports             { entity, filters, format:csv|xlsx }
```

### 4.15 Files
```
POST   /uploads                  multipart { purpose }   returns { id, url, expires_at }
GET    /files/:id                (signed)
DELETE /files/:id
```

---

## 5. Request / Response Schemas (selected)

### Signup
**Request**
```json
{ "phone":"+919876543210","name":"Ravi","role":"worker","password":"Str0ng!Pass","language":"hi" }
```
**Response 201**
```json
{ "data":{ "user_id":"u_123","access_token":"...","refresh_token":"...","mfa_required":false } }
```

### Job (create)
```json
{
  "title":"Plumber needed for kitchen sink",
  "category_id":"cat_plumbing",
  "description":"...",
  "budget":{ "type":"fixed","amount":1500,"currency":"INR" },
  "location":{ "address":"...","lat":19.07,"lng":72.87,"city_id":"city_mum" },
  "schedule":{ "start_at":"2026-06-07T09:00:00Z","duration_minutes":120 },
  "requirements":{ "experience_years":2,"tools_required":true },
  "photos":["file_abc"]
}
```

### Application status
`pending | shortlisted | hired | rejected | withdrawn | completed`

### Job status
`draft | published | open | assigned | in_progress | arrived | completed | cancelled | disputed | closed`

### Error envelope
```json
{ "error":{ "code":"VALIDATION_ERROR","message":"...","details":[{"field":"phone","rule":"e164"}] } }
```
Standard codes: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `VALIDATION_ERROR`, `PAYMENT_REQUIRED`, `INTERNAL`.

---

## 6. Validation Rules (Zod-style)

- **phone:** E.164, India default `+91`, unique.
- **password:** ≥8 chars, mixed case, digit, symbol; HIBP check on.
- **OTP:** 6 digits, 5 min TTL, max 5 attempts.
- **name:** 2–60 chars, letters/spaces.
- **rating:** integer 1–5.
- **amount:** positive, ≤ 1,000,000; 2 decimals.
- **lat/lng:** −90..90 / −180..180.
- **uploads:** ≤10MB; image/jpeg|png|webp, audio/m4a|mpeg, application/pdf.
- **chat message:** ≤4000 chars; rate-limited 30/min.
- **job title:** 5–80; description 20–4000.
- **withdraw:** amount ≤ wallet.available; min ₹100.

---

## 7. Authentication

- **Provider:** Lovable Cloud (Supabase) Auth.
- **Methods:** Phone+OTP (primary), Email+Password, Google OAuth, Apple OAuth (optional), Admin email+password.
- **Tokens:** Access JWT 15 min, Refresh 30 days, rotating; httpOnly cookie for web, secure storage for mobile.
- **MFA:** TOTP or SMS OTP step-up for admins and withdrawals >₹10k.
- **Sessions:** Tracked in `auth.sessions`; list/revoke endpoints.
- **Password reset:** Token email/SMS, single-use, 15-min TTL, redirect to `/reset-password`.
- **Rate limiting:** 5 login/min/IP, 3 OTP/min/phone, exponential backoff.

---

## 8. Authorization (RBAC)

Roles: `guest`, `worker`, `employer`, `admin`, `super_admin`, `support`.

Stored in `public.user_roles` (never on `profiles`) with `has_role()` SECURITY DEFINER function. Permissions checked in RLS + server function middleware.

### Role × Permission Matrix (excerpt)
| Resource | worker | employer | admin |
|---|---|---|---|
| jobs.read | own region | own | all |
| jobs.create | — | ✓ | ✓ |
| jobs.update | status only | own | all |
| applications.create | ✓ | — | — |
| applications.update.status | withdraw | shortlist/hire/reject | all |
| kyc.review | — | — | ✓ |
| wallet.withdraw | own | own | — |
| broadcast.send | — | — | ✓ |
| users.suspend | — | — | ✓ |
| disputes.resolve | — | — | ✓ |

---

## 9. Database Schema (Postgres)

All tables in `public`. Every table: `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz`, `deleted_at timestamptz` where soft-delete applies. RLS enabled + explicit GRANTs.

### 9.1 Enums
```sql
create type app_role as enum ('worker','employer','admin','super_admin','support');
create type job_status as enum ('draft','published','open','assigned','in_progress','arrived','completed','cancelled','disputed','closed');
create type application_status as enum ('pending','shortlisted','hired','rejected','withdrawn','completed');
create type kyc_status as enum ('not_started','submitted','in_review','approved','rejected');
create type tx_type as enum ('credit','debit','withdrawal','refund','fee','bonus');
create type tx_status as enum ('pending','succeeded','failed','reversed');
create type notif_channel as enum ('inapp','push','email','sms');
create type dispute_status as enum ('open','investigating','resolved','rejected');
```

### 9.2 Core tables
```sql
-- profiles (1:1 with auth.users)
profiles(id uuid pk references auth.users on delete cascade,
  full_name text, phone text unique, email text unique,
  avatar_url text, language text default 'en',
  city_id uuid references cities, default_role app_role,
  bio text, gender text, dob date,
  rating_avg numeric(3,2) default 0, rating_count int default 0,
  is_verified bool default false, is_active bool default true,
  last_seen_at timestamptz)

user_roles(id uuid pk, user_id uuid references auth.users, role app_role, unique(user_id,role))

-- worker-specific
worker_profiles(user_id pk references profiles, headline text,
  experience_years int, hourly_rate numeric(10,2),
  is_available bool default false, availability_schedule jsonb,
  service_radius_km int default 10, completed_jobs int default 0)

worker_skills(user_id, skill_id, level int 1..5, primary key(user_id,skill_id))

-- employer-specific
employer_profiles(user_id pk references profiles, company_name text,
  gstin text, billing_address jsonb, jobs_posted int default 0)

-- catalogs
skills(id, name, slug unique, category_id)
categories(id, name, slug unique, icon, parent_id)
cities(id, name, state, country, lat, lng, is_active bool)

-- jobs
jobs(id, employer_id references profiles, title, description,
  category_id, city_id, address text, lat numeric, lng numeric,
  budget_type text, budget_amount numeric(10,2), currency text default 'INR',
  start_at timestamptz, duration_minutes int,
  requirements jsonb, photos uuid[],
  status job_status default 'draft',
  assigned_worker_id uuid references profiles,
  published_at timestamptz, completed_at timestamptz,
  view_count int default 0)
-- indexes: (status), (city_id,status), (employer_id), gist(ll_to_earth(lat,lng))

applications(id, job_id references jobs, worker_id references profiles,
  rate numeric(10,2), message text,
  status application_status default 'pending',
  shortlisted_at, hired_at, withdrawn_at,
  unique(job_id,worker_id))

saved_jobs(user_id, job_id, created_at, pk(user_id,job_id))
favourite_workers(employer_id, worker_id, pk(employer_id,worker_id))

-- chat
chats(id, job_id nullable, created_by, last_message_at)
chat_participants(chat_id, user_id, joined_at, last_read_at, pk(chat_id,user_id))
messages(id, chat_id, sender_id, type text, body text, attachment_id uuid,
  reply_to uuid, created_at, read_by jsonb)
-- index: (chat_id, created_at desc)

-- reviews
reviews(id, job_id, rater_id, ratee_id, rating int, comment, photos uuid[],
  unique(job_id, rater_id))

-- wallet & payments
wallets(user_id pk, balance numeric(12,2) default 0,
  pending numeric(12,2) default 0, currency text default 'INR')
transactions(id, wallet_id, type tx_type, status tx_status,
  amount numeric(12,2), reference text, job_id, metadata jsonb)
payment_methods(id, user_id, provider, last4, brand, is_default, token)
payments(id, payer_id, payee_id, job_id, amount, fee, net,
  provider, provider_ref, status tx_status)
invoices(id, employer_id, job_id, number text unique, total, tax,
  pdf_file_id, issued_at, due_at, status)
withdrawals(id, user_id, amount, method, account_ref, status tx_status, processed_at)

-- kyc & files
kyc_documents(id, user_id, type text, file_id, status kyc_status,
  reviewer_id, reviewed_at, rejection_reason)
files(id, owner_id, bucket, path, mime, size_bytes, purpose, is_public)

-- notifications
notifications(id, user_id, type, title, body, data jsonb,
  channel notif_channel, read_at, sent_at)
notification_preferences(user_id pk, email bool, sms bool, push bool, inapp bool,
  categories jsonb)
devices(id, user_id, platform text, fcm_token unique, last_seen)

-- location
location_pings(user_id, job_id, lat, lng, accuracy, recorded_at)
-- partition by day; index (job_id, recorded_at desc)

-- disputes & support
disputes(id, job_id, raised_by, against_id, reason, description,
  evidence uuid[], status dispute_status, resolution text,
  resolved_by, resolved_at)
support_tickets(id, user_id, subject, body, status, priority, assignee_id)
help_articles(id, slug unique, title, body, category, published bool)

-- admin & system
broadcasts(id, audience jsonb, channels notif_channel[], title, body,
  schedule_at, sent_at, created_by)
audit_logs(id, actor_id, action, entity, entity_id, before jsonb, after jsonb,
  ip inet, user_agent, created_at)
activity_logs(id, user_id, type, metadata jsonb, created_at)
security_logs(id, user_id, event, ip, user_agent, success bool, created_at)
feature_flags(key pk, value jsonb, updated_by, updated_at)
app_settings(key pk, value jsonb)
```

### 9.3 Indexes (additional)
- `jobs (status, city_id, start_at)`; geospatial GiST on `(lat,lng)`.
- `applications (worker_id, status)`, `(job_id, status)`.
- `messages (chat_id, created_at desc)`.
- `transactions (wallet_id, created_at desc)`.
- `notifications (user_id, read_at, created_at desc)`.

### 9.4 Constraints
- `applications.unique(job_id,worker_id)`.
- `reviews.unique(job_id, rater_id)` + rating between 1 and 5.
- `wallets.balance >= 0` check.
- Foreign keys ON DELETE: profiles cascade where ownership-bound, RESTRICT for financial rows.

### 9.5 Grants (template)
```sql
grant select, insert, update, delete on public.<table> to authenticated;
grant all on public.<table> to service_role;
```

### 9.6 RLS (examples)
- `jobs`: select if `status='published'` or `employer_id=auth.uid()` or `has_role(auth.uid(),'admin')`.
- `applications`: select if `worker_id=auth.uid()` or `job.employer_id=auth.uid()` or admin.
- `wallets/transactions`: only owner or admin.
- `messages`: only participants.

---

## 10. Notifications

| Event | inapp | push | email | sms |
|---|:-:|:-:|:-:|:-:|
| OTP | – | – | – | ✓ |
| Job published nearby (matched) | ✓ | ✓ | – | – |
| New application (employer) | ✓ | ✓ | ✓ | – |
| Shortlisted / Hired | ✓ | ✓ | ✓ | ✓ |
| Worker en route / arrived | ✓ | ✓ | – | ✓ |
| Job completed / payment received | ✓ | ✓ | ✓ | – |
| KYC approved/rejected | ✓ | ✓ | ✓ | – |
| Dispute updates | ✓ | ✓ | ✓ | – |
| Broadcast | ✓ | ✓ | ✓ | – |

Delivery via **pgmq queue** + cron-driven `/api/public/email/queue/process`; push via FCM; SMS via provider (MSG91/Twilio). User preferences honoured.

---

## 11. File / Document Management

- Storage: Lovable Cloud storage buckets — `avatars` (public), `kyc` (private), `chat` (private), `jobs` (public), `invoices` (private).
- All uploads via `POST /uploads`; antivirus + MIME sniff; image resize on upload (thumb/medium/full).
- Signed URLs (15 min) for private buckets.

---

## 12. Logging

- **activity_logs:** user-visible (login, profile edit, applied, hired, completed).
- **audit_logs:** admin/system mutations (KYC decision, suspension, dispute resolution, settings change).
- **security_logs:** auth events, MFA changes, password resets, IP/UA anomalies.
- Retention: activity 180d, audit 7y, security 1y.

---

## 13. Dashboards & Analytics APIs

```
GET /worker/dashboard      -> earnings_today, jobs_today, rating, pending_apps
GET /employer/dashboard    -> active_jobs, applicants, spend_mtd, ratings
GET /admin/overview        -> users, jobs, gmv, take_rate, kyc_backlog
GET /admin/revenue?range   -> series:[{date,gmv,fees,withdrawals}]
GET /employer/reports?range
```
All return precomputed aggregates from materialized views refreshed every 5–15 min.

---

## 14. Background Jobs / Schedulers

| Job | Cadence | Purpose |
|---|---|---|
| Email/SMS/Push queue processor | every 5s | drain `pgmq` queues |
| Job auto-expire | hourly | mark stale `published` jobs `closed` after 7d |
| Application auto-withdraw | daily | if job closed without action |
| Wallet payout batch | daily 02:00 | process pending withdrawals |
| Rating aggregates refresh | every 15 min | update `rating_avg`/`count` |
| Location ping cleanup | daily | drop pings >30d |
| KYC re-verification reminders | weekly | nudge pending users |
| Materialized view refresh | every 10 min | dashboards |
| Audit log archival | monthly | cold storage |

Event-driven (DB triggers/edge functions): on `applications.status='hired'` → close other apps, create chat, send notifications. On `jobs.status='completed'` → release escrow, generate invoice, request review.

---

## 15. Third-Party Integrations

- **Payments:** Razorpay (primary IN), Stripe (intl). Webhooks at `/api/public/webhooks/payments` (signature verified).
- **SMS/OTP:** MSG91 / Twilio.
- **Push:** Firebase Cloud Messaging.
- **Email:** Lovable Emails (default).
- **Maps & Geocoding:** Google Maps / Mapbox (route, search, reverse-geocode).
- **KYC:** Digio / Karza for Aadhaar+PAN verification.
- **Storage:** Lovable Cloud storage (S3-compatible).
- **Analytics:** PostHog (optional).
- **Error monitoring:** Sentry.

---

## 16. Business Rules & Workflows

- **Hire:** only one `hired` application per job; auto-rejects others. Creates escrow `payments(status=pending)`.
- **Escrow release:** on `complete` + employer confirmation OR 48h auto-release; minus platform fee (config `fee_percent`, default 10%).
- **Cancellation:** worker cancel before arrival → no penalty (≤2/30d); employer cancel after hire → fee.
- **Dispute window:** 72h post-complete; freezes payout until resolved.
- **KYC gating:** workers cannot apply / withdraw without `approved` KYC.
- **Rating window:** 7 days post-complete; one review per party per job.
- **Withdrawal:** ≥₹100, ≤ wallet.available, MFA if >₹10,000.
- **Approval workflows:** KYC, dispute resolution, broadcast scheduling, city activation.

---

## 17. Backend Folder Structure (TanStack Start)

```
src/
  lib/
    auth/            *.functions.ts, *.server.ts
    jobs/
    applications/
    chat/
    payments/
    kyc/
    notifications/
    geo/
    admin/
    common/          (zod schemas, errors, pagination, rbac)
  integrations/
    supabase/        client.ts, client.server.ts, auth-middleware.ts
    razorpay/        client.server.ts
    fcm/             client.server.ts
    msg91/           client.server.ts
    maps/            client.server.ts
  routes/
    api/
      public/
        webhooks/payments.ts
        email/queue/process.ts
        cron/*.ts
      ...
  workers/           (queue consumers, cron handlers)
supabase/
  migrations/        timestamped SQL
```

Architecture: feature-sliced; server functions for app calls, server routes only for webhooks/cron; thin handlers → service layer → repository (Supabase client) → DB.

---

## 18. API Dependency Map (excerpt)

- `POST /applications` → reads `jobs`, writes `applications`, emits notification, updates `worker_profiles.completed_jobs` (later), audit.
- `PATCH /applications/:id status=hired` → updates `jobs.status=assigned`, rejects siblings, creates `chats`, creates pending `payments`, emits notifications.
- `POST /jobs/:id/complete` → updates `jobs`, releases `payments` after window, credits `wallets`, creates `invoices`, opens review window, audit log.
- `POST /wallet/withdraw` → checks KYC + balance + MFA, creates `withdrawals(pending)`, enqueues payout job.

---

## 19. Entity Relationship Map (summary)

- `auth.users 1—1 profiles 1—1 (worker_profiles | employer_profiles)`
- `profiles 1—* user_roles`
- `profiles 1—* jobs (employer)`; `profiles 1—* applications (worker)`
- `jobs 1—* applications`; `jobs 0..1—1 chat`; `jobs 1—* reviews (≤2)`
- `chats 1—* messages`; `chats *—* profiles via chat_participants`
- `profiles 1—1 wallets 1—* transactions`
- `profiles 1—* kyc_documents`, `1—* notifications`, `1—* devices`, `1—* activity_logs`
- `jobs 1—* location_pings`, `1—* disputes`, `1—1 invoices (employer)`

---

## 20. Missing Backend Requirements Inferred from UI

- Category & skill catalogs (UI shows tiles/filters).
- Service-area cities (UI has city filters + admin cities page).
- Saved searches (search page filter chips suggest saved filter sets — recommended).
- Read receipts & typing indicators for chat.
- Voice-message storage & playback waveforms.
- Multi-image upload for job photos & completion proof.
- Location-based job matching (radius filter present).
- Worker leaderboard / badges (rating histogram, verified badge present).
- Referral / promo codes (settings hint) — recommended.
- Feature flags & maintenance mode (UI has `/maintenance`).
- Soft-delete & account deletion endpoint (settings).
- Offline mode signal (`/offline` page → service-worker, online-status ping endpoint).

---

## 21. Security, Scalability, Performance

**Security**
- RLS on every table; never trust client.
- All secrets server-side (`process.env` inside `.handler()`).
- Webhook signature verification + idempotency keys.
- Strict input validation (Zod) + length caps.
- Rate limiting (per IP + per user) on auth, OTP, chat, search.
- Content moderation hook on job text + chat.
- HTTPS only, HSTS, secure cookies, CSP, CORS allow-listed.
- HIBP password check; password ≥8; lockout after 10 failed logins.
- PII at rest encrypted (KYC); audit any access.
- GDPR/DPDPA: data export & delete endpoints.

**Scalability**
- Stateless server functions; horizontal scale via edge runtime.
- DB read replicas for analytics; materialized views for dashboards.
- Cursor pagination + indexes on hot queries.
- Partition `location_pings` and `messages` by month.
- Object storage with CDN for media.
- Redis (or pg) cache for catalogs, hot jobs.

**Performance**
- N+1 avoided via Supabase `select` with joins.
- Geospatial queries via `earthdistance`/`postgis`.
- WebSocket realtime for chat + tracking.
- Image variants generated on upload.
- Server-side compression (gzip/br).

---

## 22. Final Checklist — Frontend → Backend Mapping

| Frontend page | APIs | Tables | Services |
|---|---|---|---|
| `/signup`, `/login`, `/otp`, `/forgot` | `/auth/*` | auth.users, profiles, security_logs | Auth, SMS |
| `/language`, `/onboarding`, `/role` | `/me/preferences`, `/me/role` | profiles, user_roles | Profile |
| `/worker` (home) | `/worker/dashboard`, `/jobs/nearby` | jobs, applications, reviews | Dashboard, Geo |
| `/worker/search` | `/jobs`, `/categories`, `/cities` | jobs, categories, cities | Search |
| `/worker/jobs/$id` | `/jobs/:id` | jobs, employer profile | Jobs |
| `/worker/apply` | `/applications` | applications | Applications, Notifications |
| `/worker/applications(/$id)` | `/applications`, `/applications/:id` | applications, jobs | Applications |
| `/worker/active`, `/worker/completion` | `/jobs/active`, `/jobs/:id/status`, `/jobs/:id/complete` | jobs, payments, transactions, files | Jobs, Wallet, Files |
| `/worker/saved` | `/saved` | saved_jobs | Saved |
| `/worker/profile(/edit)` | `/me` | profiles, worker_profiles | Profile |
| `/worker/skills` | `/me/skills`, `/skills/catalog` | worker_skills, skills | Skills |
| `/worker/availability` | `/me/availability` | worker_profiles | Profile |
| `/worker/earnings`, `/worker/withdraw` | `/wallet*`, `/wallet/withdraw` | wallets, transactions, withdrawals | Wallet, Payments |
| `/worker/kyc(/docs)` | `/kyc/*`, `/uploads` | kyc_documents, files | KYC, Files |
| `/worker/notifications(/settings)` | `/notifications`, `/me/notification-preferences` | notifications, notification_preferences | Notifications |
| `/worker/activity` | `/me/activity` | activity_logs | Activity |
| `/worker/help` | `/help/articles`, `/support/tickets` | help_articles, support_tickets | Support |
| `/worker/chat(/$id)` | `/chats*`, WS | chats, chat_participants, messages, files | Chat, Realtime, Files |
| `/employer` | `/employer/dashboard` | jobs, applications, payments | Dashboard |
| `/employer/post` | `/jobs`, `/jobs/:id/publish`, `/uploads` | jobs, files | Jobs, Files |
| `/employer/jobs(/$jobId)` | `/jobs?owner=me`, `/jobs/:id` | jobs, applications | Jobs |
| `/employer/jobs/$jobId/applicants` | `/jobs/:id/applications`, `/applications/:id` | applications, profiles | Applications, Chat, Notifications |
| `/employer/workers/$id` | `/workers/:id`, `/users/:id/reviews` | profiles, worker_profiles, reviews | Profile |
| `/employer/favourites` | `/favourites` | favourite_workers | Favourites |
| `/employer/hire` | `/jobs/:id/hire` | jobs, applications, payments | Hire workflow |
| `/employer/tracking` | `/jobs/:id/tracking` (WS), `/location/ping` | location_pings | Realtime, Geo |
| `/employer/chat` | `/chats*` | chats, messages | Chat |
| `/employer/payment` | `/payments`, `/payment-methods` | payments, payment_methods | Payments |
| `/employer/invoices` | `/invoices`, `/invoices/:id/pdf` | invoices, files | Invoicing |
| `/employer/rate` | `/reviews` | reviews | Reviews |
| `/employer/reports` | `/employer/reports` | materialized views | Analytics |
| `/employer/profile(/settings)` | `/me`, `/me/preferences` | profiles, employer_profiles | Profile |
| `/location/*` | `/geo/*`, `/location/ping`, `/jobs/:id/arrived` | location_pings, cities | Geo |
| `/admin` | `/admin/overview` | aggregates | Admin Analytics |
| `/admin/users` | `/admin/users` | profiles, user_roles | Admin Users |
| `/admin/jobs` | `/admin/jobs` | jobs | Admin Jobs |
| `/admin/kyc` | `/admin/kyc` | kyc_documents, audit_logs | KYC Review |
| `/admin/disputes` | `/admin/disputes` | disputes, audit_logs | Disputes |
| `/admin/revenue` | `/admin/revenue` | transactions, payments | Revenue |
| `/admin/cities` | `/admin/cities` | cities | Catalog |
| `/admin/broadcast` | `/admin/broadcasts` | broadcasts, notifications | Broadcast |
| `/admin/settings` | `/admin/settings`, `/admin/audit-logs` | app_settings, feature_flags, audit_logs | Platform |
| `/maintenance`, `/offline` | `/system/status` | feature_flags | Platform |

---

**End of specification.**
