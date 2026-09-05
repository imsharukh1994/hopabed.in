# Hopebed MVP Audit

Audit date: 2026-09-05

## Executive summary

The `hopabedin.mithagaris.workers.dev` deployment is a Next.js/OpenNext Cloudflare Worker serving a polished frontend demo. The repository contains a separate Express/Mongoose backend skeleton, but it only exposes `/` and `/health`; it has no application routes, authentication, booking engine, payment integration, host workflow, admin workflow, or Stay Pass verification. The public `https://api.hopebed.in/health` endpoint currently returns Cloudflare HTTP 530. The production domain `https://hopebed.in/` serves a separate launch/marketing site and is not the same deployed app as the `workers.dev` site.

No Azure resource, DNS record, Cloudflare dashboard configuration, production secret, or backend deployment configuration is represented in this repository. Those items require provider access and must not be inferred from source code.

## Status table

| Area | Status | Evidence / conclusion |
| --- | --- | --- |
| Frontend architecture | DONE | Next.js App Router, React, Tailwind/PostCSS, OpenNext Cloudflare adapter. Shared UI is under `src/components`. |
| Frontend UI scaffold | WORKING | Header, footer, hero, search controls, property cards, wishlist, auth modal, and host banner exist. |
| Live property data | MISSING | Search and listing pages read `src/data/properties.ts`; all inventory is static demo data. |
| Frontend API integration | BROKEN | `src/lib/api.ts` only exports a hard-coded URL. No frontend API request is implemented. |
| Authentication | PARTIAL | Backend now has bcrypt password hashing, JWT access tokens, bearer auth, role middleware, and register/login/me routes; frontend still has no API/session integration. |
| Booking flow | MISSING | Booking and payment pages explicitly describe themselves as placeholders. |
| Payment | MISSING | Payment schema exists, but no gateway adapter, order creation, checkout, webhook, idempotency, or refund implementation exists. |
| User bookings/profile | MISSING | Both pages are placeholders and have no API integration. |
| Host workflow | MISSING | No host onboarding, property submission, inventory, pricing, availability, booking, or earnings API/UI exists. |
| Admin workflow | MISSING | No admin route, auth guard, property review, payment/refund, or audit API exists. |
| Stay Pass / QR | MISSING | No model, signed payload, QR generator, verification endpoint, or replay protection exists. |
| Backend architecture | PARTIAL | Express + TypeScript + Mongoose service exists, but only health/root routes are mounted. |
| Database models | PARTIAL | User, Host, Property, Booking, Payment, Availability, and Media models exist with timestamps/indexes. Rooms/beds, reviews, cancellation/refund, Stay Pass, verification, settlement, and audit models are absent. |
| Database correctness | PARTIAL | Property now defines GeoJSON `location` and verification states; Room inventory exists and bookings/availability reference rooms. Double-booking enforcement and migration of existing records remain. |
| Media storage | PARTIAL | R2 client and media metadata model exist; no upload/signing route uses them. |
| Deployment | PARTIAL | Frontend OpenNext/Wrangler configuration exists. Backend deployment configuration is absent. |
| Cloudflare | PARTIAL | Source proves a Worker deployment target only. DNS, custom-domain routing, secrets, logs, and API routing cannot be verified from this repository. |
| Azure | NOT REPRESENTED | No Azure VM, networking, or deployment files exist. An Azure VM is not required by the codebase. |
| Public frontend | BROKEN | `workers.dev` serves the demo app; `hopebed.in` serves a separate launch site. Domain consolidation and canonical routing are unresolved. |
| Public API | BROKEN | `https://api.hopebed.in/health` currently responds with HTTP 530. |
| Security baseline | PARTIAL | Backend now has Helmet, rate limiting, request-body limits, CORS, bcrypt, JWT auth, and role middleware. Webhook verification, audit logging, secure production session strategy, and route-level authorization remain. |
| Legal/support content | MISSING | Terms, privacy, cancellation, contact, and help routes contain placeholder copy. |
| Build/type health | WORKING | No editor-reported TypeScript errors were found. Production startup/build still requires focused validation after environment setup. |

