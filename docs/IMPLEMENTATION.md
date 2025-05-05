# Gym Rewards System - Implementation Details (PostgreSQL/NeonDB & Drizzle ORM)

## 1. Overview

This document outlines the implementation details for the Gym Rewards System, designed using Next.js, **PostgreSQL (hosted on NeonDB)**, and Drizzle ORM. The system enables **authenticated administrators** (managed via **Better Auth**) to upload user activity event data via CSV files through a web interface. The backend processes these events against user data stored in **PostgreSQL**, calculates reward points based on predefined rules (check-ins, promo shares, referrals), determines reward tiers (Silver, Gold, Diamond), generates unique coupon codes, and stores this information back in the database. Generated coupons (including visuals and QR codes) are then emailed to the respective users using Resend and React Email. A separate API endpoint allows for QR code-based coupon verification. The implementation emphasizes clean code principles, security, and best practices.

## 2. Technology Stack

*   **Framework:** Next.js (v15+ recommended) with App Router
*   **Language:** JavaScript
*   **Database:** **PostgreSQL (hosted on NeonDB)**
*   **ORM:** Drizzle ORM (`drizzle-orm`, **`@neondatabase/serverless` or `postgres`**)
*   **Authentication:** **Better Auth** (`better-auth`, `better-auth/next-js`, `better-auth/react`)
*   **Emailing:**
    *   **Sending Service:** Resend (`resend`)
    *   **Template Engine:** React Email (`react-email`, `@react-email/components`)
*   **Frontend:**
    *   React (via Next.js App Router)
    *   shadcn/ui
    *   Tailwind CSS
    *   Lucide React
*   **Backend (Next.js API Routes / Server Actions):**
    *   Node.js
    *   `formidable` or Next.js handling (for file uploads)
    *   `papaparse` (CSV parsing)
    *   **`@neondatabase/serverless` or `postgres`** (Node.js driver)
    *   `qrcode` (QR code generation)
    *   (Optional) Image generation library/API (e.g., `canvas`, external service)

## 3. Database Schema (PostgreSQL with Drizzle)

Define the PostgreSQL database schema using Drizzle ORM schemas. Ensure the connection string points to your NeonDB instance.

