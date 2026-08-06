'use client';

// =================================================================
// SM-2 Spaced Repetition Algorithm
// ---------------------------------
// Implements the SuperMemo 2 algorithm for scheduling flashcard
// reviews. Each card carries its own scheduling state (interval,
// repetition count, ease factor, due date). The student's qualitative
// self-assessment (مسلط / مرور / ضعف) is mapped to a 0-5 quality score
// that drives the SM-2 update.
//
// Quality mapping (Anki/SuperMemo convention):
//   5 = perfect, immediate recall       → "مسلط"
//   3 = correct, but with effort/hesitation → "مرور"
//   1 = incorrect, but felt familiar    → "ضعف"
//   (0, 2, 4 are intermediate values not exposed in the UI)
//
// Update rules (per SM-2):
//   • If quality ≥ 3 (correct):
//       - If repetition == 0: interval = 1 day (first review)
//       - If repetition == 1: interval = 6 days
//       - Else:               interval = round(prevInterval × easeFactor)
//       - repetition += 1
//   • If quality < 3 (forgotten):
//       - repetition = 0 (start over)
//       - interval = 1 day (show again tomorrow)
//   • Ease factor update:
//       EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
//       EF' is clamped to a minimum of 1.3
//
// Reference: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
// =================================================================

import type { Flashcard } from './types';

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

/** Default ease factor for new cards (SM-2 standard). */
export const DEFAULT_EASE_FACTOR = 2.5;

/** Minimum ease factor (SM-2 standard). Cards never get harder than this. */
export const MIN_EASE_FACTOR = 1.3;

/** Maps the 3-button mastery feedback to an SM-2 quality score. */
export function masteryToQuality(
  mastery: Flashcard['mastery']
): ReviewQuality {
  switch (mastery) {
    case 'mastered':
      return 5; // perfect recall
    case 'review':
      return 3; // correct with effort
    case 'weak':
      return 1; // forgotten
    default:
      return 3;
  }
}

/**
 * Computes the next SM-2 scheduling state for a card after a review.
 * Returns a partial Flashcard patch (interval, repetition, easeFactor,
 * dueDate, lastReviewed, reviewCount, lapseCount, mastery) that the
 * caller can merge into the card.
 */
export function scheduleNextReview(
  card: Flashcard,
  quality: ReviewQuality,
  now: Date = new Date()
): Partial<Flashcard> {
  const prevInterval = card.interval ?? 0;
  const prevRepetition = card.repetition ?? 0;
  const prevEase = card.easeFactor ?? DEFAULT_EASE_FACTOR;
  const prevReviewCount = card.reviewCount ?? 0;
  const prevLapseCount = card.lapseCount ?? 0;

  // ----- Ease factor update -----
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  // The ease factor only changes for quality 3-5; for quality < 3
  // it stays the same (a forgotten card doesn't make future reviews
  // harder — that would be punishing).
  let newEase = prevEase;
  if (quality >= 3) {
    const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    newEase = Math.max(MIN_EASE_FACTOR, prevEase + delta);
  }

  // ----- Interval & repetition update -----
  let newInterval: number;
  let newRepetition: number;
  let newLapseCount = prevLapseCount;

  if (quality >= 3) {
    // Successful recall
    if (prevRepetition === 0) {
      newInterval = 1; // first successful review → 1 day
    } else if (prevRepetition === 1) {
      newInterval = 6; // second successful review → 6 days
    } else {
      // Subsequent reviews: interval × ease factor
      newInterval = Math.max(1, Math.round(prevInterval * newEase));
    }
    newRepetition = prevRepetition + 1;
  } else {
    // Forgotten — reset schedule, show again tomorrow
    newInterval = 1;
    newRepetition = 0;
    newLapseCount = prevLapseCount + 1;
  }

  // ----- Mastery translation (for UI display) -----
  // Mastery is derived from the new schedule state so the existing
  // filter UI ("مسلط / مرور / ضعف") keeps working without changes.
  let newMastery: Flashcard['mastery'];
  if (quality >= 5 && newInterval >= 14) {
    newMastery = 'mastered';
  } else if (quality < 3) {
    newMastery = 'weak';
  } else {
    newMastery = 'review';
  }

  // ----- Due date -----
  const due = new Date(now);
  // Set to start of next day so the card is due at midnight.
  due.setHours(0, 0, 0, 0);
  due.setDate(due.getDate() + newInterval);

  return {
    interval: newInterval,
    repetition: newRepetition,
    easeFactor: newEase,
    dueDate: due.toISOString(),
    lastReviewed: now.toISOString(),
    reviewCount: prevReviewCount + 1,
    lapseCount: newLapseCount,
    mastery: newMastery,
  };
}

