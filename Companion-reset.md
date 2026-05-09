**Companion**

Codebase Reset, Restructure & Feature Additions

_Cloud-Native Architecture - Option A (Own Auth) + New Features_

28 April 2026

**⚠ Read every section fully before making any changes. Do steps in order.**

| **Item**           | Detail                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| **Auth strategy**  | Own Spring Boot JWT - no MSAL, no Entra B2C on frontend                                   |
| **Reset scope**    | Frontend only - backend is solid                                                          |
| **New features**   | Delete Circle, Leave Circle (emotional friction), Circle Conclusion flow, Forgot Password |
| **Cloud target**   | Azure Container Apps + PostgreSQL Flexible Server + Vercel                                |
| **Estimated time** | 3-4 hours total                                                                           |

# **1\. What To Keep - Do Not Touch**

## **1.1 Backend - Entirely Solid**

✅ SecurityConfig.java - CORS, filter chain correct

✅ JwtAuthFilter.java - HS256, skips RS256 tokens

✅ EntraJwtFilter.java - B2C JWKS validation (future use)

✅ AuthController.java - register, login, sync endpoints

✅ AuthService.java - all methods working

✅ DataInitializer.java - admin seeding

✅ User.java - isAdmin field, builder correct

✅ application.yml + application-local.yml - secrets in env vars

✅ pom.xml - nimbus-jose-jwt added

## **1.2 Azure Resources - Keep Idle**

✅ companion-rg (Central India), companion01.onmicrosoft.com B2C tenant

✅ companion-app registration, both user flows - cost nothing sitting idle

## **1.3 Frontend Pages - Keep**

✅ app/circle/\[id\]/page.tsx - 3-column redesign

✅ app/dashboard/page.tsx, app/profile/page.tsx, app/page.tsx

✅ globals.css, tailwind.config.js, postcss.config.js - Tailwind v3 correct

# **2\. Frontend Reset - Delete & Uninstall**

**⚠ Delete these files first before restoring anything.**

| **File / Item**             | **Action** | **Detail**                                |
| --------------------------- | ---------- | ----------------------------------------- |
| lib/msalConfig.ts           | **DELETE** | MSAL B2C config - not needed              |
| lib/msalInstance.ts         | **DELETE** | MSAL singleton - not needed               |
| components/MsalProvider.tsx | **DELETE** | MSAL provider wrapper                     |
| app/auth/                   | **DELETE** | Entire folder including callback/page.tsx |

**Uninstall MSAL packages:**

cd companion-frontend

npm uninstall @azure/msal-browser @azure/msal-react

**Verify no MSAL references remain:**

- VS Code: Ctrl+Shift+F → search "msal" → should return zero results

# **3\. Frontend Reset - Restore Files**

| **File / Item**       | **Action**  | **Detail**                                        |
| --------------------- | ----------- | ------------------------------------------------- |
| app/layout.tsx        | **RESTORE** | Remove MsalProvider - plain layout only           |
| app/login/page.tsx    | **RESTORE** | Original email + password form                    |
| app/register/page.tsx | **RESTORE** | Original username + email + password form         |
| lib/api.ts            | **RESTORE** | Restore loginUser, registerUser + add new exports |
| .env.local            | **UPDATE**  | Remove MSAL vars, keep NEXT_PUBLIC_API_URL only   |

## **3.1 app/layout.tsx**

import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = { title: "Companion", description: "Gamified goal tracking" };

export default function RootLayout({ children }: { children: React.ReactNode }) {

return (&lt;html lang="en"&gt;&lt;body&gt;{children}&lt;/body&gt;&lt;/html&gt;);

}

## **3.2 app/login/page.tsx - Key points**

- Import loginUser from '../../lib/api'
- State: { email, password }, error, loading
- handleSubmit: calls loginUser → stores token/username/email in localStorage → push /dashboard
- Add Forgot password? link below form → /forgot-password
- Your existing dark UI card stays exactly the same

## **3.3 app/register/page.tsx - Key points**

