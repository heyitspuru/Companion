**Companion - Azure B2C Auth**

Full Debug Documentation & Resolution Guide

April 2026 | Session Handoff Document

# **1\. Project Stack**

| **Frontend**      | Next.js 15 (TypeScript), Tailwind v3, @azure/msal-browser v5, @azure/msal-react v5 |
| ----------------- | ---------------------------------------------------------------------------------- |
| **Backend**       | Spring Boot (Java), PostgreSQL, JWT (HS256 local + RS256 B2C)                      |
| **Auth Provider** | Azure Entra ID B2C - companion01.onmicrosoft.com                                   |
| **Client ID**     | 0a44aeca-b5d2-4597-8965-41efc6365513                                               |
| **Tenant ID**     | 4ce1c528-08c9-418f-b7c7-1fa0efcec411                                               |

# **2\. Azure B2C Configuration (Current State)**

## **2.1 User Flows**

| **Flow Name**       | **Type**                     | **MFA**                        |
| ------------------- | ---------------------------- | ------------------------------ |
| B2C_1_signup        | Sign up (Recommended)        | **Conditional - DISABLE THIS** |
| B2C_1_signin        | Sign in (Recommended)        | **Always On - DISABLE THIS**   |
| B2C_1_passwordreset | Password Reset (Recommended) | Off - OK                       |

**CRITICAL ACTION: Go to Azure Portal → B2C Tenant → User flows → B2C_1_signup → Properties → Multifactor authentication → Disabled → Save. Repeat for B2C_1_signin.**

## **2.2 App Registration Redirect URIs (SPA)**

- <http://localhost:3000>
- <http://localhost:3000/auth/callback>
- <http://localhost:3000/blank.html> (can be removed)

# **3\. What Was Fixed (Completed)**

## **3.1 Frontend - Turbopack / Tailwind**

- Next.js 16 downgraded to 15.3.0 - Turbopack was conflicting with Tailwind v3
- Added --no-turbopack to dev script in package.json
- Tailwind v3 config, postcss.config.js, tailwind.config.js all correctly set up
- No .mjs vs .js config conflicts confirmed

## **3.2 Backend - JWT Filter Chain**

- JwtAuthFilter was crashing on Azure B2C RS256 tokens (it only handles HS256)
- Fix: Added isRS256Token() method that peeks at JWT header alg field - skips RS256 tokens
- Filter order fixed: EntraJwtFilter runs first (RS256), JwtAuthFilter runs second (HS256)
- AuthService.syncEntraUser() now returns a LOCAL HS256 token instead of the B2C token
- This means all API calls after login use HS256 tokens that JwtAuthFilter can verify

## **3.3 Azure B2C Setup**

- AADB2C90043: prompt: create not supported by B2C - removed from loginPopup call
- AADB2C90006: redirect_uri mismatch - fixed by registering correct URIs in Azure
- Separate user flows created: B2C_1_signup (register) and B2C_1_signin (login)
- MFA disabled on password reset flow

## **3.4 Frontend MSAL Setup**

- MsalProvider: fixed stub instance error by returning dark placeholder instead of children before init
- Removed clearCache() call which does not exist on PublicClientApplication
- interaction_in_progress: fixed by clearing msal.interaction.status from sessionStorage before each call
- stubbed_public_client_application_called: fixed by not rendering children until MSAL is fully initialized

# **4\. The Core Unsolved Problem**

## **4.1 Root Cause**

The fundamental issue is a conflict between MSAL's auth flow and Next.js App Router. Two approaches were attempted extensively:

### **Approach A: loginPopup**

- Popup opens Microsoft B2C page correctly
- User completes auth on B2C
- B2C redirects popup back to localhost:3000 with token in URL hash
- PROBLEM: Next.js App Router loads the full app inside the popup
- MsalProvider initializes inside the popup, creating a second MSAL instance
- The popup never closes because window.close() in React runs too late
- Result: timed_out error - parent window gives up waiting

### **Approach B: loginRedirect**

- Page navigates to B2C correctly
- User completes auth on B2C
- B2C redirects back to /auth/callback with token in URL hash
- PROBLEM: no_token_request_cache_error
- MSAL stored the original request state in sessionStorage on the /login page
- When B2C redirects to /auth/callback, it is a NEW page - sessionStorage from /login is gone
- handleRedirectPromise() cannot find the cached request and throws
- Switching to localStorage did not help because the cache key includes the page origin context

## **4.2 Errors Encountered**

| **Error**                                | **Cause**                                                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| timed_out                                | Popup not closing - Next.js loads inside popup, MSAL parent times out                                          |
| no_token_request_cache_error             | handleRedirectPromise called on wrong page - MSAL request cache from login page not available on callback page |
| interaction_in_progress                  | Stale MSAL lock in sessionStorage from a previous failed attempt                                               |
| redirect_uri_mismatch                    | URI not registered in Azure App Registration - fixed by adding to SPA redirect URIs                            |
| stubbed_public_client_application_called | MSAL not initialized before useMsal() hook called - children rendered before init complete                     |

# **5\. Recommended Fix - Next Session**

## **5.1 The Correct Approach**

The correct solution is to bypass MSAL's redirect handling entirely and parse the id_token directly from the URL hash. B2C always returns the token as a URL fragment (#id_token=...). This approach has ZERO dependency on MSAL's cache system.

