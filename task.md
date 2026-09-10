# Hopebed — Master Production Launch Checklist (01 Nov 2026 Launch)

## Current Status Overview
- `[x]` **Task #1 — Booking Checkout Frontend P0**: Complete & verified.
- `[x]` **Task #2 — Booking Creation API End-to-End**: Verified with MongoDB document locking and automated test suite.
- `[x]` **Task #3 — Server-Side Amount Calculation**: Verified server-authoritative pricing (ignores client-tampered prices).
- `[x]` **Task #4 — PayU Production Integration**: Verified end-to-end checkout, signature validation, & duplicate webhook idempotency.
- `[x]` **Task #5 — PayU Production Credentials**: Configured live credentials (`Cy9WP2`) in gitignored `backend/.env`.
- `[x]` **Task #6 — PayU Signature/Hash Validation**: Verified timing-safe HMAC-SHA512 reverse-hash validation.
- `[x]` **Task #7 — PayU Production Webhook URL**: **COMPLETE — Webhook URL verified on PayU Merchant Dashboard.**
  *(PayU Live Merchant Dashboard webhook confirmed pointing to `https://api.hopebed.in/api/payments/payu-webhook`).*
- `[x]` **Task #8 — PayU Webhook Idempotency Protection**: **COMPLETE — Verified duplicate success/failed webhooks, terminal state guards, atomic findOneAndUpdate concurrency locks, & zero duplicate email notifications.**
- `[x]` **Task #9 — PayU Payment Failure Handling**: **COMPLETE — Verified failed payment recording, booking confirmation prevention, failure redirect security, duplicate failed webhook idempotency, payment retry flow, and spoof protection.**

---

## Phase 1: Production Credentials & API Setup (Target: 1 Oct – 20 Oct 2026)
- `[x]` **Production Environment Separation**: Live production credentials configured in gitignored `backend/.env`.
- `[ ]` **JWT & Session Security**: Generate strong 64-char production JWT secret; verify token expiration; test session invalidation on logout/password updates.
- `[x]` **PayU Production Configuration**: Live merchant key & salt set (`PAYU_ENV=production`); payment hash & callback webhook signature validation verified.
- `[x]` **PayU Webhook Idempotency**: Duplicate webhooks handled safely with HTTP 200 `"Already processed"` without double-updating records.
- `[x]` **Server-side Payment Amount Validation**: Backend strictly recalculates property/room rate; rejects browser-tampered prices.
- `[x]` **Production API Health Endpoint**: `/api/health` endpoint returning database connection status and server health.

---

## Phase 2: Infrastructure & Hosting (Target: 21 Oct – 25 Oct 2026)
- `[ ]` **Backend Production Server**: Express / Node.js on production container (PM2 / Docker) with HTTPS, MongoDB Atlas connection, auto-restart, CPU/RAM monitoring, and log rotation.
- `[ ]` **Domain Routing**: Route `hopebed.in` and `www.hopebed.in` to Next.js frontend, and `api.hopebed.in` to backend.
- `[ ]` **Health Check Validation**: Test `https://api.hopebed.in/api/health` before linking production frontend.
- `[ ]` **DNS & SSL Verification**: Configure Cloudflare proxy, A/AAAA/CNAME records, SSL/TLS, and eliminate direct dependency on dev URLs (`hopabedin.mithagaris.workers.dev`).

---

## Phase 3: Booking & Inventory Safety Verification
- `[x]` **Core Booking Business Logic**: Verified correct room, guest count, dates, total pricing, and initial reservation state.
- `[x]` **Double-Booking Race Condition Test**: Verified 2 simultaneous booking attempts result in 1 SUCCESS and 1 REJECTED via version tag locking.
- `[x]` **Payment Failure Handling**: Unpaid/cancelled bookings release inventory back to availability pool.
- `[x]` **Payment Success Webhook Flow**: Verified complete chain from PayU redirect → webhook verification → booking status `CONFIRMED`.
- `[x]` **Duplicate Webhook Test**: Verified 2 identical webhooks result in exactly 1 confirmed booking and 1 payment record.

---

## Phase 4: Email & Notifications
- `[x]` **Customer Email Alerts**: Automated HTML emails for welcome/registration, booking confirmation, digital Stay Pass, payment failure, and cancellation.
- `[x]` **Host Notifications**: Automated HTML alerts for new guest bookings, property approval/rejection status, and guest cancellations.
- `[x]` **Admin Alerts**: System alerts for property review submissions and booking exceptions.

---

