**🤝 COMPANION**

Gamified Goal Tracking - Full Stack Web Application

Project Documentation & README

| **Version**  | 1.0.0 - MVP Complete                                 |
| ------------ | ---------------------------------------------------- |
| **Built By** | CSE Student - Cloud AI Specialization                |
| **Backend**  | Spring Boot (Java) + PostgreSQL                      |
| **Frontend** | Next.js + Tailwind CSS (TypeScript)                  |
| **Status**   | ✅ Core Features Complete - Week 3 AI Layer Upcoming |

# **1\. Project Overview**

Companion is a collaborative, gamified goal-tracking web application that enables friends, family, or individuals to form accountability groups called 'Companion Circles.' Members track daily tasks, build streaks, and compete for weekly badges - turning personal growth into a shared, social experience.

**Core Philosophy**

- Accountability over isolation - you're never working on goals alone
- Gamification drives consistency - streaks, badges, and leaderboards
- Flexibility - each member sets their own tasks within a shared circle
- Transparency - every member's daily progress is visible to the group

# **2\. Features Built**

## **2.1 Authentication System**

- JWT-based stateless authentication
- BCrypt password hashing
- Register and Login with email + password
- Token stored in localStorage, sent as Bearer header
- Auto-redirect to login if token is missing or expired

## **2.2 Companion Circles**

- Create circles with name, goal title, description, and category
- 9 goal categories: Fitness, Learning, Personal Habit, Career, Creative, Mental Wellness, Finance, Social, Other
- Calendar date picker with constraints (start ≥ today, end ≥ start + 7 days)
- 4 completion thresholds: Any Task, Half (50%+), All Tasks, Custom %
- Invite-only system with auto-generated 8-character invite codes
- Post-join task setup modal - members add their tasks immediately after joining

## **2.3 Daily Task System**

- Each member sets personal tasks for each circle they join
- Tasks can be added, edited (inline rename), and deleted anytime
- One-tap checkbox to mark tasks done/undone
- Daily completion % calculated live (completed / total tasks × 100)
- Threshold detection - streak increments when threshold is met

## **2.4 Streak System**

- Streak auto-updates based on completion threshold, not a simple check-in
- Current streak and longest streak tracked per user per circle
- Missing a day resets current streak
- Streak data drives leaderboard rankings

## **2.5 Leaderboard**

- Per-circle leaderboard visible to all members
- Ranked by: current streak → today's completion % → longest streak ever
- Gold/silver/bronze medals for top 3
- Your own entry highlighted in purple
- 'Done today' badge shown for members who met threshold

## **2.6 Badge of Honor**

- Awarded every Monday via @Scheduled cron job
- Winner = member with most consistent week in the circle
- Manual trigger endpoint for testing
- Badge history visible on circle page and profile

## **2.7 Goal Progress Ring**

- Animated SVG ring showing days elapsed vs total days
- Color shifts: indigo (early) → amber (midway) → red (final week)
- Center shows % complete and days remaining

## **2.8 Profile Page**

- Avatar with initials, member since date
- Aggregate stats: total circles, badges, best streak, total tasks completed
- All active circles with mini progress rings and streak counts
- Full badge collection display
- Clickable circles - navigate directly to circle page

## **2.9 Circle Member Summary**

- Today's progress for every member in the circle
- Mini progress bar per member
- Task count (X / Y tasks done)
- Threshold met indicator (✅ / ⏳)

# **3\. Tech Stack**

| **Frontend**        | Next.js 16 + TypeScript + Tailwind CSS        |
| ------------------- | --------------------------------------------- |
| **Backend**         | Spring Boot 3.5 (Java 19)                     |
| **Database**        | PostgreSQL 18 (local) via pgAdmin             |
| **Auth**            | Spring Security + JWT (jjwt 0.11.5)           |
| **HTTP Client**     | Axios (frontend API calls)                    |
| **Date Picker**     | react-datepicker                              |
| **ORM**             | Spring Data JPA + Hibernate 6.6               |
| **Connection Pool** | HikariCP                                      |
| **Build Tool**      | Maven (backend) + npm (frontend)              |
| **IDE**             | IntelliJ IDEA (backend) + IntelliJ (frontend) |
| **Testing**         | Postman (API testing)                         |
| **Deployment**      | Local dev - AWS + Vercel planned              |

