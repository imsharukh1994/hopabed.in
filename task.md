# Hopebed MVP Task Checklist

## Day 1: Audit, Infrastructure, & Database (Phase 1)
- `[/]` **System Audit**
  - `[/]` Inspect frontend code and architecture
  - `[/]` Inspect backend code and architecture
  - `[ ]` Inspect database configuration
  - `[ ]` Inspect deployment configuration (Cloudflare/Azure)
  - `[ ]` Inspect existing APIs, auth, booking, and payment logic
  - `[ ]` Produce the DONE/PARTIAL/BROKEN/MISSING matrix
- `[ ]` **Architecture & Infrastructure**
  - `[ ]` Finalize and document the recommended architecture
  - `[ ]` Recommend cheapest practical infrastructure architecture
- `[ ]` **Database Setup**
  - `[ ]` Create core MongoDB schemas (Users, Hosts, Properties, Rooms, Bookings, Payments, Reviews)
  - `[ ]` Set up indexes and constraints
- `[ ]` **Security & Config**
  - `[ ]` Configure environment variables
  - `[ ]` Setup security baseline (CORS, rate limiting, basic auth middlewares)

## Day 2: Core Backend - Users & Hosts (Phase 2 - Part A)
- `[ ]` Implement secure login/signup APIs
- `[ ]` Implement session/token management
- `[ ]` Setup role management (User/Host/Admin)
- `[ ]` Build Host registration APIs
- `[ ]` Frontend integration for auth/host forms

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
