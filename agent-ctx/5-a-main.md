# Task 5-a: Study Heatmap + Styling Polish

## Agent: Main
## Status: Completed

## Summary
Implemented two features for the Reval Persian RTL LMS:

### Feature 1: Study Activity Heatmap
- Created `src/components/analytics/StudyHeatmap.tsx` — GitHub-style contribution graph
- 7 rows (Sat-Fri) × ~13 columns (weeks), colored by study intensity
- 5 intensity levels from `var(--bg-elevated)` (no study) to `var(--accent)` (120+ min)
- Data computed from store's `tasks` array (sum of `actualTimeMinutes` for completed tasks)
- Persian month labels at top, day labels (ش ی د س چ پ ج) on right
- Tooltips showing date + study time on hover
- Responsive: 2 months on mobile, 3 on desktop
- Header "نقشه مطالعه" with Calendar icon + `float-subtle` animation
- Wrapped in card with `card-hover` + `edge-highlight`
- Integrated into AnalyticsView.tsx above WeeklyGoalCard in both views

### Feature 2: Styling Polish — Animated CSS Effects
- `.gradient-border` — animated gradient border pseudo-element (accent→gold→accent), opacity on hover
- `.shimmer` — updated to pseudo-element overlay approach (::after with translateX)
- `.pulse-glow` — subtle pulse glow using `var(--accent-glow)`, 2.5s infinite
- `.float-subtle` — gentle floating animation (translateY -4px), 3s infinite
- Applied `.gradient-border` to WeeklyReviewCard outer container
- Applied `.pulse-glow` conditionally to streak card in Dashboard when `streakDays > 0`
- Applied `.shimmer` to AnalyticsView loading skeleton wrapper

## Files Modified
- `src/components/analytics/StudyHeatmap.tsx` (NEW)
- `src/components/analytics/AnalyticsView.tsx`
- `src/app/globals.css`
- `src/components/dashboard/WeeklyReviewCard.tsx`
- `src/components/dashboard/Dashboard.tsx`

## Verification
- TypeScript: `bunx tsc --noEmit` — no errors in project source
- ESLint: `bun run lint` — clean
- Dev server: compiles and serves successfully
