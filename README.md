# 🧭 Companion

**A fireteam for your goals.** Companion is a social accountability app built
around small, high-trust **squads** (up to 5) working toward a shared mission.
You show up every day for the people next to you — and when someone's slipping,
the squad reaches back so no one gets left behind.

**Live:** [companion-lime.vercel.app](https://companion-lime.vercel.app)
**Stack:** Next.js 16 · Spring Boot (Java 19) · PostgreSQL · Azure · Vercel

---

## What it does

- **Squads (≤5)** — form a small unit on a shared mission with a start/end date.
- **Daily report-in** — each member sets their own daily tasks and checks them
  off; hitting your threshold means you "reported in" for the day.
- **Collective streak** — the streak belongs to the squad, not the individual:
  it advances only when *everyone* shows up. Win together, lose together.
- **The rally** — when a squadmate hasn't reported in and the day's running out,
  the squad can back them ("I've got you"), which nudges them in-app and by email.
- **Accounts** — email/password with required email verification, password reset,
  and profile management.

## Architecture

```
Next.js (Vercel)  ──/api/* proxy──►  Spring Boot (Azure Container Apps)  ──►  PostgreSQL (Azure)
```

- **Frontend** — Next.js (App Router, TypeScript, Tailwind), deployed on Vercel.
  API calls are same-origin and proxied to the backend so the auth cookie stays
  first-party.
- **Backend** — Spring Boot REST API. Stateless JWT auth delivered as an
  `httpOnly` cookie, BCrypt password hashing, per-IP rate limiting on auth
  endpoints, strict security headers, and Flyway-managed schema migrations.
- **Database** — PostgreSQL (Azure Flexible Server).

## Local development

**Backend** (`companion-backend/`) — requires JDK 17+ and a PostgreSQL database.
Configure via environment variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`,
`JWT_SECRET`, mail + `FRONTEND_BASE_URL`, and for http dev `COOKIE_SECURE=false`,
`COOKIE_SAMESITE=Lax`), then:

```bash
./mvnw spring-boot:run     # http://localhost:8080
./mvnw test                # run the test suite
```

**Frontend** (`companion-frontend/`) — requires Node 20+:

```bash
npm install
npm run dev                # http://localhost:3000
```

Point `BACKEND_API_URL` (or `NEXT_PUBLIC_API_URL`) at the backend so the
`/api/*` proxy resolves.

## Deployment

- **Frontend:** auto-deploys to Vercel on push to `main`.
- **Backend:** a multi-stage Docker image is built (compiles from source), pushed
  to a private container registry, and rolled out to Azure Container Apps as a new
  revision. Schema migrations run automatically on startup.

---

© Companion. All rights reserved. This is a private, proprietary project — not
open source. No license is granted for use, copying, modification, or
distribution.
