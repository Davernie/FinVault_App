# FinVault Hackathon Boilerplate

https://hackathon-helper--benjolo-dev.replit.app/login

Welcome to the **FinVault** Hackathon! This is a "production-ready" personal finance and banking application. It looks polished, but it has some deep-seated issues that you need to find and fix, along with some features to build.

## Project Overview

FinVault is built using:
- **Frontend**: React, Tailwind CSS, Shadcn UI, Framer Motion, Recharts.
- **Backend**: Node.js (Express), PostgreSQL, Drizzle ORM.
- **Authentication**: JWT-based (stored in localStorage).

## Technical Overview of Integrated Challenges

### 🐛 Bug 1: Race Condition on Fund Transfer
**Issue**: Concurrent transfers can cause account balances to go negative, even if the user doesn't have the funds.
**Location**: `server/routes.ts` - `POST /api/transfers`
**Technical Detail**: The code performs a "check-then-act" operation without proper database locking. There's an intentional `setTimeout` to widen the race 

### 🐛 Bug 2: N+1 Query Performance Issue
**Issue**: The transaction history page slows down significantly as the number of transactions grows.
**Location**: `server/routes.ts` - `GET /api/accounts/:accountId/transactions`
**Technical Detail**: For every transaction returned, the server makes a separate database call to fetch the category name. This is a classic N+1 problem.

### 🐛 Bug 3: JWT Security / Middleware (Implicit)
**Issue**: The current middleware in `server/routes.ts` is simple and might need hardening or token blacklisting for logouts.

## Feature Implementations

### 🚀 Feature 1: Financial Analytics
**Goal**: Implement the `/analytics` page to show spending trends using Recharts.
**Current State**: Page is a stub with a "Coming Soon" message.
**Tasks**: Create a backend endpoint for spending by category and hook it up to the frontend charts.

### 🚀 Feature 2: Savings Goals
**Goal**: Implement a system for users to set and track savings goals.
**Current State**: `/savings` page is a stub.
**Tasks**: Add a `savings_goals` table to the schema, create API endpoints, and build the UI to track progress.

## Running Locally

1. **Environment Setup**:
   - Ensure you have a PostgreSQL database available (Replit provisions this automatically).
   - `SESSION_SECRET` should be set in Secrets.

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Database Setup**:
   ```bash
   npm run db:push
   ```

4. **Seed Data**:
   ```bash
   npx tsx server/seed.ts
   ```

5. **Start Application**:
   ```bash
   npm run dev
   ```

6. **Default Credentials**:
   - Use `alice@finvault.io` / `demo1234` or any of the 10 seeded users.
