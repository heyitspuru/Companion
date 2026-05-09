# Companion Repository Context

This document is a quick navigation guide for the Companion monorepo. It summarizes the backend, frontend, and the main contract points between them so a contributor or agent can understand the system without reading every file.

## 1. Repository Layout

```text
companion-backend/
  src/main/java/com/companion/backend/
    BackendApplication.java
    auth/
    badge/
    checkin/
    circle/
    config/
    goal/
    task/
    user/
  src/main/resources/
    application.yml
    application-local.yml

companion-frontend/
  app/
    page.tsx
    login/page.tsx
    register/page.tsx
    auth/callback/page.tsx
    dashboard/page.tsx
    circle/[id]/page.tsx
    profile/page.tsx
  lib/
    api.ts
    msalConfig.ts
  types/index.ts
```

## 2. Backend Overview

The backend is a Spring Boot application with Spring Security, JPA, validation, JWT auth, and scheduled badge awarding.

### Entry Point

- [BackendApplication.java](companion-backend/src/main/java/com/companion/backend/BackendApplication.java) starts the Spring Boot app and enables scheduling.

### Core Configuration

- [SecurityConfig.java](companion-backend/src/main/java/com/companion/backend/config/SecurityConfig.java) defines the security filter chain, CORS policy, JWT auth filter order, and stateless session setup.
- [JwtUtil.java](companion-backend/src/main/java/com/companion/backend/config/JwtUtil.java) generates and validates local HS256 JWTs.
- [application.yml](companion-backend/src/main/resources/application.yml) contains datasource, JWT, Azure B2C, and CORS settings.

### Authentication Flow

- [AuthController.java](companion-backend/src/main/java/com/companion/backend/auth/AuthController.java) exposes `/api/auth/register`, `/api/auth/login`, and `/api/auth/sync`.
- [AuthService.java](companion-backend/src/main/java/com/companion/backend/auth/AuthService.java) handles local registration/login and the Entra B2C sync flow.
- `SyncRequest`, `LoginRequest`, `RegisterRequest`, and `AuthResponse` are the auth DTOs.

High-level auth behavior:

- Local username/password users get a backend-issued HS256 JWT.
- Entra B2C users sign in on the frontend, then call `/api/auth/sync` to create or look up the local user record.
- The backend returns a local JWT after sync so the frontend can call the rest of the API with the same token model.

### Domain Modules

#### `auth`

Handles registration, login, and Entra B2C sync.

#### `circle`

- [CircleController.java](companion-backend/src/main/java/com/companion/backend/circle/CircleController.java) handles circle creation, joining, listing, lookup, and leaderboard access.
- [CircleService.java](companion-backend/src/main/java/com/companion/backend/circle/CircleService.java) builds circle responses, manages membership, and computes leaderboard entries.
- `Circle`, `CircleMember`, `CircleRepository`, `CircleMemberRepository`, `CreateCircleRequest`, `CircleResponse`, `LeaderboardEntry`, and `CompletionThreshold` define the circle model and API payloads.

#### `checkin`

- [CheckInController.java](companion-backend/src/main/java/com/companion/backend/checkin/CheckInController.java) exposes one-tap check-in and history endpoints.
- [CheckInService.java](companion-backend/src/main/java/com/companion/backend/checkin/CheckInService.java) records daily check-ins and updates streaks.
- `CheckIn`, `Streak`, `CheckInRepository`, `StreakRepository`, and `CheckInResponse` model the check-in data.

#### `task`

- [TaskController.java](companion-backend/src/main/java/com/companion/backend/task/TaskController.java) handles task CRUD, toggling, and circle summaries.
- [TaskService.java](companion-backend/src/main/java/com/companion/backend/task/TaskService.java) owns task state changes, daily completion calculations, and streak updates based on completion thresholds.
- `CircleTask`, `TaskCheckin`, `CircleTaskRepository`, `TaskCheckinRepository`, `TaskResponse`, `TaskCheckinResponse`, and `MemberTaskSummary` define task handling.

#### `badge`

