# One Academy — Single-Academy Sports Operations & Scouting Platform
### Vibe Coding Challenge 2.0 | Team: 12 SAMOSE

> A production-grade sports management platform engineered for athletic academies to streamline roster management, multi-sport training schedules, practice session attendance, competitive match fixtures, individual performance scoring, objective talent readiness analytics, and confidential coach developmental remarks. Built with **Next.js 16**, **React 19**, **TypeScript**, and **MongoDB Atlas** under an authentic **Retro / Vintage Sports Club** design system.

---

## 🔑 Judge Access & Demo Credentials

For evaluators and competition judges, pre-provisioned active accounts are configured for all three platform roles:

| Role | Email Address | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Coach** | `coach@gmail.com` | `Coach@456` | Full Academy Administration: Rosters, Sports, Sessions, Attendance, Matches, Scoring, Scouting Board, Coach Remarks |
| **Player** | `sourav@gmail.com` | `Sourav@123` | Athlete Development Portal: Own Attendance, Match Performance History, Readiness Status Breakdown, Coach Remarks Feed |
| **Scout** | `scout01@gmail.com` | `Scout01@123` | Talent Discovery Portal: Qualified Ready Athletes ($\ge 75\%$ attendance + $\ge 2$ finalized matches), Sport Filters, Performance Stats |

> **Note**: Each account has been verified in MongoDB Atlas. Accounts strictly enforce role-based access control (RBAC). Selecting the incorrect portal tab displays an informative role-mismatch notice without penalizing the user's login rate limit.

---

## 🌐 Live Production Application

