# The Digital Breakroom — Android Capacitor Guide

## Purpose

This guide covers the Capacitor Android wrapper that allows The Digital Breakroom web app to run as a native Android app/APK.

The app uses TanStack Start with SSR (server-side rendering) deployed on Cloudflare Workers. Because there is no static `index.html` to bundle, the Capacitor config uses `server.url` to load the production web app inside an Android WebView. All Supabase communication (auth, database, realtime, storage) works normally via the public anon key.

## Installed Dependencies

- `@capacitor/core` — Capacitor runtime
- `@capacitor/cli` — Capacitor CLI tool
- `@capacitor/android` — Android platform package

## App Details

- **App ID:** `com.digitalbreakroom.app`
- **App Name:** The Digital Breakroom
- **Web Directory:** `.output/public` (static assets from Vite/Nitro build)
- **Server URL:** `https://digital-break-zen.aamirusama8.workers.dev`
- **Config file:** `capacitor.config.ts`

## Why Server URL Mode?

The app is SSR-based (TanStack Start + Nitro). The build produces server-side code in `.output/server/` and static assets in `.output/public/`, but there is no standalone `index.html` for a purely static bundle. Capacitor loads the production URL in a WebView, which preserves all SSR functionality.

To switch to bundled static assets in the future (e.g., if a static export mode is added), remove the `server.url` from `capacitor.config.ts` and run `npx cap sync android`.

## Setup Commands (Windows CMD)

### Prerequisites
- Node.js 18+
- Android Studio (for building APK/AAB)
- Java JDK 17+ (bundled with Android Studio)

### Initial Setup (already done)
```cmd
cd "C:\Users\Ghulam Muhammad\Downloads\digital-break-zen-git"
npm.cmd install @capacitor/core @capacitor/cli @capacitor/android --save
npx.cmd cap add android
```

### Sync Web Assets + Native Project
```cmd
cd "C:\Users\Ghulam Muhammad\Downloads\digital-break-zen-git"
npm.cmd run android:sync
```

This runs `npm run build` then `npx cap sync android`.

### Open in Android Studio
```cmd
cd "C:\Users\Ghulam Muhammad\Downloads\digital-break-zen-git"
npm.cmd run android:open
```

This opens the `android/` folder in Android Studio.

### Build APK (Debug)
1. Open in Android Studio: `npm.cmd run android:open`
2. Select **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Or from command line:
```cmd
cd "C:\Users\Ghulam Muhammad\Downloads\digital-break-zen-git\android"
.\gradlew.bat assembleDebug
```
4. Debug APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Build AAB (Release for Play Store)
1. Open in Android Studio: `npm.cmd run android:open`
2. Select **Build → Generate Signed Bundle / APK**
3. Choose **Android App Bundle (.aab)**
4. Provide or create a signing keystore
5. Or from command line:
```cmd
cd "C:\Users\Ghulam Muhammad\Downloads\digital-break-zen-git\android"
.\gradlew.bat bundleRelease
```
6. Release AAB output: `android/app/build/outputs/bundle/release/app-release.aab`

## Signing Key Warning

- **Never commit signing keys to git.** The `.gitignore` excludes `*.keystore` and `*.jks` files.
- Store your release keystore securely (e.g., Google Play App Signing or a secure password manager).
- For debug builds, Android Studio auto-generates a debug keystore (safe to ignore).
- For release builds, create a keystore:
```cmd
keytool -genkey -v -keystore release.keystore -alias digital-breakroom -keyalg RSA -keysize 2048 -validity 10000
```
- Store the keystore password, alias, and key password securely.

## Play Store Future Checklist

- [ ] Create a Google Play Developer account ($25 one-time fee)
- [ ] Generate a release signing keystore (do not commit to git)
- [ ] Configure `android/app/build.gradle` signing config for release
- [ ] Build a release AAB: `.\gradlew.bat bundleRelease`
- [ ] Create a Play Store listing with screenshots, description, icons
- [ ] Set up Google Play App Signing (recommended)
- [ ] Upload AAB to Play Console
- [ ] Complete content rating questionnaire
- [ ] Set pricing (free)
- [ ] Submit for review

## App Icons & Splash

Currently using PWA SVG icons from `public/icons/`. For production Android icons:
1. Generate PNG icons at required densities using Android Studio's Image Asset Studio
2. Or use `@capacitor/assets` package:
```cmd
npm.cmd install @capacitor/assets --save-dev
npx.cmd capacitor-assets generate --android
```
3. Place source icon at `resources/icon.png` (1024x1024) and splash at `resources/splash.png` (2732x2732)
4. Generated icons will be placed in `android/app/src/main/res/`

## Service Worker in Capacitor

The service worker is **disabled** in the Capacitor native WebView to avoid conflicts. The `registerServiceWorker.ts` file checks for:
- `window.capacitor.isNativePlatform()` — Capacitor native detection
- `capacitor://` or `file://` origin — fallback detection

This ensures the SW does not interfere with the WebView's loading of the production URL.

## Mobile App Behavior

- **Android back button:** Handled by Capacitor WebView — navigates back in browser history
- **Start URL:** Loads `/` from the production server
- **Supabase auth:** Works normally — OAuth redirects open in external browser
- **No horizontal overflow:** Mobile CSS and viewport settings apply
- **Links:** Internal links open in WebView; external links open in external browser
- **File/media upload:** Works via Android file picker through WebView

## Troubleshooting

### Blank screen in Android app
- Check internet connection
- Verify `server.url` in `capacitor.config.ts` is correct
- Check Logcat in Android Studio for WebView errors

### Build fails with Gradle error
- Ensure Android Studio and JDK are installed
- Try `cd android && .\gradlew.bat clean` then rebuild

### Supabase auth redirect not working
- Ensure your Supabase project allows the app's redirect URLs
- For OAuth, Capacitor uses the external browser which returns to the app

### Changes not appearing in Android app
- Run `npm.cmd run android:sync` to rebuild and sync web assets
- Clear app data on device/emulator

### "Web directory not found"
- Run `npm.cmd run build` first to generate `.output/public/`
- Then run `npx.cmd cap sync android`
