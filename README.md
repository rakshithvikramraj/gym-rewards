# Unthink Task - Gym Rewards

## Overview

This project is a web application built with Next.js for managing users and generating/verifying tiered reward coupons based on user activity, likely processed from uploaded CSV files. It includes features for CSV processing, user management, coupon generation based on scoring, coupon verification, and potentially AI-driven image generation for coupons. The application utilizes a PostgreSQL database via Drizzle ORM and features a Neobrutalism-styled UI built with shadcn/ui and Tailwind CSS.

## Architecture Diagram

graph TD
    A[User Browser] --> |HTTP Request| B(Next.js Frontend - Pages)
    B --> |Server Component/Client Component| C{Next.js Backend}
    C --> |API Call| D[API Routes (/api/*)]
    D --> |Drizzle ORM| E[(PostgreSQL Database)]
    B --> |Renders UI| A
    F[CSV Upload] --> |/api/process-csv| D
    D --> |Generate Image Request| G[External AI Image API]
    G --> |Image URL| D

    subgraph Next.js App
        B
        C
        D
    end

    style E fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#ccf,stroke:#333,stroke-width:2px

*   **Frontend:** Next.js Pages/Components (React) handle user interaction and display data.
*   **Backend:** Next.js API Routes handle business logic, data processing, and database interactions.
*   **Database:** PostgreSQL stores user, coupon, and potentially event data. Accessed via Drizzle ORM.
*   **External Services:** An AI service is used for generating coupon images (details TBC).

## Key Features

*   **CSV Data Processing:** Upload and process CSV files containing user and event data.
*   **User Management:** View a list of users and their reward scores.
*   **Coupon Generation:** Generate tiered coupons (Bronze, Silver, Gold, etc.) for users based on criteria (e.g., reward score).
*   **Coupon Verification:** Verify the status (valid, expired, redeemed, not found) of a coupon via its code.
*   **Coupon Redemption:** Mark coupons as redeemed (functionality present in UI).
*   **AI Coupon Image Generation:** Generate unique images for coupons using an AI service.
*   **Tiered Rewards:** Supports different coupon tiers.
*   **Neobrutalism UI:** Modern user interface with a distinct Neobrutalism style.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (v15+ with App Router, Turbopack)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Database:** [PostgreSQL](https://www.postgresql.org/)
*   **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
*   **Linting:** ESLint

## Project Structure

```
.
├── drizzle/             # Drizzle ORM migration files
├── drizzle.config.ts    # Drizzle ORM configuration
├── public/              # Static assets (images, fonts)
├── src/
│   ├── app/             # Next.js App Router: Pages and API Routes
│   │   ├── api/         # Backend API endpoints
│   │   ├── coupons/     # Frontend pages related to coupons (list, verify)
│   │   ├── users/       # Frontend pages related to users (view user coupons)
│   │   ├── globals.css  # Global styles
│   │   └── layout.tsx   # Root layout
│   ├── components/      # Reusable React components (including shadcn/ui)
│   │   └── ui/          # Default shadcn/ui components
│   ├── lib/             # Core libraries and utilities
│   │   ├── db/          # Database connection (db.ts) and schema (schema.ts)
│   │   └── utils.ts     # Utility functions (if any)
│   └── middleware.ts    # Next.js middleware (if used)
├── .env.local           # Local environment variables (!!! IMPORTANT - DO NOT COMMIT !!!)
├── next.config.ts       # Next.js configuration
├── package.json         # Project dependencies and scripts
├── tailwind.config.ts   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd unthink-task
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```
3.  **Set up Environment Variables:**
    *   Create a `.env.local` file in the project root.
    *   Add the necessary environment variables (see below).
4.  **Set up Database:**
    *   Ensure you have a running PostgreSQL instance.
    *   Update the database connection URL in `.env.local`.
5.  **Run Database Migrations:**
    ```bash
    npx drizzle-kit generate # Generate SQL migration files
    npx drizzle-kit push # Apply migrations to the database
    ```

## Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```ini
# Example - Replace with your actual database connection string
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# Add any other required variables, e.g., API keys for AI image generation
# OPENAI_API_KEY="..."
# OTHER_SERVICE_API_KEY="..."
```

**Note:** `.env.local` is ignored by Git by default (`.gitignore`). **Never commit this file.**

## Running the Application

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will typically be available at [http://localhost:3000](http://localhost:3000).

## API Endpoints

| Method | Endpoint                             | Description                                        |
| :----- | :----------------------------------- | :------------------------------------------------- |
| POST   | `/api/process-csv`                   | Handles CSV file uploads and processes data.       |
| GET    | `/api/users`                         | Retrieves a list of users with reward scores.      |
| POST   | `/api/generate-coupon`               | Generates a coupon for a specified user ID.        |
| GET    | `/api/coupons/[userId]`              | Retrieves coupons associated with a specific user. |
| GET    | `/api/coupons/verify/[couponCode]`   | Verifies the status and details of a coupon code.  |
| POST   | `/api/coupons/redeem/[couponCode]`   | Marks a coupon as redeemed (Endpoint assumed).     |
| POST   | `/api/generate-ai-coupon-image`      | Generates an AI image for a coupon (details TBC). |

## Database Schema

The database schema is defined using Drizzle ORM. Key tables likely include `users`, `coupons`, and potentially `events`.

Refer to `src/lib/db/schema.ts` for the detailed table definitions and relationships.

## Styling

The project uses [Tailwind CSS](https://tailwindcss.com/) for utility-first styling. UI components are built using [shadcn/ui](https://ui.shadcn.com/), which provides accessible and customizable components. A specific **Neobrutalism** theme has been applied across the application for a distinct visual style (thick borders, hard shadows, high-contrast colors). Base styles are defined in `src/app/globals.css`.

---

*(Optional: Add sections for Deployment, Contributing, License as needed)*
