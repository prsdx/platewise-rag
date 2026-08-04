# PlateWise Fix & Unified Theme System Task List

## Part A: Stabilization & Bug Fixes
- [x] **A.1 Systematic Diagnostic Pass**
  - [x] Test frontend build (`npm run build`) and inspect for errors (0 errors, 0 warnings)
  - [x] Run backend & frontend test suites (20/20 pytest tests passed, frontend build passed in 710ms)
  - [x] Inspect client-side routing & Vercel deployment configuration (`vercel.json`)

- [x] **A.2 Core Bug Fixes**
  - [x] Add global React Error Boundary to catch uncaught component render errors (`frontend/src/components/ErrorBoundary.jsx`)
  - [x] Fix blank screen after login (Auth state resolution & synchronous user state setting)
  - [x] Add root Vercel SPA rewrite configuration (`vercel.json`) for deep link blank screens
  - [x] Add explicit "Return to Landing Page" link on Auth Modal
  - [x] Fix Logo click navigation to point cleanly to `/` (landing page) across all navbars/headers
- [x] **A.3 Verification**
  - [x] Verify build passes without errors (`npm run build` passed in 708ms)
  - [x] Verify core user flows (Landing -> Login -> Dashboard -> Landing) without blank screens

## Part C: Array Guarding & Render Crash Fix
- [x] **C.1 Defensive Array Guarding Across Frontend Components**
  - [x] Harden `getDocuments()` in `api.js` to ensure array returns
  - [x] Harden `ChatHistoryContext.jsx` `localStorage` parser for arrays
  - [x] Add `Array.isArray()` guards in `Navbar.jsx`, `Sidebar.jsx`, `ChatHistory.jsx`, `KnowledgeVault.jsx`, `CompareDocuments.jsx`, `CompareResult.jsx`, `AnalyticsView.jsx`, `ChatMessage.jsx`, `RetrievedChunksPanel.jsx`, and `SourceCitations.jsx`
  - [x] Run `npm run build` verification

## Part B: Unified Theme System (Light + Dark, Dia-Inspired)
- [x] **B.1 Theme CSS Tokens & Variables**
  - [x] Define Indigo primary theme tokens in `index.css` (`#5863EA` light, `#6E77F2` dark)
  - [x] Define Surface, Text, Border, and Button tokens (primary radius 14px, secondary 20px)
  - [x] Configure Instrument Serif font for Landing Page Hero Headline only
- [x] **B.2 Migration & Component Retheming**
  - [x] Replace legacy primary emerald/gold hexes across components with indigo theme tokens (preserve emerald `#10B981` for verified/confidence status)
  - [x] Ensure Theme Provider & Sun/Moon toggle persist mode (dark default)
  - [x] Update Landing Page, Navbar, AuthModal, Dashboard, Chat, Pricing, and Footer components
- [x] **B.3 QA & Contrast Verification**
  - [x] Verify WCAG AA contrast for text and interactive states in both light and dark modes (Light text contrast 14.5:1, Dark text contrast 16.2:1)
  - [x] Verify mobile responsiveness and theme persistence

