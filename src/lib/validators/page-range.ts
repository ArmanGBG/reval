// ===== Page Range & Chapter/Topic Validation =====
// Central validation for page ranges, chapter/topic numbers, and overlap
// checks. Used by all chapters/topics API routes so the DB is the source of
// truth for data integrity.

export interface PageRangeFields {
  pageStart: number | null | undefined;
  pageEnd: number | null | undefined;
  isLastPage: boolean | undefined;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ===== Field-level validation =====

/**
 * Validate chapterNo / topicNo:
 *   - must be an integer (no floats)
 *   - must be >= 1
 */
export function validateSequenceNumber(
  value: unknown,
  field: string,
): ValidationError | null {
  if (value === undefined || value === null) return null; // optional in PATCH
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { field, message: `${field} باید عدد باشد` };
  }
  if (!Number.isInteger(value)) {
    return { field, message: `${field} باید عدد صحیح باشد` };
  }
  if (value < 1) {
    return { field, message: `${field} باید حداقل ۱ باشد` };
  }
  return null;
}

/**
 * Validate page range fields (pageStart, pageEnd, isLastPage).
 * Rules:
 *   - pageStart: integer >= 1 (or null/undefined for "no page info")
 *   - pageEnd: integer >= pageStart (or null if isLastPage=true)
 *   - isLastPage=true => pageEnd must be null/undefined (cleared)
 *   - isLastPage=true requires pageStart to be set
 *   - pageEnd without pageStart is invalid
 */
export function validatePageRange(
  fields: PageRangeFields,
): ValidationError | null {
  const { pageStart, pageEnd, isLastPage } = fields;

  // pageStart validation (if provided)
  if (pageStart !== undefined && pageStart !== null) {
    if (typeof pageStart !== 'number' || !Number.isFinite(pageStart)) {
      return { field: 'pageStart', message: 'صفحه شروع باید عدد باشد' };
    }
    if (!Number.isInteger(pageStart)) {
      return { field: 'pageStart', message: 'صفحه شروع باید عدد صحیح باشد' };
    }
    if (pageStart < 1) {
      return { field: 'pageStart', message: 'صفحه شروع باید حداقل ۱ باشد' };
    }
  }

  // pageEnd validation (if provided)
  if (pageEnd !== undefined && pageEnd !== null) {
    if (typeof pageEnd !== 'number' || !Number.isFinite(pageEnd)) {
      return { field: 'pageEnd', message: 'صفحه پایان باید عدد باشد' };
    }
    if (!Number.isInteger(pageEnd)) {
      return { field: 'pageEnd', message: 'صفحه پایان باید عدد صحیح باشد' };
    }
    if (pageEnd < 1) {
      return { field: 'pageEnd', message: 'صفحه پایان باید حداقل ۱ باشد' };
    }
    // pageEnd requires pageStart
    if (pageStart === null || pageStart === undefined) {
      return {
        field: 'pageEnd',
        message: 'صفحه پایان بدون صفحه شروع مجاز نیست',
      };
    }
    // pageEnd >= pageStart
    if (pageEnd < pageStart) {
      return {
        field: 'pageEnd',
        message: 'صفحه پایان نمی‌تواند کمتر از صفحه شروع باشد',
      };
    }
  }

  // isLastPage validation
  if (isLastPage === true) {
    // isLastPage requires pageStart
    if (pageStart === null || pageStart === undefined) {
      return {
        field: 'isLastPage',
        message: 'گزینه «تا پایان کتاب» نیاز به صفحه شروع دارد',
      };
    }
    // isLastPage=true => pageEnd should be null (we'll clear it in the route)
    // (this is a warning, not a hard error — the route will clear pageEnd)
  }

  return null;
}

/**
 * Normalize page range fields: if isLastPage=true, clear pageEnd.
 * Returns a new object with the corrected fields.
 */
export function normalizePageRange(fields: PageRangeFields): {
  pageStart: number | null;
  pageEnd: number | null;
  isLastPage: boolean;
} {
  const isLast = fields.isLastPage === true;
  return {
    pageStart:
      typeof fields.pageStart === 'number' && Number.isFinite(fields.pageStart)
        ? fields.pageStart
        : null,
    pageEnd: isLast
      ? null
      : typeof fields.pageEnd === 'number' && Number.isFinite(fields.pageEnd)
        ? fields.pageEnd
        : null,
    isLastPage: isLast,
  };
}

