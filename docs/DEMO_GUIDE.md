# The Digital Breakroom — Demo Guide

## App Name
The Digital Breakroom

## Demo URL
<!-- Replace with your deployed URL -->
https://digital-break-zen.aamirusama8.workers.dev

## Purpose
A virtual breakroom for remote and hybrid teams to recharge, connect, and build community during the workday. It provides quick stress-relief activities, casual social interaction, and gentle gamification to encourage healthy break habits.

## Target Users
- Remote and hybrid workers who need structured breaks
- Team leads looking to foster team bonding
- Anyone who wants a calm, workplace-safe space to decomompress

## Main User Journey
1. **Sign in** at `/auth` using email/password or magic link
2. **Check in with your mood** on the home page (`/`)
3. **Take a break** — choose a breathing exercise, focus timer, or quick game
4. **Visit the Watercooler Wall** (`/watercooler`) to post, comment, and like
5. **Browse Community Stories** (`/community-stories`) for shared experiences
6. **Submit your own story** (`/submit-story`) with draft saving
7. **Add friends** (`/friends`) and start direct messages (`/messages`)
8. **Play multiplayer Tic Tac Toe** (`/games-multiplayer`) with friends
9. **Earn XP and badges** (`/rewards`) and check the leaderboard
10. **View notifications** (`/notifications`) for friend requests, replies, and badges
11. **Track your break activity** (`/my-breakroom`) with streaks and mood summaries
12. **Manage your account** (`/account`) including privacy & safety info

## Admin Journey
1. Sign in with the admin email account
2. **Admin Analytics** (`/admin-analytics`) — view platform metrics, top users, top posts
3. **Story Moderation** (`/admin-submissions`) — approve or reject submitted stories
4. **Watercooler Moderation** (`/admin-watercooler`) — hide or delete inappropriate posts

## Features Completed
- Mood check-in with 5 mood categories
- Breathing exercises and focus timer
- 10+ casual games (single-player and multiplayer)
- Watercooler Wall with posts, media, comments, likes, reports
- Community stories with submission and moderation workflow
- Friends system with search, requests, and acceptance
- Direct messages with real-time updates
- Multiplayer Tic Tac Toe with game invites
- Rewards system: XP, levels, badges, leaderboards
- Notifications center with real-time updates
- Admin analytics dashboard
- Admin moderation dashboards (stories + watercooler)
- Multi-language support (English, Urdu, Arabic, Spanish, French, German, Hindi)
- Mobile-responsive UX
- Privacy and safety hardening (email masking, char limits, cooldowns, confirmation dialogs)
- Playwright E2E test suite

## Demo Accounts
<!-- Replace with your actual demo credentials -->
- **Admin account:** _(use the admin email configured in Supabase)_
- **User account:** _(create a test user in Supabase auth)_

## What to Click During Demo
1. Start at the home page — click a mood card
2. Try a breathing exercise (3-5 breaths)
3. Go to Watercooler Wall — type a post, see the character counter
4. Click like on a post, try expanding comments
5. Visit Community Stories — read a story
6. Go to Rewards — show XP, level, badges
7. Check the Leaderboard tab
8. Visit My Breakroom — show activity summary and streak
9. If admin: show Admin Analytics and moderation pages
10. Switch language from the sidebar to show i18n

## Known Limitations
- No push notifications (in-app notifications only)
- No file uploads beyond images/videos on watercooler posts
- Multiplayer games limited to Tic Tac Toe
- No direct video/audio calls
- Story drafts stored locally if Supabase is not configured
- Rate limiting is client-side only (cooldowns)

## Future Improvements
- More multiplayer games (Connect 4, Word games)
- Push notifications via Web Push API
- Scheduled break reminders
- Team/organization workspaces
- Activity calendars and streak goals
- Rich text editor for story drafts
- Voice notes on watercooler posts