**Install jwt-decode:**

npm install jwt-decode

## **5.2 Required File Changes**

### **Step 1: app/auth/callback/page.tsx - Parse token from URL hash directly**

This page reads the id_token from window.location.hash without using MSAL at all:

const hash = window.location.hash;

const params = new URLSearchParams(hash.substring(1));

const idToken = params.get('id_token');

const claims = jwtDecode(idToken);

const syncResponse = await syncUserWithBackend({ token: idToken, ... });

localStorage.setItem('token', syncResponse.data.token);

router.push('/dashboard');

### **Step 2: components/MsalProvider.tsx - Simple, no redirect handling**

MsalProvider should ONLY initialize MSAL and wrap children. No handleRedirectPromise, no routing logic:

useEffect(() => {

const instance = new PublicClientApplication(msalConfig);

instance.initialize().then(() => setMsalInstance(instance));

}, \[\]);

### **Step 3: lib/msalConfig.ts - Use localStorage, redirectUri to /auth/callback**

redirectUri: '<http://localhost:3000/auth/callback>',

cacheLocation: 'localStorage',

### **Step 4: login/page.tsx and register/page.tsx - Use loginRedirect only**

Both pages only trigger the redirect. No handleRedirectPromise anywhere in these pages:

await instance.loginRedirect({

...loginRequest,

authority: b2cPolicies.authorities.signIn.authority,

});

### **Step 5: Disable MFA on ALL user flows in Azure**

**Go to each user flow → Properties → Multifactor authentication → Disabled → Save:**

- B2C_1_signup → Disabled
- B2C_1_signin → Disabled
- B2C_1_passwordreset → Already Off

## **5.3 Why This Will Work**

- No MSAL cache dependency - token is read directly from URL hash
- No popup timing issues - full page redirect, no window.close() needed
- No Next.js routing conflicts - /auth/callback is a dedicated page that only runs this logic
- jwt-decode is a simple, zero-dependency library - just decodes the JWT claims
- Backend sync still works the same - B2C token sent to /api/auth/sync, local HS256 token returned

# **6\. Current File States**

## **6.1 Backend Files - All Correct, No Changes Needed**

| **File**            | **Status**                                         |
| ------------------- | -------------------------------------------------- |
| SecurityConfig.java | **Done - filter order correct**                    |
| JwtAuthFilter.java  | **Done - skips RS256 tokens**                      |
| EntraJwtFilter.java | **Done - validates B2C tokens via JWKS**           |
| AuthService.java    | **Done - syncEntraUser returns local HS256 token** |
| AuthController.java | **Done - /api/auth/sync endpoint working**         |
| JwtUtil.java        | **Done - HS256 only**                              |

## **6.2 Frontend Files - Current State**

| **File**                    | **Status**        | **Action Needed**                                                  |
| --------------------------- | ----------------- | ------------------------------------------------------------------ |
| lib/msalConfig.ts           | **Needs update**  | Set redirectUri to /auth/callback, localStorage                    |
| components/MsalProvider.tsx | **Needs update**  | Remove all handleRedirectPromise logic                             |
| app/auth/callback/page.tsx  | **Needs rewrite** | Parse id_token from URL hash using jwt-decode                      |
| app/login/page.tsx          | **Needs update**  | Use loginRedirect only, remove all useEffect/handleRedirectPromise |
| app/register/page.tsx       | **Needs update**  | Use loginRedirect only, remove all useEffect/handleRedirectPromise |
| app/dashboard/page.tsx      | **Good**          | Use localStorage.getItem('token') - already done                   |
| lib/api.ts                  | **Good**          | getToken() reads from localStorage - already done                  |

# **7\. Deployment Phases - Status**

| **Phase** | **Task**                                         | **Status**      |
| --------- | ------------------------------------------------ | --------------- |
| Phase 1   | Resource Group (companion-rg, Central India)     | **Done**        |
| Phase 2   | Azure B2C Auth - MSAL wired                      | **In Progress** |
| Phase 3   | Azure PostgreSQL Flexible Server B1ms            | Not Started     |
| Phase 4   | Dockerize Spring Boot + Azure Container Registry | Not Started     |
| Phase 5   | Azure Container Apps, scale-to-zero              | Not Started     |
| Phase 6   | Vercel frontend deployment                       | Not Started     |
| Phase 7   | GitHub Actions CI/CD                             | Not Started     |

# **8\. Key Config Reference**

**WARNING: Never commit these to version control**

## **8.1 Frontend .env.local**

NEXT_PUBLIC_API_URL=<http://localhost:8080>

NEXT_PUBLIC_AZURE_CLIENT_ID=0a44aeca-b5d2-4597-8965-41efc6365513

NEXT_PUBLIC_AZURE_TENANT_NAME=companion01

NEXT_PUBLIC_REDIRECT_URI=<http://localhost:3000>

## **8.2 Backend Environment Variables**

DB_URL=jdbc:postgresql://localhost:5432/companion_db

DB_USERNAME=postgres

JWT_SECRET=companion_super_secret_jwt_key_change_in_production_min_256_bits

CORS_ALLOWED_ORIGINS=<http://localhost:3000>

AZURE_B2C_TENANT_NAME=companion01

AZURE_B2C_POLICY=B2C_1_signin

ADMIN_EMAIL=<admin@companion.app>

_Built with dedication - Companion is more than a project._