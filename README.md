# The Digital Breakroom

A virtual breakroom for remote and hybrid teams to recharge, connect, and build community during the workday. Features mood check-ins, breathing exercises, casual games, a watercooler wall, community stories, friends, direct messages, multiplayer games, XP/badges/leaderboards, and admin moderation tools.

## Tech Stack

- **Frontend:** React, Vite, TanStack Router, TailwindCSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Deployment:** Cloudflare Workers
- **Testing:** Playwright E2E

## Quick Start

### Install Dependencies
```cmd
npm install
```

### Development
```cmd
npm run dev
```

### Build
```cmd
npm run build
```

### Run E2E Tests (Local)
```cmd
npm run test:e2e
```

### Run E2E Tests (Production)
```cmd
set PLAYWRIGHT_BASE_URL=https://your-deployment-url && npm run test:e2e
```

### Type Check
```cmd
npx tsc --noEmit
```

## Environment Variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Documentation

- [Demo Guide](docs/DEMO_GUIDE.md) — How to present the app
- [Launch Checklist](docs/LAUNCH_CHECKLIST.md) — Pre-launch verification
- [Product Summary](docs/PRODUCT_SUMMARY.md) — Non-technical overview
- [Technical Notes](docs/TECHNICAL_NOTES.md) — Architecture and commands

## Project Structure

```
src/
  components/    Reusable UI components
  lib/           Supabase utilities, auth, i18n, gamification, etc.
  routes/        Page-level route components (TanStack Router)
docs/            Demo and launch documentation
tests/e2e/       Playwright E2E tests
```

## Key Features

- Mood check-in with 5 categories
- Breathing exercises and focus timer
- 10+ casual games (single-player and multiplayer Tic Tac Toe)
- Watercooler Wall with posts, media, comments, likes, and reporting
- Community stories with submission and moderation workflow
- Friends system with search and requests
- Direct messages with real-time updates
- Rewards: XP, levels, badges, leaderboards
- Notifications center
- Admin analytics and moderation dashboards
- 7-language support (English, Urdu, Arabic, Spanish, French, German, Hindi)
- Mobile-responsive
- Privacy-hardened (email masking, char limits, cooldowns, confirmation dialogs)
