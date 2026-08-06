# Task 4-b: Implement Auth Persistence via localStorage

## Agent: Auth Persistence

## Summary
Implemented localStorage-based auth persistence so users remain logged in after page refresh. The session cookie remains the source of truth for API calls; localStorage is used only for UI state hydration.

## Changes Made

### 1. `src/lib/store.ts` — Auth persistence helpers + store actions
- Added `AUTH_STORAGE_KEY = 'reval:auth:v1'`
- Created `PersistedAuth` interface (userRole, user with safe Pick, onboardingComplete)
- `loadAuthFromStorage()` — reads from localStorage with shape validation
- `saveAuthToStorage()` — writes minimal auth state to localStorage
- `clearAuthStorage()` — removes the localStorage key
- Exported `loadAuthFromStorage`, `clearAuthStorage`, `AUTH_STORAGE_KEY`
- Wired `saveAuthToStorage` into `setUserRole`, `setUser`, `setOnboardingComplete`, `updateUser`
- Added `logout()` action — clears localStorage + resets auth state
- Added `hydrateAuth()` action — reads from localStorage and sets store state
- Hydrated store initial values from localStorage on store creation

### 2. `src/app/api/auth/me/route.ts` — NEW session validation endpoint
- GET handler validates session cookie via `verifyToken()`
- Returns user data (id, name, avatar, phone, role, grade, major, goal, dailyTargetHours, assignedAdvisorId) if valid
- Returns 401 if cookie missing, token invalid/expired, or user inactive

### 3. `src/app/page.tsx` — Mount-time hydration + session validation
- On mount, hydrates auth from localStorage via `hydrateAuth()`
- Validates session with `/api/auth/me`:
  - If 401 → clears localStorage and calls `logout()`
  - If valid → refreshes user data from server and loads role-specific data
  - Network error → trusts localStorage + cookie combo (offline tolerance)

### 4. `src/components/settings/SettingsView.tsx` — Logout uses store action
- `handleLogout` now calls `useAppStore.getState().logout()` instead of `window.location.href = '/'`

### 5. `src/components/shared/CommandPalette.tsx` — Logout uses store action
- `logout` callback now calls `useAppStore.getState().logout()` instead of `window.location.href = '/'`

## Verification
- TypeScript: zero errors in modified files
- ESLint: passes cleanly (no errors, no warnings)
- Dev server: compiles and serves pages successfully
