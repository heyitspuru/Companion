# 🧭 Companion — Gamified Accountability Platform

> *A full-stack, cloud-native social habit tracker. This document is a complete technical artifact: architecture, decisions, failures, fixes, and lessons. Built from scratch. Broken many times. Shipped.*

**Live:** [`companion-lime.vercel.app`](https://companion-lime.vercel.app)  
**Backend API:** Azure Container Apps (East Asia, scale-to-zero)  
**Stack:** Next.js 16 · Spring Boot (Java 19) · PostgreSQL 18 · Azure · Vercel

> **Latest update — June 2026:** Full UI redesign — warm light theme (happyhues #14), display fonts Black Ops One / Russo One / Chakra Petch, a shared component library, and Lucide SVG icons (no emoji). **Email verification is now required before login.** Users can **change their username** from the profile page. Circle creation simplified to a single "Goal" field. Backend running Azure Container Apps image `v4`; CORS is fully env-driven.

---

## Table of Contents

1. [What Companion Is](#1-what-companion-is)
2. [High-Level Architecture (HLD)](#2-high-level-architecture-hld)
3. [System Design Deep Dive](#3-system-design-deep-dive)
4. [Low-Level Design (LLD) — Backend](#4-low-level-design-lld--backend)
5. [Low-Level Design (LLD) — Frontend](#5-low-level-design-lld--frontend)
6. [Database Schema](#6-database-schema)
7. [Feature Implementation Details](#7-feature-implementation-details)
8. [The Azure B2C Rabbit Hole](#8-the-azure-b2c-rabbit-hole)
9. [Deployment — Phase by Phase](#9-deployment--phase-by-phase)
10. [Performance: The N+1 Problem](#10-performance-the-n1-problem)
11. [Known Issues & Open Work](#11-known-issues--open-work)
12. [Lessons Learned](#12-lessons-learned)

---

## 1. What Companion Is

Companion is a social accountability platform built around **Circles** — small groups (5–20 people) with a shared goal. Members add their own daily tasks, check in every day, and compete on a live leaderboard. Weekly badges are awarded automatically to the top performer.

The core insight: **accountability through visibility**. The mild shame of dropping on a leaderboard and the mild pride of a badge drives consistency better than a solo to-do app.

### Core Concepts

```
┌───────────────────────────────────────────────────────┐
│                        CIRCLE                         │
│  Goal: "Work out daily for 60 days"                   │
│  Members: 5–20 people                                 │
│  Duration: 7–365 days                                 │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Alice   │  │   Bob    │  │  Carol   │             │
│  │ Tasks:   │  │ Tasks:   │  │ Tasks:   │             │
│  │ [X] Run  │  │ [X] Run  │  │ [ ] Run  │             │
│  │ [X] Lift │  │ [ ] Lift │  │ [X] Lift │             │
│  │ Streak:9 │  │ Streak:4 │  │ Streak:2 │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                       │
│  LEADERBOARD: Alice #1 -> Bob #2 -> Carol #3          │
│  TOP THIS WEEK: * Alice *                             │
└───────────────────────────────────────────────────────┘
```

**Tasks reset every day** — not by deleting and recreating rows, but through date-scoped `TaskCheckin` records. Yesterday's completions are simply invisible to today's query. More on this in [Feature Implementation Details](#7-feature-implementation-details).

---

## 2. High-Level Architecture (HLD)

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              Next.js 15 (TypeScript)                        │   │
│   │              Vercel Hobby — companion-lime.vercel.app       │   │
│   │              Tailwind v3 · React Hooks · httpOnly cookie JWT │   │
│   └──────────────────────────┬──────────────────────────────────┘   │
└──────────────────────────────│──────────────────────────────────────┘
                               │ HTTPS — same-origin /api/* proxied
                               │ (Next.js rewrite) → backend
                               │ Cookie: token=<HS256 JWT> (httpOnly)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER                                   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │        Spring Boot 3 (Java 19) — Azure Container Apps       │   │
│   │        companion-backend.ambitiousisland-bb0c2789           │   │
│   │        .eastasia.azurecontainerapps.io                      │   │
│   │                                                             │   │
│   │   SecurityConfig ──► JwtAuthFilter ──► Controllers          │   │
│   │                                        ├── AuthController   │   │
│   │                                        ├── CircleController │   │
│   │                                        ├── TaskController   │   │
│   │                                        ├── BadgeController  │   │
│   │                                        └── ProfileController│   │
│   └──────────────────────────┬──────────────────────────────────┘   │
└──────────────────────────────│──────────────────────────────────────┘
                               │ JDBC (SSL)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │     Azure PostgreSQL Flexible Server — East Asia            │   │
│   │     companion-db-01.postgres.database.azure.com             │   │
│   │     PostgreSQL 18.3 · B1ms (1 vCore, 2 GiB) · 32 GiB        │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │  SCHEDULED JOBS     │
                    │  (Spring @Scheduled)│
                    │  ├── Midnight:      │
                    │  │   conclude       │
                    │  │   expired circles│
                    │  └── Monday 00:00:  │
                    │       award weekly  │
                    │       badges        │
                    └─────────────────────┘
```

### Container Infrastructure

```
┌──────────────────────────────────────────────────────┐
│              Azure Resource Group: companion-rg      │
│                    Region: East Asia                 │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Container Apps Environment: companion-env      │ │
│  │                                                 │ │
│  │  ┌───────────────────────────────────────────┐  │ │
│  │  │  Container App: companion-backend         │  │ │
│  │  │  Image: companionregistry01.azurecr.io/   │  │ │
│  │  │         companion-backend:v1              │  │ │
│  │  │  CPU: 0.5 cores · Memory: 1 Gi            │  │ │
│  │  │  Min replicas: 0  (scale-to-zero)         │  │ │
│  │  │  Max replicas: 3                          │  │ │
│  │  │  Ingress: External · Port 8080            │  │ │
│  │  └───────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌──────────────────────┐  ┌───────────────────────┐ │
│  │  Azure Container     │  │  PostgreSQL Flexible  │ │
│  │  Registry (Basic)    │  │  Server: B1ms         │ │
│  │  companionregistry01 │  │  companion-db-01      │ │
│  └──────────────────────┘  └───────────────────────┘ │
└──────────────────────────────────────────────────────┘

        ┌──────────────────────────────────────┐
        │  Vercel (separate — free Hobby tier) │
        │  companion-lime.vercel.app           │
        │  Next.js 15 · GitHub auto-deploy     │
        └──────────────────────────────────────┘
```

### Request Lifecycle

```
User clicks "Toggle Task" on the frontend
         │
         ▼
Next.js client calls (same-origin):
  POST /api/tasks/{taskId}/toggle
  Cookie: token=eyJhbGc...   (httpOnly, sent automatically)
         │
         ▼
Vercel rewrite proxies /api/* → backend (forwards the Cookie)
         │
         ▼
Azure Container Apps ingress (HTTPS termination)
         │
         ▼
Spring Boot — Security Filter Chain:
  ┌─────────────────────────────────────────┐
  │  1. RateLimitFilter (auth endpoints)    │
  │  2. JwtAuthFilter                       │
  │     → reads token cookie OR Bearer hdr   │
  │     → verifies HS256 signature           │
  │     → checks tv == user.token_version    │
  │     → sets SecurityContext principal     │
  └──────────────────┬──────────────────────┘
                     │
                     ▼
  ┌─────────────────────────────────────────┐
  │  2. TaskController.toggleTask()         │
  │     → extract userId from principal     │
  │     → call TaskService.toggleTask()     │
  └──────────────────┬──────────────────────┘
                     │
                     ▼
  ┌─────────────────────────────────────────┐
  │  3. TaskService                         │
  │     → find TaskCheckin for              │
  │        (taskId, userId, LocalDate.now)  │
  │     → if exists: delete (un-complete)   │
  │     → if not:   create (complete)       │
  │     → recalculate streak                │
  │     → return updated task list          │
  └──────────────────┬──────────────────────┘
                     │
                     ▼
  ┌─────────────────────────────────────────┐
  │  4. PostgreSQL                          │
  │     → upsert task_checkins row          │
  │     → update user_streaks               │
  └─────────────────────────────────────────┘
         │
         ▼
JSON response → Next.js updates state → UI re-renders leaderboard
```

---

## 3. System Design Deep Dive

### Authentication Flow

> **Current model (June 2026):**
> - **Email verification:** Registration does not auto-log-in. It creates an account with `is_verified = false`, emails a 24-hour verification link, and returns **no JWT** (the client shows a "check your email" screen). `GET /api/auth/verify-email?token=…` flips `is_verified = true`. Valid credentials on an unverified account return **403**.
> - **httpOnly cookie auth (not localStorage):** Login issues the HS256 JWT as an `httpOnly; Secure; SameSite=None` cookie named `token` — JS never touches it, so XSS can't steal it. The browser sends it automatically; the backend also still accepts an `Authorization: Bearer` header for native/API clients.
> - **First-party via same-origin proxy:** The frontend never calls the backend domain directly. `next.config.ts` rewrites `/api/*` to the backend, so the browser only ever talks to the Vercel origin and the cookie is **first-party** (survives Safari/iOS third-party-cookie blocking).
> - **Token invalidation:** Each JWT carries a `tv` (token-version) claim. `users.token_version` is bumped on password reset, so the auth filter rejects every token minted before the reset.

```
LOGIN (cookie issuance)
─────────────────────────────────────────────────────────────
  Browser            Vercel (/api proxy)      Spring Boot        PostgreSQL
    │                       │                      │                  │
    │─ POST /api/auth/login►│─ proxy ─────────────►│                  │
    │   { email, password } │                      │─ SELECT user ───►│
    │                       │                      │◄─ user row ──────│
    │                       │                      │─ BCrypt.verify() │
    │                       │                      │─ is_verified? ───│ (403 if not)
    │                       │                      │─ HS256 JWT{tv}   │
    │◄ Set-Cookie: token=…  │◄─ Set-Cookie ────────│                  │
    │  httpOnly;Secure;       (first-party on        body: {username,email}
    │  SameSite=None          vercel.app)
  stores only username/email hint in localStorage (NOT the token)


EVERY AUTHENTICATED REQUEST
─────────────────────────────────────────────────────────────
  Browser            Vercel (/api proxy)      JwtAuthFilter        Controller
    │                       │                      │                   │
    │─ GET /api/circles ───►│─ proxy + Cookie ────►│                   │
    │   Cookie: token=…     │                      │─ read cookie OR   │
    │                       │                      │  Bearer header    │
    │                       │                      │─ HMAC-SHA256 verify│
    │                       │                      │─ tv == user.token_version? │
    │                       │                      │─ set SecurityContext──────►│
    │◄──────────────────────────────────────────────────── response ──│
```

### Circle Lifecycle State Machine

```
                    ┌─────────────────┐
                    │   Circle Created │
                    │   Status: ACTIVE │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       Members join    Tasks added    Daily check-ins
       via invite       by each        logged by
       code             member         members
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │  Midnight cron  │
                    │  checks end     │
                    │  dates          │
                    └────────┬────────┘
                             │ end_date < today
                             ▼
                    ┌─────────────────┐
                    │  Status:        │
                    │  CONCLUDED      │◄── Creator sees stats overlay:
                    └────────┬────────┘    total check-ins, best streak,
                             │             badges won, member count
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
   Creator: "Archive as               Creator: "Extend"
    Achievement"                      new end_date set
              │                             │
              ▼                             ▼
   ┌─────────────────┐          ┌─────────────────┐
   │  Status:        │          │  Status:        │
   │  ARCHIVED       │          │  ACTIVE again   │
   └─────────────────┘          └─────────────────┘
```

### Streak Calculation Logic

```
Streak threshold is configurable per circle:
  ANY_TASK   → at least 1 task completed today
  HALF       → ≥ 50% of tasks completed today
  ALL_TASKS  → 100% of tasks completed today
  CUSTOM     → configurable percentage

Daily check (runs on every task toggle):
─────────────────────────────────────────

  completedToday = COUNT(task_checkins WHERE date = today AND userId = ?)
  totalTasks     = COUNT(circle_tasks WHERE circleId = ? AND userId = ?)
  completionPct  = completedToday / totalTasks * 100

  thresholdMet   = completionPct >= circle.threshold

  IF thresholdMet AND streak.lastCheckinDate = yesterday:
      streak.currentStreak += 1
      streak.lastCheckinDate = today
      IF streak.currentStreak > streak.longestStreak:
          streak.longestStreak = streak.currentStreak

  IF thresholdMet AND streak.lastCheckinDate < yesterday:
      streak.currentStreak = 1   ← reset, start fresh
      streak.lastCheckinDate = today

  IF NOT thresholdMet AND streak.lastCheckinDate = today:
      streak.currentStreak -= 1  ← un-complete within same day
      streak.lastCheckinDate = yesterday (or null if streak = 0)

  NOTE: longestStreak NEVER decrements.
        It is a high-water mark, immutable once set.
```

### Leaderboard Ranking Algorithm

```
Rank members in a circle by:
  PRIMARY:   current_streak DESC
  SECONDARY: today_completion_pct DESC
  TERTIARY:  longest_streak DESC

Query approach (4 flat queries, not N×4):

  Query 1: All user_streaks for this circle
           → Map<userId, StreakData>

  Query 2: All task_checkins for this circle WHERE date = today
           → Map<userId, completedCount>

  Query 3: All circle_tasks for this circle
           → Map<userId, totalTaskCount>

  Query 4: All users who are members of this circle
           → List<UserBasic>

  Assemble in Java:
    for each user:
      completionPct = checkins.get(userId) / tasks.get(userId)
      streak = streaks.get(userId)
      build LeaderboardEntry { rank, user, streak, completionPct }

    sort by (currentStreak DESC, completionPct DESC, longestStreak DESC)
    assign rank = position + 1

  Result: O(N) assembly, 4 DB round trips regardless of member count.
```

---

## 4. Low-Level Design (LLD) — Backend

### Package Structure

```
companion-backend/
└── src/main/java/com/companion/backend/
    ├── auth/                          ← Auth DTOs
    │   ├── LoginRequest.java
    │   ├── RegisterRequest.java
    │   ├── ForgotPasswordRequest.java
    │   └── ResetPasswordRequest.java
    │
    ├── config/
    │   ├── SecurityConfig.java        ← Filter chain, CORS, permitAll rules
    │   └── DataInitializer.java       ← Admin user seeding on startup
    │
    ├── controller/
    │   ├── AuthController.java        ← /api/auth/**
    │   ├── CircleController.java      ← /api/circles/**
    │   ├── TaskController.java        ← /api/tasks/**
    │   ├── BadgeController.java       ← /api/badges/**
    │   └── ProfileController.java     ← /api/profile/**
    │
    ├── entity/
    │   ├── User.java
    │   ├── Circle.java
    │   ├── CircleMember.java
    │   ├── Goal.java
    │   ├── CircleTask.java
    │   ├── TaskCheckin.java
    │   ├── UserStreak.java
    │   ├── Badge.java
    │   └── PasswordResetToken.java
    │
    ├── filter/
    │   └── JwtAuthFilter.java         ← HS256 JWT validation
    │
    ├── repository/                    ← Spring Data JPA interfaces
    │   ├── UserRepository.java
    │   ├── CircleRepository.java
    │   ├── CircleMemberRepository.java
    │   ├── CircleTaskRepository.java
    │   ├── TaskCheckinRepository.java
    │   ├── UserStreakRepository.java
    │   ├── BadgeRepository.java
    │   └── PasswordResetTokenRepository.java
    │
    ├── service/
    │   ├── AuthService.java           ← register, login, forgot/reset password
    │   ├── CircleService.java         ← CRUD, leaderboard, conclusion
    │   ├── TaskService.java           ← toggle, streak recalc
    │   ├── BadgeService.java          ← weekly award scheduler
    │   └── ProfileService.java        ← aggregate stats
    │
    └── util/
        └── JwtUtil.java               ← HS256 sign/verify
```

### Security Filter Chain

```java
// SecurityConfig.java — the order matters

@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .sessionManagement(sm ->
            sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .authorizeHttpRequests(auth -> auth
            // Public endpoints — no token needed
            .requestMatchers(
                "/api/auth/register",
                "/api/auth/login",
                "/api/auth/forgot-password",
                "/api/auth/reset-password"
            ).permitAll()
            // Everything else requires a valid JWT
            .anyRequest().authenticated()
        )
        // JwtAuthFilter runs before Spring's UsernamePasswordAuthenticationFilter
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
}
```

> **Key insight:** `permitAll()` does NOT skip filter execution. `JwtAuthFilter` still runs on public endpoints — it just doesn't throw if the token is missing or invalid.

**Security hardening (June 2026).** The filter chain and request DTOs add several layers on top of the JWT check:

| Protection | Where | What it does |
|------------|-------|--------------|
| **Rate limiting** | `RateLimitFilter` (before auth) | Per-IP fixed window (30 req/min) on `/api/auth/**` — blunts brute-force / credential-stuffing / email-bombing. In-memory (move to Redis if scaled out). |
| **Security headers** | `SecurityConfig.headers(...)` | Strict `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, locked `Permissions-Policy`, plus Spring's default `X-Content-Type-Options` + HSTS. (This is a JSON-only API — it never serves HTML.) |
| **Server-side password policy** | `@Size(min=8,max=72)` on `RegisterRequest`/`ResetPasswordRequest` | The 8-char rule is enforced in the API, not just the browser, so it can't be bypassed by calling the endpoint directly. |
| **Anti-enumeration** | `AuthService.register` | One generic "email or username already in use" message so the endpoint can't be used to probe which accounts exist. |
| **Token invalidation** | `users.token_version` + `tv` JWT claim | A password reset bumps the version; the filter rejects any token minted before it. |
| **Request size caps** | `application.yml` (`server.*`) | Bounds header / form-post sizes against oversized-request DoS. |

### JWT Implementation

```java
// JwtUtil.java — HS256 only

@Component
public class JwtUtil {

    @Value("${JWT_SECRET}")
    private String secret;

    private static final long EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

    public String generateToken(Long userId, String email) {
        return Jwts.builder()
            .setSubject(userId.toString())
            .claim("email", email)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + EXPIRY_MS))
            .signWith(Keys.hmacShaKeyFor(secret.getBytes()), SignatureAlgorithm.HS256)
            .compact();
    }

    public Claims validateToken(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(Keys.hmacShaKeyFor(secret.getBytes()))
            .build()
            .parseClaimsJws(token)
            .getBody();
    }
}
```

```java
// JwtAuthFilter.java — extract and validate on every request

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = jwtUtil.validateToken(token);
                Long userId = Long.parseLong(claims.getSubject());

                UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(userId, null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER")));

                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (JwtException e) {
                // Invalid token — SecurityContext stays null
                // permitAll() routes proceed; protected routes get 403
            }
        }

        filterChain.doFilter(request, response);
    }
}
```

### Password Reset Flow

```
POST /api/auth/forgot-password  { email }
         │
         ▼
AuthService.forgotPassword(email):
  1. Look up user by email
     (Always return 200 — never reveal if email exists)
  2. Generate UUID token
  3. Save PasswordResetToken {
       token: uuid,
       email: email,
       expiresAt: now + 15 minutes,
       used: false
     }
  4. Send email via JavaMailSender:
     Subject: "Reset your Companion password"
     Body: {FRONTEND_BASE_URL}/reset-password?token={uuid}
         │
         ▼
POST /api/auth/reset-password  { token, newPassword }
         │
         ▼
AuthService.resetPassword(token, newPassword):
  1. Find PasswordResetToken by token string
  2. Check: token.used == false           → else 400
  3. Check: token.expiresAt > now         → else 400
  4. Find user by token.email
  5. user.password = BCrypt.encode(newPassword)
  6. user.token_version += 1   ← invalidates every JWT issued before the reset
  7. Save user
  8. Delete all reset tokens for this email (replay then fails at lookup)
  9. Return 200
```

### CORS Configuration (Production Fix)

The initial `SecurityConfig.java` had origins hardcoded to `localhost:3000`. In production, Vercel generated two separate preview URLs that both needed CORS access simultaneously.

```java
// BEFORE — broke in production
config.setAllowedOrigins(List.of("http://localhost:3000"));

// AFTER — reads from env var, supports multiple origins
@Value("${CORS_ALLOWED_ORIGINS:}")
private String allowedOriginsRaw;

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();

    List<String> origins = new ArrayList<>(List.of("http://localhost:3000"));
    if (allowedOriginsRaw != null && !allowedOriginsRaw.isBlank()) {
        for (String origin : allowedOriginsRaw.split(",")) {
            origins.add(origin.trim());
        }
    }

    config.setAllowedOrigins(origins);
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

**Production env var:**
```
CORS_ALLOWED_ORIGINS=https://companion-lime.vercel.app,https://companion-lqgbsvt5h-puru-s-projects.vercel.app
```

### Scheduled Jobs

```java
@Component
public class CircleScheduler {

    // Runs every day at midnight UTC
    // Marks circles whose end_date has passed as CONCLUDED
    @Scheduled(cron = "0 0 0 * * *")
    public void concludeExpiredCircles() {
        List<Circle> expired = circleRepository
            .findByStatusAndEndDateBefore(CircleStatus.ACTIVE, LocalDate.now());
        expired.forEach(c -> c.setStatus(CircleStatus.CONCLUDED));
        circleRepository.saveAll(expired);
    }

    // Runs every Monday at 00:00 UTC
    // Awards Badge of Honor to the top check-in performer per circle
    @Scheduled(cron = "0 0 0 * * MON")
    public void awardWeeklyBadges() {
        List<Circle> activeCircles = circleRepository
            .findByStatus(CircleStatus.ACTIVE);

        for (Circle circle : activeCircles) {
            // Find member with highest check-ins in last 7 days
            Optional<Long> topUserId = checkinRepository
                .findTopPerformerInCircle(circle.getId(),
                    LocalDate.now().minusDays(7), LocalDate.now());

            topUserId.ifPresent(userId -> {
                Badge badge = new Badge();
                badge.setCircle(circle);
                badge.setUser(userRepository.getReferenceById(userId));
                badge.setWeekStart(LocalDate.now().minusDays(6));
                badge.setWeekEnd(LocalDate.now());
                badgeRepository.save(badge);
            });
        }
    }
}
```

---

## 5. Low-Level Design (LLD) — Frontend

### Project Structure

```
companion-frontend/
├── app/
│   ├── page.tsx                  ← Landing page
│   ├── layout.tsx                ← Root layout (no MSAL — clean)
│   ├── login/
│   │   └── page.tsx              ← Email + password form
│   ├── register/
│   │   └── page.tsx              ← Username + email + password form
│   ├── dashboard/
│   │   └── page.tsx              ← User's circles overview
│   ├── circle/
│   │   └── [id]/
│   │       └── page.tsx          ← 3-column circle view
│   ├── profile/
│   │   └── page.tsx              ← User stats + badge history
│   ├── forgot-password/
│   │   └── page.tsx              ← Email input for reset link
│   └── reset-password/
│       └── page.tsx              ← New password form (reads ?token=)
│
├── lib/
│   └── api.ts                    ← All axios calls (withCredentials; cookie auth)
│
├── next.config.ts                ← /api/* rewrite proxy → backend (first-party cookie)
│
└── components/
    ├── Leaderboard.tsx
    ├── TaskList.tsx
    ├── BadgeSection.tsx
    ├── GoalProgressRing.tsx      ← SVG animated ring
    ├── ConclusionOverlay.tsx
    └── DeleteCircleModal.tsx
```

### Auth State Management

No Redux, no Zustand. The JWT itself lives in an **httpOnly cookie** the browser sends automatically — JS can't read it. `localStorage` holds only a non-sensitive `username`/`email` hint used for route guards and display; the real auth gate is the server's 401.

```typescript
// lib/api.ts — same-origin proxy + cookie auth
export const API_BASE = '';            // relative: /api/* is proxied to the backend
const BASE_URL = `${API_BASE}/api`;

// Auth rides on the httpOnly cookie; just send credentials on every request.
axios.defaults.withCredentials = true;

// Login sets the cookie server-side; we persist only the identity hint.
// (in app/login/page.tsx)
//   localStorage.setItem('username', res.data.username);
//   localStorage.setItem('email', res.data.email);

// Logout clears the cookie server-side, then wipes the local hint.
export const logoutUser = () =>
  axios.post(`${BASE_URL}/auth/logout`, {});

// Route guards check the hint (server still enforces via 401):
//   if (!localStorage.getItem('username')) router.push('/login');

// Usage in any component — no auth header needed, the cookie travels with it:
export const getMyCircles = () =>
  axios.get(`${BASE_URL}/circles/my`);

export const toggleTask = (taskId: number) =>
  axios.post(`${BASE_URL}/tasks/${taskId}/toggle`, {});
```

### Circle Page Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  CIRCLE PAGE — 3 Column Layout                                   │
│  app/circle/[id]/page.tsx                                        │
├────────────────────┬─────────────────────┬───────────────────────┤
│   LEADERBOARD      │      MY TASKS       │   BADGES + PROGRESS   │
│   (left col)       │    (center col)     │    (right col)        │
│                    │                     │                       │
│  🥇 Alice    9🔥  │  [+ Add Task]       │  ┌─────────────────┐  │
│  🥈 Bob      4🔥  │                     │  │  Goal Progress  │  │
│  🥉 Carol    2🔥  │  ✅ Morning run     │  │                 │  │
│                    │  ✅ Lift weights    │  │    ( SVG Ring ) │  │
│  ─────────────     │   ❌ Meditation     │  │     67% done    │  │
│  Member bars:      │                     │  │   43 days left  │  │
│  Alice  ██████     │  Progress: 66% ──   │  └─────────────────┘  │
│  Bob    ████░░     │  ██████░░░░         │                       │
│  Carol  ██░░░░     │                     │  Today's Progress:    │
│                    │  Threshold:         │  ✅ Threshold met!    │
│                    │  ≥ 50% to count     │                       │
│                    │                     │  Badge of Honor:      │
│                    │  [Leave Circle]     │  🏆 Alice (Week 3)   │
│                    │                     │  🏆 Alice (Week 2)   │
│                    │                     │  🏆 Bob   (Week 1)   │
│                    │                     │                       │
│                    │                     │  Invite Code:         │
│                    │                     │  [ XK7P2Q9R ] 📋     │
└────────────────────┴─────────────────────┴───────────────────────┘
```

### Goal Progress Ring (SVG)

```typescript
// components/GoalProgressRing.tsx
// Animated SVG ring, color-coded by urgency

const GoalProgressRing = ({ daysElapsed, totalDays, completionPct }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (completionPct / 100) * circumference;

  // Color by urgency: green → yellow → red
  const daysLeft = totalDays - daysElapsed;
  const color = daysLeft > 14 ? '#22c55e'   // green — plenty of time
              : daysLeft > 7  ? '#eab308'   // yellow — getting close
                               : '#ef4444'; // red — final week

  return (
    <svg viewBox="0 0 120 120" className="w-32 h-32">
      {/* Background track */}
      <circle cx="60" cy="60" r={radius}
        fill="none" stroke="#374151" strokeWidth="12" />
      {/* Progress arc */}
      <circle cx="60" cy="60" r={radius}
        fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      {/* Center text */}
      <text x="60" y="55" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
        {Math.round(completionPct)}%
      </text>
      <text x="60" y="72" textAnchor="middle" fill="#9ca3af" fontSize="10">
        {daysLeft} days left
      </text>
    </svg>
  );
};
```

### Leave Circle — Emotional Friction UX

The Leave Circle flow has two stages. The first is a soft warning. The second shows a rotating "roast" message. This was a deliberate product decision — leaving should feel like something.

```typescript
// Stage 1: Confirm intent
const [leaveStage, setLeaveStage] = useState<0 | 1 | 2>(0);

const roastMessages = [
  "Really? You're just going to abandon everyone?",
  "Your streak dies here. Is that what you want?",
  "The circle will notice you're gone.",
  "Quitters never win. Just saying.",
  "One more chance to stay strong..."
];

// Stage 2: Show roast, final confirm
{leaveStage === 2 && (
  <div className="leave-modal">
    <p className="roast">{roastMessages[Math.floor(Math.random() * roastMessages.length)]}</p>
    <button onClick={handleLeave} className="btn-danger">
      Leave anyway
    </button>
    <button onClick={() => setLeaveStage(0)} className="btn-secondary">
      Stay in the circle
    </button>
  </div>
)}
```

---

## 6. Database Schema

```sql
-- Users
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(50)  UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,           -- BCrypt hash
    is_admin    BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Password reset tokens (forgot password flow)
CREATE TABLE password_reset_tokens (
    id          BIGSERIAL PRIMARY KEY,
    token       VARCHAR(255) UNIQUE NOT NULL,    -- UUID
    email       VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,              -- now + 15 min
    used        BOOLEAN DEFAULT FALSE
);

-- Circles
CREATE TABLE circles (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    invite_code VARCHAR(8)   UNIQUE NOT NULL,   -- random 8-char alphanumeric
    creator_id  BIGINT REFERENCES users(id),
    status      VARCHAR(20)  DEFAULT 'ACTIVE',  -- ACTIVE | CONCLUDED | ARCHIVED
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    threshold   VARCHAR(20)  DEFAULT 'HALF',    -- ANY_TASK|HALF|ALL_TASKS|CUSTOM
    threshold_pct INT DEFAULT 50,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Goals (1-to-1 with circles, kept separate for flexibility)
CREATE TABLE goals (
    id          BIGSERIAL PRIMARY KEY,
    circle_id   BIGINT REFERENCES circles(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    category    VARCHAR(50)                     -- HEALTH|LEARNING|PRODUCTIVITY|etc
);

-- Circle membership
CREATE TABLE circle_members (
    id          BIGSERIAL PRIMARY KEY,
    circle_id   BIGINT REFERENCES circles(id) ON DELETE CASCADE,
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    joined_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE (circle_id, user_id)
);

-- Personal daily tasks (persists for circle duration)
CREATE TABLE circle_tasks (
    id          BIGSERIAL PRIMARY KEY,
    circle_id   BIGINT REFERENCES circles(id) ON DELETE CASCADE,
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Daily completions (date-scoped — this IS the "daily reset" mechanism)
CREATE TABLE task_checkins (
    id          BIGSERIAL PRIMARY KEY,
    task_id     BIGINT REFERENCES circle_tasks(id) ON DELETE CASCADE,
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    circle_id   BIGINT REFERENCES circles(id) ON DELETE CASCADE,
    date        DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE (task_id, user_id, date)             -- one checkin per task per day
);

-- Streaks (one row per user per circle)
CREATE TABLE user_streaks (
    id                  BIGSERIAL PRIMARY KEY,
    circle_id           BIGINT REFERENCES circles(id) ON DELETE CASCADE,
    user_id             BIGINT REFERENCES users(id) ON DELETE CASCADE,
    current_streak      INT DEFAULT 0,
    longest_streak      INT DEFAULT 0,          -- high-water mark, never decrements
    last_checkin_date   DATE,
    UNIQUE (circle_id, user_id)
);

-- Weekly badges
CREATE TABLE badges (
    id          BIGSERIAL PRIMARY KEY,
    circle_id   BIGINT REFERENCES circles(id) ON DELETE CASCADE,
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    week_start  DATE NOT NULL,
    week_end    DATE NOT NULL,
    awarded_at  TIMESTAMP DEFAULT NOW()
);
```

### Entity Relationship Diagram

```
users ───────────────────────────────────────────────────┐
  │                                                      │
  │ (creator_id)           (user_id)                     │
  ▼                            │                         │
circles ◄───── circle_members ─┘                         │
  │                                                      │
  │ ON DELETE CASCADE                                    │
  ├─────► goals                                          │
  ├─────► circle_members ──────────────────► users       │
  ├─────► circle_tasks ──────────────────── users        │
  │           │                                          │
  │           │ ON DELETE CASCADE                        │
  │           └──► task_checkins ──────── users          │
  ├─────► user_streaks ───────────────────── users       │
  └─────► badges ─────────────────────────── users ◄─────┘

password_reset_tokens (standalone — linked by email string, not FK)
```

### The Daily Reset Mechanism

```
❌ WRONG approach (what I did NOT do):
   Run a nightly job that DELETEs all task_checkins
   Then RECREATEs empty tasks for each member
   → Race conditions, data loss risk, complex scheduler

✅ RIGHT approach (what Companion does):
   circle_tasks rows NEVER get deleted during a circle's lifetime.
   task_checkins rows are date-scoped with a UNIQUE constraint:
   (task_id, user_id, date)

   "Today's tasks" query:
   SELECT ct.*, tc.id as checkin_id
   FROM circle_tasks ct
   LEFT JOIN task_checkins tc
     ON tc.task_id = ct.id
     AND tc.user_id = ?
     AND tc.date = CURRENT_DATE       ← the "reset" is here
   WHERE ct.circle_id = ?
   AND ct.user_id = ?

   Yesterday's checkins simply don't match today's date.
   They're invisible. No deletion needed.

   Toggle completion:
   INSERT INTO task_checkins (task_id, user_id, circle_id, date)
   VALUES (?, ?, ?, CURRENT_DATE)
   ON CONFLICT (task_id, user_id, date) DO NOTHING

   Toggle un-completion:
   DELETE FROM task_checkins
   WHERE task_id = ? AND user_id = ? AND date = CURRENT_DATE
```

---

## 7. Feature Implementation Details

### Delete Circle — Cascade Order

Deleting a circle requires careful FK cascade ordering to avoid constraint violations:

```
Delete order (must be in this sequence):
  1. task_checkins     (references circle_tasks and circles)
  2. user_streaks      (references circles)
  3. badges            (references circles)
  4. circle_tasks      (references circles)
  5. circle_members    (references circles)
  6. goals             (references circles)
  7. circles           ← finally safe to delete

All configured as ON DELETE CASCADE in schema.
Spring Data: circleRepository.delete(circle) triggers the cascade.
```

The frontend requires typing the circle name to unlock the delete button — a deliberate friction pattern to prevent accidental deletion.

### Forgot Password — Security Detail

```
POST /api/auth/forgot-password { email: "anyone@example.com" }

Response is ALWAYS:
  200 OK { "message": "If that email exists, a link has been sent." }

Why: Never return 404 for "email not found."
If we did, an attacker could enumerate which emails are registered
by trying addresses and checking the response code.

The 15-minute expiry and single-use flag (used: true after consumption)
prevent replay attacks even if the email is intercepted.
```

### Email Verification (Sign-up Gate)

```
POST /api/auth/register
  → save user (is_verified = false)
  → create EmailVerificationToken (UUID, 24h expiry)
  → email FRONTEND_BASE_URL/verify-email?token=…   (no JWT returned)

GET /api/auth/verify-email?token=…
  → valid & unexpired   → is_verified = true, tokens cleared → 200
  → invalid / expired   → 400  (frontend: "link expired, request a new one")

POST /api/auth/login
  → credentials OK but is_verified = false → 403 ForbiddenException

Notes:
  • EmailVerificationTokenRepository.deleteByEmail is @Modifying @Transactional
    (a derived delete needs an active transaction, else register/verify 500).
  • Seeded admin (DataInitializer) is created is_verified = true so the gate
    can never lock it out.
  • Migration for existing prod users (no lockout window):
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified boolean
        NOT NULL DEFAULT true;   -- new signups still insert false
```

### Change Username

```
PUT /api/auth/.. → PUT /api/profile/username   { username }   (auth required)
  → validate 2–30 chars
  → 409 if already taken
  → User.username updated, returns refreshed ProfileResponse

Safe because nothing is denormalized: createdBy, members, badges, check-ins
and the leaderboard all read the name live through the User FK, and JWT auth
keys off email — so the change propagates everywhere and never breaks a session.
The profile page edits it inline and updates localStorage.
```

### Badge Award Logic

```
Every Monday at 00:00 UTC, for each ACTIVE circle:

  SELECT user_id, COUNT(*) as checkin_count
  FROM task_checkins
  WHERE circle_id = ?
    AND date >= (NOW() - INTERVAL '7 days')
    AND date <= NOW()
  GROUP BY user_id
  ORDER BY checkin_count DESC
  LIMIT 1

  → Award Badge of Honor to that user_id
  → Store: week_start, week_end, circle_id, user_id

Tie-breaking: if two members have equal checkins,
the one with lower user_id wins (insertion order — fair enough for now).
```

---

## 8. The Azure B2C Rabbit Hole

> This section is the full honest post-mortem of a two-week detour. It's here because the learnings are real and the eventual decision to revert was deliberate, not a failure.

### What We Were Trying to Do

Replace Spring Boot's own JWT system with Azure Entra ID B2C to get:
- Email OTP verification without building it ourselves
- Enterprise-grade password resets out of the box
- MFA support
- SSO-readiness for Google/Microsoft login
- Free up to 50,000 MAU

### The Core Conflict: MSAL + Next.js App Router

```
WHAT MSAL EXPECTS (loginPopup flow):
────────────────────────────────────────────────────────────
  Main Window          Popup Window           Azure B2C
       │                    │                      │
       │── loginPopup() ───►│── navigate to B2C ──►│
       │                    │                      │
       │   (waiting...)     │◄── redirect back ────│
       │                    │   with #id_token=... │
       │                    │── close() ──────────►│
       │◄── token ───────── │                       │
       │   received         │                      │

WHAT ACTUALLY HAPPENED (Next.js App Router):
────────────────────────────────────────────────────────────
  Main Window          Popup Window           Azure B2C
       │                    │                      │
       │── loginPopup() ───►│── navigate to B2C ──►│
       │                    │                      │
       │   (waiting...)     │◄── redirect back ────│
       │                    │   to localhost:3000  │
       │                    │                      │
       │                    │  Next.js App Router  │
       │                    │  loads FULL APP  ◄───│
       │                    │  including           │
       │                    │  MsalProvider again  │
       │                    │  (second instance)   │
       │                    │                      │
       │                    │  window.close()      │
       │                    │  runs too late       │
       │                    │  after hydration     │
       │                    │                      │
       │   TIMEOUT ◄─────── │                      │
   redirect_bridge_timeout  │                      │
```

### The Infinite Redirect Loop (loginRedirect)

```
MSAL behavior: fires silent background iframes to probe B2C for token renewal.
These iframes load YOUR redirect URI (/auth/callback).

What our callback did (broken):
─────────────────────────────────────────────────────────
  /auth/callback loads
       │
       │ No #id_token in URL hash (this is just MSAL's probe)
       │
       ▼
  router.push('/login')   ← BUG: no window.parent check
       │
       │ This push ESCAPES the iframe boundary
       │ and redirects the MAIN window
       ▼
  Main window goes to /login
       │
       │ Dashboard auth guard finds no token
       ▼
  Main window tries to go to /dashboard
  MSAL fires another silent iframe to probe B2C
       │
       ▼
  /auth/callback loads again in iframe
  Finds no hash → router.push('/login')
  Main window redirects again
       │
       ▼
  ∞ LOOP — never reaches dashboard

THE FIX:
─────────────────────────────────────────────────────────
// app/auth/callback/page.tsx
useEffect(() => {
  // Are we inside MSAL's background iframe?
  if (window !== window.parent) {
    return; // bail silently — let MSAL handle it
  }
  // Only proceed with token extraction if we're the main window
  handleRedirectPromise();
}, []);
```

### All Errors Encountered

| Error | Root Cause | Fix Applied |
|-------|-----------|-------------|
| `redirect_bridge_timeout` | MSAL v5 popup mechanism conflicts with Next.js hydration | Downgraded to MSAL v4 |
| `timed_out` | Popup never closes — Next.js loads full app inside it | Attempted `window.close()` (too late), `public/close.html` (too early) |
| `no_token_request_cache_error` | MSAL stores request state in sessionStorage on /login; /auth/callback is a new page | Switched to localStorage; cache key still mismatched |
| `interaction_in_progress` | Stale `msal.interaction.status` lock from previous failed attempt | Clear from sessionStorage before each `loginRedirect()` call |
| `AADB2C90043` | `prompt: 'create'` not supported by B2C | Removed from loginPopup call |
| `AADB2C90006` | Redirect URI not registered in Azure App Registration | Added correct URIs in Azure Portal |
| `stubbed_public_client_application_called` | Children rendered before MSAL finished initializing | Don't render children until `instance.initialize()` resolves |
| MFA cost risk | `B2C_1_signin` had MFA Always On — triggers paid phone verification | Disabled MFA on all user flows |

### What Was Eventually Fixed

A working state was achieved after three targeted changes:

```typescript
// Fix 1: iframe guard in /auth/callback
if (window !== window.parent) return;

// Fix 2: msalConfig.ts
const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
    authority: b2cPolicies.authorities.signIn.authority,
    knownAuthorities: [b2cPolicies.authorityDomain],
    redirectUri: 'http://localhost:3000/auth/callback',
    navigateToLoginRequestUrl: false,  // ← Fix 3: stop local pre-redirect
  },
  cache: {
    cacheLocation: 'localStorage',    // not sessionStorage
    storeAuthStateInCookie: false,
  }
};
```

### Why We Reverted Anyway

The working state was **fragile by construction**:

```
MSAL v4 pinned     ← v5 reintroduces popup conflict
Next.js 15.3.0     ← v16 forces Turbopack, breaks Tailwind v3
MFA disabled       ← could be accidentally re-enabled in Azure Portal
iframe hack        ← breaks if MSAL changes probe behavior
localhost URIs     ← entire integration only tested on http://

Any one of these changing breaks auth in ways that are
hard to debug without deep knowledge of all of the above.
```

**Decision:** Revert to Spring Boot JWT for Phases 3–5. Re-integrate B2C in Phase 8 with:
- Stable Vercel domain (not localhost)
- HTTPS enforced
- Dedicated staging environment
- `loginRedirect` only (never `loginPopup`)
- MSAL version pinned with exact version in `package.json` (no `^` or `~`)

### Positive Learnings from the B2C Work

Even though we reverted, the investigation produced deep, durable knowledge:

**MSAL internals:**
- Background iframes for silent token renewal load your actual redirect URI — always add `window.parent` guards
- MSAL v4 vs v5 have fundamentally different popup completion mechanisms
- `handleRedirectPromise()` must be called on every page load, not just the callback page
- The `emails` claim is a `StringCollection`, not a string — always `claims.emails[0]`

**Spring Security:**
- Multiple JWT validators can coexist — RS256 (B2C) and HS256 (local) as separate filters
- Peeking at the JWT header `alg` field is a safe, zero-cost way to route to the correct validator
- Filter order matters: RS256 filter before HS256 so B2C tokens are claimed first

**Next.js App Router:**
- SSR means `useEffect` and `window` unavailable during server render — always guard with `typeof window !== 'undefined'`
- Page navigations are not full page loads — sessionStorage persists but MSAL request cache tied to a URL context may not

---

## 9. Deployment — Phase by Phase

### Phase Status

| Phase | Task | Status |
|-------|------|--------|
| 1 | Resource Group (`companion-rg`, East Asia) | ✅ Done |
| 2 | Azure B2C Auth — attempted, reverted to own JWT | ✅ Done (reverted) |
| 3 | Azure PostgreSQL Flexible Server B1ms | ✅ Done |
| 4 | Dockerize Spring Boot + Azure Container Registry | ✅ Done |
| 5 | Azure Container Apps, scale-to-zero | ✅ Done |
| 6 | Vercel frontend deployment | ✅ Done |
| + | Email verification + login gate (`is_verified`) | ✅ Done (v4) |
| + | UI redesign — warm theme + shared component library | ✅ Done |
| + | Change username from profile · env-driven CORS cleanup | ✅ Done (v4) |
| 7 | GitHub Actions CI/CD pipeline | 🔲 Planned |
| 8 | FastAPI AI microservice (Claude API) | 🔲 Planned |

---

### Phase 3 — Azure PostgreSQL

```
Server: companion-db-01.postgres.database.azure.com
Region: East Asia | Version: PostgreSQL 18.3
Compute: Burstable B1ms (1 vCore, 2 GiB RAM)
Storage: 32 GiB | Backup: 7 days

⚠️  GOTCHA: The Azure Portal defaults to naming the database
    with a hyphen: companion-db
    PostgreSQL doesn't allow hyphens in JDBC connection strings
    without quoting. Must create manually:
    
    CREATE DATABASE companion_db;   ← underscore, not hyphen
    
JDBC URL:
  jdbc:postgresql://companion-db-01.postgres.database.azure.com:5432/companion_db
```

---

### Phase 4 — Docker Build & Push

```dockerfile
# Dockerfile
FROM eclipse-temurin:19-jre-alpine

WORKDIR /app

# JAR name must match pom.xml artifactId exactly
# default: backend-0.0.1-SNAPSHOT.jar (NOT companion-backend-...)
COPY target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

```bash
# Build steps (from companion-backend/)

# 1. Package
./mvnw clean package -DskipTests

# 2. Authenticate with Azure
az login
az acr login --name companionregistry01

# 3. Build for linux/amd64
# ⚠️  --provenance=false is REQUIRED
# Without it, Docker creates a multi-platform manifest list
# Azure Container Apps rejects this with "invalid operating system"
docker build \
  --platform linux/amd64 \
  --provenance=false \
  -t companionregistry01.azurecr.io/companion-backend:v1 .

# 4. Push
docker push companionregistry01.azurecr.io/companion-backend:v1
```

**Windows ARM64 setup notes:**
```
WSL2 must be installed BEFORE Docker Desktop:
  wsl --install

If C:\ProgramData\DockerDesktop ownership error on install:
  rmdir /S /Q C:\ProgramData\DockerDesktop
  Then reinstall Docker Desktop as Administrator

ACR Tasks are NOT available on Azure for Students.
All builds must be local. No remote build available.
```

---

### Phase 5 — Azure Container Apps

```
App: companion-backend
Environment: companion-env
Image: companionregistry01.azurecr.io/companion-backend:v1
CPU: 0.5 cores | Memory: 1 Gi
Min replicas: 0 (scale-to-zero — saves cost when idle)
Max replicas: 3
Ingress: External, HTTP, port 8080

URL: https://companion-backend.ambitiousisland-bb0c2789.eastasia.azurecontainerapps.io
```

**Environment variables (set in Container App secrets):**

```
DB_URL         → jdbc:postgresql://companion-db-01.postgres...
DB_USERNAME    → companionadmin
DB_PASSWORD    → [secret]
JWT_SECRET     → [min 32 char random string]
MAIL_HOST      → smtp.gmail.com
MAIL_PORT      → 587
MAIL_USERNAME  → [gmail address]
MAIL_PASSWORD  → [gmail app password — 16 chars, no spaces]
FRONTEND_BASE_URL → https://companion-lime.vercel.app   ← SINGLE origin only (see warning)
CORS_ALLOWED_ORIGINS → https://companion-lime.vercel.app,https://companion-lqgbsvt5h-...
```

> ⚠️ **`FRONTEND_BASE_URL` must be ONE origin, not a list.** It is concatenated into the reset/verify email links. If you paste the comma-separated `CORS_ALLOWED_ORIGINS` value into it, the link becomes malformed and email clients linkify the embedded second (stale) URL — sending users to an old build. `CORS_ALLOWED_ORIGINS` is the only var that takes a comma-separated list.

**Cookie attributes** (defaults are prod-safe, so usually unset in prod):
```
COOKIE_SECURE   → true   (default; keep true in prod over https)
COOKIE_SAMESITE → None   (default; first-party through the proxy)
```
> **Local dev:** running `next dev` over http means a `Secure` cookie is dropped by the browser. Set `COOKIE_SECURE=false` and `COOKIE_SAMESITE=Lax` on the local backend, or login won't stick.

**Vercel (frontend) env:** the `/api/*` rewrite target resolves from `BACKEND_API_URL` (preferred) or falls back to `NEXT_PUBLIC_API_URL`. Point it at the backend Container App URL.

> Every env var change creates a new Container App **revision**. This is normal. It takes ~60 seconds. Don't assume the change is instant.

---

### Phase 6 — Vercel Frontend

```
Platform: Vercel Hobby (Free)
Repo: github.com/heyitspuru/Companion
Root directory: companion-frontend
Branch: main → auto-deploy on push
Production URL: https://companion-lime.vercel.app
```

**Issues resolved during first deploy:**

```
Issue 1: ESLint blocking build
  Error: @typescript-eslint/no-explicit-any, react/no-unescaped-entities
  Fix: downgrade to "warn" in eslint.config.mjs
  
Issue 2: Next.js CVE-2025-66478 security vulnerability
  Fix: Vercel opened auto-PR → merged → upgraded to 15.3.8
  
Issue 3: companion-backend detected as git submodule
  Cause: nested .git folder in companion-backend/
  Fix: rm -rf companion-backend/.git
       git add companion-backend
       git commit
       
Issue 4: All API calls blocked by CORS
  Cause: SecurityConfig.java had localhost:3000 hardcoded
  Fix: Read CORS_ALLOWED_ORIGINS from env var (see Section 4)
  
Issue 5: Two preview URLs, both need CORS
  Fix: Comma-separate both origins in CORS_ALLOWED_ORIGINS env var
```

---

### Redeployment Process (future backend updates)

```bash
# From companion-backend/ after any code change:
./mvnw clean package -DskipTests

# Increment version tag: v1 → v2 → v3 etc.
docker build --platform linux/amd64 --provenance=false \
  -t companionregistry01.azurecr.io/companion-backend:v2 .

docker push companionregistry01.azurecr.io/companion-backend:v2

# Then in Azure Portal:
# Container App → Edit and deploy → update image tag → Create new revision
```

> Phase 7 (GitHub Actions) will automate this entire flow on every push to `main`.

---

## 10. Performance: The N+1 Problem

### What Is N+1?

```
N+1 means: 1 query to fetch a list of N items,
           then N additional queries to fetch details for each item.

Example (broken leaderboard, 20 members):
  Query 1: SELECT * FROM circle_members WHERE circle_id = 5
           → returns 20 members
  
  For each of 20 members:
    Query 2:  SELECT * FROM user_streaks WHERE user_id = ?
    Query 3:  SELECT COUNT(*) FROM task_checkins WHERE user_id = ? AND date = today
    Query 4:  SELECT COUNT(*) FROM circle_tasks WHERE user_id = ?
    Query 5:  SELECT MAX(longest_streak) FROM user_streaks WHERE user_id = ?
  
  Total: 1 + (4 × 20) = 81 database queries per leaderboard render.
  The leaderboard re-renders on EVERY task toggle.
  A circle with 20 members doing tasks = hundreds of DB calls per session.
```

### The Fix

```java
// CircleService.java — BEFORE (N+1)
public List<LeaderboardEntry> getLeaderboard(Long circleId) {
    List<CircleMember> members = memberRepo.findByCircleId(circleId);
    return members.stream().map(m -> {
        UserStreak streak = streakRepo.findByUserAndCircle(m.getUserId(), circleId); // N queries
        int todayCount = checkinRepo.countToday(m.getUserId(), circleId);            // N queries
        int totalTasks = taskRepo.countByUserAndCircle(m.getUserId(), circleId);     // N queries
        return buildEntry(m, streak, todayCount, totalTasks);
    }).collect(toList());
}

// CircleService.java — AFTER (4 flat queries)
public List<LeaderboardEntry> getLeaderboard(Long circleId) {
    // 4 queries total, regardless of member count

    // Query 1: all streaks for this circle
    Map<Long, UserStreak> streakMap = streakRepo
        .findAllByCircleId(circleId)
        .stream()
        .collect(toMap(s -> s.getUserId(), s -> s));

    // Query 2: today's checkin counts per user
    LocalDate today = LocalDate.now();
    Map<Long, Long> checkinMap = checkinRepo
        .countTodayByCircleGroupedByUser(circleId, today)
        .stream()
        .collect(toMap(r -> r.getUserId(), r -> r.getCount()));

    // Query 3: total tasks per user in this circle
    Map<Long, Long> taskMap = taskRepo
        .countByCircleGroupedByUser(circleId)
        .stream()
        .collect(toMap(r -> r.getUserId(), r -> r.getCount()));

    // Query 4: all members
    List<User> members = memberRepo.findUsersByCircleId(circleId);

    // Assemble in Java — O(N) loop, zero DB calls
    return members.stream().map(user -> {
        UserStreak streak = streakMap.getOrDefault(user.getId(), new UserStreak());
        long completed = checkinMap.getOrDefault(user.getId(), 0L);
        long total = taskMap.getOrDefault(user.getId(), 1L);
        double completionPct = total > 0 ? (double) completed / total * 100 : 0;

        return LeaderboardEntry.builder()
            .user(user)
            .currentStreak(streak.getCurrentStreak())
            .longestStreak(streak.getLongestStreak())
            .todayCompletionPct(completionPct)
            .build();
    })
    .sorted(Comparator
        .comparingInt(LeaderboardEntry::getCurrentStreak).reversed()
        .thenComparingDouble(LeaderboardEntry::getTodayCompletionPct).reversed()
        .thenComparingInt(LeaderboardEntry::getLongestStreak).reversed())
    .collect(toList());
}
```

### Profile Page N+1 Fix

```java
// ProfileService.java — BEFORE
public ProfileDTO getProfile(Long userId) {
    List<UserStreak> allStreaks = streakRepo.findAll(); // ENTIRE TABLE
    List<TaskCheckin> allCheckins = checkinRepo.findAll(); // ENTIRE TABLE
    // then filter in Java... unacceptable at scale
}

// ProfileService.java — AFTER (7 targeted queries, no findAll)
public ProfileDTO getProfile(Long userId) {
    int totalCircles     = memberRepo.countByUserId(userId);
    int totalBadges      = badgeRepo.countByUserId(userId);
    int longestEver      = streakRepo.findMaxLongestStreakByUserId(userId);
    long totalCompleted  = checkinRepo.countByUserId(userId);
    List<CircleStatDTO> circleStats = circleRepo.findCircleStatsForUser(userId);
    List<Badge> recentBadges = badgeRepo.findTop10ByUserIdOrderByAwardedAtDesc(userId);
    // ... assemble DTO
}
```

**Result:** Profile load went from potentially scanning entire tables to 7 indexed queries regardless of platform size.

---

## 11. Known Issues & Open Work

| Issue | Root Cause | Fix | Priority |
|-------|-----------|-----|----------|
| Password reset link expires immediately in production | `LocalDateTime.now()` timezone mismatch — container runs UTC, Hibernate not configured for UTC | Add `hibernate.jdbc.time_zone=UTC` to `application.yml` | 🔴 High |
| Gmail SMTP in production | Gmail rate limits; less reliable than transactional email | Switch to Resend.com (3,000 emails/month free, 3-line code change) | 🟡 Medium |
| ESLint `any` / unescaped errors | TypeScript strict mode, deferred during initial deployment | Fix each file individually | 🟢 Low |

### Phase 7 — CI/CD (Planned)

```yaml
# .github/workflows/deploy-backend.yml (planned)
name: Deploy Backend

on:
  push:
    branches: [main]
    paths: ['companion-backend/**']

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Java 19
        uses: actions/setup-java@v3
        with: { java-version: '19', distribution: 'temurin' }
      - name: Build JAR
        run: ./mvnw clean package -DskipTests
        working-directory: companion-backend
      - name: Login to ACR
        uses: azure/docker-login@v1
        with:
          login-server: companionregistry01.azurecr.io
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}
      - name: Build & push Docker image
        run: |
          docker build --platform linux/amd64 --provenance=false \
            -t companionregistry01.azurecr.io/companion-backend:${{ github.sha }} .
          docker push companionregistry01.azurecr.io/companion-backend:${{ github.sha }}
      - name: Deploy new revision
        uses: azure/container-apps-deploy-action@v1
        with:
          containerAppName: companion-backend
          resourceGroup: companion-rg
          imageToDeploy: companionregistry01.azurecr.io/companion-backend:${{ github.sha }}
```

### Phase 8 — AI Microservice (Planned)

```
FastAPI (Python) microservice calling the Anthropic Claude API.

P1 features:
  → Daily Motivation Message: personalized nudge based on streak data
  → Goal Clarity Assistant: refine vague goals into specific, measurable ones

P2 features:
  → Weekly Circle Recap: summary of the circle's collective progress
  → Streak Risk Alert: warn members at risk of breaking a streak

P3 features:
  → Circle Health Score: aggregate engagement metric
  → Circle Conclusion Summary: AI-written wrap-up when a circle concludes

Architecture:
  Spring Boot backend → HTTP → FastAPI microservice → Anthropic API
  FastAPI deployed as a second Azure Container App (same environment)
  Claude model: claude-sonnet-4-20250514
```

---

## 12. Lessons Learned

### Engineering Decisions

**1. Don't integrate OAuth during local development**
Azure B2C works correctly when redirect URIs are stable, HTTPS is enforced, and the domain is real. Localhost is none of those things. The entire B2C detour would have been 2 hours of work instead of 2 weeks if we'd waited for a Vercel deployment.

**2. Write query counts into code review from day one**
N+1 problems are invisible in development (2 users, instant response). They're catastrophic in production (200 users, leaderboard on every task toggle). The pattern to watch for: any loop that contains a database call.

**3. `permitAll()` does not mean filters don't run**
Spring Security's `permitAll()` means "don't block the request if unauthenticated." Filters still execute. This is the right behavior, but it caught me off guard when debugging auth issues on public endpoints.

**4. Environment variables for everything that changes between environments**
Not just secrets — CORS origins, base URLs, email providers. If it's hardcoded in a Spring Boot config file, it will break on first deploy.

**5. Scale-to-zero is the right default for student/early-stage deployments**
Azure Container Apps with min replicas = 0 costs nothing when idle. The cold start (5–10 seconds) is acceptable for a project at this stage. The alternative (min replicas = 1) costs money 24/7.

### Technical Knowledge Gained

**Spring Boot:**
- Filter chain ordering is explicit and matters — wrong order means wrong behavior, not an error
- `@Scheduled` cron expressions use UTC in containerized environments — design accordingly
- `LocalDateTime.now()` in a UTC container compared against a DB timestamp without timezone config = silent bugs

**Next.js App Router:**
- Every page is a full React app — popups and iframes get the full framework, not a thin redirect page
- `sessionStorage` from page A is not available on page B after a full navigation
- Turbopack (Next.js 16 default) doesn't support PostCSS plugins the same way webpack does — check compatibility before upgrading

**Docker / Azure:**
- `--provenance=false` is required when building for Azure Container Apps to avoid multi-platform manifest rejection
- ACR Tasks not available on Azure for Students — always build locally
- Every Container App env var change = new revision = ~60 seconds propagation time
- Nested `.git` directories in subdirectories are treated as submodules by both Git and CI systems

**Auth Architecture:**
- The sync endpoint pattern (frontend sends external token, backend validates and returns local token) correctly isolates auth provider concerns from the API layer — keep this for Phase 8 B2C re-integration
- BCrypt rounds: Spring Boot default is 10 rounds — adequate for current scale
- JWT expiry: 24 hours is a reasonable default; consider refresh tokens at scale

---

## Live URLs

| Service | URL |
|---------|-----|
| Frontend (production) | https://companion-lime.vercel.app |
| Backend API | https://companion-backend.ambitiousisland-bb0c2789.eastasia.azurecontainerapps.io |
| Database host | `companion-db-01.postgres.database.azure.com` |

---

*Built with dedication — Companion is more than a project.*