# **4\. System Architecture**

The application follows a clean 3-tier architecture with strict separation of concerns:

| **Layer**        | Technology + Responsibility                                     |
| ---------------- | --------------------------------------------------------------- |
| **Presentation** | Next.js - Pages, components, API calls via Axios                |
| **Application**  | Spring Boot - REST controllers, service layer, JWT filter chain |
| **Data**         | PostgreSQL - Relational storage, JPA-managed schema             |

**Request Flow**

Browser (localhost:3000)

→ Next.js Frontend

→ Axios HTTP Request + Bearer Token

→ Spring Boot (localhost:8080)

→ JWT Filter Chain (validate token)

→ Controller → Service → Repository

→ PostgreSQL (companion_db)

← JSON Response

← Axios Response

← State update + UI re-render

# **5\. Database Schema**

All tables are auto-created and managed by JPA/Hibernate (ddl-auto: update). No manual SQL required during development.

| **Table**          | **Key Columns**                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| **users**          | id, username, email, password (BCrypt), created_at                                                       |
| **circles**        | id, name, invite_code, completion_threshold, custom_threshold_percent, created_by (FK users), created_at |
| **circle_members** | id, circle_id (FK), user_id (FK), joined_at                                                              |
| **goals**          | id, title, description, category, start_date, end_date, circle_id (FK)                                   |
| **circle_tasks**   | id, title, display_order, circle_id (FK), user_id (FK), created_at                                       |
| **task_checkins**  | id, task_id (FK), user_id (FK), checkin_date, completed - UNIQUE(task, user, date)                       |
| **checkins**       | id, circle_id (FK), user_id (FK), checkin_date, completed - UNIQUE(user, circle, date)                   |
| **streaks**        | id, user_id (FK), circle_id (FK), current_streak, longest_streak - UNIQUE(user, circle)                  |
| **badges**         | id, user_id (FK), circle_id (FK), week_start, week_end, checkin_count, awarded_at                        |

# **6\. API Endpoints**

**Authentication - /api/auth/\*\* (Public)**

| **Method** | **Endpoint**       | **Description**                       |
| ---------- | ------------------ | ------------------------------------- |
| **POST**   | /api/auth/register | Register new user - returns JWT token |
| **POST**   | /api/auth/login    | Login - returns JWT token + user info |

**Circles - /api/circles/\*\* (Authenticated)**

| **Method** | **Endpoint**                  | **Description**                           |
| ---------- | ----------------------------- | ----------------------------------------- |
| **POST**   | /api/circles/create           | Create a new circle with goal + threshold |
| **POST**   | /api/circles/join/{code}      | Join a circle via 8-char invite code      |
| **GET**    | /api/circles/my               | Get all circles the user is a member of   |
| **GET**    | /api/circles/{id}             | Get a specific circle with members + goal |
| **GET**    | /api/circles/{id}/leaderboard | Get ranked leaderboard for a circle       |

**Tasks - /api/tasks/\*\* (Authenticated)**

| **Method** | **Endpoint**                   | **Description**                             |
| ---------- | ------------------------------ | ------------------------------------------- |
| **POST**   | /api/tasks/circle/{id}         | Add a personal task to a circle             |
| **GET**    | /api/tasks/circle/{id}/my      | Get my tasks with today's completion status |
| **PUT**    | /api/tasks/{taskId}            | Rename/edit a task title                    |
| **DELETE** | /api/tasks/{taskId}            | Delete a task                               |
| **POST**   | /api/tasks/{taskId}/toggle     | Toggle task done/undone for today           |
| **GET**    | /api/tasks/circle/{id}/summary | Get all members' task completion for today  |

