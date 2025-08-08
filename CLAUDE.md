# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MockPal is a mock interview matching platform specifically designed for data professionals (DA/DS/DE). It uses a Tinder-style matching system to connect job seekers for practice interviews based on compatible tags and preferences.

## Development Commands

```bash
# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database migrations
npm run migrate
```

**Important**: 
- Always use port 3000 for development
- ESLint is not configured - avoid running `npm run lint`
- No test framework is currently configured

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.3.2 with App Router
- **Authentication**: NextAuth.js 4.24.11 with multiple providers
- **Database**: Neon PostgreSQL with Drizzle ORM
- **UI**: shadcn/ui components with Tailwind CSS
- **State Management**: Jotai
- **Email**: Resend API with centralized service layer

### Core Architecture Patterns

**Database-First Approach**: The application is built around a comprehensive database schema in `lib/db/schema.ts` that defines:
- User management with OAuth support (users, accounts, sessions, verification_tokens)
- Profile system with detailed tags (userProfiles)
- Matching system with status tracking (matches)
- Daily viewing limits (userDailyViews)
- Interview feedback system (feedbacks)

**Multi-Provider Authentication**: Three authentication methods are supported:
1. Google OAuth (via GoogleProvider)
2. Email magic links (via EmailProvider with Resend)
3. Username/password (via CredentialsProvider)

All handled through NextAuth with DrizzleAdapter for automatic user/account management.

**Matching Algorithm**: Core business logic in `lib/matching.ts` implements:
- Priority-based matching (invited + content overlap > content overlap > job/experience match)
- Daily viewing limits (5 users per day)
- Match state management (pending/accepted/rejected)
- Contact info exchange upon successful matches

**Protected Route System**: Middleware at the root level handles:
- Session-based authentication checking via cookies
- Automatic redirects for protected routes (/matches, /profile, /feedback)
- Authenticated users accessing /auth are redirected to /matches

**Centralized Email Service**: All email functionality is handled through `lib/email-service.ts`:
- Singleton pattern prevents multiple Resend instances
- Unified email templates and sending logic
- Used by NextAuth for verification emails

### Key Configuration Files

**Environment Variables** (see AUTH_SETUP.md for complete setup):
- NextAuth configuration (URL, secret)
- Google OAuth credentials
- Resend API key for email sending
- Neon database connection

**Database Schema**: All models defined in `lib/db/schema.ts` with proper relations using Drizzle ORM. Key relationships:
- Users -> UserProfiles (one-to-one)
- Users -> Matches (many-to-many via matches table)
- Matches -> Feedbacks (one-to-many)

### Code Organization

**Actions Layer** (`app/actions/`): Server actions for:
- Authentication operations (auth.ts)
- Profile management (profile.ts) 
- Matching logic (matching.ts)

**API Routes** (`app/api/`): RESTful endpoints including:
- NextAuth handlers at `/api/auth/[...nextauth]`
- Custom email verification at `/api/auth/email-verify`
- Database testing at `/api/test-db`

**Component Structure**: 
- UI components in `components/ui/` (shadcn/ui)
- Layout components (`public-layout.tsx`, `auth-layout.tsx`)
- Business logic components integrated with pages

### Authentication Flow

The app uses NextAuth 4.x with DrizzleAdapter. Key implementation details:
- Events.createUser callback creates user profiles asynchronously
- Custom sendVerificationRequest function uses centralized email service
- Session strategy set to database for stateful authentication  
- Automatic OAuth account linking enabled for Google
- DrizzleAdapter requires type assertions due to schema compatibility

### Matching System Logic

Users see potential matches based on:
1. Users they haven't interacted with today (daily limit: 5)
2. Users with complete profiles (basic info + practice preferences + contact info)
3. Priority ordering: reciprocal interest with content overlap > content overlap > job/experience match > others
4. Automatic match acceptance when both users like each other

### Development Notes

- Port 3000 is the standard development port
- Database migrations are handled via `npm run migrate`
- The app supports Chinese language UI with English for error messages
- Responsive design optimized for mobile-first experience
- Unified authentication page at `/auth` with mode switching (?mode=register)
- Email service uses singleton pattern - access via `emailService.getInstance()`
- All Resend email sending goes through `lib/email-service.ts:74`

### Important Implementation Details

**Database Schema**: Uses Drizzle ORM with Neon PostgreSQL. Key points:
- Serial IDs for all primary keys
- User profiles have one-to-one relationship with users
- Matching system tracks daily interaction limits
- Session-based authentication with database storage

**Email Configuration**: 
- Centralized service prevents duplicate Resend instances
- Sender: `MockPal <noreply@mockpal.com>` 
- Templates include 24-hour expiration messaging
- Integrated with NextAuth verification flow

**Route Protection**:
- Middleware checks session cookies for authentication
- Protected routes: `/matches`, `/profile`, `/feedback`
- Automatic redirects maintain user flow