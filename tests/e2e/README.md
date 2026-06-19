# E2E Tests

This directory contains end-to-end tests for The Digital Breakroom using Playwright.

## How to Run Local Tests

### Method 1: Start Dev Server Manually (Recommended)

Start the dev server in one terminal:

```cmd
npm run dev -- --host 127.0.0.1
```

Then run tests in another terminal:

```cmd
npm run test:e2e
```

This will:
1. Reuse the existing dev server
2. Run all E2E tests in headless mode
3. Generate an HTML report

### Method 2: Auto-Start Dev Server

To run the E2E tests with automatic dev server startup:

```cmd
npm run test:e2e
```

**Note:** This may timeout if the dev server takes too long to start. If you see a timeout error, use Method 1 instead.

## How to Run UI Mode

To run tests with the Playwright UI (interactive mode):

```cmd
npm run test:e2e:ui
```

This opens the Playwright Test UI where you can:
- See all tests
- Run individual tests
- Inspect the browser
- Debug failures

## How to Run Headed Mode

To run tests with visible browser windows:

```cmd
npm run test:e2e:headed
```

## How to View Test Report

After running tests, view the HTML report:

```cmd
npm run test:e2e:report
```

## How to Test Deployed Site

To run tests against the deployed production site instead of local:

```cmd
set PLAYWRIGHT_BASE_URL=https://digital-break-zen.aamirusama8.workers.dev
npm run test:e2e
```

## How to Run Optional Auth Tests

Some tests require real Supabase credentials. To run these:

```cmd
set E2E_TEST_EMAIL=your-test-email@example.com
set E2E_TEST_PASSWORD=your-test-password
npm run test:e2e
```

**Note:** These tests will be skipped if the environment variables are not set.

## Test Coverage

The E2E tests cover:

- **Navigation**: Navigation between main pages
- **Dashboard**: Dashboard loading and content
- **Auth & Onboarding**: Auth pages and onboarding flow
- **Community Stories**: Public story viewing and submission
- **Watercooler**: Public wall viewing and posting restrictions
- **Account & Admin**: Account page and admin moderation access

## Test Files

- `navigation.spec.ts` - Tests navigation between pages
- `dashboard.spec.ts` - Tests dashboard functionality
- `auth-onboarding.spec.ts` - Tests auth and onboarding flows
- `community-stories.spec.ts` - Tests community stories feature
- `watercooler.spec.ts` - Tests watercooler feature
- `account-admin.spec.ts` - Tests account and admin pages
- `helpers.ts` - Test helper functions

## Browser Installation

Playwright browsers are already installed. If you need to reinstall them:

```cmd
npx playwright install
```

## Troubleshooting

If tests fail due to the dev server not starting:
1. Make sure port 5173 is available
2. Try starting the dev server manually: `npm run dev -- --host 127.0.0.1`
3. Then run tests without the web server: `npm run test:e2e` (will reuse existing server)