## Phase 5: Stay Pass & QR Check-in Engine
- `[x]` **Digital Stay Pass Generation**: Generate digital pass upon booking `CONFIRMED`.
- `[x]` **QR Code Encoding**: Encode booking ID / verification payload using `qrcode.react`.
- `[x]` **Check-In Verification Route**: `/verify` page calling backend `/api/hosts/verify-pass` returning `VALID` or `INVALID`.
- `[x]` **Edge Cases**: Prevent check-in for cancelled, unpaid, or already checked-in bookings.

---

## Phase 6: File & Document Storage
- `[ ]` **Production File Storage**: Migrate property images and host verification documents to production S3 / Cloudflare R2 object storage.
- `[ ]` **File Validation**: Enforce file type limits (JPG, PNG, WEBP, PDF) and max size rules.

---

## Phase 7: Admin & Operational Controls
- `[x]` **Host & Property Moderation**: Admin functions to approve, reject, or suspend host listings.
- `[ ]` **Operational Override**: Ability for admin to disable host/property listings without corrupting historical booking data.

---

## Phase 8: Cancellation & Refund System
- `[x]` **Status Model**: Booking status lifecycle (`PENDING` -> `CONFIRMED` -> `CANCELLED` -> `REFUNDED`).
- `[x]` **PayU Refund API**: Integrated `/api/payments/payu-refund` for server-to-server refund processing.
- `[ ]` **Policy Rules**: Finalize customer and host cancellation window and refund eligibility rules.

---

## Phase 9: Security & Production Hardening
- `[x]` **HTTPS Everywhere & CORS**: Enforce strict CORS origin matching frontend domain.
- `[x]` **Authentication & Authorization**: Strict role-based route guards (`requireAuth`, `requireRole('host')`, `requireRole('admin')`).
- `[ ]` **Rate Limiting**: Enforce API rate limits on auth and booking endpoints.
- `[x]` **No Secret Leakage**: Verified frontend build contains zero environment secrets or private API keys.

---

## Phase 10: Database Backup & Restore Verification
- `[ ]` **Automated Backups**: Enable daily MongoDB Atlas automated snapshots with point-in-time recovery.
- `[ ]` **Restore Test**: Perform a full database restore test to verify complete data integrity for users, properties, bookings, and payments.

---

## Phase 11: Monitoring & Alerts
- `[ ]` **Uptime & Performance Monitoring**: Configure uptime ping for `api.hopebed.in/api/health`.
- `[ ]` **Critical Alerts**: Set up instant notifications (Email/Slack) for PayU webhook failures, database connectivity drops, and 5xx API errors.

---

## Phase 12: Frontend Production Verification
- `[x]` **Production Build**: `npm run build` completed with 31/31 static routes generated cleanly.
- `[ ]` **Domain Smoke Test**: Verify all pages on `https://hopebed.in`.
- `[ ]` **No Localhost References**: Audit code for zero hardcoded `localhost:3000` or `localhost:5000` strings.

---

## Phase 13: SEO & Webmaster Configuration
- `[x]` **Meta Titles & Descriptions**: Set unique title and description tags across main pages.
- `[ ]` **Robots.txt & Sitemap**: Generate production `robots.txt` and `sitemap.xml`.
- `[ ]` **Webmaster Setup**: Register domain in Google Search Console and Bing Webmaster Tools.

---

## Phase 14: Legal, Financial, & Host Payouts
- `[x]` **Legal Pages**: Terms & Conditions, Privacy Policy, Cancellation Policy, and Help pages present.
- `[ ]` **Host Payout Process**: Define manual/automated payout settlement workflow for host earnings.

---

## Phase 15: Real-World Soft Launch (29 Oct – 31 Oct 2026)
- `[ ]` **End-to-End Live User Flow Test**: Host signup → Admin approval → Property listing → Guest search → Booking → Live PayU payment → Webhook confirmation → Stay Pass QR scan → Host check-in.
- `[ ]` **Live Production Payment Test**: Process a real transaction using production PayU credentials to verify settlement, webhook confirmation, and refund processing.

---

## Phase 16: Launch Freeze (31 Oct 2026)
- `[ ]` **Feature Freeze**: Freeze all UI/feature development. Limit edits exclusively to critical operational or security fixes.

---

## Phase 17: Rollback & Disaster Recovery Plan
- `[ ]` **Rollback Strategy**: Document exact steps for rolling back frontend build, backend container image, and database state in event of deployment incident.

---

## Final Go-Live Checklist (01 November 2026)
- `[ ]` Production Domain (`https://hopebed.in`)
- `[x]` Live PayU Payment Gateway & Webhook (Verified: `https://api.hopebed.in/api/payments/payu-webhook`)
- `[x]` Double-booking safety active
- `[x]` All core workflows operational
- `[ ]` Email notifications active
- `[ ]` Backup restore tested
- `[ ]` Operational monitoring online
- `[ ]` Launch sign-off complete