**Check-ins - /api/checkins/\*\* (Authenticated)**

| **Method** | **Endpoint**                    | **Description**                          |
| ---------- | ------------------------------- | ---------------------------------------- |
| **POST**   | /api/checkins/circle/{id}       | Simple daily check-in (legacy)           |
| **GET**    | /api/checkins/circle/{id}/today | Today's check-ins for all circle members |
| **GET**    | /api/checkins/circle/{id}/my    | My full check-in history for a circle    |

**Badges - /api/badges/\*\* (Authenticated)**

| **Method** | **Endpoint**             | **Description**                        |
| ---------- | ------------------------ | -------------------------------------- |
| **GET**    | /api/badges/circle/{id}  | Get all badges awarded in a circle     |
| **GET**    | /api/badges/my           | Get all my badges across all circles   |
| **POST**   | /api/badges/trigger/{id} | Manually trigger badge award (testing) |

**Profile - /api/profile (Authenticated)**

| **Method** | **Endpoint** | **Description**                                  |
| ---------- | ------------ | ------------------------------------------------ |
| **GET**    | /api/profile | Get full profile with stats, circles, and badges |

# **7\. Project Structure**

## **7.1 Backend (Spring Boot)**

companion-backend/

└── src/main/java/com/companion/backend/

├── auth/ - AuthController, AuthService, JWT request/response

├── badge/ - Badge entity, BadgeRepository, BadgeService, BadgeController

├── checkin/ - CheckIn, Streak entities + repositories + service

├── circle/ - Circle, CircleMember, LeaderboardEntry, CircleService

├── config/ - SecurityConfig, JwtUtil, JwtAuthFilter, CustomUserDetailsService

├── goal/ - Goal entity, GoalCategory enum, GoalRepository

├── task/ - CircleTask, TaskCheckin entities + TaskService + TaskController

└── user/ - User entity, UserRepository, ProfileService, ProfileController

## **7.2 Frontend (Next.js)**

companion-frontend/

└── app/

├── page.tsx - Landing page

├── login/page.tsx - Login form

├── register/page.tsx - Register form

├── dashboard/page.tsx - Circle dashboard + create/join forms + task modal

├── circle/\[id\]/page.tsx - Circle detail: tasks, leaderboard, badges, progress

└── profile/page.tsx - User profile with stats and badge collection

lib/api.ts - All Axios API call functions

types/index.ts - TypeScript interfaces for all data types

# **8\. Skills Learned**

| **Spring Boot**       | REST API design, dependency injection, bean lifecycle, application config |
| --------------------- | ------------------------------------------------------------------------- |
| **Spring Security**   | JWT stateless auth, filter chains, BCrypt, CORS configuration             |
| **JPA/Hibernate**     | Entity relationships, custom queries, ddl-auto schema management          |
| **PostgreSQL**        | Relational DB design, foreign keys, unique constraints, pgAdmin           |
| **JWT**               | Token generation, signing (HS256), validation, expiry handling            |
| **Next.js**           | App router, client components, dynamic routes, localStorage auth          |
| **TypeScript**        | Interfaces, type safety, generics in React state                          |
| **REST Design**       | Resource-oriented endpoints, HTTP methods, status codes                   |
| **Microservice Prep** | Service layer separation, constructor injection, single responsibility    |
| **React Patterns**    | useState, useEffect, prop drilling, conditional rendering                 |

# **9\. Local Setup Instructions**

## **Prerequisites**

- Java 19+
- Node.js 18+
- PostgreSQL 18 (pgAdmin recommended)
- IntelliJ IDEA Community Edition
- Maven (bundled with Spring Initializr project)

## **Backend Setup**