- [BadgeController.java](companion-backend/src/main/java/com/companion/backend/badge/BadgeController.java) exposes badge retrieval and a manual trigger endpoint.
- [BadgeService.java](companion-backend/src/main/java/com/companion/backend/badge/BadgeService.java) awards weekly badges and runs on a schedule.
- `Badge`, `BadgeRepository`, and `BadgeResponse` define badge data.

#### `user`

- [ProfileController.java](companion-backend/src/main/java/com/companion/backend/user/ProfileController.java) exposes `/api/profile`.
- [ProfileService.java](companion-backend/src/main/java/com/companion/backend/user/ProfileService.java) aggregates per-user stats across circles, badges, tasks, goals, and streaks.
- `User`, `UserRepository`, and `ProfileResponse` define the user/profile model.

#### `goal`

Goal data is attached to circles and drives progress calculations in profile and circle views.

- `Goal`, `GoalRepository`, and `GoalCategory` define the goal model.

#### `config`

Contains security, JWT, and auth-related infrastructure such as filters and user details handling.

## 3. Frontend Overview

The frontend is a Next.js app using MSAL for Entra B2C login and Axios for backend API calls.

### App Routes

- [app/page.tsx](companion-frontend/app/page.tsx) is the landing page.
- [app/login/page.tsx](companion-frontend/app/login/page.tsx) handles Microsoft sign-in and backend sync.
- [app/register/page.tsx](companion-frontend/app/register/page.tsx) handles Microsoft sign-up and backend sync.
- [app/auth/callback/page.tsx](companion-frontend/app/auth/callback/page.tsx) processes redirect-style auth callback tokens.
- [app/dashboard/page.tsx](companion-frontend/app/dashboard/page.tsx) is the main circle dashboard and creation/join flow.
- [app/circle/[id]/page.tsx](companion-frontend/app/circle/[id]/page.tsx) is the circle detail screen with tasks, leaderboard, badges, and check-ins.
- [app/profile/page.tsx](companion-frontend/app/profile/page.tsx) shows aggregate user stats.

### Shared Frontend Support

- [lib/api.ts](companion-frontend/lib/api.ts) wraps all backend calls with Axios.
- [lib/msalConfig.ts](companion-frontend/lib/msalConfig.ts) configures Azure B2C/MSAL.
- [types/index.ts](companion-frontend/types/index.ts) defines the frontend data shapes shared across pages.

## 4. Frontend to Backend Contract

The frontend talks to the backend through the following endpoints in [lib/api.ts](companion-frontend/lib/api.ts):

- Auth: `POST /api/auth/sync`
- Circles: `POST /api/circles/create`, `POST /api/circles/join/{inviteCode}`, `GET /api/circles/my`, `GET /api/circles/{id}`, `GET /api/circles/{id}/leaderboard`
- Check-ins: `POST /api/checkins/circle/{circleId}`, `GET /api/checkins/circle/{circleId}/today`, `GET /api/checkins/circle/{circleId}/my`
- Badges: `GET /api/badges/circle/{circleId}`, `GET /api/badges/my`
- Tasks: `POST /api/tasks/circle/{circleId}`, `DELETE /api/tasks/{taskId}`, `GET /api/tasks/circle/{circleId}/my`, `POST /api/tasks/{taskId}/toggle`, `GET /api/tasks/circle/{circleId}/summary`, `PUT /api/tasks/{taskId}`

### Auth Token Model

- The frontend stores the backend-issued JWT in `localStorage` under `token`.
- Every authenticated Axios call sends `Authorization: Bearer <token>`.
- The same token is used after either local auth or Entra B2C sync.

## 5. Key Data Shapes

The frontend types in [types/index.ts](companion-frontend/types/index.ts) mirror backend responses for:

- users and auth responses
- circles and members
- check-ins and streaks
- badges
- tasks and task summaries
- leaderboard entries

## 6. Navigation Notes

- Circle progress and goal timing are calculated both in the backend and in the frontend views, so changes to goal dates or thresholds usually affect multiple screens.
- The backend uses JWT-based authorization for all non-auth routes.
- The frontend is tightly coupled to the exact response shapes returned by the backend DTOs, especially for circles, leaderboard, tasks, and profile data.

## 7. Excluded From Context Scope

- Generated build output such as `target/`.
- Dependency folders such as `node_modules/`.
- Any speculative features not present in the current codebase.