## Current architecture

### Frontend

- Next.js 15 App Router with React 19.
- OpenNext Cloudflare adapter; Wrangler target is Worker `hopabed-in`.
- Static demo data drives home, stays, search, details, booking, wishlist, and related UI.
- `API_BASE_URL` points to `https://api.hopebed.in` but is unused.

### Backend

- Standalone Node.js Express service in `backend/`.
- Mongoose connects to MongoDB before the server listens.
- Environment validation requires MongoDB and Cloudflare R2 variables at startup.
- Only root and health routes are mounted.

### Database

MongoDB is the right MVP choice for this document-oriented domain and existing Mongoose code. MongoDB Atlas M0 is adequate for development and a small structured-data pilot if media remains in R2 and indexes/documents are kept bounded. It is not a production durability or scale guarantee; backups, provider limits, and upgrade criteria must be documented before launch.

### Deployment and cost recommendation

1. Host the Next frontend on the existing Cloudflare Worker/OpenNext deployment and attach one canonical domain.
2. Run the Node backend as a separate small Linux service with a managed deployment platform that supports persistent outbound MongoDB connections. Cloudflare Workers should not be used as a direct drop-in host for this current Express/Mongoose process.
3. Use MongoDB Atlas M0 for development/MVP and restrict network access to the backend. Upgrade only when capacity, backup, or operational requirements demand it.
4. Use Cloudflare R2 for property images and verification documents; store only object keys, URLs, MIME type, size, and metadata in MongoDB.
5. Use Cloudflare DNS, HTTPS, secrets, and logs. Do not retain an Azure Windows VM solely for MongoDB unless an external requirement is proven.
6. Use a payment provider adapter with disabled/mock development mode until Razorpay, PayU, or Cashfree credentials and webhook configuration are approved.

This recommendation is a target architecture, not a claim about currently provisioned provider resources.

## Exact implementation order

1. Infrastructure: choose canonical domain, deploy backend, configure DNS/API routing, environment secrets, HTTPS, logs, and health checks.
2. Data foundation: add rooms/beds or unit inventory, explicit property verification state, reviews, cancellation/refund, Stay Pass, and audit models; fix indexes and validation.
3. Security: password hashing, session/token strategy, auth middleware, role authorization, safe errors, rate limits, CORS, and security headers.
4. Core APIs: auth, users, hosts, properties, inventory, availability, and live search/details.
5. Booking engine: server-side pricing, availability reservation, overlap/double-booking prevention, snapshots, explicit status transitions, cancellation.
6. Payments: gateway interface, Razorpay/PayU/Cashfree adapters, server-created orders, verified webhooks, idempotency, booking synchronization, refund foundation.
7. Host/admin workflows: verification queues, inventory/pricing controls, bookings, payments, refunds, settlements, audit logs.
8. Stay Pass: signed opaque identifiers, QR generation, backend verification, authorization, expiry/replay protection.
9. Frontend integration: replace demo reads with API client, preserve existing UI, add loading/error/auth states, and clearly separate demo mode from verified inventory.
10. Legal, operations, and launch: reviewed policies, support contacts, backups, monitoring, end-to-end tests, security review, and deployment runbook.

## Launch blockers

- API domain unavailable (HTTP 530).
- No property, inventory, availability, booking, payment, host, admin, or Stay Pass API routes.
- Frontend still has no authentication/session integration with the backend.
- No verified inventory or availability engine.
- No double-booking protection.
- No payment/webhook/refund implementation.
- No host/admin workflows.
- No Stay Pass/QR verification.
- Placeholder legal/support content.
- No verified production environment variables or secrets.
- Canonical domain currently differs from the deployed demo frontend.

## Scope and verification limits

Azure resources, Cloudflare DNS/routes/secrets, MongoDB Atlas usage, R2 buckets, deployed backend logs, and payment-provider application status cannot be verified from this repository alone. They require access to the relevant provider dashboards or deployment credentials. No credentials should be committed to this repository.
