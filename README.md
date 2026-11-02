# One Academy — Multi-Sport Academy Management Platform
### Vibe Coding Challenge 2.0 | Team: 12 SAMOSE

> A production-grade sports management platform engineered for athletic academies to streamline talent development, training schedules, session attendance, competitive match fixtures, individual scoring, dynamic scouting readiness, and coach feedback.

---

## 1. Project Overview & Core Objectives

**One Academy** is a centralized, single-academy multi-sport management platform supporting coaches, athletes, and external talent scouts. Modern sports academies face fragmented workflows: practice schedules, match records, attendance sheets, and scout evaluations are often scattered across spreadsheets, paper sheets, and chat apps.

One Academy unifies this ecosystem into an integrated platform with:
- **Authoritative Data Models**: Strict relational integrity via MongoDB Atlas and Mongoose.
- **Role-Based Workflows**: Custom-tailored portals for Coach (Administration), Player (Athlete Development), and Scout (Talent Discovery).
- **Dynamic Performance Engines**: Attendance calculation and scouting readiness dynamically computed on-the-fly from historical records rather than fragile, manually edited status flags.
- **Coach-to-Player Feedback**: Private developmental remarks and tactical pointers visible exclusively to coaches and the targeted athlete.
- **Scout Privacy & Talent Protection**: Strict data minimization ensuring scouts only discover verified, ready athletes with zero access to private coaching notes or internal credentials.
- **Pure Pitch-Green Aesthetic**: Custom design system crafted with athletic green accents, high-contrast accessible typography, and responsive mobile-first layouts.

---

## 2. Technology Stack

