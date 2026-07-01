# 🧭 Companion

> **A fireteam for your goals.**
> Most habit apps leave you alone with your willpower. Companion doesn't. It puts
> you in a small, hand-picked squad on a shared mission — where you show up every
> day for the people next to you, and when someone starts slipping, the squad
> pulls them back. No one gets left behind.

**Live:** [companion-lime.vercel.app](https://companion-lime.vercel.app)
**Stack:** Next.js 16 · Spring Boot (Java 19) · PostgreSQL · Azure · Vercel

---

## The idea

Accountability dies in a crowd and is fragile one-on-one. It thrives in a small,
trusted unit — a fireteam. Companion is built entirely around that insight:

- **Small on purpose.** A squad is capped at **5 people**. Big enough to feel like
  a team, small enough that your absence is felt immediately.
- **Shared fate over competition.** There's no leaderboard ranking you against
  your friends. The squad wins together or loses together.
- **Leave no one behind.** The heart of the app isn't the check-in — it's the
  moment your squad notices you're about to drop and reaches back.

## Key highlights

- 🛡️ **Squads (max 5)** — small, invite-only units on a shared mission.
- 🔥 **Collective streak** — one streak for the whole squad; it only grows on days
  when *everyone* shows up.
- 🤝 **The rally** — back an at-risk teammate with one tap ("I've got you"); they
  get nudged in-app and by email so the reminder reaches them even when they're away.
- ✅ **Daily report-in** — each member sets their own tasks; completing enough of
  them counts as showing up for the squad that day.
- 🌍 **Timezone-aware** — each squad runs on its own clock, so "today" and the
  end-of-day cutoff are correct wherever members are.
- 🔒 **Secure by default** — verified email sign-up, password reset, and an
  `httpOnly`-cookie login that keeps your session token out of reach of scripts.

## How it works — the flow

```
Sign up ──► Verify email ──► Form or join a squad (≤5) ──► Set your daily tasks
                                                                  │
                                                                  ▼
   ┌──────────────────────── every day ────────────────────────────────┐
   │  Report in (check off your tasks)                                  │
   │        │                                                           │
   │        ├─ Everyone in?  ──► the squad's shared streak grows        │
   │        │                                                           │
   │        └─ Someone slipping near the day's cutoff?                  │
   │               ──► squad sees them "at risk" ──► taps "I've got you" │
   │                        ──► teammate is nudged (in-app + email)      │
   └────────────────────────────────────────────────────────────────────┘
```

1. **Join up.** Create an account (email verification required), then form a squad
   or join one with an invite code. A squad has a mission and a duration.
2. **Set your tasks.** Each member defines their own daily tasks — the personal
   work that counts as "showing up."
3. **Report in daily.** Check off your tasks. Hit your threshold and you've
   reported in for the day.
4. **Grow the streak together.** When *every* squadmate reports in, the squad's
   shared streak advances. If anyone is left behind, it breaks for everyone —
   which is exactly why the squad watches out for each other.
5. **Rally the slipping.** As the day runs out, anyone who hasn't reported in
   shows as **at risk**. A teammate can back them with one tap; the at-risk member
   is nudged in the app and gets an email.

## Architecture

Companion is a classic three-tier web app: a browser front end, a REST API, and a
database — hosted across Vercel and Azure.

```
      ┌──────────────────────────┐
      │   Browser (the user)     │
      └───────────┬──────────────┘
                  │  same-origin requests to /api/*
                  ▼
      ┌──────────────────────────┐        Vercel proxies /api/* to the backend,
      │  Next.js frontend        │        so the browser only ever talks to one
      │  (Vercel)                │        origin — keeping the login cookie
      └───────────┬──────────────┘        first-party and safe.
                  │  REST over HTTPS
                  ▼
      ┌──────────────────────────┐        Handles all business logic: squads,
      │  Spring Boot API         │        tasks, streaks, the rally, auth, and
      │  (Azure Container Apps)   │        sends verification / rally emails.
      └───────────┬──────────────┘
                  │  JDBC
                  ▼
      ┌──────────────────────────┐        Stores users, squads, tasks, check-ins,
      │  PostgreSQL (Azure)       │        streaks and rallies. Schema changes are
      └──────────────────────────┘        applied automatically on deploy.
```

### The components

- **Frontend — Next.js (React, TypeScript, Tailwind).**
  The whole user experience: sign-up, the squad dashboard, the daily report-in,
  and the Squad Status view where the streak and the rally live. It talks to the
  backend through its own `/api/*` path, which is proxied to the API — so from the
  browser's perspective there's a single origin, which keeps the auth cookie
  first-party and reliable across browsers.

- **Backend — Spring Boot (Java) REST API.**
  The brain. It owns every rule: who's in a squad, what counts as reporting in,
  when the collective streak advances or breaks, who's at risk, and what the rally
  does. It also issues login sessions and sends emails.

- **Database — PostgreSQL.**
  The source of truth for users, squads, missions, daily tasks and check-ins,
  streaks and rallies. The schema is versioned and migrations run automatically
  whenever the backend deploys.

### How login and security work

- Sign-up requires a **verified email** before the first login.
- Logging in issues a **JSON Web Token stored in an `httpOnly` cookie** — the
  browser sends it automatically, but scripts can't read it, which protects the
  session from token theft.
- Auth endpoints are **rate-limited** to blunt brute-force and abuse, passwords
  are **hashed** (never stored in the clear), and a password reset **invalidates
  old sessions**.
- Emails (verification, password reset, and the rally) are sent **in the
  background**, so signing up and resetting a password stay fast.

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | Next.js 16, React, TypeScript, Tailwind CSS |
| Backend   | Spring Boot, Java 19, Spring Security, Flyway |
| Database  | PostgreSQL |
| Hosting   | Vercel (frontend) · Azure Container Apps (backend) · Azure Database for PostgreSQL |

## Running locally

**Backend** (`companion-backend/`, needs JDK 17+ and a PostgreSQL database) —
configure the database, `JWT_SECRET`, mail, and `FRONTEND_BASE_URL` via environment
variables (for http dev also set `COOKIE_SECURE=false` and `COOKIE_SAMESITE=Lax`):

```bash
./mvnw spring-boot:run      # starts the API on http://localhost:8080
./mvnw test                 # runs the test suite
```

**Frontend** (`companion-frontend/`, needs Node 20+) — point `BACKEND_API_URL`
(or `NEXT_PUBLIC_API_URL`) at the backend so the `/api/*` proxy resolves:

```bash
npm install
npm run dev                 # starts the app on http://localhost:3000
```

## Deployment

- **Frontend** auto-deploys to Vercel on every push to `main`.
- **Backend** ships as a Docker image (built straight from source), pushed to a
  private registry and rolled out to Azure Container Apps as a new revision;
  database migrations apply automatically on startup.

---

© Companion. All rights reserved. This is a private, proprietary project — **not
open source.** No license is granted to use, copy, modify, or distribute it.
