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
  lib/           Supabase utilities, auth, i18n, gamification, SW registration, etc.
  routes/        Page-level route components (TanStack Router)
public/
  manifest.webmanifest  PWA manifest
  sw.js                 Service worker
  offline.html          Offline fallback page
  icons/                App icons (SVG)
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
- PWA installable (Add to Home Screen on Android/iOS, offline fallback)

## PWA / Mobile App

The app is a Progressive Web App (PWA) — installable on Android, iOS, and desktop browsers.

- **Install:** Visit the app in Chrome/Edge → tap "Install" or use browser menu → Install app
- **iOS:** Safari → Share button → Add to Home Screen
- **Offline:** Service worker caches static assets and shows an offline page when the network is unavailable
- **Safe areas:** Notch and home indicator padding active in standalone mode
- **Android app:** Capacitor wrapper ready (see below)

## Android (Capacitor)

The app has a Capacitor Android wrapper for building a native APK/AAB.

- **App ID:** `com.digitalbreakroom.app`
- **Config:** `capacitor.config.ts`
- **Mode:** Server URL (loads production web app in WebView — app is SSR-based)

### Commands
```cmd
npm.cmd run android:sync   :: Build + sync to Android
npm.cmd run android:open   :: Open in Android Studio
```

See [Android Capacitor Guide](docs/ANDROID_CAPACITOR_GUIDE.md) for full setup, build, and Play Store instructions.