- Import registerUser from '../../lib/api'
- State: { username, email, password }, error, loading
- handleSubmit: calls registerUser → stores token/username/email → push /dashboard
- Your existing dark UI card stays exactly the same

## **3.4 lib/api.ts additions**

export const loginUser = (data: { email: string; password: string }) =>

axios.post(\`\${BASE_URL}/auth/login\`, data);

export const registerUser = (data: { username: string; email: string; password: string }) =>

axios.post(\`\${BASE_URL}/auth/register\`, data);

export const forgotPassword = (email: string) =>

axios.post(\`\${BASE_URL}/auth/forgot-password\`, { email });

export const resetPassword = (token: string, newPassword: string) =>

axios.post(\`\${BASE_URL}/auth/reset-password\`, { token, newPassword });

export const deleteCircle = (circleId: number) =>

axios.delete(\`\${BASE_URL}/circles/\${circleId}\`, authHeaders());

export const leaveCircle = (circleId: number) =>

axios.post(\`\${BASE_URL}/circles/\${circleId}/leave\`, {}, authHeaders());

export const concludeCircle = (circleId: number, action: "archive" | "extend", newEndDate?: string) =>

axios.post(\`\${BASE_URL}/circles/\${circleId}/conclude\`, { action, newEndDate }, authHeaders());

## **3.5 .env.local**

NEXT_PUBLIC_API_URL=<http://localhost:8080>

# **4\. New Feature - Forgot Password**

## **4.1 How It Works**

| **Step** | What happens                                                         |
| -------- | -------------------------------------------------------------------- |
| **1**    | User clicks Forgot password on login page                            |
| **2**    | Enters email → POST /api/auth/forgot-password                        |
| **3**    | Backend generates UUID token, stores with 15min expiry               |
| **4**    | Gmail SMTP sends email with link: /reset-password?token=&lt;uuid&gt; |
| **5**    | User clicks link → enters new password                               |
| **6**    | POST /api/auth/reset-password → validates token → updates password   |
| **7**    | Redirect to login → done                                             |

## **4.2 Backend - New Files**

| **File / Item**                              | **Action** | **Detail**                                    |
| -------------------------------------------- | ---------- | --------------------------------------------- |
| entity/PasswordResetToken.java               | **NEW**    | JPA entity: id, token, email, expiresAt, used |
| repository/PasswordResetTokenRepository.java | **NEW**    | findByToken(), deleteByEmail()                |
| auth/ForgotPasswordRequest.java              | **NEW**    | DTO: { String email }                         |
| auth/ResetPasswordRequest.java               | **NEW**    | DTO: { String token, String newPassword }     |

## **4.3 Backend - AuthService additions**

- forgotPassword(email) - generate UUID token, save to DB, send email via JavaMailSender
- resetPassword(token, newPassword) - validate token not expired/used, BCrypt encode, update user

## **4.4 Backend - AuthController additions**

- POST /api/auth/forgot-password → forgotPassword() → 200 OK always (security: never reveal if email exists)
- POST /api/auth/reset-password → resetPassword() → 200 OK or 400 invalid token

## **4.5 pom.xml dependency**

&lt;dependency&gt;

&lt;groupId&gt;org.springframework.boot&lt;/groupId&gt;

&lt;artifactId&gt;spring-boot-starter-mail&lt;/artifactId&gt;

&lt;/dependency&gt;

## **4.6 application.yml additions**

spring:

mail:

host: smtp.gmail.com

port: 587

username: \${MAIL_USERNAME}

password: \${MAIL_PASSWORD}

properties:

mail.smtp.auth: true

mail.smtp.starttls.enable: true

## **4.7 Gmail App Password Setup**

- myaccount.google.com → Security → 2-Factor Authentication → enable
- Security → App Passwords → Generate → select Mail
- Copy 16-character password
- Add to application-local.yml: MAIL_USERNAME and MAIL_PASSWORD

**⚠ Never use your real Gmail password - App Password only**

## **4.8 Frontend - New Pages**

- app/forgot-password/page.tsx - email input, calls forgotPassword(), shows success message
- app/reset-password/page.tsx - reads ?token= from URL, new password input, calls resetPassword()

# **5\. New Feature - Delete Circle**

## **5.1 Rules**

- Only the circle creator can delete
- All associated data deleted in cascade order: task_checkins → circle_tasks → checkins → streaks → badges → circle_members → circles
- No soft delete - hard permanent deletion
- Confirmation modal required before deletion - "Type circle name to confirm"

## **5.2 Backend**

**CircleController.java - add endpoint:**

DELETE /api/circles/{circleId}

- Validate: authenticated user must be circle creator, else 403 Forbidden
- Call circleService.deleteCircle(circleId, username)

**CircleService.java - add method:**

public void deleteCircle(Long circleId, String username) {

Circle circle = circleRepository.findById(circleId).orElseThrow();

if (!circle.getCreatedBy().equals(username)) throw new ForbiddenException();

// delete in FK-safe order

taskCheckinRepository.deleteByCircleId(circleId);

circleTaskRepository.deleteByCircleId(circleId);

checkinRepository.deleteByCircleId(circleId);

streakRepository.deleteByCircleId(circleId);

badgeRepository.deleteByCircleId(circleId);

circleMemberRepository.deleteByCircleId(circleId);

circleRepository.deleteById(circleId);

}

## **5.3 Frontend - circle/\[id\]/page.tsx**

- Show Delete Circle button only if username === circle.createdBy
- On click → open confirmation modal
- Modal: "This will permanently delete Morning Grind and all data. Type MORNING GRIND to confirm."
- Input must match circle name exactly (case-insensitive) before Delete button activates
- On confirm → call deleteCircle(circleId) → push /dashboard
- Place button in a danger zone at the bottom of the right column - red, distinct from other actions

## **5.4 UI - Delete Button Placement**

- Bottom of right column, below Badge of Honor and Circle Progress
- Style: subtle red border, not filled - draws attention without being aggressive
- Label: "Delete Circle" with trash icon
- Only renders if isCreator - other members never see it

# **6\. New Feature - Leave Circle (Emotional Friction)**

## **6.1 Philosophy**

The Leave Circle flow is designed to make users pause and reflect before leaving. Two-stage emotional friction: motivational first, then dark humor if they persist. Goal is retention through genuine engagement, not annoyance.

## **6.2 The Flow**

| **Stage**                      | What user sees                                                            |
| ------------------------------ | ------------------------------------------------------------------------- |
| **1\. Click Leave Circle**     | Redirected to /circle/\[id\]/leave - DO NOT show a simple modal           |
| **2\. Stage 1 - Motivational** | Full page: their streak, badges earned, days completed shown prominently  |
| **3\. Stage 1 copy**           | "You have shown up X days in a row. Your circle is counting on you."      |
| **4\. Two buttons**            | "Stay and keep going" (primary) and "I still want to leave" (small, grey) |
| **5\. Stage 2 - Roast**        | If they click leave again: dark humor page - "Giving up already?"         |
| **6\. Stage 2 copy**           | Rotating roast messages - list below                                      |
| **7\. Final buttons**          | "Fine, I will stay" (primary) and "Yes, I am done" (final leave, red)     |
| **8\. On final confirm**       | POST /api/circles/\[id\]/leave → removed from circle → back to dashboard  |

## **6.3 Stage 2 Roast Messages - Rotate Randomly**

- "Wow. Day 1 and you are already done? Impressive."
- "Your future self is watching. Disappointed."
- "The circle will survive. Will you though?"
- "Quitting is a skill too, I guess."
- "Plot twist: nobody noticed you were here."
- "Even your streak did not see this coming."
- "Bold move. Completely wrong, but bold."

## **6.4 Backend**

**CircleController.java - add endpoint:**

POST /api/circles/{circleId}/leave

- Validate: user is a member of the circle
- Validate: user is NOT the creator (creator must delete, not leave)
- If creator tries to leave: return 400 with message "Creators must delete the circle, not leave"
- Delete from circle_members where circle_id = ? and user_id = ?
- Do NOT delete their tasks, streaks, or badges - those are their history

## **6.5 Frontend - New Page: app/circle/\[id\]/leave/page.tsx**

- Stage 1: fetch and display user streak, badge count, days completed in this circle
- Stage 2: randomly select one roast message from the list on component mount
- Both stages use the same dark theme as the rest of the app
- Stay button always navigates back to /circle/\[id\]
- Final leave button calls leaveCircle(circleId) then pushes /dashboard

## **6.6 Frontend - Leave Button on Circle Page**

- Show Leave Circle button for all members who are NOT the creator
- Creator sees Delete Circle instead - never both
- On click: navigate to /circle/\[id\]/leave - not a modal, a full page
- Style: subtle, secondary - not red, not alarming

# **7\. New Feature - Circle Conclusion Flow**

## **7.1 When It Triggers**

- A scheduled job (Spring @Scheduled) runs daily at midnight
- Finds all circles where goalEndDate = today
- Marks them as status = CONCLUDED
- On next login, creator sees the conclusion prompt

## **7.2 New DB Column**

ALTER TABLE circles ADD COLUMN status VARCHAR(20) DEFAULT "ACTIVE";

Values: ACTIVE, CONCLUDED, ARCHIVED

## **7.3 The Conclusion Flow - What Creator Sees**

| **Step**                        | UI                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------- |
| **1\. Circle reaches end date** | Status set to CONCLUDED by scheduled job                                      |
| **2\. Creator opens circle**    | Full-screen conclusion overlay appears on top of circle page                  |
| **3\. Overlay header**          | "You did it. Morning Grind is complete." with confetti animation              |
| **4\. Stats shown**             | Total check-ins, best streak, badges awarded, member count                    |
| **5\. Two options**             | "Archive as Achievement" or "Extend the circle"                               |
| **6A. Archive chosen**          | Circle status → ARCHIVED, locked read-only, appears in profile as achievement |
| **6B. Extend chosen**           | Date picker appears - select new end date → circle status back to ACTIVE      |

## **7.4 Archived Circle - What It Looks Like**

- Appears in profile page under Achievements section
- Shows: circle name, goal, duration, final completion %, best streak, badges earned
- Read-only - no task interaction, no check-ins
- Gold border/badge treatment - visually distinct from active circles
- Non-creators also see it as archived in their profile if they were members

## **7.5 Backend Changes**

**Circle.java entity - add field:**

@Column(name = "status", nullable = false)

@Enumerated(EnumType.STRING)

private CircleStatus status = CircleStatus.ACTIVE;

**New enum: CircleStatus.java**

public enum CircleStatus { ACTIVE, CONCLUDED, ARCHIVED }

**New scheduled job: CircleConclusionScheduler.java**

@Component public class CircleConclusionScheduler {

@Scheduled(cron = "0 0 0 \* \* \*") // midnight daily

public void concludeExpiredCircles() {

circleRepository.findByGoalEndDateBeforeAndStatus(LocalDate.now(), ACTIVE)

.forEach(c -> { c.setStatus(CONCLUDED); circleRepository.save(c); });

}

}

**CircleController.java - new endpoint:**

POST /api/circles/{circleId}/conclude

- Body: { action: "archive" | "extend", newEndDate?: string }
- Validate: only creator can conclude
- If archive: set status = ARCHIVED
- If extend: set goalEndDate = newEndDate, status = ACTIVE

**Enable scheduling in main class:**

@EnableScheduling

public class CompanionBackendApplication { ... }

## **7.6 Frontend Changes**

**app/circle/\[id\]/page.tsx - add conclusion overlay:**

- On load: if circle.status === "CONCLUDED" and user is creator → show conclusion modal overlay
- Overlay sits above everything with dark backdrop
- Archive option → call concludeCircle(id, "archive") → push /profile
- Extend option → show date picker → call concludeCircle(id, "extend", newDate) → dismiss overlay

**app/profile/page.tsx - add Achievements section:**

- Fetch archived circles where user was a member
- New API call: GET /api/circles/archived/my
- Display with gold card treatment below active circles
- Show: circle name, goal, dates, final %, badges earned

**lib/api.ts - new export already listed in Section 3.4**

# **8\. Cloud Deployment Plan**

**⚠ Do NOT start cloud deployment until all local features are working and tested end-to-end.**

| **Phase**   | Task                                                     |
| ----------- | -------------------------------------------------------- |
| **Phase 3** | Azure PostgreSQL Flexible Server B1ms - migrate local DB |
| **Phase 4** | Dockerize Spring Boot + Azure Container Registry         |
| **Phase 5** | Azure Container Apps - scale-to-zero, set all env vars   |
| **Phase 6** | Vercel - connect GitHub, set NEXT_PUBLIC_API_URL         |
| **Phase 7** | GitHub Actions CI/CD - auto deploy on push to main       |

## **8.1 Container App Environment Variables**

- DB_URL, DB_USERNAME, DB_PASSWORD - Azure PostgreSQL connection
- JWT_SECRET - minimum 32 character random string
- CORS_ALLOWED_ORIGINS - https://&lt;your-vercel-url&gt;
- AZURE_B2C_TENANT_NAME=companion01, AZURE_B2C_POLICY=B2C_1_signin
- ADMIN_EMAIL, ADMIN_PASSWORD - admin account
- MAIL_USERNAME, MAIL_PASSWORD - Gmail SMTP

## **8.2 Cost Summary**

| **Service**                                 | Cost                                            |
| ------------------------------------------- | ----------------------------------------------- |
| **Vercel (frontend)**                       | INR 0 - free tier                               |
| **Auth (own JWT)**                          | INR 0 - no external dependency                  |
| **Gmail SMTP**                              | INR 0 - free up to 500 emails/day               |
| **Azure Container Apps**                    | INR 200-600/month (scale-to-zero)               |
| **Azure PostgreSQL B1ms (stopped nightly)** | INR 300-500/month                               |
| **Total during dev**                        | INR 500-1,100/month - 7+ months from 8k credits |
| **Total in production**                     | INR 1,600-2,100/month - 3-4 months runway       |

**⚠ Stop PostgreSQL server every night during dev. Azure portal → companion-db-server → Stop. Saves INR 1,000/month.**

# **9\. Full Verification Checklist**

## **9.1 Reset Verification**

- npm run dev starts with no errors
- No "msal" references anywhere in codebase (Ctrl+Shift+F)
- Login with email + password works
- Register with username + email + password works
- Dashboard loads, circles show
- Circle page loads with 3-column layout

## **9.2 Forgot Password**

- Forgot password link on login → /forgot-password page loads
- Enter email → success message shown (even for non-existent emails)
- Email received in Gmail with reset link
- Click link → /reset-password loads
- Enter new password → redirect to login
- Login with new password → works

## **9.3 Delete Circle**

- Delete button visible only to creator
- Confirmation modal requires typing circle name
- After deletion → redirected to dashboard
- Circle no longer appears anywhere
- Non-creator members do not see delete button

## **9.4 Leave Circle**

- Leave button visible to non-creator members only
- Clicking navigates to /circle/\[id\]/leave - full page
- Stage 1 shows streak, badges, motivational message
- Stay button returns to circle page
- I still want to leave shows Stage 2 roast
- Fine I will stay returns to circle page
- Yes I am done removes user from circle, back to dashboard
- After leaving, circle no longer appears in their dashboard
- Creator trying to leave gets error message

## **9.5 Circle Conclusion**

- Set a circle end date to today in DB for testing
- Restart Spring Boot - scheduler runs on startup in dev
- Circle status changes to CONCLUDED
- Creator opens circle - conclusion overlay appears
- Archive option: circle moves to profile Achievements
- Extend option: new date set, circle back to ACTIVE
- Archived circle appears in profile with gold styling
- Non-creator members also see it in their profile achievements

_Implementation order: Reset → Forgot Password → Delete Circle → Leave Circle → Circle Conclusion → Deploy_

_Built with dedication - Companion is more than a project._