- **Live URL**: [https://one-academy-exclrs.vercel.app/](https://one-academy-exclrs.vercel.app/)
- **Repository**: [https://github.com/sourav0006/vibe-coding-challenge-2-0-12-samose](https://github.com/sourav0006/vibe-coding-challenge-2-0-12-samose)
- **Deployment Platform**: Vercel Serverless Edge & Node.js Runtime
- **Database**: MongoDB Atlas Dedicated Cluster (M0/Shared) with connection pooling

---

## 1. Project Overview

Modern athletic academies struggle with fragmented operations: practice sheets, match fixtures, player records, and scouting evaluations are often scattered across spreadsheets, paper binders, and chat threads.

**One Academy** unites the entire sports development lifecycle into an integrated, role-isolated platform:
- **Centralized Multi-Sport Management**: Manage Football, Badminton, Basketball, Volleyball, and more under one unified institution.
- **Strict Data Immutability**: Closed practice sessions and finalized match fixtures permanently freeze records to preserve competition integrity.
- **Dynamic Performance & Readiness Engine**: Athlete attendance and scouting readiness are computed on-the-fly from historical records rather than fragile, manually edited status flags.
- **Scout Privacy & Talent Protection**: Scouts discover only athletes who have objectively qualified as *Scouting Ready*, with zero visibility into internal coaching notes or non-ready players.
- **Retro / Vintage Sports Club Visual Identity**: A distinctive collegiate design system featuring Alfa Slab One and Barlow Condensed typography, 3D character avatars, stadium entrance video, and warm parchment surfaces (`#F4EBD8`, `#11262C`, `#D95B24`).

---

## 2. Features by Role

### 🏆 Coach Portal (Full Academy Administration)
- **Executive Overview Dashboard**: High-level academy metrics (active roster, registered sports, academy-wide attendance rate, scouting readiness rate) and recent activity feeds.
- **Sports Catalogue**: Create, view, and toggle active sports with automatic case-insensitive duplicate normalization and live roster tallies.
- **Roster Management**: Provision new athlete and scout profiles with assigned disciplines, age verification, status filtering (Active, Pending, Archived), and safe archival.
- **Single-Use Activation Codes**: Cryptographic 8-character single-use activation codes valid for 24 hours, hashed with salted bcrypt.
- **Practice Sessions & Attendance**:
  - Schedule practice sessions for specific sports and calendar dates.
  - Enforce attendance roster eligibility based on the athlete's historical sport assignment date.
  - Record attendance (`Present` / `Absent`) with quick batch actions.
  - Finalize and close sessions with permanent immutability (closed sessions reject all subsequent edits).
- **Match Management & Fixtures**:
  - Schedule competitive match fixtures with **required titles** (e.g. `Test Match 1`, `Dumka Series M1`, `Inter Academy Final`).
  - Schedule unlimited matches against the same opponent, in the same sport, on the same date, provided titles are unique.
  - Record individual participant scores ($0.0 - 10.0$ scale).
  - Finalize matches to permanently lock scores and feed official scouting metrics.
- **Scouting Readiness Board**: Global academy matrix filtering athletes by sport and readiness status, with transparent deficiency breakdowns.
- **Confidential Coach Remarks**: Add, view, edit, and delete private developmental feedback for individual players.

### 🏃 Player Portal (Athlete Development)
- **Personal Overview**: Discipline badge, attendance progress bar toward the $75\%$ benchmark, finalized match metrics, and recent coaching tips.
- **Dynamic Readiness Rationale**: Transparent evaluation checklist explaining readiness standing (`READY` vs `NOT READY`) with requirement status.
- **Attendance History**: Paginated log of applicable closed practice sessions (Date, Sport, Status, Marked Date). Athletes are never penalized for sessions held before their enrollment.
- **Match Performance History**: Paginated fixture results displaying individual performance scores ($0.0 - 10.0$), average score, and season highs.
- **Coaching Feedback Feed**: Chronological stream of private developmental remarks and tactical pointers from the coaching staff.
- **Safe Profile**: Read-only profile view strictly omitting security hashes or sensitive administrative fields.

### 🔍 Scout Portal (Talent Discovery)
- **Talent Discovery Grid**: Cards displaying verified performance stats (attendance percentage, finalized matches played, average score, top score) strictly for qualified athletes.
- **Sport Filter Pills**: Dynamically generated filter buttons showing only sports with currently qualified, discoverable talent.
- **Verified Athlete Profiles**: Direct evaluation view showcasing verified competition fixture results and scoring distributions.
- **Strict Privacy Isolation**: Non-ready or archived athletes return HTTP `404 Not Found`. Coach remarks and internal credentials are completely excluded at the database query level.

---

## 3. Readiness Invariants & Core Business Rules

A player qualifies as **Ready for Scouting** if and only if both conditions are simultaneously satisfied:

$$\mathbf{Player\ Readiness} \iff (\text{Attendance Percentage} \ge 75.0\%) \land (\text{Finalized Matches Played} \ge 2)$$

### Exact Rule Specifications
1. **Attendance Criterion ($\ge 75.0\%$)**:
   $$\text{Attendance Percentage} = \frac{\text{Present Closed Sessions}}{\text{Applicable Closed Sessions}} \times 100$$
   - **Sport-Specific**: Only closed sessions in the player's assigned sport count in the denominator.
   - **Historical Eligibility**: Athletes are only rostered for sessions on or after their registration/transfer date (`effectiveFrom`). Sessions closed before enrollment do not count as absences.
   - **Open Sessions Excluded**: Unclosed sessions never count in the denominator.
   - **Exact Boundary**: Exactly $75.0\%$ qualifies; $74.9\%$ fails. Zero applicable closed sessions yields `N/A` (does not qualify).
2. **Match Criterion ($\ge 2$ Finalized Matches)**:
   - Only **Finalized** matches with an explicit participant score ($0.0 - 10.0$) count.
   - Draft matches are strictly excluded.
   - Exactly $2$ finalized match participations qualify; $1$ match fails.
3. **Scout Isolation Guarantee**:
   - Only players satisfying both criteria appear in Scout Discovery.
   - Non-ready player URLs return `404 Not Found` for Scout accounts.
   - Coach developmental remarks are private to Coach and Player, never exposed to Scouts.

---

## 4. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 16.4.3 (App Router, Turbopack, Cache Components, React 19) |
| **Language** | TypeScript 5 (Strict Mode, Zero `any` in core domain services) |
| **Database** | MongoDB Atlas Dedicated / Serverless Cluster with Mongoose 9.11.4 |
| **Authentication** | Stateless HTTP-only, SameSite, Secure JWT cookie sessions via `jose` (HS256) |
| **Password Security** | Salted `bcryptjs` (10 rounds) for passwords and activation codes |
| **Rate Limiting** | Persistent MongoDB sliding-window rate limiting with 2-minute lockout cooldown |
| **Validation** | Zod 4.6.7 runtime schema validation on all inputs and API routes |
| **Styling** | Tailwind CSS v4 with custom collegiate tokens and Alfa Slab One / Barlow Condensed typography |
| **Animation** | GSAP 3.15 + `@gsap/react` for vintage UI micro-interactions |

---

## 5. Architecture & Security Implementation

### Application Structure
```
one-academy/
├── public/
│   ├── favicon.ico             # 32x32 MS Windows icon
│   ├── icon.png / apple-icon   # Browser & Apple touch branding
│   ├── images/                 # 3D mascot artwork & logos
│   └── videos/
│       └── stadium-intro.mp4   # Cinematic stadium intro background
├── src/
│   ├── app/                    # Next.js 16 App Router
│   │   ├── (auth)/             # Login and Account Activation
│   │   ├── (dashboard)/        # Role-based dashboard layouts wrapped in Suspense
│   │   │   ├── layout.tsx      # Dashboard layout with React Suspense boundary
│   │   │   ├── loading.tsx     # Vintage sports loading state
│   │   │   ├── dashboard/coach # Coach administration routes
│   │   │   ├── dashboard/player# Player development portal routes
│   │   │   └── dashboard/scout # Scout talent discovery routes
│   │   ├── api/                # Next.js Route Handlers (REST endpoints)
│   │   ├── activate/           # Account activation & /activate/help onboarding guide
│   │   ├── legal/              # Combined Privacy Policy & Terms of Use with tab switching
│   │   ├── support/            # Official Contact & Support Directory (6 departments)
│   │   └── page.tsx            # Cinematic landing page
│   ├── components/             # Reusable UI & Layout components
│   ├── config/
│   │   └── support.config.ts   # Centralized support channels & operating hours
│   ├── features/               # Domain-specific view components
│   ├── lib/
│   │   ├── auth/               # Guards, tokens, cookies, sliding-window rate limiter
│   │   ├── db/                 # Mongoose connection pooling for serverless
│   │   ├── services/           # Authoritative business logic services
│   │   └── validation/         # Zod schemas for input validation
│   ├── models/                 # Mongoose schemas with compound indexes
│   ├── scripts/                # Database seed, migration, and verification scripts
│   └── tests/                  # 17 automated test suites (100% passing)
├── next.config.ts              # Production configuration with security headers
└── package.json
```

### Security & Compliance Architecture
1. **Zero Client Secrets**: JWT tokens are stored exclusively in `httpOnly`, `secure`, `sameSite: "lax"` cookies. No tokens or secrets are stored in `localStorage` or `sessionStorage`.
2. **Persistent Rate Limiting**: Authentication endpoints (`/api/auth/login` and `/api/auth/activate`) are safeguarded by a persistent MongoDB-backed sliding-window rate limiter (`RateLimitModel`). Accounts permit up to 5 attempts per 2-minute window. Mismatched portal role selections are refunded without consuming lockout allowances.
3. **Cache Components & Suspense Isolation**: Dynamic session verification (`cookies()`, `verifySessionToken`, `getCurrentUser`) is isolated behind React `<Suspense>` boundaries with matching fallback loading components, preventing uncached data warnings under Next.js 16 Partial Prerendering.
4. **Mongoose Immutability**: All atomic updates use modern `returnDocument: "after"` rather than deprecated `new: true` options.
5. **Production HTTP Headers**: Configured with `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `Strict-Transport-Security`.

---

## 6. Database Models

| Model | Collection | Primary Responsibility & Indexes |
| :--- | :--- | :--- |
| **`User`** | `users` | Identity, email, role (`coach`, `player`, `scout`), bcrypt `passwordHash` (hidden by default via `select: false`), active standing. Unique index on `email`. |
| **`Player`** | `players` | Profile details (full name, age), sport assignment, `sportHistory` timeline (`effectiveFrom`, `effectiveTo`), active/archived status. Unique index on `userId`. |
| **`Scout`** | `scouts` | Talent scout profile (full name, user reference), active status. Unique index on `userId`. |
| **`Sport`** | `sports` | Academy disciplines (`name`, `normalizedName`, `description`, `isActive`). Unique index on `normalizedName`. |
| **`PracticeSession`**| `practicesessions` | Session date, sport reference, status (`open`, `closed`), closure timestamp. Compound index on `(sportId, sessionDate)`. |
| **`Attendance`** | `attendances` | Session reference, player reference, status (`present`, `absent`), marked timestamp. Compound unique index on `(sessionId, playerId)`. |
| **`Match`** | `matches` | Title, normalized title, opponent name, normalized opponent, sport ID, date, status (`draft`, `finalized`). Compound unique index on `(sportId, matchDate, normalizedOpponent, normalizedTitle)`. |
| **`MatchParticipant`**| `matchparticipants`| Match reference, player reference, individual performance score ($0.0 - 10.0$). Compound unique index on `(matchId, playerId)`. |
| **`CoachRemark`** | `coachremarks` | Player reference, coach user reference, remark content, edit timestamps. Index on `(playerId, createdAt)`. |
| **`ActivationCode`** | `activationcodes` | Single-use 8-character hex code bcrypt hash, user reference, 24-hour expiration timestamp, claimed timestamp. Index on `(userId, usedAt, expiresAt)`. |
| **`RateLimit`** | `ratelimits` | Key (IP/email), sliding-window timestamps, TTL expiration index. |

---

## 7. Local Setup & Development

### Prerequisites
- Node.js `v20.x` or higher
- MongoDB Atlas cluster or local MongoDB instance

### 1. Clone & Install
```bash
git clone https://github.com/sourav0006/vibe-coding-challenge-2-0-12-samose.git
cd one-academy
npm install
```

### 2. Configure Environment Variables
Create `.env.local` based on `.env.example`:
```bash
cp .env.example .env.local
```

Populate the required values:
```env
# MongoDB Atlas Database Connection String (Required)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/one-academy?retryWrites=true&w=majority

# Authentication Secret for JWT session cookies (Minimum 32 characters, Required)
AUTH_SECRET=your-random-32-character-secret-key-for-jwt-signing

# Optional Coach Bootstrap Credentials
COACH_EMAIL=coach@gmail.com
COACH_PASSWORD=Coach@456

# Application Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Seed Database & Bootstrap Coach
```bash
# Seed initial sports catalogue (Badminton, Football, Basketball, etc.)
npm run db:seed

# Bootstrap the initial Coach account
npm run auth:init-coach
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the landing page.

---

## 8. Testing & Quality Assurance

One Academy includes **17 automated test suites** validating every architectural boundary, business rule, and invariant:

```bash
# Run all 17 automated test suites
npm test

# Run ESLint code quality checks
npm run lint

# Run Next.js production build verification
npx next build --webpack
```

### Test Suite Breakdown (100% Passing)
1. `auth.test.ts`: Password hashing, JWT sessions, activation codes, rate limiting.
2. `coach.test.ts`: Sports catalogue, player management, RBAC matrix.
3. `session-attendance.test.ts`: Session lifecycle, attendance constraints, historical eligibility.
4. `match-scoring.test.ts`: Match creation, scoring scale ($0.0 - 10.0$), finalization locking.
5. `readiness.test.ts`: Readiness engine, $75\%$ attendance + 2 finalized matches boundary conditions.
6. `player-remarks.test.ts`: Private coach remarks lifecycle and RBAC isolation.
7. `scout-management.test.ts`: Scout creation, activation, and listing.
8. `logout-login-lifecycle.test.ts`: Session cookie clearing, token expiry rejection.
9. `multiple-pending-accounts.test.ts`: Non-blocking multi-account activation code generation.
10. `coach-dashboard-redesign.test.ts`: Coach overview, layout persistence, analytics.
11. `player-portal-redesign.test.ts`: Athlete portal views, safe DTO data minimization.
12. `scout-dashboard-redesign.test.ts`: Talent discovery views, sport filter pills, 404 security.
13. `auth-redesign.test.ts`: Auth layout, fox mascot states, role tabs.
14. `navigation-freshness.test.ts`: Cache invalidation, dynamic data refresh, form reset.
15. `task2-auth-attendance.test.ts`: 2-minute lockout cooldown, role mismatch refund, historical attendance eligibility.
16. `task3-public-branding.test.ts`: Legal disclosures, support channels, activation help, favicon branding.
17. `production-fixes.test.ts`: React Suspense boundaries on all dashboard routes, zero `new: true` Mongoose deprecations.

---

## 9. Legal & Support Channels

One Academy provides full public transparency and dedicated administrative support:

- **Privacy Policy**: Accessible at [`/legal?tab=privacy`](https://one-academy-exclrs.vercel.app/legal?tab=privacy) covering RBAC data isolation, cryptographic hashing, and data subject review/correction rights.
- **Terms of Use**: Accessible at [`/legal?tab=terms`](https://one-academy-exclrs.vercel.app/legal?tab=terms) outlining acceptable use, fixture score immutability, and attendance integrity.
- **Account Activation Help**: Accessible at [`/activate/help`](https://one-academy-exclrs.vercel.app/activate/help) providing a 7-step guide and troubleshooting scenarios.
- **Contact & Support**: Accessible at [`/support`](https://one-academy-exclrs.vercel.app/support).
  - **Official Emails**: `souravn0612@gmail.com` · `alokrai0327@gmail.com`
  - **Official Telephones**: `+91 7480926552` · `+91 9025712162`
  - **Academy Operating Hours**: Monday – Sunday: 7:00 AM – 8:00 PM IST
  - **Support Availability**: Monday – Saturday: 9:00 AM – 6:00 PM IST *(Sunday support is unavailable; academy remains open for scheduled training)*

---

## 10. Project Information

- **Project**: One Academy
- **Team**: 12 SAMOSE
- **Competition**: Vibe Coding Challenge 2.0
- **License**: Evaluation & Challenge Submission Only
