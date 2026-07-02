# The Digital Breakroom — Technical Notes

## Frontend Stack
- **Framework:** React 18+ with Vite
- **Routing:** TanStack Router (file-based)
- **Styling:** TailwindCSS with custom glass-card design system
- **State:** React hooks (useState, useEffect, useContext)
- **Icons:** Lucide React
- **Internationalization:** Custom `t()` function with 7 languages
- **Build:** Vite + Nitro for Cloudflare Workers output

## Supabase Modules Used
- **Auth:** Email/password, magic link, session management
- **Database (PostgreSQL):** All data storage with RLS policies
- **Storage:** Media uploads for watercooler posts (images/videos)
- **Realtime:** Notifications and direct message subscriptions

## Main Routes
| Route | Description |
|---|---|
| `/` | Home — mood check-in, break activities, games |
| `/watercooler` | Watercooler Wall — posts, media, comments, likes |
| `/community-stories` | Browse approved community stories |
| `/submit-story` | Submit a story with draft saving |
| `/friends` | Friend search, requests, and list |
| `/messages` | Direct messages with friends |
| `/games-multiplayer` | Multiplayer Tic Tac Toe with invites |
| `/rewards` | XP, badges, levels, leaderboard |
| `/notifications` | Notification center |
| `/my-breakroom` | Personal activity summary and streaks |
| `/account` | Account settings, privacy info, admin links |
| `/admin-analytics` | Admin analytics dashboard |
| `/admin-submissions` | Story moderation dashboard |
| `/admin-watercooler` | Watercooler moderation dashboard |
| `/blog` | Blog/announcements page |
| `/auth` | Sign in / sign up |
| `/onboarding` | New user onboarding flow |

## Main Database Tables
| Table | Purpose |
|---|---|
| `profiles` | User display names, usernames, avatars |
| `user_break_activity` | Activity tracking (mood, breaks, posts) |
| `watercooler_posts` | Watercooler wall posts |
| `watercooler_post_comments` | Comments on watercooler posts |
| `watercooler_post_likes` | Likes on watercooler posts |
| `watercooler_post_reports` | User reports for moderation |
| `story_submissions` | Community story submissions |
| `story_drafts` | Cloud-saved story drafts |
| `friendships` | Friend relationships and requests |
| `direct_message_conversations` | DM conversation metadata |
| `direct_message_members` | Conversation membership |
| `direct_messages` | Individual messages |
| `game_rooms` | Multiplayer game rooms |
| `game_players` | Players in game rooms |
| `game_invites` | Game invitation records |
| `user_xp` | XP, level, streak data |
| `xp_events` | Individual XP event log |
| `badges` | Badge definitions |
| `user_badges` | Earned badges per user |
| `notifications` | User notifications |

## Admin Access Model
- Admin email is hardcoded in `src/lib/adminSubmissions.ts` as `ADMIN_EMAIL`
- `isAdminEmail(email)` checks if a user's email matches
- `useIsAdmin()` hook wraps this for React components
- All admin routes check admin status and render "access restricted" for non-admins
- No server-side admin role — purely client-side check (RLS provides real protection)

## Testing Setup
- **Framework:** Playwright
- **Config:** `playwright.config.ts`
- **Test files:** `tests/e2e/*.spec.ts`
- **Run locally:** `npm run test:e2e`
- **Run against production:** Set `PLAYWRIGHT_BASE_URL` environment variable
- Tests are non-auth dependent where possible (auth-only tests skip gracefully)

## Deployment Setup
- **Platform:** Cloudflare Workers
- **Config:** `wrangler.jsonc` (do not modify during launch)
- **Build command:** `npm run build` (outputs to `.output/`)
- **Deploy:** Via Cloudflare dashboard or Wrangler CLI
- **Environment variables:** Set in Cloudflare dashboard or `wrangler secret`

## Important Commands

### Build
```cmd
cd "C:\Users\Ghulam Muhammad\Downloads\digital-break-zen-git"
npm.cmd run build
```

### Run E2E Tests (Production)
```cmd
cd "C:\Users\Ghulam Muhammad\Downloads\digital-break-zen-git"
set PLAYWRIGHT_BASE_URL=https://digital-break-zen.aamirusama8.workers.dev && npm.cmd run test:e2e
```

### Run E2E Tests (Local)
```cmd
cd "C:\Users\Ghulam Muhammad\Downloads\digital-break-zen-git"
npm.cmd run test:e2e
```

### Type Check
```cmd
cd "C:\Users\Ghulam Muhammad\Downloads\digital-break-zen-git"
npx tsc --noEmit
```

### Preview Build Locally
```cmd
cd "C:\Users\Ghulam Muhammad\Downloads\digital-break-zen-git"
npx vite preview
```
