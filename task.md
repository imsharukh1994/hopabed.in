# Hopebed MVP Task Checklist

## Day 1: Audit, Infrastructure, & Database (Phase 1)
- `[x]` **System Audit**
  - `[x]` Inspect frontend code and architecture
  - `[x]` Inspect backend code and architecture
  - `[x]` Inspect database configuration
  - `[x]` Inspect deployment configuration (Cloudflare/Azure)
  - `[x]` Inspect existing APIs, auth, booking, and payment logic
  - `[x]` Produce the DONE/PARTIAL/BROKEN/MISSING matrix
- `[x]` **Architecture & Infrastructure**
  - `[x]` Finalize and document the recommended architecture
  - `[x]` Recommend cheapest practical infrastructure architecture
- `[x]` **Database Setup**
  - `[x]` Create core MongoDB schemas (Users, Hosts, Properties, Rooms, Bookings, Payments, Reviews)
  - `[x]` Set up indexes and constraints
- `[x]` **Security & Config**
  - `[x]` Configure environment variables
  - `[x]` Setup security baseline (CORS, rate limiting, basic auth middlewares)

## Day 2: Core Backend - Users & Hosts (Phase 2 - Part A)
- `[x]` Implement secure login/signup APIs
- `[x]` Implement session/token management
- `[x]` Setup role management (User/Host/Admin)
- `[x]` Build Host registration APIs
- `[x]` Frontend integration for auth/host forms

## Day 3: Core Backend - Properties & Inventory (Phase 2 - Part B)
- `[ ]` Create Property management APIs
- `[ ]` Implement Inventory/Room models
- `[ ]` Implement Property verification states
- `[ ]` Frontend integration for Host Dashboard

## Day 4: The Booking Engine (Phase 3)
- `[ ]` Implement Search API
- `[ ]` Implement Availability Engine (double-booking prevention)
- `[ ]` Implement Booking Creation API
- `[ ]` Frontend integration for search and booking flow

## Day 5: Payment Integration (Phase 4)
- `[ ]` Build payment abstraction layer
- `[ ]` Integrate Gateway (Razorpay/PayU)
- `[ ]` Implement webhook handling
- `[ ]` Frontend integration for checkout flow

## Day 6: Dashboards & Administration (Phase 5)
- `[ ]` Build Admin Dashboard APIs and Views
- `[ ]` Complete Host Dashboard features
- `[ ]` Implement Audit Logging

## Day 7: Stay Pass, QR Verification & Launch Prep (Phases 6 & 7)
- `[ ]` Implement Stay Pass generation
- `[ ]` Build QR Verification flow
- `[ ]` Add Legal pages
- `[ ]` Run End-to-End Testing
- `[ ]` Final production readiness review
