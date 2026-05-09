# COMPANION: Gamified Accountability Platform

**Companion** is a gamified goal-tracking platform built around social accountability circles. Users create or join circles with a shared goal, add personal daily tasks, check in every day, and compete on a live leaderboard. The platform is designed for small groups (5–20 people) working toward a shared commitment.

---

## 🚀 Core Features

### ⭕ Social Accountability Circles
* **Goal-Centric Groups**: A Circle is a group with one shared goal (e.g., "Work out daily for 60 days").
* **Simple Onboarding**: Join circles via an 8-character invite code.
* **Circle Lifecycle**: Circle status lifecycle progresses through `ACTIVE` → `CONCLUDED` → `ARCHIVED`.
* **Emotional Friction**: Leaving a circle includes a 2-stage emotional friction UI with roast messages to encourage retention.

### 📝 Task & Streak System
* **Daily Resets**: Tasks reset automatically every day — members tick them fresh each morning.
* **Customizable Thresholds**: Streak threshold is configurable (e.g., Any Task / Half / All Tasks / Custom %). 
* **Automated Tracking**: The system tracks current streaks, longest streaks, and daily completion.

### 🏆 Gamification
* **Live Leaderboard**: Ranks members by: current streak → today completion % → longest streak.
* **Weekly Badges**: Weekly badge awarded every Monday to top check-in performer in circle.
* **Achievement Gallery**: Concluded circles can be archived as an achievement and will appear in the profile page.

---

## 🛠️ Technical Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | Next.js 15 (TypeScript), Tailwind v3  |
| **Backend** | Spring Boot (Java 19), PostgreSQL  |
| **Authentication** | HS256 JWT (own implementation)  |
| **Database** | Azure PostgreSQL Flexible Server B1ms  |
| **Deployment** | Azure Container Apps + Vercel  |
| **Email** | Gmail SMTP (Dev) / Resend (Prod)  |

---

## 🏗️ Technical Decisions & Architecture

### Custom JWT Over Azure B2C
The project originally attempted Azure Entra ID B2C integration but was reset to use a custom Spring Boot JWT implementation. This avoids MSAL popup timing issues and Next.js App Router conflicts, immediately restoring development velocity.

### Performance Optimizations
* **N+1 Query Fixes**: The `CircleService.getLeaderboard()` was optimized from 4×N queries to 4 flat queries using Maps.`ProfileService.getProfile()` was also optimized with user-scoped targeted queries.
* **Implicit Daily Resets**: Tasks do NOT get deleted and recreated daily. `TaskCheckin` rows a re date-scoped, ensuring data persistence and cleaner queries.

---

## ⚙️ Environment Variables

### Backend Configuration (Production)
| Variable | Description |
| :--- | :--- |
| `DB_URL` | PostgreSQL JDBC URL  |
| `DB_USERNAME` / `DB_PASSWORD` | DB credentials  |
| `JWT_SECRET` | HS256 signing key (min 32 chars) |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP credentials |
| `CORS_ALLOWED_ORIGINS` | Frontend URL for CORS |

### Frontend Configuration (.env.local)
| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Backend URL (e.g., `http://localhost:8080`) |

---

## 🗺️ Roadmap

* **Phase 7 (Next)**: GitHub Actions CI/CD pipeline to auto-build and push Docker images on every push to `main`.
* **Phase 8 (Planned)**: Separate Python FastAPI microservice for AI features, calling the Claude API. Features will include Daily Motivation Messages and Goal Clarity Assistants.
* **v2.0**: Mobile app (React Native or Flutter), push notifications for streak risk alerts, and public circles with a discovery feed.

---

**Built with dedication — Companion is more than a project.**