/**
 * Initializes SM-2 fields for a brand-new card that has never been
 * reviewed. The card is due immediately (interval = 0, dueDate = now).
 */
export function initSRSFields(): Partial<Flashcard> {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return {
    interval: 0,
    repetition: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    dueDate: now.toISOString(),
    lastReviewed: undefined,
    reviewCount: 0,
    lapseCount: 0,
  };
}

/**
 * Returns true if a card is due for review (dueDate <= today).
 * Cards with no dueDate are considered due (never reviewed).
 */
export function isCardDue(card: Flashcard, now: Date = new Date()): boolean {
  if (!card.dueDate) return true;
  const due = new Date(card.dueDate);
  // Compare date-only (ignore time) so a card due "today" is always
  // considered due, even if the time-of-day hasn't passed yet.
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  return due.getTime() <= todayStart.getTime();
}

/**
 * Returns the number of days until the card is due.
 * Negative/zero means the card is due now (overdue).
 */
export function daysUntilDue(card: Flashcard, now: Date = new Date()): number {
  if (!card.dueDate) return 0;
  const due = new Date(card.dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const ms = due.getTime() - today.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * Human-readable Persian label for the next-review interval.
 * Examples: "امروز" (today), "فردا" (tomorrow), "۳ روز دیگر" (in 3 days),
 * "۲ هفته دیگر" (in 2 weeks), "۱ ماه دیگر" (in 1 month).
 */
export function formatNextReview(card: Flashcard, now: Date = new Date()): string {
  const days = daysUntilDue(card, now);
  const persian = (n: number) =>
    String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

  if (days <= 0) return 'امروز';
  if (days === 1) return 'فردا';
  if (days < 7) return `${persian(days)} روز دیگر`;
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return `${persian(weeks)} هفته دیگر`;
  }
  const months = Math.round(days / 30);
  return `${persian(months)} ماه دیگر`;
}

/**
 * Computes a 0-100 "retention strength" score for a card based on
 * its SM-2 state. Used for the per-card progress bar.
 *
 * Factors:
 *   - repetition count (more reviews → stronger)
 *   - interval (longer interval → stronger)
 *   - ease factor (higher ease → stronger)
 *   - lapse penalty (each lapse reduces strength)
 */
export function retentionStrength(card: Flashcard): number {
  const rep = card.repetition ?? 0;
  const interval = card.interval ?? 0;
  const ease = card.easeFactor ?? DEFAULT_EASE_FACTOR;
  const lapses = card.lapseCount ?? 0;

  // Base: grows with repetition (logarithmic — diminishing returns).
  const repScore = Math.min(40, Math.log2(rep + 1) * 18);
  // Interval: 0d=0, 1d=10, 6d=25, 30d=40, 90d=50 (caps at 50).
  const intervalScore = Math.min(50, Math.log2(interval + 1) * 12);
  // Ease bonus: 1.3 → 0, 2.5 → 10, 3.0 → 14 (caps at 15).
  const easeScore = Math.min(15, Math.max(0, (ease - 1.3) * 12));
  // Lapse penalty: -8 per lapse (caps at -32).
  const lapsePenalty = Math.min(32, lapses * 8);

  return Math.max(
    0,
    Math.min(100, Math.round(repScore + intervalScore + easeScore - lapsePenalty))
  );
}
