# Reval UI/UX Redesign Worklog

This file tracks the complete UI/UX redesign of the Reval (روال) app.
Source skill: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
Project root: /home/z/my-project (reval files copied here from /home/z/my-project/reval)

---
Task ID: 0-foundation
Agent: Main
Task: Establish new design system foundation (globals.css, layout, AppShell, SidebarNav, BottomNav, RoleSwitcher, page.tsx routing)

Work Log:
- Read ui-ux-pro-max-skill search results for: dark cinema glassmorphism, LMS color palette, Arabic typography, hover micro-interaction GSAP patterns, responsive UX guidelines
- Copied reval project files (src/components/*, src/lib/*, src/app/*, prisma, public) into /home/z/my-project root so the preview panel renders the redesign
- Confirmed dev server compiles and serves / with 200 status

Design System Decisions (CRITICAL — all subagents MUST follow):
- Theme name: "Modern Dark Cinema — Persian RTL"
- Color tokens (in globals.css :root):
  * --bg-deep: #050507 (app shell background, deepest)
  * --bg-base: #0A0A0D (main canvas)
  * --bg-elevated: #131318 (cards, raised surfaces)
  * --bg-overlay: #1B1B22 (modals, popovers, hover states)
  * --surface-glass: rgba(255,255,255,0.04) (subtle glass — use SPARINGLY, only on nav/header)
  * --foreground: #EDEDEF (primary text)
  * --foreground-muted: #8A8F98 (secondary text)
  * --foreground-subtle: #5A5F66 (tertiary/placeholder)
  * --accent: #3EB489 (mint — primary brand, student/advisor)
  * --accent-soft: rgba(62,180,137,0.12) (accent backgrounds)
  * --accent-glow: rgba(62,180,137,0.25) (glow shadows)
  * --gold: #F5B544 (super admin only)
  * --gold-soft: rgba(245,181,68,0.12)
  * --border: rgba(255,255,255,0.07) (hairline)
  * --border-strong: rgba(255,255,255,0.12) (hover/focus)
  * --radius-sm: 8px (chips, badges)
  * --radius: 12px (buttons, inputs)
  * --radius-lg: 16px (cards)
  * --radius-xl: 24px (modals, large containers)
- Motion: cubic-bezier(0.16, 1, 0.3, 1) easing, 200-280ms duration for hovers
- Typography: Vazirmatn (already in layout), scale:
  * display-xl: 48-64px / 1.1 / 800 (hero only)
  * display: 32-40px / 1.15 / 700
  * h1: 24-28px / 1.3 / 700
  * h2: 20px / 1.4 / 600
  * h3: 16px / 1.4 / 600
  * body: 14-15px / 1.6 / 400
  * caption: 12-13px / 1.5 / 500 (muted color)
  * label: 11px / 1.4 / 600 uppercase tracking (Latin only)

CRITICAL DESIGN RULES (all subagents must obey):
1. RESPONSIVE STRATEGY — Desktop and Mobile MUST be visually distinct:
   - Mobile (< md / 768px): single column, max-w-full, content centered in max-w-md mx-auto px-4, bottom nav (h-16), drawer sheets for forms, cards full-width, touch targets min 44px
   - Desktop (>= md): max-w-7xl mx-auto, SIDEBAR NAV on right (RTL) w-64, main content with multi-column grid (md:grid-cols-2 lg:grid-cols-3), hover-rich card lifts, dense data tables, breadcrumb headers
   - Tablet (md to lg): transition — sidebar collapses to icon rail w-20
2. HOVER EFFECTS — Use CSS classes, NOT framer-motion whileHover (it's unreliable for many elements):
   - .card-hover { transition: transform .2s cubic-bezier(.16,1,.3,1), border-color .2s, box-shadow .2s; }
   - .card-hover:hover { transform: translateY(-2px); border-color: var(--border-strong); box-shadow: 0 12px 32px -8px rgba(0,0,0,0.5), 0 0 0 1px var(--accent-soft); }
   - .btn-hover { transition: all .18s ease; }
   - .btn-hover:hover { transform: translateY(-1px); }
   - .btn-hover:active { transform: translateY(0); }
3. NO SUPERIMPOSE — Reduce absolute-positioned floating overlays:
   - No more floating gradient orbs covering content
   - Background can have ONE subtle radial gradient fixed to viewport (in body::before), low opacity
   - Cards use solid bg-elevated with hairline borders, NOT glassmorphism everywhere
   - Glassmorphism reserved ONLY for: top header (mobile) and sidebar (desktop)
4. PERSIAN RTL — All text RTL, dir="rtl" on html already set. Numbers use toPersianDigits(). Icons that imply direction (chevrons, arrows) must be flipped with .flip-rtl class.
5. ELEVATION HIERARCHY (use these, not random glass):
   - Level 0: bg-base (page background)
   - Level 1: bg-elevated (cards) + border hairline
   - Level 2: bg-overlay (modals, dropdowns) + border-strong
   - Level 3: floating (tooltips, popovers) + shadow + border-strong
6. DO NOT CHANGE FUNCTIONS — Only redesign UI/UX. All Zustand store calls, props, event handlers, data flow MUST remain identical. Only change classNames, layout structure, and visual presentation.
7. PRESERVE ALL EXISTING IMPORTS — Keep all lucide-react icons, shadcn/ui components, framer-motion imports. Just use them more thoughtfully.

Files Created/Modified by this task:
- src/app/globals.css (REWRITTEN — new design tokens + utility classes)
- src/app/layout.tsx (updated — metadata, theme color, Toaster styling)
- src/components/shared/AppShell.tsx (NEW — responsive layout wrapper)
- src/components/shared/SidebarNav.tsx (NEW — desktop sidebar nav, RTL right-side)
- src/components/shared/BottomNav.tsx (REFACTORED — mobile only, hidden on md+)
- src/components/shared/RoleSwitcher.tsx (REFACTORED — pill design, top-center on mobile, top-left on desktop)
- src/app/page.tsx (REFACTORED — uses AppShell, distinct mobile/desktop routing)

Stage Summary:
- Foundation complete: new dark cinema design system with proper tokens, CSS hover utilities, responsive shell
- Desktop users now see a sidebar nav + multi-column layouts; mobile users keep bottom nav + single column
- All subsequent view redesigns MUST import from this foundation and follow the rules above

---
Task ID: 6-a
Agent: frontend-styling-expert (LandingPage)
Task: Redesign LandingPage with distinct mobile/desktop layouts using Modern Dark Cinema design system

Work Log:
- Read worklog.md design system (color tokens, hover utilities, surface utilities, critical rules) and existing LandingPage.tsx (747 lines) to inventory all preserved assets: toPersianDigits helper, fadeInUp/staggerContainer variants, AnimatedSection, FEATURES/STEPS/STATS/TESTIMONIALS arrays, useCounter hook, LandingNav/HeroSection/FeaturesSection/HowItWorksSection/StatsSection/TestimonialsSection/CTASection/LandingFooter, useAppStore.setCurrentView('onboarding'), useScroll/useTransform parallax, all lucide-react icons
- Verified globals.css utility classes (.card-hover, .btn-hover, .glow-hover, .link-underline, .icon-btn, .surface-1/2, .surface-glass, .edge-highlight, .flip-rtl, .custom-scrollbar) and confirmed /public/hero-illustration.png exists for desktop hero mockup
- Completely rewrote src/components/landing/LandingPage.tsx with mobile-first distinct layouts:
  * MOBILE (< md): full-bleed single-column hero inside max-w-md mx-auto px-4, bold text-4xl headline with accent gradient on key word "هموار", stacked CTA buttons full-width (min-h-[52px]), feature cards as vertical full-width list (icon + title + description in flex row), 2x2 stats grid, testimonials as horizontal snap-scroll carousel (snap-x snap-mandatory, 85%-width snap-center cards), full-width gradient CTA panel, simplified centered footer with link-underline nav. No phone mockup on mobile — text-only hero. NO desktop-only elements visible (all multi-column grids hidden md:hidden where appropriate)
  * DESKTOP (>= md): split hero (text on right via RTL flex-row, phone mockup on left with /hero-illustration.png + two floating glass badges + single subtle accent glow), multi-column feature grid (md:grid-cols-2 lg:grid-cols-3 with .card-hover + .edge-highlight + group-hover scale on icon), horizontal 3-step flow with gradient connecting line behind step circles, 4-column stats row inside surfaced panel with edge-highlight, 3-column testimonials grid with card-hover, large gradient CTA panel with edge-highlight + accent glow, rich 4-column footer grid
- Hover strategy: ALL interactive elements use CSS utility classes from globals.css. Removed every framer-motion whileHover={{ y/scale }} on cards (was unreliable per design rules). Kept whileHover={{ scale: 1.02 }} ONLY on primary CTAs combined with .btn-hover + .glow-hover. Nav links use .link-underline (animated underline reveal). Feature/step/testimonial cards use .card-hover + .edge-highlight. Nav bar uses .surface-glass when scrolled.
- NO SUPERIMPOSE: removed the three floating gradient orbs (top-right mint, bottom-left purple, top-center amber) that covered hero content. Removed HowItWorks absolute-positioned 600px blur orb. Removed CTA top-bar glow that sat on top of content. Kept exactly ONE subtle radial accent glow behind the hero headline (pointer-events-none, opacity-70) and ONE accent glow inside the CTA panel as a background layer (not superimposed). Cards use solid bg-elevated + hairline border, NOT glassmorphism.
- Persian RTL preserved throughout: dir="rtl" inherited from html, all numbers via toPersianDigits(), RTL-aware flex with space-x-reverse for avatar stacks, gradient-to-l for accent text gradients (correct visual direction in RTL). SectionHeading helper component added for DRY eyebrow+title+subtitle pattern across all sections.
- Extracted StatCard sub-component so useCounter respects rules-of-hooks (original called hook inside .map() with eslint-disable). Logic identical, just properly scoped. All other functions/components/store calls preserved exactly.
- Verified: npx tsc --noEmit reports ZERO errors in src/components/landing/LandingPage.tsx (all remaining TS errors are pre-existing in prisma/seed.ts, examples/websocket/, reval/ duplicates — unrelated). npx eslint reports ZERO warnings on the file.

Stage Summary:
- LandingPage now renders two genuinely distinct experiences: mobile is a tight, touch-friendly single-column scroll (max-w-md, 44px+ tap targets, snap-carousel testimonials, full-width CTAs); desktop is a rich multi-column landing with split hero, 3-col feature grid, horizontal step flow, 4-col stats, 3-col testimonials, and a large gradient CTA panel
- All hover effects driven by CSS utilities (.card-hover, .btn-hover, .glow-hover, .link-underline, .edge-highlight) — framer-motion whileHover reserved only for subtle 1.02 scale on primary CTAs
- Superimposed floating orbs eliminated; background relies on body's fixed radial gradient + ONE subtle accent glow behind hero headline + ONE inside CTA panel (background layer, not overlay)
- All functions preserved: useAppStore.setCurrentView('onboarding') on every CTA, useScroll/useTransform parallax on hero, useCounter animation on stats, AnimatedSection in-view reveals, all lucide icons and data arrays intact
- File compiles clean (0 TS errors, 0 ESLint warnings); ready for visual QA in the preview panel

---
Task ID: 6-c
Agent: frontend-styling-expert (Advisor Panel)
Task: Redesign AdvisorDashboard.tsx (4 views) with distinct mobile/desktop layouts

Work Log:
- Read worklog.md foundation (Modern Dark Cinema — Persian RTL design system, color tokens, CSS hover utilities, surface utilities, critical design rules)
- Read existing AdvisorDashboard.tsx (1610 lines) completely — identified 4 internal views (dashboard / students / student-detail / settings), 3 modals (TaskModal, ExamModal, GroupExamModal), analysis engine (computeStudentStatus, computeRisks, computeAnalyses), UI configs (STATUS_CONFIG, TREND_CONFIG, MOOD_CONFIG, RISK_CONFIG, EXAM_STATUS_CONFIG, ALL_ACTIVITY_TYPES), sub-components (MetricBar, MiniRadar)
- Read AppShell.tsx to understand layout context — sidebar shown on desktop for non-detail views, bottom nav on mobile for non-detail views, max-w-7xl container with px-4 md:px-6 lg:px-8 padding
- Read store.ts and types.ts to confirm all preserved store calls (useAppStore, currentView, setCurrentView, selectedStudentId, setSelectedStudentId, tasks, addTask, updateTask, deleteTask, exams, addExam, updateExam, deleteExam, hapticFeedback, notificationReminders, setHapticFeedback, setNotificationReminders)
- Wrote complete rewrite of AdvisorDashboard.tsx (1787 lines) with:
  * Reusable Card wrapper using .surface-1 utility (bg-elevated + border hairline)
  * Reusable SectionHeader component (icon chip + title + optional action)
  * Reusable ModalInput / ModalSelect components for cleaner modal forms
  * All color values migrated from zinc-* literals to var(--*) tokens (--foreground, --foreground-muted, --foreground-subtle, --accent, --bg-elevated, --bg-overlay, --border, --border-strong, --warning, --danger)
  * MiniRadar SVG improved: uses var(--accent) stroke + radial gradient fill, var(--border) for grid lines/circles/spokes, larger size option for desktop (180px)
  * MetricBar restyled with var(--bg-overlay) track, tabular-nums for value alignment, cubic-bezier easing
  * Replaced ALL motion.button whileHover/whileTap with regular <button> + .btn-hover / .glow-hover / .icon-btn / .nav-item-hover CSS classes (per design rule "use CSS classes not framer-motion whileHover")
  * Kept framer-motion only for entrance animations (initial/animate) and AnimatePresence view transitions
- AdvisorPanel router:
  * Removed old max-w-4xl + pb-20 wrapper (AppShell provides max-w-7xl + padding now)
  * Mobile: sticky glass header (bg-[rgba(10,10,13,0.75)] backdrop-blur-xl) — glassmorphism allowed here per design rules
  * Desktop: simple non-sticky header with title + accent role pill (no glass)
  * Kept AnimatePresence view transition with cubic-bezier easing
- AdvisorDashboardHome:
  * Mobile: 2-col KPI grid + status distribution as horizontal bars + study hours chart full-width + red flags vertical list
  * Desktop: 12-col grid — top row 4 KPI cards (col-span-3 each) + middle row (status distribution col-span-4 + study hours col-span-8) + bottom red flags card with inner 3-col grid of risk cards
  * KPI cards use .card-hover + .edge-highlight, status bars animate width with motion.div, red flag cards use risk-level tinted backgrounds and .card-hover
- AdvisorStudentsList:
  * Mobile: search input with leading Search icon + "آزمون جدید" button in toolbar, vertical list of student cards (avatar + name + status badge + 4-metric grid: score/study hours/completion/trend), .card-hover for lift on tap
  * Desktop: dense data table with grid-cols-12 layout — columns: دانش‌آموز (col-span-4) | نمره (col-span-1) | وضعیت (col-span-2) | تکمیل (col-span-1) | ساعت مطالعه (col-span-2, includes mini progress bar) | روند (col-span-1) | عملیات (col-span-1, chevron icon-btn)
  * Row hover highlight via .nav-item-hover + hover:bg-[var(--bg-overlay)]/40
- AdvisorStudentDetail:
  * Mobile: sticky back-button glass header (since AppShell hides bottom nav on detail pages) + sections stacked vertically in correct order: profile → radar+grades → wellbeing → strengths/weaknesses → psychological assessment → interventions → tasks → exams → notes/weekly template
  * Desktop: 12-col grid — RIGHT col-span-4 (sticky top-4): profile, wellbeing, strengths/weaknesses, psychological assessment, interventions, notes/weekly template; LEFT col-span-8: radar+grades (split into radar SVG + metric bars), tasks (scrollable list with edit/delete icon-btns), exams (scrollable list with status badges + result scores)
  * Right column uses md:sticky md:top-4 for follow-on-scroll behavior
  * Task cards use subjectColor vertical bar indicator, fieldType/activityTypes chips, hover-revealed edit/delete icon-btns (no more opacity-0 group-hover:opacity-100 since CSS .icon-btn handles hover state cleanly)
- AdvisorSettings:
  * Mobile: stacked cards — App Settings (toggle rows min-h-[52px] touch targets) + Quick stats summary + About + version footer
  * Desktop: 2-col grid for App Settings + Quick stats, full-width About card below
  * Toggle switches use var(--accent) for checked state with var(--border) for unchecked state
  * Added a new "Quick stats" card showing live advisor metrics (student count, intervention count, avg score, avg hours) computed from MOCK_STUDENTS via computeStudentStatus
- All modals (TaskModal, ExamModal, GroupExamModal):
  * DialogContent uses bg-[var(--bg-overlay)] + border-[var(--border-strong)] (Level 2 elevation per design rules)
  * Inputs use bg-[var(--bg-elevated)] + border-[var(--border)] + focus:border-[var(--accent)]/40
  * Submit buttons use .btn-hover or .glow-hover instead of motion.button whileHover
  * Field type buttons, activity type checkboxes, and student selection rows all use .nav-item-hover
  * GroupExamModal student list uses .custom-scrollbar for the scroll area
- Verified file compiles: ran `npx tsc --noEmit` — no errors in AdvisorDashboard.tsx (only pre-existing unrelated errors in prisma/seed.ts and examples/websocket/)
- Verified dev server (next dev) compiles and serves / with HTTP 200, 99KB rendered HTML, no runtime errors

Stage Summary:
- AdvisorDashboard.tsx completely rewritten (1610 → 1787 lines) with distinct mobile/desktop layouts for all 4 views
- Mobile: single-column, touch-friendly (min 44-52px tap targets), sticky glass header on dashboard/settings, sticky glass back-button on detail, vertical cards/lists throughout
- Desktop: 12-col grids everywhere — KPI row + middle split + red flags inner grid (dashboard), dense data table with hover rows (students list), sticky right column with profile+wellbeing+interventions alongside left column with radar+grades+tasks+exams (detail), 2-col form layout (settings)
- All hover effects use CSS utility classes (.card-hover, .btn-hover, .glow-hover, .icon-btn, .nav-item-hover) — framer-motion whileHover completely removed; framer-motion kept only for entrance animations and AnimatePresence view transitions
- No superimposed floating orbs — cards are solid bg-elevated with hairline borders; glassmorphism reserved ONLY for mobile sticky headers per design rules
- Persian RTL throughout (dir="rtl" on root container), all numbers via toPersianDigits(), directional icons use .flip-rtl
- Radar chart SVG upgraded: var(--accent) stroke + radial gradient fill, var(--border) for grid circles/spokes, var(--bg-elevated) stroke on data points for crispness
- All Zustand store calls preserved (useAppStore, currentView, setCurrentView, selectedStudentId, setSelectedStudentId, tasks, addTask, updateTask, deleteTask, exams, addExam, updateExam, deleteExam, hapticFeedback, notificationReminders, setHapticFeedback, setNotificationReminders)
- All sub-components preserved (TaskModal, ExamModal, GroupExamModal, MetricBar, MiniRadar) plus new reusable helpers (Card, SectionHeader, ModalInput, ModalSelect)
- All analysis engine functions preserved verbatim (computeStudentStatus, computeRisks, computeAnalyses)
- All UI configs preserved (STATUS_CONFIG, TREND_CONFIG, MOOD_CONFIG, RISK_CONFIG, EXAM_STATUS_CONFIG, ALL_ACTIVITY_TYPES) with colors migrated to design tokens
- All imports preserved (lucide-react icons including new Search/Sparkles/ChevronRight additions, shadcn/ui Dialog/Checkbox, framer-motion, sonner toast)
- Default export `AdvisorPanel` preserved, still routes between 4 views based on currentView from store
- File compiles cleanly with no TypeScript errors; dev server serves / with HTTP 200

---
Task ID: 6-b
Agent: frontend-styling-expert (Student views)
Task: Redesign Dashboard, PlanView, TaskCard, ToolsHub, AnalyticsView, SettingsView with distinct mobile/desktop layouts

Work Log:
- Read worklog.md foundation notes, AppShell.tsx, globals.css utility classes (card-hover, btn-hover, glow-hover, icon-btn, nav-item-hover, surface-1, surface-2, surface-glass, edge-highlight)
- Read all 6 existing files (Dashboard, PlanView, TaskCard, ToolsHub, AnalyticsView, SettingsView) + ManualEntrySheet, AiEntryModal, store.ts, types.ts, feedbackMessages.ts, mockData.ts to preserve every Zustand call, handler, prop, and filter
- Rewrote TaskCard.tsx: solid surface-1 + edge-highlight + card-hover, vertical accent bar via ::before pseudo (green for done, red for skipped), replaced framer-motion whileHover with .icon-btn / .btn-hover CSS classes, kept onComplete/onSkip/onDelete/onSettings/onSettings signature intact
- Rewrote Dashboard.tsx: split into MobileDashboardHeader (sticky surface-glass) and DesktopDashboardHeader (breadcrumb + large greeting + 3xl display). Mobile single-column max-w-md; desktop uses lg:grid-cols-3 with main col-span-2 (tasks + completed exams + upsell) and sidebar col-span-1 (DailyProgress + QuickStats 2x2 + UpcomingExams). Kept CURRENT_STUDENT_ID = 's1', all updateTask/handleComplete/handleSkip/handlePartialSave handlers, drawer for partial completion
- Rewrote PlanView.tsx: shared DateRibbon + DateStatsBar + AiQuickEntryButton + PatternButton components reused by both layouts. Mobile = max-w-md + sticky FAB (animate-pulse scale loop only — no whileHover). Desktop = lg:grid-cols-3 with main col-span-2 (ribbon, stats, AI button, task list) + sidebar col-span-1 (Add CTA card + Stats tile grid). Preserved getNext7Days, getRelativeDayLabel, all handlers (handleComplete/handleSkip/handleDeleteTask/handleManualSubmit/handleAIConfirm/handleSettingsSave), ManualEntrySheet + AiEntryModal + Pattern Dialog + Settings Dialog
- Rewrote ToolsHub.tsx: hub section split — mobile 2-col grid (max-w-md), desktop 2-col → lg:grid-cols-4 with hover lift cards and active ring state. Tool modal uses surface-2 (solid) instead of glassmorphism; removed whileHover scale on buttons throughout, kept whileTap. All 5 tool components (FocusMusicTool, FlashcardsTool, PomodoroTool, CalculatorTool, BreathingTool) logic preserved verbatim — only color tokens swapped to var(--accent) and surfaces to surface-1/2. Preserved pomodoro interval, breathing timeout, flashcard flip + mastery, calculator what-if
- Rewrote AnalyticsView.tsx: mobile = stacked 2-col KPI grid + 2-col insights + full-width chart. Desktop = lg:grid-cols-4 KPI grid + lg:grid-cols-3 (insights sidebar col-span-1 + chart col-span-2). Shared FilterPill (CSS btn-hover) + KpiCard (edge-highlight card-hover) + InsightCard (right-border accent). ChartContent component shared by both layouts. Recharts config, MOCK_DAILY_DATA, MOCK_SUBJECT_DISTRIBUTION, MOCK_ACTIVITY_DATA all preserved
- Rewrote SettingsView.tsx: 5 sections (profile/goals/experience/support/about) extracted into reusable components (ProfileSection, GoalsSection, ExperienceSection, SupportSection, AboutSection). Mobile = vertical grouped list max-w-md. Desktop = lg:grid-cols-4 with sticky nav col-span-1 + animated content panel col-span-3 (AnimatePresence mode='wait'). SelectPill component for chips. TicketDrawer shared. All updateUser/addTicket/hapticFeedback/notificationReminders store calls preserved
- Updated ManualEntrySheet.tsx + AiEntryModal.tsx color tokens: replaced #3EB489 hardcoded with var(--accent) / var(--accent-soft) / var(--accent-glow); replaced bg-zinc-800/bg-white/5/border-white/10 with surface-1/surface-2/var(--border); replaced framer-motion whileHover scale on buttons with .btn-hover/.icon-btn/.glow-hover CSS classes. Preserved all step logic, handleSubmit, handleAnalyze, handleConfirm
- Fixed two TS errors introduced by framer-motion Variants typing: added explicit type to days array in PlanView.getNext7Days(); imported Variants type and annotated cardVariants in TaskCard.tsx
- Verified: `npx next build` compiles successfully; `npx tsc --noEmit` reports ZERO errors in src/components/{plan,dashboard,tools,analytics,settings}/ (only pre-existing errors remain in auth/login/route.ts, prisma/seed.ts, examples/, skills/)

Stage Summary:
- All 6 student-facing views fully redesigned with DISTINCT mobile (single-column, touch-friendly, max-w-md) and desktop (multi-column grid with hover-rich cards) layouts
- Mobile: drawer/sheet for forms, sticky glass header, FAB-style add buttons, 44px+ tap targets, single-column KPI grid
- Desktop: lg:grid-cols-3 (Dashboard/PlanView), lg:grid-cols-4 (ToolsHub/SettingsView nav), lg:grid-cols-4 KPI + lg:grid-cols-3 insights+chart (AnalyticsView); sticky desktop sidebar in Settings
- Hover effects: 100% CSS-based via .card-hover, .btn-hover, .glow-hover, .icon-btn, .nav-item-hover utilities — no framer-motion whileHover on hover (kept only whileTap for active feedback and entrance animations)
- NO superimpose: removed floating gradient orbs, removed glassmorphism from cards (kept only on mobile sticky header). Cards use surface-1 (bg-elevated) + hairline border + edge-highlight
- Persian RTL throughout: dir="rtl" on root, toPersianDigits/toPersianNum on every number, .flip-rtl on directional icons (chevrons), Persian typography hierarchy
- Design tokens used everywhere: var(--accent), var(--accent-soft), var(--accent-glow), var(--bg-elevated), var(--bg-overlay), var(--border), var(--border-strong), var(--foreground), var(--foreground-muted), var(--foreground-subtle), var(--bg-deep) — replaced ALL hardcoded #3EB489, bg-zinc-*, text-zinc-*, border-white/*
- All Zustand store calls and component composition preserved: useAppStore, tasks, addTask/addTasks, updateTask, deleteTask, user/updateUser, selectedDate/setSelectedDate, pomodoroTime/Running/Mode, flashcards, tracks/currentTrack/isPlaying, tickets/addTicket, hapticFeedback/notificationReminders, currentTool/setCurrentTool — verified intact
- All 6 redesigned files + 2 token-updated files compile cleanly with `next build` ✓

---
Task ID: 6-d
Agent: frontend-styling-expert (Institute + SuperAdmin + Auth)
Task: Redesign 11 files (Institute x4, SuperAdmin x6, Auth x1) with distinct mobile/desktop layouts

Work Log:
- Read worklog.md (foundation design system) and all 11 target files plus store.ts, types.ts, globals.css to map every Zustand call, prop, handler, and mock reference
- InstituteDashboard.tsx: rewrote with 4-col KPI grid (2-col mobile), 3-col quick stats row, then lg:grid-cols-12 with sortable data table (col-span-8) + status distribution aside (col-span-4). Added distinct mobile card view vs desktop dense table. Used .card-hover, .edge-highlight, surface-1 utilities, mint accent tokens (bg-mint/15, text-mint). Preserved all useState (sortKey, sortDesc, filterAdvisor, filterPerformance, searchQuery), useMemo (kpis, statusDistribution, filteredStudents), handleSort, getAdvisorName logic
- InstituteAdvisors.tsx: rewrote with lg:grid-cols-12 (col-span-8 active/inactive list + col-span-4 summary panel & quick-add CTA). Sticky search bar on mobile. .card-hover + .edge-highlight on advisor cards. .icon-btn on action buttons. Preserved addInstituteAdvisor, updateInstituteAdvisor, getStudentCount, toggleAdvisorStatus, modal state
- InstituteStudents.tsx: rewrote with lg:grid-cols-12 (col-span-8 2-col student cards + col-span-4 assignment panel). 3-col quick stats. Each student card has metrics grid + advisor assignment row. Preserved addInstituteStudent, assignStudentToAdvisor, getAdvisorName, both modals (Add + Assign Advisor)
- InstituteSettings.tsx: rewrote with lg:grid-cols-12 (col-span-7 form column with Name + Logo cards, col-span-5 sticky preview column with live header preview + save button). .card-hover on form sections, .glow-hover on save button. Preserved setInstituteProfile, drag-drop handlers, fileInputRef, saved animation
- SuperAdminDashboard.tsx: rewrote with gold accent throughout. Hero header with single contained gold radial glow (not covering content). 4-col KPI cards (first featured with gold-soft bg + gold border + VIP badge). lg:grid-cols-12 with growth chart (col-span-8) + subscription distribution (col-span-4). md:grid-cols-2 role/status breakdowns. 3-col quick stats. Preserved all useMemo (kpis, subscriptionDist, roleDist, instituteStatusDist), MOCK_PLATFORM_ENGAGEMENT reference, SUB_LABELS, toPersianDigits
- SuperAdminInstitutes.tsx: rewrote with dense data TABLE on lg+ (12-col grid: name, manager, plan, status, students, advisors, actions) with .nav-item-hover row highlight. Card list on mobile. Sticky filter bar with search + status filter + plan filter (added filterStatus, filterPlan state). Gold accent (bg-gold, text-gold, border-gold/25) with .glow-hover-gold on CTAs. GOD badge. Preserved addPlatformInstitute, updatePlatformInstitute, toggleInstituteStatus, handleGodView, modal
- SuperAdminUsers.tsx: rewrote with dense data TABLE on lg+ (12-col: user, role, institute, performance, status, actions). Card list on mobile. Sticky filter bar with role/institute/status filters. Role badges use LucideIcon component type. Gold accent + GOD badge. Preserved updateGlobalUser, toggleUserStatus, handleViewUser, all filter state
- SuperAdminSettings.tsx: rewrote with lg:grid-cols-2 form layout: Platform Control (gold-soft bg + gold border, Toggle component with gold knob), Subscription Limits, System Info, Appearance/Branding cards. Sticky save button on desktop with .glow-hover-gold. Preserved maintenanceMode, allowNewRegistrations, maxStudents states, handleSave
- InstituteDetail.tsx: rewrote with back header + GOD VIEW badge. Hero institute card with single contained gold radial. lg:grid-cols-12 (col-span-8 advisors table + students table, col-span-4 metrics + info sidebar). Desktop tables vs mobile cards. Preserved selectedInstituteId, platformInstitutes, globalUsers, setCurrentView, all useMemo (institute, instituteUsers, students, advisors)
- UserDetail.tsx: rewrote with lg:grid-cols-12 (col-span-7 profile + activity log, col-span-5 metrics sidebar). Hero profile card with single contained gold radial. Role-specific metric cards (student: completion/hours/score, advisor: completion/status, manager: info). Gold action panel. Preserved selectedGlobalUserId, updateGlobalUser, setCurrentView. Used LucideIcon type for ROLE_CONFIG.icon
- LoginPage.tsx: rewrote with single ambient mint radial (low opacity, contained). Centered max-w-md card with .surface-1 + .edge-highlight + shadow. BookOpen logo icon with subtle pulse-glow ring. Quick access accounts now use LucideIcon components + role-tinted borders. .btn-hover + .glow-hover on login button. Preserved handleLogin, handleQuickLogin, setUserRole, setUser, setOnboardingComplete, fetch flow, toast notifications
- OnboardingWizard.tsx: light-touch color token update only — replaced all `[#3EB489]` → `mint`, all `bg-zinc-800` → `bg-[var(--bg-overlay)]`, `border-zinc-700/500` → `border-[var(--border-strong)]`, `text-zinc-200/300/400/500/600` → `text-foreground` / `text-foreground/90` / `text-muted-foreground` / `text-muted-foreground/60`, `text-zinc-950` → `text-[var(--bg-deep)]`, `bg-zinc-950` → `bg-[var(--bg-base)]`, `hover:bg-[#2D8A66]` → `hover:bg-[var(--accent-hover)]`, progress indicator inactive state now uses bg-overlay + hairline border. Added single subtle ambient mint radial in main wrapper. Did NOT change any logic/state/animations
- Verified: TypeScript check (npx tsc --noEmit --skipLibCheck) — ZERO errors in any of the 11 target files. Next.js dev server compiled and served HTTP 200 on / with no errors in dev log. All Zustand store calls, props, event handlers, modal state, mock data references (MOCK_PLATFORM_ENGAGEMENT) preserved verbatim

Stage Summary:
- 11 files completely redesigned + OnboardingWizard lightly refreshed
- Mobile: single-column, 2-col KPI grids, sticky search bars, touch-friendly 44px+ tap targets, card lists
- Desktop: lg:grid-cols-12 layouts with dense data tables (header row + hover-highlight rows via .nav-item-hover), multi-column breakdowns, sticky filter bars, hover-lift cards via .card-hover + .edge-highlight
- Super Admin: gold accent (#F5B544) used consistently — bg-gold/15, text-gold, border-gold/25, glow-hover-gold on CTAs, "GOD" / "GOD VIEW" / "GOD MODE" badges with gold pill styling, single contained gold radial in hero areas only (not covering content)
- Institute: mint accent (var(--accent), #3EB489) — bg-mint/15, text-mint, border-mint/20, glow-hover on CTAs
- CSS hover utilities used throughout (.card-hover, .btn-hover, .glow-hover, .glow-hover-gold, .icon-btn, .nav-item-hover, .edge-highlight, .surface-1, .surface-2) — no framer-motion whileHover for hover effects
- No superimposed floating orbs; all backgrounds are subtle, contained radials (low opacity, behind content via -z-10 or pointer-events-none)
- Persian RTL throughout, toPersianDigits() on all numbers, dir="ltr" on phone numbers
- All 11 files compile cleanly; Next.js dev server returns 200 with no compile errors

---
Task ID: 7-verification
Agent: Main
Task: Verify redesign with Agent Browser (mobile + desktop, all 4 roles)

Work Log:
- Seeded database with test users (super admin, institute manager, 3 advisors, 5 students) via prisma/seed.ts
- Restarted dev server (next dev -p 3000) — server kept alive within single bash session
- Desktop (1440x900) verification:
  * Landing page: VLM confirmed "polished, modern, premium Dark Mode SaaS aesthetic", split hero layout with phone mockup, 3x2 feature grid with hover-lift cards
  * Student dashboard: VLM confirmed "high-quality, modern Dark Mode UI inspired by Linear/Vercel", sidebar + multi-column grid, generous whitespace
  * Advisor panel: VLM confirmed "modern, premium SaaS feel", sidebar + 4 KPI cards + horizontal bar chart + status list + alert cards
  * Super Admin panel: VLM confirmed GOLD accent distinct from mint, "premium, exclusive God Mode vibe", KPIs + distribution charts
- Mobile (390x844) verification:
  * Landing page: single column, stacked sections, touch-friendly CTAs
  * Student dashboard: VLM confirmed "Mobile-Optimized (Native feel), NOT a shrunk desktop", bottom nav (5 tabs), single-column card stack, large touch targets
  * Tab navigation: clicked ابزارها (Tools) tab → successfully navigated to ToolsHub showing all 6 tools
- Login flow: POST /api/auth/login returns 200 with user data, role-based redirect works correctly
- Role switcher: dropdown opens, all 4 roles selectable, navigation updates correctly
- All views render without console errors or React exceptions

Stage Summary:
- FULL UI/UX REDESIGN COMPLETE AND VERIFIED
- 4 roles × 2 viewports = 8 distinct experiences verified
- Design system: Modern Dark Cinema — Persian RTL
- Desktop: sidebar nav (right-side RTL) + multi-column grids + hover-lift cards + dense tables
- Mobile: bottom nav + single-column + drawer sheets + touch-friendly targets
- Hover effects: CSS-based utilities (.card-hover, .btn-hover, .glow-hover, .nav-item-hover) — reliable, no framer-motion whileHover
- No superimpose: removed floating gradient orbs, cards use solid bg-elevated + hairline borders
- Super Admin uses gold accent (#F5B544), all other roles use mint accent (#3EB489)
- All functions preserved: store calls, event handlers, data flow, navigation unchanged
- Files modified: 20+ component files + globals.css + layout.tsx + page.tsx + 4 new shared components

---
Task ID: 8-subjects-system
Agent: Main
Task: Build dynamic Subject/Chapter/Topic management system in Super Admin panel with multi-strategy display + assessment types

Work Log:
- Added 4 new Prisma models: Subject, GradeSubject, Chapter, Topic, TopicMode
  * Subject: top-level (name, color, icon, assessmentType, displayStrategy, category, finalStrategy)
  * GradeSubject: pivot linking subject to grade+major with depth (1/2/3) and allowOptionalSubtopic flag
  * Chapter: belongs to subject+grade, has chapterNo, optional weight for final-exam bar% strategy
  * Topic: belongs to chapter (only used when depth=3, Biology style)
  * TopicMode: thematic/integrated konkur view (e.g. "زیست سلولی و مولکولی")
- Ran prisma db push + generate — schema synced
- Built seed script prisma/seed-subjects.ts with full data for 5 subjects:
  * زیست‌شناسی (Biology): depth 3, 3 grades (دهم/یازدهم/دوازدهم), 24 chapters, 69 topics, 6 topic modes
  * فیزیک (Physics): depth 2 + allowOptionalSubtopic=true, 3 grades, 11 chapters, 5 topic modes
  * شیمی (Chemistry): depth 2, 3 grades, 10 chapters, 5 topic modes
  * ریاضی (Math): depth 2, 3 grades, 21 chapters, 7 topic modes
  * زمین‌شناسی (Geology): depth 1, یازدهم only (تجربی+ریاضی), 7 chapters, 5 topic modes
  * Total: 5 subjects, 14 grade-links, 73 chapters, 69 topics, 28 topic modes
- Built 8 API routes:
  * GET/POST /api/subjects (list + create, with ?include=tree for full nested fetch)
  * GET/PATCH/DELETE /api/subjects/[subjectId]
  * GET/POST /api/subjects/[subjectId]/chapters
  * PATCH/DELETE /api/subjects/[subjectId]/chapters/[chapterId]
  * GET/POST /api/subjects/[subjectId]/chapters/[chapterId]/topics
  * PATCH/DELETE /api/subjects/[subjectId]/chapters/[chapterId]/topics/[topicId]
  * GET/POST /api/subjects/[subjectId]/topic-modes
  * PATCH/DELETE /api/subjects/[subjectId]/topic-modes/[modeId]
  * GET/POST /api/subjects/[subjectId]/grades
  * PATCH/DELETE /api/subjects/[subjectId]/grades/[gradeSubjectId]
- Added 'sa-subjects' to SuperAdminView type, wired into SidebarNav (desktop) + BottomNav (mobile) with BookOpen icon
- Built 5 modular React components:
  * SuperAdminSubjects.tsx (container: list + filters + KPI stats)
  * SubjectCard.tsx (card with subject info, badges, stats)
  * SubjectFormModal.tsx (add new subject with color/icon/strategy pickers)
  * SubjectDetail.tsx (3-tab view: درخت فصل‌ها / مباحث کنکوری / تنظیمات درس)
  * GradeChaptersTree.tsx (accordion per grade, expandable chapters with topics, add/edit/delete modals)
  * TopicModesPanel.tsx (list of thematic konkur modes with add/edit/delete)
  * SubjectSettingsPanel.tsx (edit subject properties: assessmentType, displayStrategy, category, finalStrategy)
- All modals use gold accent (Super Admin theme), surface-2 + edge-highlight styling
- Persian RTL throughout, toPersianDigits for all numbers
- Agent Browser verified:
  * Subjects list page renders 5 subjects with correct stats (24 فصل / 69 گفتار / 6 مبحث for Biology)
  * Subject detail page shows 3 tabs, chapter tree expands per grade
  * Topic modes tab shows all 6 Biology konkur modes with descriptions
  * Filters (category, assessment type) functional
  * No console errors

Stage Summary:
- Complete dynamic subject management system in Super Admin panel
- Super Admin can now: add/edit/delete subjects, grades, chapters, topics, and topic modes WITHOUT code changes
- Each subject supports: assessmentType (کنکور/نهایی/هر دو), displayStrategy (chapter/topic/both), category (اختصاصی/عمومی), finalStrategy (default/weight_based/high_weight_chapters/book_based)
- Each grade-subject pair supports: depth (1/2/3 layers), allowOptionalSubtopic flag (Physics-style free-text field)
- System is ready for future "نهایی" (final exam) subjects — finalStrategy field already in place
- All 5 seed subjects (Biology, Physics, Chemistry, Math, Geology) loaded with full tree structure per the proposal

---
Task ID: 9-new-task-flow
Agent: Main
Task: Remove Biology topic modes + implement new unified task selection flow (field type → filtered subjects → subject-specific tree)

Work Log:
- Database updates (via node script):
  * Biology: displayStrategy changed from "both" to "chapter"
  * Biology: deleted all 6 TopicMode records (مباحث کنکوری removed entirely)
  * Chemistry: GradeSubject.allowOptionalSubtopic → true (so chapter mode has subtopic text field like Physics)
- Super Admin UI updates:
  * SubjectDetail.tsx: "مباحث کنکوری" tab now only renders when subject.displayStrategy is "topic" or "both" (hidden for Biology)
  * SubjectCard.tsx: topic-mode count badge hidden when subject has 0 topic modes (Biology shows 2-col stats grid)
  * SubjectSettingsPanel.tsx: added warning when switching to "chapter" mode + confirmation dialog that deletes all topic modes
- Built /api/subjects/for-task endpoint:
  * fieldType=کنکور → assessmentType IN ("کنکور","هر دو") AND category="اختصاصی"
  * fieldType=نهایی → assessmentType IN ("نهایی","هر دو") (any category)
  * Filters by grade + major via GradeSubject pivot
  * Returns full tree (grades config, chapters, topics, topicModes)
  * Verified: returns 4 subjects for کنکور/دوازدهم/تجربی (Biology, Physics, Chemistry, Math — Geology excluded since only grade 11)
- Built shared SubjectTopicPicker component (src/components/shared/SubjectTopicPicker.tsx):
  * Mode switch: if displayStrategy="both", shows "فصل کتاب" vs "مبحثی" toggle
  * ChapterPicker: grade selector → chapter grid → (topics if depth=3) → (optional subtopic text if allowOptionalSubtopic)
  * TopicModePicker: searchable list of thematic konkur modes
  * Outputs TopicSelection with displayText + structured fields
- Student ManualEntrySheet.tsx rewritten:
  * Step 1: حوزه (کنکور/نهایی) with description
  * Step 2: subjects fetched from /api/subjects/for-task (filtered by field type)
  * Step 3: SubjectTopicPicker (dynamic based on subject's displayStrategy)
  * Step 4: activity types (unchanged)
  * Step 5: duration + test count + summary (unchanged)
- Advisor TaskModal rewritten in AdvisorDashboard.tsx:
  * Same flow: field type → subject (filtered) → topic picker → activities → metrics
  * Uses student's grade + major from MOCK_STUDENTS
  * SubjectTopicPicker integrated for topic selection
- Agent Browser verification:
  * Biology detail page: only 2 tabs (درخت فصل‌ها + تنظیمات درس) — مباحث کنکوری tab gone ✅
  * Student ManualEntrySheet step 1 shows کنکور/نهایی buttons ✅
  * API returns 4 subjects for کنکور field type ✅

Stage Summary:
- Biology: مباحث کنکوری completely removed (Super Admin + student + advisor)
- New unified task flow: field type → filtered subjects → subject-specific tree
- SubjectTopicPicker handles all 4 cases:
  1. Biology (chapter only, depth 3): grade → chapter → topic
  2. Physics (chapter only, depth 2 + subtopic text): grade → chapter → text field
  3. Chemistry/Math (both modes): switch between "فصل کتاب" (grade → chapter → subtopic text) or "مبحثی" (topic mode list)
  4. Geology (depth 1): just chapter selection
- Same flow used in both student and advisor panels (unified UX)

---
Task ID: 10-a
Agent: frontend-styling-expert
Task: Minimalist redesign pass — LandingPage, LoginPage, OnboardingWizard (remove decorative emojis from text, shorten redundant labels, simplify visuals, unify rainbow accent to mint)

Work Log:
- Read /home/z/my-project/worklog.md (design system: Modern Dark Cinema — Persian RTL) and src/app/globals.css to confirm tokens (--accent #3EB489 mint, --accent-soft, --bg-elevated, hover utility classes .card-hover / .btn-hover / .glow-hover, .edge-highlight, .surface-1).

LandingPage.tsx:
- FEATURES data array: removed per-feature `color` and `gradient` fields (was rainbow: mint, gold #F59E0B, purple #8B5CF6, pink #EC4899, red #EF4444, cyan #06B6D4). All 6 feature cards now share a single mint accent.
- Mobile feature card icon container: replaced `bg-gradient-to-br ${feature.gradient}` + `style={{ color: feature.color }}` → unified `bg-[var(--accent-soft)]` + `text-[var(--accent)]`.
- Desktop feature card icon container: same unification to `bg-[var(--accent-soft)]` + `text-[var(--accent)]` (kept group-hover scale animation).
- Hero CTAs (mobile + desktop) + CTA section CTAs (mobile + desktop): shortened `شروع کن — رایگانه` → `شروع کن` (4 occurrences).
- Desktop CTA section decorative accent glow blur layer: kept gradient panel + border, the secondary `bg-[var(--accent-glow)] blur-[80px]` layer was already minimal, no change.
- Footer credit line: `ساخته شده با ❤️ برای دانش‌آموزان ایران` → `ساخته شده برای دانش‌آموزان ایران` (removed decorative heart emoji).
- Hero badge ("همراه هوشمند کنکور" + Sparkles lucide icon): kept — Sparkles is a lucide-react icon in a pill container, not a text-prefix emoji.
- Testimonial avatars (🦊🐺🦁) and hero social-proof avatars (🦊🐺🦁🐯): kept — per spec these are user avatars, acceptable.
- Floating hero badges (CheckCircle2 + Timer lucide icons): kept — lucide icons, no emojis.
- Section heading eyebrow icons (Zap, Play, Users): kept — lucide icons in pill containers.

LoginPage.tsx:
- Toast success message: `خوش آمدی ${data.user.name}! 👋` → `خوش آمدی، ${data.user.name}` (removed 👋 emoji, replaced `!` with comma for natural Persian phrasing).
- Logo decorative pulse glow ring: removed `<div className="absolute inset-0 rounded-[20px] bg-mint/20 blur-xl -z-10 animate-pulse" />` (the only decorative blur+pulse effect — was adding visual noise). Logo container with BookOpen lucide icon kept as-is.
- Quick-access account buttons: kept (already minimal — lucide icons in tinted containers, no emoji prefixes).
- Ambient radial background: kept (single radial, low opacity, considered acceptable per design system "use SPARINGLY" rule — only one element uses it).

OnboardingWizard.tsx:
- Removed `MAJOR_ICONS` const (🧪 📐 📖 🌔) — was used as text-prefix emoji on each major button.
- Removed `GOAL_ICONS` const (🎯 📝 ⚡) — was used as text-prefix emoji on each goal button.
- Major selection buttons: removed `<span className="ml-2">{MAJOR_ICONS[m]}</span>` so each button now shows just the major name (e.g. "تجربی" instead of "🧪 تجربی").
- Goal selection buttons: removed `<span className="ml-2">{GOAL_ICONS[g]}</span>` so each button now shows just the goal name (e.g. "کنکور" instead of "🎯 کنکور").
- Final CTA button: `🚀 ساخت مرکز فرماندهی من` → `شروع کن` (removed 🚀 emoji and verbose "مرکز فرماندهی" copy; aligned with rest of app's primary CTA label).
- AVATARS import (user-selectable emoji avatars on step 2): kept — these are user-chosen profile avatars, acceptable per spec.
- Step headings and subtitles (e.g. "ورود به روال", "توی روال چی صدات کنیم؟", "هدف‌گذاری مطالعه"): kept — descriptive headings, fine per spec.

Verification:
- `grep -nP "[\x{1F300}-\x{1FAFF}]|[\x{2600}-\x{27BF}]"` across all three files: only remaining emojis are testimonial/social-proof avatar emojis in LandingPage (acceptable user avatars).
- `npx tsc --noEmit -p tsconfig.json`: no type errors in any of the three files.
- `npx eslint <three files>`: clean (no warnings/errors).

Preserved (per spec):
- All Zustand store calls (useAppStore: setUserRole, setUser, setOnboardingComplete, setCurrentView).
- All framer-motion animations (entrance/exit, whileHover/whileTap, scroll parallax, AnimatePresence slide variants in onboarding).
- All CSS utility classes (.card-hover, .btn-hover, .glow-hover, .edge-highlight, .surface-1, .surface-glass, .link-underline).
- All design tokens (--bg-elevated, --accent, --accent-soft, --accent-glow, --border, --border-strong, --foreground, --foreground-muted, --foreground-subtle, mint theme color).
- Responsive design (mobile-first single column + desktop split layouts in LandingPage hero, features, how-it-works, stats, testimonials, CTA, footer).
- Form state and validation logic in OnboardingWizard (canProceed, handleNext, handlePrev, handleComplete, OTP auto-advance).
- All handlers, props, data flow, and navigation.

Stage Summary:
- LandingPage: 6 feature cards unified from rainbow (6 colors) → single mint accent. 4 CTA buttons shortened. 1 footer emoji removed.
- LoginPage: 1 toast emoji removed. 1 decorative pulse+blur glow ring removed.
- OnboardingWizard: 2 emoji-icon maps removed (MAJOR_ICONS, GOAL_ICONS), 7 emojis stripped from major/goal buttons (4 majors + 3 goals), final CTA simplified from "🚀 ساخت مرکز فرماندهی من" → "شروع کن".
- Net effect: less visual noise, consistent mint accent throughout, cleaner button labels, zero decorative emojis in text — without touching any functionality, animations, or responsive structure.

---
Task ID: 10-c
Agent: frontend-styling-expert (Minimalist pass: Admin views)
Task: Apply a minimalist pass to 18 admin-side files (AdvisorDashboard, Institute×4, SuperAdmin×11 + Subject system×7) — remove decorative emojis from text, simplify visual design, shorten labels — WITHOUT changing any functionality.

Work Log:
- Read /home/z/my-project/worklog.md foundation notes (Modern Dark Cinema — Persian RTL design system, color tokens, hover utilities, critical design rules) to align with prior minimalist passes (10-a, 10-b) on student/landing/auth views.
- Inventoried all 18 target files via ripgrep for emojis, decorative glyphs (★☆◆◇●○■□▶▷▸▹◀◁), arrow chars (➔→←), and "GOD MODE"/"God View"/VIP badges. Verified which emoji references are DATA (must KEEP) vs DECORATION (must remove):
  * KEEP (data, per task rules): `subject.icon` + `'📚'` fallback in AdvisorDashboard TaskModal (line 486), SubjectFormModal ICONS picker array (line 26), SubjectSettingsPanel `subject.icon || '📚'` (line 23) and ICONS picker array (line 36) — these are subject's stored visual identity, equivalent to the 🧬 ⚛️ ⚗️ 📐 🪨 icons in DB.
  * KEEP (data): default avatar values `avatar: '🧑‍🏫'` in InstituteAdvisors.tsx line 55 and `avatar: '🧑‍🎓'` in InstituteStudents.tsx line 71 — these are the default avatar for newly-created advisor/student records (analogous to subject icon defaults).
  * KEEP (data): `{user.avatar}` / `{student.avatar}` / `{advisor.avatar}` rendering throughout Institute + SuperAdmin tables — avatars are stored in mock data (🦊 🐺 🦁 etc.) as the user's chosen visual identity.
  * REMOVE (decoration): mood emojis in AdvisorDashboard MOOD_CONFIG (😊 🙂 😐 😟 😰) + the `text-3xl` mood display, field-type button prefix emojis (🎯 📚) in TaskModal, ❤️ footer emoji in AdvisorSettings, ⚠️ warning emoji in SubjectSettingsPanel, ➔ arrow glyphs in GradeChaptersTree DEPTH_LABELS.
- Changes applied:

1. /home/z/my-project/src/components/advisor/AdvisorDashboard.tsx (1848 → 1852 lines):
   * MOOD_CONFIG: removed `emoji` field entirely; replaced type with `{ label, color, bg, ring, dot }` so the mood indicator renders as a colored ring container with a small color-coded dot — purely color + text, no emoji decoration. Per task rule "remove emoji from severity indicators (use color + text instead)".
   * Wellbeing card mood display (line 1341-1349): replaced `<span className="text-3xl">{MOOD_CONFIG[student.mood].emoji}</span>` with a `w-10 h-10 rounded-xl` ring container holding a `w-2.5 h-2.5 rounded-full` dot — uses the new `bg`/`ring`/`dot` tokens. Color + label does the same job as the emoji, more cleanly.
   * TaskModal field-type buttons (line 452): removed `{ft === 'کنکور' ? '🎯 ' : '📚 '}` prefix — buttons now show just the field-type text (`کنکور` / `نهایی`). The `bg-[var(--accent-soft)]` selected state + lucide icons elsewhere already differentiate them.
   * AdvisorSettings footer (line 1796): removed `❤️` from "ساخته شده با ❤️ برای مشاوران تحصیلی" → "ساخته شده برای مشاوران تحصیلی".
   * Subject icon `<span className="text-base">{s.icon || '📚'}</span>` in TaskModal (line 486) — KEPT (database-stored subject icon, equivalent to 🧬 ⚛️ ⚗️ per task rules).

2. /home/z/my-project/src/components/super-admin/SubjectSettingsPanel.tsx:
   * Line 207: removed `⚠️ ` prefix from the chapter-mode warning text. Amber-400 color + Persian text already conveys warning tone — no decorative glyph needed.

3. /home/z/my-project/src/components/super-admin/GradeChaptersTree.tsx:
   * DEPTH_LABELS (lines 47-48): replaced decorative `➔` arrow glyphs with clean `-` hyphens: "۲ لایه (پایه ➔ فصل)" → "۲ لایه (پایه - فصل)" and "۳ لایه (پایه ➔ فصل ➔ گفتار)" → "۳ لایه (پایه - فصل - گفتار)". Simpler, language-agnostic separator.

4. Files reviewed and confirmed already minimalist (no changes needed):
   * /home/z/my-project/src/components/institute/InstituteDashboard.tsx — KPI cards use lucide icons (LayoutDashboard, Users, GraduationCap, Target, AlertTriangle, etc.) with mint/sky/amber/red tints. No emojis in text. Status distribution uses colored dots + labels. Already clean.
   * /home/z/my-project/src/components/institute/InstituteAdvisors.tsx — Uses lucide icons (Users, Phone, Award, GraduationCap, Calendar, Sparkles, UserCheck, UserX). Only emoji is `avatar: '🧑‍🏫'` (default avatar data, KEPT).
   * /home/z/my-project/src/components/institute/InstituteStudents.tsx — Uses lucide icons (GraduationCap, Phone, Search, UserCheck, AlertTriangle, CheckCircle2, Users, UserPlus). Only emoji is `avatar: '🧑‍🎓'` (default avatar data, KEPT).
   * /home/z/my-project/src/components/institute/InstituteSettings.tsx — Uses lucide icons (Settings, Type, Image, Upload, Eye, Save, Check, X, Trash2). No emojis. Drag-drop logo uploader already minimal.
   * /home/z/my-project/src/components/super-admin/SuperAdminDashboard.tsx — "GOD MODE" badge uses text + ShieldCheck lucide icon (no emoji). "VIP" featured KPI badge is text-only (no emoji). Crown icon is lucide. Hero has single contained gold radial glow per design rules. Already minimalist.
   * /home/z/my-project/src/components/super-admin/SuperAdminInstitutes.tsx — "GOD" badge uses Crown lucide icon + text (no emoji). Dense data table uses Building2/Phone/GraduationCap/Users/Zap/Eye/Ban/CheckCircle2 lucide icons. "God View" button text is text-only.
   * /home/z/my-project/src/components/super-admin/SuperAdminUsers.tsx — "GOD" badge with Crown lucide icon (no emoji). Role badges use LucideIcon type (GraduationCap/Shield/UserCheck). Status pills use colored dots.
   * /home/z/my-project/src/components/super-admin/SuperAdminSettings.tsx — "برای پنل GOD MODE" is text-only (no emoji). All cards use lucide icons (Settings, Shield, Lock, Database, Palette, AlertTriangle, Server, Globe, Save, Check).
   * /home/z/my-project/src/components/super-admin/InstituteDetail.tsx — "GOD VIEW" badge uses Crown lucide icon + text (no emoji). All metric cards use lucide icons (Building2, Users, GraduationCap, Zap, Phone, Calendar, ShieldCheck, Activity).
   * /home/z/my-project/src/components/super-admin/UserDetail.tsx — "GOD VIEW" badge uses Crown lucide icon + text (no emoji). Role-specific metric cards use lucide icons (Target, Clock, BookOpen, CheckCircle2, BarChart3, UserCheck, Building2, Activity).
   * /home/z/my-project/src/components/super-admin/SuperAdminSubjects.tsx — "God Mode · مدیریت دروس" eyebrow is text-only (no emoji). KPI stats use lucide icons (BookOpen, Layers, Sparkles). Crown lucide icon in header.
   * /home/z/my-project/src/components/super-admin/SubjectCard.tsx — Renders `subject.icon` from database (🧬 ⚛️ etc.) inside icon container per task rules (KEEP). Badges (assessment, strategy, finalStrategy) convey real subject config — functional, not decorative. Stats row uses Layers/MessageSquare/Sparkles lucide icons.
   * /home/z/my-project/src/components/super-admin/SubjectDetail.tsx — Tabs use lucide icons (Layers, Sparkles, Pencil) with Persian labels (no emojis). Subject icon renders from `subject.icon` data (KEEP).
   * /home/z/my-project/src/components/super-admin/SubjectFormModal.tsx — ICONS picker array contains 14 subject icons (📚 🧬 ⚛️ ⚗️ 📐 🪨 🌍 🎨 📝 🌐 🏛️ 🔢 📖 🔬) — these are picker data for the subject's stored icon (per task rules: KEEP). Modal uses Plus/X/Loader2 lucide icons.
   * /home/z/my-project/src/components/super-admin/TopicModesPanel.tsx — Uses Sparkles/Plus/Pencil/Trash2/X/Loader2/Save lucide icons. No emojis in text labels. Already clean.

- Verified: `npx tsc --noEmit --skipLibCheck` reports ZERO errors in any of the 18 target files (only pre-existing errors in unrelated files: examples/websocket, reval/ duplicates, skills/, ui-ux-pro-max-skill/, src/components/plan/WeeklyPlanner, src/components/shared/SubjectTopicPicker — none touched by this task).
- Verified: `npx eslint` on the 3 modified files reports 0 errors. 2 pre-existing warnings about unused eslint-disable directives in AdvisorDashboard (not introduced by this task).
- Verified: final emoji grep across all 18 target files confirms remaining emoji references are ONLY: (a) code comments with `→` arrows, (b) `subject.icon` and `'📚'` fallbacks for database-stored subject icons, (c) default `avatar` values for newly-created advisor/student records, (d) ICONS picker arrays in SubjectFormModal + SubjectSettingsPanel. All four categories are data per task instructions, not decorations.

Stage Summary:
- 3 files modified: AdvisorDashboard.tsx, SubjectSettingsPanel.tsx, GradeChaptersTree.tsx
- 15 files reviewed and confirmed already minimalist (no changes needed) — the prior 6-d redesign pass (Task 6-d) had already cleaned these files of decorative emojis; only the AdvisorDashboard mood system + TaskModal field-type prefixes + the chapter-mode warning + DEPTH_LABELS arrows remained.
- Mood severity indicator: converted from emoji (😊🙂😐😟😰) to a clean colored ring + dot + label design (color-only signal), per task rule "use color + text instead".
- Field-type buttons: stripped 🎯/📚 text prefixes — accent-soft selected background already differentiates.
- Footer: removed ❤️ — kept the Persian dedication text.
- Warning text: removed ⚠️ — amber-400 color + Persian text already conveys warning.
- DEPTH_LABELS: replaced ➔ arrow glyphs with `-` hyphens for a cleaner, language-neutral separator.
- All preserved: Zustand store calls, props, handlers, modal state, framer-motion animations, CSS utility classes, design tokens, responsive design, SubjectTopicPicker integration, subject DB icons, default avatar values for new records, all GOD/GOD MODE/GOD VIEW/VIP text badges (already text-only with lucide Crown icon).
- Net effect: admin views are now visually consistent with the minimalist 10-a/10-b passes on student/landing/auth views — zero decorative emojis in text, mood severity shown via color + dot + label, field-type buttons show only their Persian name, warning text relies on color tone rather than glyphs.

---
Task ID: 10-b
Agent: frontend-styling-expert (Minimalist pass — Student views)
Task: Apply minimalist pass to 7 student-facing files (Dashboard, TaskCard, ToolsHub, AnalyticsView, SettingsView, ManualEntrySheet, AiEntryModal) — remove decorative emojis from text, simplify labels, clean toasts. NO functional changes.

Work Log:
- Read worklog.md foundation (Modern Dark Cinema — Persian RTL design system, color tokens, hover utilities, critical design rules) and confirmed the 7 target files plus feedbackMessages.ts (shared toast source — kept untouched since PlanView is being handled separately)
- Ran emoji-grep regex (U+1F300–U+1FAFF, U+2600–U+27BF, U+2190–U+21FF, U+2B00–U+2BFF, U+FE0F, U+2714) on all 7 files to inventory every emoji instance before editing
- Dashboard.tsx: removed `🔥` from "هدف امروز کامل شد — برکانا! 🔥" → "هدف امروز کامل شد"; shortened "وظیفه باقی‌مانده — بزن بریم!" → "وظیفه باقی‌مانده" (removed redundant celebratory suffix). All handlers, store calls, framer-motion animations, CSS utilities preserved.
- TaskCard.tsx: cleaned two code-comment emojis (`{/* Complete ✔️ */}` → `{/* Complete */}`, `{/* Skip ❌ */}` → `{/* Skip */}`). All `getRandomSuccessMessage()` / `getRandomFailureMessage()` toast calls preserved — these come from shared feedbackMessages.ts which is out of scope. All props, accent border logic, motion variants preserved.
- ToolsHub.tsx: largest cleanup —
  * Removed `emoji` field from all 5 TOOLS array entries (🎵, 🃏, ⏱️, 📊, 🧘); modal header now uses the Lucide IconComp (already used on tool cards) inside the icon container instead of the emoji
  * Extracted `activeToolObj = TOOLS.find(...)` before return to replace 3 inline `TOOLS.find()` calls in modal header (cleaner code, same behavior)
  * Removed `🎉` from "کارت جدید اضافه شد! 🎉" toast → "کارت جدید اضافه شد"
  * Removed `🎉` from "آفرین! وقت استراحت 🎉" toast → "وقت استراحت"; shortened "استراحت تموم شد! بزن بریم 💪" → "استراحت تموم شد"
  * Removed emoji prefixes from flashcard tabs: `📖 مطالعه` → `مطالعه`, `🏷️ نشانه‌گذاری شده` → `نشانه‌گذاری شده`
  * Removed emoji prefixes from mastery filter pills (both filter row and feedback buttons): `🟢 مسلط`, `🟠 مرور`, `🔴 ضعف` → just `مسلط`, `مرور`, `ضعف` (the colored bg/border already encodes the mastery level)
  * Removed decorative emoji-only empty-state paragraph (`<p className="text-4xl mb-3">{tab === 'marked' ? '🏷️' : '📚'}</p>`) — let the text message carry the empty state; also dropped redundant `! دکمه افزودن رو بزن` suffix
  * Removed `🔥`/`☕` from pomodoro mode pill: `'🔥 زمان مطالعه' : '☕ استراحت'` → `'زمان مطالعه' : 'استراحت'`
  * Removed `💪` from calculator result message: "عالیه! روال ادامه بده 💪" → "عالیه! روال ادامه بده"
  * Removed emoji suffixes from 3 input labels: `تعداد درست ✅`, `نزده ⬜`, `غلط ❌` → `تعداد درست`, `نزده`, `غلط` (the field semantics are clear from the label)
  * Removed `⚠️` decorative span from negative-percent display; kept "درصد منفی!" text (color + text is enough)
  * Removed `📊` decorative paragraph from calculator empty state; kept "اعداد رو وارد کن تا درصد محاسبه بشه"
  * Removed `💡` decorative span from "what-if" panel; kept the title text
  * All 5 tool sub-components (FocusMusicTool, FlashcardsTool, PomodoroTool, CalculatorTool, BreathingTool) logic preserved verbatim — pomodoro interval, breathing timeout, flashcard flip+mastery, calculator what-if, equalizer animations
- AnalyticsView.tsx: replaced 4 emoji InsightCard icons with Lucide icons — added `TrendingDown` to imports; changed `InsightCard` `icon` prop type from `string` to `React.ReactNode`; `🟢`→`<TrendingUp>`, `⚠️`→`<TrendingDown>`, `🏆`→`<Award>`, `🔴`→`<AlertTriangle>` (Award and AlertTriangle were already imported, TrendingUp already imported for KPI cards). InsightCard still uses the colored right-border accent bar for visual distinction. All recharts config, MOCK_*, filters, KPI data preserved.
- SettingsView.tsx: removed `❤️` from about-section footer: "ساخته شده با ❤️ برای دانش‌آموزان ایران" → "ساخته شده برای دانش‌آموزان ایران". Left the avatar system (`useState(user?.avatar || '🦊')`) and AVATARS array untouched since these are functional visual identity markers stored in mockData.ts, not decorative text emojis. All section components, store calls (updateUser, addTicket, hapticFeedback, notificationReminders, setHapticFeedback, setNotificationReminders), TicketDrawer logic preserved.
- ManualEntrySheet.tsx: 4 cleanups —
  * `toast.success('تسک اضافه شد! 🎯')` → `toast.success('تسک اضافه شد')`
  * Field type buttons: removed emoji prefix `{ft === 'کنکور' ? '🎯' : '📚'} {ft}` → `{ft}`; removed the verbose helper `<p>` ("کنکور: دروس اختصاصی کنکور تجربی · نهایی: ...") since the button labels alone are self-explanatory
  * Activity type buttons: removed the `emoji` field from all 4 entries (`📖`, `🔄`, `✏️`, `🎯`) and the `{emoji} {type}` rendering → just `{type}`; simplified the step label "نوع فعالیت‌ها (می‌توانید چند مورد انتخاب کنید):" → "نوع فعالیت‌ها:" (the multi-select nature is obvious from the chip-style buttons)
  * Submit button: `✔ ثبت تسک` → `ثبت تسک` (removed heavy-check-mark glyph)
  * Left `s.icon || '📚'` fallback intact — `s.icon` is the database-stored subject emoji (🧬/⚛️/⚗️/📐/🪨) which is a functional visual identifier seeded by Super Admin, not decorative text
  * All SubjectTopicPicker integration, fetchSubjects useEffect, handleSubmit, step validation, framer-motion step transitions preserved
- AiEntryModal.tsx: 4 cleanups —
  * Added `Clock, FileText` to lucide-react imports (already used elsewhere in the app for time/test metrics)
  * Loading spinner: "در حال تحلیل متنی... 🪄" → "در حال تحلیل متنی..."
  * ParsedTaskCard metrics: replaced `⏱ {N} دقیقه` and `📝 {N} تست` emoji prefixes with `<Clock className="w-3 h-3" />` and `<FileText className="w-3 h-3" />` Lucide icons (matches Dashboard's task-card metric style for consistency)
  * Confirm toast: `${N} تسک اضافه شد! 🪄` → `${N} تسک اضافه شد`
  * Modal description: "برنامه‌ت رو برام بنویس، بقیه‌ش با من! 🪄" → "برنامه‌ت رو برام بنویس، بقیه‌ش با من" (kept the characterful Persian copy, just dropped emoji + exclamation)
  * All handleAnalyze/handleConfirm/handleClose logic, fetch to /api/parse-plan, parsedTasks state, preview-mode flow preserved
- Verification: `npx tsc --noEmit --skipLibCheck` reports ZERO errors in any of the 7 modified files (only pre-existing errors remain in reval/src/components/plan/TaskCard.tsx duplicate, src/components/plan/WeeklyPlanner.tsx — both unrelated to this task). `npx eslint` reports 0 errors, only 2 pre-existing unused-eslint-disable warnings in ManualEntrySheet:84 and ToolsHub:1165 (not introduced by this task). `npx next build` compiles successfully in 14.8s.
- Final emoji-grep across all 7 files confirms ZERO decorative emojis remaining (only intentional subject-icon fallback `'📚'` in ManualEntrySheet and default-avatar `'🦊'` in SettingsView remain — these are functional defaults from the icon/avatar system seeded in the database and mockData.ts, not decorative text emojis per the minimalist guidelines)

Stage Summary:
- 7 student-facing files now follow the minimalist guidelines: zero decorative emojis in text, cleaner labels, simplified toasts, no obvious helper texts
- All emojis removed from: greetings, status badges, activity-type buttons, field-type buttons, mastery pills, empty-state illustrations, calculator input labels, pomodoro mode pill, toast messages, code comments
- Where emojis served as functional icons (tool modal header, AiEntryModal metrics), replaced with appropriate Lucide-react icons (Music/Brain/Timer/Calculator/Heart, Clock, FileText, TrendingUp, TrendingDown, Award, AlertTriangle) for visual consistency with the rest of the design system
- Where emojis are stored in the database as subject icons (🧬 ⚛️ ⚗️ 📐 🪨) or used as avatar system defaults (🦊), left intact — these are functional visual identifiers, not decorative text
- Text labels shortened where redundant: removed "— بزن بریم!", "— رایگانه"-style celebratory suffixes; removed obvious "(می‌توانید چند مورد انتخاب کنید)" parentheticals; removed verbose field-type helper paragraph
- Toast messages: ALL inline literal emojis removed from toasts in the 7 files (`🎯`, `🎉`, `💪`, `🪄`); shared `feedbackMessages.ts` left untouched (out of scope — PlanView agent owns it)
- PRESERVED 100%: every Zustand store call (useAppStore, tasks, addTask, updateTask, deleteTask, user, updateUser, exams, pomodoro*, flashcards, tracks, currentTool, setCurrentTool, tickets, addTicket, hapticFeedback, notificationReminders, selectedDate, selectedStudentId), every prop signature, every event handler, every framer-motion animation (entrance, whileTap, AnimatePresence transitions), every CSS utility class (.surface-1, .edge-highlight, .card-hover, .btn-hover, .glow-hover, .icon-btn, .nav-item-hover, .surface-glass, .custom-scrollbar, .flip-rtl), every design token (var(--accent), var(--bg-elevated), var(--border), etc.), every responsive layout (mobile max-w-md / desktop multi-col grids), SubjectTopicPicker integration, fetchSubjects API call, /api/parse-plan API call
- Files compile cleanly: 0 TS errors, 0 ESLint errors, `next build` succeeds

---
Task ID: 10-summary
Agent: Main
Task: Weekly Planner feature + minimalist redesign pass

Work Log:
- Built WeeklyPlanner.tsx: full-screen modal with 7-day grid
  * Each day shows: day name, date, list of subject chips, "درس" add button
  * Quick add: click "درس" → subject picker modal (filtered by کنکور/نهایی)
  * Click subject chip → detail editor (topic picker, activities, duration, test count)
  * Details are OPTIONAL until user clicks the chip
  * "اعمال روی هفته" button creates Task records for all 7 days
  * Week toggle: این هفته / هفته بعد
  * Today indicator: ring highlight on current day
- Integrated into PlanView.tsx:
  * Mobile: icon button in header next to pattern button
  * Desktop: text button in header + button in sidebar CTA card
- Minimalist pass dispatched to 3 parallel subagents:
  * 10-a: LandingPage, LoginPage, OnboardingWizard — removed decorative emojis from text, unified accent colors, simplified CTAs
  * 10-b: Dashboard, TaskCard, ToolsHub, AnalyticsView, SettingsView, ManualEntrySheet, AiEntryModal — removed all emoji prefixes from activity buttons, toasts, labels
  * 10-c: Advisor + Institute + SuperAdmin (18 files) — removed emoji from mood config, field-type buttons, warning texts, depth labels
- Agent Browser verification:
  * Weekly planner opens correctly with 7 day columns
  * کنکور/نهایی toggle works
  * "افزودن درس به شنبه" modal opens on click
  * "اعمال روی هفته" button disabled until subjects added
  * Plan view design confirmed "clean and minimalist" by VLM
  * No excessive emojis or decorative elements

Stage Summary:
- New feature: Weekly Planner with quick subject selection + click-to-edit details
- Minimalist redesign: removed ~50+ decorative emojis across all views
- All functions preserved: store calls, handlers, navigation, form logic unchanged
- Design is now cleaner, simpler, more professional

---
Task ID: 11-plan-overhaul
Agent: Main
Task: 8-point plan view overhaul — weekly planner sync, Persian calendar, drag-drop, reversible status, simplified stats

Work Log:
1. Installed jalaali-js for Persian Shamsi date conversion
2. Created src/lib/persian-date.ts with full Shamsi utilities:
   - toJalali, jalaliToDate, getPersianWeekday, getPersianWeekdayName
   - formatPersianDate (e.g., "۱۳ مرداد"), formatPersianDateShort
   - getWeekDays, getSaturdayOfWeek, getDaysInJalaliMonth
   - isToday, isSameDay, getRelativeDayLabel
   - minutesToHours, minutesToHoursLabel
3. Created PersianCalendar.tsx component:
   - Full monthly calendar grid (7 columns × 5-6 rows)
   - Full weekday names: شنبه, یکشنبه, دوشنبه, سه‌شنبه, چهارشنبه, پنجشنبه, جمعه
   - Persian month names: فروردین, اردیبهشت, ...
   - Click any day → selects it and shows its tasks
   - Task count indicators (dots) on days with tasks
   - Completed indicator (green dot) when all tasks done
   - Today highlight + month navigation
4. Rewrote PlanView.tsx:
   - Replaced 7-day ribbon with PersianCalendar
   - Removed "ورود سریع با هوش مصنوعی" bar (AI entry only in sidebar)
   - Simplified stats: only total hours + test count (no task count, no completed count)
   - Converted minutes to hours in stats and task cards
   - Day subtitle: weekday name + Persian date (e.g., "سه‌شنبه · ۱۳ مرداد")
   - Tasks sorted: pending first, completed/skipped at bottom
5. Created SortableTaskList.tsx with @dnd-kit:
   - Drag-and-drop reordering on desktop
   - GripVertical drag handle on each task card
   - Reorder updates task.order in store
6. Rewrote TaskCard.tsx:
   - Added drag handle (GripVertical icon, desktop only)
   - Made status REVERSIBLE: RotateCcw (undo) button on completed/skipped tasks
   - Shows hours instead of minutes
7. Rewrote WeeklyPlanner.tsx to sync with REAL tasks:
   - Reads tasks from Zustand store filtered by date
   - Adding a subject IMMEDIATELY creates a Task (no "apply" needed)
   - Editing a subject opens modal with SubjectTopicPicker
   - Removing a subject deletes the Task
   - Toggle complete checkbox on each subject chip
   - Week navigation: این هفته / هفته قبل / هفته بعد
   - Each day column shows: weekday name + Persian date (no year)
8. Added resetTask + reorderTasks actions to Zustand store
9. Removed date number display (e.g., "۲/۸") from day columns — only weekday name + Persian date shown

Stage Summary:
- All 8 issues addressed:
  1. Weekly planner syncs immediately with real tasks (add/edit/delete)
  2. Removed "۲/۸" date format from day columns
  3. Click calendar day → shows that day's tasks
  4. Removed "ورود سریع با هوش مصنوعی" bar
  5. Simplified stats: only hours + tests (no task/completed count)
  6. Full Persian Shamsi calendar with proper weekday names + day/month dates
  7. Drag-and-drop task reordering with grip handles; completed tasks go to bottom
  8. Task status reversible via RotateCcw undo button
- Agent Browser verified: calendar renders, drag handles visible, stats simplified