- **Framework**: [Next.js 16.4.3](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/) (Strict mode enabled)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose 9](https://mongoosejs.com/)
- **Validation**: [Zod](https://zod.dev/) (Strict runtime validation on all inputs and API routes)
- **Authentication**: Stateless HTTP-only cookie-based JWT sessions signed via [jose](https://github.com/panva/jose) (HS256)
- **Password Hashing**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js) with 10 salt rounds
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with CSS custom property tokens
- **Icons & Media**: Custom SVG icon system and cinematic video background

---

## 3. Features by Role

### 🏆 Coach (Full Academy Administration)
- **Dashboard Overview**: Key metrics (active roster, registered sports, practice attendance rate, scouting readiness rate) and quick action shortcuts.
- **Sports Catalogue**: Create, view, edit, and toggle sports with automatic duplicate name normalization and active player counts.
- **Player Management**: Register new athletes, assign disciplines, filter by status (Active, Pending, Archived), edit profile attributes, and archive/unarchive athletes.
- **Activation Code Management**: Single-use 8-character cryptographic activation code generation with 24-hour expiration and instant clipboard copy.
- **Session Management**: Schedule practice sessions, manage rosters, prevent duplicates on same sport/date, mark attendance (`Present` / `Absent`), and finalize sessions.
- **Match Management & Scoring**: Schedule fixtures against opponents, enforce same-day attendance eligibility constraints, record individual performance scores ($0.0 - 10.0$), and finalize matches with permanent immutability.
- **Scouting Readiness Board**: Global academy readiness matrix, metric cards, filtering by sport and readiness status, search, and granular deficiency breakdowns.
- **Coach Remarks & Player Feedback**: Add, view, edit, and delete private developmental evaluations and tactical notes for individual athletes.

### 🏃 Player (Athlete Development Portal)
- **Personal Dashboard**: Personalized welcome banner, discipline badges, attendance progress bar toward the $75\%$ benchmark, match metrics, and recent coach feedback preview.
- **Readiness Explanation**: Transparent, dynamic evaluation explaining readiness status (`READY` vs `NOT READY`) with requirement checklists and deficiency rationale.
- **Safe Profile**: Read-only credentials display (Name, Email, Age, Sport, Activation Status, Registration Date) with strict exclusion of security secrets.
- **Attendance History**: Paginated log of applicable closed practice sessions (Date, Sport, Status, Marked Date). Open sessions and other sports are excluded.
- **Match History**: Paginated fixtures table with individual performance scores ($0.0 - 10.0$ scale) and summary statistics (average score, highest score, lowest score).
- **Coach Feedback**: Chronological feed of private developmental remarks and tactical guidance from academy coaching staff.

### 🔍 Scout (Talent Discovery Portal)
- **Talent Discovery Grid**: Discoverable athlete cards displaying discipline, verified attendance, finalized matches played, average score, and top score.
- **Dynamic Sport Filter Pills**: Filter pills dynamically calculated to show only sports that have at least one qualified, discoverable athlete.
- **Verified Scouting Profiles**: Direct profile view showing verified competition history and performance metrics.
- **Strict Privacy Isolation**: Non-ready or archived athletes return `404 Not Found`. Coach remarks and sensitive credentials are completely omitted at the query and DTO level.

---

## 4. Business Invariants & Evaluation Rules

### A. Official Scouting Readiness Benchmark
A player is evaluated as **READY** if and only if both conditions are simultaneously satisfied:

$$\mathbf{Player\ Readiness} \iff (\text{Attendance Percentage} \ge 75.0\%) \land (\text{Finalized Matches Played} \ge 2)$$

- **Boundary Condition**: Exactly $75.0\%$ attendance and $\ge 2$ finalized matches qualifies.
- **Deficits**: $74.9\%$ attendance fails; $1$ match fails; $0$ matches fails; $100\%$ attendance with $1$ match fails.
- **N/A Attendance**: If there are $0$ applicable closed sessions, attendance is `N/A` and does not qualify.
- **Dynamic Derivation**: Calculated purely on-the-fly from closed sessions and finalized match participation. No stale status flags are stored in MongoDB.

### B. Practice Sessions & Attendance
- **Historical Sport Assignment**: A player is eligible for a session if and only if they were assigned to that sport on the scheduled session date based on their historical `sportHistory` window.
- **Denominators**: Open sessions never count towards attendance percentages.
- **Permanent Immutability**: Closed sessions reject attendance writes, edits, and re-opening.

### C. Match Management & Scoring
- **Finalized Matches**: Only finalized matches with a corresponding `MatchParticipant` record count toward a player's official matches played. Draft fixtures are strictly excluded.
- **Score Scale**: Individual scores are constrained to $0.0 - 10.0$ with decimal precision.
- **Finalization Prerequisites**: A match cannot be finalized if a practice session for the same sport on the match date remains open.

### D. Coach Remarks & Privacy
- **Strict Authorization**: Only coaches can create, edit, or delete remarks.
- **Cross-Player Protection**: Remarks are verified against player ownership; coaches cannot manipulate remarks for another player via mismatched IDs.
- **Absolute Scout Privacy**: Coach remarks are never fetched or exposed to Scouts in any API response or UI view.

---

## 5. Architecture & Directory Structure

```
one-academy/
├── public/
│   ├── icons/                  # Application icons
│   └── videos/
│       └── stadium-intro.mp4   # Cinematic landing video background
├── src/
│   ├── app/                    # Next.js 16 App Router
│   │   ├── (auth)/             # Login and Activation routes
│   │   ├── (dashboard)/        # Role-based dashboard layouts & views
│   │   │   ├── dashboard/coach/    # Coach administrative pages
│   │   │   ├── dashboard/player/   # Player athlete pages
│   │   │   └── dashboard/scout/    # Scout discovery pages
│   │   ├── api/                # Next.js Route Handlers (REST endpoints)
│   │   │   ├── auth/           # Login, logout, activation, session validation
│   │   │   ├── coach/          # Player, sport, session, match, remark, readiness APIs
│   │   │   ├── player/         # Player dashboard, profile, attendance, matches, remarks
│   │   │   └── scout/          # Scout player discovery, profile, sports catalogue
│   │   ├── globals.css         # Tailwind CSS v4 design tokens
│   │   └── page.tsx            # Cinematic landing page
│   ├── components/             # Reusable UI components & layouts
│   │   ├── layout/             # AppShell, Topbar, Navigation
│   │   ├── shared/             # Modals, Logo, Table components
│   │   └── ui/                 # Button, Card, Badge, Input, Select, Modal
│   ├── features/               # Modular client domain views
│   │   ├── coach/              # Coach views & player profiles
│   │   ├── player/             # Player portal views (Overview, Attendance, Matches, Remarks)
│   │   ├── readiness/          # Coach readiness matrix & Scout discovery views
│   │   ├── sessions/           # Session management & attendance views
│   │   ├── matches/            # Match fixtures & scoring views
│   │   └── sports/             # Sports catalogue views
│   ├── lib/
│   │   ├── auth/               # Guards (requireCoach, requirePlayer, requireScout), JWT, cookies
│   │   ├── db/                 # Mongoose connection pooling & serverless caching
│   │   ├── services/           # Authoritative business logic services
│   │   ├── validation/         # Zod schemas for validation across write endpoints
│   │   └── utils.ts            # Formatting helpers, class names combiner
│   ├── models/                 # Mongoose schemas & indexes
│   ├── scripts/                # Database seed & setup scripts
│   └── tests/                  # Automated unit and live Atlas integration test suites
├── next.config.ts              # Next.js config with production security headers
├── package.json
└── README.md
```

---

## 6. Local Setup & Execution Guide

### Prerequisites
- **Node.js**: v20 or higher
- **MongoDB Atlas**: An active cluster or MongoDB local instance

### Step 1: Clone & Install Dependencies
```bash
git clone <repository-url>
cd one-academy
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate the required values:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
AUTH_SECRET=your-32-char-random-secret-key-openssl-rand-base64-32
COACH_EMAIL=coach@oneacademy.com
COACH_PASSWORD=SecureCoachPassword123!
```

### Step 3: Seed Database & Bootstrap Coach
```bash
# Seed initial sports catalogue (Football, Basketball, Volleyball, etc.)
npm run db:seed

# Initialize the single academy coach account
npm run auth:init-coach
```

### Step 4: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Testing & Quality Assurance

### Automated Unit & Invariant Test Suite
Execute the full automated test suite covering all 9 completed development phases:
```bash
npm test
```
**Test Breakdown (112 Passed, 0 Failed)**:
- **Phase 3 (Authentication & RBAC Matrix)**: 17 tests
- **Phase 5 (Player & Sport Management)**: 20 tests
- **Phase 6 (Session & Attendance Engine)**: 25 tests
- **Phase 7 (Match Fixtures & Scoring Bounds)**: 19 tests
- **Phase 8 (Readiness Engine & Boundary Conditions)**: 13 tests
- **Phase 9 (Player Portal & Coach Remarks)**: 18 tests

### Live MongoDB Atlas Integration Suite
Execute live integration tests directly against the configured MongoDB Atlas cluster:
```bash
npm run test:live
```
**Live Integration Suites (100% Passed)**:
- `session-live-db.test.ts`: Practice session lifecycle, attendance marking, closed immutability.
- `match-live-db.test.ts`: Match fixtures, same-day attendance constraints, scoring bounds, finalization immutability.
- `readiness-live-db.test.ts`: Live readiness calculation, Scout discovery isolation, 404 security.
- `player-remarks-live-db.test.ts`: Athlete portal identity resolution, remarks lifecycle, cross-player protection, archived lockdown.

### Code Quality & Build Validation
```bash
# Verify ESLint (0 errors, 0 warnings)
npm run lint

# Production Next.js build compilation (46 routes)
npm run build
```

---

## 8. Deployment Guide (Vercel)

One Academy is designed for deployment on [Vercel](https://vercel.com/):

### Step 1: Push Repository to GitHub
Ensure all code is committed and pushed to your designated GitHub repository:
`vibe-coding-challenge-2-0-12-samose`

### Step 2: Import into Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/) and click **Add New** -> **Project**.
2. Select your repository.
3. Framework Preset: **Next.js** (detected automatically).
4. Root Directory: `./`.

### Step 3: Configure Environment Variables
In the **Environment Variables** section of the Vercel project configuration, add:
- `MONGODB_URI`: Your production MongoDB Atlas connection string.
- `AUTH_SECRET`: A fresh, secure 32+ character random secret (generate via `openssl rand -base64 32`).
- `COACH_EMAIL`: Initial coach email address.
- `COACH_PASSWORD`: Initial coach account password.

### Step 4: MongoDB Atlas IP Access
In your **MongoDB Atlas Dashboard** -> **Network Access**:
- Add Vercel's IP range or `0.0.0.0/0` (Allow Access from Anywhere) so Vercel's serverless functions can connect to your database.

### Step 5: Deploy
Click **Deploy**. Once built, Vercel will provide your live deployment URL.

---

## 9. Evaluator Access & Demo Workflow

Evaluators can test all three roles using the following workflows:

1. **Coach Portal**:
   - Navigate to `/login?role=coach`.
   - Log in using the bootstrapped credentials (`COACH_EMAIL` and `COACH_PASSWORD`).
   - Access `/dashboard/coach` to manage players, practice sessions, matches, readiness, and remarks.

2. **Player Onboarding & Portal**:
   - In the Coach dashboard, navigate to **Players** -> **Add Athlete**.
   - Create an athlete profile (e.g. `athlete@example.com`).
   - Generate an **Activation Code** for the player.
   - Navigate to `/activate`, enter the activation code, and set a password.
   - Log in at `/login?role=player` to access `/dashboard/player`.

3. **Scout Portal**:
   - Navigate to `/login?role=scout`.
   - Complete scout activation or sign in.
   - Access `/dashboard/scout` to discover athletes who have satisfied the readiness benchmark ($\ge 75\%$ attendance and $\ge 2$ finalized matches).

---

## 10. Submission Artifacts & Recommended Screenshots

For the final challenge submission, the following screenshots highlight the core features:
1. **Landing Page**: Cinematic stadium video intro with role cards (`/`).
2. **Coach Dashboard Overview**: Roster metrics, attendance stats, and quick actions (`/dashboard/coach`).
3. **Player Management & Activation**: Roster table with single-use activation modal (`/dashboard/coach/players`).
4. **Practice Session Attendance**: Real-time attendance sheet with closure lock (`/dashboard/coach/sessions/[id]`).
5. **Match Fixtures & Scoring**: Individual scoring sheet ($0.0 - 10.0$) and finalization (`/dashboard/coach/matches/[id]`).
6. **Coach Readiness Dashboard**: Academy readiness matrix with requirement checklists (`/dashboard/coach/readiness`).
7. **Scout Talent Discovery**: Filterable ready athlete cards and scout profile (`/dashboard/scout`).
8. **Player Dashboard Overview**: Athlete progress cards, attendance progress bar, and readiness rationale (`/dashboard/player`).
9. **Player Feedback & Remarks**: Confidential coach feedback feed (`/dashboard/player/remarks`).

---

**Team**: 12 SAMOSE  
**Challenge**: Vibe Coding Challenge 2.0  
**License**: Proprietary / Evaluation Only
