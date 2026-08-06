# Task 4-a: Notification Center Feature

## Agent: Main

## Summary
Implemented a complete Notification Center feature for the Reval Persian RTL LMS project.

## What was done
1. **Types** (`src/lib/types.ts`): Added `NotificationType` (6 variants) and `Notification` interface
2. **Store** (`src/lib/store.ts`): 
   - Added localStorage persistence for read notification IDs (`reval:notifications:v1`)
   - Implemented `computeNotifications()` that builds notifications from existing data (exams, tasks, streak, flashcards, weekly goal)
   - Added store fields: `notifications`, `unreadNotificationCount`
   - Added store actions: `markNotificationRead`, `markAllNotificationsRead`, `refreshNotifications`
   - Auto-init on client render via queueMicrotask + periodic 60s refresh
3. **Component** (`src/components/shared/NotificationCenter.tsx`):
   - Bell icon with badge, framer-motion dropdown
   - 6 notification types with proper Persian text, icons, and color coding
   - Empty state, mark-all-as-read, click-outside/escape close
4. **Integration**: Desktop sidebar + mobile dashboard header

## Notification Types
- Upcoming Exam (≤3 days): red/amber
- Task Reminder (incomplete today): accent
- Streak Warning (streak > 2, no tasks today): danger
- Streak Milestone (multiples of 7): gold
- Weekly Goal (< 50%): warning
- Flashcard Review (due cards): accent

## Verification
- `bunx tsc --noEmit` — zero errors
- Dev server compiles successfully