- Clone/open companion-backend in IntelliJ
- Create database in pgAdmin: companion_db
- Run SQL: ALTER TABLE circles ADD COLUMN IF NOT EXISTS completion_threshold VARCHAR(255) NOT NULL DEFAULT 'ANY_TASK'
- Configure src/main/resources/application.yml with your PostgreSQL password
- Hit ▶ Run - server starts on <http://localhost:8080>

## **Frontend Setup**

cd companion-frontend

npm install

npm run dev

Frontend runs on <http://localhost:3000>

## **Test Credentials**

| **Email**       | <test@gmail.com>                |
| --------------- | ------------------------------- |
| **Password**    | password123                     |
| **Invite Code** | 72AADD9E (Morning Grind circle) |

# **10\. Roadmap - What's Next**

## **Week 3 - AI Layer (Cloud AI Portfolio Piece)**

- Set up FastAPI (Python) microservice
- AI Goal Task Suggester - Claude/GPT suggests daily tasks based on goal + category
- Weekly Circle Summary - AI-generated personalized recap every Monday
- Smart Nudge - motivational message if not checked in by 8PM
- Circle Health Score - AI analyzes group consistency weekly

## **Week 4 - Cloud Deployment**

- Dockerize Spring Boot backend
- Deploy backend to AWS EC2
- Migrate PostgreSQL to AWS RDS
- Deploy frontend to Vercel
- FastAPI AI service → AWS Lambda (serverless)
- Domain + HTTPS setup

## **Week 5 - Polish**

- Light/dark mode toggle
- Animations + micro-interactions (confetti, counter animations)
- Mobile responsiveness
- Notification system (email via AWS SES)
- Activity heatmap (GitHub contribution style)
- AWS Certification - Solutions Architect or ML Specialty

## **Career Story This Project Tells**

This project demonstrates the complete skill chain required for a Cloud AI Engineering role:

- Full-stack backend engineering (Spring Boot + PostgreSQL)
- Production security patterns (JWT, BCrypt, CORS, stateless auth)
- Cloud-ready architecture (containerizable, AWS-deployable)
- AI integration capability (FastAPI microservice calling LLM APIs)
- Real product thinking (gamification, UX, user flows)

# **11\. Current Status**

| **Feature**                             | **Backend**     | **Frontend**    |
| --------------------------------------- | --------------- | --------------- |
| Authentication (Register + Login + JWT) | **✅ Complete** | **✅ Complete** |
| Companion Circles (Create + Join)       | **✅ Complete** | **✅ Complete** |
| Invite Code System                      | **✅ Complete** | **✅ Complete** |
| Daily Task System                       | **✅ Complete** | **✅ Complete** |
| Task Toggle + Completion %              | **✅ Complete** | **✅ Complete** |
| Streak Auto-update from Threshold       | **✅ Complete** | **✅ Complete** |
| Edit Task Inline                        | **✅ Complete** | **✅ Complete** |
| Post-join Task Setup Modal              | **✅ Complete** | **✅ Complete** |
| Goal Progress Ring                      | **✅ Complete** | **✅ Complete** |
| Circle Leaderboard                      | **✅ Complete** | **✅ Complete** |
| Badge of Honor (Weekly Cron)            | **✅ Complete** | **✅ Complete** |
| Profile Page                            | **✅ Complete** | **✅ Complete** |
| Member Task Summary                     | **✅ Complete** | **✅ Complete** |
| Calendar Date Picker                    | N/A             | **✅ Complete** |
| 9 Goal Categories                       | **✅ Complete** | **✅ Complete** |
| AI Layer (FastAPI)                      | ⏳ Upcoming     | ⏳ Upcoming     |
| Docker + AWS Deployment                 | ⏳ Upcoming     | ⏳ Upcoming     |
| Light/Dark Mode                         | N/A             | ⏳ Upcoming     |
| Notifications (AWS SES)                 | ⏳ Upcoming     | ⏳ Upcoming     |

**Built with 🤝 dedication - Companion is more than a project.**

It's a career story, a learning journey, and a product people can actually use.