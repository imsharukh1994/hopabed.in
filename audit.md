# Hopebed Platform Audit & Architecture Plan

## Current State Matrix (DONE / PARTIAL / BROKEN / MISSING)

| Component | Status | Details |
| :--- | :--- | :--- |
| **Frontend Architecture** | PARTIAL | Next.js with App Router is correctly set up with Tailwind CSS. UI looks good but uses hardcoded demo data (`src/data/properties`). |
| **Backend Architecture** | PARTIAL | Express, Node.js, Mongoose setup exists (`backend/src/`). Basic routing and middleware (CORS, Rate Limit) are structured well. |
| **Database Architecture** | PARTIAL | MongoDB schemas are defined (`User`, `Property`, `Booking`, etc.), but currently no live production database connection is set. |
| **Deployment (Frontend)**| DONE | `open-next` and `wrangler` are configured to deploy the Next.js frontend to Cloudflare Pages/Workers perfectly. |
| **Deployment (Backend)** | MISSING | Standard Express setup (`node dist/index.js`), not currently deployed. We need a host for this. |
| **Authentication APIs** | PARTIAL | `/api/auth` routes exist with JWT and bcrypt. Needs integration with the frontend forms. |
| **Property APIs** | PARTIAL | Basic search and booking APIs exist. Host workflow for adding/editing properties is missing. |
| **Booking Logic** | PARTIAL | Logic to prevent double-booking using MongoDB transactions exists in `bookings.ts`. |
| **Payment Logic** | MISSING | `Payment` schema exists, but no integration with gateways or webhook handlers. |
| **Admin/Host Dashboard**| MISSING | Frontend folders exist (`src/app/host`, `src/app/admin`?), but backend APIs to support these workflows are largely absent. |
| **Security Baseline** | DONE | Backend has `helmet`, `cors`, `rateLimit`, and basic error handling configured. |
| **Stay Pass & QR** | MISSING | No current implementation for generating Stay Passes or verifying QR codes. |

---

## Recommended Architecture & Infrastructure

Based on the audit, we should **avoid** heavy Azure VMs to keep costs down. Here is the cheapest, most practical architecture for the MVP:

1.  **Frontend (Next.js):** 
    *   **Host:** Cloudflare Pages (via `open-next`).
    *   **Cost:** Free tier (generous limits).
2.  **Backend (Node.js/Express API):**
    *   **Host:** Render (Web Service) or Railway. Both offer cheap/free tiers for standard Node.js applications and are significantly cheaper and easier to maintain than a dedicated Azure VM.
    *   **Cost:** $0 - $5/month.
3.  **Database (MongoDB):**
    *   **Host:** MongoDB Atlas M0 (Shared Cluster).
    *   **Cost:** Free (512 MB is more than enough for MVP structured data like Users, Bookings, and Properties).
4.  **Image Storage (Property Photos/Docs):**
    *   **Host:** Cloudflare R2. (The backend `env.ts` already has config placeholders for this!)
    *   **Cost:** Free tier (10 GB/month).

### Summary of Next Steps
The core foundation is surprisingly solid! The Mongoose schemas and basic Express routes are already written. The primary task is to bridge the gap: hook the Next.js frontend up to these real APIs, replace the dummy data, finish the missing host/admin features, and implement payments.