// ===== Overlap validation =====

export interface RangeEntry {
  id: string;
  pageStart: number | null;
  pageEnd: number | null;
  isLastPage: boolean;
}

/**
 * Check if a candidate page range overlaps with any existing range.
 *
 * A range is "open-ended" if isLastPage=true (extends to infinity).
 * Two ranges overlap if their [pageStart, pageEnd] intervals intersect.
 *
 * @param candidate - the new/updated range being validated
 * @param existing - all other active ranges in the same scope (gradeSubject
 *                   for chapters, chapter for topics)
 * @param excludeId - when updating, exclude the entry being updated from
 *                    the existing list
 */
export function findOverlap(
  candidate: RangeEntry,
  existing: RangeEntry[],
  excludeId?: string,
): RangeEntry | null {
  if (candidate.pageStart === null) return null; // no range to check

  const others = existing.filter((e) => e.id !== excludeId && e.pageStart !== null);

  for (const other of others) {
    if (rangesOverlap(candidate, other)) {
      return other;
    }
  }
  return null;
}

function rangesOverlap(a: RangeEntry, b: RangeEntry): boolean {
  if (a.pageStart === null || b.pageStart === null) return false;

  // a's end (infinity if isLastPage, else pageEnd or pageStart if pageEnd null)
  const aEnd = a.isLastPage ? Infinity : (a.pageEnd ?? a.pageStart);
  const bEnd = b.isLastPage ? Infinity : (b.pageEnd ?? b.pageStart);

  // a's start must be > b's end OR b's start must be > a's end for NO overlap
  // Overlap if: a.start <= b.end AND b.start <= a.end
  return a.pageStart <= bEnd && b.pageStart <= aEnd;
}

/**
 * Validate that a topic's page range is within its parent chapter's range.
 *
 * Rules:
 *   - If chapter has no pageStart (null), topics can have any range (or none)
 *   - If topic has no pageStart (null), it's fine (no range constraint)
 *   - Otherwise: topic.pageStart >= chapter.pageStart
 *   - And: topic.pageEnd <= chapter.pageEnd (or chapter.isLastPage → topic can extend)
 *   - If topic.isLastPage, only topic.pageStart >= chapter.pageStart matters
 */
export function validateTopicWithinChapter(
  topic: PageRangeFields,
  chapter: RangeEntry,
): ValidationError | null {
  if (topic.pageStart === undefined || topic.pageStart === null) return null;
  if (chapter.pageStart === null) return null; // chapter has no range

  // Topic start must be >= chapter start
  if (topic.pageStart < chapter.pageStart) {
    return {
      field: 'pageStart',
      message: `شروع گفتار (${topic.pageStart}) نمی‌تواند قبل از شروع فصل (${chapter.pageStart}) باشد`,
    };
  }

  // If topic is not last page, its end must be <= chapter end
  if (topic.isLastPage !== true) {
    const chapterEnd = chapter.isLastPage ? Infinity : chapter.pageEnd;
    if (chapterEnd !== null && chapterEnd !== Infinity) {
      const topicEnd = topic.pageEnd ?? topic.pageStart;
      if (topicEnd > chapterEnd) {
        return {
          field: 'pageEnd',
          message: `پایان گفتار (${topicEnd}) نمی‌تواند بعد از پایان فصل (${chapterEnd}) باشد`,
        };
      }
    }
  }

  return null;
}

/**
 * Check if only the last entry (by chapterNo/topicNo) in a set may have
 * isLastPage=true.
 */
export function validateIsLastPageOnlyLast(
  candidate: RangeEntry,
  existing: RangeEntry[],
  excludeId?: string,
): ValidationError | null {
  if (!candidate.isLastPage) return null;

  const others = existing
    .filter((e) => e.id !== excludeId)
    .filter((e) => e.isLastPage);

  // If any OTHER entry has isLastPage=true, that's a conflict (only one allowed)
  if (others.length > 0) {
    return {
      field: 'isLastPage',
      message: 'فقط آخرین فصل/گفتار می‌تواند «تا پایان کتاب» باشد',
    };
  }

  // Also: isLastPage should only be on the highest-numbered entry.
  // We check this by seeing if the candidate is NOT the last by sequence.
  // (The route should pass entries sorted by chapterNo/topicNo.)
  // For simplicity, we let the route enforce the "last only" rule and
  // this function just checks the "only one" rule.

  return null;
}
