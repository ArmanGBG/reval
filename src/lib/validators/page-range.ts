// ===== Page Range & Chapter/Topic Validation =====
// Central validation for page ranges, chapter/topic numbers, and overlap
// checks. Used by all chapters/topics API routes so the DB is the source of
// truth for data integrity.

export interface PageRangeFields {
  pageStart: number | null | undefined;
  pageEnd: number | null | undefined;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ===== Field-level validation =====

/**
 * Validate chapterNo / topicNo:
 *   - must be an integer (no floats)
 *   - must be >= the configured minimum (0 for book prefaces, 1 otherwise)
 */
export function validateSequenceNumber(
  value: unknown,
  field: string,
  minimum = 1,
): ValidationError | null {
  if (value === undefined || value === null) return null; // optional in PATCH
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { field, message: `${field} باید عدد باشد` };
  }
  if (!Number.isInteger(value)) {
    return { field, message: `${field} باید عدد صحیح باشد` };
  }
  if (value < minimum) {
    return { field, message: `${field} باید حداقل ${minimum === 0 ? '۰' : '۱'} باشد` };
  }
  return null;
}

/**
 * Validate a bounded page range. Both values may be empty for an unmapped row.
 * Rules:
 *   - pageStart/pageEnd: positive integers when mapped
 *   - pageStart/pageEnd must either both be set or both be empty
 */
export function validatePageRange(
  fields: PageRangeFields,
): ValidationError | null {
  const { pageStart, pageEnd } = fields;

  const hasStart = pageStart !== undefined && pageStart !== null;
  const hasEnd = pageEnd !== undefined && pageEnd !== null;
  if (hasStart !== hasEnd) {
    return { field: hasStart ? 'pageEnd' : 'pageStart', message: 'صفحه شروع و پایان باید با هم وارد شوند' };
  }

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
    // pageEnd >= pageStart
    if (pageStart !== null && pageStart !== undefined && pageEnd < pageStart) {
      return {
        field: 'pageEnd',
        message: 'صفحه پایان نمی‌تواند کمتر از صفحه شروع باشد',
      };
    }
  }

  return null;
}

/**
 * Normalize page range fields.
 */
export function normalizePageRange(fields: PageRangeFields): {
  pageStart: number | null;
  pageEnd: number | null;
} {
  return {
    pageStart:
      typeof fields.pageStart === 'number' && Number.isFinite(fields.pageStart)
        ? fields.pageStart
        : null,
    pageEnd: typeof fields.pageEnd === 'number' && Number.isFinite(fields.pageEnd)
        ? fields.pageEnd
        : null,
  };
}

// ===== Overlap validation =====

export interface RangeEntry {
  id: string;
  pageStart: number | null;
  pageEnd: number | null;
}

/**
 * Check if a candidate page range overlaps with any existing range.
 *
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
  if (candidate.pageStart === null || candidate.pageEnd === null) return null;

  const others = existing.filter(
    (entry) => entry.id !== excludeId && entry.pageStart !== null && entry.pageEnd !== null,
  );

  for (const other of others) {
    if (rangesOverlap(candidate, other)) {
      return other;
    }
  }
  return null;
}

function rangesOverlap(a: RangeEntry, b: RangeEntry): boolean {
  if (a.pageStart === null || b.pageStart === null) return false;

  if (a.pageEnd === null || b.pageEnd === null) return false;
  const aEnd = a.pageEnd;
  const bEnd = b.pageEnd;

  // a's start must be > b's end OR b's start must be > a's end for NO overlap
  // Overlap if: a.start <= b.end AND b.start <= a.end
  return a.pageStart <= bEnd && b.pageStart <= aEnd;
}

/**
 * Validate that a topic's page range is within its parent chapter's range.
 *
 * Rules:
 *   - An unmapped topic has no containment constraint
 *   - A mapped topic requires a mapped chapter
 *   - Otherwise: topic.pageStart >= chapter.pageStart
 *   - And: topic.pageEnd <= chapter.pageEnd
 */
export function validateTopicWithinChapter(
  topic: PageRangeFields,
  chapter: RangeEntry,
): ValidationError | null {
  if (topic.pageStart === undefined || topic.pageStart === null || topic.pageEnd == null) {
    return null;
  }
  if (chapter.pageStart === null || chapter.pageEnd === null) {
    return {
      field: 'pageStart',
      message: 'برای ثبت بازه گفتار، ابتدا بازه صفحات فصل را وارد کنید',
    };
  }

  // Topic start must be >= chapter start
  if (topic.pageStart < chapter.pageStart) {
    return {
      field: 'pageStart',
      message: `شروع گفتار (${topic.pageStart}) نمی‌تواند قبل از شروع فصل (${chapter.pageStart}) باشد`,
    };
  }

  if (topic.pageEnd > chapter.pageEnd) {
    return {
      field: 'pageEnd',
      message: `پایان گفتار (${topic.pageEnd}) نمی‌تواند بعد از پایان فصل (${chapter.pageEnd}) باشد`,
    };
  }

  return null;
}
