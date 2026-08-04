# Implementation Plan: PlateWise Stabilization & Unified Theme System

## Overview
This plan addresses Part A (diagnosing and fixing blank screen bugs, routing issues, auth race conditions, and missing navigation links) and Part B (implementing the Dia-inspired unified light/dark indigo theme system across PlateWise).

---

## Part A: Stabilization & Bug Fixes

### 1. Root Cause Diagnostics & Fixes
- **Blank Screen on Uncaught JS Error**:
  - Add a React `ErrorBoundary` component (`frontend/src/components/ErrorBoundary.jsx`) wrapping the app root in `main.jsx` / `App.jsx`.
  - When an unexpected component error occurs, `ErrorBoundary` renders a styled fallback card with a "Reload Page" / "Return Home" button instead of a white/blank screen.
- **Blank Screen on Vercel SPA Deep-Linking**:
  - Add `vercel.json` with rewrite rule `{"source": "/(.*)", "destination": "/index.html"}` to ensure direct navigation or refresh on routes like `/dashboard` serve `index.html`.
- **Blank Screen Post-Login Race Condition**:
  - Inspect `AuthContext.jsx` and `App.jsx`. Ensure protected route wrapper safely waits for `loading` to complete and checks `user` non-null before rendering `Dashboard` or components accessing `user.id`.
- **Missing "Back to Home" Link on Login**:
  - Update `AuthModal.jsx` / Auth view to include a explicit "← Back to Home" button/link that closes the modal or navigates to `/`.
- **Logo Navigation**:
  - Inspect all navbar/header components (`Navbar.jsx`, `Header.jsx`, `Dashboard.jsx`) to ensure clicking the PlateWise logo uses `Link to="/"` or triggers navigation to the landing page.

---

## Part B: Unified Theme System

### 1. CSS Design Tokens (`frontend/src/index.css`)
- **Light Mode Tokens**:
  - `--bg-base`: `#F8F8F8`
  - `--bg-surface`: `#FFFFFF`
  - `--border-hairline`: `#E5E5E5`
  - `--accent-primary`: `#5863EA` (Indigo)
  - `--accent-contrast`: `#000000`
  - `--text-primary`: `#252525`
  - `--text-secondary`: `#6B7280`
  - `--button-primary-bg`: `#000000`, `--button-primary-text`: `#FFFFFF`
  - `--button-secondary-bg`: `#EFEFEF`, `--button-secondary-text`: `#252525`
- **Dark Mode Tokens**:
  - `--bg-base`: `#0E0E12`
  - `--bg-surface`: `#17171D`
  - `--border-hairline`: `#26262E`
  - `--accent-primary`: `#6E77F2` (Lifted Indigo)
  - `--accent-contrast`: `#FFFFFF`
  - `--text-primary`: `#F2F2F5`
  - `--text-secondary`: `#9296A6`
  - `--button-primary-bg`: `#FFFFFF`, `--button-primary-text`: `#0E0E12`
  - `--button-secondary-bg`: `#23232B`, `--button-secondary-text`: `#F2F2F5`
- **Shared Tokens**:
  - Primary button border-radius: `14px`
  - Secondary button border-radius: `20px`
  - Functional success/confidence accent: `#10B981` (Emerald preserved)

### 2. Typography & Fonts
- Include Google Font import for `Instrument Serif` or `Fraunces`.
- Apply serif display font ONLY to the Hero headline on the Landing Page.

### 3. Component Color Migration
- Sweep codebase for legacy emerald/gold brand colors (`emerald-600`, `amber-500`, `from-emerald-500`) and replace with `--accent-primary` / indigo theme tokens.
- Preserve `#10B981` / `emerald-500` strictly for verified citations and high confidence badges.

---

## Verification Plan

### Part A Verification
- Run `npm run build` in `frontend/` to confirm zero build errors.
- Test SPA routing, Auth modal close/back button, and logo link navigation.
- Verify Error Boundary catches simulated render errors.

### Part B Verification
- Toggle between Light and Dark mode on Landing Page, Auth Modal, Dashboard, Chat, Pricing.
- Verify theme persistence in `localStorage`.
- Audit WCAG contrast ratio for `#252525` on `#F8F8F8` (approx 14.5:1) and `#F2F2F5` on `#0E0E12` (approx 16.2:1).