*   **`users` Table Schema:**
    *   `id`: Serial (Primary Key)
    *   `userId`: Varchar (Custom unique user identifier) - *Indexed*
    *   `username`: Varchar
    *   `email`: Varchar (User's email address for notifications/coupons) - *Indexed, Unique*
    *   `fullName`: Varchar (Optional)
    *   `referralCode`: Varchar (Unique code for this user) - *Indexed, Unique*
    *   `totalScore`: Integer (Default: 0)
    *   `currentTier`: Varchar (Enum: 'None', 'Silver', 'Gold', 'Diamond', Default: 'None')
    *   `createdAt`: Timestamp with Time Zone (Default: `now()`)
    *   `updatedAt`: Timestamp with Time Zone (Auto-updated via trigger or ORM hook)
    *   *(Authentication fields defined by Better Auth's schema conventions, potentially managed in separate tables linked via foreign keys)*

*   **`events` Table Schema (Optional but Recommended):**
    *   `id`: Serial (Primary Key)
    *   `eventType`: Varchar (Enum: 'checkin', 'share_promo', 'referral_signup')
    *   `userId`: Varchar (References `users.userId`) - *Indexed*
    *   `eventDate`: Timestamp with Time Zone
    *   `pointsAwarded`: Integer
    *   `relatedReferralCode`: Varchar (Optional)
    *   `processedAt`: Timestamp with Time Zone

*   **`coupons` Table Schema:**
    *   `id`: Serial (Primary Key)
    *   `couponCode`: Varchar (Unique, securely generated) - *Indexed, Unique*
    *   `userId`: Varchar (References `users.userId`) - *Indexed*
    *   `tier`: Varchar (Enum: 'Silver', 'Gold', 'Diamond')
    *   `scoreAtIssuance`: Integer
    *   `issuedAt`: Timestamp with Time Zone (Default: `now()`)
    *   `expiresAt`: Timestamp with Time Zone (Optional)
    *   `status`: Varchar (Enum: 'Active', 'Redeemed', 'Expired', Default: 'Active') - *Indexed*
    *   `redeemedAt`: Timestamp with Time Zone (Optional)
    *   `emailSent`: Boolean (Flag indicating if the coupon email was dispatched, Default: false)
    *   `emailSentAt`: Timestamp with Time Zone (Optional)

*   **(Authentication Tables - Managed by Better Auth):**
    *   Better Auth manages its own required tables (e.g., for users, accounts, sessions, verification tokens) based on its internal schema. Integration with Drizzle involves configuring Better Auth to use your PostgreSQL database (via NeonDB connection string) and potentially using Drizzle to query these tables if needed, respecting foreign key relationships. Refer to Better Auth documentation for specific schema requirements and PostgreSQL integration.

## 4. Authentication Implementation (Better Auth)

*   **Provider:** **Better Auth** is used for handling authentication and authorization.
*   **Strategy:** Configure appropriate providers within Better Auth (e.g., Email/Password with verification, Google OAuth) suitable for administrator access.
*   **Protection:**
    *   **Middleware:** Use Next.js middleware (`middleware.ts`) with Better Auth helpers (e.g., `getSessionCookie` from `better-auth/cookies`) to protect admin pages and API routes by checking for a valid session cookie. Redirect unauthorized users.
    *   **Server-Side Checks:** Verify authentication status and potentially user roles/permissions within Server Components, API Routes, and Server Actions using Better Auth's server-side API (e.g., `auth.api.getSession({ headers: headers() })`).
*   **Next.js Integration:**
    *   Set up the main Better Auth configuration (`auth.ts`).
    *   Create the API route handler (`app/api/auth/[...all]/route.ts`) using `toNextJsHandler` from `better-auth/next-js`.
    *   Initialize the Better Auth client (`lib/auth-client.ts`) using `createAuthClient` from `better-auth/react`.
    *   Use the `nextCookies` plugin in the Better Auth config if using Server Actions to ensure cookies are set correctly.
*   **Database Integration:** Configure Better Auth to work with your **PostgreSQL database (NeonDB)**. This typically involves providing the NeonDB connection string to Better Auth's configuration. Better Auth will manage its required tables within your PostgreSQL instance. Consult Better Auth documentation for PostgreSQL integration specifics.

## 5. Frontend Implementation (Next.js App Router)

*   **Structure & Components:** Remains largely the same (multi-step form using `shadcn/ui`).
*   **Authentication State:** Client components access authentication status using Better Auth's client hook (`authClient.useSession()`). The UI adapts based on session data (e.g., showing user info, login/logout buttons).
*   **API Interaction:** Authenticated requests are handled via session cookies managed by Better Auth. Middleware and backend checks enforce authorization.

## 6. Backend Implementation (Next.js API Routes / Server Actions)

*   **API Endpoint: `/api/process-events` (or Server Action)**
    *   **Authentication Check:** The first step is to verify administrator authentication using Better Auth's server-side API (e.g., `auth.api.getSession`). Reject unauthorized requests. You might also check for specific admin roles if implemented via Better Auth plugins or custom logic.
    *   **File Handling, CSV Parsing, DB Connection:** Establish connection to **NeonDB using Drizzle/postgres driver**. Parse CSV.
    *   **Transaction Management:** Use SQL transactions via Drizzle for atomicity.
    *   **Event Processing & Scoring Logic:** As previously defined.
    *   **Tier Calculation:** As previously defined.
    *   **Coupon Generation:**
        1.  Generate unique `couponCode`.
        2.  Create the coupon record in the `coupons` table via Drizzle.
        3.  **Trigger Email Sending:** Asynchronously trigger the email sending process.
    *   **Response:** Return success/error messages.

*   **Email Sending Service/Function:** (Logic remains the same - fetch data **from PostgreSQL** via Drizzle, generate QR, build React Email template, send via Resend, update coupon status **in PostgreSQL** via Drizzle).

*   **React Email Templates (`emails/CouponEmail.tsx` - Example):** (Implementation remains the same).

*   **API Endpoint: `/api/generate-coupon-visual` (Revised Role):** (Role remains the same - potentially less critical or used internally/for admin preview).

*   **API Endpoint: `/api/verify-coupon`:**
    *   **Logic:** Remains the same - validate the `couponCode` against the `coupons` table **in PostgreSQL** via Drizzle, check status, optionally update status, return data or error. No direct dependency on the auth system itself for verification, only on the coupon data.

## 7. Best Practices & Clean Code

*   **TypeScript:** Enforce strict typing.
*   **Modularity:** Separate concerns (auth logic via Better Auth, DB interactions via Drizzle/PostgreSQL, email services, CSV processing).
*   **Environment Variables:** Crucial for API keys (**NeonDB connection string**, Better Auth secrets/providers, Resend), etc.
*   **Error Handling:** Comprehensive handling for auth errors, DB errors, file parsing issues, email sending failures.
*   **Logging:** Structured logging.
*   **Validation:** Rigorous validation of inputs.
*   **Security:**
    *   **Authentication/Authorization:** Enforce strictly using Better Auth features.
    *   **Input Sanitization:** Prevent SQL injection (Drizzle helps, but be mindful).
    *   **Secure Coupon Codes:** Use crypto.
    *   **Email Security:** Use Resend, configure DKIM/SPF.
*   **Database Indexing:** Essential for performance on key query columns (**`userId`, `email`, `referralCode`, `couponCode`, `status`**).
*   **Code Formatting/Linting:** Maintain consistency.
*   **Testing:** Unit/integration tests for critical logic, including auth checks and flows handled by Better Auth.
*   **Database Migrations:** Use **Drizzle Kit** (`drizzle-kit generate`, `drizzle-kit migrate`) to manage schema changes.

## 8. Future Enhancements

*   **Background Jobs:** For high-volume processing/emailing (e.g., using BullMQ, Temporal).
*   **Real-time Updates:** Use WebSockets/SSE.
*   **Admin Dashboard:** Enhanced management interface.
*   **User Profiles:** Allow users to log in (potentially using Better Auth if extended for regular users) to see points/coupons.
*   **Coupon Expiry & Notifications:** Implement expiry logic using scheduled tasks or database triggers.
*   **Advanced Analytics:** Track reward effectiveness using SQL queries.
*   **Better Auth Plugins:** Explore Better Auth's plugin ecosystem for additional features (e.g., 2FA for admins, advanced role management).
