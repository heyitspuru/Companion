# COMPANION: Gamified Accountability Platform [cite: 91, 92]

**Companion** is a gamified goal-tracking platform built around social accountability circles[cite: 97]. [cite_start]Users create or join circles with a shared goal, add personal daily tasks, check in every day, and compete on a live leaderboard[cite: 98]. [cite_start]The platform is designed for small groups (5–20 people) working toward a shared commitment[cite: 99].

---

## 🚀 Core Features

### ⭕ Social Accountability Circles
* **Goal-Centric Groups**: A Circle is a group with one shared goal (e.g., "Work out daily for 60 days")[cite: 101].
* **Simple Onboarding**: Join circles via an 8-character invite code[cite: 121].
* **Circle Lifecycle**: Circle status lifecycle progresses through `ACTIVE` → `CONCLUDED` → `ARCHIVED`[cite: 122].
* **Emotional Friction**: Leaving a circle includes a 2-stage emotional friction UI with roast messages to encourage retention[cite: 124, 690].

### 📝 Task & Streak System
* **Daily Resets**: Tasks reset automatically every day — members tick them fresh each morning[cite: 103].
* **Customizable Thresholds**: Streak threshold is configurable (e.g., Any Task / Half / All Tasks / Custom %)[cite: 134]. 
* **Automated Tracking**: The system tracks current streaks, longest streaks, and daily completion[cite: 136, 138, 141].

### 🏆 Gamification
* **Live Leaderboard**: Ranks members by: current streak → today completion % → longest streak[cite: 141].
* **Weekly Badges**: Weekly badge awarded every Monday to top check-in performer in circle[cite: 146].
* **Achievement Gallery**: Concluded circles can be archived as an achievement and will appear in the profile page[cite: 126, 732].

---

## 🛠️ Technical Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | Next.js 15 (TypeScript), Tailwind v3 [cite: 95] |
| **Backend** | Spring Boot (Java 19), PostgreSQL [cite: 95] |
| **Authentication** | HS256 JWT (own implementation) [cite: 95] |
| **Database** | Azure PostgreSQL Flexible Server B1ms [cite: 8, 11] |
| **Deployment** | Azure Container Apps + Vercel [cite: 95] |
| **Email** | Gmail SMTP (Dev) / Resend (Prod) [cite: 180] |

---

## 🏗️ Technical Decisions & Architecture

### Custom JWT Over Azure B2C
The project originally attempted Azure Entra ID B2C integration but was reset to use a custom Spring Boot JWT implementation[cite: 164, 165]. [cite_start]This avoids MSAL popup timing issues and Next.js App Router conflicts, immediately restoring development velocity[cite: 165, 503].

### Performance Optimizations
* **N+1 Query Fixes**: The `CircleService.getLeaderboard()` was optimized from 4×N queries to 4 flat queries using Maps.`ProfileService.getProfile()` was also optimized with user-scoped targeted queries[cite: 174].
* **Implicit Daily Resets**: Tasks do NOT get deleted and recreated daily. `TaskCheckin` rows a re date-scoped, ensuring data persistence and cleaner queries[cite: 187].

---

## ⚙️ Environment Variables

### Backend Configuration (Production)
| Variable | Description |
| :--- | :--- |
| `DB_URL` | PostgreSQL JDBC URL [cite: 272] |
| `DB_USERNAME` / `DB_PASSWORD` | [cite_start]DB credentials [cite: 272] |
| `JWT_SECRET` | [cite_start]HS256 signing key (min 32 chars) [cite: 272] |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | [cite_start]SMTP credentials [cite: 272] |
| `CORS_ALLOWED_ORIGINS` | [cite_start]Frontend URL for CORS [cite: 272] |

### Frontend Configuration (.env.local)
| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Backend URL (e.g., `http://localhost:8080`) [cite: 284] |

---

## 🗺️ Roadmap

* [cite_start]**Phase 7 (Next)**: GitHub Actions CI/CD pipeline to auto-build and push Docker images on every push to `main`[cite: 68, 69].
* [cite_start]**Phase 8 (Planned)**: Separate Python FastAPI microservice for AI features, calling the Claude API[cite: 72, 73, 74]. [cite_start]Features will include Daily Motivation Messages and Goal Clarity Assistants[cite: 75].
* [cite_start]**v2.0**: Mobile app (React Native or Flutter), push notifications for streak risk alerts, and public circles with a discovery feed[cite: 315, 316, 317, 319].

---

[cite_start]**Built with dedication — Companion is more than a project. [cite: 321]**
