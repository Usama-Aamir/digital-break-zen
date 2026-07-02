# The Digital Breakroom — Launch Checklist

## Supabase Environment
- [ ] `VITE_SUPABASE_URL` set in `.env` and Cloudflare workers secrets
- [ ] `VITE_SUPABASE_ANON_KEY` set in `.env` and Cloudflare workers secrets
- [ ] Supabase project URL is accessible
- [ ] Anon key has correct permissions (no service role key in frontend)
- [ ] Supabase project region is appropriate for target users

## Cloudflare Deployment
- [ ] `wrangler.jsonc` configured correctly (do not change during launch)
- [ ] Build output in `.output/` directory
- [ ] Deployment URL is accessible
- [ ] Custom domain configured (if applicable)
- [ ] HTTPS is active

## Auth
- [ ] Email/password sign-up works
- [ ] Email/password sign-in works
- [ ] Magic link sign-in works (if enabled)
- [ ] Password reset flow works
- [ ] Sign-out works
- [ ] Session persists across page reloads
- [ ] Auth errors show friendly messages (no raw Supabase errors)

## Row Level Security (RLS)
- [ ] RLS enabled on all tables
- [ ] Users can only read their own profile data
- [ ] Users can only insert/update their own posts, comments, drafts
- [ ] Admin can read all submissions and posts
- [ ] Public can read approved stories and published watercooler posts
- [ ] No table allows public write without auth

## Storage
- [ ] Watercooler media bucket exists
- [ ] Image uploads limited to 5MB
- [ ] Video uploads limited to 25MB
- [ ] Allowed MIME types enforced (image/jpeg, image/png, image/gif, image/webp, video/mp4, video/webm)
- [ ] Storage RLS policies restrict uploads to authenticated users

## Realtime
- [ ] Notifications realtime subscription works
- [ ] Direct messages realtime subscription works (if enabled)
- [ ] Watercooler posts realtime updates work (if enabled)
- [ ] Realtime errors are handled gracefully (no crash)

## E2E Tests
- [ ] All E2E tests pass or auth-only tests skip gracefully
- [ ] `npm run test:e2e` runs without configuration errors
- [ ] `PLAYWRIGHT_BASE_URL` set to production URL for production tests
- [ ] No test creates permanent data in production database

## Privacy
- [ ] User emails are never displayed publicly
- [ ] Admin UI masks emails (e.g., `xx•••@domain`)
- [ ] Display names default to "Breakroom friend" when not set
- [ ] Anonymous posting works on watercooler
- [ ] No raw Supabase/RLS error messages shown to users
- [ ] No `console.log` of sensitive data in production
- [ ] Privacy & Safety card visible on account page

## Admin
- [ ] Admin email is configured in `adminSubmissions.ts`
- [ ] `useIsAdmin` hook correctly identifies admin users
- [ ] Non-admin users cannot access admin routes
- [ ] Admin analytics page loads with data
- [ ] Story moderation (approve/reject) works with confirmation dialog
- [ ] Watercooler moderation (hide/delete) works with confirmation dialog
- [ ] Admin pages show friendly "access restricted" message for non-admins

## Mobile
- [ ] Home page is responsive
- [ ] Watercooler wall is usable on mobile
- [ ] Navigation sidebar collapses on mobile
- [ ] Forms are usable on touch devices
- [ ] No horizontal scroll on any page
- [ ] Text is readable on small screens

## Backup / Rollback
- [ ] Previous deployment version is accessible via Cloudflare dashboard
- [ ] Supabase database has automated backups enabled
- [ ] Story drafts are saved locally as fallback
- [ ] Watercooler posts fall back to localStorage if Supabase is unavailable
- [ ] Rollback procedure documented (redeploy previous wrangler version)

## Demo Readiness
- [ ] Demo Guide (`docs/DEMO_GUIDE.md`) is up to date
- [ ] Product Summary (`docs/PRODUCT_SUMMARY.md`) is ready to share
- [ ] All routes load without crashing when logged out
- [ ] Empty states are friendly and clear
- [ ] Loading states are friendly
- [ ] Error messages are user-friendly and workplace-safe
- [ ] Language switching works
- [ ] No placeholder text visible in production

## PWA / Mobile App
- [ ] `manifest.webmanifest` is accessible at `/manifest.webmanifest`
- [ ] Manifest has name, short_name, start_url, display: standalone
- [ ] App icons exist in `public/icons/` (SVG format)
- [ ] `theme-color` meta tag is set in HTML head
- [ ] `apple-mobile-web-app-capable` meta tag is set
- [ ] Service worker (`/sw.js`) is accessible and registers without errors
- [ ] Offline page (`/offline.html`) loads when network is unavailable
- [ ] Service worker does not cache Supabase API calls or auth
- [ ] Install prompt component exists on account page
- [ ] Account page shows Mobile App card with install instructions
- [ ] Safe-area CSS active in standalone mode (notch, home indicator)
- [ ] All key routes load at 390x844 viewport without horizontal scroll
- [ ] App is installable on Chrome/Edge (Add to Home Screen works)
- [ ] App works on iOS Safari (Share → Add to Home Screen)
- [ ] Future Capacitor Android path documented in TECHNICAL_NOTES.md
